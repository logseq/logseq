goog.provide('cljs.core.async');
goog.scope(function(){
  cljs.core.async.goog$module$goog$array = goog.module.get('goog.array');
});

/**
* @constructor
 * @implements {cljs.core.async.impl.protocols.Handler}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
cljs.core.async.t_cljs$core$async37003 = (function (f,blockable,meta37004){
this.f = f;
this.blockable = blockable;
this.meta37004 = meta37004;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async37003.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_37005,meta37004__$1){
var self__ = this;
var _37005__$1 = this;
return (new cljs.core.async.t_cljs$core$async37003(self__.f,self__.blockable,meta37004__$1));
}));

(cljs.core.async.t_cljs$core$async37003.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_37005){
var self__ = this;
var _37005__$1 = this;
return self__.meta37004;
}));

(cljs.core.async.t_cljs$core$async37003.prototype.cljs$core$async$impl$protocols$Handler$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async37003.prototype.cljs$core$async$impl$protocols$Handler$active_QMARK_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return true;
}));

(cljs.core.async.t_cljs$core$async37003.prototype.cljs$core$async$impl$protocols$Handler$blockable_QMARK_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return self__.blockable;
}));

(cljs.core.async.t_cljs$core$async37003.prototype.cljs$core$async$impl$protocols$Handler$commit$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return self__.f;
}));

(cljs.core.async.t_cljs$core$async37003.getBasis = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"f","f",43394975,null),new cljs.core.Symbol(null,"blockable","blockable",-28395259,null),new cljs.core.Symbol(null,"meta37004","meta37004",-2054152065,null)], null);
}));

(cljs.core.async.t_cljs$core$async37003.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async37003.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async37003");

(cljs.core.async.t_cljs$core$async37003.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async37003");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async37003.
 */
cljs.core.async.__GT_t_cljs$core$async37003 = (function cljs$core$async$__GT_t_cljs$core$async37003(f,blockable,meta37004){
return (new cljs.core.async.t_cljs$core$async37003(f,blockable,meta37004));
});


cljs.core.async.fn_handler = (function cljs$core$async$fn_handler(var_args){
var G__37001 = arguments.length;
switch (G__37001) {
case 1:
return cljs.core.async.fn_handler.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljs.core.async.fn_handler.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.fn_handler.cljs$core$IFn$_invoke$arity$1 = (function (f){
return cljs.core.async.fn_handler.cljs$core$IFn$_invoke$arity$2(f,true);
}));

(cljs.core.async.fn_handler.cljs$core$IFn$_invoke$arity$2 = (function (f,blockable){
return (new cljs.core.async.t_cljs$core$async37003(f,blockable,cljs.core.PersistentArrayMap.EMPTY));
}));

(cljs.core.async.fn_handler.cljs$lang$maxFixedArity = 2);

/**
 * Returns a fixed buffer of size n. When full, puts will block/park.
 */
cljs.core.async.buffer = (function cljs$core$async$buffer(n){
return cljs.core.async.impl.buffers.fixed_buffer(n);
});
/**
 * Returns a buffer of size n. When full, puts will complete but
 *   val will be dropped (no transfer).
 */
cljs.core.async.dropping_buffer = (function cljs$core$async$dropping_buffer(n){
return cljs.core.async.impl.buffers.dropping_buffer(n);
});
/**
 * Returns a buffer of size n. When full, puts will complete, and be
 *   buffered, but oldest elements in buffer will be dropped (not
 *   transferred).
 */
cljs.core.async.sliding_buffer = (function cljs$core$async$sliding_buffer(n){
return cljs.core.async.impl.buffers.sliding_buffer(n);
});
/**
 * Returns true if a channel created with buff will never block. That is to say,
 * puts into this buffer will never cause the buffer to be full. 
 */
cljs.core.async.unblocking_buffer_QMARK_ = (function cljs$core$async$unblocking_buffer_QMARK_(buff){
if((!((buff == null)))){
if(((false) || ((cljs.core.PROTOCOL_SENTINEL === buff.cljs$core$async$impl$protocols$UnblockingBuffer$)))){
return true;
} else {
if((!buff.cljs$lang$protocol_mask$partition$)){
return cljs.core.native_satisfies_QMARK_(cljs.core.async.impl.protocols.UnblockingBuffer,buff);
} else {
return false;
}
}
} else {
return cljs.core.native_satisfies_QMARK_(cljs.core.async.impl.protocols.UnblockingBuffer,buff);
}
});
/**
 * Creates a channel with an optional buffer, an optional transducer (like (map f),
 *   (filter p) etc or a composition thereof), and an optional exception handler.
 *   If buf-or-n is a number, will create and use a fixed buffer of that size. If a
 *   transducer is supplied a buffer must be specified. ex-handler must be a
 *   fn of one argument - if an exception occurs during transformation it will be called
 *   with the thrown value as an argument, and any non-nil return value will be placed
 *   in the channel.
 */
cljs.core.async.chan = (function cljs$core$async$chan(var_args){
var G__37020 = arguments.length;
switch (G__37020) {
case 0:
return cljs.core.async.chan.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljs.core.async.chan.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.core.async.chan.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.chan.cljs$core$IFn$_invoke$arity$0 = (function (){
return cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1(null);
}));

(cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1 = (function (buf_or_n){
return cljs.core.async.chan.cljs$core$IFn$_invoke$arity$3(buf_or_n,null,null);
}));

(cljs.core.async.chan.cljs$core$IFn$_invoke$arity$2 = (function (buf_or_n,xform){
return cljs.core.async.chan.cljs$core$IFn$_invoke$arity$3(buf_or_n,xform,null);
}));

(cljs.core.async.chan.cljs$core$IFn$_invoke$arity$3 = (function (buf_or_n,xform,ex_handler){
var buf_or_n__$1 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(buf_or_n,(0)))?null:buf_or_n);
if(cljs.core.truth_(xform)){
if(cljs.core.truth_(buf_or_n__$1)){
} else {
throw (new Error(["Assert failed: ","buffer must be supplied when transducer is","\n","buf-or-n"].join('')));
}
} else {
}

return cljs.core.async.impl.channels.chan.cljs$core$IFn$_invoke$arity$3(((typeof buf_or_n__$1 === 'number')?cljs.core.async.buffer(buf_or_n__$1):buf_or_n__$1),xform,ex_handler);
}));

(cljs.core.async.chan.cljs$lang$maxFixedArity = 3);

/**
 * Creates a promise channel with an optional transducer, and an optional
 *   exception-handler. A promise channel can take exactly one value that consumers
 *   will receive. Once full, puts complete but val is dropped (no transfer).
 *   Consumers will block until either a value is placed in the channel or the
 *   channel is closed. See chan for the semantics of xform and ex-handler.
 */
cljs.core.async.promise_chan = (function cljs$core$async$promise_chan(var_args){
var G__37030 = arguments.length;
switch (G__37030) {
case 0:
return cljs.core.async.promise_chan.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return cljs.core.async.promise_chan.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljs.core.async.promise_chan.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.promise_chan.cljs$core$IFn$_invoke$arity$0 = (function (){
return cljs.core.async.promise_chan.cljs$core$IFn$_invoke$arity$1(null);
}));

(cljs.core.async.promise_chan.cljs$core$IFn$_invoke$arity$1 = (function (xform){
return cljs.core.async.promise_chan.cljs$core$IFn$_invoke$arity$2(xform,null);
}));

(cljs.core.async.promise_chan.cljs$core$IFn$_invoke$arity$2 = (function (xform,ex_handler){
return cljs.core.async.chan.cljs$core$IFn$_invoke$arity$3(cljs.core.async.impl.buffers.promise_buffer(),xform,ex_handler);
}));

(cljs.core.async.promise_chan.cljs$lang$maxFixedArity = 2);

/**
 * Returns a channel that will close after msecs
 */
cljs.core.async.timeout = (function cljs$core$async$timeout(msecs){
return cljs.core.async.impl.timers.timeout(msecs);
});
/**
 * takes a val from port. Must be called inside a (go ...) block. Will
 *   return nil if closed. Will park if nothing is available.
 *   Returns true unless port is already closed
 */
cljs.core.async._LT__BANG_ = (function cljs$core$async$_LT__BANG_(port){
throw (new Error("<! used not in (go ...) block"));
});
/**
 * Asynchronously takes a val from port, passing to fn1. Will pass nil
 * if closed. If on-caller? (default true) is true, and value is
 * immediately available, will call fn1 on calling thread.
 * Returns nil.
 */
cljs.core.async.take_BANG_ = (function cljs$core$async$take_BANG_(var_args){
var G__37035 = arguments.length;
switch (G__37035) {
case 2:
return cljs.core.async.take_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.core.async.take_BANG_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.take_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (port,fn1){
return cljs.core.async.take_BANG_.cljs$core$IFn$_invoke$arity$3(port,fn1,true);
}));

(cljs.core.async.take_BANG_.cljs$core$IFn$_invoke$arity$3 = (function (port,fn1,on_caller_QMARK_){
var ret = cljs.core.async.impl.protocols.take_BANG_(port,cljs.core.async.fn_handler.cljs$core$IFn$_invoke$arity$1(fn1));
if(cljs.core.truth_(ret)){
var val_40704 = cljs.core.deref(ret);
if(cljs.core.truth_(on_caller_QMARK_)){
(fn1.cljs$core$IFn$_invoke$arity$1 ? fn1.cljs$core$IFn$_invoke$arity$1(val_40704) : fn1.call(null,val_40704));
} else {
cljs.core.async.impl.dispatch.run((function (){
return (fn1.cljs$core$IFn$_invoke$arity$1 ? fn1.cljs$core$IFn$_invoke$arity$1(val_40704) : fn1.call(null,val_40704));
}));
}
} else {
}

return null;
}));

(cljs.core.async.take_BANG_.cljs$lang$maxFixedArity = 3);

cljs.core.async.nop = (function cljs$core$async$nop(_){
return null;
});
cljs.core.async.fhnop = cljs.core.async.fn_handler.cljs$core$IFn$_invoke$arity$1(cljs.core.async.nop);
/**
 * puts a val into port. nil values are not allowed. Must be called
 *   inside a (go ...) block. Will park if no buffer space is available.
 *   Returns true unless port is already closed.
 */
cljs.core.async._GT__BANG_ = (function cljs$core$async$_GT__BANG_(port,val){
throw (new Error(">! used not in (go ...) block"));
});
/**
 * Asynchronously puts a val into port, calling fn1 (if supplied) when
 * complete. nil values are not allowed. Will throw if closed. If
 * on-caller? (default true) is true, and the put is immediately
 * accepted, will call fn1 on calling thread.  Returns nil.
 */
cljs.core.async.put_BANG_ = (function cljs$core$async$put_BANG_(var_args){
var G__37044 = arguments.length;
switch (G__37044) {
case 2:
return cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (port,val){
var temp__5802__auto__ = cljs.core.async.impl.protocols.put_BANG_(port,val,cljs.core.async.fhnop);
if(cljs.core.truth_(temp__5802__auto__)){
var ret = temp__5802__auto__;
return cljs.core.deref(ret);
} else {
return true;
}
}));

(cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$3 = (function (port,val,fn1){
return cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$4(port,val,fn1,true);
}));

(cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$4 = (function (port,val,fn1,on_caller_QMARK_){
var temp__5802__auto__ = cljs.core.async.impl.protocols.put_BANG_(port,val,cljs.core.async.fn_handler.cljs$core$IFn$_invoke$arity$1(fn1));
if(cljs.core.truth_(temp__5802__auto__)){
var retb = temp__5802__auto__;
var ret = cljs.core.deref(retb);
if(cljs.core.truth_(on_caller_QMARK_)){
(fn1.cljs$core$IFn$_invoke$arity$1 ? fn1.cljs$core$IFn$_invoke$arity$1(ret) : fn1.call(null,ret));
} else {
cljs.core.async.impl.dispatch.run((function (){
return (fn1.cljs$core$IFn$_invoke$arity$1 ? fn1.cljs$core$IFn$_invoke$arity$1(ret) : fn1.call(null,ret));
}));
}

return ret;
} else {
return true;
}
}));

(cljs.core.async.put_BANG_.cljs$lang$maxFixedArity = 4);

cljs.core.async.close_BANG_ = (function cljs$core$async$close_BANG_(port){
return cljs.core.async.impl.protocols.close_BANG_(port);
});
cljs.core.async.random_array = (function cljs$core$async$random_array(n){
var a = (new Array(n));
var n__5593__auto___40709 = n;
var x_40710 = (0);
while(true){
if((x_40710 < n__5593__auto___40709)){
(a[x_40710] = x_40710);

var G__40712 = (x_40710 + (1));
x_40710 = G__40712;
continue;
} else {
}
break;
}

cljs.core.async.goog$module$goog$array.shuffle(a);

return a;
});

/**
* @constructor
 * @implements {cljs.core.async.impl.protocols.Handler}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
cljs.core.async.t_cljs$core$async37055 = (function (flag,meta37056){
this.flag = flag;
this.meta37056 = meta37056;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async37055.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_37057,meta37056__$1){
var self__ = this;
var _37057__$1 = this;
return (new cljs.core.async.t_cljs$core$async37055(self__.flag,meta37056__$1));
}));

(cljs.core.async.t_cljs$core$async37055.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_37057){
var self__ = this;
var _37057__$1 = this;
return self__.meta37056;
}));

(cljs.core.async.t_cljs$core$async37055.prototype.cljs$core$async$impl$protocols$Handler$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async37055.prototype.cljs$core$async$impl$protocols$Handler$active_QMARK_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.deref(self__.flag);
}));

(cljs.core.async.t_cljs$core$async37055.prototype.cljs$core$async$impl$protocols$Handler$blockable_QMARK_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return true;
}));

(cljs.core.async.t_cljs$core$async37055.prototype.cljs$core$async$impl$protocols$Handler$commit$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
cljs.core.reset_BANG_(self__.flag,null);

return true;
}));

(cljs.core.async.t_cljs$core$async37055.getBasis = (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"flag","flag",-1565787888,null),new cljs.core.Symbol(null,"meta37056","meta37056",-2041690936,null)], null);
}));

(cljs.core.async.t_cljs$core$async37055.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async37055.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async37055");

(cljs.core.async.t_cljs$core$async37055.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async37055");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async37055.
 */
cljs.core.async.__GT_t_cljs$core$async37055 = (function cljs$core$async$__GT_t_cljs$core$async37055(flag,meta37056){
return (new cljs.core.async.t_cljs$core$async37055(flag,meta37056));
});


cljs.core.async.alt_flag = (function cljs$core$async$alt_flag(){
var flag = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(true);
return (new cljs.core.async.t_cljs$core$async37055(flag,cljs.core.PersistentArrayMap.EMPTY));
});

/**
* @constructor
 * @implements {cljs.core.async.impl.protocols.Handler}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
cljs.core.async.t_cljs$core$async37062 = (function (flag,cb,meta37063){
this.flag = flag;
this.cb = cb;
this.meta37063 = meta37063;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async37062.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_37064,meta37063__$1){
var self__ = this;
var _37064__$1 = this;
return (new cljs.core.async.t_cljs$core$async37062(self__.flag,self__.cb,meta37063__$1));
}));

(cljs.core.async.t_cljs$core$async37062.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_37064){
var self__ = this;
var _37064__$1 = this;
return self__.meta37063;
}));

(cljs.core.async.t_cljs$core$async37062.prototype.cljs$core$async$impl$protocols$Handler$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async37062.prototype.cljs$core$async$impl$protocols$Handler$active_QMARK_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.active_QMARK_(self__.flag);
}));

(cljs.core.async.t_cljs$core$async37062.prototype.cljs$core$async$impl$protocols$Handler$blockable_QMARK_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return true;
}));

(cljs.core.async.t_cljs$core$async37062.prototype.cljs$core$async$impl$protocols$Handler$commit$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
cljs.core.async.impl.protocols.commit(self__.flag);

return self__.cb;
}));

(cljs.core.async.t_cljs$core$async37062.getBasis = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"flag","flag",-1565787888,null),new cljs.core.Symbol(null,"cb","cb",-2064487928,null),new cljs.core.Symbol(null,"meta37063","meta37063",-378923262,null)], null);
}));

(cljs.core.async.t_cljs$core$async37062.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async37062.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async37062");

(cljs.core.async.t_cljs$core$async37062.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async37062");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async37062.
 */
cljs.core.async.__GT_t_cljs$core$async37062 = (function cljs$core$async$__GT_t_cljs$core$async37062(flag,cb,meta37063){
return (new cljs.core.async.t_cljs$core$async37062(flag,cb,meta37063));
});


cljs.core.async.alt_handler = (function cljs$core$async$alt_handler(flag,cb){
return (new cljs.core.async.t_cljs$core$async37062(flag,cb,cljs.core.PersistentArrayMap.EMPTY));
});
/**
 * returns derefable [val port] if immediate, nil if enqueued
 */
cljs.core.async.do_alts = (function cljs$core$async$do_alts(fret,ports,opts){
if((cljs.core.count(ports) > (0))){
} else {
throw (new Error(["Assert failed: ","alts must have at least one channel operation","\n","(pos? (count ports))"].join('')));
}

var flag = cljs.core.async.alt_flag();
var ports__$1 = cljs.core.vec(ports);
var n = cljs.core.count(ports__$1);
var idxs = cljs.core.async.random_array(n);
var priority = new cljs.core.Keyword(null,"priority","priority",1431093715).cljs$core$IFn$_invoke$arity$1(opts);
var ret = (function (){var i = (0);
while(true){
if((i < n)){
var idx = (cljs.core.truth_(priority)?i:(idxs[i]));
var port = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(ports__$1,idx);
var wport = ((cljs.core.vector_QMARK_(port))?(port.cljs$core$IFn$_invoke$arity$1 ? port.cljs$core$IFn$_invoke$arity$1((0)) : port.call(null,(0))):null);
var vbox = (cljs.core.truth_(wport)?(function (){var val = (port.cljs$core$IFn$_invoke$arity$1 ? port.cljs$core$IFn$_invoke$arity$1((1)) : port.call(null,(1)));
return cljs.core.async.impl.protocols.put_BANG_(wport,val,cljs.core.async.alt_handler(flag,((function (i,val,idx,port,wport,flag,ports__$1,n,idxs,priority){
return (function (p1__37071_SHARP_){
var G__37080 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [p1__37071_SHARP_,wport], null);
return (fret.cljs$core$IFn$_invoke$arity$1 ? fret.cljs$core$IFn$_invoke$arity$1(G__37080) : fret.call(null,G__37080));
});})(i,val,idx,port,wport,flag,ports__$1,n,idxs,priority))
));
})():cljs.core.async.impl.protocols.take_BANG_(port,cljs.core.async.alt_handler(flag,((function (i,idx,port,wport,flag,ports__$1,n,idxs,priority){
return (function (p1__37072_SHARP_){
var G__37083 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [p1__37072_SHARP_,port], null);
return (fret.cljs$core$IFn$_invoke$arity$1 ? fret.cljs$core$IFn$_invoke$arity$1(G__37083) : fret.call(null,G__37083));
});})(i,idx,port,wport,flag,ports__$1,n,idxs,priority))
)));
if(cljs.core.truth_(vbox)){
return cljs.core.async.impl.channels.box(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.deref(vbox),(function (){var or__5002__auto__ = wport;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return port;
}
})()], null));
} else {
var G__40721 = (i + (1));
i = G__40721;
continue;
}
} else {
return null;
}
break;
}
})();
var or__5002__auto__ = ret;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
if(cljs.core.contains_QMARK_(opts,new cljs.core.Keyword(null,"default","default",-1987822328))){
var temp__5804__auto__ = (function (){var and__5000__auto__ = flag.cljs$core$async$impl$protocols$Handler$active_QMARK_$arity$1(null);
if(cljs.core.truth_(and__5000__auto__)){
return flag.cljs$core$async$impl$protocols$Handler$commit$arity$1(null);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var got = temp__5804__auto__;
return cljs.core.async.impl.channels.box(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"default","default",-1987822328).cljs$core$IFn$_invoke$arity$1(opts),new cljs.core.Keyword(null,"default","default",-1987822328)], null));
} else {
return null;
}
} else {
return null;
}
}
});
/**
 * Completes at most one of several channel operations. Must be called
 * inside a (go ...) block. ports is a vector of channel endpoints,
 * which can be either a channel to take from or a vector of
 *   [channel-to-put-to val-to-put], in any combination. Takes will be
 *   made as if by <!, and puts will be made as if by >!. Unless
 *   the :priority option is true, if more than one port operation is
 *   ready a non-deterministic choice will be made. If no operation is
 *   ready and a :default value is supplied, [default-val :default] will
 *   be returned, otherwise alts! will park until the first operation to
 *   become ready completes. Returns [val port] of the completed
 *   operation, where val is the value taken for takes, and a
 *   boolean (true unless already closed, as per put!) for puts.
 * 
 *   opts are passed as :key val ... Supported options:
 * 
 *   :default val - the value to use if none of the operations are immediately ready
 *   :priority true - (default nil) when true, the operations will be tried in order.
 * 
 *   Note: there is no guarantee that the port exps or val exprs will be
 *   used, nor in what order should they be, so they should not be
 *   depended upon for side effects.
 */
cljs.core.async.alts_BANG_ = (function cljs$core$async$alts_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___40724 = arguments.length;
var i__5727__auto___40725 = (0);
while(true){
if((i__5727__auto___40725 < len__5726__auto___40724)){
args__5732__auto__.push((arguments[i__5727__auto___40725]));

var G__40726 = (i__5727__auto___40725 + (1));
i__5727__auto___40725 = G__40726;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return cljs.core.async.alts_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(cljs.core.async.alts_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (ports,p__37094){
var map__37095 = p__37094;
var map__37095__$1 = cljs.core.__destructure_map(map__37095);
var opts = map__37095__$1;
throw (new Error("alts! used not in (go ...) block"));
}));

(cljs.core.async.alts_BANG_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(cljs.core.async.alts_BANG_.cljs$lang$applyTo = (function (seq37091){
var G__37092 = cljs.core.first(seq37091);
var seq37091__$1 = cljs.core.next(seq37091);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__37092,seq37091__$1);
}));

/**
 * Puts a val into port if it's possible to do so immediately.
 *   nil values are not allowed. Never blocks. Returns true if offer succeeds.
 */
cljs.core.async.offer_BANG_ = (function cljs$core$async$offer_BANG_(port,val){
var ret = cljs.core.async.impl.protocols.put_BANG_(port,val,cljs.core.async.fn_handler.cljs$core$IFn$_invoke$arity$2(cljs.core.async.nop,false));
if(cljs.core.truth_(ret)){
return cljs.core.deref(ret);
} else {
return null;
}
});
/**
 * Takes a val from port if it's possible to do so immediately.
 *   Never blocks. Returns value if successful, nil otherwise.
 */
cljs.core.async.poll_BANG_ = (function cljs$core$async$poll_BANG_(port){
var ret = cljs.core.async.impl.protocols.take_BANG_(port,cljs.core.async.fn_handler.cljs$core$IFn$_invoke$arity$2(cljs.core.async.nop,false));
if(cljs.core.truth_(ret)){
return cljs.core.deref(ret);
} else {
return null;
}
});
/**
 * Takes elements from the from channel and supplies them to the to
 * channel. By default, the to channel will be closed when the from
 * channel closes, but can be determined by the close?  parameter. Will
 * stop consuming the from channel if the to channel closes
 */
cljs.core.async.pipe = (function cljs$core$async$pipe(var_args){
var G__37104 = arguments.length;
switch (G__37104) {
case 2:
return cljs.core.async.pipe.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.core.async.pipe.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.pipe.cljs$core$IFn$_invoke$arity$2 = (function (from,to){
return cljs.core.async.pipe.cljs$core$IFn$_invoke$arity$3(from,to,true);
}));

(cljs.core.async.pipe.cljs$core$IFn$_invoke$arity$3 = (function (from,to,close_QMARK_){
var c__36895__auto___40728 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__36897__auto__ = (function (){var switch__36594__auto__ = (function (state_37443){
var state_val_37445 = (state_37443[(1)]);
if((state_val_37445 === (7))){
var inst_37418 = (state_37443[(2)]);
var state_37443__$1 = state_37443;
var statearr_37463_40729 = state_37443__$1;
(statearr_37463_40729[(2)] = inst_37418);

(statearr_37463_40729[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37445 === (1))){
var state_37443__$1 = state_37443;
var statearr_37464_40730 = state_37443__$1;
(statearr_37464_40730[(2)] = null);

(statearr_37464_40730[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37445 === (4))){
var inst_37370 = (state_37443[(7)]);
var inst_37370__$1 = (state_37443[(2)]);
var inst_37383 = (inst_37370__$1 == null);
var state_37443__$1 = (function (){var statearr_37468 = state_37443;
(statearr_37468[(7)] = inst_37370__$1);

return statearr_37468;
})();
if(cljs.core.truth_(inst_37383)){
var statearr_37469_40731 = state_37443__$1;
(statearr_37469_40731[(1)] = (5));

} else {
var statearr_37470_40732 = state_37443__$1;
(statearr_37470_40732[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37445 === (13))){
var state_37443__$1 = state_37443;
var statearr_37475_40733 = state_37443__$1;
(statearr_37475_40733[(2)] = null);

(statearr_37475_40733[(1)] = (14));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37445 === (6))){
var inst_37370 = (state_37443[(7)]);
var state_37443__$1 = state_37443;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_37443__$1,(11),to,inst_37370);
} else {
if((state_val_37445 === (3))){
var inst_37428 = (state_37443[(2)]);
var state_37443__$1 = state_37443;
return cljs.core.async.impl.ioc_helpers.return_chan(state_37443__$1,inst_37428);
} else {
if((state_val_37445 === (12))){
var state_37443__$1 = state_37443;
var statearr_37492_40734 = state_37443__$1;
(statearr_37492_40734[(2)] = null);

(statearr_37492_40734[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37445 === (2))){
var state_37443__$1 = state_37443;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_37443__$1,(4),from);
} else {
if((state_val_37445 === (11))){
var inst_37403 = (state_37443[(2)]);
var state_37443__$1 = state_37443;
if(cljs.core.truth_(inst_37403)){
var statearr_37498_40735 = state_37443__$1;
(statearr_37498_40735[(1)] = (12));

} else {
var statearr_37505_40736 = state_37443__$1;
(statearr_37505_40736[(1)] = (13));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37445 === (9))){
var state_37443__$1 = state_37443;
var statearr_37507_40737 = state_37443__$1;
(statearr_37507_40737[(2)] = null);

(statearr_37507_40737[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37445 === (5))){
var state_37443__$1 = state_37443;
if(cljs.core.truth_(close_QMARK_)){
var statearr_37508_40738 = state_37443__$1;
(statearr_37508_40738[(1)] = (8));

} else {
var statearr_37509_40739 = state_37443__$1;
(statearr_37509_40739[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37445 === (14))){
var inst_37416 = (state_37443[(2)]);
var state_37443__$1 = state_37443;
var statearr_37511_40740 = state_37443__$1;
(statearr_37511_40740[(2)] = inst_37416);

(statearr_37511_40740[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37445 === (10))){
var inst_37399 = (state_37443[(2)]);
var state_37443__$1 = state_37443;
var statearr_37512_40741 = state_37443__$1;
(statearr_37512_40741[(2)] = inst_37399);

(statearr_37512_40741[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37445 === (8))){
var inst_37388 = cljs.core.async.close_BANG_(to);
var state_37443__$1 = state_37443;
var statearr_37513_40742 = state_37443__$1;
(statearr_37513_40742[(2)] = inst_37388);

(statearr_37513_40742[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var cljs$core$async$state_machine__36595__auto__ = null;
var cljs$core$async$state_machine__36595__auto____0 = (function (){
var statearr_37515 = [null,null,null,null,null,null,null,null];
(statearr_37515[(0)] = cljs$core$async$state_machine__36595__auto__);

(statearr_37515[(1)] = (1));

return statearr_37515;
});
var cljs$core$async$state_machine__36595__auto____1 = (function (state_37443){
while(true){
var ret_value__36596__auto__ = (function (){try{while(true){
var result__36597__auto__ = switch__36594__auto__(state_37443);
if(cljs.core.keyword_identical_QMARK_(result__36597__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__36597__auto__;
}
break;
}
}catch (e37518){var ex__36598__auto__ = e37518;
var statearr_37523_40743 = state_37443;
(statearr_37523_40743[(2)] = ex__36598__auto__);


if(cljs.core.seq((state_37443[(4)]))){
var statearr_37524_40744 = state_37443;
(statearr_37524_40744[(1)] = cljs.core.first((state_37443[(4)])));

} else {
throw ex__36598__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__36596__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__40745 = state_37443;
state_37443 = G__40745;
continue;
} else {
return ret_value__36596__auto__;
}
break;
}
});
cljs$core$async$state_machine__36595__auto__ = function(state_37443){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__36595__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__36595__auto____1.call(this,state_37443);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__36595__auto____0;
cljs$core$async$state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__36595__auto____1;
return cljs$core$async$state_machine__36595__auto__;
})()
})();
var state__36898__auto__ = (function (){var statearr_37532 = f__36897__auto__();
(statearr_37532[(6)] = c__36895__auto___40728);

return statearr_37532;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__36898__auto__);
}));


return to;
}));

(cljs.core.async.pipe.cljs$lang$maxFixedArity = 3);

cljs.core.async.pipeline_STAR_ = (function cljs$core$async$pipeline_STAR_(n,to,xf,from,close_QMARK_,ex_handler,type){
if((n > (0))){
} else {
throw (new Error("Assert failed: (pos? n)"));
}

var jobs = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1(n);
var results = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1(n);
var process__$1 = (function (p__37562){
var vec__37564 = p__37562;
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__37564,(0),null);
var p = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__37564,(1),null);
var job = vec__37564;
if((job == null)){
cljs.core.async.close_BANG_(results);

return null;
} else {
var res = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$3((1),xf,ex_handler);
var c__36895__auto___40746 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__36897__auto__ = (function (){var switch__36594__auto__ = (function (state_37588){
var state_val_37589 = (state_37588[(1)]);
if((state_val_37589 === (1))){
var state_37588__$1 = state_37588;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_37588__$1,(2),res,v);
} else {
if((state_val_37589 === (2))){
var inst_37580 = (state_37588[(2)]);
var inst_37581 = cljs.core.async.close_BANG_(res);
var state_37588__$1 = (function (){var statearr_37613 = state_37588;
(statearr_37613[(7)] = inst_37580);

return statearr_37613;
})();
return cljs.core.async.impl.ioc_helpers.return_chan(state_37588__$1,inst_37581);
} else {
return null;
}
}
});
return (function() {
var cljs$core$async$pipeline_STAR__$_state_machine__36595__auto__ = null;
var cljs$core$async$pipeline_STAR__$_state_machine__36595__auto____0 = (function (){
var statearr_37614 = [null,null,null,null,null,null,null,null];
(statearr_37614[(0)] = cljs$core$async$pipeline_STAR__$_state_machine__36595__auto__);

(statearr_37614[(1)] = (1));

return statearr_37614;
});
var cljs$core$async$pipeline_STAR__$_state_machine__36595__auto____1 = (function (state_37588){
while(true){
var ret_value__36596__auto__ = (function (){try{while(true){
var result__36597__auto__ = switch__36594__auto__(state_37588);
if(cljs.core.keyword_identical_QMARK_(result__36597__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__36597__auto__;
}
break;
}
}catch (e37615){var ex__36598__auto__ = e37615;
var statearr_37617_40747 = state_37588;
(statearr_37617_40747[(2)] = ex__36598__auto__);


if(cljs.core.seq((state_37588[(4)]))){
var statearr_37618_40748 = state_37588;
(statearr_37618_40748[(1)] = cljs.core.first((state_37588[(4)])));

} else {
throw ex__36598__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__36596__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__40749 = state_37588;
state_37588 = G__40749;
continue;
} else {
return ret_value__36596__auto__;
}
break;
}
});
cljs$core$async$pipeline_STAR__$_state_machine__36595__auto__ = function(state_37588){
switch(arguments.length){
case 0:
return cljs$core$async$pipeline_STAR__$_state_machine__36595__auto____0.call(this);
case 1:
return cljs$core$async$pipeline_STAR__$_state_machine__36595__auto____1.call(this,state_37588);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$pipeline_STAR__$_state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$pipeline_STAR__$_state_machine__36595__auto____0;
cljs$core$async$pipeline_STAR__$_state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$pipeline_STAR__$_state_machine__36595__auto____1;
return cljs$core$async$pipeline_STAR__$_state_machine__36595__auto__;
})()
})();
var state__36898__auto__ = (function (){var statearr_37619 = f__36897__auto__();
(statearr_37619[(6)] = c__36895__auto___40746);

return statearr_37619;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__36898__auto__);
}));


cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$2(p,res);

return true;
}
});
var async = (function (p__37625){
var vec__37626 = p__37625;
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__37626,(0),null);
var p = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__37626,(1),null);
var job = vec__37626;
if((job == null)){
cljs.core.async.close_BANG_(results);

return null;
} else {
var res = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
(xf.cljs$core$IFn$_invoke$arity$2 ? xf.cljs$core$IFn$_invoke$arity$2(v,res) : xf.call(null,v,res));

cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$2(p,res);

return true;
}
});
var n__5593__auto___40750 = n;
var __40751 = (0);
while(true){
if((__40751 < n__5593__auto___40750)){
var G__37632_40755 = type;
var G__37632_40756__$1 = (((G__37632_40755 instanceof cljs.core.Keyword))?G__37632_40755.fqn:null);
switch (G__37632_40756__$1) {
case "compute":
var c__36895__auto___40758 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run(((function (__40751,c__36895__auto___40758,G__37632_40755,G__37632_40756__$1,n__5593__auto___40750,jobs,results,process__$1,async){
return (function (){
var f__36897__auto__ = (function (){var switch__36594__auto__ = ((function (__40751,c__36895__auto___40758,G__37632_40755,G__37632_40756__$1,n__5593__auto___40750,jobs,results,process__$1,async){
return (function (state_37646){
var state_val_37648 = (state_37646[(1)]);
if((state_val_37648 === (1))){
var state_37646__$1 = state_37646;
var statearr_37649_40759 = state_37646__$1;
(statearr_37649_40759[(2)] = null);

(statearr_37649_40759[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37648 === (2))){
var state_37646__$1 = state_37646;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_37646__$1,(4),jobs);
} else {
if((state_val_37648 === (3))){
var inst_37644 = (state_37646[(2)]);
var state_37646__$1 = state_37646;
return cljs.core.async.impl.ioc_helpers.return_chan(state_37646__$1,inst_37644);
} else {
if((state_val_37648 === (4))){
var inst_37636 = (state_37646[(2)]);
var inst_37637 = process__$1(inst_37636);
var state_37646__$1 = state_37646;
if(cljs.core.truth_(inst_37637)){
var statearr_37651_40760 = state_37646__$1;
(statearr_37651_40760[(1)] = (5));

} else {
var statearr_37653_40761 = state_37646__$1;
(statearr_37653_40761[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37648 === (5))){
var state_37646__$1 = state_37646;
var statearr_37654_40762 = state_37646__$1;
(statearr_37654_40762[(2)] = null);

(statearr_37654_40762[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37648 === (6))){
var state_37646__$1 = state_37646;
var statearr_37655_40763 = state_37646__$1;
(statearr_37655_40763[(2)] = null);

(statearr_37655_40763[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37648 === (7))){
var inst_37642 = (state_37646[(2)]);
var state_37646__$1 = state_37646;
var statearr_37660_40764 = state_37646__$1;
(statearr_37660_40764[(2)] = inst_37642);

(statearr_37660_40764[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
});})(__40751,c__36895__auto___40758,G__37632_40755,G__37632_40756__$1,n__5593__auto___40750,jobs,results,process__$1,async))
;
return ((function (__40751,switch__36594__auto__,c__36895__auto___40758,G__37632_40755,G__37632_40756__$1,n__5593__auto___40750,jobs,results,process__$1,async){
return (function() {
var cljs$core$async$pipeline_STAR__$_state_machine__36595__auto__ = null;
var cljs$core$async$pipeline_STAR__$_state_machine__36595__auto____0 = (function (){
var statearr_37665 = [null,null,null,null,null,null,null];
(statearr_37665[(0)] = cljs$core$async$pipeline_STAR__$_state_machine__36595__auto__);

(statearr_37665[(1)] = (1));

return statearr_37665;
});
var cljs$core$async$pipeline_STAR__$_state_machine__36595__auto____1 = (function (state_37646){
while(true){
var ret_value__36596__auto__ = (function (){try{while(true){
var result__36597__auto__ = switch__36594__auto__(state_37646);
if(cljs.core.keyword_identical_QMARK_(result__36597__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__36597__auto__;
}
break;
}
}catch (e37673){var ex__36598__auto__ = e37673;
var statearr_37674_40765 = state_37646;
(statearr_37674_40765[(2)] = ex__36598__auto__);


if(cljs.core.seq((state_37646[(4)]))){
var statearr_37675_40766 = state_37646;
(statearr_37675_40766[(1)] = cljs.core.first((state_37646[(4)])));

} else {
throw ex__36598__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__36596__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__40767 = state_37646;
state_37646 = G__40767;
continue;
} else {
return ret_value__36596__auto__;
}
break;
}
});
cljs$core$async$pipeline_STAR__$_state_machine__36595__auto__ = function(state_37646){
switch(arguments.length){
case 0:
return cljs$core$async$pipeline_STAR__$_state_machine__36595__auto____0.call(this);
case 1:
return cljs$core$async$pipeline_STAR__$_state_machine__36595__auto____1.call(this,state_37646);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$pipeline_STAR__$_state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$pipeline_STAR__$_state_machine__36595__auto____0;
cljs$core$async$pipeline_STAR__$_state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$pipeline_STAR__$_state_machine__36595__auto____1;
return cljs$core$async$pipeline_STAR__$_state_machine__36595__auto__;
})()
;})(__40751,switch__36594__auto__,c__36895__auto___40758,G__37632_40755,G__37632_40756__$1,n__5593__auto___40750,jobs,results,process__$1,async))
})();
var state__36898__auto__ = (function (){var statearr_37676 = f__36897__auto__();
(statearr_37676[(6)] = c__36895__auto___40758);

return statearr_37676;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__36898__auto__);
});})(__40751,c__36895__auto___40758,G__37632_40755,G__37632_40756__$1,n__5593__auto___40750,jobs,results,process__$1,async))
);


break;
case "async":
var c__36895__auto___40768 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run(((function (__40751,c__36895__auto___40768,G__37632_40755,G__37632_40756__$1,n__5593__auto___40750,jobs,results,process__$1,async){
return (function (){
var f__36897__auto__ = (function (){var switch__36594__auto__ = ((function (__40751,c__36895__auto___40768,G__37632_40755,G__37632_40756__$1,n__5593__auto___40750,jobs,results,process__$1,async){
return (function (state_37689){
var state_val_37690 = (state_37689[(1)]);
if((state_val_37690 === (1))){
var state_37689__$1 = state_37689;
var statearr_37691_40769 = state_37689__$1;
(statearr_37691_40769[(2)] = null);

(statearr_37691_40769[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37690 === (2))){
var state_37689__$1 = state_37689;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_37689__$1,(4),jobs);
} else {
if((state_val_37690 === (3))){
var inst_37687 = (state_37689[(2)]);
var state_37689__$1 = state_37689;
return cljs.core.async.impl.ioc_helpers.return_chan(state_37689__$1,inst_37687);
} else {
if((state_val_37690 === (4))){
var inst_37679 = (state_37689[(2)]);
var inst_37680 = async(inst_37679);
var state_37689__$1 = state_37689;
if(cljs.core.truth_(inst_37680)){
var statearr_37693_40773 = state_37689__$1;
(statearr_37693_40773[(1)] = (5));

} else {
var statearr_37694_40774 = state_37689__$1;
(statearr_37694_40774[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37690 === (5))){
var state_37689__$1 = state_37689;
var statearr_37695_40779 = state_37689__$1;
(statearr_37695_40779[(2)] = null);

(statearr_37695_40779[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37690 === (6))){
var state_37689__$1 = state_37689;
var statearr_37696_40780 = state_37689__$1;
(statearr_37696_40780[(2)] = null);

(statearr_37696_40780[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37690 === (7))){
var inst_37685 = (state_37689[(2)]);
var state_37689__$1 = state_37689;
var statearr_37697_40784 = state_37689__$1;
(statearr_37697_40784[(2)] = inst_37685);

(statearr_37697_40784[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
});})(__40751,c__36895__auto___40768,G__37632_40755,G__37632_40756__$1,n__5593__auto___40750,jobs,results,process__$1,async))
;
return ((function (__40751,switch__36594__auto__,c__36895__auto___40768,G__37632_40755,G__37632_40756__$1,n__5593__auto___40750,jobs,results,process__$1,async){
return (function() {
var cljs$core$async$pipeline_STAR__$_state_machine__36595__auto__ = null;
var cljs$core$async$pipeline_STAR__$_state_machine__36595__auto____0 = (function (){
var statearr_37698 = [null,null,null,null,null,null,null];
(statearr_37698[(0)] = cljs$core$async$pipeline_STAR__$_state_machine__36595__auto__);

(statearr_37698[(1)] = (1));

return statearr_37698;
});
var cljs$core$async$pipeline_STAR__$_state_machine__36595__auto____1 = (function (state_37689){
while(true){
var ret_value__36596__auto__ = (function (){try{while(true){
var result__36597__auto__ = switch__36594__auto__(state_37689);
if(cljs.core.keyword_identical_QMARK_(result__36597__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__36597__auto__;
}
break;
}
}catch (e37701){var ex__36598__auto__ = e37701;
var statearr_37702_40788 = state_37689;
(statearr_37702_40788[(2)] = ex__36598__auto__);


if(cljs.core.seq((state_37689[(4)]))){
var statearr_37703_40789 = state_37689;
(statearr_37703_40789[(1)] = cljs.core.first((state_37689[(4)])));

} else {
throw ex__36598__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__36596__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__40790 = state_37689;
state_37689 = G__40790;
continue;
} else {
return ret_value__36596__auto__;
}
break;
}
});
cljs$core$async$pipeline_STAR__$_state_machine__36595__auto__ = function(state_37689){
switch(arguments.length){
case 0:
return cljs$core$async$pipeline_STAR__$_state_machine__36595__auto____0.call(this);
case 1:
return cljs$core$async$pipeline_STAR__$_state_machine__36595__auto____1.call(this,state_37689);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$pipeline_STAR__$_state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$pipeline_STAR__$_state_machine__36595__auto____0;
cljs$core$async$pipeline_STAR__$_state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$pipeline_STAR__$_state_machine__36595__auto____1;
return cljs$core$async$pipeline_STAR__$_state_machine__36595__auto__;
})()
;})(__40751,switch__36594__auto__,c__36895__auto___40768,G__37632_40755,G__37632_40756__$1,n__5593__auto___40750,jobs,results,process__$1,async))
})();
var state__36898__auto__ = (function (){var statearr_37707 = f__36897__auto__();
(statearr_37707[(6)] = c__36895__auto___40768);

return statearr_37707;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__36898__auto__);
});})(__40751,c__36895__auto___40768,G__37632_40755,G__37632_40756__$1,n__5593__auto___40750,jobs,results,process__$1,async))
);


break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__37632_40756__$1)].join('')));

}

var G__40791 = (__40751 + (1));
__40751 = G__40791;
continue;
} else {
}
break;
}

var c__36895__auto___40799 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__36897__auto__ = (function (){var switch__36594__auto__ = (function (state_37733){
var state_val_37736 = (state_37733[(1)]);
if((state_val_37736 === (7))){
var inst_37729 = (state_37733[(2)]);
var state_37733__$1 = state_37733;
var statearr_37737_40803 = state_37733__$1;
(statearr_37737_40803[(2)] = inst_37729);

(statearr_37737_40803[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37736 === (1))){
var state_37733__$1 = state_37733;
var statearr_37738_40804 = state_37733__$1;
(statearr_37738_40804[(2)] = null);

(statearr_37738_40804[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37736 === (4))){
var inst_37714 = (state_37733[(7)]);
var inst_37714__$1 = (state_37733[(2)]);
var inst_37715 = (inst_37714__$1 == null);
var state_37733__$1 = (function (){var statearr_37742 = state_37733;
(statearr_37742[(7)] = inst_37714__$1);

return statearr_37742;
})();
if(cljs.core.truth_(inst_37715)){
var statearr_37743_40805 = state_37733__$1;
(statearr_37743_40805[(1)] = (5));

} else {
var statearr_37744_40806 = state_37733__$1;
(statearr_37744_40806[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37736 === (6))){
var inst_37714 = (state_37733[(7)]);
var inst_37719 = (state_37733[(8)]);
var inst_37719__$1 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
var inst_37720 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_37721 = [inst_37714,inst_37719__$1];
var inst_37722 = (new cljs.core.PersistentVector(null,2,(5),inst_37720,inst_37721,null));
var state_37733__$1 = (function (){var statearr_37746 = state_37733;
(statearr_37746[(8)] = inst_37719__$1);

return statearr_37746;
})();
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_37733__$1,(8),jobs,inst_37722);
} else {
if((state_val_37736 === (3))){
var inst_37731 = (state_37733[(2)]);
var state_37733__$1 = state_37733;
return cljs.core.async.impl.ioc_helpers.return_chan(state_37733__$1,inst_37731);
} else {
if((state_val_37736 === (2))){
var state_37733__$1 = state_37733;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_37733__$1,(4),from);
} else {
if((state_val_37736 === (9))){
var inst_37726 = (state_37733[(2)]);
var state_37733__$1 = (function (){var statearr_37747 = state_37733;
(statearr_37747[(9)] = inst_37726);

return statearr_37747;
})();
var statearr_37748_40810 = state_37733__$1;
(statearr_37748_40810[(2)] = null);

(statearr_37748_40810[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37736 === (5))){
var inst_37717 = cljs.core.async.close_BANG_(jobs);
var state_37733__$1 = state_37733;
var statearr_37751_40815 = state_37733__$1;
(statearr_37751_40815[(2)] = inst_37717);

(statearr_37751_40815[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37736 === (8))){
var inst_37719 = (state_37733[(8)]);
var inst_37724 = (state_37733[(2)]);
var state_37733__$1 = (function (){var statearr_37752 = state_37733;
(statearr_37752[(10)] = inst_37724);

return statearr_37752;
})();
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_37733__$1,(9),results,inst_37719);
} else {
return null;
}
}
}
}
}
}
}
}
}
});
return (function() {
var cljs$core$async$pipeline_STAR__$_state_machine__36595__auto__ = null;
var cljs$core$async$pipeline_STAR__$_state_machine__36595__auto____0 = (function (){
var statearr_37758 = [null,null,null,null,null,null,null,null,null,null,null];
(statearr_37758[(0)] = cljs$core$async$pipeline_STAR__$_state_machine__36595__auto__);

(statearr_37758[(1)] = (1));

return statearr_37758;
});
var cljs$core$async$pipeline_STAR__$_state_machine__36595__auto____1 = (function (state_37733){
while(true){
var ret_value__36596__auto__ = (function (){try{while(true){
var result__36597__auto__ = switch__36594__auto__(state_37733);
if(cljs.core.keyword_identical_QMARK_(result__36597__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__36597__auto__;
}
break;
}
}catch (e37759){var ex__36598__auto__ = e37759;
var statearr_37760_40822 = state_37733;
(statearr_37760_40822[(2)] = ex__36598__auto__);


if(cljs.core.seq((state_37733[(4)]))){
var statearr_37764_40827 = state_37733;
(statearr_37764_40827[(1)] = cljs.core.first((state_37733[(4)])));

} else {
throw ex__36598__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__36596__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__40828 = state_37733;
state_37733 = G__40828;
continue;
} else {
return ret_value__36596__auto__;
}
break;
}
});
cljs$core$async$pipeline_STAR__$_state_machine__36595__auto__ = function(state_37733){
switch(arguments.length){
case 0:
return cljs$core$async$pipeline_STAR__$_state_machine__36595__auto____0.call(this);
case 1:
return cljs$core$async$pipeline_STAR__$_state_machine__36595__auto____1.call(this,state_37733);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$pipeline_STAR__$_state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$pipeline_STAR__$_state_machine__36595__auto____0;
cljs$core$async$pipeline_STAR__$_state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$pipeline_STAR__$_state_machine__36595__auto____1;
return cljs$core$async$pipeline_STAR__$_state_machine__36595__auto__;
})()
})();
var state__36898__auto__ = (function (){var statearr_37766 = f__36897__auto__();
(statearr_37766[(6)] = c__36895__auto___40799);

return statearr_37766;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__36898__auto__);
}));


var c__36895__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__36897__auto__ = (function (){var switch__36594__auto__ = (function (state_37807){
var state_val_37808 = (state_37807[(1)]);
if((state_val_37808 === (7))){
var inst_37803 = (state_37807[(2)]);
var state_37807__$1 = state_37807;
var statearr_37813_40829 = state_37807__$1;
(statearr_37813_40829[(2)] = inst_37803);

(statearr_37813_40829[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37808 === (20))){
var state_37807__$1 = state_37807;
var statearr_37814_40830 = state_37807__$1;
(statearr_37814_40830[(2)] = null);

(statearr_37814_40830[(1)] = (21));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37808 === (1))){
var state_37807__$1 = state_37807;
var statearr_37819_40831 = state_37807__$1;
(statearr_37819_40831[(2)] = null);

(statearr_37819_40831[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37808 === (4))){
var inst_37769 = (state_37807[(7)]);
var inst_37769__$1 = (state_37807[(2)]);
var inst_37770 = (inst_37769__$1 == null);
var state_37807__$1 = (function (){var statearr_37820 = state_37807;
(statearr_37820[(7)] = inst_37769__$1);

return statearr_37820;
})();
if(cljs.core.truth_(inst_37770)){
var statearr_37823_40832 = state_37807__$1;
(statearr_37823_40832[(1)] = (5));

} else {
var statearr_37828_40833 = state_37807__$1;
(statearr_37828_40833[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37808 === (15))){
var inst_37785 = (state_37807[(8)]);
var state_37807__$1 = state_37807;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_37807__$1,(18),to,inst_37785);
} else {
if((state_val_37808 === (21))){
var inst_37798 = (state_37807[(2)]);
var state_37807__$1 = state_37807;
var statearr_37829_40834 = state_37807__$1;
(statearr_37829_40834[(2)] = inst_37798);

(statearr_37829_40834[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37808 === (13))){
var inst_37800 = (state_37807[(2)]);
var state_37807__$1 = (function (){var statearr_37830 = state_37807;
(statearr_37830[(9)] = inst_37800);

return statearr_37830;
})();
var statearr_37831_40835 = state_37807__$1;
(statearr_37831_40835[(2)] = null);

(statearr_37831_40835[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37808 === (6))){
var inst_37769 = (state_37807[(7)]);
var state_37807__$1 = state_37807;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_37807__$1,(11),inst_37769);
} else {
if((state_val_37808 === (17))){
var inst_37793 = (state_37807[(2)]);
var state_37807__$1 = state_37807;
if(cljs.core.truth_(inst_37793)){
var statearr_37832_40839 = state_37807__$1;
(statearr_37832_40839[(1)] = (19));

} else {
var statearr_37833_40841 = state_37807__$1;
(statearr_37833_40841[(1)] = (20));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37808 === (3))){
var inst_37805 = (state_37807[(2)]);
var state_37807__$1 = state_37807;
return cljs.core.async.impl.ioc_helpers.return_chan(state_37807__$1,inst_37805);
} else {
if((state_val_37808 === (12))){
var inst_37782 = (state_37807[(10)]);
var state_37807__$1 = state_37807;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_37807__$1,(14),inst_37782);
} else {
if((state_val_37808 === (2))){
var state_37807__$1 = state_37807;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_37807__$1,(4),results);
} else {
if((state_val_37808 === (19))){
var state_37807__$1 = state_37807;
var statearr_37834_40844 = state_37807__$1;
(statearr_37834_40844[(2)] = null);

(statearr_37834_40844[(1)] = (12));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37808 === (11))){
var inst_37782 = (state_37807[(2)]);
var state_37807__$1 = (function (){var statearr_37835 = state_37807;
(statearr_37835[(10)] = inst_37782);

return statearr_37835;
})();
var statearr_37836_40845 = state_37807__$1;
(statearr_37836_40845[(2)] = null);

(statearr_37836_40845[(1)] = (12));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37808 === (9))){
var state_37807__$1 = state_37807;
var statearr_37837_40846 = state_37807__$1;
(statearr_37837_40846[(2)] = null);

(statearr_37837_40846[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37808 === (5))){
var state_37807__$1 = state_37807;
if(cljs.core.truth_(close_QMARK_)){
var statearr_37838_40847 = state_37807__$1;
(statearr_37838_40847[(1)] = (8));

} else {
var statearr_37839_40848 = state_37807__$1;
(statearr_37839_40848[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37808 === (14))){
var inst_37785 = (state_37807[(8)]);
var inst_37787 = (state_37807[(11)]);
var inst_37785__$1 = (state_37807[(2)]);
var inst_37786 = (inst_37785__$1 == null);
var inst_37787__$1 = cljs.core.not(inst_37786);
var state_37807__$1 = (function (){var statearr_37841 = state_37807;
(statearr_37841[(8)] = inst_37785__$1);

(statearr_37841[(11)] = inst_37787__$1);

return statearr_37841;
})();
if(inst_37787__$1){
var statearr_37844_40849 = state_37807__$1;
(statearr_37844_40849[(1)] = (15));

} else {
var statearr_37845_40850 = state_37807__$1;
(statearr_37845_40850[(1)] = (16));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37808 === (16))){
var inst_37787 = (state_37807[(11)]);
var state_37807__$1 = state_37807;
var statearr_37846_40852 = state_37807__$1;
(statearr_37846_40852[(2)] = inst_37787);

(statearr_37846_40852[(1)] = (17));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37808 === (10))){
var inst_37776 = (state_37807[(2)]);
var state_37807__$1 = state_37807;
var statearr_37847_40853 = state_37807__$1;
(statearr_37847_40853[(2)] = inst_37776);

(statearr_37847_40853[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37808 === (18))){
var inst_37790 = (state_37807[(2)]);
var state_37807__$1 = state_37807;
var statearr_37848_40854 = state_37807__$1;
(statearr_37848_40854[(2)] = inst_37790);

(statearr_37848_40854[(1)] = (17));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37808 === (8))){
var inst_37773 = cljs.core.async.close_BANG_(to);
var state_37807__$1 = state_37807;
var statearr_37849_40858 = state_37807__$1;
(statearr_37849_40858[(2)] = inst_37773);

(statearr_37849_40858[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var cljs$core$async$pipeline_STAR__$_state_machine__36595__auto__ = null;
var cljs$core$async$pipeline_STAR__$_state_machine__36595__auto____0 = (function (){
var statearr_37850 = [null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_37850[(0)] = cljs$core$async$pipeline_STAR__$_state_machine__36595__auto__);

(statearr_37850[(1)] = (1));

return statearr_37850;
});
var cljs$core$async$pipeline_STAR__$_state_machine__36595__auto____1 = (function (state_37807){
while(true){
var ret_value__36596__auto__ = (function (){try{while(true){
var result__36597__auto__ = switch__36594__auto__(state_37807);
if(cljs.core.keyword_identical_QMARK_(result__36597__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__36597__auto__;
}
break;
}
}catch (e37852){var ex__36598__auto__ = e37852;
var statearr_37853_40861 = state_37807;
(statearr_37853_40861[(2)] = ex__36598__auto__);


if(cljs.core.seq((state_37807[(4)]))){
var statearr_37854_40863 = state_37807;
(statearr_37854_40863[(1)] = cljs.core.first((state_37807[(4)])));

} else {
throw ex__36598__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__36596__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__40864 = state_37807;
state_37807 = G__40864;
continue;
} else {
return ret_value__36596__auto__;
}
break;
}
});
cljs$core$async$pipeline_STAR__$_state_machine__36595__auto__ = function(state_37807){
switch(arguments.length){
case 0:
return cljs$core$async$pipeline_STAR__$_state_machine__36595__auto____0.call(this);
case 1:
return cljs$core$async$pipeline_STAR__$_state_machine__36595__auto____1.call(this,state_37807);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$pipeline_STAR__$_state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$pipeline_STAR__$_state_machine__36595__auto____0;
cljs$core$async$pipeline_STAR__$_state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$pipeline_STAR__$_state_machine__36595__auto____1;
return cljs$core$async$pipeline_STAR__$_state_machine__36595__auto__;
})()
})();
var state__36898__auto__ = (function (){var statearr_37855 = f__36897__auto__();
(statearr_37855[(6)] = c__36895__auto__);

return statearr_37855;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__36898__auto__);
}));

return c__36895__auto__;
});
/**
 * Takes elements from the from channel and supplies them to the to
 *   channel, subject to the async function af, with parallelism n. af
 *   must be a function of two arguments, the first an input value and
 *   the second a channel on which to place the result(s). The
 *   presumption is that af will return immediately, having launched some
 *   asynchronous operation whose completion/callback will put results on
 *   the channel, then close! it. Outputs will be returned in order
 *   relative to the inputs. By default, the to channel will be closed
 *   when the from channel closes, but can be determined by the close?
 *   parameter. Will stop consuming the from channel if the to channel
 *   closes. See also pipeline, pipeline-blocking.
 */
cljs.core.async.pipeline_async = (function cljs$core$async$pipeline_async(var_args){
var G__37857 = arguments.length;
switch (G__37857) {
case 4:
return cljs.core.async.pipeline_async.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
case 5:
return cljs.core.async.pipeline_async.cljs$core$IFn$_invoke$arity$5((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.pipeline_async.cljs$core$IFn$_invoke$arity$4 = (function (n,to,af,from){
return cljs.core.async.pipeline_async.cljs$core$IFn$_invoke$arity$5(n,to,af,from,true);
}));

(cljs.core.async.pipeline_async.cljs$core$IFn$_invoke$arity$5 = (function (n,to,af,from,close_QMARK_){
return cljs.core.async.pipeline_STAR_(n,to,af,from,close_QMARK_,null,new cljs.core.Keyword(null,"async","async",1050769601));
}));

(cljs.core.async.pipeline_async.cljs$lang$maxFixedArity = 5);

/**
 * Takes elements from the from channel and supplies them to the to
 *   channel, subject to the transducer xf, with parallelism n. Because
 *   it is parallel, the transducer will be applied independently to each
 *   element, not across elements, and may produce zero or more outputs
 *   per input.  Outputs will be returned in order relative to the
 *   inputs. By default, the to channel will be closed when the from
 *   channel closes, but can be determined by the close?  parameter. Will
 *   stop consuming the from channel if the to channel closes.
 * 
 *   Note this is supplied for API compatibility with the Clojure version.
 *   Values of N > 1 will not result in actual concurrency in a
 *   single-threaded runtime.
 */
cljs.core.async.pipeline = (function cljs$core$async$pipeline(var_args){
var G__37878 = arguments.length;
switch (G__37878) {
case 4:
return cljs.core.async.pipeline.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
case 5:
return cljs.core.async.pipeline.cljs$core$IFn$_invoke$arity$5((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]));

break;
case 6:
return cljs.core.async.pipeline.cljs$core$IFn$_invoke$arity$6((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]),(arguments[(5)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.pipeline.cljs$core$IFn$_invoke$arity$4 = (function (n,to,xf,from){
return cljs.core.async.pipeline.cljs$core$IFn$_invoke$arity$5(n,to,xf,from,true);
}));

(cljs.core.async.pipeline.cljs$core$IFn$_invoke$arity$5 = (function (n,to,xf,from,close_QMARK_){
return cljs.core.async.pipeline.cljs$core$IFn$_invoke$arity$6(n,to,xf,from,close_QMARK_,null);
}));

(cljs.core.async.pipeline.cljs$core$IFn$_invoke$arity$6 = (function (n,to,xf,from,close_QMARK_,ex_handler){
return cljs.core.async.pipeline_STAR_(n,to,xf,from,close_QMARK_,ex_handler,new cljs.core.Keyword(null,"compute","compute",1555393130));
}));

(cljs.core.async.pipeline.cljs$lang$maxFixedArity = 6);

/**
 * Takes a predicate and a source channel and returns a vector of two
 *   channels, the first of which will contain the values for which the
 *   predicate returned true, the second those for which it returned
 *   false.
 * 
 *   The out channels will be unbuffered by default, or two buf-or-ns can
 *   be supplied. The channels will close after the source channel has
 *   closed.
 */
cljs.core.async.split = (function cljs$core$async$split(var_args){
var G__37884 = arguments.length;
switch (G__37884) {
case 2:
return cljs.core.async.split.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 4:
return cljs.core.async.split.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.split.cljs$core$IFn$_invoke$arity$2 = (function (p,ch){
return cljs.core.async.split.cljs$core$IFn$_invoke$arity$4(p,ch,null,null);
}));

(cljs.core.async.split.cljs$core$IFn$_invoke$arity$4 = (function (p,ch,t_buf_or_n,f_buf_or_n){
var tc = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1(t_buf_or_n);
var fc = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1(f_buf_or_n);
var c__36895__auto___40871 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__36897__auto__ = (function (){var switch__36594__auto__ = (function (state_37919){
var state_val_37920 = (state_37919[(1)]);
if((state_val_37920 === (7))){
var inst_37915 = (state_37919[(2)]);
var state_37919__$1 = state_37919;
var statearr_37925_40872 = state_37919__$1;
(statearr_37925_40872[(2)] = inst_37915);

(statearr_37925_40872[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37920 === (1))){
var state_37919__$1 = state_37919;
var statearr_37926_40874 = state_37919__$1;
(statearr_37926_40874[(2)] = null);

(statearr_37926_40874[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37920 === (4))){
var inst_37894 = (state_37919[(7)]);
var inst_37894__$1 = (state_37919[(2)]);
var inst_37895 = (inst_37894__$1 == null);
var state_37919__$1 = (function (){var statearr_37927 = state_37919;
(statearr_37927[(7)] = inst_37894__$1);

return statearr_37927;
})();
if(cljs.core.truth_(inst_37895)){
var statearr_37928_40875 = state_37919__$1;
(statearr_37928_40875[(1)] = (5));

} else {
var statearr_37929_40876 = state_37919__$1;
(statearr_37929_40876[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37920 === (13))){
var state_37919__$1 = state_37919;
var statearr_37930_40877 = state_37919__$1;
(statearr_37930_40877[(2)] = null);

(statearr_37930_40877[(1)] = (14));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37920 === (6))){
var inst_37894 = (state_37919[(7)]);
var inst_37900 = (p.cljs$core$IFn$_invoke$arity$1 ? p.cljs$core$IFn$_invoke$arity$1(inst_37894) : p.call(null,inst_37894));
var state_37919__$1 = state_37919;
if(cljs.core.truth_(inst_37900)){
var statearr_37931_40878 = state_37919__$1;
(statearr_37931_40878[(1)] = (9));

} else {
var statearr_37932_40879 = state_37919__$1;
(statearr_37932_40879[(1)] = (10));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37920 === (3))){
var inst_37917 = (state_37919[(2)]);
var state_37919__$1 = state_37919;
return cljs.core.async.impl.ioc_helpers.return_chan(state_37919__$1,inst_37917);
} else {
if((state_val_37920 === (12))){
var state_37919__$1 = state_37919;
var statearr_37935_40880 = state_37919__$1;
(statearr_37935_40880[(2)] = null);

(statearr_37935_40880[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37920 === (2))){
var state_37919__$1 = state_37919;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_37919__$1,(4),ch);
} else {
if((state_val_37920 === (11))){
var inst_37894 = (state_37919[(7)]);
var inst_37904 = (state_37919[(2)]);
var state_37919__$1 = state_37919;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_37919__$1,(8),inst_37904,inst_37894);
} else {
if((state_val_37920 === (9))){
var state_37919__$1 = state_37919;
var statearr_37936_40882 = state_37919__$1;
(statearr_37936_40882[(2)] = tc);

(statearr_37936_40882[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37920 === (5))){
var inst_37897 = cljs.core.async.close_BANG_(tc);
var inst_37898 = cljs.core.async.close_BANG_(fc);
var state_37919__$1 = (function (){var statearr_37941 = state_37919;
(statearr_37941[(8)] = inst_37897);

return statearr_37941;
})();
var statearr_37942_40883 = state_37919__$1;
(statearr_37942_40883[(2)] = inst_37898);

(statearr_37942_40883[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37920 === (14))){
var inst_37913 = (state_37919[(2)]);
var state_37919__$1 = state_37919;
var statearr_37943_40884 = state_37919__$1;
(statearr_37943_40884[(2)] = inst_37913);

(statearr_37943_40884[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37920 === (10))){
var state_37919__$1 = state_37919;
var statearr_37944_40885 = state_37919__$1;
(statearr_37944_40885[(2)] = fc);

(statearr_37944_40885[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_37920 === (8))){
var inst_37907 = (state_37919[(2)]);
var state_37919__$1 = state_37919;
if(cljs.core.truth_(inst_37907)){
var statearr_37946_40886 = state_37919__$1;
(statearr_37946_40886[(1)] = (12));

} else {
var statearr_37947_40887 = state_37919__$1;
(statearr_37947_40887[(1)] = (13));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var cljs$core$async$state_machine__36595__auto__ = null;
var cljs$core$async$state_machine__36595__auto____0 = (function (){
var statearr_37948 = [null,null,null,null,null,null,null,null,null];
(statearr_37948[(0)] = cljs$core$async$state_machine__36595__auto__);

(statearr_37948[(1)] = (1));

return statearr_37948;
});
var cljs$core$async$state_machine__36595__auto____1 = (function (state_37919){
while(true){
var ret_value__36596__auto__ = (function (){try{while(true){
var result__36597__auto__ = switch__36594__auto__(state_37919);
if(cljs.core.keyword_identical_QMARK_(result__36597__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__36597__auto__;
}
break;
}
}catch (e37949){var ex__36598__auto__ = e37949;
var statearr_37950_40889 = state_37919;
(statearr_37950_40889[(2)] = ex__36598__auto__);


if(cljs.core.seq((state_37919[(4)]))){
var statearr_37951_40890 = state_37919;
(statearr_37951_40890[(1)] = cljs.core.first((state_37919[(4)])));

} else {
throw ex__36598__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__36596__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__40892 = state_37919;
state_37919 = G__40892;
continue;
} else {
return ret_value__36596__auto__;
}
break;
}
});
cljs$core$async$state_machine__36595__auto__ = function(state_37919){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__36595__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__36595__auto____1.call(this,state_37919);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__36595__auto____0;
cljs$core$async$state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__36595__auto____1;
return cljs$core$async$state_machine__36595__auto__;
})()
})();
var state__36898__auto__ = (function (){var statearr_37968 = f__36897__auto__();
(statearr_37968[(6)] = c__36895__auto___40871);

return statearr_37968;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__36898__auto__);
}));


return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [tc,fc], null);
}));

(cljs.core.async.split.cljs$lang$maxFixedArity = 4);

/**
 * f should be a function of 2 arguments. Returns a channel containing
 *   the single result of applying f to init and the first item from the
 *   channel, then applying f to that result and the 2nd item, etc. If
 *   the channel closes without yielding items, returns init and f is not
 *   called. ch must close before reduce produces a result.
 */
cljs.core.async.reduce = (function cljs$core$async$reduce(f,init,ch){
var c__36895__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__36897__auto__ = (function (){var switch__36594__auto__ = (function (state_38011){
var state_val_38012 = (state_38011[(1)]);
if((state_val_38012 === (7))){
var inst_38007 = (state_38011[(2)]);
var state_38011__$1 = state_38011;
var statearr_38013_40894 = state_38011__$1;
(statearr_38013_40894[(2)] = inst_38007);

(statearr_38013_40894[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38012 === (1))){
var inst_37983 = init;
var inst_37986 = inst_37983;
var state_38011__$1 = (function (){var statearr_38015 = state_38011;
(statearr_38015[(7)] = inst_37986);

return statearr_38015;
})();
var statearr_38016_40896 = state_38011__$1;
(statearr_38016_40896[(2)] = null);

(statearr_38016_40896[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38012 === (4))){
var inst_37989 = (state_38011[(8)]);
var inst_37989__$1 = (state_38011[(2)]);
var inst_37990 = (inst_37989__$1 == null);
var state_38011__$1 = (function (){var statearr_38017 = state_38011;
(statearr_38017[(8)] = inst_37989__$1);

return statearr_38017;
})();
if(cljs.core.truth_(inst_37990)){
var statearr_38018_40898 = state_38011__$1;
(statearr_38018_40898[(1)] = (5));

} else {
var statearr_38020_40899 = state_38011__$1;
(statearr_38020_40899[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38012 === (6))){
var inst_37986 = (state_38011[(7)]);
var inst_37989 = (state_38011[(8)]);
var inst_37994 = (state_38011[(9)]);
var inst_37994__$1 = (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(inst_37986,inst_37989) : f.call(null,inst_37986,inst_37989));
var inst_37995 = cljs.core.reduced_QMARK_(inst_37994__$1);
var state_38011__$1 = (function (){var statearr_38024 = state_38011;
(statearr_38024[(9)] = inst_37994__$1);

return statearr_38024;
})();
if(inst_37995){
var statearr_38025_40902 = state_38011__$1;
(statearr_38025_40902[(1)] = (8));

} else {
var statearr_38026_40903 = state_38011__$1;
(statearr_38026_40903[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38012 === (3))){
var inst_38009 = (state_38011[(2)]);
var state_38011__$1 = state_38011;
return cljs.core.async.impl.ioc_helpers.return_chan(state_38011__$1,inst_38009);
} else {
if((state_val_38012 === (2))){
var state_38011__$1 = state_38011;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_38011__$1,(4),ch);
} else {
if((state_val_38012 === (9))){
var inst_37994 = (state_38011[(9)]);
var inst_37986 = inst_37994;
var state_38011__$1 = (function (){var statearr_38030 = state_38011;
(statearr_38030[(7)] = inst_37986);

return statearr_38030;
})();
var statearr_38031_40906 = state_38011__$1;
(statearr_38031_40906[(2)] = null);

(statearr_38031_40906[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38012 === (5))){
var inst_37986 = (state_38011[(7)]);
var state_38011__$1 = state_38011;
var statearr_38032_40908 = state_38011__$1;
(statearr_38032_40908[(2)] = inst_37986);

(statearr_38032_40908[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38012 === (10))){
var inst_38002 = (state_38011[(2)]);
var state_38011__$1 = state_38011;
var statearr_38037_40909 = state_38011__$1;
(statearr_38037_40909[(2)] = inst_38002);

(statearr_38037_40909[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38012 === (8))){
var inst_37994 = (state_38011[(9)]);
var inst_37998 = cljs.core.deref(inst_37994);
var state_38011__$1 = state_38011;
var statearr_38038_40911 = state_38011__$1;
(statearr_38038_40911[(2)] = inst_37998);

(statearr_38038_40911[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var cljs$core$async$reduce_$_state_machine__36595__auto__ = null;
var cljs$core$async$reduce_$_state_machine__36595__auto____0 = (function (){
var statearr_38043 = [null,null,null,null,null,null,null,null,null,null];
(statearr_38043[(0)] = cljs$core$async$reduce_$_state_machine__36595__auto__);

(statearr_38043[(1)] = (1));

return statearr_38043;
});
var cljs$core$async$reduce_$_state_machine__36595__auto____1 = (function (state_38011){
while(true){
var ret_value__36596__auto__ = (function (){try{while(true){
var result__36597__auto__ = switch__36594__auto__(state_38011);
if(cljs.core.keyword_identical_QMARK_(result__36597__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__36597__auto__;
}
break;
}
}catch (e38044){var ex__36598__auto__ = e38044;
var statearr_38045_40923 = state_38011;
(statearr_38045_40923[(2)] = ex__36598__auto__);


if(cljs.core.seq((state_38011[(4)]))){
var statearr_38046_40924 = state_38011;
(statearr_38046_40924[(1)] = cljs.core.first((state_38011[(4)])));

} else {
throw ex__36598__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__36596__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__40926 = state_38011;
state_38011 = G__40926;
continue;
} else {
return ret_value__36596__auto__;
}
break;
}
});
cljs$core$async$reduce_$_state_machine__36595__auto__ = function(state_38011){
switch(arguments.length){
case 0:
return cljs$core$async$reduce_$_state_machine__36595__auto____0.call(this);
case 1:
return cljs$core$async$reduce_$_state_machine__36595__auto____1.call(this,state_38011);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$reduce_$_state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$reduce_$_state_machine__36595__auto____0;
cljs$core$async$reduce_$_state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$reduce_$_state_machine__36595__auto____1;
return cljs$core$async$reduce_$_state_machine__36595__auto__;
})()
})();
var state__36898__auto__ = (function (){var statearr_38048 = f__36897__auto__();
(statearr_38048[(6)] = c__36895__auto__);

return statearr_38048;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__36898__auto__);
}));

return c__36895__auto__;
});
/**
 * async/reduces a channel with a transformation (xform f).
 *   Returns a channel containing the result.  ch must close before
 *   transduce produces a result.
 */
cljs.core.async.transduce = (function cljs$core$async$transduce(xform,f,init,ch){
var f__$1 = (xform.cljs$core$IFn$_invoke$arity$1 ? xform.cljs$core$IFn$_invoke$arity$1(f) : xform.call(null,f));
var c__36895__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__36897__auto__ = (function (){var switch__36594__auto__ = (function (state_38056){
var state_val_38057 = (state_38056[(1)]);
if((state_val_38057 === (1))){
var inst_38051 = cljs.core.async.reduce(f__$1,init,ch);
var state_38056__$1 = state_38056;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_38056__$1,(2),inst_38051);
} else {
if((state_val_38057 === (2))){
var inst_38053 = (state_38056[(2)]);
var inst_38054 = (f__$1.cljs$core$IFn$_invoke$arity$1 ? f__$1.cljs$core$IFn$_invoke$arity$1(inst_38053) : f__$1.call(null,inst_38053));
var state_38056__$1 = state_38056;
return cljs.core.async.impl.ioc_helpers.return_chan(state_38056__$1,inst_38054);
} else {
return null;
}
}
});
return (function() {
var cljs$core$async$transduce_$_state_machine__36595__auto__ = null;
var cljs$core$async$transduce_$_state_machine__36595__auto____0 = (function (){
var statearr_38065 = [null,null,null,null,null,null,null];
(statearr_38065[(0)] = cljs$core$async$transduce_$_state_machine__36595__auto__);

(statearr_38065[(1)] = (1));

return statearr_38065;
});
var cljs$core$async$transduce_$_state_machine__36595__auto____1 = (function (state_38056){
while(true){
var ret_value__36596__auto__ = (function (){try{while(true){
var result__36597__auto__ = switch__36594__auto__(state_38056);
if(cljs.core.keyword_identical_QMARK_(result__36597__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__36597__auto__;
}
break;
}
}catch (e38066){var ex__36598__auto__ = e38066;
var statearr_38068_40935 = state_38056;
(statearr_38068_40935[(2)] = ex__36598__auto__);


if(cljs.core.seq((state_38056[(4)]))){
var statearr_38069_40936 = state_38056;
(statearr_38069_40936[(1)] = cljs.core.first((state_38056[(4)])));

} else {
throw ex__36598__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__36596__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__40938 = state_38056;
state_38056 = G__40938;
continue;
} else {
return ret_value__36596__auto__;
}
break;
}
});
cljs$core$async$transduce_$_state_machine__36595__auto__ = function(state_38056){
switch(arguments.length){
case 0:
return cljs$core$async$transduce_$_state_machine__36595__auto____0.call(this);
case 1:
return cljs$core$async$transduce_$_state_machine__36595__auto____1.call(this,state_38056);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$transduce_$_state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$transduce_$_state_machine__36595__auto____0;
cljs$core$async$transduce_$_state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$transduce_$_state_machine__36595__auto____1;
return cljs$core$async$transduce_$_state_machine__36595__auto__;
})()
})();
var state__36898__auto__ = (function (){var statearr_38073 = f__36897__auto__();
(statearr_38073[(6)] = c__36895__auto__);

return statearr_38073;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__36898__auto__);
}));

return c__36895__auto__;
});
/**
 * Puts the contents of coll into the supplied channel.
 * 
 *   By default the channel will be closed after the items are copied,
 *   but can be determined by the close? parameter.
 * 
 *   Returns a channel which will close after the items are copied.
 */
cljs.core.async.onto_chan_BANG_ = (function cljs$core$async$onto_chan_BANG_(var_args){
var G__38077 = arguments.length;
switch (G__38077) {
case 2:
return cljs.core.async.onto_chan_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.core.async.onto_chan_BANG_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.onto_chan_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (ch,coll){
return cljs.core.async.onto_chan_BANG_.cljs$core$IFn$_invoke$arity$3(ch,coll,true);
}));

(cljs.core.async.onto_chan_BANG_.cljs$core$IFn$_invoke$arity$3 = (function (ch,coll,close_QMARK_){
var c__36895__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__36897__auto__ = (function (){var switch__36594__auto__ = (function (state_38106){
var state_val_38107 = (state_38106[(1)]);
if((state_val_38107 === (7))){
var inst_38088 = (state_38106[(2)]);
var state_38106__$1 = state_38106;
var statearr_38108_40940 = state_38106__$1;
(statearr_38108_40940[(2)] = inst_38088);

(statearr_38108_40940[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38107 === (1))){
var inst_38082 = cljs.core.seq(coll);
var inst_38083 = inst_38082;
var state_38106__$1 = (function (){var statearr_38109 = state_38106;
(statearr_38109[(7)] = inst_38083);

return statearr_38109;
})();
var statearr_38111_40941 = state_38106__$1;
(statearr_38111_40941[(2)] = null);

(statearr_38111_40941[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38107 === (4))){
var inst_38083 = (state_38106[(7)]);
var inst_38086 = cljs.core.first(inst_38083);
var state_38106__$1 = state_38106;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_38106__$1,(7),ch,inst_38086);
} else {
if((state_val_38107 === (13))){
var inst_38100 = (state_38106[(2)]);
var state_38106__$1 = state_38106;
var statearr_38112_40944 = state_38106__$1;
(statearr_38112_40944[(2)] = inst_38100);

(statearr_38112_40944[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38107 === (6))){
var inst_38091 = (state_38106[(2)]);
var state_38106__$1 = state_38106;
if(cljs.core.truth_(inst_38091)){
var statearr_38113_40948 = state_38106__$1;
(statearr_38113_40948[(1)] = (8));

} else {
var statearr_38114_40949 = state_38106__$1;
(statearr_38114_40949[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38107 === (3))){
var inst_38104 = (state_38106[(2)]);
var state_38106__$1 = state_38106;
return cljs.core.async.impl.ioc_helpers.return_chan(state_38106__$1,inst_38104);
} else {
if((state_val_38107 === (12))){
var state_38106__$1 = state_38106;
var statearr_38115_40951 = state_38106__$1;
(statearr_38115_40951[(2)] = null);

(statearr_38115_40951[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38107 === (2))){
var inst_38083 = (state_38106[(7)]);
var state_38106__$1 = state_38106;
if(cljs.core.truth_(inst_38083)){
var statearr_38116_40952 = state_38106__$1;
(statearr_38116_40952[(1)] = (4));

} else {
var statearr_38118_40953 = state_38106__$1;
(statearr_38118_40953[(1)] = (5));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38107 === (11))){
var inst_38097 = cljs.core.async.close_BANG_(ch);
var state_38106__$1 = state_38106;
var statearr_38120_40957 = state_38106__$1;
(statearr_38120_40957[(2)] = inst_38097);

(statearr_38120_40957[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38107 === (9))){
var state_38106__$1 = state_38106;
if(cljs.core.truth_(close_QMARK_)){
var statearr_38122_40960 = state_38106__$1;
(statearr_38122_40960[(1)] = (11));

} else {
var statearr_38123_40961 = state_38106__$1;
(statearr_38123_40961[(1)] = (12));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38107 === (5))){
var inst_38083 = (state_38106[(7)]);
var state_38106__$1 = state_38106;
var statearr_38124_40962 = state_38106__$1;
(statearr_38124_40962[(2)] = inst_38083);

(statearr_38124_40962[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38107 === (10))){
var inst_38102 = (state_38106[(2)]);
var state_38106__$1 = state_38106;
var statearr_38125_40963 = state_38106__$1;
(statearr_38125_40963[(2)] = inst_38102);

(statearr_38125_40963[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38107 === (8))){
var inst_38083 = (state_38106[(7)]);
var inst_38093 = cljs.core.next(inst_38083);
var inst_38083__$1 = inst_38093;
var state_38106__$1 = (function (){var statearr_38126 = state_38106;
(statearr_38126[(7)] = inst_38083__$1);

return statearr_38126;
})();
var statearr_38127_40964 = state_38106__$1;
(statearr_38127_40964[(2)] = null);

(statearr_38127_40964[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var cljs$core$async$state_machine__36595__auto__ = null;
var cljs$core$async$state_machine__36595__auto____0 = (function (){
var statearr_38130 = [null,null,null,null,null,null,null,null];
(statearr_38130[(0)] = cljs$core$async$state_machine__36595__auto__);

(statearr_38130[(1)] = (1));

return statearr_38130;
});
var cljs$core$async$state_machine__36595__auto____1 = (function (state_38106){
while(true){
var ret_value__36596__auto__ = (function (){try{while(true){
var result__36597__auto__ = switch__36594__auto__(state_38106);
if(cljs.core.keyword_identical_QMARK_(result__36597__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__36597__auto__;
}
break;
}
}catch (e38132){var ex__36598__auto__ = e38132;
var statearr_38133_40974 = state_38106;
(statearr_38133_40974[(2)] = ex__36598__auto__);


if(cljs.core.seq((state_38106[(4)]))){
var statearr_38134_40975 = state_38106;
(statearr_38134_40975[(1)] = cljs.core.first((state_38106[(4)])));

} else {
throw ex__36598__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__36596__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__40980 = state_38106;
state_38106 = G__40980;
continue;
} else {
return ret_value__36596__auto__;
}
break;
}
});
cljs$core$async$state_machine__36595__auto__ = function(state_38106){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__36595__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__36595__auto____1.call(this,state_38106);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__36595__auto____0;
cljs$core$async$state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__36595__auto____1;
return cljs$core$async$state_machine__36595__auto__;
})()
})();
var state__36898__auto__ = (function (){var statearr_38136 = f__36897__auto__();
(statearr_38136[(6)] = c__36895__auto__);

return statearr_38136;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__36898__auto__);
}));

return c__36895__auto__;
}));

(cljs.core.async.onto_chan_BANG_.cljs$lang$maxFixedArity = 3);

/**
 * Creates and returns a channel which contains the contents of coll,
 *   closing when exhausted.
 */
cljs.core.async.to_chan_BANG_ = (function cljs$core$async$to_chan_BANG_(coll){
var ch = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1(cljs.core.bounded_count((100),coll));
cljs.core.async.onto_chan_BANG_.cljs$core$IFn$_invoke$arity$2(ch,coll);

return ch;
});
/**
 * Deprecated - use onto-chan!
 */
cljs.core.async.onto_chan = (function cljs$core$async$onto_chan(var_args){
var G__38138 = arguments.length;
switch (G__38138) {
case 2:
return cljs.core.async.onto_chan.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.core.async.onto_chan.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.onto_chan.cljs$core$IFn$_invoke$arity$2 = (function (ch,coll){
return cljs.core.async.onto_chan_BANG_.cljs$core$IFn$_invoke$arity$3(ch,coll,true);
}));

(cljs.core.async.onto_chan.cljs$core$IFn$_invoke$arity$3 = (function (ch,coll,close_QMARK_){
return cljs.core.async.onto_chan_BANG_.cljs$core$IFn$_invoke$arity$3(ch,coll,close_QMARK_);
}));

(cljs.core.async.onto_chan.cljs$lang$maxFixedArity = 3);

/**
 * Deprecated - use to-chan!
 */
cljs.core.async.to_chan = (function cljs$core$async$to_chan(coll){
return cljs.core.async.to_chan_BANG_(coll);
});

/**
 * @interface
 */
cljs.core.async.Mux = function(){};

var cljs$core$async$Mux$muxch_STAR_$dyn_40987 = (function (_){
var x__5350__auto__ = (((_ == null))?null:_);
var m__5351__auto__ = (cljs.core.async.muxch_STAR_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(_) : m__5351__auto__.call(null,_));
} else {
var m__5349__auto__ = (cljs.core.async.muxch_STAR_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(_) : m__5349__auto__.call(null,_));
} else {
throw cljs.core.missing_protocol("Mux.muxch*",_);
}
}
});
cljs.core.async.muxch_STAR_ = (function cljs$core$async$muxch_STAR_(_){
if((((!((_ == null)))) && ((!((_.cljs$core$async$Mux$muxch_STAR_$arity$1 == null)))))){
return _.cljs$core$async$Mux$muxch_STAR_$arity$1(_);
} else {
return cljs$core$async$Mux$muxch_STAR_$dyn_40987(_);
}
});


/**
 * @interface
 */
cljs.core.async.Mult = function(){};

var cljs$core$async$Mult$tap_STAR_$dyn_40988 = (function (m,ch,close_QMARK_){
var x__5350__auto__ = (((m == null))?null:m);
var m__5351__auto__ = (cljs.core.async.tap_STAR_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(m,ch,close_QMARK_) : m__5351__auto__.call(null,m,ch,close_QMARK_));
} else {
var m__5349__auto__ = (cljs.core.async.tap_STAR_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(m,ch,close_QMARK_) : m__5349__auto__.call(null,m,ch,close_QMARK_));
} else {
throw cljs.core.missing_protocol("Mult.tap*",m);
}
}
});
cljs.core.async.tap_STAR_ = (function cljs$core$async$tap_STAR_(m,ch,close_QMARK_){
if((((!((m == null)))) && ((!((m.cljs$core$async$Mult$tap_STAR_$arity$3 == null)))))){
return m.cljs$core$async$Mult$tap_STAR_$arity$3(m,ch,close_QMARK_);
} else {
return cljs$core$async$Mult$tap_STAR_$dyn_40988(m,ch,close_QMARK_);
}
});

var cljs$core$async$Mult$untap_STAR_$dyn_40989 = (function (m,ch){
var x__5350__auto__ = (((m == null))?null:m);
var m__5351__auto__ = (cljs.core.async.untap_STAR_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(m,ch) : m__5351__auto__.call(null,m,ch));
} else {
var m__5349__auto__ = (cljs.core.async.untap_STAR_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(m,ch) : m__5349__auto__.call(null,m,ch));
} else {
throw cljs.core.missing_protocol("Mult.untap*",m);
}
}
});
cljs.core.async.untap_STAR_ = (function cljs$core$async$untap_STAR_(m,ch){
if((((!((m == null)))) && ((!((m.cljs$core$async$Mult$untap_STAR_$arity$2 == null)))))){
return m.cljs$core$async$Mult$untap_STAR_$arity$2(m,ch);
} else {
return cljs$core$async$Mult$untap_STAR_$dyn_40989(m,ch);
}
});

var cljs$core$async$Mult$untap_all_STAR_$dyn_40996 = (function (m){
var x__5350__auto__ = (((m == null))?null:m);
var m__5351__auto__ = (cljs.core.async.untap_all_STAR_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(m) : m__5351__auto__.call(null,m));
} else {
var m__5349__auto__ = (cljs.core.async.untap_all_STAR_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(m) : m__5349__auto__.call(null,m));
} else {
throw cljs.core.missing_protocol("Mult.untap-all*",m);
}
}
});
cljs.core.async.untap_all_STAR_ = (function cljs$core$async$untap_all_STAR_(m){
if((((!((m == null)))) && ((!((m.cljs$core$async$Mult$untap_all_STAR_$arity$1 == null)))))){
return m.cljs$core$async$Mult$untap_all_STAR_$arity$1(m);
} else {
return cljs$core$async$Mult$untap_all_STAR_$dyn_40996(m);
}
});


/**
* @constructor
 * @implements {cljs.core.async.Mult}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.async.Mux}
 * @implements {cljs.core.IWithMeta}
*/
cljs.core.async.t_cljs$core$async38188 = (function (ch,cs,meta38189){
this.ch = ch;
this.cs = cs;
this.meta38189 = meta38189;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async38188.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_38190,meta38189__$1){
var self__ = this;
var _38190__$1 = this;
return (new cljs.core.async.t_cljs$core$async38188(self__.ch,self__.cs,meta38189__$1));
}));

(cljs.core.async.t_cljs$core$async38188.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_38190){
var self__ = this;
var _38190__$1 = this;
return self__.meta38189;
}));

(cljs.core.async.t_cljs$core$async38188.prototype.cljs$core$async$Mux$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async38188.prototype.cljs$core$async$Mux$muxch_STAR_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return self__.ch;
}));

(cljs.core.async.t_cljs$core$async38188.prototype.cljs$core$async$Mult$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async38188.prototype.cljs$core$async$Mult$tap_STAR_$arity$3 = (function (_,ch__$1,close_QMARK_){
var self__ = this;
var ___$1 = this;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(self__.cs,cljs.core.assoc,ch__$1,close_QMARK_);

return null;
}));

(cljs.core.async.t_cljs$core$async38188.prototype.cljs$core$async$Mult$untap_STAR_$arity$2 = (function (_,ch__$1){
var self__ = this;
var ___$1 = this;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(self__.cs,cljs.core.dissoc,ch__$1);

return null;
}));

(cljs.core.async.t_cljs$core$async38188.prototype.cljs$core$async$Mult$untap_all_STAR_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
cljs.core.reset_BANG_(self__.cs,cljs.core.PersistentArrayMap.EMPTY);

return null;
}));

(cljs.core.async.t_cljs$core$async38188.getBasis = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"ch","ch",1085813622,null),new cljs.core.Symbol(null,"cs","cs",-117024463,null),new cljs.core.Symbol(null,"meta38189","meta38189",-1891240713,null)], null);
}));

(cljs.core.async.t_cljs$core$async38188.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async38188.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async38188");

(cljs.core.async.t_cljs$core$async38188.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async38188");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async38188.
 */
cljs.core.async.__GT_t_cljs$core$async38188 = (function cljs$core$async$__GT_t_cljs$core$async38188(ch,cs,meta38189){
return (new cljs.core.async.t_cljs$core$async38188(ch,cs,meta38189));
});


/**
 * Creates and returns a mult(iple) of the supplied channel. Channels
 *   containing copies of the channel can be created with 'tap', and
 *   detached with 'untap'.
 * 
 *   Each item is distributed to all taps in parallel and synchronously,
 *   i.e. each tap must accept before the next item is distributed. Use
 *   buffering/windowing to prevent slow taps from holding up the mult.
 * 
 *   Items received when there are no taps get dropped.
 * 
 *   If a tap puts to a closed channel, it will be removed from the mult.
 */
cljs.core.async.mult = (function cljs$core$async$mult(ch){
var cs = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var m = (new cljs.core.async.t_cljs$core$async38188(ch,cs,cljs.core.PersistentArrayMap.EMPTY));
var dchan = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
var dctr = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
var done = (function (_){
if((cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(dctr,cljs.core.dec) === (0))){
return cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$2(dchan,true);
} else {
return null;
}
});
var c__36895__auto___41000 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__36897__auto__ = (function (){var switch__36594__auto__ = (function (state_38463){
var state_val_38466 = (state_38463[(1)]);
if((state_val_38466 === (7))){
var inst_38446 = (state_38463[(2)]);
var state_38463__$1 = state_38463;
var statearr_38490_41003 = state_38463__$1;
(statearr_38490_41003[(2)] = inst_38446);

(statearr_38490_41003[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (20))){
var inst_38270 = (state_38463[(7)]);
var inst_38290 = cljs.core.first(inst_38270);
var inst_38295 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_38290,(0),null);
var inst_38296 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_38290,(1),null);
var state_38463__$1 = (function (){var statearr_38497 = state_38463;
(statearr_38497[(8)] = inst_38295);

return statearr_38497;
})();
if(cljs.core.truth_(inst_38296)){
var statearr_38500_41004 = state_38463__$1;
(statearr_38500_41004[(1)] = (22));

} else {
var statearr_38501_41005 = state_38463__$1;
(statearr_38501_41005[(1)] = (23));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (27))){
var inst_38346 = (state_38463[(9)]);
var inst_38348 = (state_38463[(10)]);
var inst_38362 = (state_38463[(11)]);
var inst_38216 = (state_38463[(12)]);
var inst_38362__$1 = cljs.core._nth(inst_38346,inst_38348);
var inst_38363 = cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$3(inst_38362__$1,inst_38216,done);
var state_38463__$1 = (function (){var statearr_38512 = state_38463;
(statearr_38512[(11)] = inst_38362__$1);

return statearr_38512;
})();
if(cljs.core.truth_(inst_38363)){
var statearr_38515_41006 = state_38463__$1;
(statearr_38515_41006[(1)] = (30));

} else {
var statearr_38517_41007 = state_38463__$1;
(statearr_38517_41007[(1)] = (31));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (1))){
var state_38463__$1 = state_38463;
var statearr_38521_41008 = state_38463__$1;
(statearr_38521_41008[(2)] = null);

(statearr_38521_41008[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (24))){
var inst_38270 = (state_38463[(7)]);
var inst_38305 = (state_38463[(2)]);
var inst_38306 = cljs.core.next(inst_38270);
var inst_38226 = inst_38306;
var inst_38227 = null;
var inst_38228 = (0);
var inst_38229 = (0);
var state_38463__$1 = (function (){var statearr_38528 = state_38463;
(statearr_38528[(13)] = inst_38305);

(statearr_38528[(14)] = inst_38226);

(statearr_38528[(15)] = inst_38227);

(statearr_38528[(16)] = inst_38228);

(statearr_38528[(17)] = inst_38229);

return statearr_38528;
})();
var statearr_38529_41010 = state_38463__$1;
(statearr_38529_41010[(2)] = null);

(statearr_38529_41010[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (39))){
var state_38463__$1 = state_38463;
var statearr_38540_41011 = state_38463__$1;
(statearr_38540_41011[(2)] = null);

(statearr_38540_41011[(1)] = (41));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (4))){
var inst_38216 = (state_38463[(12)]);
var inst_38216__$1 = (state_38463[(2)]);
var inst_38218 = (inst_38216__$1 == null);
var state_38463__$1 = (function (){var statearr_38542 = state_38463;
(statearr_38542[(12)] = inst_38216__$1);

return statearr_38542;
})();
if(cljs.core.truth_(inst_38218)){
var statearr_38544_41013 = state_38463__$1;
(statearr_38544_41013[(1)] = (5));

} else {
var statearr_38546_41015 = state_38463__$1;
(statearr_38546_41015[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (15))){
var inst_38229 = (state_38463[(17)]);
var inst_38226 = (state_38463[(14)]);
var inst_38227 = (state_38463[(15)]);
var inst_38228 = (state_38463[(16)]);
var inst_38258 = (state_38463[(2)]);
var inst_38263 = (inst_38229 + (1));
var tmp38532 = inst_38228;
var tmp38533 = inst_38227;
var tmp38534 = inst_38226;
var inst_38226__$1 = tmp38534;
var inst_38227__$1 = tmp38533;
var inst_38228__$1 = tmp38532;
var inst_38229__$1 = inst_38263;
var state_38463__$1 = (function (){var statearr_38552 = state_38463;
(statearr_38552[(18)] = inst_38258);

(statearr_38552[(14)] = inst_38226__$1);

(statearr_38552[(15)] = inst_38227__$1);

(statearr_38552[(16)] = inst_38228__$1);

(statearr_38552[(17)] = inst_38229__$1);

return statearr_38552;
})();
var statearr_38560_41018 = state_38463__$1;
(statearr_38560_41018[(2)] = null);

(statearr_38560_41018[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (21))){
var inst_38310 = (state_38463[(2)]);
var state_38463__$1 = state_38463;
var statearr_38567_41019 = state_38463__$1;
(statearr_38567_41019[(2)] = inst_38310);

(statearr_38567_41019[(1)] = (18));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (31))){
var inst_38362 = (state_38463[(11)]);
var inst_38369 = m.cljs$core$async$Mult$untap_STAR_$arity$2(null,inst_38362);
var state_38463__$1 = state_38463;
var statearr_38577_41021 = state_38463__$1;
(statearr_38577_41021[(2)] = inst_38369);

(statearr_38577_41021[(1)] = (32));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (32))){
var inst_38348 = (state_38463[(10)]);
var inst_38345 = (state_38463[(19)]);
var inst_38346 = (state_38463[(9)]);
var inst_38347 = (state_38463[(20)]);
var inst_38371 = (state_38463[(2)]);
var inst_38376 = (inst_38348 + (1));
var tmp38562 = inst_38347;
var tmp38563 = inst_38346;
var tmp38564 = inst_38345;
var inst_38345__$1 = tmp38564;
var inst_38346__$1 = tmp38563;
var inst_38347__$1 = tmp38562;
var inst_38348__$1 = inst_38376;
var state_38463__$1 = (function (){var statearr_38590 = state_38463;
(statearr_38590[(21)] = inst_38371);

(statearr_38590[(19)] = inst_38345__$1);

(statearr_38590[(9)] = inst_38346__$1);

(statearr_38590[(20)] = inst_38347__$1);

(statearr_38590[(10)] = inst_38348__$1);

return statearr_38590;
})();
var statearr_38592_41026 = state_38463__$1;
(statearr_38592_41026[(2)] = null);

(statearr_38592_41026[(1)] = (25));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (40))){
var inst_38396 = (state_38463[(22)]);
var inst_38400 = m.cljs$core$async$Mult$untap_STAR_$arity$2(null,inst_38396);
var state_38463__$1 = state_38463;
var statearr_38596_41027 = state_38463__$1;
(statearr_38596_41027[(2)] = inst_38400);

(statearr_38596_41027[(1)] = (41));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (33))){
var inst_38381 = (state_38463[(23)]);
var inst_38385 = cljs.core.chunked_seq_QMARK_(inst_38381);
var state_38463__$1 = state_38463;
if(inst_38385){
var statearr_38598_41030 = state_38463__$1;
(statearr_38598_41030[(1)] = (36));

} else {
var statearr_38599_41031 = state_38463__$1;
(statearr_38599_41031[(1)] = (37));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (13))){
var inst_38249 = (state_38463[(24)]);
var inst_38255 = cljs.core.async.close_BANG_(inst_38249);
var state_38463__$1 = state_38463;
var statearr_38605_41032 = state_38463__$1;
(statearr_38605_41032[(2)] = inst_38255);

(statearr_38605_41032[(1)] = (15));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (22))){
var inst_38295 = (state_38463[(8)]);
var inst_38302 = cljs.core.async.close_BANG_(inst_38295);
var state_38463__$1 = state_38463;
var statearr_38609_41036 = state_38463__$1;
(statearr_38609_41036[(2)] = inst_38302);

(statearr_38609_41036[(1)] = (24));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (36))){
var inst_38381 = (state_38463[(23)]);
var inst_38390 = cljs.core.chunk_first(inst_38381);
var inst_38391 = cljs.core.chunk_rest(inst_38381);
var inst_38392 = cljs.core.count(inst_38390);
var inst_38345 = inst_38391;
var inst_38346 = inst_38390;
var inst_38347 = inst_38392;
var inst_38348 = (0);
var state_38463__$1 = (function (){var statearr_38614 = state_38463;
(statearr_38614[(19)] = inst_38345);

(statearr_38614[(9)] = inst_38346);

(statearr_38614[(20)] = inst_38347);

(statearr_38614[(10)] = inst_38348);

return statearr_38614;
})();
var statearr_38615_41037 = state_38463__$1;
(statearr_38615_41037[(2)] = null);

(statearr_38615_41037[(1)] = (25));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (41))){
var inst_38381 = (state_38463[(23)]);
var inst_38402 = (state_38463[(2)]);
var inst_38403 = cljs.core.next(inst_38381);
var inst_38345 = inst_38403;
var inst_38346 = null;
var inst_38347 = (0);
var inst_38348 = (0);
var state_38463__$1 = (function (){var statearr_38617 = state_38463;
(statearr_38617[(25)] = inst_38402);

(statearr_38617[(19)] = inst_38345);

(statearr_38617[(9)] = inst_38346);

(statearr_38617[(20)] = inst_38347);

(statearr_38617[(10)] = inst_38348);

return statearr_38617;
})();
var statearr_38620_41039 = state_38463__$1;
(statearr_38620_41039[(2)] = null);

(statearr_38620_41039[(1)] = (25));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (43))){
var state_38463__$1 = state_38463;
var statearr_38621_41040 = state_38463__$1;
(statearr_38621_41040[(2)] = null);

(statearr_38621_41040[(1)] = (44));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (29))){
var inst_38421 = (state_38463[(2)]);
var state_38463__$1 = state_38463;
var statearr_38622_41041 = state_38463__$1;
(statearr_38622_41041[(2)] = inst_38421);

(statearr_38622_41041[(1)] = (26));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (44))){
var inst_38443 = (state_38463[(2)]);
var state_38463__$1 = (function (){var statearr_38624 = state_38463;
(statearr_38624[(26)] = inst_38443);

return statearr_38624;
})();
var statearr_38625_41042 = state_38463__$1;
(statearr_38625_41042[(2)] = null);

(statearr_38625_41042[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (6))){
var inst_38335 = (state_38463[(27)]);
var inst_38334 = cljs.core.deref(cs);
var inst_38335__$1 = cljs.core.keys(inst_38334);
var inst_38336 = cljs.core.count(inst_38335__$1);
var inst_38337 = cljs.core.reset_BANG_(dctr,inst_38336);
var inst_38344 = cljs.core.seq(inst_38335__$1);
var inst_38345 = inst_38344;
var inst_38346 = null;
var inst_38347 = (0);
var inst_38348 = (0);
var state_38463__$1 = (function (){var statearr_38626 = state_38463;
(statearr_38626[(27)] = inst_38335__$1);

(statearr_38626[(28)] = inst_38337);

(statearr_38626[(19)] = inst_38345);

(statearr_38626[(9)] = inst_38346);

(statearr_38626[(20)] = inst_38347);

(statearr_38626[(10)] = inst_38348);

return statearr_38626;
})();
var statearr_38634_41056 = state_38463__$1;
(statearr_38634_41056[(2)] = null);

(statearr_38634_41056[(1)] = (25));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (28))){
var inst_38345 = (state_38463[(19)]);
var inst_38381 = (state_38463[(23)]);
var inst_38381__$1 = cljs.core.seq(inst_38345);
var state_38463__$1 = (function (){var statearr_38637 = state_38463;
(statearr_38637[(23)] = inst_38381__$1);

return statearr_38637;
})();
if(inst_38381__$1){
var statearr_38638_41057 = state_38463__$1;
(statearr_38638_41057[(1)] = (33));

} else {
var statearr_38640_41058 = state_38463__$1;
(statearr_38640_41058[(1)] = (34));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (25))){
var inst_38348 = (state_38463[(10)]);
var inst_38347 = (state_38463[(20)]);
var inst_38356 = (inst_38348 < inst_38347);
var inst_38358 = inst_38356;
var state_38463__$1 = state_38463;
if(cljs.core.truth_(inst_38358)){
var statearr_38644_41060 = state_38463__$1;
(statearr_38644_41060[(1)] = (27));

} else {
var statearr_38646_41061 = state_38463__$1;
(statearr_38646_41061[(1)] = (28));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (34))){
var state_38463__$1 = state_38463;
var statearr_38647_41062 = state_38463__$1;
(statearr_38647_41062[(2)] = null);

(statearr_38647_41062[(1)] = (35));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (17))){
var state_38463__$1 = state_38463;
var statearr_38653_41063 = state_38463__$1;
(statearr_38653_41063[(2)] = null);

(statearr_38653_41063[(1)] = (18));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (3))){
var inst_38449 = (state_38463[(2)]);
var state_38463__$1 = state_38463;
return cljs.core.async.impl.ioc_helpers.return_chan(state_38463__$1,inst_38449);
} else {
if((state_val_38466 === (12))){
var inst_38316 = (state_38463[(2)]);
var state_38463__$1 = state_38463;
var statearr_38662_41064 = state_38463__$1;
(statearr_38662_41064[(2)] = inst_38316);

(statearr_38662_41064[(1)] = (9));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (2))){
var state_38463__$1 = state_38463;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_38463__$1,(4),ch);
} else {
if((state_val_38466 === (23))){
var state_38463__$1 = state_38463;
var statearr_38671_41065 = state_38463__$1;
(statearr_38671_41065[(2)] = null);

(statearr_38671_41065[(1)] = (24));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (35))){
var inst_38409 = (state_38463[(2)]);
var state_38463__$1 = state_38463;
var statearr_38679_41066 = state_38463__$1;
(statearr_38679_41066[(2)] = inst_38409);

(statearr_38679_41066[(1)] = (29));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (19))){
var inst_38270 = (state_38463[(7)]);
var inst_38281 = cljs.core.chunk_first(inst_38270);
var inst_38282 = cljs.core.chunk_rest(inst_38270);
var inst_38283 = cljs.core.count(inst_38281);
var inst_38226 = inst_38282;
var inst_38227 = inst_38281;
var inst_38228 = inst_38283;
var inst_38229 = (0);
var state_38463__$1 = (function (){var statearr_38681 = state_38463;
(statearr_38681[(14)] = inst_38226);

(statearr_38681[(15)] = inst_38227);

(statearr_38681[(16)] = inst_38228);

(statearr_38681[(17)] = inst_38229);

return statearr_38681;
})();
var statearr_38684_41067 = state_38463__$1;
(statearr_38684_41067[(2)] = null);

(statearr_38684_41067[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (11))){
var inst_38226 = (state_38463[(14)]);
var inst_38270 = (state_38463[(7)]);
var inst_38270__$1 = cljs.core.seq(inst_38226);
var state_38463__$1 = (function (){var statearr_38685 = state_38463;
(statearr_38685[(7)] = inst_38270__$1);

return statearr_38685;
})();
if(inst_38270__$1){
var statearr_38686_41070 = state_38463__$1;
(statearr_38686_41070[(1)] = (16));

} else {
var statearr_38687_41071 = state_38463__$1;
(statearr_38687_41071[(1)] = (17));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (9))){
var inst_38318 = (state_38463[(2)]);
var state_38463__$1 = state_38463;
var statearr_38690_41072 = state_38463__$1;
(statearr_38690_41072[(2)] = inst_38318);

(statearr_38690_41072[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (5))){
var inst_38224 = cljs.core.deref(cs);
var inst_38225 = cljs.core.seq(inst_38224);
var inst_38226 = inst_38225;
var inst_38227 = null;
var inst_38228 = (0);
var inst_38229 = (0);
var state_38463__$1 = (function (){var statearr_38693 = state_38463;
(statearr_38693[(14)] = inst_38226);

(statearr_38693[(15)] = inst_38227);

(statearr_38693[(16)] = inst_38228);

(statearr_38693[(17)] = inst_38229);

return statearr_38693;
})();
var statearr_38694_41074 = state_38463__$1;
(statearr_38694_41074[(2)] = null);

(statearr_38694_41074[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (14))){
var state_38463__$1 = state_38463;
var statearr_38696_41076 = state_38463__$1;
(statearr_38696_41076[(2)] = null);

(statearr_38696_41076[(1)] = (15));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (45))){
var inst_38438 = (state_38463[(2)]);
var state_38463__$1 = state_38463;
var statearr_38701_41077 = state_38463__$1;
(statearr_38701_41077[(2)] = inst_38438);

(statearr_38701_41077[(1)] = (44));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (26))){
var inst_38335 = (state_38463[(27)]);
var inst_38424 = (state_38463[(2)]);
var inst_38430 = cljs.core.seq(inst_38335);
var state_38463__$1 = (function (){var statearr_38704 = state_38463;
(statearr_38704[(29)] = inst_38424);

return statearr_38704;
})();
if(inst_38430){
var statearr_38706_41078 = state_38463__$1;
(statearr_38706_41078[(1)] = (42));

} else {
var statearr_38708_41079 = state_38463__$1;
(statearr_38708_41079[(1)] = (43));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (16))){
var inst_38270 = (state_38463[(7)]);
var inst_38279 = cljs.core.chunked_seq_QMARK_(inst_38270);
var state_38463__$1 = state_38463;
if(inst_38279){
var statearr_38710_41080 = state_38463__$1;
(statearr_38710_41080[(1)] = (19));

} else {
var statearr_38711_41081 = state_38463__$1;
(statearr_38711_41081[(1)] = (20));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (38))){
var inst_38406 = (state_38463[(2)]);
var state_38463__$1 = state_38463;
var statearr_38714_41082 = state_38463__$1;
(statearr_38714_41082[(2)] = inst_38406);

(statearr_38714_41082[(1)] = (35));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (30))){
var state_38463__$1 = state_38463;
var statearr_38715_41083 = state_38463__$1;
(statearr_38715_41083[(2)] = null);

(statearr_38715_41083[(1)] = (32));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (10))){
var inst_38227 = (state_38463[(15)]);
var inst_38229 = (state_38463[(17)]);
var inst_38245 = cljs.core._nth(inst_38227,inst_38229);
var inst_38249 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_38245,(0),null);
var inst_38252 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_38245,(1),null);
var state_38463__$1 = (function (){var statearr_38720 = state_38463;
(statearr_38720[(24)] = inst_38249);

return statearr_38720;
})();
if(cljs.core.truth_(inst_38252)){
var statearr_38725_41085 = state_38463__$1;
(statearr_38725_41085[(1)] = (13));

} else {
var statearr_38726_41086 = state_38463__$1;
(statearr_38726_41086[(1)] = (14));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (18))){
var inst_38313 = (state_38463[(2)]);
var state_38463__$1 = state_38463;
var statearr_38727_41087 = state_38463__$1;
(statearr_38727_41087[(2)] = inst_38313);

(statearr_38727_41087[(1)] = (12));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (42))){
var state_38463__$1 = state_38463;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_38463__$1,(45),dchan);
} else {
if((state_val_38466 === (37))){
var inst_38381 = (state_38463[(23)]);
var inst_38396 = (state_38463[(22)]);
var inst_38216 = (state_38463[(12)]);
var inst_38396__$1 = cljs.core.first(inst_38381);
var inst_38397 = cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$3(inst_38396__$1,inst_38216,done);
var state_38463__$1 = (function (){var statearr_38734 = state_38463;
(statearr_38734[(22)] = inst_38396__$1);

return statearr_38734;
})();
if(cljs.core.truth_(inst_38397)){
var statearr_38737_41097 = state_38463__$1;
(statearr_38737_41097[(1)] = (39));

} else {
var statearr_38738_41098 = state_38463__$1;
(statearr_38738_41098[(1)] = (40));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38466 === (8))){
var inst_38229 = (state_38463[(17)]);
var inst_38228 = (state_38463[(16)]);
var inst_38231 = (inst_38229 < inst_38228);
var inst_38234 = inst_38231;
var state_38463__$1 = state_38463;
if(cljs.core.truth_(inst_38234)){
var statearr_38739_41102 = state_38463__$1;
(statearr_38739_41102[(1)] = (10));

} else {
var statearr_38744_41103 = state_38463__$1;
(statearr_38744_41103[(1)] = (11));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var cljs$core$async$mult_$_state_machine__36595__auto__ = null;
var cljs$core$async$mult_$_state_machine__36595__auto____0 = (function (){
var statearr_38750 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_38750[(0)] = cljs$core$async$mult_$_state_machine__36595__auto__);

(statearr_38750[(1)] = (1));

return statearr_38750;
});
var cljs$core$async$mult_$_state_machine__36595__auto____1 = (function (state_38463){
while(true){
var ret_value__36596__auto__ = (function (){try{while(true){
var result__36597__auto__ = switch__36594__auto__(state_38463);
if(cljs.core.keyword_identical_QMARK_(result__36597__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__36597__auto__;
}
break;
}
}catch (e38753){var ex__36598__auto__ = e38753;
var statearr_38754_41105 = state_38463;
(statearr_38754_41105[(2)] = ex__36598__auto__);


if(cljs.core.seq((state_38463[(4)]))){
var statearr_38756_41106 = state_38463;
(statearr_38756_41106[(1)] = cljs.core.first((state_38463[(4)])));

} else {
throw ex__36598__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__36596__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__41107 = state_38463;
state_38463 = G__41107;
continue;
} else {
return ret_value__36596__auto__;
}
break;
}
});
cljs$core$async$mult_$_state_machine__36595__auto__ = function(state_38463){
switch(arguments.length){
case 0:
return cljs$core$async$mult_$_state_machine__36595__auto____0.call(this);
case 1:
return cljs$core$async$mult_$_state_machine__36595__auto____1.call(this,state_38463);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$mult_$_state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$mult_$_state_machine__36595__auto____0;
cljs$core$async$mult_$_state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$mult_$_state_machine__36595__auto____1;
return cljs$core$async$mult_$_state_machine__36595__auto__;
})()
})();
var state__36898__auto__ = (function (){var statearr_38761 = f__36897__auto__();
(statearr_38761[(6)] = c__36895__auto___41000);

return statearr_38761;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__36898__auto__);
}));


return m;
});
/**
 * Copies the mult source onto the supplied channel.
 * 
 *   By default the channel will be closed when the source closes,
 *   but can be determined by the close? parameter.
 */
cljs.core.async.tap = (function cljs$core$async$tap(var_args){
var G__38768 = arguments.length;
switch (G__38768) {
case 2:
return cljs.core.async.tap.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.core.async.tap.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.tap.cljs$core$IFn$_invoke$arity$2 = (function (mult,ch){
return cljs.core.async.tap.cljs$core$IFn$_invoke$arity$3(mult,ch,true);
}));

(cljs.core.async.tap.cljs$core$IFn$_invoke$arity$3 = (function (mult,ch,close_QMARK_){
cljs.core.async.tap_STAR_(mult,ch,close_QMARK_);

return ch;
}));

(cljs.core.async.tap.cljs$lang$maxFixedArity = 3);

/**
 * Disconnects a target channel from a mult
 */
cljs.core.async.untap = (function cljs$core$async$untap(mult,ch){
return cljs.core.async.untap_STAR_(mult,ch);
});
/**
 * Disconnects all target channels from a mult
 */
cljs.core.async.untap_all = (function cljs$core$async$untap_all(mult){
return cljs.core.async.untap_all_STAR_(mult);
});

/**
 * @interface
 */
cljs.core.async.Mix = function(){};

var cljs$core$async$Mix$admix_STAR_$dyn_41110 = (function (m,ch){
var x__5350__auto__ = (((m == null))?null:m);
var m__5351__auto__ = (cljs.core.async.admix_STAR_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(m,ch) : m__5351__auto__.call(null,m,ch));
} else {
var m__5349__auto__ = (cljs.core.async.admix_STAR_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(m,ch) : m__5349__auto__.call(null,m,ch));
} else {
throw cljs.core.missing_protocol("Mix.admix*",m);
}
}
});
cljs.core.async.admix_STAR_ = (function cljs$core$async$admix_STAR_(m,ch){
if((((!((m == null)))) && ((!((m.cljs$core$async$Mix$admix_STAR_$arity$2 == null)))))){
return m.cljs$core$async$Mix$admix_STAR_$arity$2(m,ch);
} else {
return cljs$core$async$Mix$admix_STAR_$dyn_41110(m,ch);
}
});

var cljs$core$async$Mix$unmix_STAR_$dyn_41114 = (function (m,ch){
var x__5350__auto__ = (((m == null))?null:m);
var m__5351__auto__ = (cljs.core.async.unmix_STAR_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(m,ch) : m__5351__auto__.call(null,m,ch));
} else {
var m__5349__auto__ = (cljs.core.async.unmix_STAR_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(m,ch) : m__5349__auto__.call(null,m,ch));
} else {
throw cljs.core.missing_protocol("Mix.unmix*",m);
}
}
});
cljs.core.async.unmix_STAR_ = (function cljs$core$async$unmix_STAR_(m,ch){
if((((!((m == null)))) && ((!((m.cljs$core$async$Mix$unmix_STAR_$arity$2 == null)))))){
return m.cljs$core$async$Mix$unmix_STAR_$arity$2(m,ch);
} else {
return cljs$core$async$Mix$unmix_STAR_$dyn_41114(m,ch);
}
});

var cljs$core$async$Mix$unmix_all_STAR_$dyn_41116 = (function (m){
var x__5350__auto__ = (((m == null))?null:m);
var m__5351__auto__ = (cljs.core.async.unmix_all_STAR_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(m) : m__5351__auto__.call(null,m));
} else {
var m__5349__auto__ = (cljs.core.async.unmix_all_STAR_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(m) : m__5349__auto__.call(null,m));
} else {
throw cljs.core.missing_protocol("Mix.unmix-all*",m);
}
}
});
cljs.core.async.unmix_all_STAR_ = (function cljs$core$async$unmix_all_STAR_(m){
if((((!((m == null)))) && ((!((m.cljs$core$async$Mix$unmix_all_STAR_$arity$1 == null)))))){
return m.cljs$core$async$Mix$unmix_all_STAR_$arity$1(m);
} else {
return cljs$core$async$Mix$unmix_all_STAR_$dyn_41116(m);
}
});

var cljs$core$async$Mix$toggle_STAR_$dyn_41120 = (function (m,state_map){
var x__5350__auto__ = (((m == null))?null:m);
var m__5351__auto__ = (cljs.core.async.toggle_STAR_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(m,state_map) : m__5351__auto__.call(null,m,state_map));
} else {
var m__5349__auto__ = (cljs.core.async.toggle_STAR_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(m,state_map) : m__5349__auto__.call(null,m,state_map));
} else {
throw cljs.core.missing_protocol("Mix.toggle*",m);
}
}
});
cljs.core.async.toggle_STAR_ = (function cljs$core$async$toggle_STAR_(m,state_map){
if((((!((m == null)))) && ((!((m.cljs$core$async$Mix$toggle_STAR_$arity$2 == null)))))){
return m.cljs$core$async$Mix$toggle_STAR_$arity$2(m,state_map);
} else {
return cljs$core$async$Mix$toggle_STAR_$dyn_41120(m,state_map);
}
});

var cljs$core$async$Mix$solo_mode_STAR_$dyn_41128 = (function (m,mode){
var x__5350__auto__ = (((m == null))?null:m);
var m__5351__auto__ = (cljs.core.async.solo_mode_STAR_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(m,mode) : m__5351__auto__.call(null,m,mode));
} else {
var m__5349__auto__ = (cljs.core.async.solo_mode_STAR_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(m,mode) : m__5349__auto__.call(null,m,mode));
} else {
throw cljs.core.missing_protocol("Mix.solo-mode*",m);
}
}
});
cljs.core.async.solo_mode_STAR_ = (function cljs$core$async$solo_mode_STAR_(m,mode){
if((((!((m == null)))) && ((!((m.cljs$core$async$Mix$solo_mode_STAR_$arity$2 == null)))))){
return m.cljs$core$async$Mix$solo_mode_STAR_$arity$2(m,mode);
} else {
return cljs$core$async$Mix$solo_mode_STAR_$dyn_41128(m,mode);
}
});

cljs.core.async.ioc_alts_BANG_ = (function cljs$core$async$ioc_alts_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___41130 = arguments.length;
var i__5727__auto___41131 = (0);
while(true){
if((i__5727__auto___41131 < len__5726__auto___41130)){
args__5732__auto__.push((arguments[i__5727__auto___41131]));

var G__41132 = (i__5727__auto___41131 + (1));
i__5727__auto___41131 = G__41132;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((3) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((3)),(0),null)):null);
return cljs.core.async.ioc_alts_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),argseq__5733__auto__);
});

(cljs.core.async.ioc_alts_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (state,cont_block,ports,p__38792){
var map__38793 = p__38792;
var map__38793__$1 = cljs.core.__destructure_map(map__38793);
var opts = map__38793__$1;
var statearr_38794_41133 = state;
(statearr_38794_41133[(1)] = cont_block);


var temp__5804__auto__ = cljs.core.async.do_alts((function (val){
var statearr_38795_41134 = state;
(statearr_38795_41134[(2)] = val);


return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state);
}),ports,opts);
if(cljs.core.truth_(temp__5804__auto__)){
var cb = temp__5804__auto__;
var statearr_38796_41138 = state;
(statearr_38796_41138[(2)] = cljs.core.deref(cb));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}));

(cljs.core.async.ioc_alts_BANG_.cljs$lang$maxFixedArity = (3));

/** @this {Function} */
(cljs.core.async.ioc_alts_BANG_.cljs$lang$applyTo = (function (seq38788){
var G__38789 = cljs.core.first(seq38788);
var seq38788__$1 = cljs.core.next(seq38788);
var G__38790 = cljs.core.first(seq38788__$1);
var seq38788__$2 = cljs.core.next(seq38788__$1);
var G__38791 = cljs.core.first(seq38788__$2);
var seq38788__$3 = cljs.core.next(seq38788__$2);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__38789,G__38790,G__38791,seq38788__$3);
}));


/**
* @constructor
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.async.Mix}
 * @implements {cljs.core.async.Mux}
 * @implements {cljs.core.IWithMeta}
*/
cljs.core.async.t_cljs$core$async38798 = (function (change,solo_mode,pick,cs,calc_state,out,changed,solo_modes,attrs,meta38799){
this.change = change;
this.solo_mode = solo_mode;
this.pick = pick;
this.cs = cs;
this.calc_state = calc_state;
this.out = out;
this.changed = changed;
this.solo_modes = solo_modes;
this.attrs = attrs;
this.meta38799 = meta38799;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async38798.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_38800,meta38799__$1){
var self__ = this;
var _38800__$1 = this;
return (new cljs.core.async.t_cljs$core$async38798(self__.change,self__.solo_mode,self__.pick,self__.cs,self__.calc_state,self__.out,self__.changed,self__.solo_modes,self__.attrs,meta38799__$1));
}));

(cljs.core.async.t_cljs$core$async38798.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_38800){
var self__ = this;
var _38800__$1 = this;
return self__.meta38799;
}));

(cljs.core.async.t_cljs$core$async38798.prototype.cljs$core$async$Mux$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async38798.prototype.cljs$core$async$Mux$muxch_STAR_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return self__.out;
}));

(cljs.core.async.t_cljs$core$async38798.prototype.cljs$core$async$Mix$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async38798.prototype.cljs$core$async$Mix$admix_STAR_$arity$2 = (function (_,ch){
var self__ = this;
var ___$1 = this;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(self__.cs,cljs.core.assoc,ch,cljs.core.PersistentArrayMap.EMPTY);

return (self__.changed.cljs$core$IFn$_invoke$arity$0 ? self__.changed.cljs$core$IFn$_invoke$arity$0() : self__.changed.call(null));
}));

(cljs.core.async.t_cljs$core$async38798.prototype.cljs$core$async$Mix$unmix_STAR_$arity$2 = (function (_,ch){
var self__ = this;
var ___$1 = this;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(self__.cs,cljs.core.dissoc,ch);

return (self__.changed.cljs$core$IFn$_invoke$arity$0 ? self__.changed.cljs$core$IFn$_invoke$arity$0() : self__.changed.call(null));
}));

(cljs.core.async.t_cljs$core$async38798.prototype.cljs$core$async$Mix$unmix_all_STAR_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
cljs.core.reset_BANG_(self__.cs,cljs.core.PersistentArrayMap.EMPTY);

return (self__.changed.cljs$core$IFn$_invoke$arity$0 ? self__.changed.cljs$core$IFn$_invoke$arity$0() : self__.changed.call(null));
}));

(cljs.core.async.t_cljs$core$async38798.prototype.cljs$core$async$Mix$toggle_STAR_$arity$2 = (function (_,state_map){
var self__ = this;
var ___$1 = this;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(self__.cs,cljs.core.partial.cljs$core$IFn$_invoke$arity$2(cljs.core.merge_with,cljs.core.merge),state_map);

return (self__.changed.cljs$core$IFn$_invoke$arity$0 ? self__.changed.cljs$core$IFn$_invoke$arity$0() : self__.changed.call(null));
}));

(cljs.core.async.t_cljs$core$async38798.prototype.cljs$core$async$Mix$solo_mode_STAR_$arity$2 = (function (_,mode){
var self__ = this;
var ___$1 = this;
if(cljs.core.truth_((self__.solo_modes.cljs$core$IFn$_invoke$arity$1 ? self__.solo_modes.cljs$core$IFn$_invoke$arity$1(mode) : self__.solo_modes.call(null,mode)))){
} else {
throw (new Error(["Assert failed: ",["mode must be one of: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(self__.solo_modes)].join(''),"\n","(solo-modes mode)"].join('')));
}

cljs.core.reset_BANG_(self__.solo_mode,mode);

return (self__.changed.cljs$core$IFn$_invoke$arity$0 ? self__.changed.cljs$core$IFn$_invoke$arity$0() : self__.changed.call(null));
}));

(cljs.core.async.t_cljs$core$async38798.getBasis = (function (){
return new cljs.core.PersistentVector(null, 10, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"change","change",477485025,null),new cljs.core.Symbol(null,"solo-mode","solo-mode",2031788074,null),new cljs.core.Symbol(null,"pick","pick",1300068175,null),new cljs.core.Symbol(null,"cs","cs",-117024463,null),new cljs.core.Symbol(null,"calc-state","calc-state",-349968968,null),new cljs.core.Symbol(null,"out","out",729986010,null),new cljs.core.Symbol(null,"changed","changed",-2083710852,null),new cljs.core.Symbol(null,"solo-modes","solo-modes",882180540,null),new cljs.core.Symbol(null,"attrs","attrs",-450137186,null),new cljs.core.Symbol(null,"meta38799","meta38799",-649601392,null)], null);
}));

(cljs.core.async.t_cljs$core$async38798.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async38798.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async38798");

(cljs.core.async.t_cljs$core$async38798.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async38798");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async38798.
 */
cljs.core.async.__GT_t_cljs$core$async38798 = (function cljs$core$async$__GT_t_cljs$core$async38798(change,solo_mode,pick,cs,calc_state,out,changed,solo_modes,attrs,meta38799){
return (new cljs.core.async.t_cljs$core$async38798(change,solo_mode,pick,cs,calc_state,out,changed,solo_modes,attrs,meta38799));
});


/**
 * Creates and returns a mix of one or more input channels which will
 *   be put on the supplied out channel. Input sources can be added to
 *   the mix with 'admix', and removed with 'unmix'. A mix supports
 *   soloing, muting and pausing multiple inputs atomically using
 *   'toggle', and can solo using either muting or pausing as determined
 *   by 'solo-mode'.
 * 
 *   Each channel can have zero or more boolean modes set via 'toggle':
 * 
 *   :solo - when true, only this (ond other soloed) channel(s) will appear
 *        in the mix output channel. :mute and :pause states of soloed
 *        channels are ignored. If solo-mode is :mute, non-soloed
 *        channels are muted, if :pause, non-soloed channels are
 *        paused.
 * 
 *   :mute - muted channels will have their contents consumed but not included in the mix
 *   :pause - paused channels will not have their contents consumed (and thus also not included in the mix)
 */
cljs.core.async.mix = (function cljs$core$async$mix(out){
var cs = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var solo_modes = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"pause","pause",-2095325672),null,new cljs.core.Keyword(null,"mute","mute",1151223646),null], null), null);
var attrs = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(solo_modes,new cljs.core.Keyword(null,"solo","solo",-316350075));
var solo_mode = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"mute","mute",1151223646));
var change = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1(cljs.core.async.sliding_buffer((1)));
var changed = (function (){
return cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$2(change,true);
});
var pick = (function (attr,chs){
return cljs.core.reduce_kv((function (ret,c,v){
if(cljs.core.truth_((attr.cljs$core$IFn$_invoke$arity$1 ? attr.cljs$core$IFn$_invoke$arity$1(v) : attr.call(null,v)))){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(ret,c);
} else {
return ret;
}
}),cljs.core.PersistentHashSet.EMPTY,chs);
});
var calc_state = (function (){
var chs = cljs.core.deref(cs);
var mode = cljs.core.deref(solo_mode);
var solos = pick(new cljs.core.Keyword(null,"solo","solo",-316350075),chs);
var pauses = pick(new cljs.core.Keyword(null,"pause","pause",-2095325672),chs);
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"solos","solos",1441458643),solos,new cljs.core.Keyword(null,"mutes","mutes",1068806309),pick(new cljs.core.Keyword(null,"mute","mute",1151223646),chs),new cljs.core.Keyword(null,"reads","reads",-1215067361),cljs.core.conj.cljs$core$IFn$_invoke$arity$2(((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(mode,new cljs.core.Keyword(null,"pause","pause",-2095325672))) && (cljs.core.seq(solos))))?cljs.core.vec(solos):cljs.core.vec(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(pauses,cljs.core.keys(chs)))),change)], null);
});
var m = (new cljs.core.async.t_cljs$core$async38798(change,solo_mode,pick,cs,calc_state,out,changed,solo_modes,attrs,cljs.core.PersistentArrayMap.EMPTY));
var c__36895__auto___41165 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__36897__auto__ = (function (){var switch__36594__auto__ = (function (state_38886){
var state_val_38887 = (state_38886[(1)]);
if((state_val_38887 === (7))){
var inst_38845 = (state_38886[(2)]);
var state_38886__$1 = state_38886;
if(cljs.core.truth_(inst_38845)){
var statearr_38889_41166 = state_38886__$1;
(statearr_38889_41166[(1)] = (8));

} else {
var statearr_38890_41168 = state_38886__$1;
(statearr_38890_41168[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38887 === (20))){
var inst_38838 = (state_38886[(7)]);
var state_38886__$1 = state_38886;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_38886__$1,(23),out,inst_38838);
} else {
if((state_val_38887 === (1))){
var inst_38820 = calc_state();
var inst_38821 = cljs.core.__destructure_map(inst_38820);
var inst_38822 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_38821,new cljs.core.Keyword(null,"solos","solos",1441458643));
var inst_38823 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_38821,new cljs.core.Keyword(null,"mutes","mutes",1068806309));
var inst_38824 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_38821,new cljs.core.Keyword(null,"reads","reads",-1215067361));
var inst_38825 = inst_38820;
var state_38886__$1 = (function (){var statearr_38892 = state_38886;
(statearr_38892[(8)] = inst_38822);

(statearr_38892[(9)] = inst_38823);

(statearr_38892[(10)] = inst_38824);

(statearr_38892[(11)] = inst_38825);

return statearr_38892;
})();
var statearr_38893_41173 = state_38886__$1;
(statearr_38893_41173[(2)] = null);

(statearr_38893_41173[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38887 === (24))){
var inst_38828 = (state_38886[(12)]);
var inst_38825 = inst_38828;
var state_38886__$1 = (function (){var statearr_38895 = state_38886;
(statearr_38895[(11)] = inst_38825);

return statearr_38895;
})();
var statearr_38897_41176 = state_38886__$1;
(statearr_38897_41176[(2)] = null);

(statearr_38897_41176[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38887 === (4))){
var inst_38838 = (state_38886[(7)]);
var inst_38840 = (state_38886[(13)]);
var inst_38837 = (state_38886[(2)]);
var inst_38838__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_38837,(0),null);
var inst_38839 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_38837,(1),null);
var inst_38840__$1 = (inst_38838__$1 == null);
var state_38886__$1 = (function (){var statearr_38900 = state_38886;
(statearr_38900[(7)] = inst_38838__$1);

(statearr_38900[(14)] = inst_38839);

(statearr_38900[(13)] = inst_38840__$1);

return statearr_38900;
})();
if(cljs.core.truth_(inst_38840__$1)){
var statearr_38901_41177 = state_38886__$1;
(statearr_38901_41177[(1)] = (5));

} else {
var statearr_38902_41182 = state_38886__$1;
(statearr_38902_41182[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38887 === (15))){
var inst_38829 = (state_38886[(15)]);
var inst_38860 = (state_38886[(16)]);
var inst_38860__$1 = cljs.core.empty_QMARK_(inst_38829);
var state_38886__$1 = (function (){var statearr_38904 = state_38886;
(statearr_38904[(16)] = inst_38860__$1);

return statearr_38904;
})();
if(inst_38860__$1){
var statearr_38905_41183 = state_38886__$1;
(statearr_38905_41183[(1)] = (17));

} else {
var statearr_38907_41184 = state_38886__$1;
(statearr_38907_41184[(1)] = (18));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38887 === (21))){
var inst_38828 = (state_38886[(12)]);
var inst_38825 = inst_38828;
var state_38886__$1 = (function (){var statearr_38909 = state_38886;
(statearr_38909[(11)] = inst_38825);

return statearr_38909;
})();
var statearr_38910_41185 = state_38886__$1;
(statearr_38910_41185[(2)] = null);

(statearr_38910_41185[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38887 === (13))){
var inst_38852 = (state_38886[(2)]);
var inst_38853 = calc_state();
var inst_38825 = inst_38853;
var state_38886__$1 = (function (){var statearr_38912 = state_38886;
(statearr_38912[(17)] = inst_38852);

(statearr_38912[(11)] = inst_38825);

return statearr_38912;
})();
var statearr_38913_41189 = state_38886__$1;
(statearr_38913_41189[(2)] = null);

(statearr_38913_41189[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38887 === (22))){
var inst_38880 = (state_38886[(2)]);
var state_38886__$1 = state_38886;
var statearr_38914_41190 = state_38886__$1;
(statearr_38914_41190[(2)] = inst_38880);

(statearr_38914_41190[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38887 === (6))){
var inst_38839 = (state_38886[(14)]);
var inst_38843 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_38839,change);
var state_38886__$1 = state_38886;
var statearr_38918_41191 = state_38886__$1;
(statearr_38918_41191[(2)] = inst_38843);

(statearr_38918_41191[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38887 === (25))){
var state_38886__$1 = state_38886;
var statearr_38919_41192 = state_38886__$1;
(statearr_38919_41192[(2)] = null);

(statearr_38919_41192[(1)] = (26));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38887 === (17))){
var inst_38830 = (state_38886[(18)]);
var inst_38839 = (state_38886[(14)]);
var inst_38862 = (inst_38830.cljs$core$IFn$_invoke$arity$1 ? inst_38830.cljs$core$IFn$_invoke$arity$1(inst_38839) : inst_38830.call(null,inst_38839));
var inst_38863 = cljs.core.not(inst_38862);
var state_38886__$1 = state_38886;
var statearr_38924_41199 = state_38886__$1;
(statearr_38924_41199[(2)] = inst_38863);

(statearr_38924_41199[(1)] = (19));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38887 === (3))){
var inst_38884 = (state_38886[(2)]);
var state_38886__$1 = state_38886;
return cljs.core.async.impl.ioc_helpers.return_chan(state_38886__$1,inst_38884);
} else {
if((state_val_38887 === (12))){
var state_38886__$1 = state_38886;
var statearr_38940_41201 = state_38886__$1;
(statearr_38940_41201[(2)] = null);

(statearr_38940_41201[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38887 === (2))){
var inst_38825 = (state_38886[(11)]);
var inst_38828 = (state_38886[(12)]);
var inst_38828__$1 = cljs.core.__destructure_map(inst_38825);
var inst_38829 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_38828__$1,new cljs.core.Keyword(null,"solos","solos",1441458643));
var inst_38830 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_38828__$1,new cljs.core.Keyword(null,"mutes","mutes",1068806309));
var inst_38831 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_38828__$1,new cljs.core.Keyword(null,"reads","reads",-1215067361));
var state_38886__$1 = (function (){var statearr_38942 = state_38886;
(statearr_38942[(12)] = inst_38828__$1);

(statearr_38942[(15)] = inst_38829);

(statearr_38942[(18)] = inst_38830);

return statearr_38942;
})();
return cljs.core.async.ioc_alts_BANG_(state_38886__$1,(4),inst_38831);
} else {
if((state_val_38887 === (23))){
var inst_38871 = (state_38886[(2)]);
var state_38886__$1 = state_38886;
if(cljs.core.truth_(inst_38871)){
var statearr_38943_41202 = state_38886__$1;
(statearr_38943_41202[(1)] = (24));

} else {
var statearr_38944_41203 = state_38886__$1;
(statearr_38944_41203[(1)] = (25));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38887 === (19))){
var inst_38866 = (state_38886[(2)]);
var state_38886__$1 = state_38886;
var statearr_38948_41204 = state_38886__$1;
(statearr_38948_41204[(2)] = inst_38866);

(statearr_38948_41204[(1)] = (16));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38887 === (11))){
var inst_38839 = (state_38886[(14)]);
var inst_38849 = cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(cs,cljs.core.dissoc,inst_38839);
var state_38886__$1 = state_38886;
var statearr_38949_41205 = state_38886__$1;
(statearr_38949_41205[(2)] = inst_38849);

(statearr_38949_41205[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38887 === (9))){
var inst_38829 = (state_38886[(15)]);
var inst_38839 = (state_38886[(14)]);
var inst_38856 = (state_38886[(19)]);
var inst_38856__$1 = (inst_38829.cljs$core$IFn$_invoke$arity$1 ? inst_38829.cljs$core$IFn$_invoke$arity$1(inst_38839) : inst_38829.call(null,inst_38839));
var state_38886__$1 = (function (){var statearr_38950 = state_38886;
(statearr_38950[(19)] = inst_38856__$1);

return statearr_38950;
})();
if(cljs.core.truth_(inst_38856__$1)){
var statearr_38951_41211 = state_38886__$1;
(statearr_38951_41211[(1)] = (14));

} else {
var statearr_38952_41213 = state_38886__$1;
(statearr_38952_41213[(1)] = (15));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38887 === (5))){
var inst_38840 = (state_38886[(13)]);
var state_38886__$1 = state_38886;
var statearr_38953_41214 = state_38886__$1;
(statearr_38953_41214[(2)] = inst_38840);

(statearr_38953_41214[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38887 === (14))){
var inst_38856 = (state_38886[(19)]);
var state_38886__$1 = state_38886;
var statearr_38954_41215 = state_38886__$1;
(statearr_38954_41215[(2)] = inst_38856);

(statearr_38954_41215[(1)] = (16));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38887 === (26))){
var inst_38876 = (state_38886[(2)]);
var state_38886__$1 = state_38886;
var statearr_38956_41216 = state_38886__$1;
(statearr_38956_41216[(2)] = inst_38876);

(statearr_38956_41216[(1)] = (22));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38887 === (16))){
var inst_38868 = (state_38886[(2)]);
var state_38886__$1 = state_38886;
if(cljs.core.truth_(inst_38868)){
var statearr_38957_41217 = state_38886__$1;
(statearr_38957_41217[(1)] = (20));

} else {
var statearr_38958_41218 = state_38886__$1;
(statearr_38958_41218[(1)] = (21));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38887 === (10))){
var inst_38882 = (state_38886[(2)]);
var state_38886__$1 = state_38886;
var statearr_38963_41219 = state_38886__$1;
(statearr_38963_41219[(2)] = inst_38882);

(statearr_38963_41219[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38887 === (18))){
var inst_38860 = (state_38886[(16)]);
var state_38886__$1 = state_38886;
var statearr_38968_41221 = state_38886__$1;
(statearr_38968_41221[(2)] = inst_38860);

(statearr_38968_41221[(1)] = (19));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38887 === (8))){
var inst_38838 = (state_38886[(7)]);
var inst_38847 = (inst_38838 == null);
var state_38886__$1 = state_38886;
if(cljs.core.truth_(inst_38847)){
var statearr_38973_41222 = state_38886__$1;
(statearr_38973_41222[(1)] = (11));

} else {
var statearr_38974_41223 = state_38886__$1;
(statearr_38974_41223[(1)] = (12));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var cljs$core$async$mix_$_state_machine__36595__auto__ = null;
var cljs$core$async$mix_$_state_machine__36595__auto____0 = (function (){
var statearr_38976 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_38976[(0)] = cljs$core$async$mix_$_state_machine__36595__auto__);

(statearr_38976[(1)] = (1));

return statearr_38976;
});
var cljs$core$async$mix_$_state_machine__36595__auto____1 = (function (state_38886){
while(true){
var ret_value__36596__auto__ = (function (){try{while(true){
var result__36597__auto__ = switch__36594__auto__(state_38886);
if(cljs.core.keyword_identical_QMARK_(result__36597__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__36597__auto__;
}
break;
}
}catch (e38977){var ex__36598__auto__ = e38977;
var statearr_38978_41228 = state_38886;
(statearr_38978_41228[(2)] = ex__36598__auto__);


if(cljs.core.seq((state_38886[(4)]))){
var statearr_38979_41236 = state_38886;
(statearr_38979_41236[(1)] = cljs.core.first((state_38886[(4)])));

} else {
throw ex__36598__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__36596__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__41237 = state_38886;
state_38886 = G__41237;
continue;
} else {
return ret_value__36596__auto__;
}
break;
}
});
cljs$core$async$mix_$_state_machine__36595__auto__ = function(state_38886){
switch(arguments.length){
case 0:
return cljs$core$async$mix_$_state_machine__36595__auto____0.call(this);
case 1:
return cljs$core$async$mix_$_state_machine__36595__auto____1.call(this,state_38886);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$mix_$_state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$mix_$_state_machine__36595__auto____0;
cljs$core$async$mix_$_state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$mix_$_state_machine__36595__auto____1;
return cljs$core$async$mix_$_state_machine__36595__auto__;
})()
})();
var state__36898__auto__ = (function (){var statearr_38980 = f__36897__auto__();
(statearr_38980[(6)] = c__36895__auto___41165);

return statearr_38980;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__36898__auto__);
}));


return m;
});
/**
 * Adds ch as an input to the mix
 */
cljs.core.async.admix = (function cljs$core$async$admix(mix,ch){
return cljs.core.async.admix_STAR_(mix,ch);
});
/**
 * Removes ch as an input to the mix
 */
cljs.core.async.unmix = (function cljs$core$async$unmix(mix,ch){
return cljs.core.async.unmix_STAR_(mix,ch);
});
/**
 * removes all inputs from the mix
 */
cljs.core.async.unmix_all = (function cljs$core$async$unmix_all(mix){
return cljs.core.async.unmix_all_STAR_(mix);
});
/**
 * Atomically sets the state(s) of one or more channels in a mix. The
 *   state map is a map of channels -> channel-state-map. A
 *   channel-state-map is a map of attrs -> boolean, where attr is one or
 *   more of :mute, :pause or :solo. Any states supplied are merged with
 *   the current state.
 * 
 *   Note that channels can be added to a mix via toggle, which can be
 *   used to add channels in a particular (e.g. paused) state.
 */
cljs.core.async.toggle = (function cljs$core$async$toggle(mix,state_map){
return cljs.core.async.toggle_STAR_(mix,state_map);
});
/**
 * Sets the solo mode of the mix. mode must be one of :mute or :pause
 */
cljs.core.async.solo_mode = (function cljs$core$async$solo_mode(mix,mode){
return cljs.core.async.solo_mode_STAR_(mix,mode);
});

/**
 * @interface
 */
cljs.core.async.Pub = function(){};

var cljs$core$async$Pub$sub_STAR_$dyn_41241 = (function (p,v,ch,close_QMARK_){
var x__5350__auto__ = (((p == null))?null:p);
var m__5351__auto__ = (cljs.core.async.sub_STAR_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$4 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$4(p,v,ch,close_QMARK_) : m__5351__auto__.call(null,p,v,ch,close_QMARK_));
} else {
var m__5349__auto__ = (cljs.core.async.sub_STAR_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$4 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$4(p,v,ch,close_QMARK_) : m__5349__auto__.call(null,p,v,ch,close_QMARK_));
} else {
throw cljs.core.missing_protocol("Pub.sub*",p);
}
}
});
cljs.core.async.sub_STAR_ = (function cljs$core$async$sub_STAR_(p,v,ch,close_QMARK_){
if((((!((p == null)))) && ((!((p.cljs$core$async$Pub$sub_STAR_$arity$4 == null)))))){
return p.cljs$core$async$Pub$sub_STAR_$arity$4(p,v,ch,close_QMARK_);
} else {
return cljs$core$async$Pub$sub_STAR_$dyn_41241(p,v,ch,close_QMARK_);
}
});

var cljs$core$async$Pub$unsub_STAR_$dyn_41243 = (function (p,v,ch){
var x__5350__auto__ = (((p == null))?null:p);
var m__5351__auto__ = (cljs.core.async.unsub_STAR_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(p,v,ch) : m__5351__auto__.call(null,p,v,ch));
} else {
var m__5349__auto__ = (cljs.core.async.unsub_STAR_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(p,v,ch) : m__5349__auto__.call(null,p,v,ch));
} else {
throw cljs.core.missing_protocol("Pub.unsub*",p);
}
}
});
cljs.core.async.unsub_STAR_ = (function cljs$core$async$unsub_STAR_(p,v,ch){
if((((!((p == null)))) && ((!((p.cljs$core$async$Pub$unsub_STAR_$arity$3 == null)))))){
return p.cljs$core$async$Pub$unsub_STAR_$arity$3(p,v,ch);
} else {
return cljs$core$async$Pub$unsub_STAR_$dyn_41243(p,v,ch);
}
});

var cljs$core$async$Pub$unsub_all_STAR_$dyn_41247 = (function() {
var G__41248 = null;
var G__41248__1 = (function (p){
var x__5350__auto__ = (((p == null))?null:p);
var m__5351__auto__ = (cljs.core.async.unsub_all_STAR_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(p) : m__5351__auto__.call(null,p));
} else {
var m__5349__auto__ = (cljs.core.async.unsub_all_STAR_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(p) : m__5349__auto__.call(null,p));
} else {
throw cljs.core.missing_protocol("Pub.unsub-all*",p);
}
}
});
var G__41248__2 = (function (p,v){
var x__5350__auto__ = (((p == null))?null:p);
var m__5351__auto__ = (cljs.core.async.unsub_all_STAR_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(p,v) : m__5351__auto__.call(null,p,v));
} else {
var m__5349__auto__ = (cljs.core.async.unsub_all_STAR_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(p,v) : m__5349__auto__.call(null,p,v));
} else {
throw cljs.core.missing_protocol("Pub.unsub-all*",p);
}
}
});
G__41248 = function(p,v){
switch(arguments.length){
case 1:
return G__41248__1.call(this,p);
case 2:
return G__41248__2.call(this,p,v);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__41248.cljs$core$IFn$_invoke$arity$1 = G__41248__1;
G__41248.cljs$core$IFn$_invoke$arity$2 = G__41248__2;
return G__41248;
})()
;
cljs.core.async.unsub_all_STAR_ = (function cljs$core$async$unsub_all_STAR_(var_args){
var G__39000 = arguments.length;
switch (G__39000) {
case 1:
return cljs.core.async.unsub_all_STAR_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljs.core.async.unsub_all_STAR_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.unsub_all_STAR_.cljs$core$IFn$_invoke$arity$1 = (function (p){
if((((!((p == null)))) && ((!((p.cljs$core$async$Pub$unsub_all_STAR_$arity$1 == null)))))){
return p.cljs$core$async$Pub$unsub_all_STAR_$arity$1(p);
} else {
return cljs$core$async$Pub$unsub_all_STAR_$dyn_41247(p);
}
}));

(cljs.core.async.unsub_all_STAR_.cljs$core$IFn$_invoke$arity$2 = (function (p,v){
if((((!((p == null)))) && ((!((p.cljs$core$async$Pub$unsub_all_STAR_$arity$2 == null)))))){
return p.cljs$core$async$Pub$unsub_all_STAR_$arity$2(p,v);
} else {
return cljs$core$async$Pub$unsub_all_STAR_$dyn_41247(p,v);
}
}));

(cljs.core.async.unsub_all_STAR_.cljs$lang$maxFixedArity = 2);



/**
* @constructor
 * @implements {cljs.core.async.Pub}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.async.Mux}
 * @implements {cljs.core.IWithMeta}
*/
cljs.core.async.t_cljs$core$async39016 = (function (ch,topic_fn,buf_fn,mults,ensure_mult,meta39017){
this.ch = ch;
this.topic_fn = topic_fn;
this.buf_fn = buf_fn;
this.mults = mults;
this.ensure_mult = ensure_mult;
this.meta39017 = meta39017;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async39016.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_39018,meta39017__$1){
var self__ = this;
var _39018__$1 = this;
return (new cljs.core.async.t_cljs$core$async39016(self__.ch,self__.topic_fn,self__.buf_fn,self__.mults,self__.ensure_mult,meta39017__$1));
}));

(cljs.core.async.t_cljs$core$async39016.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_39018){
var self__ = this;
var _39018__$1 = this;
return self__.meta39017;
}));

(cljs.core.async.t_cljs$core$async39016.prototype.cljs$core$async$Mux$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async39016.prototype.cljs$core$async$Mux$muxch_STAR_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return self__.ch;
}));

(cljs.core.async.t_cljs$core$async39016.prototype.cljs$core$async$Pub$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async39016.prototype.cljs$core$async$Pub$sub_STAR_$arity$4 = (function (p,topic,ch__$1,close_QMARK_){
var self__ = this;
var p__$1 = this;
var m = (self__.ensure_mult.cljs$core$IFn$_invoke$arity$1 ? self__.ensure_mult.cljs$core$IFn$_invoke$arity$1(topic) : self__.ensure_mult.call(null,topic));
return cljs.core.async.tap.cljs$core$IFn$_invoke$arity$3(m,ch__$1,close_QMARK_);
}));

(cljs.core.async.t_cljs$core$async39016.prototype.cljs$core$async$Pub$unsub_STAR_$arity$3 = (function (p,topic,ch__$1){
var self__ = this;
var p__$1 = this;
var temp__5804__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(self__.mults),topic);
if(cljs.core.truth_(temp__5804__auto__)){
var m = temp__5804__auto__;
return cljs.core.async.untap(m,ch__$1);
} else {
return null;
}
}));

(cljs.core.async.t_cljs$core$async39016.prototype.cljs$core$async$Pub$unsub_all_STAR_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.reset_BANG_(self__.mults,cljs.core.PersistentArrayMap.EMPTY);
}));

(cljs.core.async.t_cljs$core$async39016.prototype.cljs$core$async$Pub$unsub_all_STAR_$arity$2 = (function (_,topic){
var self__ = this;
var ___$1 = this;
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(self__.mults,cljs.core.dissoc,topic);
}));

(cljs.core.async.t_cljs$core$async39016.getBasis = (function (){
return new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"ch","ch",1085813622,null),new cljs.core.Symbol(null,"topic-fn","topic-fn",-862449736,null),new cljs.core.Symbol(null,"buf-fn","buf-fn",-1200281591,null),new cljs.core.Symbol(null,"mults","mults",-461114485,null),new cljs.core.Symbol(null,"ensure-mult","ensure-mult",1796584816,null),new cljs.core.Symbol(null,"meta39017","meta39017",1926325339,null)], null);
}));

(cljs.core.async.t_cljs$core$async39016.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async39016.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async39016");

(cljs.core.async.t_cljs$core$async39016.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async39016");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async39016.
 */
cljs.core.async.__GT_t_cljs$core$async39016 = (function cljs$core$async$__GT_t_cljs$core$async39016(ch,topic_fn,buf_fn,mults,ensure_mult,meta39017){
return (new cljs.core.async.t_cljs$core$async39016(ch,topic_fn,buf_fn,mults,ensure_mult,meta39017));
});


/**
 * Creates and returns a pub(lication) of the supplied channel,
 *   partitioned into topics by the topic-fn. topic-fn will be applied to
 *   each value on the channel and the result will determine the 'topic'
 *   on which that value will be put. Channels can be subscribed to
 *   receive copies of topics using 'sub', and unsubscribed using
 *   'unsub'. Each topic will be handled by an internal mult on a
 *   dedicated channel. By default these internal channels are
 *   unbuffered, but a buf-fn can be supplied which, given a topic,
 *   creates a buffer with desired properties.
 * 
 *   Each item is distributed to all subs in parallel and synchronously,
 *   i.e. each sub must accept before the next item is distributed. Use
 *   buffering/windowing to prevent slow subs from holding up the pub.
 * 
 *   Items received when there are no matching subs get dropped.
 * 
 *   Note that if buf-fns are used then each topic is handled
 *   asynchronously, i.e. if a channel is subscribed to more than one
 *   topic it should not expect them to be interleaved identically with
 *   the source.
 */
cljs.core.async.pub = (function cljs$core$async$pub(var_args){
var G__39011 = arguments.length;
switch (G__39011) {
case 2:
return cljs.core.async.pub.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.core.async.pub.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.pub.cljs$core$IFn$_invoke$arity$2 = (function (ch,topic_fn){
return cljs.core.async.pub.cljs$core$IFn$_invoke$arity$3(ch,topic_fn,cljs.core.constantly(null));
}));

(cljs.core.async.pub.cljs$core$IFn$_invoke$arity$3 = (function (ch,topic_fn,buf_fn){
var mults = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var ensure_mult = (function (topic){
var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(mults),topic);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(mults,(function (p1__39007_SHARP_){
if(cljs.core.truth_((p1__39007_SHARP_.cljs$core$IFn$_invoke$arity$1 ? p1__39007_SHARP_.cljs$core$IFn$_invoke$arity$1(topic) : p1__39007_SHARP_.call(null,topic)))){
return p1__39007_SHARP_;
} else {
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__39007_SHARP_,topic,cljs.core.async.mult(cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((buf_fn.cljs$core$IFn$_invoke$arity$1 ? buf_fn.cljs$core$IFn$_invoke$arity$1(topic) : buf_fn.call(null,topic)))));
}
})),topic);
}
});
var p = (new cljs.core.async.t_cljs$core$async39016(ch,topic_fn,buf_fn,mults,ensure_mult,cljs.core.PersistentArrayMap.EMPTY));
var c__36895__auto___41267 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__36897__auto__ = (function (){var switch__36594__auto__ = (function (state_39104){
var state_val_39108 = (state_39104[(1)]);
if((state_val_39108 === (7))){
var inst_39100 = (state_39104[(2)]);
var state_39104__$1 = state_39104;
var statearr_39109_41268 = state_39104__$1;
(statearr_39109_41268[(2)] = inst_39100);

(statearr_39109_41268[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39108 === (20))){
var state_39104__$1 = state_39104;
var statearr_39110_41269 = state_39104__$1;
(statearr_39110_41269[(2)] = null);

(statearr_39110_41269[(1)] = (21));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39108 === (1))){
var state_39104__$1 = state_39104;
var statearr_39111_41270 = state_39104__$1;
(statearr_39111_41270[(2)] = null);

(statearr_39111_41270[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39108 === (24))){
var inst_39077 = (state_39104[(7)]);
var inst_39091 = cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(mults,cljs.core.dissoc,inst_39077);
var state_39104__$1 = state_39104;
var statearr_39112_41271 = state_39104__$1;
(statearr_39112_41271[(2)] = inst_39091);

(statearr_39112_41271[(1)] = (25));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39108 === (4))){
var inst_39024 = (state_39104[(8)]);
var inst_39024__$1 = (state_39104[(2)]);
var inst_39025 = (inst_39024__$1 == null);
var state_39104__$1 = (function (){var statearr_39113 = state_39104;
(statearr_39113[(8)] = inst_39024__$1);

return statearr_39113;
})();
if(cljs.core.truth_(inst_39025)){
var statearr_39114_41276 = state_39104__$1;
(statearr_39114_41276[(1)] = (5));

} else {
var statearr_39115_41277 = state_39104__$1;
(statearr_39115_41277[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39108 === (15))){
var inst_39071 = (state_39104[(2)]);
var state_39104__$1 = state_39104;
var statearr_39117_41278 = state_39104__$1;
(statearr_39117_41278[(2)] = inst_39071);

(statearr_39117_41278[(1)] = (12));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39108 === (21))){
var inst_39096 = (state_39104[(2)]);
var state_39104__$1 = (function (){var statearr_39119 = state_39104;
(statearr_39119[(9)] = inst_39096);

return statearr_39119;
})();
var statearr_39121_41279 = state_39104__$1;
(statearr_39121_41279[(2)] = null);

(statearr_39121_41279[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39108 === (13))){
var inst_39053 = (state_39104[(10)]);
var inst_39055 = cljs.core.chunked_seq_QMARK_(inst_39053);
var state_39104__$1 = state_39104;
if(inst_39055){
var statearr_39122_41280 = state_39104__$1;
(statearr_39122_41280[(1)] = (16));

} else {
var statearr_39124_41281 = state_39104__$1;
(statearr_39124_41281[(1)] = (17));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39108 === (22))){
var inst_39088 = (state_39104[(2)]);
var state_39104__$1 = state_39104;
if(cljs.core.truth_(inst_39088)){
var statearr_39125_41283 = state_39104__$1;
(statearr_39125_41283[(1)] = (23));

} else {
var statearr_39126_41285 = state_39104__$1;
(statearr_39126_41285[(1)] = (24));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39108 === (6))){
var inst_39024 = (state_39104[(8)]);
var inst_39077 = (state_39104[(7)]);
var inst_39084 = (state_39104[(11)]);
var inst_39077__$1 = (topic_fn.cljs$core$IFn$_invoke$arity$1 ? topic_fn.cljs$core$IFn$_invoke$arity$1(inst_39024) : topic_fn.call(null,inst_39024));
var inst_39082 = cljs.core.deref(mults);
var inst_39084__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_39082,inst_39077__$1);
var state_39104__$1 = (function (){var statearr_39128 = state_39104;
(statearr_39128[(7)] = inst_39077__$1);

(statearr_39128[(11)] = inst_39084__$1);

return statearr_39128;
})();
if(cljs.core.truth_(inst_39084__$1)){
var statearr_39129_41286 = state_39104__$1;
(statearr_39129_41286[(1)] = (19));

} else {
var statearr_39131_41287 = state_39104__$1;
(statearr_39131_41287[(1)] = (20));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39108 === (25))){
var inst_39093 = (state_39104[(2)]);
var state_39104__$1 = state_39104;
var statearr_39134_41288 = state_39104__$1;
(statearr_39134_41288[(2)] = inst_39093);

(statearr_39134_41288[(1)] = (21));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39108 === (17))){
var inst_39053 = (state_39104[(10)]);
var inst_39062 = cljs.core.first(inst_39053);
var inst_39063 = cljs.core.async.muxch_STAR_(inst_39062);
var inst_39064 = cljs.core.async.close_BANG_(inst_39063);
var inst_39065 = cljs.core.next(inst_39053);
var inst_39035 = inst_39065;
var inst_39036 = null;
var inst_39037 = (0);
var inst_39038 = (0);
var state_39104__$1 = (function (){var statearr_39136 = state_39104;
(statearr_39136[(12)] = inst_39064);

(statearr_39136[(13)] = inst_39035);

(statearr_39136[(14)] = inst_39036);

(statearr_39136[(15)] = inst_39037);

(statearr_39136[(16)] = inst_39038);

return statearr_39136;
})();
var statearr_39137_41295 = state_39104__$1;
(statearr_39137_41295[(2)] = null);

(statearr_39137_41295[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39108 === (3))){
var inst_39102 = (state_39104[(2)]);
var state_39104__$1 = state_39104;
return cljs.core.async.impl.ioc_helpers.return_chan(state_39104__$1,inst_39102);
} else {
if((state_val_39108 === (12))){
var inst_39073 = (state_39104[(2)]);
var state_39104__$1 = state_39104;
var statearr_39141_41299 = state_39104__$1;
(statearr_39141_41299[(2)] = inst_39073);

(statearr_39141_41299[(1)] = (9));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39108 === (2))){
var state_39104__$1 = state_39104;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_39104__$1,(4),ch);
} else {
if((state_val_39108 === (23))){
var state_39104__$1 = state_39104;
var statearr_39144_41300 = state_39104__$1;
(statearr_39144_41300[(2)] = null);

(statearr_39144_41300[(1)] = (25));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39108 === (19))){
var inst_39084 = (state_39104[(11)]);
var inst_39024 = (state_39104[(8)]);
var inst_39086 = cljs.core.async.muxch_STAR_(inst_39084);
var state_39104__$1 = state_39104;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_39104__$1,(22),inst_39086,inst_39024);
} else {
if((state_val_39108 === (11))){
var inst_39035 = (state_39104[(13)]);
var inst_39053 = (state_39104[(10)]);
var inst_39053__$1 = cljs.core.seq(inst_39035);
var state_39104__$1 = (function (){var statearr_39148 = state_39104;
(statearr_39148[(10)] = inst_39053__$1);

return statearr_39148;
})();
if(inst_39053__$1){
var statearr_39149_41303 = state_39104__$1;
(statearr_39149_41303[(1)] = (13));

} else {
var statearr_39150_41307 = state_39104__$1;
(statearr_39150_41307[(1)] = (14));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39108 === (9))){
var inst_39075 = (state_39104[(2)]);
var state_39104__$1 = state_39104;
var statearr_39152_41308 = state_39104__$1;
(statearr_39152_41308[(2)] = inst_39075);

(statearr_39152_41308[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39108 === (5))){
var inst_39032 = cljs.core.deref(mults);
var inst_39033 = cljs.core.vals(inst_39032);
var inst_39034 = cljs.core.seq(inst_39033);
var inst_39035 = inst_39034;
var inst_39036 = null;
var inst_39037 = (0);
var inst_39038 = (0);
var state_39104__$1 = (function (){var statearr_39155 = state_39104;
(statearr_39155[(13)] = inst_39035);

(statearr_39155[(14)] = inst_39036);

(statearr_39155[(15)] = inst_39037);

(statearr_39155[(16)] = inst_39038);

return statearr_39155;
})();
var statearr_39157_41312 = state_39104__$1;
(statearr_39157_41312[(2)] = null);

(statearr_39157_41312[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39108 === (14))){
var state_39104__$1 = state_39104;
var statearr_39161_41313 = state_39104__$1;
(statearr_39161_41313[(2)] = null);

(statearr_39161_41313[(1)] = (15));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39108 === (16))){
var inst_39053 = (state_39104[(10)]);
var inst_39057 = cljs.core.chunk_first(inst_39053);
var inst_39058 = cljs.core.chunk_rest(inst_39053);
var inst_39059 = cljs.core.count(inst_39057);
var inst_39035 = inst_39058;
var inst_39036 = inst_39057;
var inst_39037 = inst_39059;
var inst_39038 = (0);
var state_39104__$1 = (function (){var statearr_39165 = state_39104;
(statearr_39165[(13)] = inst_39035);

(statearr_39165[(14)] = inst_39036);

(statearr_39165[(15)] = inst_39037);

(statearr_39165[(16)] = inst_39038);

return statearr_39165;
})();
var statearr_39167_41314 = state_39104__$1;
(statearr_39167_41314[(2)] = null);

(statearr_39167_41314[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39108 === (10))){
var inst_39036 = (state_39104[(14)]);
var inst_39038 = (state_39104[(16)]);
var inst_39035 = (state_39104[(13)]);
var inst_39037 = (state_39104[(15)]);
var inst_39045 = cljs.core._nth(inst_39036,inst_39038);
var inst_39046 = cljs.core.async.muxch_STAR_(inst_39045);
var inst_39047 = cljs.core.async.close_BANG_(inst_39046);
var inst_39048 = (inst_39038 + (1));
var tmp39158 = inst_39035;
var tmp39159 = inst_39037;
var tmp39160 = inst_39036;
var inst_39035__$1 = tmp39158;
var inst_39036__$1 = tmp39160;
var inst_39037__$1 = tmp39159;
var inst_39038__$1 = inst_39048;
var state_39104__$1 = (function (){var statearr_39171 = state_39104;
(statearr_39171[(17)] = inst_39047);

(statearr_39171[(13)] = inst_39035__$1);

(statearr_39171[(14)] = inst_39036__$1);

(statearr_39171[(15)] = inst_39037__$1);

(statearr_39171[(16)] = inst_39038__$1);

return statearr_39171;
})();
var statearr_39173_41321 = state_39104__$1;
(statearr_39173_41321[(2)] = null);

(statearr_39173_41321[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39108 === (18))){
var inst_39068 = (state_39104[(2)]);
var state_39104__$1 = state_39104;
var statearr_39174_41322 = state_39104__$1;
(statearr_39174_41322[(2)] = inst_39068);

(statearr_39174_41322[(1)] = (15));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39108 === (8))){
var inst_39038 = (state_39104[(16)]);
var inst_39037 = (state_39104[(15)]);
var inst_39040 = (inst_39038 < inst_39037);
var inst_39041 = inst_39040;
var state_39104__$1 = state_39104;
if(cljs.core.truth_(inst_39041)){
var statearr_39177_41323 = state_39104__$1;
(statearr_39177_41323[(1)] = (10));

} else {
var statearr_39179_41324 = state_39104__$1;
(statearr_39179_41324[(1)] = (11));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var cljs$core$async$state_machine__36595__auto__ = null;
var cljs$core$async$state_machine__36595__auto____0 = (function (){
var statearr_39181 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_39181[(0)] = cljs$core$async$state_machine__36595__auto__);

(statearr_39181[(1)] = (1));

return statearr_39181;
});
var cljs$core$async$state_machine__36595__auto____1 = (function (state_39104){
while(true){
var ret_value__36596__auto__ = (function (){try{while(true){
var result__36597__auto__ = switch__36594__auto__(state_39104);
if(cljs.core.keyword_identical_QMARK_(result__36597__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__36597__auto__;
}
break;
}
}catch (e39185){var ex__36598__auto__ = e39185;
var statearr_39186_41331 = state_39104;
(statearr_39186_41331[(2)] = ex__36598__auto__);


if(cljs.core.seq((state_39104[(4)]))){
var statearr_39187_41332 = state_39104;
(statearr_39187_41332[(1)] = cljs.core.first((state_39104[(4)])));

} else {
throw ex__36598__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__36596__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__41333 = state_39104;
state_39104 = G__41333;
continue;
} else {
return ret_value__36596__auto__;
}
break;
}
});
cljs$core$async$state_machine__36595__auto__ = function(state_39104){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__36595__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__36595__auto____1.call(this,state_39104);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__36595__auto____0;
cljs$core$async$state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__36595__auto____1;
return cljs$core$async$state_machine__36595__auto__;
})()
})();
var state__36898__auto__ = (function (){var statearr_39191 = f__36897__auto__();
(statearr_39191[(6)] = c__36895__auto___41267);

return statearr_39191;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__36898__auto__);
}));


return p;
}));

(cljs.core.async.pub.cljs$lang$maxFixedArity = 3);

/**
 * Subscribes a channel to a topic of a pub.
 * 
 *   By default the channel will be closed when the source closes,
 *   but can be determined by the close? parameter.
 */
cljs.core.async.sub = (function cljs$core$async$sub(var_args){
var G__39197 = arguments.length;
switch (G__39197) {
case 3:
return cljs.core.async.sub.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return cljs.core.async.sub.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.sub.cljs$core$IFn$_invoke$arity$3 = (function (p,topic,ch){
return cljs.core.async.sub.cljs$core$IFn$_invoke$arity$4(p,topic,ch,true);
}));

(cljs.core.async.sub.cljs$core$IFn$_invoke$arity$4 = (function (p,topic,ch,close_QMARK_){
return cljs.core.async.sub_STAR_(p,topic,ch,close_QMARK_);
}));

(cljs.core.async.sub.cljs$lang$maxFixedArity = 4);

/**
 * Unsubscribes a channel from a topic of a pub
 */
cljs.core.async.unsub = (function cljs$core$async$unsub(p,topic,ch){
return cljs.core.async.unsub_STAR_(p,topic,ch);
});
/**
 * Unsubscribes all channels from a pub, or a topic of a pub
 */
cljs.core.async.unsub_all = (function cljs$core$async$unsub_all(var_args){
var G__39210 = arguments.length;
switch (G__39210) {
case 1:
return cljs.core.async.unsub_all.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljs.core.async.unsub_all.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.unsub_all.cljs$core$IFn$_invoke$arity$1 = (function (p){
return cljs.core.async.unsub_all_STAR_(p);
}));

(cljs.core.async.unsub_all.cljs$core$IFn$_invoke$arity$2 = (function (p,topic){
return cljs.core.async.unsub_all_STAR_(p,topic);
}));

(cljs.core.async.unsub_all.cljs$lang$maxFixedArity = 2);

/**
 * Takes a function and a collection of source channels, and returns a
 *   channel which contains the values produced by applying f to the set
 *   of first items taken from each source channel, followed by applying
 *   f to the set of second items from each channel, until any one of the
 *   channels is closed, at which point the output channel will be
 *   closed. The returned channel will be unbuffered by default, or a
 *   buf-or-n can be supplied
 */
cljs.core.async.map = (function cljs$core$async$map(var_args){
var G__39221 = arguments.length;
switch (G__39221) {
case 2:
return cljs.core.async.map.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.core.async.map.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.map.cljs$core$IFn$_invoke$arity$2 = (function (f,chs){
return cljs.core.async.map.cljs$core$IFn$_invoke$arity$3(f,chs,null);
}));

(cljs.core.async.map.cljs$core$IFn$_invoke$arity$3 = (function (f,chs,buf_or_n){
var chs__$1 = cljs.core.vec(chs);
var out = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1(buf_or_n);
var cnt = cljs.core.count(chs__$1);
var rets = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(cnt);
var dchan = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
var dctr = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
var done = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (i){
return (function (ret){
(rets[i] = ret);

if((cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(dctr,cljs.core.dec) === (0))){
return cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$2(dchan,rets.slice((0)));
} else {
return null;
}
});
}),cljs.core.range.cljs$core$IFn$_invoke$arity$1(cnt));
if((cnt === (0))){
cljs.core.async.close_BANG_(out);
} else {
var c__36895__auto___41341 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__36897__auto__ = (function (){var switch__36594__auto__ = (function (state_39417){
var state_val_39418 = (state_39417[(1)]);
if((state_val_39418 === (7))){
var state_39417__$1 = state_39417;
var statearr_39425_41342 = state_39417__$1;
(statearr_39425_41342[(2)] = null);

(statearr_39425_41342[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39418 === (1))){
var state_39417__$1 = state_39417;
var statearr_39426_41343 = state_39417__$1;
(statearr_39426_41343[(2)] = null);

(statearr_39426_41343[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39418 === (4))){
var inst_39267 = (state_39417[(7)]);
var inst_39266 = (state_39417[(8)]);
var inst_39269 = (inst_39267 < inst_39266);
var state_39417__$1 = state_39417;
if(cljs.core.truth_(inst_39269)){
var statearr_39433_41344 = state_39417__$1;
(statearr_39433_41344[(1)] = (6));

} else {
var statearr_39435_41345 = state_39417__$1;
(statearr_39435_41345[(1)] = (7));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39418 === (15))){
var inst_39308 = (state_39417[(9)]);
var inst_39313 = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,inst_39308);
var state_39417__$1 = state_39417;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_39417__$1,(17),out,inst_39313);
} else {
if((state_val_39418 === (13))){
var inst_39308 = (state_39417[(9)]);
var inst_39308__$1 = (state_39417[(2)]);
var inst_39309 = cljs.core.some(cljs.core.nil_QMARK_,inst_39308__$1);
var state_39417__$1 = (function (){var statearr_39440 = state_39417;
(statearr_39440[(9)] = inst_39308__$1);

return statearr_39440;
})();
if(cljs.core.truth_(inst_39309)){
var statearr_39441_41346 = state_39417__$1;
(statearr_39441_41346[(1)] = (14));

} else {
var statearr_39442_41347 = state_39417__$1;
(statearr_39442_41347[(1)] = (15));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39418 === (6))){
var state_39417__$1 = state_39417;
var statearr_39446_41348 = state_39417__$1;
(statearr_39446_41348[(2)] = null);

(statearr_39446_41348[(1)] = (9));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39418 === (17))){
var inst_39315 = (state_39417[(2)]);
var state_39417__$1 = (function (){var statearr_39483 = state_39417;
(statearr_39483[(10)] = inst_39315);

return statearr_39483;
})();
var statearr_39488_41349 = state_39417__$1;
(statearr_39488_41349[(2)] = null);

(statearr_39488_41349[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39418 === (3))){
var inst_39320 = (state_39417[(2)]);
var state_39417__$1 = state_39417;
return cljs.core.async.impl.ioc_helpers.return_chan(state_39417__$1,inst_39320);
} else {
if((state_val_39418 === (12))){
var _ = (function (){var statearr_39492 = state_39417;
(statearr_39492[(4)] = cljs.core.rest((state_39417[(4)])));

return statearr_39492;
})();
var state_39417__$1 = state_39417;
var ex39451 = (state_39417__$1[(2)]);
var statearr_39493_41350 = state_39417__$1;
(statearr_39493_41350[(5)] = ex39451);


if((ex39451 instanceof Object)){
var statearr_39514_41351 = state_39417__$1;
(statearr_39514_41351[(1)] = (11));

(statearr_39514_41351[(5)] = null);

} else {
throw ex39451;

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39418 === (2))){
var inst_39264 = cljs.core.reset_BANG_(dctr,cnt);
var inst_39266 = cnt;
var inst_39267 = (0);
var state_39417__$1 = (function (){var statearr_39526 = state_39417;
(statearr_39526[(11)] = inst_39264);

(statearr_39526[(8)] = inst_39266);

(statearr_39526[(7)] = inst_39267);

return statearr_39526;
})();
var statearr_39530_41352 = state_39417__$1;
(statearr_39530_41352[(2)] = null);

(statearr_39530_41352[(1)] = (4));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39418 === (11))){
var inst_39283 = (state_39417[(2)]);
var inst_39284 = cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(dctr,cljs.core.dec);
var state_39417__$1 = (function (){var statearr_39533 = state_39417;
(statearr_39533[(12)] = inst_39283);

return statearr_39533;
})();
var statearr_39534_41353 = state_39417__$1;
(statearr_39534_41353[(2)] = inst_39284);

(statearr_39534_41353[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39418 === (9))){
var inst_39267 = (state_39417[(7)]);
var _ = (function (){var statearr_39547 = state_39417;
(statearr_39547[(4)] = cljs.core.cons((12),(state_39417[(4)])));

return statearr_39547;
})();
var inst_39292 = (chs__$1.cljs$core$IFn$_invoke$arity$1 ? chs__$1.cljs$core$IFn$_invoke$arity$1(inst_39267) : chs__$1.call(null,inst_39267));
var inst_39293 = (done.cljs$core$IFn$_invoke$arity$1 ? done.cljs$core$IFn$_invoke$arity$1(inst_39267) : done.call(null,inst_39267));
var inst_39294 = cljs.core.async.take_BANG_.cljs$core$IFn$_invoke$arity$2(inst_39292,inst_39293);
var ___$1 = (function (){var statearr_39555 = state_39417;
(statearr_39555[(4)] = cljs.core.rest((state_39417[(4)])));

return statearr_39555;
})();
var state_39417__$1 = state_39417;
var statearr_39558_41359 = state_39417__$1;
(statearr_39558_41359[(2)] = inst_39294);

(statearr_39558_41359[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39418 === (5))){
var inst_39305 = (state_39417[(2)]);
var state_39417__$1 = (function (){var statearr_39559 = state_39417;
(statearr_39559[(13)] = inst_39305);

return statearr_39559;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_39417__$1,(13),dchan);
} else {
if((state_val_39418 === (14))){
var inst_39311 = cljs.core.async.close_BANG_(out);
var state_39417__$1 = state_39417;
var statearr_39562_41365 = state_39417__$1;
(statearr_39562_41365[(2)] = inst_39311);

(statearr_39562_41365[(1)] = (16));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39418 === (16))){
var inst_39318 = (state_39417[(2)]);
var state_39417__$1 = state_39417;
var statearr_39567_41366 = state_39417__$1;
(statearr_39567_41366[(2)] = inst_39318);

(statearr_39567_41366[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39418 === (10))){
var inst_39267 = (state_39417[(7)]);
var inst_39297 = (state_39417[(2)]);
var inst_39299 = (inst_39267 + (1));
var inst_39267__$1 = inst_39299;
var state_39417__$1 = (function (){var statearr_39569 = state_39417;
(statearr_39569[(14)] = inst_39297);

(statearr_39569[(7)] = inst_39267__$1);

return statearr_39569;
})();
var statearr_39570_41367 = state_39417__$1;
(statearr_39570_41367[(2)] = null);

(statearr_39570_41367[(1)] = (4));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39418 === (8))){
var inst_39303 = (state_39417[(2)]);
var state_39417__$1 = state_39417;
var statearr_39579_41368 = state_39417__$1;
(statearr_39579_41368[(2)] = inst_39303);

(statearr_39579_41368[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var cljs$core$async$state_machine__36595__auto__ = null;
var cljs$core$async$state_machine__36595__auto____0 = (function (){
var statearr_39588 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_39588[(0)] = cljs$core$async$state_machine__36595__auto__);

(statearr_39588[(1)] = (1));

return statearr_39588;
});
var cljs$core$async$state_machine__36595__auto____1 = (function (state_39417){
while(true){
var ret_value__36596__auto__ = (function (){try{while(true){
var result__36597__auto__ = switch__36594__auto__(state_39417);
if(cljs.core.keyword_identical_QMARK_(result__36597__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__36597__auto__;
}
break;
}
}catch (e39591){var ex__36598__auto__ = e39591;
var statearr_39592_41369 = state_39417;
(statearr_39592_41369[(2)] = ex__36598__auto__);


if(cljs.core.seq((state_39417[(4)]))){
var statearr_39596_41370 = state_39417;
(statearr_39596_41370[(1)] = cljs.core.first((state_39417[(4)])));

} else {
throw ex__36598__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__36596__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__41371 = state_39417;
state_39417 = G__41371;
continue;
} else {
return ret_value__36596__auto__;
}
break;
}
});
cljs$core$async$state_machine__36595__auto__ = function(state_39417){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__36595__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__36595__auto____1.call(this,state_39417);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__36595__auto____0;
cljs$core$async$state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__36595__auto____1;
return cljs$core$async$state_machine__36595__auto__;
})()
})();
var state__36898__auto__ = (function (){var statearr_39599 = f__36897__auto__();
(statearr_39599[(6)] = c__36895__auto___41341);

return statearr_39599;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__36898__auto__);
}));

}

return out;
}));

(cljs.core.async.map.cljs$lang$maxFixedArity = 3);

/**
 * Takes a collection of source channels and returns a channel which
 *   contains all values taken from them. The returned channel will be
 *   unbuffered by default, or a buf-or-n can be supplied. The channel
 *   will close after all the source channels have closed.
 */
cljs.core.async.merge = (function cljs$core$async$merge(var_args){
var G__39628 = arguments.length;
switch (G__39628) {
case 1:
return cljs.core.async.merge.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljs.core.async.merge.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.merge.cljs$core$IFn$_invoke$arity$1 = (function (chs){
return cljs.core.async.merge.cljs$core$IFn$_invoke$arity$2(chs,null);
}));

(cljs.core.async.merge.cljs$core$IFn$_invoke$arity$2 = (function (chs,buf_or_n){
var out = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1(buf_or_n);
var c__36895__auto___41374 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__36897__auto__ = (function (){var switch__36594__auto__ = (function (state_39704){
var state_val_39705 = (state_39704[(1)]);
if((state_val_39705 === (7))){
var inst_39660 = (state_39704[(7)]);
var inst_39667 = (state_39704[(8)]);
var inst_39660__$1 = (state_39704[(2)]);
var inst_39667__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_39660__$1,(0),null);
var inst_39669 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_39660__$1,(1),null);
var inst_39672 = (inst_39667__$1 == null);
var state_39704__$1 = (function (){var statearr_39731 = state_39704;
(statearr_39731[(7)] = inst_39660__$1);

(statearr_39731[(8)] = inst_39667__$1);

(statearr_39731[(9)] = inst_39669);

return statearr_39731;
})();
if(cljs.core.truth_(inst_39672)){
var statearr_39732_41375 = state_39704__$1;
(statearr_39732_41375[(1)] = (8));

} else {
var statearr_39733_41376 = state_39704__$1;
(statearr_39733_41376[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39705 === (1))){
var inst_39647 = cljs.core.vec(chs);
var inst_39648 = inst_39647;
var state_39704__$1 = (function (){var statearr_39738 = state_39704;
(statearr_39738[(10)] = inst_39648);

return statearr_39738;
})();
var statearr_39739_41377 = state_39704__$1;
(statearr_39739_41377[(2)] = null);

(statearr_39739_41377[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39705 === (4))){
var inst_39648 = (state_39704[(10)]);
var state_39704__$1 = state_39704;
return cljs.core.async.ioc_alts_BANG_(state_39704__$1,(7),inst_39648);
} else {
if((state_val_39705 === (6))){
var inst_39692 = (state_39704[(2)]);
var state_39704__$1 = state_39704;
var statearr_39747_41379 = state_39704__$1;
(statearr_39747_41379[(2)] = inst_39692);

(statearr_39747_41379[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39705 === (3))){
var inst_39694 = (state_39704[(2)]);
var state_39704__$1 = state_39704;
return cljs.core.async.impl.ioc_helpers.return_chan(state_39704__$1,inst_39694);
} else {
if((state_val_39705 === (2))){
var inst_39648 = (state_39704[(10)]);
var inst_39652 = cljs.core.count(inst_39648);
var inst_39653 = (inst_39652 > (0));
var state_39704__$1 = state_39704;
if(cljs.core.truth_(inst_39653)){
var statearr_39750_41380 = state_39704__$1;
(statearr_39750_41380[(1)] = (4));

} else {
var statearr_39751_41381 = state_39704__$1;
(statearr_39751_41381[(1)] = (5));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39705 === (11))){
var inst_39648 = (state_39704[(10)]);
var inst_39685 = (state_39704[(2)]);
var tmp39749 = inst_39648;
var inst_39648__$1 = tmp39749;
var state_39704__$1 = (function (){var statearr_39756 = state_39704;
(statearr_39756[(11)] = inst_39685);

(statearr_39756[(10)] = inst_39648__$1);

return statearr_39756;
})();
var statearr_39757_41387 = state_39704__$1;
(statearr_39757_41387[(2)] = null);

(statearr_39757_41387[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39705 === (9))){
var inst_39667 = (state_39704[(8)]);
var state_39704__$1 = state_39704;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_39704__$1,(11),out,inst_39667);
} else {
if((state_val_39705 === (5))){
var inst_39690 = cljs.core.async.close_BANG_(out);
var state_39704__$1 = state_39704;
var statearr_39760_41388 = state_39704__$1;
(statearr_39760_41388[(2)] = inst_39690);

(statearr_39760_41388[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39705 === (10))){
var inst_39688 = (state_39704[(2)]);
var state_39704__$1 = state_39704;
var statearr_39761_41389 = state_39704__$1;
(statearr_39761_41389[(2)] = inst_39688);

(statearr_39761_41389[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39705 === (8))){
var inst_39648 = (state_39704[(10)]);
var inst_39660 = (state_39704[(7)]);
var inst_39667 = (state_39704[(8)]);
var inst_39669 = (state_39704[(9)]);
var inst_39679 = (function (){var cs = inst_39648;
var vec__39656 = inst_39660;
var v = inst_39667;
var c = inst_39669;
return (function (p1__39616_SHARP_){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(c,p1__39616_SHARP_);
});
})();
var inst_39680 = cljs.core.filterv(inst_39679,inst_39648);
var inst_39648__$1 = inst_39680;
var state_39704__$1 = (function (){var statearr_39766 = state_39704;
(statearr_39766[(10)] = inst_39648__$1);

return statearr_39766;
})();
var statearr_39768_41390 = state_39704__$1;
(statearr_39768_41390[(2)] = null);

(statearr_39768_41390[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var cljs$core$async$state_machine__36595__auto__ = null;
var cljs$core$async$state_machine__36595__auto____0 = (function (){
var statearr_39769 = [null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_39769[(0)] = cljs$core$async$state_machine__36595__auto__);

(statearr_39769[(1)] = (1));

return statearr_39769;
});
var cljs$core$async$state_machine__36595__auto____1 = (function (state_39704){
while(true){
var ret_value__36596__auto__ = (function (){try{while(true){
var result__36597__auto__ = switch__36594__auto__(state_39704);
if(cljs.core.keyword_identical_QMARK_(result__36597__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__36597__auto__;
}
break;
}
}catch (e39770){var ex__36598__auto__ = e39770;
var statearr_39772_41391 = state_39704;
(statearr_39772_41391[(2)] = ex__36598__auto__);


if(cljs.core.seq((state_39704[(4)]))){
var statearr_39773_41392 = state_39704;
(statearr_39773_41392[(1)] = cljs.core.first((state_39704[(4)])));

} else {
throw ex__36598__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__36596__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__41393 = state_39704;
state_39704 = G__41393;
continue;
} else {
return ret_value__36596__auto__;
}
break;
}
});
cljs$core$async$state_machine__36595__auto__ = function(state_39704){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__36595__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__36595__auto____1.call(this,state_39704);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__36595__auto____0;
cljs$core$async$state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__36595__auto____1;
return cljs$core$async$state_machine__36595__auto__;
})()
})();
var state__36898__auto__ = (function (){var statearr_39777 = f__36897__auto__();
(statearr_39777[(6)] = c__36895__auto___41374);

return statearr_39777;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__36898__auto__);
}));


return out;
}));

(cljs.core.async.merge.cljs$lang$maxFixedArity = 2);

/**
 * Returns a channel containing the single (collection) result of the
 *   items taken from the channel conjoined to the supplied
 *   collection. ch must close before into produces a result.
 */
cljs.core.async.into = (function cljs$core$async$into(coll,ch){
return cljs.core.async.reduce(cljs.core.conj,coll,ch);
});
/**
 * Returns a channel that will return, at most, n items from ch. After n items
 * have been returned, or ch has been closed, the return chanel will close.
 * 
 *   The output channel is unbuffered by default, unless buf-or-n is given.
 */
cljs.core.async.take = (function cljs$core$async$take(var_args){
var G__39781 = arguments.length;
switch (G__39781) {
case 2:
return cljs.core.async.take.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.core.async.take.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.take.cljs$core$IFn$_invoke$arity$2 = (function (n,ch){
return cljs.core.async.take.cljs$core$IFn$_invoke$arity$3(n,ch,null);
}));

(cljs.core.async.take.cljs$core$IFn$_invoke$arity$3 = (function (n,ch,buf_or_n){
var out = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1(buf_or_n);
var c__36895__auto___41399 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__36897__auto__ = (function (){var switch__36594__auto__ = (function (state_39807){
var state_val_39808 = (state_39807[(1)]);
if((state_val_39808 === (7))){
var inst_39788 = (state_39807[(7)]);
var inst_39788__$1 = (state_39807[(2)]);
var inst_39789 = (inst_39788__$1 == null);
var inst_39790 = cljs.core.not(inst_39789);
var state_39807__$1 = (function (){var statearr_39809 = state_39807;
(statearr_39809[(7)] = inst_39788__$1);

return statearr_39809;
})();
if(inst_39790){
var statearr_39810_41401 = state_39807__$1;
(statearr_39810_41401[(1)] = (8));

} else {
var statearr_39811_41402 = state_39807__$1;
(statearr_39811_41402[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39808 === (1))){
var inst_39783 = (0);
var state_39807__$1 = (function (){var statearr_39812 = state_39807;
(statearr_39812[(8)] = inst_39783);

return statearr_39812;
})();
var statearr_39813_41404 = state_39807__$1;
(statearr_39813_41404[(2)] = null);

(statearr_39813_41404[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39808 === (4))){
var state_39807__$1 = state_39807;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_39807__$1,(7),ch);
} else {
if((state_val_39808 === (6))){
var inst_39801 = (state_39807[(2)]);
var state_39807__$1 = state_39807;
var statearr_39814_41408 = state_39807__$1;
(statearr_39814_41408[(2)] = inst_39801);

(statearr_39814_41408[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39808 === (3))){
var inst_39803 = (state_39807[(2)]);
var inst_39804 = cljs.core.async.close_BANG_(out);
var state_39807__$1 = (function (){var statearr_39815 = state_39807;
(statearr_39815[(9)] = inst_39803);

return statearr_39815;
})();
return cljs.core.async.impl.ioc_helpers.return_chan(state_39807__$1,inst_39804);
} else {
if((state_val_39808 === (2))){
var inst_39783 = (state_39807[(8)]);
var inst_39785 = (inst_39783 < n);
var state_39807__$1 = state_39807;
if(cljs.core.truth_(inst_39785)){
var statearr_39816_41410 = state_39807__$1;
(statearr_39816_41410[(1)] = (4));

} else {
var statearr_39817_41411 = state_39807__$1;
(statearr_39817_41411[(1)] = (5));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39808 === (11))){
var inst_39783 = (state_39807[(8)]);
var inst_39793 = (state_39807[(2)]);
var inst_39794 = (inst_39783 + (1));
var inst_39783__$1 = inst_39794;
var state_39807__$1 = (function (){var statearr_39818 = state_39807;
(statearr_39818[(10)] = inst_39793);

(statearr_39818[(8)] = inst_39783__$1);

return statearr_39818;
})();
var statearr_39819_41412 = state_39807__$1;
(statearr_39819_41412[(2)] = null);

(statearr_39819_41412[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39808 === (9))){
var state_39807__$1 = state_39807;
var statearr_39822_41413 = state_39807__$1;
(statearr_39822_41413[(2)] = null);

(statearr_39822_41413[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39808 === (5))){
var state_39807__$1 = state_39807;
var statearr_39825_41414 = state_39807__$1;
(statearr_39825_41414[(2)] = null);

(statearr_39825_41414[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39808 === (10))){
var inst_39798 = (state_39807[(2)]);
var state_39807__$1 = state_39807;
var statearr_39826_41416 = state_39807__$1;
(statearr_39826_41416[(2)] = inst_39798);

(statearr_39826_41416[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39808 === (8))){
var inst_39788 = (state_39807[(7)]);
var state_39807__$1 = state_39807;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_39807__$1,(11),out,inst_39788);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var cljs$core$async$state_machine__36595__auto__ = null;
var cljs$core$async$state_machine__36595__auto____0 = (function (){
var statearr_39827 = [null,null,null,null,null,null,null,null,null,null,null];
(statearr_39827[(0)] = cljs$core$async$state_machine__36595__auto__);

(statearr_39827[(1)] = (1));

return statearr_39827;
});
var cljs$core$async$state_machine__36595__auto____1 = (function (state_39807){
while(true){
var ret_value__36596__auto__ = (function (){try{while(true){
var result__36597__auto__ = switch__36594__auto__(state_39807);
if(cljs.core.keyword_identical_QMARK_(result__36597__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__36597__auto__;
}
break;
}
}catch (e39828){var ex__36598__auto__ = e39828;
var statearr_39829_41417 = state_39807;
(statearr_39829_41417[(2)] = ex__36598__auto__);


if(cljs.core.seq((state_39807[(4)]))){
var statearr_39830_41422 = state_39807;
(statearr_39830_41422[(1)] = cljs.core.first((state_39807[(4)])));

} else {
throw ex__36598__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__36596__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__41423 = state_39807;
state_39807 = G__41423;
continue;
} else {
return ret_value__36596__auto__;
}
break;
}
});
cljs$core$async$state_machine__36595__auto__ = function(state_39807){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__36595__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__36595__auto____1.call(this,state_39807);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__36595__auto____0;
cljs$core$async$state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__36595__auto____1;
return cljs$core$async$state_machine__36595__auto__;
})()
})();
var state__36898__auto__ = (function (){var statearr_39831 = f__36897__auto__();
(statearr_39831[(6)] = c__36895__auto___41399);

return statearr_39831;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__36898__auto__);
}));


return out;
}));

(cljs.core.async.take.cljs$lang$maxFixedArity = 3);


/**
* @constructor
 * @implements {cljs.core.async.impl.protocols.Handler}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
cljs.core.async.t_cljs$core$async39855 = (function (f,ch,meta39850,_,fn1,meta39856){
this.f = f;
this.ch = ch;
this.meta39850 = meta39850;
this._ = _;
this.fn1 = fn1;
this.meta39856 = meta39856;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async39855.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_39857,meta39856__$1){
var self__ = this;
var _39857__$1 = this;
return (new cljs.core.async.t_cljs$core$async39855(self__.f,self__.ch,self__.meta39850,self__._,self__.fn1,meta39856__$1));
}));

(cljs.core.async.t_cljs$core$async39855.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_39857){
var self__ = this;
var _39857__$1 = this;
return self__.meta39856;
}));

(cljs.core.async.t_cljs$core$async39855.prototype.cljs$core$async$impl$protocols$Handler$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async39855.prototype.cljs$core$async$impl$protocols$Handler$active_QMARK_$arity$1 = (function (___$1){
var self__ = this;
var ___$2 = this;
return cljs.core.async.impl.protocols.active_QMARK_(self__.fn1);
}));

(cljs.core.async.t_cljs$core$async39855.prototype.cljs$core$async$impl$protocols$Handler$blockable_QMARK_$arity$1 = (function (___$1){
var self__ = this;
var ___$2 = this;
return true;
}));

(cljs.core.async.t_cljs$core$async39855.prototype.cljs$core$async$impl$protocols$Handler$commit$arity$1 = (function (___$1){
var self__ = this;
var ___$2 = this;
var f1 = cljs.core.async.impl.protocols.commit(self__.fn1);
return (function (p1__39845_SHARP_){
var G__39863 = (((p1__39845_SHARP_ == null))?null:(self__.f.cljs$core$IFn$_invoke$arity$1 ? self__.f.cljs$core$IFn$_invoke$arity$1(p1__39845_SHARP_) : self__.f.call(null,p1__39845_SHARP_)));
return (f1.cljs$core$IFn$_invoke$arity$1 ? f1.cljs$core$IFn$_invoke$arity$1(G__39863) : f1.call(null,G__39863));
});
}));

(cljs.core.async.t_cljs$core$async39855.getBasis = (function (){
return new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"f","f",43394975,null),new cljs.core.Symbol(null,"ch","ch",1085813622,null),new cljs.core.Symbol(null,"meta39850","meta39850",1421740449,null),cljs.core.with_meta(new cljs.core.Symbol(null,"_","_",-1201019570,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol("cljs.core.async","t_cljs$core$async39849","cljs.core.async/t_cljs$core$async39849",-458072103,null)], null)),new cljs.core.Symbol(null,"fn1","fn1",895834444,null),new cljs.core.Symbol(null,"meta39856","meta39856",-1898837018,null)], null);
}));

(cljs.core.async.t_cljs$core$async39855.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async39855.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async39855");

(cljs.core.async.t_cljs$core$async39855.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async39855");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async39855.
 */
cljs.core.async.__GT_t_cljs$core$async39855 = (function cljs$core$async$__GT_t_cljs$core$async39855(f,ch,meta39850,_,fn1,meta39856){
return (new cljs.core.async.t_cljs$core$async39855(f,ch,meta39850,_,fn1,meta39856));
});



/**
* @constructor
 * @implements {cljs.core.async.impl.protocols.Channel}
 * @implements {cljs.core.async.impl.protocols.WritePort}
 * @implements {cljs.core.async.impl.protocols.ReadPort}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
cljs.core.async.t_cljs$core$async39849 = (function (f,ch,meta39850){
this.f = f;
this.ch = ch;
this.meta39850 = meta39850;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async39849.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_39851,meta39850__$1){
var self__ = this;
var _39851__$1 = this;
return (new cljs.core.async.t_cljs$core$async39849(self__.f,self__.ch,meta39850__$1));
}));

(cljs.core.async.t_cljs$core$async39849.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_39851){
var self__ = this;
var _39851__$1 = this;
return self__.meta39850;
}));

(cljs.core.async.t_cljs$core$async39849.prototype.cljs$core$async$impl$protocols$Channel$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async39849.prototype.cljs$core$async$impl$protocols$Channel$close_BANG_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.close_BANG_(self__.ch);
}));

(cljs.core.async.t_cljs$core$async39849.prototype.cljs$core$async$impl$protocols$Channel$closed_QMARK_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.closed_QMARK_(self__.ch);
}));

(cljs.core.async.t_cljs$core$async39849.prototype.cljs$core$async$impl$protocols$ReadPort$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async39849.prototype.cljs$core$async$impl$protocols$ReadPort$take_BANG_$arity$2 = (function (_,fn1){
var self__ = this;
var ___$1 = this;
var ret = cljs.core.async.impl.protocols.take_BANG_(self__.ch,(new cljs.core.async.t_cljs$core$async39855(self__.f,self__.ch,self__.meta39850,___$1,fn1,cljs.core.PersistentArrayMap.EMPTY)));
if(cljs.core.truth_((function (){var and__5000__auto__ = ret;
if(cljs.core.truth_(and__5000__auto__)){
return (!((cljs.core.deref(ret) == null)));
} else {
return and__5000__auto__;
}
})())){
return cljs.core.async.impl.channels.box((function (){var G__39868 = cljs.core.deref(ret);
return (self__.f.cljs$core$IFn$_invoke$arity$1 ? self__.f.cljs$core$IFn$_invoke$arity$1(G__39868) : self__.f.call(null,G__39868));
})());
} else {
return ret;
}
}));

(cljs.core.async.t_cljs$core$async39849.prototype.cljs$core$async$impl$protocols$WritePort$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async39849.prototype.cljs$core$async$impl$protocols$WritePort$put_BANG_$arity$3 = (function (_,val,fn1){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.put_BANG_(self__.ch,val,fn1);
}));

(cljs.core.async.t_cljs$core$async39849.getBasis = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"f","f",43394975,null),new cljs.core.Symbol(null,"ch","ch",1085813622,null),new cljs.core.Symbol(null,"meta39850","meta39850",1421740449,null)], null);
}));

(cljs.core.async.t_cljs$core$async39849.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async39849.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async39849");

(cljs.core.async.t_cljs$core$async39849.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async39849");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async39849.
 */
cljs.core.async.__GT_t_cljs$core$async39849 = (function cljs$core$async$__GT_t_cljs$core$async39849(f,ch,meta39850){
return (new cljs.core.async.t_cljs$core$async39849(f,ch,meta39850));
});


/**
 * Deprecated - this function will be removed. Use transducer instead
 */
cljs.core.async.map_LT_ = (function cljs$core$async$map_LT_(f,ch){
return (new cljs.core.async.t_cljs$core$async39849(f,ch,cljs.core.PersistentArrayMap.EMPTY));
});

/**
* @constructor
 * @implements {cljs.core.async.impl.protocols.Channel}
 * @implements {cljs.core.async.impl.protocols.WritePort}
 * @implements {cljs.core.async.impl.protocols.ReadPort}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
cljs.core.async.t_cljs$core$async39875 = (function (f,ch,meta39876){
this.f = f;
this.ch = ch;
this.meta39876 = meta39876;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async39875.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_39877,meta39876__$1){
var self__ = this;
var _39877__$1 = this;
return (new cljs.core.async.t_cljs$core$async39875(self__.f,self__.ch,meta39876__$1));
}));

(cljs.core.async.t_cljs$core$async39875.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_39877){
var self__ = this;
var _39877__$1 = this;
return self__.meta39876;
}));

(cljs.core.async.t_cljs$core$async39875.prototype.cljs$core$async$impl$protocols$Channel$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async39875.prototype.cljs$core$async$impl$protocols$Channel$close_BANG_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.close_BANG_(self__.ch);
}));

(cljs.core.async.t_cljs$core$async39875.prototype.cljs$core$async$impl$protocols$ReadPort$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async39875.prototype.cljs$core$async$impl$protocols$ReadPort$take_BANG_$arity$2 = (function (_,fn1){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.take_BANG_(self__.ch,fn1);
}));

(cljs.core.async.t_cljs$core$async39875.prototype.cljs$core$async$impl$protocols$WritePort$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async39875.prototype.cljs$core$async$impl$protocols$WritePort$put_BANG_$arity$3 = (function (_,val,fn1){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.put_BANG_(self__.ch,(self__.f.cljs$core$IFn$_invoke$arity$1 ? self__.f.cljs$core$IFn$_invoke$arity$1(val) : self__.f.call(null,val)),fn1);
}));

(cljs.core.async.t_cljs$core$async39875.getBasis = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"f","f",43394975,null),new cljs.core.Symbol(null,"ch","ch",1085813622,null),new cljs.core.Symbol(null,"meta39876","meta39876",-1582729429,null)], null);
}));

(cljs.core.async.t_cljs$core$async39875.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async39875.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async39875");

(cljs.core.async.t_cljs$core$async39875.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async39875");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async39875.
 */
cljs.core.async.__GT_t_cljs$core$async39875 = (function cljs$core$async$__GT_t_cljs$core$async39875(f,ch,meta39876){
return (new cljs.core.async.t_cljs$core$async39875(f,ch,meta39876));
});


/**
 * Deprecated - this function will be removed. Use transducer instead
 */
cljs.core.async.map_GT_ = (function cljs$core$async$map_GT_(f,ch){
return (new cljs.core.async.t_cljs$core$async39875(f,ch,cljs.core.PersistentArrayMap.EMPTY));
});

/**
* @constructor
 * @implements {cljs.core.async.impl.protocols.Channel}
 * @implements {cljs.core.async.impl.protocols.WritePort}
 * @implements {cljs.core.async.impl.protocols.ReadPort}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
cljs.core.async.t_cljs$core$async39888 = (function (p,ch,meta39889){
this.p = p;
this.ch = ch;
this.meta39889 = meta39889;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async39888.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_39890,meta39889__$1){
var self__ = this;
var _39890__$1 = this;
return (new cljs.core.async.t_cljs$core$async39888(self__.p,self__.ch,meta39889__$1));
}));

(cljs.core.async.t_cljs$core$async39888.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_39890){
var self__ = this;
var _39890__$1 = this;
return self__.meta39889;
}));

(cljs.core.async.t_cljs$core$async39888.prototype.cljs$core$async$impl$protocols$Channel$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async39888.prototype.cljs$core$async$impl$protocols$Channel$close_BANG_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.close_BANG_(self__.ch);
}));

(cljs.core.async.t_cljs$core$async39888.prototype.cljs$core$async$impl$protocols$Channel$closed_QMARK_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.closed_QMARK_(self__.ch);
}));

(cljs.core.async.t_cljs$core$async39888.prototype.cljs$core$async$impl$protocols$ReadPort$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async39888.prototype.cljs$core$async$impl$protocols$ReadPort$take_BANG_$arity$2 = (function (_,fn1){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.take_BANG_(self__.ch,fn1);
}));

(cljs.core.async.t_cljs$core$async39888.prototype.cljs$core$async$impl$protocols$WritePort$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async39888.prototype.cljs$core$async$impl$protocols$WritePort$put_BANG_$arity$3 = (function (_,val,fn1){
var self__ = this;
var ___$1 = this;
if(cljs.core.truth_((self__.p.cljs$core$IFn$_invoke$arity$1 ? self__.p.cljs$core$IFn$_invoke$arity$1(val) : self__.p.call(null,val)))){
return cljs.core.async.impl.protocols.put_BANG_(self__.ch,val,fn1);
} else {
return cljs.core.async.impl.channels.box(cljs.core.not(cljs.core.async.impl.protocols.closed_QMARK_(self__.ch)));
}
}));

(cljs.core.async.t_cljs$core$async39888.getBasis = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"p","p",1791580836,null),new cljs.core.Symbol(null,"ch","ch",1085813622,null),new cljs.core.Symbol(null,"meta39889","meta39889",510298444,null)], null);
}));

(cljs.core.async.t_cljs$core$async39888.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async39888.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async39888");

(cljs.core.async.t_cljs$core$async39888.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async39888");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async39888.
 */
cljs.core.async.__GT_t_cljs$core$async39888 = (function cljs$core$async$__GT_t_cljs$core$async39888(p,ch,meta39889){
return (new cljs.core.async.t_cljs$core$async39888(p,ch,meta39889));
});


/**
 * Deprecated - this function will be removed. Use transducer instead
 */
cljs.core.async.filter_GT_ = (function cljs$core$async$filter_GT_(p,ch){
return (new cljs.core.async.t_cljs$core$async39888(p,ch,cljs.core.PersistentArrayMap.EMPTY));
});
/**
 * Deprecated - this function will be removed. Use transducer instead
 */
cljs.core.async.remove_GT_ = (function cljs$core$async$remove_GT_(p,ch){
return cljs.core.async.filter_GT_(cljs.core.complement(p),ch);
});
/**
 * Deprecated - this function will be removed. Use transducer instead
 */
cljs.core.async.filter_LT_ = (function cljs$core$async$filter_LT_(var_args){
var G__39906 = arguments.length;
switch (G__39906) {
case 2:
return cljs.core.async.filter_LT_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.core.async.filter_LT_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.filter_LT_.cljs$core$IFn$_invoke$arity$2 = (function (p,ch){
return cljs.core.async.filter_LT_.cljs$core$IFn$_invoke$arity$3(p,ch,null);
}));

(cljs.core.async.filter_LT_.cljs$core$IFn$_invoke$arity$3 = (function (p,ch,buf_or_n){
var out = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1(buf_or_n);
var c__36895__auto___41439 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__36897__auto__ = (function (){var switch__36594__auto__ = (function (state_39947){
var state_val_39948 = (state_39947[(1)]);
if((state_val_39948 === (7))){
var inst_39939 = (state_39947[(2)]);
var state_39947__$1 = state_39947;
var statearr_39954_41440 = state_39947__$1;
(statearr_39954_41440[(2)] = inst_39939);

(statearr_39954_41440[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39948 === (1))){
var state_39947__$1 = state_39947;
var statearr_39956_41441 = state_39947__$1;
(statearr_39956_41441[(2)] = null);

(statearr_39956_41441[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39948 === (4))){
var inst_39920 = (state_39947[(7)]);
var inst_39920__$1 = (state_39947[(2)]);
var inst_39922 = (inst_39920__$1 == null);
var state_39947__$1 = (function (){var statearr_39963 = state_39947;
(statearr_39963[(7)] = inst_39920__$1);

return statearr_39963;
})();
if(cljs.core.truth_(inst_39922)){
var statearr_39964_41442 = state_39947__$1;
(statearr_39964_41442[(1)] = (5));

} else {
var statearr_39966_41443 = state_39947__$1;
(statearr_39966_41443[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39948 === (6))){
var inst_39920 = (state_39947[(7)]);
var inst_39930 = (p.cljs$core$IFn$_invoke$arity$1 ? p.cljs$core$IFn$_invoke$arity$1(inst_39920) : p.call(null,inst_39920));
var state_39947__$1 = state_39947;
if(cljs.core.truth_(inst_39930)){
var statearr_39967_41444 = state_39947__$1;
(statearr_39967_41444[(1)] = (8));

} else {
var statearr_39968_41445 = state_39947__$1;
(statearr_39968_41445[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39948 === (3))){
var inst_39942 = (state_39947[(2)]);
var state_39947__$1 = state_39947;
return cljs.core.async.impl.ioc_helpers.return_chan(state_39947__$1,inst_39942);
} else {
if((state_val_39948 === (2))){
var state_39947__$1 = state_39947;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_39947__$1,(4),ch);
} else {
if((state_val_39948 === (11))){
var inst_39933 = (state_39947[(2)]);
var state_39947__$1 = state_39947;
var statearr_39974_41447 = state_39947__$1;
(statearr_39974_41447[(2)] = inst_39933);

(statearr_39974_41447[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39948 === (9))){
var state_39947__$1 = state_39947;
var statearr_39979_41448 = state_39947__$1;
(statearr_39979_41448[(2)] = null);

(statearr_39979_41448[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39948 === (5))){
var inst_39924 = cljs.core.async.close_BANG_(out);
var state_39947__$1 = state_39947;
var statearr_39981_41450 = state_39947__$1;
(statearr_39981_41450[(2)] = inst_39924);

(statearr_39981_41450[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39948 === (10))){
var inst_39936 = (state_39947[(2)]);
var state_39947__$1 = (function (){var statearr_39984 = state_39947;
(statearr_39984[(8)] = inst_39936);

return statearr_39984;
})();
var statearr_39985_41451 = state_39947__$1;
(statearr_39985_41451[(2)] = null);

(statearr_39985_41451[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39948 === (8))){
var inst_39920 = (state_39947[(7)]);
var state_39947__$1 = state_39947;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_39947__$1,(11),out,inst_39920);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var cljs$core$async$state_machine__36595__auto__ = null;
var cljs$core$async$state_machine__36595__auto____0 = (function (){
var statearr_40046 = [null,null,null,null,null,null,null,null,null];
(statearr_40046[(0)] = cljs$core$async$state_machine__36595__auto__);

(statearr_40046[(1)] = (1));

return statearr_40046;
});
var cljs$core$async$state_machine__36595__auto____1 = (function (state_39947){
while(true){
var ret_value__36596__auto__ = (function (){try{while(true){
var result__36597__auto__ = switch__36594__auto__(state_39947);
if(cljs.core.keyword_identical_QMARK_(result__36597__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__36597__auto__;
}
break;
}
}catch (e40047){var ex__36598__auto__ = e40047;
var statearr_40048_41452 = state_39947;
(statearr_40048_41452[(2)] = ex__36598__auto__);


if(cljs.core.seq((state_39947[(4)]))){
var statearr_40049_41453 = state_39947;
(statearr_40049_41453[(1)] = cljs.core.first((state_39947[(4)])));

} else {
throw ex__36598__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__36596__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__41454 = state_39947;
state_39947 = G__41454;
continue;
} else {
return ret_value__36596__auto__;
}
break;
}
});
cljs$core$async$state_machine__36595__auto__ = function(state_39947){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__36595__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__36595__auto____1.call(this,state_39947);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__36595__auto____0;
cljs$core$async$state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__36595__auto____1;
return cljs$core$async$state_machine__36595__auto__;
})()
})();
var state__36898__auto__ = (function (){var statearr_40055 = f__36897__auto__();
(statearr_40055[(6)] = c__36895__auto___41439);

return statearr_40055;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__36898__auto__);
}));


return out;
}));

(cljs.core.async.filter_LT_.cljs$lang$maxFixedArity = 3);

/**
 * Deprecated - this function will be removed. Use transducer instead
 */
cljs.core.async.remove_LT_ = (function cljs$core$async$remove_LT_(var_args){
var G__40071 = arguments.length;
switch (G__40071) {
case 2:
return cljs.core.async.remove_LT_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.core.async.remove_LT_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.remove_LT_.cljs$core$IFn$_invoke$arity$2 = (function (p,ch){
return cljs.core.async.remove_LT_.cljs$core$IFn$_invoke$arity$3(p,ch,null);
}));

(cljs.core.async.remove_LT_.cljs$core$IFn$_invoke$arity$3 = (function (p,ch,buf_or_n){
return cljs.core.async.filter_LT_.cljs$core$IFn$_invoke$arity$3(cljs.core.complement(p),ch,buf_or_n);
}));

(cljs.core.async.remove_LT_.cljs$lang$maxFixedArity = 3);

cljs.core.async.mapcat_STAR_ = (function cljs$core$async$mapcat_STAR_(f,in$,out){
var c__36895__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__36897__auto__ = (function (){var switch__36594__auto__ = (function (state_40153){
var state_val_40154 = (state_40153[(1)]);
if((state_val_40154 === (7))){
var inst_40147 = (state_40153[(2)]);
var state_40153__$1 = state_40153;
var statearr_40163_41458 = state_40153__$1;
(statearr_40163_41458[(2)] = inst_40147);

(statearr_40163_41458[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40154 === (20))){
var inst_40116 = (state_40153[(7)]);
var inst_40128 = (state_40153[(2)]);
var inst_40129 = cljs.core.next(inst_40116);
var inst_40102 = inst_40129;
var inst_40103 = null;
var inst_40104 = (0);
var inst_40105 = (0);
var state_40153__$1 = (function (){var statearr_40170 = state_40153;
(statearr_40170[(8)] = inst_40128);

(statearr_40170[(9)] = inst_40102);

(statearr_40170[(10)] = inst_40103);

(statearr_40170[(11)] = inst_40104);

(statearr_40170[(12)] = inst_40105);

return statearr_40170;
})();
var statearr_40174_41459 = state_40153__$1;
(statearr_40174_41459[(2)] = null);

(statearr_40174_41459[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40154 === (1))){
var state_40153__$1 = state_40153;
var statearr_40176_41460 = state_40153__$1;
(statearr_40176_41460[(2)] = null);

(statearr_40176_41460[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40154 === (4))){
var inst_40091 = (state_40153[(13)]);
var inst_40091__$1 = (state_40153[(2)]);
var inst_40092 = (inst_40091__$1 == null);
var state_40153__$1 = (function (){var statearr_40177 = state_40153;
(statearr_40177[(13)] = inst_40091__$1);

return statearr_40177;
})();
if(cljs.core.truth_(inst_40092)){
var statearr_40178_41461 = state_40153__$1;
(statearr_40178_41461[(1)] = (5));

} else {
var statearr_40179_41462 = state_40153__$1;
(statearr_40179_41462[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40154 === (15))){
var state_40153__$1 = state_40153;
var statearr_40188_41463 = state_40153__$1;
(statearr_40188_41463[(2)] = null);

(statearr_40188_41463[(1)] = (16));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40154 === (21))){
var state_40153__$1 = state_40153;
var statearr_40190_41465 = state_40153__$1;
(statearr_40190_41465[(2)] = null);

(statearr_40190_41465[(1)] = (23));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40154 === (13))){
var inst_40105 = (state_40153[(12)]);
var inst_40102 = (state_40153[(9)]);
var inst_40103 = (state_40153[(10)]);
var inst_40104 = (state_40153[(11)]);
var inst_40112 = (state_40153[(2)]);
var inst_40113 = (inst_40105 + (1));
var tmp40182 = inst_40104;
var tmp40183 = inst_40102;
var tmp40184 = inst_40103;
var inst_40102__$1 = tmp40183;
var inst_40103__$1 = tmp40184;
var inst_40104__$1 = tmp40182;
var inst_40105__$1 = inst_40113;
var state_40153__$1 = (function (){var statearr_40194 = state_40153;
(statearr_40194[(14)] = inst_40112);

(statearr_40194[(9)] = inst_40102__$1);

(statearr_40194[(10)] = inst_40103__$1);

(statearr_40194[(11)] = inst_40104__$1);

(statearr_40194[(12)] = inst_40105__$1);

return statearr_40194;
})();
var statearr_40199_41466 = state_40153__$1;
(statearr_40199_41466[(2)] = null);

(statearr_40199_41466[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40154 === (22))){
var state_40153__$1 = state_40153;
var statearr_40201_41467 = state_40153__$1;
(statearr_40201_41467[(2)] = null);

(statearr_40201_41467[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40154 === (6))){
var inst_40091 = (state_40153[(13)]);
var inst_40100 = (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(inst_40091) : f.call(null,inst_40091));
var inst_40101 = cljs.core.seq(inst_40100);
var inst_40102 = inst_40101;
var inst_40103 = null;
var inst_40104 = (0);
var inst_40105 = (0);
var state_40153__$1 = (function (){var statearr_40205 = state_40153;
(statearr_40205[(9)] = inst_40102);

(statearr_40205[(10)] = inst_40103);

(statearr_40205[(11)] = inst_40104);

(statearr_40205[(12)] = inst_40105);

return statearr_40205;
})();
var statearr_40206_41468 = state_40153__$1;
(statearr_40206_41468[(2)] = null);

(statearr_40206_41468[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40154 === (17))){
var inst_40116 = (state_40153[(7)]);
var inst_40121 = cljs.core.chunk_first(inst_40116);
var inst_40122 = cljs.core.chunk_rest(inst_40116);
var inst_40123 = cljs.core.count(inst_40121);
var inst_40102 = inst_40122;
var inst_40103 = inst_40121;
var inst_40104 = inst_40123;
var inst_40105 = (0);
var state_40153__$1 = (function (){var statearr_40210 = state_40153;
(statearr_40210[(9)] = inst_40102);

(statearr_40210[(10)] = inst_40103);

(statearr_40210[(11)] = inst_40104);

(statearr_40210[(12)] = inst_40105);

return statearr_40210;
})();
var statearr_40214_41469 = state_40153__$1;
(statearr_40214_41469[(2)] = null);

(statearr_40214_41469[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40154 === (3))){
var inst_40149 = (state_40153[(2)]);
var state_40153__$1 = state_40153;
return cljs.core.async.impl.ioc_helpers.return_chan(state_40153__$1,inst_40149);
} else {
if((state_val_40154 === (12))){
var inst_40137 = (state_40153[(2)]);
var state_40153__$1 = state_40153;
var statearr_40219_41470 = state_40153__$1;
(statearr_40219_41470[(2)] = inst_40137);

(statearr_40219_41470[(1)] = (9));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40154 === (2))){
var state_40153__$1 = state_40153;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_40153__$1,(4),in$);
} else {
if((state_val_40154 === (23))){
var inst_40145 = (state_40153[(2)]);
var state_40153__$1 = state_40153;
var statearr_40230_41471 = state_40153__$1;
(statearr_40230_41471[(2)] = inst_40145);

(statearr_40230_41471[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40154 === (19))){
var inst_40132 = (state_40153[(2)]);
var state_40153__$1 = state_40153;
var statearr_40231_41472 = state_40153__$1;
(statearr_40231_41472[(2)] = inst_40132);

(statearr_40231_41472[(1)] = (16));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40154 === (11))){
var inst_40102 = (state_40153[(9)]);
var inst_40116 = (state_40153[(7)]);
var inst_40116__$1 = cljs.core.seq(inst_40102);
var state_40153__$1 = (function (){var statearr_40234 = state_40153;
(statearr_40234[(7)] = inst_40116__$1);

return statearr_40234;
})();
if(inst_40116__$1){
var statearr_40235_41473 = state_40153__$1;
(statearr_40235_41473[(1)] = (14));

} else {
var statearr_40236_41474 = state_40153__$1;
(statearr_40236_41474[(1)] = (15));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40154 === (9))){
var inst_40139 = (state_40153[(2)]);
var inst_40140 = cljs.core.async.impl.protocols.closed_QMARK_(out);
var state_40153__$1 = (function (){var statearr_40237 = state_40153;
(statearr_40237[(15)] = inst_40139);

return statearr_40237;
})();
if(cljs.core.truth_(inst_40140)){
var statearr_40238_41475 = state_40153__$1;
(statearr_40238_41475[(1)] = (21));

} else {
var statearr_40239_41476 = state_40153__$1;
(statearr_40239_41476[(1)] = (22));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40154 === (5))){
var inst_40094 = cljs.core.async.close_BANG_(out);
var state_40153__$1 = state_40153;
var statearr_40241_41477 = state_40153__$1;
(statearr_40241_41477[(2)] = inst_40094);

(statearr_40241_41477[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40154 === (14))){
var inst_40116 = (state_40153[(7)]);
var inst_40118 = cljs.core.chunked_seq_QMARK_(inst_40116);
var state_40153__$1 = state_40153;
if(inst_40118){
var statearr_40243_41479 = state_40153__$1;
(statearr_40243_41479[(1)] = (17));

} else {
var statearr_40244_41482 = state_40153__$1;
(statearr_40244_41482[(1)] = (18));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40154 === (16))){
var inst_40135 = (state_40153[(2)]);
var state_40153__$1 = state_40153;
var statearr_40248_41484 = state_40153__$1;
(statearr_40248_41484[(2)] = inst_40135);

(statearr_40248_41484[(1)] = (12));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40154 === (10))){
var inst_40103 = (state_40153[(10)]);
var inst_40105 = (state_40153[(12)]);
var inst_40110 = cljs.core._nth(inst_40103,inst_40105);
var state_40153__$1 = state_40153;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_40153__$1,(13),out,inst_40110);
} else {
if((state_val_40154 === (18))){
var inst_40116 = (state_40153[(7)]);
var inst_40126 = cljs.core.first(inst_40116);
var state_40153__$1 = state_40153;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_40153__$1,(20),out,inst_40126);
} else {
if((state_val_40154 === (8))){
var inst_40105 = (state_40153[(12)]);
var inst_40104 = (state_40153[(11)]);
var inst_40107 = (inst_40105 < inst_40104);
var inst_40108 = inst_40107;
var state_40153__$1 = state_40153;
if(cljs.core.truth_(inst_40108)){
var statearr_40249_41485 = state_40153__$1;
(statearr_40249_41485[(1)] = (10));

} else {
var statearr_40250_41486 = state_40153__$1;
(statearr_40250_41486[(1)] = (11));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var cljs$core$async$mapcat_STAR__$_state_machine__36595__auto__ = null;
var cljs$core$async$mapcat_STAR__$_state_machine__36595__auto____0 = (function (){
var statearr_40251 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_40251[(0)] = cljs$core$async$mapcat_STAR__$_state_machine__36595__auto__);

(statearr_40251[(1)] = (1));

return statearr_40251;
});
var cljs$core$async$mapcat_STAR__$_state_machine__36595__auto____1 = (function (state_40153){
while(true){
var ret_value__36596__auto__ = (function (){try{while(true){
var result__36597__auto__ = switch__36594__auto__(state_40153);
if(cljs.core.keyword_identical_QMARK_(result__36597__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__36597__auto__;
}
break;
}
}catch (e40252){var ex__36598__auto__ = e40252;
var statearr_40253_41487 = state_40153;
(statearr_40253_41487[(2)] = ex__36598__auto__);


if(cljs.core.seq((state_40153[(4)]))){
var statearr_40254_41488 = state_40153;
(statearr_40254_41488[(1)] = cljs.core.first((state_40153[(4)])));

} else {
throw ex__36598__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__36596__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__41489 = state_40153;
state_40153 = G__41489;
continue;
} else {
return ret_value__36596__auto__;
}
break;
}
});
cljs$core$async$mapcat_STAR__$_state_machine__36595__auto__ = function(state_40153){
switch(arguments.length){
case 0:
return cljs$core$async$mapcat_STAR__$_state_machine__36595__auto____0.call(this);
case 1:
return cljs$core$async$mapcat_STAR__$_state_machine__36595__auto____1.call(this,state_40153);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$mapcat_STAR__$_state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$mapcat_STAR__$_state_machine__36595__auto____0;
cljs$core$async$mapcat_STAR__$_state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$mapcat_STAR__$_state_machine__36595__auto____1;
return cljs$core$async$mapcat_STAR__$_state_machine__36595__auto__;
})()
})();
var state__36898__auto__ = (function (){var statearr_40255 = f__36897__auto__();
(statearr_40255[(6)] = c__36895__auto__);

return statearr_40255;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__36898__auto__);
}));

return c__36895__auto__;
});
/**
 * Deprecated - this function will be removed. Use transducer instead
 */
cljs.core.async.mapcat_LT_ = (function cljs$core$async$mapcat_LT_(var_args){
var G__40257 = arguments.length;
switch (G__40257) {
case 2:
return cljs.core.async.mapcat_LT_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.core.async.mapcat_LT_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.mapcat_LT_.cljs$core$IFn$_invoke$arity$2 = (function (f,in$){
return cljs.core.async.mapcat_LT_.cljs$core$IFn$_invoke$arity$3(f,in$,null);
}));

(cljs.core.async.mapcat_LT_.cljs$core$IFn$_invoke$arity$3 = (function (f,in$,buf_or_n){
var out = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1(buf_or_n);
cljs.core.async.mapcat_STAR_(f,in$,out);

return out;
}));

(cljs.core.async.mapcat_LT_.cljs$lang$maxFixedArity = 3);

/**
 * Deprecated - this function will be removed. Use transducer instead
 */
cljs.core.async.mapcat_GT_ = (function cljs$core$async$mapcat_GT_(var_args){
var G__40264 = arguments.length;
switch (G__40264) {
case 2:
return cljs.core.async.mapcat_GT_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.core.async.mapcat_GT_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.mapcat_GT_.cljs$core$IFn$_invoke$arity$2 = (function (f,out){
return cljs.core.async.mapcat_GT_.cljs$core$IFn$_invoke$arity$3(f,out,null);
}));

(cljs.core.async.mapcat_GT_.cljs$core$IFn$_invoke$arity$3 = (function (f,out,buf_or_n){
var in$ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1(buf_or_n);
cljs.core.async.mapcat_STAR_(f,in$,out);

return in$;
}));

(cljs.core.async.mapcat_GT_.cljs$lang$maxFixedArity = 3);

/**
 * Deprecated - this function will be removed. Use transducer instead
 */
cljs.core.async.unique = (function cljs$core$async$unique(var_args){
var G__40269 = arguments.length;
switch (G__40269) {
case 1:
return cljs.core.async.unique.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljs.core.async.unique.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.unique.cljs$core$IFn$_invoke$arity$1 = (function (ch){
return cljs.core.async.unique.cljs$core$IFn$_invoke$arity$2(ch,null);
}));

(cljs.core.async.unique.cljs$core$IFn$_invoke$arity$2 = (function (ch,buf_or_n){
var out = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1(buf_or_n);
var c__36895__auto___41496 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__36897__auto__ = (function (){var switch__36594__auto__ = (function (state_40295){
var state_val_40296 = (state_40295[(1)]);
if((state_val_40296 === (7))){
var inst_40289 = (state_40295[(2)]);
var state_40295__$1 = state_40295;
var statearr_40297_41497 = state_40295__$1;
(statearr_40297_41497[(2)] = inst_40289);

(statearr_40297_41497[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40296 === (1))){
var inst_40270 = null;
var state_40295__$1 = (function (){var statearr_40301 = state_40295;
(statearr_40301[(7)] = inst_40270);

return statearr_40301;
})();
var statearr_40302_41502 = state_40295__$1;
(statearr_40302_41502[(2)] = null);

(statearr_40302_41502[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40296 === (4))){
var inst_40273 = (state_40295[(8)]);
var inst_40273__$1 = (state_40295[(2)]);
var inst_40274 = (inst_40273__$1 == null);
var inst_40275 = cljs.core.not(inst_40274);
var state_40295__$1 = (function (){var statearr_40306 = state_40295;
(statearr_40306[(8)] = inst_40273__$1);

return statearr_40306;
})();
if(inst_40275){
var statearr_40307_41503 = state_40295__$1;
(statearr_40307_41503[(1)] = (5));

} else {
var statearr_40308_41504 = state_40295__$1;
(statearr_40308_41504[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40296 === (6))){
var state_40295__$1 = state_40295;
var statearr_40309_41505 = state_40295__$1;
(statearr_40309_41505[(2)] = null);

(statearr_40309_41505[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40296 === (3))){
var inst_40291 = (state_40295[(2)]);
var inst_40292 = cljs.core.async.close_BANG_(out);
var state_40295__$1 = (function (){var statearr_40310 = state_40295;
(statearr_40310[(9)] = inst_40291);

return statearr_40310;
})();
return cljs.core.async.impl.ioc_helpers.return_chan(state_40295__$1,inst_40292);
} else {
if((state_val_40296 === (2))){
var state_40295__$1 = state_40295;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_40295__$1,(4),ch);
} else {
if((state_val_40296 === (11))){
var inst_40273 = (state_40295[(8)]);
var inst_40282 = (state_40295[(2)]);
var inst_40270 = inst_40273;
var state_40295__$1 = (function (){var statearr_40312 = state_40295;
(statearr_40312[(10)] = inst_40282);

(statearr_40312[(7)] = inst_40270);

return statearr_40312;
})();
var statearr_40313_41513 = state_40295__$1;
(statearr_40313_41513[(2)] = null);

(statearr_40313_41513[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40296 === (9))){
var inst_40273 = (state_40295[(8)]);
var state_40295__$1 = state_40295;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_40295__$1,(11),out,inst_40273);
} else {
if((state_val_40296 === (5))){
var inst_40273 = (state_40295[(8)]);
var inst_40270 = (state_40295[(7)]);
var inst_40277 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_40273,inst_40270);
var state_40295__$1 = state_40295;
if(inst_40277){
var statearr_40316_41514 = state_40295__$1;
(statearr_40316_41514[(1)] = (8));

} else {
var statearr_40317_41515 = state_40295__$1;
(statearr_40317_41515[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40296 === (10))){
var inst_40286 = (state_40295[(2)]);
var state_40295__$1 = state_40295;
var statearr_40318_41516 = state_40295__$1;
(statearr_40318_41516[(2)] = inst_40286);

(statearr_40318_41516[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40296 === (8))){
var inst_40270 = (state_40295[(7)]);
var tmp40314 = inst_40270;
var inst_40270__$1 = tmp40314;
var state_40295__$1 = (function (){var statearr_40319 = state_40295;
(statearr_40319[(7)] = inst_40270__$1);

return statearr_40319;
})();
var statearr_40320_41517 = state_40295__$1;
(statearr_40320_41517[(2)] = null);

(statearr_40320_41517[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var cljs$core$async$state_machine__36595__auto__ = null;
var cljs$core$async$state_machine__36595__auto____0 = (function (){
var statearr_40322 = [null,null,null,null,null,null,null,null,null,null,null];
(statearr_40322[(0)] = cljs$core$async$state_machine__36595__auto__);

(statearr_40322[(1)] = (1));

return statearr_40322;
});
var cljs$core$async$state_machine__36595__auto____1 = (function (state_40295){
while(true){
var ret_value__36596__auto__ = (function (){try{while(true){
var result__36597__auto__ = switch__36594__auto__(state_40295);
if(cljs.core.keyword_identical_QMARK_(result__36597__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__36597__auto__;
}
break;
}
}catch (e40324){var ex__36598__auto__ = e40324;
var statearr_40325_41521 = state_40295;
(statearr_40325_41521[(2)] = ex__36598__auto__);


if(cljs.core.seq((state_40295[(4)]))){
var statearr_40327_41522 = state_40295;
(statearr_40327_41522[(1)] = cljs.core.first((state_40295[(4)])));

} else {
throw ex__36598__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__36596__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__41523 = state_40295;
state_40295 = G__41523;
continue;
} else {
return ret_value__36596__auto__;
}
break;
}
});
cljs$core$async$state_machine__36595__auto__ = function(state_40295){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__36595__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__36595__auto____1.call(this,state_40295);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__36595__auto____0;
cljs$core$async$state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__36595__auto____1;
return cljs$core$async$state_machine__36595__auto__;
})()
})();
var state__36898__auto__ = (function (){var statearr_40330 = f__36897__auto__();
(statearr_40330[(6)] = c__36895__auto___41496);

return statearr_40330;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__36898__auto__);
}));


return out;
}));

(cljs.core.async.unique.cljs$lang$maxFixedArity = 2);

/**
 * Deprecated - this function will be removed. Use transducer instead
 */
cljs.core.async.partition = (function cljs$core$async$partition(var_args){
var G__40334 = arguments.length;
switch (G__40334) {
case 2:
return cljs.core.async.partition.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.core.async.partition.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.partition.cljs$core$IFn$_invoke$arity$2 = (function (n,ch){
return cljs.core.async.partition.cljs$core$IFn$_invoke$arity$3(n,ch,null);
}));

(cljs.core.async.partition.cljs$core$IFn$_invoke$arity$3 = (function (n,ch,buf_or_n){
var out = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1(buf_or_n);
var c__36895__auto___41528 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__36897__auto__ = (function (){var switch__36594__auto__ = (function (state_40376){
var state_val_40377 = (state_40376[(1)]);
if((state_val_40377 === (7))){
var inst_40372 = (state_40376[(2)]);
var state_40376__$1 = state_40376;
var statearr_40381_41529 = state_40376__$1;
(statearr_40381_41529[(2)] = inst_40372);

(statearr_40381_41529[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40377 === (1))){
var inst_40337 = (new Array(n));
var inst_40338 = inst_40337;
var inst_40339 = (0);
var state_40376__$1 = (function (){var statearr_40382 = state_40376;
(statearr_40382[(7)] = inst_40338);

(statearr_40382[(8)] = inst_40339);

return statearr_40382;
})();
var statearr_40383_41533 = state_40376__$1;
(statearr_40383_41533[(2)] = null);

(statearr_40383_41533[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40377 === (4))){
var inst_40343 = (state_40376[(9)]);
var inst_40343__$1 = (state_40376[(2)]);
var inst_40344 = (inst_40343__$1 == null);
var inst_40345 = cljs.core.not(inst_40344);
var state_40376__$1 = (function (){var statearr_40386 = state_40376;
(statearr_40386[(9)] = inst_40343__$1);

return statearr_40386;
})();
if(inst_40345){
var statearr_40387_41536 = state_40376__$1;
(statearr_40387_41536[(1)] = (5));

} else {
var statearr_40388_41537 = state_40376__$1;
(statearr_40388_41537[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40377 === (15))){
var inst_40366 = (state_40376[(2)]);
var state_40376__$1 = state_40376;
var statearr_40389_41538 = state_40376__$1;
(statearr_40389_41538[(2)] = inst_40366);

(statearr_40389_41538[(1)] = (14));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40377 === (13))){
var state_40376__$1 = state_40376;
var statearr_40394_41539 = state_40376__$1;
(statearr_40394_41539[(2)] = null);

(statearr_40394_41539[(1)] = (14));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40377 === (6))){
var inst_40339 = (state_40376[(8)]);
var inst_40362 = (inst_40339 > (0));
var state_40376__$1 = state_40376;
if(cljs.core.truth_(inst_40362)){
var statearr_40395_41540 = state_40376__$1;
(statearr_40395_41540[(1)] = (12));

} else {
var statearr_40396_41541 = state_40376__$1;
(statearr_40396_41541[(1)] = (13));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40377 === (3))){
var inst_40374 = (state_40376[(2)]);
var state_40376__$1 = state_40376;
return cljs.core.async.impl.ioc_helpers.return_chan(state_40376__$1,inst_40374);
} else {
if((state_val_40377 === (12))){
var inst_40338 = (state_40376[(7)]);
var inst_40364 = cljs.core.vec(inst_40338);
var state_40376__$1 = state_40376;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_40376__$1,(15),out,inst_40364);
} else {
if((state_val_40377 === (2))){
var state_40376__$1 = state_40376;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_40376__$1,(4),ch);
} else {
if((state_val_40377 === (11))){
var inst_40356 = (state_40376[(2)]);
var inst_40357 = (new Array(n));
var inst_40338 = inst_40357;
var inst_40339 = (0);
var state_40376__$1 = (function (){var statearr_40399 = state_40376;
(statearr_40399[(10)] = inst_40356);

(statearr_40399[(7)] = inst_40338);

(statearr_40399[(8)] = inst_40339);

return statearr_40399;
})();
var statearr_40400_41546 = state_40376__$1;
(statearr_40400_41546[(2)] = null);

(statearr_40400_41546[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40377 === (9))){
var inst_40338 = (state_40376[(7)]);
var inst_40354 = cljs.core.vec(inst_40338);
var state_40376__$1 = state_40376;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_40376__$1,(11),out,inst_40354);
} else {
if((state_val_40377 === (5))){
var inst_40338 = (state_40376[(7)]);
var inst_40339 = (state_40376[(8)]);
var inst_40343 = (state_40376[(9)]);
var inst_40348 = (state_40376[(11)]);
var inst_40347 = (inst_40338[inst_40339] = inst_40343);
var inst_40348__$1 = (inst_40339 + (1));
var inst_40349 = (inst_40348__$1 < n);
var state_40376__$1 = (function (){var statearr_40405 = state_40376;
(statearr_40405[(12)] = inst_40347);

(statearr_40405[(11)] = inst_40348__$1);

return statearr_40405;
})();
if(cljs.core.truth_(inst_40349)){
var statearr_40406_41552 = state_40376__$1;
(statearr_40406_41552[(1)] = (8));

} else {
var statearr_40407_41553 = state_40376__$1;
(statearr_40407_41553[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40377 === (14))){
var inst_40369 = (state_40376[(2)]);
var inst_40370 = cljs.core.async.close_BANG_(out);
var state_40376__$1 = (function (){var statearr_40411 = state_40376;
(statearr_40411[(13)] = inst_40369);

return statearr_40411;
})();
var statearr_40413_41554 = state_40376__$1;
(statearr_40413_41554[(2)] = inst_40370);

(statearr_40413_41554[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40377 === (10))){
var inst_40360 = (state_40376[(2)]);
var state_40376__$1 = state_40376;
var statearr_40414_41555 = state_40376__$1;
(statearr_40414_41555[(2)] = inst_40360);

(statearr_40414_41555[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40377 === (8))){
var inst_40338 = (state_40376[(7)]);
var inst_40348 = (state_40376[(11)]);
var tmp40408 = inst_40338;
var inst_40338__$1 = tmp40408;
var inst_40339 = inst_40348;
var state_40376__$1 = (function (){var statearr_40415 = state_40376;
(statearr_40415[(7)] = inst_40338__$1);

(statearr_40415[(8)] = inst_40339);

return statearr_40415;
})();
var statearr_40416_41561 = state_40376__$1;
(statearr_40416_41561[(2)] = null);

(statearr_40416_41561[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var cljs$core$async$state_machine__36595__auto__ = null;
var cljs$core$async$state_machine__36595__auto____0 = (function (){
var statearr_40430 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_40430[(0)] = cljs$core$async$state_machine__36595__auto__);

(statearr_40430[(1)] = (1));

return statearr_40430;
});
var cljs$core$async$state_machine__36595__auto____1 = (function (state_40376){
while(true){
var ret_value__36596__auto__ = (function (){try{while(true){
var result__36597__auto__ = switch__36594__auto__(state_40376);
if(cljs.core.keyword_identical_QMARK_(result__36597__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__36597__auto__;
}
break;
}
}catch (e40443){var ex__36598__auto__ = e40443;
var statearr_40444_41562 = state_40376;
(statearr_40444_41562[(2)] = ex__36598__auto__);


if(cljs.core.seq((state_40376[(4)]))){
var statearr_40449_41564 = state_40376;
(statearr_40449_41564[(1)] = cljs.core.first((state_40376[(4)])));

} else {
throw ex__36598__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__36596__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__41565 = state_40376;
state_40376 = G__41565;
continue;
} else {
return ret_value__36596__auto__;
}
break;
}
});
cljs$core$async$state_machine__36595__auto__ = function(state_40376){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__36595__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__36595__auto____1.call(this,state_40376);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__36595__auto____0;
cljs$core$async$state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__36595__auto____1;
return cljs$core$async$state_machine__36595__auto__;
})()
})();
var state__36898__auto__ = (function (){var statearr_40454 = f__36897__auto__();
(statearr_40454[(6)] = c__36895__auto___41528);

return statearr_40454;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__36898__auto__);
}));


return out;
}));

(cljs.core.async.partition.cljs$lang$maxFixedArity = 3);

/**
 * Deprecated - this function will be removed. Use transducer instead
 */
cljs.core.async.partition_by = (function cljs$core$async$partition_by(var_args){
var G__40474 = arguments.length;
switch (G__40474) {
case 2:
return cljs.core.async.partition_by.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.core.async.partition_by.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.partition_by.cljs$core$IFn$_invoke$arity$2 = (function (f,ch){
return cljs.core.async.partition_by.cljs$core$IFn$_invoke$arity$3(f,ch,null);
}));

(cljs.core.async.partition_by.cljs$core$IFn$_invoke$arity$3 = (function (f,ch,buf_or_n){
var out = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1(buf_or_n);
var c__36895__auto___41568 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__36897__auto__ = (function (){var switch__36594__auto__ = (function (state_40544){
var state_val_40548 = (state_40544[(1)]);
if((state_val_40548 === (7))){
var inst_40536 = (state_40544[(2)]);
var state_40544__$1 = state_40544;
var statearr_40563_41569 = state_40544__$1;
(statearr_40563_41569[(2)] = inst_40536);

(statearr_40563_41569[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40548 === (1))){
var inst_40479 = [];
var inst_40480 = inst_40479;
var inst_40481 = new cljs.core.Keyword("cljs.core.async","nothing","cljs.core.async/nothing",-69252123);
var state_40544__$1 = (function (){var statearr_40564 = state_40544;
(statearr_40564[(7)] = inst_40480);

(statearr_40564[(8)] = inst_40481);

return statearr_40564;
})();
var statearr_40565_41570 = state_40544__$1;
(statearr_40565_41570[(2)] = null);

(statearr_40565_41570[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40548 === (4))){
var inst_40484 = (state_40544[(9)]);
var inst_40484__$1 = (state_40544[(2)]);
var inst_40485 = (inst_40484__$1 == null);
var inst_40486 = cljs.core.not(inst_40485);
var state_40544__$1 = (function (){var statearr_40567 = state_40544;
(statearr_40567[(9)] = inst_40484__$1);

return statearr_40567;
})();
if(inst_40486){
var statearr_40574_41571 = state_40544__$1;
(statearr_40574_41571[(1)] = (5));

} else {
var statearr_40577_41572 = state_40544__$1;
(statearr_40577_41572[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40548 === (15))){
var inst_40480 = (state_40544[(7)]);
var inst_40522 = cljs.core.vec(inst_40480);
var state_40544__$1 = state_40544;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_40544__$1,(18),out,inst_40522);
} else {
if((state_val_40548 === (13))){
var inst_40513 = (state_40544[(2)]);
var state_40544__$1 = state_40544;
var statearr_40589_41573 = state_40544__$1;
(statearr_40589_41573[(2)] = inst_40513);

(statearr_40589_41573[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40548 === (6))){
var inst_40480 = (state_40544[(7)]);
var inst_40518 = inst_40480.length;
var inst_40519 = (inst_40518 > (0));
var state_40544__$1 = state_40544;
if(cljs.core.truth_(inst_40519)){
var statearr_40601_41575 = state_40544__$1;
(statearr_40601_41575[(1)] = (15));

} else {
var statearr_40602_41577 = state_40544__$1;
(statearr_40602_41577[(1)] = (16));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40548 === (17))){
var inst_40527 = (state_40544[(2)]);
var inst_40531 = cljs.core.async.close_BANG_(out);
var state_40544__$1 = (function (){var statearr_40604 = state_40544;
(statearr_40604[(10)] = inst_40527);

return statearr_40604;
})();
var statearr_40605_41580 = state_40544__$1;
(statearr_40605_41580[(2)] = inst_40531);

(statearr_40605_41580[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40548 === (3))){
var inst_40538 = (state_40544[(2)]);
var state_40544__$1 = state_40544;
return cljs.core.async.impl.ioc_helpers.return_chan(state_40544__$1,inst_40538);
} else {
if((state_val_40548 === (12))){
var inst_40480 = (state_40544[(7)]);
var inst_40500 = cljs.core.vec(inst_40480);
var state_40544__$1 = state_40544;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_40544__$1,(14),out,inst_40500);
} else {
if((state_val_40548 === (2))){
var state_40544__$1 = state_40544;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_40544__$1,(4),ch);
} else {
if((state_val_40548 === (11))){
var inst_40480 = (state_40544[(7)]);
var inst_40484 = (state_40544[(9)]);
var inst_40488 = (state_40544[(11)]);
var inst_40496 = inst_40480.push(inst_40484);
var tmp40607 = inst_40480;
var inst_40480__$1 = tmp40607;
var inst_40481 = inst_40488;
var state_40544__$1 = (function (){var statearr_40615 = state_40544;
(statearr_40615[(12)] = inst_40496);

(statearr_40615[(7)] = inst_40480__$1);

(statearr_40615[(8)] = inst_40481);

return statearr_40615;
})();
var statearr_40618_41585 = state_40544__$1;
(statearr_40618_41585[(2)] = null);

(statearr_40618_41585[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40548 === (9))){
var inst_40481 = (state_40544[(8)]);
var inst_40492 = cljs.core.keyword_identical_QMARK_(inst_40481,new cljs.core.Keyword("cljs.core.async","nothing","cljs.core.async/nothing",-69252123));
var state_40544__$1 = state_40544;
var statearr_40623_41586 = state_40544__$1;
(statearr_40623_41586[(2)] = inst_40492);

(statearr_40623_41586[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40548 === (5))){
var inst_40484 = (state_40544[(9)]);
var inst_40488 = (state_40544[(11)]);
var inst_40481 = (state_40544[(8)]);
var inst_40489 = (state_40544[(13)]);
var inst_40488__$1 = (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(inst_40484) : f.call(null,inst_40484));
var inst_40489__$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_40488__$1,inst_40481);
var state_40544__$1 = (function (){var statearr_40625 = state_40544;
(statearr_40625[(11)] = inst_40488__$1);

(statearr_40625[(13)] = inst_40489__$1);

return statearr_40625;
})();
if(inst_40489__$1){
var statearr_40626_41587 = state_40544__$1;
(statearr_40626_41587[(1)] = (8));

} else {
var statearr_40627_41588 = state_40544__$1;
(statearr_40627_41588[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40548 === (14))){
var inst_40484 = (state_40544[(9)]);
var inst_40488 = (state_40544[(11)]);
var inst_40502 = (state_40544[(2)]);
var inst_40503 = [];
var inst_40504 = inst_40503.push(inst_40484);
var inst_40480 = inst_40503;
var inst_40481 = inst_40488;
var state_40544__$1 = (function (){var statearr_40628 = state_40544;
(statearr_40628[(14)] = inst_40502);

(statearr_40628[(15)] = inst_40504);

(statearr_40628[(7)] = inst_40480);

(statearr_40628[(8)] = inst_40481);

return statearr_40628;
})();
var statearr_40632_41589 = state_40544__$1;
(statearr_40632_41589[(2)] = null);

(statearr_40632_41589[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40548 === (16))){
var state_40544__$1 = state_40544;
var statearr_40633_41590 = state_40544__$1;
(statearr_40633_41590[(2)] = null);

(statearr_40633_41590[(1)] = (17));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40548 === (10))){
var inst_40494 = (state_40544[(2)]);
var state_40544__$1 = state_40544;
if(cljs.core.truth_(inst_40494)){
var statearr_40637_41591 = state_40544__$1;
(statearr_40637_41591[(1)] = (11));

} else {
var statearr_40638_41592 = state_40544__$1;
(statearr_40638_41592[(1)] = (12));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40548 === (18))){
var inst_40524 = (state_40544[(2)]);
var state_40544__$1 = state_40544;
var statearr_40639_41593 = state_40544__$1;
(statearr_40639_41593[(2)] = inst_40524);

(statearr_40639_41593[(1)] = (17));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40548 === (8))){
var inst_40489 = (state_40544[(13)]);
var state_40544__$1 = state_40544;
var statearr_40640_41594 = state_40544__$1;
(statearr_40640_41594[(2)] = inst_40489);

(statearr_40640_41594[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var cljs$core$async$state_machine__36595__auto__ = null;
var cljs$core$async$state_machine__36595__auto____0 = (function (){
var statearr_40641 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_40641[(0)] = cljs$core$async$state_machine__36595__auto__);

(statearr_40641[(1)] = (1));

return statearr_40641;
});
var cljs$core$async$state_machine__36595__auto____1 = (function (state_40544){
while(true){
var ret_value__36596__auto__ = (function (){try{while(true){
var result__36597__auto__ = switch__36594__auto__(state_40544);
if(cljs.core.keyword_identical_QMARK_(result__36597__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__36597__auto__;
}
break;
}
}catch (e40643){var ex__36598__auto__ = e40643;
var statearr_40644_41595 = state_40544;
(statearr_40644_41595[(2)] = ex__36598__auto__);


if(cljs.core.seq((state_40544[(4)]))){
var statearr_40646_41596 = state_40544;
(statearr_40646_41596[(1)] = cljs.core.first((state_40544[(4)])));

} else {
throw ex__36598__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__36596__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__41597 = state_40544;
state_40544 = G__41597;
continue;
} else {
return ret_value__36596__auto__;
}
break;
}
});
cljs$core$async$state_machine__36595__auto__ = function(state_40544){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__36595__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__36595__auto____1.call(this,state_40544);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__36595__auto____0;
cljs$core$async$state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__36595__auto____1;
return cljs$core$async$state_machine__36595__auto__;
})()
})();
var state__36898__auto__ = (function (){var statearr_40648 = f__36897__auto__();
(statearr_40648[(6)] = c__36895__auto___41568);

return statearr_40648;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__36898__auto__);
}));


return out;
}));

(cljs.core.async.partition_by.cljs$lang$maxFixedArity = 3);


//# sourceMappingURL=cljs.core.async.js.map
