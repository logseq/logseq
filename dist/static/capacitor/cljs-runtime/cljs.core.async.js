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
cljs.core.async.t_cljs$core$async37826 = (function (f,blockable,meta37827){
this.f = f;
this.blockable = blockable;
this.meta37827 = meta37827;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async37826.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_37828,meta37827__$1){
var self__ = this;
var _37828__$1 = this;
return (new cljs.core.async.t_cljs$core$async37826(self__.f,self__.blockable,meta37827__$1));
}));

(cljs.core.async.t_cljs$core$async37826.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_37828){
var self__ = this;
var _37828__$1 = this;
return self__.meta37827;
}));

(cljs.core.async.t_cljs$core$async37826.prototype.cljs$core$async$impl$protocols$Handler$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async37826.prototype.cljs$core$async$impl$protocols$Handler$active_QMARK_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return true;
}));

(cljs.core.async.t_cljs$core$async37826.prototype.cljs$core$async$impl$protocols$Handler$blockable_QMARK_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return self__.blockable;
}));

(cljs.core.async.t_cljs$core$async37826.prototype.cljs$core$async$impl$protocols$Handler$commit$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return self__.f;
}));

(cljs.core.async.t_cljs$core$async37826.getBasis = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"f","f",43394975,null),new cljs.core.Symbol(null,"blockable","blockable",-28395259,null),new cljs.core.Symbol(null,"meta37827","meta37827",-1440192248,null)], null);
}));

(cljs.core.async.t_cljs$core$async37826.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async37826.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async37826");

(cljs.core.async.t_cljs$core$async37826.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async37826");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async37826.
 */
cljs.core.async.__GT_t_cljs$core$async37826 = (function cljs$core$async$__GT_t_cljs$core$async37826(f,blockable,meta37827){
return (new cljs.core.async.t_cljs$core$async37826(f,blockable,meta37827));
});


cljs.core.async.fn_handler = (function cljs$core$async$fn_handler(var_args){
var G__37825 = arguments.length;
switch (G__37825) {
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
return (new cljs.core.async.t_cljs$core$async37826(f,blockable,cljs.core.PersistentArrayMap.EMPTY));
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
var G__37870 = arguments.length;
switch (G__37870) {
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
var G__37903 = arguments.length;
switch (G__37903) {
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
var G__37913 = arguments.length;
switch (G__37913) {
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
var val_41029 = cljs.core.deref(ret);
if(cljs.core.truth_(on_caller_QMARK_)){
(fn1.cljs$core$IFn$_invoke$arity$1 ? fn1.cljs$core$IFn$_invoke$arity$1(val_41029) : fn1.call(null,val_41029));
} else {
cljs.core.async.impl.dispatch.run((function (){
return (fn1.cljs$core$IFn$_invoke$arity$1 ? fn1.cljs$core$IFn$_invoke$arity$1(val_41029) : fn1.call(null,val_41029));
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
var G__37918 = arguments.length;
switch (G__37918) {
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
var n__5593__auto___41036 = n;
var x_41037 = (0);
while(true){
if((x_41037 < n__5593__auto___41036)){
(a[x_41037] = x_41037);

var G__41038 = (x_41037 + (1));
x_41037 = G__41038;
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
cljs.core.async.t_cljs$core$async37935 = (function (flag,meta37936){
this.flag = flag;
this.meta37936 = meta37936;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async37935.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_37937,meta37936__$1){
var self__ = this;
var _37937__$1 = this;
return (new cljs.core.async.t_cljs$core$async37935(self__.flag,meta37936__$1));
}));

(cljs.core.async.t_cljs$core$async37935.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_37937){
var self__ = this;
var _37937__$1 = this;
return self__.meta37936;
}));

(cljs.core.async.t_cljs$core$async37935.prototype.cljs$core$async$impl$protocols$Handler$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async37935.prototype.cljs$core$async$impl$protocols$Handler$active_QMARK_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.deref(self__.flag);
}));

(cljs.core.async.t_cljs$core$async37935.prototype.cljs$core$async$impl$protocols$Handler$blockable_QMARK_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return true;
}));

(cljs.core.async.t_cljs$core$async37935.prototype.cljs$core$async$impl$protocols$Handler$commit$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
cljs.core.reset_BANG_(self__.flag,null);

return true;
}));

(cljs.core.async.t_cljs$core$async37935.getBasis = (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"flag","flag",-1565787888,null),new cljs.core.Symbol(null,"meta37936","meta37936",744426996,null)], null);
}));

(cljs.core.async.t_cljs$core$async37935.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async37935.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async37935");

(cljs.core.async.t_cljs$core$async37935.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async37935");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async37935.
 */
cljs.core.async.__GT_t_cljs$core$async37935 = (function cljs$core$async$__GT_t_cljs$core$async37935(flag,meta37936){
return (new cljs.core.async.t_cljs$core$async37935(flag,meta37936));
});


cljs.core.async.alt_flag = (function cljs$core$async$alt_flag(){
var flag = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(true);
return (new cljs.core.async.t_cljs$core$async37935(flag,cljs.core.PersistentArrayMap.EMPTY));
});

/**
* @constructor
 * @implements {cljs.core.async.impl.protocols.Handler}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
cljs.core.async.t_cljs$core$async37941 = (function (flag,cb,meta37942){
this.flag = flag;
this.cb = cb;
this.meta37942 = meta37942;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async37941.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_37943,meta37942__$1){
var self__ = this;
var _37943__$1 = this;
return (new cljs.core.async.t_cljs$core$async37941(self__.flag,self__.cb,meta37942__$1));
}));

(cljs.core.async.t_cljs$core$async37941.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_37943){
var self__ = this;
var _37943__$1 = this;
return self__.meta37942;
}));

(cljs.core.async.t_cljs$core$async37941.prototype.cljs$core$async$impl$protocols$Handler$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async37941.prototype.cljs$core$async$impl$protocols$Handler$active_QMARK_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.active_QMARK_(self__.flag);
}));

(cljs.core.async.t_cljs$core$async37941.prototype.cljs$core$async$impl$protocols$Handler$blockable_QMARK_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return true;
}));

(cljs.core.async.t_cljs$core$async37941.prototype.cljs$core$async$impl$protocols$Handler$commit$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
cljs.core.async.impl.protocols.commit(self__.flag);

return self__.cb;
}));

(cljs.core.async.t_cljs$core$async37941.getBasis = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"flag","flag",-1565787888,null),new cljs.core.Symbol(null,"cb","cb",-2064487928,null),new cljs.core.Symbol(null,"meta37942","meta37942",1968376474,null)], null);
}));

(cljs.core.async.t_cljs$core$async37941.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async37941.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async37941");

(cljs.core.async.t_cljs$core$async37941.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async37941");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async37941.
 */
cljs.core.async.__GT_t_cljs$core$async37941 = (function cljs$core$async$__GT_t_cljs$core$async37941(flag,cb,meta37942){
return (new cljs.core.async.t_cljs$core$async37941(flag,cb,meta37942));
});


cljs.core.async.alt_handler = (function cljs$core$async$alt_handler(flag,cb){
return (new cljs.core.async.t_cljs$core$async37941(flag,cb,cljs.core.PersistentArrayMap.EMPTY));
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
return (function (p1__37948_SHARP_){
var G__37963 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [p1__37948_SHARP_,wport], null);
return (fret.cljs$core$IFn$_invoke$arity$1 ? fret.cljs$core$IFn$_invoke$arity$1(G__37963) : fret.call(null,G__37963));
});})(i,val,idx,port,wport,flag,ports__$1,n,idxs,priority))
));
})():cljs.core.async.impl.protocols.take_BANG_(port,cljs.core.async.alt_handler(flag,((function (i,idx,port,wport,flag,ports__$1,n,idxs,priority){
return (function (p1__37949_SHARP_){
var G__37964 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [p1__37949_SHARP_,port], null);
return (fret.cljs$core$IFn$_invoke$arity$1 ? fret.cljs$core$IFn$_invoke$arity$1(G__37964) : fret.call(null,G__37964));
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
var G__41047 = (i + (1));
i = G__41047;
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
var len__5726__auto___41054 = arguments.length;
var i__5727__auto___41055 = (0);
while(true){
if((i__5727__auto___41055 < len__5726__auto___41054)){
args__5732__auto__.push((arguments[i__5727__auto___41055]));

var G__41056 = (i__5727__auto___41055 + (1));
i__5727__auto___41055 = G__41056;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return cljs.core.async.alts_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(cljs.core.async.alts_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (ports,p__37977){
var map__37978 = p__37977;
var map__37978__$1 = cljs.core.__destructure_map(map__37978);
var opts = map__37978__$1;
throw (new Error("alts! used not in (go ...) block"));
}));

(cljs.core.async.alts_BANG_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(cljs.core.async.alts_BANG_.cljs$lang$applyTo = (function (seq37972){
var G__37973 = cljs.core.first(seq37972);
var seq37972__$1 = cljs.core.next(seq37972);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__37973,seq37972__$1);
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
var G__37998 = arguments.length;
switch (G__37998) {
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
var c__37594__auto___41061 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__37595__auto__ = (function (){var switch__37084__auto__ = (function (state_38572){
var state_val_38579 = (state_38572[(1)]);
if((state_val_38579 === (7))){
var inst_38502 = (state_38572[(2)]);
var state_38572__$1 = state_38572;
var statearr_38614_41062 = state_38572__$1;
(statearr_38614_41062[(2)] = inst_38502);

(statearr_38614_41062[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38579 === (1))){
var state_38572__$1 = state_38572;
var statearr_38615_41063 = state_38572__$1;
(statearr_38615_41063[(2)] = null);

(statearr_38615_41063[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38579 === (4))){
var inst_38372 = (state_38572[(7)]);
var inst_38372__$1 = (state_38572[(2)]);
var inst_38434 = (inst_38372__$1 == null);
var state_38572__$1 = (function (){var statearr_38617 = state_38572;
(statearr_38617[(7)] = inst_38372__$1);

return statearr_38617;
})();
if(cljs.core.truth_(inst_38434)){
var statearr_38618_41065 = state_38572__$1;
(statearr_38618_41065[(1)] = (5));

} else {
var statearr_38619_41066 = state_38572__$1;
(statearr_38619_41066[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38579 === (13))){
var state_38572__$1 = state_38572;
var statearr_38622_41067 = state_38572__$1;
(statearr_38622_41067[(2)] = null);

(statearr_38622_41067[(1)] = (14));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38579 === (6))){
var inst_38372 = (state_38572[(7)]);
var state_38572__$1 = state_38572;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_38572__$1,(11),to,inst_38372);
} else {
if((state_val_38579 === (3))){
var inst_38521 = (state_38572[(2)]);
var state_38572__$1 = state_38572;
return cljs.core.async.impl.ioc_helpers.return_chan(state_38572__$1,inst_38521);
} else {
if((state_val_38579 === (12))){
var state_38572__$1 = state_38572;
var statearr_38626_41072 = state_38572__$1;
(statearr_38626_41072[(2)] = null);

(statearr_38626_41072[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38579 === (2))){
var state_38572__$1 = state_38572;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_38572__$1,(4),from);
} else {
if((state_val_38579 === (11))){
var inst_38464 = (state_38572[(2)]);
var state_38572__$1 = state_38572;
if(cljs.core.truth_(inst_38464)){
var statearr_38633_41073 = state_38572__$1;
(statearr_38633_41073[(1)] = (12));

} else {
var statearr_38635_41074 = state_38572__$1;
(statearr_38635_41074[(1)] = (13));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38579 === (9))){
var state_38572__$1 = state_38572;
var statearr_38641_41075 = state_38572__$1;
(statearr_38641_41075[(2)] = null);

(statearr_38641_41075[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38579 === (5))){
var state_38572__$1 = state_38572;
if(cljs.core.truth_(close_QMARK_)){
var statearr_38644_41076 = state_38572__$1;
(statearr_38644_41076[(1)] = (8));

} else {
var statearr_38645_41077 = state_38572__$1;
(statearr_38645_41077[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38579 === (14))){
var inst_38499 = (state_38572[(2)]);
var state_38572__$1 = state_38572;
var statearr_38647_41081 = state_38572__$1;
(statearr_38647_41081[(2)] = inst_38499);

(statearr_38647_41081[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38579 === (10))){
var inst_38461 = (state_38572[(2)]);
var state_38572__$1 = state_38572;
var statearr_38648_41082 = state_38572__$1;
(statearr_38648_41082[(2)] = inst_38461);

(statearr_38648_41082[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38579 === (8))){
var inst_38446 = cljs.core.async.close_BANG_(to);
var state_38572__$1 = state_38572;
var statearr_38649_41084 = state_38572__$1;
(statearr_38649_41084[(2)] = inst_38446);

(statearr_38649_41084[(1)] = (10));


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
var cljs$core$async$state_machine__37085__auto__ = null;
var cljs$core$async$state_machine__37085__auto____0 = (function (){
var statearr_38650 = [null,null,null,null,null,null,null,null];
(statearr_38650[(0)] = cljs$core$async$state_machine__37085__auto__);

(statearr_38650[(1)] = (1));

return statearr_38650;
});
var cljs$core$async$state_machine__37085__auto____1 = (function (state_38572){
while(true){
var ret_value__37086__auto__ = (function (){try{while(true){
var result__37087__auto__ = switch__37084__auto__(state_38572);
if(cljs.core.keyword_identical_QMARK_(result__37087__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__37087__auto__;
}
break;
}
}catch (e38652){var ex__37088__auto__ = e38652;
var statearr_38656_41086 = state_38572;
(statearr_38656_41086[(2)] = ex__37088__auto__);


if(cljs.core.seq((state_38572[(4)]))){
var statearr_38662_41087 = state_38572;
(statearr_38662_41087[(1)] = cljs.core.first((state_38572[(4)])));

} else {
throw ex__37088__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__37086__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__41088 = state_38572;
state_38572 = G__41088;
continue;
} else {
return ret_value__37086__auto__;
}
break;
}
});
cljs$core$async$state_machine__37085__auto__ = function(state_38572){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__37085__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__37085__auto____1.call(this,state_38572);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__37085__auto____0;
cljs$core$async$state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__37085__auto____1;
return cljs$core$async$state_machine__37085__auto__;
})()
})();
var state__37596__auto__ = (function (){var statearr_38665 = f__37595__auto__();
(statearr_38665[(6)] = c__37594__auto___41061);

return statearr_38665;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__37596__auto__);
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
var process__$1 = (function (p__38671){
var vec__38672 = p__38671;
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__38672,(0),null);
var p = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__38672,(1),null);
var job = vec__38672;
if((job == null)){
cljs.core.async.close_BANG_(results);

return null;
} else {
var res = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$3((1),xf,ex_handler);
var c__37594__auto___41089 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__37595__auto__ = (function (){var switch__37084__auto__ = (function (state_38682){
var state_val_38683 = (state_38682[(1)]);
if((state_val_38683 === (1))){
var state_38682__$1 = state_38682;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_38682__$1,(2),res,v);
} else {
if((state_val_38683 === (2))){
var inst_38678 = (state_38682[(2)]);
var inst_38679 = cljs.core.async.close_BANG_(res);
var state_38682__$1 = (function (){var statearr_38689 = state_38682;
(statearr_38689[(7)] = inst_38678);

return statearr_38689;
})();
return cljs.core.async.impl.ioc_helpers.return_chan(state_38682__$1,inst_38679);
} else {
return null;
}
}
});
return (function() {
var cljs$core$async$pipeline_STAR__$_state_machine__37085__auto__ = null;
var cljs$core$async$pipeline_STAR__$_state_machine__37085__auto____0 = (function (){
var statearr_38690 = [null,null,null,null,null,null,null,null];
(statearr_38690[(0)] = cljs$core$async$pipeline_STAR__$_state_machine__37085__auto__);

(statearr_38690[(1)] = (1));

return statearr_38690;
});
var cljs$core$async$pipeline_STAR__$_state_machine__37085__auto____1 = (function (state_38682){
while(true){
var ret_value__37086__auto__ = (function (){try{while(true){
var result__37087__auto__ = switch__37084__auto__(state_38682);
if(cljs.core.keyword_identical_QMARK_(result__37087__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__37087__auto__;
}
break;
}
}catch (e38691){var ex__37088__auto__ = e38691;
var statearr_38692_41096 = state_38682;
(statearr_38692_41096[(2)] = ex__37088__auto__);


if(cljs.core.seq((state_38682[(4)]))){
var statearr_38693_41097 = state_38682;
(statearr_38693_41097[(1)] = cljs.core.first((state_38682[(4)])));

} else {
throw ex__37088__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__37086__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__41098 = state_38682;
state_38682 = G__41098;
continue;
} else {
return ret_value__37086__auto__;
}
break;
}
});
cljs$core$async$pipeline_STAR__$_state_machine__37085__auto__ = function(state_38682){
switch(arguments.length){
case 0:
return cljs$core$async$pipeline_STAR__$_state_machine__37085__auto____0.call(this);
case 1:
return cljs$core$async$pipeline_STAR__$_state_machine__37085__auto____1.call(this,state_38682);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$pipeline_STAR__$_state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$pipeline_STAR__$_state_machine__37085__auto____0;
cljs$core$async$pipeline_STAR__$_state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$pipeline_STAR__$_state_machine__37085__auto____1;
return cljs$core$async$pipeline_STAR__$_state_machine__37085__auto__;
})()
})();
var state__37596__auto__ = (function (){var statearr_38695 = f__37595__auto__();
(statearr_38695[(6)] = c__37594__auto___41089);

return statearr_38695;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__37596__auto__);
}));


cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$2(p,res);

return true;
}
});
var async = (function (p__38696){
var vec__38697 = p__38696;
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__38697,(0),null);
var p = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__38697,(1),null);
var job = vec__38697;
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
var n__5593__auto___41099 = n;
var __41100 = (0);
while(true){
if((__41100 < n__5593__auto___41099)){
var G__38700_41101 = type;
var G__38700_41102__$1 = (((G__38700_41101 instanceof cljs.core.Keyword))?G__38700_41101.fqn:null);
switch (G__38700_41102__$1) {
case "compute":
var c__37594__auto___41104 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run(((function (__41100,c__37594__auto___41104,G__38700_41101,G__38700_41102__$1,n__5593__auto___41099,jobs,results,process__$1,async){
return (function (){
var f__37595__auto__ = (function (){var switch__37084__auto__ = ((function (__41100,c__37594__auto___41104,G__38700_41101,G__38700_41102__$1,n__5593__auto___41099,jobs,results,process__$1,async){
return (function (state_38714){
var state_val_38716 = (state_38714[(1)]);
if((state_val_38716 === (1))){
var state_38714__$1 = state_38714;
var statearr_38719_41106 = state_38714__$1;
(statearr_38719_41106[(2)] = null);

(statearr_38719_41106[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38716 === (2))){
var state_38714__$1 = state_38714;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_38714__$1,(4),jobs);
} else {
if((state_val_38716 === (3))){
var inst_38711 = (state_38714[(2)]);
var state_38714__$1 = state_38714;
return cljs.core.async.impl.ioc_helpers.return_chan(state_38714__$1,inst_38711);
} else {
if((state_val_38716 === (4))){
var inst_38703 = (state_38714[(2)]);
var inst_38704 = process__$1(inst_38703);
var state_38714__$1 = state_38714;
if(cljs.core.truth_(inst_38704)){
var statearr_38720_41107 = state_38714__$1;
(statearr_38720_41107[(1)] = (5));

} else {
var statearr_38721_41108 = state_38714__$1;
(statearr_38721_41108[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38716 === (5))){
var state_38714__$1 = state_38714;
var statearr_38722_41109 = state_38714__$1;
(statearr_38722_41109[(2)] = null);

(statearr_38722_41109[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38716 === (6))){
var state_38714__$1 = state_38714;
var statearr_38723_41111 = state_38714__$1;
(statearr_38723_41111[(2)] = null);

(statearr_38723_41111[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38716 === (7))){
var inst_38709 = (state_38714[(2)]);
var state_38714__$1 = state_38714;
var statearr_38724_41112 = state_38714__$1;
(statearr_38724_41112[(2)] = inst_38709);

(statearr_38724_41112[(1)] = (3));


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
});})(__41100,c__37594__auto___41104,G__38700_41101,G__38700_41102__$1,n__5593__auto___41099,jobs,results,process__$1,async))
;
return ((function (__41100,switch__37084__auto__,c__37594__auto___41104,G__38700_41101,G__38700_41102__$1,n__5593__auto___41099,jobs,results,process__$1,async){
return (function() {
var cljs$core$async$pipeline_STAR__$_state_machine__37085__auto__ = null;
var cljs$core$async$pipeline_STAR__$_state_machine__37085__auto____0 = (function (){
var statearr_38725 = [null,null,null,null,null,null,null];
(statearr_38725[(0)] = cljs$core$async$pipeline_STAR__$_state_machine__37085__auto__);

(statearr_38725[(1)] = (1));

return statearr_38725;
});
var cljs$core$async$pipeline_STAR__$_state_machine__37085__auto____1 = (function (state_38714){
while(true){
var ret_value__37086__auto__ = (function (){try{while(true){
var result__37087__auto__ = switch__37084__auto__(state_38714);
if(cljs.core.keyword_identical_QMARK_(result__37087__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__37087__auto__;
}
break;
}
}catch (e38726){var ex__37088__auto__ = e38726;
var statearr_38727_41114 = state_38714;
(statearr_38727_41114[(2)] = ex__37088__auto__);


if(cljs.core.seq((state_38714[(4)]))){
var statearr_38728_41115 = state_38714;
(statearr_38728_41115[(1)] = cljs.core.first((state_38714[(4)])));

} else {
throw ex__37088__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__37086__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__41116 = state_38714;
state_38714 = G__41116;
continue;
} else {
return ret_value__37086__auto__;
}
break;
}
});
cljs$core$async$pipeline_STAR__$_state_machine__37085__auto__ = function(state_38714){
switch(arguments.length){
case 0:
return cljs$core$async$pipeline_STAR__$_state_machine__37085__auto____0.call(this);
case 1:
return cljs$core$async$pipeline_STAR__$_state_machine__37085__auto____1.call(this,state_38714);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$pipeline_STAR__$_state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$pipeline_STAR__$_state_machine__37085__auto____0;
cljs$core$async$pipeline_STAR__$_state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$pipeline_STAR__$_state_machine__37085__auto____1;
return cljs$core$async$pipeline_STAR__$_state_machine__37085__auto__;
})()
;})(__41100,switch__37084__auto__,c__37594__auto___41104,G__38700_41101,G__38700_41102__$1,n__5593__auto___41099,jobs,results,process__$1,async))
})();
var state__37596__auto__ = (function (){var statearr_38729 = f__37595__auto__();
(statearr_38729[(6)] = c__37594__auto___41104);

return statearr_38729;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__37596__auto__);
});})(__41100,c__37594__auto___41104,G__38700_41101,G__38700_41102__$1,n__5593__auto___41099,jobs,results,process__$1,async))
);


break;
case "async":
var c__37594__auto___41117 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run(((function (__41100,c__37594__auto___41117,G__38700_41101,G__38700_41102__$1,n__5593__auto___41099,jobs,results,process__$1,async){
return (function (){
var f__37595__auto__ = (function (){var switch__37084__auto__ = ((function (__41100,c__37594__auto___41117,G__38700_41101,G__38700_41102__$1,n__5593__auto___41099,jobs,results,process__$1,async){
return (function (state_38743){
var state_val_38744 = (state_38743[(1)]);
if((state_val_38744 === (1))){
var state_38743__$1 = state_38743;
var statearr_38745_41118 = state_38743__$1;
(statearr_38745_41118[(2)] = null);

(statearr_38745_41118[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38744 === (2))){
var state_38743__$1 = state_38743;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_38743__$1,(4),jobs);
} else {
if((state_val_38744 === (3))){
var inst_38740 = (state_38743[(2)]);
var state_38743__$1 = state_38743;
return cljs.core.async.impl.ioc_helpers.return_chan(state_38743__$1,inst_38740);
} else {
if((state_val_38744 === (4))){
var inst_38732 = (state_38743[(2)]);
var inst_38733 = async(inst_38732);
var state_38743__$1 = state_38743;
if(cljs.core.truth_(inst_38733)){
var statearr_38746_41122 = state_38743__$1;
(statearr_38746_41122[(1)] = (5));

} else {
var statearr_38747_41124 = state_38743__$1;
(statearr_38747_41124[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38744 === (5))){
var state_38743__$1 = state_38743;
var statearr_38748_41125 = state_38743__$1;
(statearr_38748_41125[(2)] = null);

(statearr_38748_41125[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38744 === (6))){
var state_38743__$1 = state_38743;
var statearr_38749_41126 = state_38743__$1;
(statearr_38749_41126[(2)] = null);

(statearr_38749_41126[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38744 === (7))){
var inst_38738 = (state_38743[(2)]);
var state_38743__$1 = state_38743;
var statearr_38750_41128 = state_38743__$1;
(statearr_38750_41128[(2)] = inst_38738);

(statearr_38750_41128[(1)] = (3));


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
});})(__41100,c__37594__auto___41117,G__38700_41101,G__38700_41102__$1,n__5593__auto___41099,jobs,results,process__$1,async))
;
return ((function (__41100,switch__37084__auto__,c__37594__auto___41117,G__38700_41101,G__38700_41102__$1,n__5593__auto___41099,jobs,results,process__$1,async){
return (function() {
var cljs$core$async$pipeline_STAR__$_state_machine__37085__auto__ = null;
var cljs$core$async$pipeline_STAR__$_state_machine__37085__auto____0 = (function (){
var statearr_38751 = [null,null,null,null,null,null,null];
(statearr_38751[(0)] = cljs$core$async$pipeline_STAR__$_state_machine__37085__auto__);

(statearr_38751[(1)] = (1));

return statearr_38751;
});
var cljs$core$async$pipeline_STAR__$_state_machine__37085__auto____1 = (function (state_38743){
while(true){
var ret_value__37086__auto__ = (function (){try{while(true){
var result__37087__auto__ = switch__37084__auto__(state_38743);
if(cljs.core.keyword_identical_QMARK_(result__37087__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__37087__auto__;
}
break;
}
}catch (e38752){var ex__37088__auto__ = e38752;
var statearr_38753_41129 = state_38743;
(statearr_38753_41129[(2)] = ex__37088__auto__);


if(cljs.core.seq((state_38743[(4)]))){
var statearr_38754_41130 = state_38743;
(statearr_38754_41130[(1)] = cljs.core.first((state_38743[(4)])));

} else {
throw ex__37088__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__37086__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__41131 = state_38743;
state_38743 = G__41131;
continue;
} else {
return ret_value__37086__auto__;
}
break;
}
});
cljs$core$async$pipeline_STAR__$_state_machine__37085__auto__ = function(state_38743){
switch(arguments.length){
case 0:
return cljs$core$async$pipeline_STAR__$_state_machine__37085__auto____0.call(this);
case 1:
return cljs$core$async$pipeline_STAR__$_state_machine__37085__auto____1.call(this,state_38743);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$pipeline_STAR__$_state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$pipeline_STAR__$_state_machine__37085__auto____0;
cljs$core$async$pipeline_STAR__$_state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$pipeline_STAR__$_state_machine__37085__auto____1;
return cljs$core$async$pipeline_STAR__$_state_machine__37085__auto__;
})()
;})(__41100,switch__37084__auto__,c__37594__auto___41117,G__38700_41101,G__38700_41102__$1,n__5593__auto___41099,jobs,results,process__$1,async))
})();
var state__37596__auto__ = (function (){var statearr_38755 = f__37595__auto__();
(statearr_38755[(6)] = c__37594__auto___41117);

return statearr_38755;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__37596__auto__);
});})(__41100,c__37594__auto___41117,G__38700_41101,G__38700_41102__$1,n__5593__auto___41099,jobs,results,process__$1,async))
);


break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__38700_41102__$1)].join('')));

}

var G__41132 = (__41100 + (1));
__41100 = G__41132;
continue;
} else {
}
break;
}

var c__37594__auto___41133 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__37595__auto__ = (function (){var switch__37084__auto__ = (function (state_38778){
var state_val_38779 = (state_38778[(1)]);
if((state_val_38779 === (7))){
var inst_38774 = (state_38778[(2)]);
var state_38778__$1 = state_38778;
var statearr_38780_41134 = state_38778__$1;
(statearr_38780_41134[(2)] = inst_38774);

(statearr_38780_41134[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38779 === (1))){
var state_38778__$1 = state_38778;
var statearr_38781_41135 = state_38778__$1;
(statearr_38781_41135[(2)] = null);

(statearr_38781_41135[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38779 === (4))){
var inst_38759 = (state_38778[(7)]);
var inst_38759__$1 = (state_38778[(2)]);
var inst_38760 = (inst_38759__$1 == null);
var state_38778__$1 = (function (){var statearr_38783 = state_38778;
(statearr_38783[(7)] = inst_38759__$1);

return statearr_38783;
})();
if(cljs.core.truth_(inst_38760)){
var statearr_38784_41136 = state_38778__$1;
(statearr_38784_41136[(1)] = (5));

} else {
var statearr_38785_41137 = state_38778__$1;
(statearr_38785_41137[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38779 === (6))){
var inst_38759 = (state_38778[(7)]);
var inst_38764 = (state_38778[(8)]);
var inst_38764__$1 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
var inst_38765 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_38766 = [inst_38759,inst_38764__$1];
var inst_38767 = (new cljs.core.PersistentVector(null,2,(5),inst_38765,inst_38766,null));
var state_38778__$1 = (function (){var statearr_38786 = state_38778;
(statearr_38786[(8)] = inst_38764__$1);

return statearr_38786;
})();
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_38778__$1,(8),jobs,inst_38767);
} else {
if((state_val_38779 === (3))){
var inst_38776 = (state_38778[(2)]);
var state_38778__$1 = state_38778;
return cljs.core.async.impl.ioc_helpers.return_chan(state_38778__$1,inst_38776);
} else {
if((state_val_38779 === (2))){
var state_38778__$1 = state_38778;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_38778__$1,(4),from);
} else {
if((state_val_38779 === (9))){
var inst_38771 = (state_38778[(2)]);
var state_38778__$1 = (function (){var statearr_38787 = state_38778;
(statearr_38787[(9)] = inst_38771);

return statearr_38787;
})();
var statearr_38788_41138 = state_38778__$1;
(statearr_38788_41138[(2)] = null);

(statearr_38788_41138[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38779 === (5))){
var inst_38762 = cljs.core.async.close_BANG_(jobs);
var state_38778__$1 = state_38778;
var statearr_38789_41139 = state_38778__$1;
(statearr_38789_41139[(2)] = inst_38762);

(statearr_38789_41139[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38779 === (8))){
var inst_38764 = (state_38778[(8)]);
var inst_38769 = (state_38778[(2)]);
var state_38778__$1 = (function (){var statearr_38791 = state_38778;
(statearr_38791[(10)] = inst_38769);

return statearr_38791;
})();
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_38778__$1,(9),results,inst_38764);
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
var cljs$core$async$pipeline_STAR__$_state_machine__37085__auto__ = null;
var cljs$core$async$pipeline_STAR__$_state_machine__37085__auto____0 = (function (){
var statearr_38792 = [null,null,null,null,null,null,null,null,null,null,null];
(statearr_38792[(0)] = cljs$core$async$pipeline_STAR__$_state_machine__37085__auto__);

(statearr_38792[(1)] = (1));

return statearr_38792;
});
var cljs$core$async$pipeline_STAR__$_state_machine__37085__auto____1 = (function (state_38778){
while(true){
var ret_value__37086__auto__ = (function (){try{while(true){
var result__37087__auto__ = switch__37084__auto__(state_38778);
if(cljs.core.keyword_identical_QMARK_(result__37087__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__37087__auto__;
}
break;
}
}catch (e38793){var ex__37088__auto__ = e38793;
var statearr_38794_41148 = state_38778;
(statearr_38794_41148[(2)] = ex__37088__auto__);


if(cljs.core.seq((state_38778[(4)]))){
var statearr_38795_41149 = state_38778;
(statearr_38795_41149[(1)] = cljs.core.first((state_38778[(4)])));

} else {
throw ex__37088__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__37086__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__41150 = state_38778;
state_38778 = G__41150;
continue;
} else {
return ret_value__37086__auto__;
}
break;
}
});
cljs$core$async$pipeline_STAR__$_state_machine__37085__auto__ = function(state_38778){
switch(arguments.length){
case 0:
return cljs$core$async$pipeline_STAR__$_state_machine__37085__auto____0.call(this);
case 1:
return cljs$core$async$pipeline_STAR__$_state_machine__37085__auto____1.call(this,state_38778);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$pipeline_STAR__$_state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$pipeline_STAR__$_state_machine__37085__auto____0;
cljs$core$async$pipeline_STAR__$_state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$pipeline_STAR__$_state_machine__37085__auto____1;
return cljs$core$async$pipeline_STAR__$_state_machine__37085__auto__;
})()
})();
var state__37596__auto__ = (function (){var statearr_38796 = f__37595__auto__();
(statearr_38796[(6)] = c__37594__auto___41133);

return statearr_38796;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__37596__auto__);
}));


var c__37594__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__37595__auto__ = (function (){var switch__37084__auto__ = (function (state_38835){
var state_val_38836 = (state_38835[(1)]);
if((state_val_38836 === (7))){
var inst_38831 = (state_38835[(2)]);
var state_38835__$1 = state_38835;
var statearr_38837_41151 = state_38835__$1;
(statearr_38837_41151[(2)] = inst_38831);

(statearr_38837_41151[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38836 === (20))){
var state_38835__$1 = state_38835;
var statearr_38838_41152 = state_38835__$1;
(statearr_38838_41152[(2)] = null);

(statearr_38838_41152[(1)] = (21));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38836 === (1))){
var state_38835__$1 = state_38835;
var statearr_38840_41153 = state_38835__$1;
(statearr_38840_41153[(2)] = null);

(statearr_38840_41153[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38836 === (4))){
var inst_38800 = (state_38835[(7)]);
var inst_38800__$1 = (state_38835[(2)]);
var inst_38801 = (inst_38800__$1 == null);
var state_38835__$1 = (function (){var statearr_38841 = state_38835;
(statearr_38841[(7)] = inst_38800__$1);

return statearr_38841;
})();
if(cljs.core.truth_(inst_38801)){
var statearr_38842_41154 = state_38835__$1;
(statearr_38842_41154[(1)] = (5));

} else {
var statearr_38843_41155 = state_38835__$1;
(statearr_38843_41155[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38836 === (15))){
var inst_38813 = (state_38835[(8)]);
var state_38835__$1 = state_38835;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_38835__$1,(18),to,inst_38813);
} else {
if((state_val_38836 === (21))){
var inst_38826 = (state_38835[(2)]);
var state_38835__$1 = state_38835;
var statearr_38844_41157 = state_38835__$1;
(statearr_38844_41157[(2)] = inst_38826);

(statearr_38844_41157[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38836 === (13))){
var inst_38828 = (state_38835[(2)]);
var state_38835__$1 = (function (){var statearr_38845 = state_38835;
(statearr_38845[(9)] = inst_38828);

return statearr_38845;
})();
var statearr_38846_41164 = state_38835__$1;
(statearr_38846_41164[(2)] = null);

(statearr_38846_41164[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38836 === (6))){
var inst_38800 = (state_38835[(7)]);
var state_38835__$1 = state_38835;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_38835__$1,(11),inst_38800);
} else {
if((state_val_38836 === (17))){
var inst_38821 = (state_38835[(2)]);
var state_38835__$1 = state_38835;
if(cljs.core.truth_(inst_38821)){
var statearr_38847_41165 = state_38835__$1;
(statearr_38847_41165[(1)] = (19));

} else {
var statearr_38849_41167 = state_38835__$1;
(statearr_38849_41167[(1)] = (20));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38836 === (3))){
var inst_38833 = (state_38835[(2)]);
var state_38835__$1 = state_38835;
return cljs.core.async.impl.ioc_helpers.return_chan(state_38835__$1,inst_38833);
} else {
if((state_val_38836 === (12))){
var inst_38810 = (state_38835[(10)]);
var state_38835__$1 = state_38835;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_38835__$1,(14),inst_38810);
} else {
if((state_val_38836 === (2))){
var state_38835__$1 = state_38835;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_38835__$1,(4),results);
} else {
if((state_val_38836 === (19))){
var state_38835__$1 = state_38835;
var statearr_38850_41175 = state_38835__$1;
(statearr_38850_41175[(2)] = null);

(statearr_38850_41175[(1)] = (12));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38836 === (11))){
var inst_38810 = (state_38835[(2)]);
var state_38835__$1 = (function (){var statearr_38851 = state_38835;
(statearr_38851[(10)] = inst_38810);

return statearr_38851;
})();
var statearr_38852_41180 = state_38835__$1;
(statearr_38852_41180[(2)] = null);

(statearr_38852_41180[(1)] = (12));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38836 === (9))){
var state_38835__$1 = state_38835;
var statearr_38853_41181 = state_38835__$1;
(statearr_38853_41181[(2)] = null);

(statearr_38853_41181[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38836 === (5))){
var state_38835__$1 = state_38835;
if(cljs.core.truth_(close_QMARK_)){
var statearr_38854_41182 = state_38835__$1;
(statearr_38854_41182[(1)] = (8));

} else {
var statearr_38855_41183 = state_38835__$1;
(statearr_38855_41183[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38836 === (14))){
var inst_38813 = (state_38835[(8)]);
var inst_38815 = (state_38835[(11)]);
var inst_38813__$1 = (state_38835[(2)]);
var inst_38814 = (inst_38813__$1 == null);
var inst_38815__$1 = cljs.core.not(inst_38814);
var state_38835__$1 = (function (){var statearr_38856 = state_38835;
(statearr_38856[(8)] = inst_38813__$1);

(statearr_38856[(11)] = inst_38815__$1);

return statearr_38856;
})();
if(inst_38815__$1){
var statearr_38858_41184 = state_38835__$1;
(statearr_38858_41184[(1)] = (15));

} else {
var statearr_38859_41185 = state_38835__$1;
(statearr_38859_41185[(1)] = (16));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38836 === (16))){
var inst_38815 = (state_38835[(11)]);
var state_38835__$1 = state_38835;
var statearr_38860_41186 = state_38835__$1;
(statearr_38860_41186[(2)] = inst_38815);

(statearr_38860_41186[(1)] = (17));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38836 === (10))){
var inst_38807 = (state_38835[(2)]);
var state_38835__$1 = state_38835;
var statearr_38861_41187 = state_38835__$1;
(statearr_38861_41187[(2)] = inst_38807);

(statearr_38861_41187[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38836 === (18))){
var inst_38818 = (state_38835[(2)]);
var state_38835__$1 = state_38835;
var statearr_38862_41188 = state_38835__$1;
(statearr_38862_41188[(2)] = inst_38818);

(statearr_38862_41188[(1)] = (17));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38836 === (8))){
var inst_38804 = cljs.core.async.close_BANG_(to);
var state_38835__$1 = state_38835;
var statearr_38863_41189 = state_38835__$1;
(statearr_38863_41189[(2)] = inst_38804);

(statearr_38863_41189[(1)] = (10));


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
var cljs$core$async$pipeline_STAR__$_state_machine__37085__auto__ = null;
var cljs$core$async$pipeline_STAR__$_state_machine__37085__auto____0 = (function (){
var statearr_38864 = [null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_38864[(0)] = cljs$core$async$pipeline_STAR__$_state_machine__37085__auto__);

(statearr_38864[(1)] = (1));

return statearr_38864;
});
var cljs$core$async$pipeline_STAR__$_state_machine__37085__auto____1 = (function (state_38835){
while(true){
var ret_value__37086__auto__ = (function (){try{while(true){
var result__37087__auto__ = switch__37084__auto__(state_38835);
if(cljs.core.keyword_identical_QMARK_(result__37087__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__37087__auto__;
}
break;
}
}catch (e38865){var ex__37088__auto__ = e38865;
var statearr_38866_41190 = state_38835;
(statearr_38866_41190[(2)] = ex__37088__auto__);


if(cljs.core.seq((state_38835[(4)]))){
var statearr_38867_41191 = state_38835;
(statearr_38867_41191[(1)] = cljs.core.first((state_38835[(4)])));

} else {
throw ex__37088__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__37086__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__41192 = state_38835;
state_38835 = G__41192;
continue;
} else {
return ret_value__37086__auto__;
}
break;
}
});
cljs$core$async$pipeline_STAR__$_state_machine__37085__auto__ = function(state_38835){
switch(arguments.length){
case 0:
return cljs$core$async$pipeline_STAR__$_state_machine__37085__auto____0.call(this);
case 1:
return cljs$core$async$pipeline_STAR__$_state_machine__37085__auto____1.call(this,state_38835);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$pipeline_STAR__$_state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$pipeline_STAR__$_state_machine__37085__auto____0;
cljs$core$async$pipeline_STAR__$_state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$pipeline_STAR__$_state_machine__37085__auto____1;
return cljs$core$async$pipeline_STAR__$_state_machine__37085__auto__;
})()
})();
var state__37596__auto__ = (function (){var statearr_38869 = f__37595__auto__();
(statearr_38869[(6)] = c__37594__auto__);

return statearr_38869;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__37596__auto__);
}));

return c__37594__auto__;
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
var G__38871 = arguments.length;
switch (G__38871) {
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
var G__38875 = arguments.length;
switch (G__38875) {
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
var G__38877 = arguments.length;
switch (G__38877) {
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
var c__37594__auto___41199 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__37595__auto__ = (function (){var switch__37084__auto__ = (function (state_38904){
var state_val_38905 = (state_38904[(1)]);
if((state_val_38905 === (7))){
var inst_38900 = (state_38904[(2)]);
var state_38904__$1 = state_38904;
var statearr_38907_41201 = state_38904__$1;
(statearr_38907_41201[(2)] = inst_38900);

(statearr_38907_41201[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38905 === (1))){
var state_38904__$1 = state_38904;
var statearr_38909_41203 = state_38904__$1;
(statearr_38909_41203[(2)] = null);

(statearr_38909_41203[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38905 === (4))){
var inst_38881 = (state_38904[(7)]);
var inst_38881__$1 = (state_38904[(2)]);
var inst_38882 = (inst_38881__$1 == null);
var state_38904__$1 = (function (){var statearr_38910 = state_38904;
(statearr_38910[(7)] = inst_38881__$1);

return statearr_38910;
})();
if(cljs.core.truth_(inst_38882)){
var statearr_38911_41204 = state_38904__$1;
(statearr_38911_41204[(1)] = (5));

} else {
var statearr_38912_41205 = state_38904__$1;
(statearr_38912_41205[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38905 === (13))){
var state_38904__$1 = state_38904;
var statearr_38913_41206 = state_38904__$1;
(statearr_38913_41206[(2)] = null);

(statearr_38913_41206[(1)] = (14));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38905 === (6))){
var inst_38881 = (state_38904[(7)]);
var inst_38887 = (p.cljs$core$IFn$_invoke$arity$1 ? p.cljs$core$IFn$_invoke$arity$1(inst_38881) : p.call(null,inst_38881));
var state_38904__$1 = state_38904;
if(cljs.core.truth_(inst_38887)){
var statearr_38914_41207 = state_38904__$1;
(statearr_38914_41207[(1)] = (9));

} else {
var statearr_38915_41208 = state_38904__$1;
(statearr_38915_41208[(1)] = (10));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38905 === (3))){
var inst_38902 = (state_38904[(2)]);
var state_38904__$1 = state_38904;
return cljs.core.async.impl.ioc_helpers.return_chan(state_38904__$1,inst_38902);
} else {
if((state_val_38905 === (12))){
var state_38904__$1 = state_38904;
var statearr_38916_41209 = state_38904__$1;
(statearr_38916_41209[(2)] = null);

(statearr_38916_41209[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38905 === (2))){
var state_38904__$1 = state_38904;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_38904__$1,(4),ch);
} else {
if((state_val_38905 === (11))){
var inst_38881 = (state_38904[(7)]);
var inst_38891 = (state_38904[(2)]);
var state_38904__$1 = state_38904;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_38904__$1,(8),inst_38891,inst_38881);
} else {
if((state_val_38905 === (9))){
var state_38904__$1 = state_38904;
var statearr_38918_41217 = state_38904__$1;
(statearr_38918_41217[(2)] = tc);

(statearr_38918_41217[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38905 === (5))){
var inst_38884 = cljs.core.async.close_BANG_(tc);
var inst_38885 = cljs.core.async.close_BANG_(fc);
var state_38904__$1 = (function (){var statearr_38919 = state_38904;
(statearr_38919[(8)] = inst_38884);

return statearr_38919;
})();
var statearr_38920_41220 = state_38904__$1;
(statearr_38920_41220[(2)] = inst_38885);

(statearr_38920_41220[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38905 === (14))){
var inst_38898 = (state_38904[(2)]);
var state_38904__$1 = state_38904;
var statearr_38921_41221 = state_38904__$1;
(statearr_38921_41221[(2)] = inst_38898);

(statearr_38921_41221[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38905 === (10))){
var state_38904__$1 = state_38904;
var statearr_38922_41224 = state_38904__$1;
(statearr_38922_41224[(2)] = fc);

(statearr_38922_41224[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38905 === (8))){
var inst_38893 = (state_38904[(2)]);
var state_38904__$1 = state_38904;
if(cljs.core.truth_(inst_38893)){
var statearr_38923_41229 = state_38904__$1;
(statearr_38923_41229[(1)] = (12));

} else {
var statearr_38924_41231 = state_38904__$1;
(statearr_38924_41231[(1)] = (13));

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
var cljs$core$async$state_machine__37085__auto__ = null;
var cljs$core$async$state_machine__37085__auto____0 = (function (){
var statearr_38926 = [null,null,null,null,null,null,null,null,null];
(statearr_38926[(0)] = cljs$core$async$state_machine__37085__auto__);

(statearr_38926[(1)] = (1));

return statearr_38926;
});
var cljs$core$async$state_machine__37085__auto____1 = (function (state_38904){
while(true){
var ret_value__37086__auto__ = (function (){try{while(true){
var result__37087__auto__ = switch__37084__auto__(state_38904);
if(cljs.core.keyword_identical_QMARK_(result__37087__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__37087__auto__;
}
break;
}
}catch (e38927){var ex__37088__auto__ = e38927;
var statearr_38928_41234 = state_38904;
(statearr_38928_41234[(2)] = ex__37088__auto__);


if(cljs.core.seq((state_38904[(4)]))){
var statearr_38929_41235 = state_38904;
(statearr_38929_41235[(1)] = cljs.core.first((state_38904[(4)])));

} else {
throw ex__37088__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__37086__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__41236 = state_38904;
state_38904 = G__41236;
continue;
} else {
return ret_value__37086__auto__;
}
break;
}
});
cljs$core$async$state_machine__37085__auto__ = function(state_38904){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__37085__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__37085__auto____1.call(this,state_38904);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__37085__auto____0;
cljs$core$async$state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__37085__auto____1;
return cljs$core$async$state_machine__37085__auto__;
})()
})();
var state__37596__auto__ = (function (){var statearr_38930 = f__37595__auto__();
(statearr_38930[(6)] = c__37594__auto___41199);

return statearr_38930;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__37596__auto__);
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
var c__37594__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__37595__auto__ = (function (){var switch__37084__auto__ = (function (state_38954){
var state_val_38955 = (state_38954[(1)]);
if((state_val_38955 === (7))){
var inst_38950 = (state_38954[(2)]);
var state_38954__$1 = state_38954;
var statearr_38957_41237 = state_38954__$1;
(statearr_38957_41237[(2)] = inst_38950);

(statearr_38957_41237[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38955 === (1))){
var inst_38932 = init;
var inst_38933 = inst_38932;
var state_38954__$1 = (function (){var statearr_38958 = state_38954;
(statearr_38958[(7)] = inst_38933);

return statearr_38958;
})();
var statearr_38959_41238 = state_38954__$1;
(statearr_38959_41238[(2)] = null);

(statearr_38959_41238[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38955 === (4))){
var inst_38937 = (state_38954[(8)]);
var inst_38937__$1 = (state_38954[(2)]);
var inst_38938 = (inst_38937__$1 == null);
var state_38954__$1 = (function (){var statearr_38960 = state_38954;
(statearr_38960[(8)] = inst_38937__$1);

return statearr_38960;
})();
if(cljs.core.truth_(inst_38938)){
var statearr_38962_41239 = state_38954__$1;
(statearr_38962_41239[(1)] = (5));

} else {
var statearr_38964_41240 = state_38954__$1;
(statearr_38964_41240[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38955 === (6))){
var inst_38933 = (state_38954[(7)]);
var inst_38937 = (state_38954[(8)]);
var inst_38941 = (state_38954[(9)]);
var inst_38941__$1 = (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(inst_38933,inst_38937) : f.call(null,inst_38933,inst_38937));
var inst_38942 = cljs.core.reduced_QMARK_(inst_38941__$1);
var state_38954__$1 = (function (){var statearr_38966 = state_38954;
(statearr_38966[(9)] = inst_38941__$1);

return statearr_38966;
})();
if(inst_38942){
var statearr_38967_41241 = state_38954__$1;
(statearr_38967_41241[(1)] = (8));

} else {
var statearr_38968_41242 = state_38954__$1;
(statearr_38968_41242[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38955 === (3))){
var inst_38952 = (state_38954[(2)]);
var state_38954__$1 = state_38954;
return cljs.core.async.impl.ioc_helpers.return_chan(state_38954__$1,inst_38952);
} else {
if((state_val_38955 === (2))){
var state_38954__$1 = state_38954;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_38954__$1,(4),ch);
} else {
if((state_val_38955 === (9))){
var inst_38941 = (state_38954[(9)]);
var inst_38933 = inst_38941;
var state_38954__$1 = (function (){var statearr_38970 = state_38954;
(statearr_38970[(7)] = inst_38933);

return statearr_38970;
})();
var statearr_38973_41245 = state_38954__$1;
(statearr_38973_41245[(2)] = null);

(statearr_38973_41245[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38955 === (5))){
var inst_38933 = (state_38954[(7)]);
var state_38954__$1 = state_38954;
var statearr_38975_41252 = state_38954__$1;
(statearr_38975_41252[(2)] = inst_38933);

(statearr_38975_41252[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38955 === (10))){
var inst_38948 = (state_38954[(2)]);
var state_38954__$1 = state_38954;
var statearr_38978_41253 = state_38954__$1;
(statearr_38978_41253[(2)] = inst_38948);

(statearr_38978_41253[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_38955 === (8))){
var inst_38941 = (state_38954[(9)]);
var inst_38944 = cljs.core.deref(inst_38941);
var state_38954__$1 = state_38954;
var statearr_38979_41254 = state_38954__$1;
(statearr_38979_41254[(2)] = inst_38944);

(statearr_38979_41254[(1)] = (10));


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
var cljs$core$async$reduce_$_state_machine__37085__auto__ = null;
var cljs$core$async$reduce_$_state_machine__37085__auto____0 = (function (){
var statearr_38981 = [null,null,null,null,null,null,null,null,null,null];
(statearr_38981[(0)] = cljs$core$async$reduce_$_state_machine__37085__auto__);

(statearr_38981[(1)] = (1));

return statearr_38981;
});
var cljs$core$async$reduce_$_state_machine__37085__auto____1 = (function (state_38954){
while(true){
var ret_value__37086__auto__ = (function (){try{while(true){
var result__37087__auto__ = switch__37084__auto__(state_38954);
if(cljs.core.keyword_identical_QMARK_(result__37087__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__37087__auto__;
}
break;
}
}catch (e38982){var ex__37088__auto__ = e38982;
var statearr_38983_41260 = state_38954;
(statearr_38983_41260[(2)] = ex__37088__auto__);


if(cljs.core.seq((state_38954[(4)]))){
var statearr_38984_41261 = state_38954;
(statearr_38984_41261[(1)] = cljs.core.first((state_38954[(4)])));

} else {
throw ex__37088__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__37086__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__41262 = state_38954;
state_38954 = G__41262;
continue;
} else {
return ret_value__37086__auto__;
}
break;
}
});
cljs$core$async$reduce_$_state_machine__37085__auto__ = function(state_38954){
switch(arguments.length){
case 0:
return cljs$core$async$reduce_$_state_machine__37085__auto____0.call(this);
case 1:
return cljs$core$async$reduce_$_state_machine__37085__auto____1.call(this,state_38954);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$reduce_$_state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$reduce_$_state_machine__37085__auto____0;
cljs$core$async$reduce_$_state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$reduce_$_state_machine__37085__auto____1;
return cljs$core$async$reduce_$_state_machine__37085__auto__;
})()
})();
var state__37596__auto__ = (function (){var statearr_38985 = f__37595__auto__();
(statearr_38985[(6)] = c__37594__auto__);

return statearr_38985;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__37596__auto__);
}));

return c__37594__auto__;
});
/**
 * async/reduces a channel with a transformation (xform f).
 *   Returns a channel containing the result.  ch must close before
 *   transduce produces a result.
 */
cljs.core.async.transduce = (function cljs$core$async$transduce(xform,f,init,ch){
var f__$1 = (xform.cljs$core$IFn$_invoke$arity$1 ? xform.cljs$core$IFn$_invoke$arity$1(f) : xform.call(null,f));
var c__37594__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__37595__auto__ = (function (){var switch__37084__auto__ = (function (state_38991){
var state_val_38992 = (state_38991[(1)]);
if((state_val_38992 === (1))){
var inst_38986 = cljs.core.async.reduce(f__$1,init,ch);
var state_38991__$1 = state_38991;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_38991__$1,(2),inst_38986);
} else {
if((state_val_38992 === (2))){
var inst_38988 = (state_38991[(2)]);
var inst_38989 = (f__$1.cljs$core$IFn$_invoke$arity$1 ? f__$1.cljs$core$IFn$_invoke$arity$1(inst_38988) : f__$1.call(null,inst_38988));
var state_38991__$1 = state_38991;
return cljs.core.async.impl.ioc_helpers.return_chan(state_38991__$1,inst_38989);
} else {
return null;
}
}
});
return (function() {
var cljs$core$async$transduce_$_state_machine__37085__auto__ = null;
var cljs$core$async$transduce_$_state_machine__37085__auto____0 = (function (){
var statearr_38993 = [null,null,null,null,null,null,null];
(statearr_38993[(0)] = cljs$core$async$transduce_$_state_machine__37085__auto__);

(statearr_38993[(1)] = (1));

return statearr_38993;
});
var cljs$core$async$transduce_$_state_machine__37085__auto____1 = (function (state_38991){
while(true){
var ret_value__37086__auto__ = (function (){try{while(true){
var result__37087__auto__ = switch__37084__auto__(state_38991);
if(cljs.core.keyword_identical_QMARK_(result__37087__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__37087__auto__;
}
break;
}
}catch (e38995){var ex__37088__auto__ = e38995;
var statearr_38996_41267 = state_38991;
(statearr_38996_41267[(2)] = ex__37088__auto__);


if(cljs.core.seq((state_38991[(4)]))){
var statearr_38997_41268 = state_38991;
(statearr_38997_41268[(1)] = cljs.core.first((state_38991[(4)])));

} else {
throw ex__37088__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__37086__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__41269 = state_38991;
state_38991 = G__41269;
continue;
} else {
return ret_value__37086__auto__;
}
break;
}
});
cljs$core$async$transduce_$_state_machine__37085__auto__ = function(state_38991){
switch(arguments.length){
case 0:
return cljs$core$async$transduce_$_state_machine__37085__auto____0.call(this);
case 1:
return cljs$core$async$transduce_$_state_machine__37085__auto____1.call(this,state_38991);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$transduce_$_state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$transduce_$_state_machine__37085__auto____0;
cljs$core$async$transduce_$_state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$transduce_$_state_machine__37085__auto____1;
return cljs$core$async$transduce_$_state_machine__37085__auto__;
})()
})();
var state__37596__auto__ = (function (){var statearr_38998 = f__37595__auto__();
(statearr_38998[(6)] = c__37594__auto__);

return statearr_38998;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__37596__auto__);
}));

return c__37594__auto__;
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
var G__39000 = arguments.length;
switch (G__39000) {
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
var c__37594__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__37595__auto__ = (function (){var switch__37084__auto__ = (function (state_39025){
var state_val_39026 = (state_39025[(1)]);
if((state_val_39026 === (7))){
var inst_39007 = (state_39025[(2)]);
var state_39025__$1 = state_39025;
var statearr_39027_41271 = state_39025__$1;
(statearr_39027_41271[(2)] = inst_39007);

(statearr_39027_41271[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39026 === (1))){
var inst_39001 = cljs.core.seq(coll);
var inst_39002 = inst_39001;
var state_39025__$1 = (function (){var statearr_39028 = state_39025;
(statearr_39028[(7)] = inst_39002);

return statearr_39028;
})();
var statearr_39029_41272 = state_39025__$1;
(statearr_39029_41272[(2)] = null);

(statearr_39029_41272[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39026 === (4))){
var inst_39002 = (state_39025[(7)]);
var inst_39005 = cljs.core.first(inst_39002);
var state_39025__$1 = state_39025;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_39025__$1,(7),ch,inst_39005);
} else {
if((state_val_39026 === (13))){
var inst_39019 = (state_39025[(2)]);
var state_39025__$1 = state_39025;
var statearr_39030_41273 = state_39025__$1;
(statearr_39030_41273[(2)] = inst_39019);

(statearr_39030_41273[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39026 === (6))){
var inst_39010 = (state_39025[(2)]);
var state_39025__$1 = state_39025;
if(cljs.core.truth_(inst_39010)){
var statearr_39031_41275 = state_39025__$1;
(statearr_39031_41275[(1)] = (8));

} else {
var statearr_39033_41276 = state_39025__$1;
(statearr_39033_41276[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39026 === (3))){
var inst_39023 = (state_39025[(2)]);
var state_39025__$1 = state_39025;
return cljs.core.async.impl.ioc_helpers.return_chan(state_39025__$1,inst_39023);
} else {
if((state_val_39026 === (12))){
var state_39025__$1 = state_39025;
var statearr_39034_41277 = state_39025__$1;
(statearr_39034_41277[(2)] = null);

(statearr_39034_41277[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39026 === (2))){
var inst_39002 = (state_39025[(7)]);
var state_39025__$1 = state_39025;
if(cljs.core.truth_(inst_39002)){
var statearr_39035_41278 = state_39025__$1;
(statearr_39035_41278[(1)] = (4));

} else {
var statearr_39036_41279 = state_39025__$1;
(statearr_39036_41279[(1)] = (5));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39026 === (11))){
var inst_39016 = cljs.core.async.close_BANG_(ch);
var state_39025__$1 = state_39025;
var statearr_39037_41284 = state_39025__$1;
(statearr_39037_41284[(2)] = inst_39016);

(statearr_39037_41284[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39026 === (9))){
var state_39025__$1 = state_39025;
if(cljs.core.truth_(close_QMARK_)){
var statearr_39038_41285 = state_39025__$1;
(statearr_39038_41285[(1)] = (11));

} else {
var statearr_39039_41286 = state_39025__$1;
(statearr_39039_41286[(1)] = (12));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39026 === (5))){
var inst_39002 = (state_39025[(7)]);
var state_39025__$1 = state_39025;
var statearr_39040_41287 = state_39025__$1;
(statearr_39040_41287[(2)] = inst_39002);

(statearr_39040_41287[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39026 === (10))){
var inst_39021 = (state_39025[(2)]);
var state_39025__$1 = state_39025;
var statearr_39041_41288 = state_39025__$1;
(statearr_39041_41288[(2)] = inst_39021);

(statearr_39041_41288[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39026 === (8))){
var inst_39002 = (state_39025[(7)]);
var inst_39012 = cljs.core.next(inst_39002);
var inst_39002__$1 = inst_39012;
var state_39025__$1 = (function (){var statearr_39042 = state_39025;
(statearr_39042[(7)] = inst_39002__$1);

return statearr_39042;
})();
var statearr_39043_41289 = state_39025__$1;
(statearr_39043_41289[(2)] = null);

(statearr_39043_41289[(1)] = (2));


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
var cljs$core$async$state_machine__37085__auto__ = null;
var cljs$core$async$state_machine__37085__auto____0 = (function (){
var statearr_39045 = [null,null,null,null,null,null,null,null];
(statearr_39045[(0)] = cljs$core$async$state_machine__37085__auto__);

(statearr_39045[(1)] = (1));

return statearr_39045;
});
var cljs$core$async$state_machine__37085__auto____1 = (function (state_39025){
while(true){
var ret_value__37086__auto__ = (function (){try{while(true){
var result__37087__auto__ = switch__37084__auto__(state_39025);
if(cljs.core.keyword_identical_QMARK_(result__37087__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__37087__auto__;
}
break;
}
}catch (e39046){var ex__37088__auto__ = e39046;
var statearr_39047_41290 = state_39025;
(statearr_39047_41290[(2)] = ex__37088__auto__);


if(cljs.core.seq((state_39025[(4)]))){
var statearr_39048_41291 = state_39025;
(statearr_39048_41291[(1)] = cljs.core.first((state_39025[(4)])));

} else {
throw ex__37088__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__37086__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__41292 = state_39025;
state_39025 = G__41292;
continue;
} else {
return ret_value__37086__auto__;
}
break;
}
});
cljs$core$async$state_machine__37085__auto__ = function(state_39025){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__37085__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__37085__auto____1.call(this,state_39025);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__37085__auto____0;
cljs$core$async$state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__37085__auto____1;
return cljs$core$async$state_machine__37085__auto__;
})()
})();
var state__37596__auto__ = (function (){var statearr_39049 = f__37595__auto__();
(statearr_39049[(6)] = c__37594__auto__);

return statearr_39049;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__37596__auto__);
}));

return c__37594__auto__;
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
var G__39051 = arguments.length;
switch (G__39051) {
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

var cljs$core$async$Mux$muxch_STAR_$dyn_41297 = (function (_){
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
return cljs$core$async$Mux$muxch_STAR_$dyn_41297(_);
}
});


/**
 * @interface
 */
cljs.core.async.Mult = function(){};

var cljs$core$async$Mult$tap_STAR_$dyn_41298 = (function (m,ch,close_QMARK_){
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
return cljs$core$async$Mult$tap_STAR_$dyn_41298(m,ch,close_QMARK_);
}
});

var cljs$core$async$Mult$untap_STAR_$dyn_41299 = (function (m,ch){
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
return cljs$core$async$Mult$untap_STAR_$dyn_41299(m,ch);
}
});

var cljs$core$async$Mult$untap_all_STAR_$dyn_41300 = (function (m){
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
return cljs$core$async$Mult$untap_all_STAR_$dyn_41300(m);
}
});


/**
* @constructor
 * @implements {cljs.core.async.Mult}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.async.Mux}
 * @implements {cljs.core.IWithMeta}
*/
cljs.core.async.t_cljs$core$async39065 = (function (ch,cs,meta39066){
this.ch = ch;
this.cs = cs;
this.meta39066 = meta39066;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async39065.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_39067,meta39066__$1){
var self__ = this;
var _39067__$1 = this;
return (new cljs.core.async.t_cljs$core$async39065(self__.ch,self__.cs,meta39066__$1));
}));

(cljs.core.async.t_cljs$core$async39065.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_39067){
var self__ = this;
var _39067__$1 = this;
return self__.meta39066;
}));

(cljs.core.async.t_cljs$core$async39065.prototype.cljs$core$async$Mux$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async39065.prototype.cljs$core$async$Mux$muxch_STAR_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return self__.ch;
}));

(cljs.core.async.t_cljs$core$async39065.prototype.cljs$core$async$Mult$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async39065.prototype.cljs$core$async$Mult$tap_STAR_$arity$3 = (function (_,ch__$1,close_QMARK_){
var self__ = this;
var ___$1 = this;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(self__.cs,cljs.core.assoc,ch__$1,close_QMARK_);

return null;
}));

(cljs.core.async.t_cljs$core$async39065.prototype.cljs$core$async$Mult$untap_STAR_$arity$2 = (function (_,ch__$1){
var self__ = this;
var ___$1 = this;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(self__.cs,cljs.core.dissoc,ch__$1);

return null;
}));

(cljs.core.async.t_cljs$core$async39065.prototype.cljs$core$async$Mult$untap_all_STAR_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
cljs.core.reset_BANG_(self__.cs,cljs.core.PersistentArrayMap.EMPTY);

return null;
}));

(cljs.core.async.t_cljs$core$async39065.getBasis = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"ch","ch",1085813622,null),new cljs.core.Symbol(null,"cs","cs",-117024463,null),new cljs.core.Symbol(null,"meta39066","meta39066",-1302294523,null)], null);
}));

(cljs.core.async.t_cljs$core$async39065.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async39065.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async39065");

(cljs.core.async.t_cljs$core$async39065.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async39065");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async39065.
 */
cljs.core.async.__GT_t_cljs$core$async39065 = (function cljs$core$async$__GT_t_cljs$core$async39065(ch,cs,meta39066){
return (new cljs.core.async.t_cljs$core$async39065(ch,cs,meta39066));
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
var m = (new cljs.core.async.t_cljs$core$async39065(ch,cs,cljs.core.PersistentArrayMap.EMPTY));
var dchan = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
var dctr = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
var done = (function (_){
if((cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(dctr,cljs.core.dec) === (0))){
return cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$2(dchan,true);
} else {
return null;
}
});
var c__37594__auto___41304 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__37595__auto__ = (function (){var switch__37084__auto__ = (function (state_39214){
var state_val_39215 = (state_39214[(1)]);
if((state_val_39215 === (7))){
var inst_39210 = (state_39214[(2)]);
var state_39214__$1 = state_39214;
var statearr_39216_41305 = state_39214__$1;
(statearr_39216_41305[(2)] = inst_39210);

(statearr_39216_41305[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (20))){
var inst_39109 = (state_39214[(7)]);
var inst_39123 = cljs.core.first(inst_39109);
var inst_39124 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_39123,(0),null);
var inst_39126 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_39123,(1),null);
var state_39214__$1 = (function (){var statearr_39217 = state_39214;
(statearr_39217[(8)] = inst_39124);

return statearr_39217;
})();
if(cljs.core.truth_(inst_39126)){
var statearr_39218_41307 = state_39214__$1;
(statearr_39218_41307[(1)] = (22));

} else {
var statearr_39219_41310 = state_39214__$1;
(statearr_39219_41310[(1)] = (23));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (27))){
var inst_39155 = (state_39214[(9)]);
var inst_39157 = (state_39214[(10)]);
var inst_39162 = (state_39214[(11)]);
var inst_39077 = (state_39214[(12)]);
var inst_39162__$1 = cljs.core._nth(inst_39155,inst_39157);
var inst_39163 = cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$3(inst_39162__$1,inst_39077,done);
var state_39214__$1 = (function (){var statearr_39223 = state_39214;
(statearr_39223[(11)] = inst_39162__$1);

return statearr_39223;
})();
if(cljs.core.truth_(inst_39163)){
var statearr_39224_41311 = state_39214__$1;
(statearr_39224_41311[(1)] = (30));

} else {
var statearr_39227_41312 = state_39214__$1;
(statearr_39227_41312[(1)] = (31));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (1))){
var state_39214__$1 = state_39214;
var statearr_39229_41313 = state_39214__$1;
(statearr_39229_41313[(2)] = null);

(statearr_39229_41313[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (24))){
var inst_39109 = (state_39214[(7)]);
var inst_39132 = (state_39214[(2)]);
var inst_39133 = cljs.core.next(inst_39109);
var inst_39086 = inst_39133;
var inst_39087 = null;
var inst_39088 = (0);
var inst_39089 = (0);
var state_39214__$1 = (function (){var statearr_39233 = state_39214;
(statearr_39233[(13)] = inst_39132);

(statearr_39233[(14)] = inst_39086);

(statearr_39233[(15)] = inst_39087);

(statearr_39233[(16)] = inst_39088);

(statearr_39233[(17)] = inst_39089);

return statearr_39233;
})();
var statearr_39234_41315 = state_39214__$1;
(statearr_39234_41315[(2)] = null);

(statearr_39234_41315[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (39))){
var state_39214__$1 = state_39214;
var statearr_39251_41316 = state_39214__$1;
(statearr_39251_41316[(2)] = null);

(statearr_39251_41316[(1)] = (41));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (4))){
var inst_39077 = (state_39214[(12)]);
var inst_39077__$1 = (state_39214[(2)]);
var inst_39078 = (inst_39077__$1 == null);
var state_39214__$1 = (function (){var statearr_39255 = state_39214;
(statearr_39255[(12)] = inst_39077__$1);

return statearr_39255;
})();
if(cljs.core.truth_(inst_39078)){
var statearr_39257_41321 = state_39214__$1;
(statearr_39257_41321[(1)] = (5));

} else {
var statearr_39258_41323 = state_39214__$1;
(statearr_39258_41323[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (15))){
var inst_39089 = (state_39214[(17)]);
var inst_39086 = (state_39214[(14)]);
var inst_39087 = (state_39214[(15)]);
var inst_39088 = (state_39214[(16)]);
var inst_39104 = (state_39214[(2)]);
var inst_39106 = (inst_39089 + (1));
var tmp39243 = inst_39087;
var tmp39244 = inst_39088;
var tmp39245 = inst_39086;
var inst_39086__$1 = tmp39245;
var inst_39087__$1 = tmp39243;
var inst_39088__$1 = tmp39244;
var inst_39089__$1 = inst_39106;
var state_39214__$1 = (function (){var statearr_39262 = state_39214;
(statearr_39262[(18)] = inst_39104);

(statearr_39262[(14)] = inst_39086__$1);

(statearr_39262[(15)] = inst_39087__$1);

(statearr_39262[(16)] = inst_39088__$1);

(statearr_39262[(17)] = inst_39089__$1);

return statearr_39262;
})();
var statearr_39264_41324 = state_39214__$1;
(statearr_39264_41324[(2)] = null);

(statearr_39264_41324[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (21))){
var inst_39136 = (state_39214[(2)]);
var state_39214__$1 = state_39214;
var statearr_39271_41325 = state_39214__$1;
(statearr_39271_41325[(2)] = inst_39136);

(statearr_39271_41325[(1)] = (18));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (31))){
var inst_39162 = (state_39214[(11)]);
var inst_39166 = m.cljs$core$async$Mult$untap_STAR_$arity$2(null,inst_39162);
var state_39214__$1 = state_39214;
var statearr_39273_41326 = state_39214__$1;
(statearr_39273_41326[(2)] = inst_39166);

(statearr_39273_41326[(1)] = (32));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (32))){
var inst_39157 = (state_39214[(10)]);
var inst_39154 = (state_39214[(19)]);
var inst_39155 = (state_39214[(9)]);
var inst_39156 = (state_39214[(20)]);
var inst_39168 = (state_39214[(2)]);
var inst_39169 = (inst_39157 + (1));
var tmp39267 = inst_39156;
var tmp39268 = inst_39154;
var tmp39269 = inst_39155;
var inst_39154__$1 = tmp39268;
var inst_39155__$1 = tmp39269;
var inst_39156__$1 = tmp39267;
var inst_39157__$1 = inst_39169;
var state_39214__$1 = (function (){var statearr_39277 = state_39214;
(statearr_39277[(21)] = inst_39168);

(statearr_39277[(19)] = inst_39154__$1);

(statearr_39277[(9)] = inst_39155__$1);

(statearr_39277[(20)] = inst_39156__$1);

(statearr_39277[(10)] = inst_39157__$1);

return statearr_39277;
})();
var statearr_39294_41330 = state_39214__$1;
(statearr_39294_41330[(2)] = null);

(statearr_39294_41330[(1)] = (25));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (40))){
var inst_39183 = (state_39214[(22)]);
var inst_39187 = m.cljs$core$async$Mult$untap_STAR_$arity$2(null,inst_39183);
var state_39214__$1 = state_39214;
var statearr_39299_41331 = state_39214__$1;
(statearr_39299_41331[(2)] = inst_39187);

(statearr_39299_41331[(1)] = (41));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (33))){
var inst_39172 = (state_39214[(23)]);
var inst_39174 = cljs.core.chunked_seq_QMARK_(inst_39172);
var state_39214__$1 = state_39214;
if(inst_39174){
var statearr_39304_41332 = state_39214__$1;
(statearr_39304_41332[(1)] = (36));

} else {
var statearr_39305_41333 = state_39214__$1;
(statearr_39305_41333[(1)] = (37));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (13))){
var inst_39098 = (state_39214[(24)]);
var inst_39101 = cljs.core.async.close_BANG_(inst_39098);
var state_39214__$1 = state_39214;
var statearr_39309_41334 = state_39214__$1;
(statearr_39309_41334[(2)] = inst_39101);

(statearr_39309_41334[(1)] = (15));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (22))){
var inst_39124 = (state_39214[(8)]);
var inst_39129 = cljs.core.async.close_BANG_(inst_39124);
var state_39214__$1 = state_39214;
var statearr_39311_41335 = state_39214__$1;
(statearr_39311_41335[(2)] = inst_39129);

(statearr_39311_41335[(1)] = (24));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (36))){
var inst_39172 = (state_39214[(23)]);
var inst_39177 = cljs.core.chunk_first(inst_39172);
var inst_39179 = cljs.core.chunk_rest(inst_39172);
var inst_39180 = cljs.core.count(inst_39177);
var inst_39154 = inst_39179;
var inst_39155 = inst_39177;
var inst_39156 = inst_39180;
var inst_39157 = (0);
var state_39214__$1 = (function (){var statearr_39321 = state_39214;
(statearr_39321[(19)] = inst_39154);

(statearr_39321[(9)] = inst_39155);

(statearr_39321[(20)] = inst_39156);

(statearr_39321[(10)] = inst_39157);

return statearr_39321;
})();
var statearr_39326_41336 = state_39214__$1;
(statearr_39326_41336[(2)] = null);

(statearr_39326_41336[(1)] = (25));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (41))){
var inst_39172 = (state_39214[(23)]);
var inst_39189 = (state_39214[(2)]);
var inst_39190 = cljs.core.next(inst_39172);
var inst_39154 = inst_39190;
var inst_39155 = null;
var inst_39156 = (0);
var inst_39157 = (0);
var state_39214__$1 = (function (){var statearr_39335 = state_39214;
(statearr_39335[(25)] = inst_39189);

(statearr_39335[(19)] = inst_39154);

(statearr_39335[(9)] = inst_39155);

(statearr_39335[(20)] = inst_39156);

(statearr_39335[(10)] = inst_39157);

return statearr_39335;
})();
var statearr_39338_41337 = state_39214__$1;
(statearr_39338_41337[(2)] = null);

(statearr_39338_41337[(1)] = (25));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (43))){
var state_39214__$1 = state_39214;
var statearr_39340_41338 = state_39214__$1;
(statearr_39340_41338[(2)] = null);

(statearr_39340_41338[(1)] = (44));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (29))){
var inst_39198 = (state_39214[(2)]);
var state_39214__$1 = state_39214;
var statearr_39343_41339 = state_39214__$1;
(statearr_39343_41339[(2)] = inst_39198);

(statearr_39343_41339[(1)] = (26));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (44))){
var inst_39207 = (state_39214[(2)]);
var state_39214__$1 = (function (){var statearr_39346 = state_39214;
(statearr_39346[(26)] = inst_39207);

return statearr_39346;
})();
var statearr_39347_41342 = state_39214__$1;
(statearr_39347_41342[(2)] = null);

(statearr_39347_41342[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (6))){
var inst_39146 = (state_39214[(27)]);
var inst_39145 = cljs.core.deref(cs);
var inst_39146__$1 = cljs.core.keys(inst_39145);
var inst_39147 = cljs.core.count(inst_39146__$1);
var inst_39148 = cljs.core.reset_BANG_(dctr,inst_39147);
var inst_39153 = cljs.core.seq(inst_39146__$1);
var inst_39154 = inst_39153;
var inst_39155 = null;
var inst_39156 = (0);
var inst_39157 = (0);
var state_39214__$1 = (function (){var statearr_39353 = state_39214;
(statearr_39353[(27)] = inst_39146__$1);

(statearr_39353[(28)] = inst_39148);

(statearr_39353[(19)] = inst_39154);

(statearr_39353[(9)] = inst_39155);

(statearr_39353[(20)] = inst_39156);

(statearr_39353[(10)] = inst_39157);

return statearr_39353;
})();
var statearr_39357_41343 = state_39214__$1;
(statearr_39357_41343[(2)] = null);

(statearr_39357_41343[(1)] = (25));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (28))){
var inst_39154 = (state_39214[(19)]);
var inst_39172 = (state_39214[(23)]);
var inst_39172__$1 = cljs.core.seq(inst_39154);
var state_39214__$1 = (function (){var statearr_39358 = state_39214;
(statearr_39358[(23)] = inst_39172__$1);

return statearr_39358;
})();
if(inst_39172__$1){
var statearr_39359_41344 = state_39214__$1;
(statearr_39359_41344[(1)] = (33));

} else {
var statearr_39360_41345 = state_39214__$1;
(statearr_39360_41345[(1)] = (34));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (25))){
var inst_39157 = (state_39214[(10)]);
var inst_39156 = (state_39214[(20)]);
var inst_39159 = (inst_39157 < inst_39156);
var inst_39160 = inst_39159;
var state_39214__$1 = state_39214;
if(cljs.core.truth_(inst_39160)){
var statearr_39362_41348 = state_39214__$1;
(statearr_39362_41348[(1)] = (27));

} else {
var statearr_39363_41349 = state_39214__$1;
(statearr_39363_41349[(1)] = (28));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (34))){
var state_39214__$1 = state_39214;
var statearr_39367_41350 = state_39214__$1;
(statearr_39367_41350[(2)] = null);

(statearr_39367_41350[(1)] = (35));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (17))){
var state_39214__$1 = state_39214;
var statearr_39372_41352 = state_39214__$1;
(statearr_39372_41352[(2)] = null);

(statearr_39372_41352[(1)] = (18));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (3))){
var inst_39212 = (state_39214[(2)]);
var state_39214__$1 = state_39214;
return cljs.core.async.impl.ioc_helpers.return_chan(state_39214__$1,inst_39212);
} else {
if((state_val_39215 === (12))){
var inst_39141 = (state_39214[(2)]);
var state_39214__$1 = state_39214;
var statearr_39382_41353 = state_39214__$1;
(statearr_39382_41353[(2)] = inst_39141);

(statearr_39382_41353[(1)] = (9));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (2))){
var state_39214__$1 = state_39214;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_39214__$1,(4),ch);
} else {
if((state_val_39215 === (23))){
var state_39214__$1 = state_39214;
var statearr_39386_41355 = state_39214__$1;
(statearr_39386_41355[(2)] = null);

(statearr_39386_41355[(1)] = (24));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (35))){
var inst_39196 = (state_39214[(2)]);
var state_39214__$1 = state_39214;
var statearr_39391_41356 = state_39214__$1;
(statearr_39391_41356[(2)] = inst_39196);

(statearr_39391_41356[(1)] = (29));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (19))){
var inst_39109 = (state_39214[(7)]);
var inst_39115 = cljs.core.chunk_first(inst_39109);
var inst_39116 = cljs.core.chunk_rest(inst_39109);
var inst_39117 = cljs.core.count(inst_39115);
var inst_39086 = inst_39116;
var inst_39087 = inst_39115;
var inst_39088 = inst_39117;
var inst_39089 = (0);
var state_39214__$1 = (function (){var statearr_39396 = state_39214;
(statearr_39396[(14)] = inst_39086);

(statearr_39396[(15)] = inst_39087);

(statearr_39396[(16)] = inst_39088);

(statearr_39396[(17)] = inst_39089);

return statearr_39396;
})();
var statearr_39398_41357 = state_39214__$1;
(statearr_39398_41357[(2)] = null);

(statearr_39398_41357[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (11))){
var inst_39086 = (state_39214[(14)]);
var inst_39109 = (state_39214[(7)]);
var inst_39109__$1 = cljs.core.seq(inst_39086);
var state_39214__$1 = (function (){var statearr_39402 = state_39214;
(statearr_39402[(7)] = inst_39109__$1);

return statearr_39402;
})();
if(inst_39109__$1){
var statearr_39403_41358 = state_39214__$1;
(statearr_39403_41358[(1)] = (16));

} else {
var statearr_39405_41359 = state_39214__$1;
(statearr_39405_41359[(1)] = (17));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (9))){
var inst_39143 = (state_39214[(2)]);
var state_39214__$1 = state_39214;
var statearr_39408_41360 = state_39214__$1;
(statearr_39408_41360[(2)] = inst_39143);

(statearr_39408_41360[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (5))){
var inst_39084 = cljs.core.deref(cs);
var inst_39085 = cljs.core.seq(inst_39084);
var inst_39086 = inst_39085;
var inst_39087 = null;
var inst_39088 = (0);
var inst_39089 = (0);
var state_39214__$1 = (function (){var statearr_39413 = state_39214;
(statearr_39413[(14)] = inst_39086);

(statearr_39413[(15)] = inst_39087);

(statearr_39413[(16)] = inst_39088);

(statearr_39413[(17)] = inst_39089);

return statearr_39413;
})();
var statearr_39415_41361 = state_39214__$1;
(statearr_39415_41361[(2)] = null);

(statearr_39415_41361[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (14))){
var state_39214__$1 = state_39214;
var statearr_39417_41362 = state_39214__$1;
(statearr_39417_41362[(2)] = null);

(statearr_39417_41362[(1)] = (15));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (45))){
var inst_39204 = (state_39214[(2)]);
var state_39214__$1 = state_39214;
var statearr_39421_41363 = state_39214__$1;
(statearr_39421_41363[(2)] = inst_39204);

(statearr_39421_41363[(1)] = (44));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (26))){
var inst_39146 = (state_39214[(27)]);
var inst_39200 = (state_39214[(2)]);
var inst_39201 = cljs.core.seq(inst_39146);
var state_39214__$1 = (function (){var statearr_39423 = state_39214;
(statearr_39423[(29)] = inst_39200);

return statearr_39423;
})();
if(inst_39201){
var statearr_39424_41364 = state_39214__$1;
(statearr_39424_41364[(1)] = (42));

} else {
var statearr_39427_41365 = state_39214__$1;
(statearr_39427_41365[(1)] = (43));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (16))){
var inst_39109 = (state_39214[(7)]);
var inst_39112 = cljs.core.chunked_seq_QMARK_(inst_39109);
var state_39214__$1 = state_39214;
if(inst_39112){
var statearr_39429_41373 = state_39214__$1;
(statearr_39429_41373[(1)] = (19));

} else {
var statearr_39431_41374 = state_39214__$1;
(statearr_39431_41374[(1)] = (20));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (38))){
var inst_39193 = (state_39214[(2)]);
var state_39214__$1 = state_39214;
var statearr_39435_41375 = state_39214__$1;
(statearr_39435_41375[(2)] = inst_39193);

(statearr_39435_41375[(1)] = (35));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (30))){
var state_39214__$1 = state_39214;
var statearr_39437_41376 = state_39214__$1;
(statearr_39437_41376[(2)] = null);

(statearr_39437_41376[(1)] = (32));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (10))){
var inst_39087 = (state_39214[(15)]);
var inst_39089 = (state_39214[(17)]);
var inst_39097 = cljs.core._nth(inst_39087,inst_39089);
var inst_39098 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_39097,(0),null);
var inst_39099 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_39097,(1),null);
var state_39214__$1 = (function (){var statearr_39441 = state_39214;
(statearr_39441[(24)] = inst_39098);

return statearr_39441;
})();
if(cljs.core.truth_(inst_39099)){
var statearr_39442_41380 = state_39214__$1;
(statearr_39442_41380[(1)] = (13));

} else {
var statearr_39443_41381 = state_39214__$1;
(statearr_39443_41381[(1)] = (14));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (18))){
var inst_39139 = (state_39214[(2)]);
var state_39214__$1 = state_39214;
var statearr_39444_41382 = state_39214__$1;
(statearr_39444_41382[(2)] = inst_39139);

(statearr_39444_41382[(1)] = (12));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (42))){
var state_39214__$1 = state_39214;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_39214__$1,(45),dchan);
} else {
if((state_val_39215 === (37))){
var inst_39172 = (state_39214[(23)]);
var inst_39183 = (state_39214[(22)]);
var inst_39077 = (state_39214[(12)]);
var inst_39183__$1 = cljs.core.first(inst_39172);
var inst_39184 = cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$3(inst_39183__$1,inst_39077,done);
var state_39214__$1 = (function (){var statearr_39449 = state_39214;
(statearr_39449[(22)] = inst_39183__$1);

return statearr_39449;
})();
if(cljs.core.truth_(inst_39184)){
var statearr_39450_41385 = state_39214__$1;
(statearr_39450_41385[(1)] = (39));

} else {
var statearr_39451_41386 = state_39214__$1;
(statearr_39451_41386[(1)] = (40));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39215 === (8))){
var inst_39089 = (state_39214[(17)]);
var inst_39088 = (state_39214[(16)]);
var inst_39091 = (inst_39089 < inst_39088);
var inst_39092 = inst_39091;
var state_39214__$1 = state_39214;
if(cljs.core.truth_(inst_39092)){
var statearr_39453_41387 = state_39214__$1;
(statearr_39453_41387[(1)] = (10));

} else {
var statearr_39454_41388 = state_39214__$1;
(statearr_39454_41388[(1)] = (11));

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
var cljs$core$async$mult_$_state_machine__37085__auto__ = null;
var cljs$core$async$mult_$_state_machine__37085__auto____0 = (function (){
var statearr_39458 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_39458[(0)] = cljs$core$async$mult_$_state_machine__37085__auto__);

(statearr_39458[(1)] = (1));

return statearr_39458;
});
var cljs$core$async$mult_$_state_machine__37085__auto____1 = (function (state_39214){
while(true){
var ret_value__37086__auto__ = (function (){try{while(true){
var result__37087__auto__ = switch__37084__auto__(state_39214);
if(cljs.core.keyword_identical_QMARK_(result__37087__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__37087__auto__;
}
break;
}
}catch (e39459){var ex__37088__auto__ = e39459;
var statearr_39460_41389 = state_39214;
(statearr_39460_41389[(2)] = ex__37088__auto__);


if(cljs.core.seq((state_39214[(4)]))){
var statearr_39462_41393 = state_39214;
(statearr_39462_41393[(1)] = cljs.core.first((state_39214[(4)])));

} else {
throw ex__37088__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__37086__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__41394 = state_39214;
state_39214 = G__41394;
continue;
} else {
return ret_value__37086__auto__;
}
break;
}
});
cljs$core$async$mult_$_state_machine__37085__auto__ = function(state_39214){
switch(arguments.length){
case 0:
return cljs$core$async$mult_$_state_machine__37085__auto____0.call(this);
case 1:
return cljs$core$async$mult_$_state_machine__37085__auto____1.call(this,state_39214);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$mult_$_state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$mult_$_state_machine__37085__auto____0;
cljs$core$async$mult_$_state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$mult_$_state_machine__37085__auto____1;
return cljs$core$async$mult_$_state_machine__37085__auto__;
})()
})();
var state__37596__auto__ = (function (){var statearr_39463 = f__37595__auto__();
(statearr_39463[(6)] = c__37594__auto___41304);

return statearr_39463;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__37596__auto__);
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
var G__39468 = arguments.length;
switch (G__39468) {
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

var cljs$core$async$Mix$admix_STAR_$dyn_41400 = (function (m,ch){
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
return cljs$core$async$Mix$admix_STAR_$dyn_41400(m,ch);
}
});

var cljs$core$async$Mix$unmix_STAR_$dyn_41405 = (function (m,ch){
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
return cljs$core$async$Mix$unmix_STAR_$dyn_41405(m,ch);
}
});

var cljs$core$async$Mix$unmix_all_STAR_$dyn_41409 = (function (m){
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
return cljs$core$async$Mix$unmix_all_STAR_$dyn_41409(m);
}
});

var cljs$core$async$Mix$toggle_STAR_$dyn_41410 = (function (m,state_map){
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
return cljs$core$async$Mix$toggle_STAR_$dyn_41410(m,state_map);
}
});

var cljs$core$async$Mix$solo_mode_STAR_$dyn_41414 = (function (m,mode){
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
return cljs$core$async$Mix$solo_mode_STAR_$dyn_41414(m,mode);
}
});

cljs.core.async.ioc_alts_BANG_ = (function cljs$core$async$ioc_alts_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___41416 = arguments.length;
var i__5727__auto___41417 = (0);
while(true){
if((i__5727__auto___41417 < len__5726__auto___41416)){
args__5732__auto__.push((arguments[i__5727__auto___41417]));

var G__41418 = (i__5727__auto___41417 + (1));
i__5727__auto___41417 = G__41418;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((3) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((3)),(0),null)):null);
return cljs.core.async.ioc_alts_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),argseq__5733__auto__);
});

(cljs.core.async.ioc_alts_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (state,cont_block,ports,p__39483){
var map__39484 = p__39483;
var map__39484__$1 = cljs.core.__destructure_map(map__39484);
var opts = map__39484__$1;
var statearr_39485_41420 = state;
(statearr_39485_41420[(1)] = cont_block);


var temp__5804__auto__ = cljs.core.async.do_alts((function (val){
var statearr_39486_41422 = state;
(statearr_39486_41422[(2)] = val);


return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state);
}),ports,opts);
if(cljs.core.truth_(temp__5804__auto__)){
var cb = temp__5804__auto__;
var statearr_39487_41423 = state;
(statearr_39487_41423[(2)] = cljs.core.deref(cb));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}));

(cljs.core.async.ioc_alts_BANG_.cljs$lang$maxFixedArity = (3));

/** @this {Function} */
(cljs.core.async.ioc_alts_BANG_.cljs$lang$applyTo = (function (seq39478){
var G__39479 = cljs.core.first(seq39478);
var seq39478__$1 = cljs.core.next(seq39478);
var G__39480 = cljs.core.first(seq39478__$1);
var seq39478__$2 = cljs.core.next(seq39478__$1);
var G__39481 = cljs.core.first(seq39478__$2);
var seq39478__$3 = cljs.core.next(seq39478__$2);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__39479,G__39480,G__39481,seq39478__$3);
}));


/**
* @constructor
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.async.Mix}
 * @implements {cljs.core.async.Mux}
 * @implements {cljs.core.IWithMeta}
*/
cljs.core.async.t_cljs$core$async39492 = (function (change,solo_mode,pick,cs,calc_state,out,changed,solo_modes,attrs,meta39493){
this.change = change;
this.solo_mode = solo_mode;
this.pick = pick;
this.cs = cs;
this.calc_state = calc_state;
this.out = out;
this.changed = changed;
this.solo_modes = solo_modes;
this.attrs = attrs;
this.meta39493 = meta39493;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async39492.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_39494,meta39493__$1){
var self__ = this;
var _39494__$1 = this;
return (new cljs.core.async.t_cljs$core$async39492(self__.change,self__.solo_mode,self__.pick,self__.cs,self__.calc_state,self__.out,self__.changed,self__.solo_modes,self__.attrs,meta39493__$1));
}));

(cljs.core.async.t_cljs$core$async39492.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_39494){
var self__ = this;
var _39494__$1 = this;
return self__.meta39493;
}));

(cljs.core.async.t_cljs$core$async39492.prototype.cljs$core$async$Mux$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async39492.prototype.cljs$core$async$Mux$muxch_STAR_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return self__.out;
}));

(cljs.core.async.t_cljs$core$async39492.prototype.cljs$core$async$Mix$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async39492.prototype.cljs$core$async$Mix$admix_STAR_$arity$2 = (function (_,ch){
var self__ = this;
var ___$1 = this;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(self__.cs,cljs.core.assoc,ch,cljs.core.PersistentArrayMap.EMPTY);

return (self__.changed.cljs$core$IFn$_invoke$arity$0 ? self__.changed.cljs$core$IFn$_invoke$arity$0() : self__.changed.call(null));
}));

(cljs.core.async.t_cljs$core$async39492.prototype.cljs$core$async$Mix$unmix_STAR_$arity$2 = (function (_,ch){
var self__ = this;
var ___$1 = this;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(self__.cs,cljs.core.dissoc,ch);

return (self__.changed.cljs$core$IFn$_invoke$arity$0 ? self__.changed.cljs$core$IFn$_invoke$arity$0() : self__.changed.call(null));
}));

(cljs.core.async.t_cljs$core$async39492.prototype.cljs$core$async$Mix$unmix_all_STAR_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
cljs.core.reset_BANG_(self__.cs,cljs.core.PersistentArrayMap.EMPTY);

return (self__.changed.cljs$core$IFn$_invoke$arity$0 ? self__.changed.cljs$core$IFn$_invoke$arity$0() : self__.changed.call(null));
}));

(cljs.core.async.t_cljs$core$async39492.prototype.cljs$core$async$Mix$toggle_STAR_$arity$2 = (function (_,state_map){
var self__ = this;
var ___$1 = this;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(self__.cs,cljs.core.partial.cljs$core$IFn$_invoke$arity$2(cljs.core.merge_with,cljs.core.merge),state_map);

return (self__.changed.cljs$core$IFn$_invoke$arity$0 ? self__.changed.cljs$core$IFn$_invoke$arity$0() : self__.changed.call(null));
}));

(cljs.core.async.t_cljs$core$async39492.prototype.cljs$core$async$Mix$solo_mode_STAR_$arity$2 = (function (_,mode){
var self__ = this;
var ___$1 = this;
if(cljs.core.truth_((self__.solo_modes.cljs$core$IFn$_invoke$arity$1 ? self__.solo_modes.cljs$core$IFn$_invoke$arity$1(mode) : self__.solo_modes.call(null,mode)))){
} else {
throw (new Error(["Assert failed: ",["mode must be one of: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(self__.solo_modes)].join(''),"\n","(solo-modes mode)"].join('')));
}

cljs.core.reset_BANG_(self__.solo_mode,mode);

return (self__.changed.cljs$core$IFn$_invoke$arity$0 ? self__.changed.cljs$core$IFn$_invoke$arity$0() : self__.changed.call(null));
}));

(cljs.core.async.t_cljs$core$async39492.getBasis = (function (){
return new cljs.core.PersistentVector(null, 10, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"change","change",477485025,null),new cljs.core.Symbol(null,"solo-mode","solo-mode",2031788074,null),new cljs.core.Symbol(null,"pick","pick",1300068175,null),new cljs.core.Symbol(null,"cs","cs",-117024463,null),new cljs.core.Symbol(null,"calc-state","calc-state",-349968968,null),new cljs.core.Symbol(null,"out","out",729986010,null),new cljs.core.Symbol(null,"changed","changed",-2083710852,null),new cljs.core.Symbol(null,"solo-modes","solo-modes",882180540,null),new cljs.core.Symbol(null,"attrs","attrs",-450137186,null),new cljs.core.Symbol(null,"meta39493","meta39493",1980813504,null)], null);
}));

(cljs.core.async.t_cljs$core$async39492.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async39492.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async39492");

(cljs.core.async.t_cljs$core$async39492.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async39492");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async39492.
 */
cljs.core.async.__GT_t_cljs$core$async39492 = (function cljs$core$async$__GT_t_cljs$core$async39492(change,solo_mode,pick,cs,calc_state,out,changed,solo_modes,attrs,meta39493){
return (new cljs.core.async.t_cljs$core$async39492(change,solo_mode,pick,cs,calc_state,out,changed,solo_modes,attrs,meta39493));
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
var m = (new cljs.core.async.t_cljs$core$async39492(change,solo_mode,pick,cs,calc_state,out,changed,solo_modes,attrs,cljs.core.PersistentArrayMap.EMPTY));
var c__37594__auto___41431 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__37595__auto__ = (function (){var switch__37084__auto__ = (function (state_39568){
var state_val_39569 = (state_39568[(1)]);
if((state_val_39569 === (7))){
var inst_39524 = (state_39568[(2)]);
var state_39568__$1 = state_39568;
if(cljs.core.truth_(inst_39524)){
var statearr_39570_41432 = state_39568__$1;
(statearr_39570_41432[(1)] = (8));

} else {
var statearr_39571_41435 = state_39568__$1;
(statearr_39571_41435[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39569 === (20))){
var inst_39517 = (state_39568[(7)]);
var state_39568__$1 = state_39568;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_39568__$1,(23),out,inst_39517);
} else {
if((state_val_39569 === (1))){
var inst_39500 = calc_state();
var inst_39501 = cljs.core.__destructure_map(inst_39500);
var inst_39502 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_39501,new cljs.core.Keyword(null,"solos","solos",1441458643));
var inst_39503 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_39501,new cljs.core.Keyword(null,"mutes","mutes",1068806309));
var inst_39504 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_39501,new cljs.core.Keyword(null,"reads","reads",-1215067361));
var inst_39505 = inst_39500;
var state_39568__$1 = (function (){var statearr_39572 = state_39568;
(statearr_39572[(8)] = inst_39502);

(statearr_39572[(9)] = inst_39503);

(statearr_39572[(10)] = inst_39504);

(statearr_39572[(11)] = inst_39505);

return statearr_39572;
})();
var statearr_39573_41436 = state_39568__$1;
(statearr_39573_41436[(2)] = null);

(statearr_39573_41436[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39569 === (24))){
var inst_39508 = (state_39568[(12)]);
var inst_39505 = inst_39508;
var state_39568__$1 = (function (){var statearr_39575 = state_39568;
(statearr_39575[(11)] = inst_39505);

return statearr_39575;
})();
var statearr_39577_41438 = state_39568__$1;
(statearr_39577_41438[(2)] = null);

(statearr_39577_41438[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39569 === (4))){
var inst_39517 = (state_39568[(7)]);
var inst_39519 = (state_39568[(13)]);
var inst_39516 = (state_39568[(2)]);
var inst_39517__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_39516,(0),null);
var inst_39518 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_39516,(1),null);
var inst_39519__$1 = (inst_39517__$1 == null);
var state_39568__$1 = (function (){var statearr_39578 = state_39568;
(statearr_39578[(7)] = inst_39517__$1);

(statearr_39578[(14)] = inst_39518);

(statearr_39578[(13)] = inst_39519__$1);

return statearr_39578;
})();
if(cljs.core.truth_(inst_39519__$1)){
var statearr_39579_41440 = state_39568__$1;
(statearr_39579_41440[(1)] = (5));

} else {
var statearr_39580_41441 = state_39568__$1;
(statearr_39580_41441[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39569 === (15))){
var inst_39509 = (state_39568[(15)]);
var inst_39538 = (state_39568[(16)]);
var inst_39538__$1 = cljs.core.empty_QMARK_(inst_39509);
var state_39568__$1 = (function (){var statearr_39581 = state_39568;
(statearr_39581[(16)] = inst_39538__$1);

return statearr_39581;
})();
if(inst_39538__$1){
var statearr_39582_41442 = state_39568__$1;
(statearr_39582_41442[(1)] = (17));

} else {
var statearr_39583_41443 = state_39568__$1;
(statearr_39583_41443[(1)] = (18));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39569 === (21))){
var inst_39508 = (state_39568[(12)]);
var inst_39505 = inst_39508;
var state_39568__$1 = (function (){var statearr_39584 = state_39568;
(statearr_39584[(11)] = inst_39505);

return statearr_39584;
})();
var statearr_39585_41444 = state_39568__$1;
(statearr_39585_41444[(2)] = null);

(statearr_39585_41444[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39569 === (13))){
var inst_39531 = (state_39568[(2)]);
var inst_39532 = calc_state();
var inst_39505 = inst_39532;
var state_39568__$1 = (function (){var statearr_39586 = state_39568;
(statearr_39586[(17)] = inst_39531);

(statearr_39586[(11)] = inst_39505);

return statearr_39586;
})();
var statearr_39587_41445 = state_39568__$1;
(statearr_39587_41445[(2)] = null);

(statearr_39587_41445[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39569 === (22))){
var inst_39560 = (state_39568[(2)]);
var state_39568__$1 = state_39568;
var statearr_39588_41446 = state_39568__$1;
(statearr_39588_41446[(2)] = inst_39560);

(statearr_39588_41446[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39569 === (6))){
var inst_39518 = (state_39568[(14)]);
var inst_39522 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_39518,change);
var state_39568__$1 = state_39568;
var statearr_39590_41447 = state_39568__$1;
(statearr_39590_41447[(2)] = inst_39522);

(statearr_39590_41447[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39569 === (25))){
var state_39568__$1 = state_39568;
var statearr_39592_41448 = state_39568__$1;
(statearr_39592_41448[(2)] = null);

(statearr_39592_41448[(1)] = (26));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39569 === (17))){
var inst_39510 = (state_39568[(18)]);
var inst_39518 = (state_39568[(14)]);
var inst_39541 = (inst_39510.cljs$core$IFn$_invoke$arity$1 ? inst_39510.cljs$core$IFn$_invoke$arity$1(inst_39518) : inst_39510.call(null,inst_39518));
var inst_39542 = cljs.core.not(inst_39541);
var state_39568__$1 = state_39568;
var statearr_39593_41449 = state_39568__$1;
(statearr_39593_41449[(2)] = inst_39542);

(statearr_39593_41449[(1)] = (19));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39569 === (3))){
var inst_39565 = (state_39568[(2)]);
var state_39568__$1 = state_39568;
return cljs.core.async.impl.ioc_helpers.return_chan(state_39568__$1,inst_39565);
} else {
if((state_val_39569 === (12))){
var state_39568__$1 = state_39568;
var statearr_39675_41451 = state_39568__$1;
(statearr_39675_41451[(2)] = null);

(statearr_39675_41451[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39569 === (2))){
var inst_39505 = (state_39568[(11)]);
var inst_39508 = (state_39568[(12)]);
var inst_39508__$1 = cljs.core.__destructure_map(inst_39505);
var inst_39509 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_39508__$1,new cljs.core.Keyword(null,"solos","solos",1441458643));
var inst_39510 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_39508__$1,new cljs.core.Keyword(null,"mutes","mutes",1068806309));
var inst_39511 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_39508__$1,new cljs.core.Keyword(null,"reads","reads",-1215067361));
var state_39568__$1 = (function (){var statearr_39683 = state_39568;
(statearr_39683[(12)] = inst_39508__$1);

(statearr_39683[(15)] = inst_39509);

(statearr_39683[(18)] = inst_39510);

return statearr_39683;
})();
return cljs.core.async.ioc_alts_BANG_(state_39568__$1,(4),inst_39511);
} else {
if((state_val_39569 === (23))){
var inst_39550 = (state_39568[(2)]);
var state_39568__$1 = state_39568;
if(cljs.core.truth_(inst_39550)){
var statearr_39686_41452 = state_39568__$1;
(statearr_39686_41452[(1)] = (24));

} else {
var statearr_39687_41453 = state_39568__$1;
(statearr_39687_41453[(1)] = (25));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39569 === (19))){
var inst_39545 = (state_39568[(2)]);
var state_39568__$1 = state_39568;
var statearr_39692_41454 = state_39568__$1;
(statearr_39692_41454[(2)] = inst_39545);

(statearr_39692_41454[(1)] = (16));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39569 === (11))){
var inst_39518 = (state_39568[(14)]);
var inst_39528 = cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(cs,cljs.core.dissoc,inst_39518);
var state_39568__$1 = state_39568;
var statearr_39714_41455 = state_39568__$1;
(statearr_39714_41455[(2)] = inst_39528);

(statearr_39714_41455[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39569 === (9))){
var inst_39509 = (state_39568[(15)]);
var inst_39518 = (state_39568[(14)]);
var inst_39535 = (state_39568[(19)]);
var inst_39535__$1 = (inst_39509.cljs$core$IFn$_invoke$arity$1 ? inst_39509.cljs$core$IFn$_invoke$arity$1(inst_39518) : inst_39509.call(null,inst_39518));
var state_39568__$1 = (function (){var statearr_39723 = state_39568;
(statearr_39723[(19)] = inst_39535__$1);

return statearr_39723;
})();
if(cljs.core.truth_(inst_39535__$1)){
var statearr_39724_41456 = state_39568__$1;
(statearr_39724_41456[(1)] = (14));

} else {
var statearr_39725_41457 = state_39568__$1;
(statearr_39725_41457[(1)] = (15));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39569 === (5))){
var inst_39519 = (state_39568[(13)]);
var state_39568__$1 = state_39568;
var statearr_39728_41458 = state_39568__$1;
(statearr_39728_41458[(2)] = inst_39519);

(statearr_39728_41458[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39569 === (14))){
var inst_39535 = (state_39568[(19)]);
var state_39568__$1 = state_39568;
var statearr_39729_41459 = state_39568__$1;
(statearr_39729_41459[(2)] = inst_39535);

(statearr_39729_41459[(1)] = (16));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39569 === (26))){
var inst_39556 = (state_39568[(2)]);
var state_39568__$1 = state_39568;
var statearr_39737_41460 = state_39568__$1;
(statearr_39737_41460[(2)] = inst_39556);

(statearr_39737_41460[(1)] = (22));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39569 === (16))){
var inst_39547 = (state_39568[(2)]);
var state_39568__$1 = state_39568;
if(cljs.core.truth_(inst_39547)){
var statearr_39739_41461 = state_39568__$1;
(statearr_39739_41461[(1)] = (20));

} else {
var statearr_39740_41462 = state_39568__$1;
(statearr_39740_41462[(1)] = (21));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39569 === (10))){
var inst_39562 = (state_39568[(2)]);
var state_39568__$1 = state_39568;
var statearr_39741_41463 = state_39568__$1;
(statearr_39741_41463[(2)] = inst_39562);

(statearr_39741_41463[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39569 === (18))){
var inst_39538 = (state_39568[(16)]);
var state_39568__$1 = state_39568;
var statearr_39743_41464 = state_39568__$1;
(statearr_39743_41464[(2)] = inst_39538);

(statearr_39743_41464[(1)] = (19));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39569 === (8))){
var inst_39517 = (state_39568[(7)]);
var inst_39526 = (inst_39517 == null);
var state_39568__$1 = state_39568;
if(cljs.core.truth_(inst_39526)){
var statearr_39744_41465 = state_39568__$1;
(statearr_39744_41465[(1)] = (11));

} else {
var statearr_39745_41466 = state_39568__$1;
(statearr_39745_41466[(1)] = (12));

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
var cljs$core$async$mix_$_state_machine__37085__auto__ = null;
var cljs$core$async$mix_$_state_machine__37085__auto____0 = (function (){
var statearr_39749 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_39749[(0)] = cljs$core$async$mix_$_state_machine__37085__auto__);

(statearr_39749[(1)] = (1));

return statearr_39749;
});
var cljs$core$async$mix_$_state_machine__37085__auto____1 = (function (state_39568){
while(true){
var ret_value__37086__auto__ = (function (){try{while(true){
var result__37087__auto__ = switch__37084__auto__(state_39568);
if(cljs.core.keyword_identical_QMARK_(result__37087__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__37087__auto__;
}
break;
}
}catch (e39752){var ex__37088__auto__ = e39752;
var statearr_39753_41467 = state_39568;
(statearr_39753_41467[(2)] = ex__37088__auto__);


if(cljs.core.seq((state_39568[(4)]))){
var statearr_39757_41468 = state_39568;
(statearr_39757_41468[(1)] = cljs.core.first((state_39568[(4)])));

} else {
throw ex__37088__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__37086__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__41470 = state_39568;
state_39568 = G__41470;
continue;
} else {
return ret_value__37086__auto__;
}
break;
}
});
cljs$core$async$mix_$_state_machine__37085__auto__ = function(state_39568){
switch(arguments.length){
case 0:
return cljs$core$async$mix_$_state_machine__37085__auto____0.call(this);
case 1:
return cljs$core$async$mix_$_state_machine__37085__auto____1.call(this,state_39568);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$mix_$_state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$mix_$_state_machine__37085__auto____0;
cljs$core$async$mix_$_state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$mix_$_state_machine__37085__auto____1;
return cljs$core$async$mix_$_state_machine__37085__auto__;
})()
})();
var state__37596__auto__ = (function (){var statearr_39760 = f__37595__auto__();
(statearr_39760[(6)] = c__37594__auto___41431);

return statearr_39760;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__37596__auto__);
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

var cljs$core$async$Pub$sub_STAR_$dyn_41472 = (function (p,v,ch,close_QMARK_){
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
return cljs$core$async$Pub$sub_STAR_$dyn_41472(p,v,ch,close_QMARK_);
}
});

var cljs$core$async$Pub$unsub_STAR_$dyn_41477 = (function (p,v,ch){
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
return cljs$core$async$Pub$unsub_STAR_$dyn_41477(p,v,ch);
}
});

var cljs$core$async$Pub$unsub_all_STAR_$dyn_41481 = (function() {
var G__41482 = null;
var G__41482__1 = (function (p){
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
var G__41482__2 = (function (p,v){
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
G__41482 = function(p,v){
switch(arguments.length){
case 1:
return G__41482__1.call(this,p);
case 2:
return G__41482__2.call(this,p,v);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__41482.cljs$core$IFn$_invoke$arity$1 = G__41482__1;
G__41482.cljs$core$IFn$_invoke$arity$2 = G__41482__2;
return G__41482;
})()
;
cljs.core.async.unsub_all_STAR_ = (function cljs$core$async$unsub_all_STAR_(var_args){
var G__39792 = arguments.length;
switch (G__39792) {
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
return cljs$core$async$Pub$unsub_all_STAR_$dyn_41481(p);
}
}));

(cljs.core.async.unsub_all_STAR_.cljs$core$IFn$_invoke$arity$2 = (function (p,v){
if((((!((p == null)))) && ((!((p.cljs$core$async$Pub$unsub_all_STAR_$arity$2 == null)))))){
return p.cljs$core$async$Pub$unsub_all_STAR_$arity$2(p,v);
} else {
return cljs$core$async$Pub$unsub_all_STAR_$dyn_41481(p,v);
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
cljs.core.async.t_cljs$core$async39810 = (function (ch,topic_fn,buf_fn,mults,ensure_mult,meta39811){
this.ch = ch;
this.topic_fn = topic_fn;
this.buf_fn = buf_fn;
this.mults = mults;
this.ensure_mult = ensure_mult;
this.meta39811 = meta39811;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async39810.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_39812,meta39811__$1){
var self__ = this;
var _39812__$1 = this;
return (new cljs.core.async.t_cljs$core$async39810(self__.ch,self__.topic_fn,self__.buf_fn,self__.mults,self__.ensure_mult,meta39811__$1));
}));

(cljs.core.async.t_cljs$core$async39810.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_39812){
var self__ = this;
var _39812__$1 = this;
return self__.meta39811;
}));

(cljs.core.async.t_cljs$core$async39810.prototype.cljs$core$async$Mux$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async39810.prototype.cljs$core$async$Mux$muxch_STAR_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return self__.ch;
}));

(cljs.core.async.t_cljs$core$async39810.prototype.cljs$core$async$Pub$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async39810.prototype.cljs$core$async$Pub$sub_STAR_$arity$4 = (function (p,topic,ch__$1,close_QMARK_){
var self__ = this;
var p__$1 = this;
var m = (self__.ensure_mult.cljs$core$IFn$_invoke$arity$1 ? self__.ensure_mult.cljs$core$IFn$_invoke$arity$1(topic) : self__.ensure_mult.call(null,topic));
return cljs.core.async.tap.cljs$core$IFn$_invoke$arity$3(m,ch__$1,close_QMARK_);
}));

(cljs.core.async.t_cljs$core$async39810.prototype.cljs$core$async$Pub$unsub_STAR_$arity$3 = (function (p,topic,ch__$1){
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

(cljs.core.async.t_cljs$core$async39810.prototype.cljs$core$async$Pub$unsub_all_STAR_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.reset_BANG_(self__.mults,cljs.core.PersistentArrayMap.EMPTY);
}));

(cljs.core.async.t_cljs$core$async39810.prototype.cljs$core$async$Pub$unsub_all_STAR_$arity$2 = (function (_,topic){
var self__ = this;
var ___$1 = this;
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(self__.mults,cljs.core.dissoc,topic);
}));

(cljs.core.async.t_cljs$core$async39810.getBasis = (function (){
return new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"ch","ch",1085813622,null),new cljs.core.Symbol(null,"topic-fn","topic-fn",-862449736,null),new cljs.core.Symbol(null,"buf-fn","buf-fn",-1200281591,null),new cljs.core.Symbol(null,"mults","mults",-461114485,null),new cljs.core.Symbol(null,"ensure-mult","ensure-mult",1796584816,null),new cljs.core.Symbol(null,"meta39811","meta39811",1393372095,null)], null);
}));

(cljs.core.async.t_cljs$core$async39810.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async39810.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async39810");

(cljs.core.async.t_cljs$core$async39810.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async39810");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async39810.
 */
cljs.core.async.__GT_t_cljs$core$async39810 = (function cljs$core$async$__GT_t_cljs$core$async39810(ch,topic_fn,buf_fn,mults,ensure_mult,meta39811){
return (new cljs.core.async.t_cljs$core$async39810(ch,topic_fn,buf_fn,mults,ensure_mult,meta39811));
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
var G__39801 = arguments.length;
switch (G__39801) {
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
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(mults,(function (p1__39798_SHARP_){
if(cljs.core.truth_((p1__39798_SHARP_.cljs$core$IFn$_invoke$arity$1 ? p1__39798_SHARP_.cljs$core$IFn$_invoke$arity$1(topic) : p1__39798_SHARP_.call(null,topic)))){
return p1__39798_SHARP_;
} else {
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__39798_SHARP_,topic,cljs.core.async.mult(cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((buf_fn.cljs$core$IFn$_invoke$arity$1 ? buf_fn.cljs$core$IFn$_invoke$arity$1(topic) : buf_fn.call(null,topic)))));
}
})),topic);
}
});
var p = (new cljs.core.async.t_cljs$core$async39810(ch,topic_fn,buf_fn,mults,ensure_mult,cljs.core.PersistentArrayMap.EMPTY));
var c__37594__auto___41500 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__37595__auto__ = (function (){var switch__37084__auto__ = (function (state_39903){
var state_val_39904 = (state_39903[(1)]);
if((state_val_39904 === (7))){
var inst_39898 = (state_39903[(2)]);
var state_39903__$1 = state_39903;
var statearr_39905_41502 = state_39903__$1;
(statearr_39905_41502[(2)] = inst_39898);

(statearr_39905_41502[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39904 === (20))){
var state_39903__$1 = state_39903;
var statearr_39906_41503 = state_39903__$1;
(statearr_39906_41503[(2)] = null);

(statearr_39906_41503[(1)] = (21));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39904 === (1))){
var state_39903__$1 = state_39903;
var statearr_39907_41504 = state_39903__$1;
(statearr_39907_41504[(2)] = null);

(statearr_39907_41504[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39904 === (24))){
var inst_39880 = (state_39903[(7)]);
var inst_39889 = cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(mults,cljs.core.dissoc,inst_39880);
var state_39903__$1 = state_39903;
var statearr_39908_41506 = state_39903__$1;
(statearr_39908_41506[(2)] = inst_39889);

(statearr_39908_41506[(1)] = (25));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39904 === (4))){
var inst_39832 = (state_39903[(8)]);
var inst_39832__$1 = (state_39903[(2)]);
var inst_39833 = (inst_39832__$1 == null);
var state_39903__$1 = (function (){var statearr_39909 = state_39903;
(statearr_39909[(8)] = inst_39832__$1);

return statearr_39909;
})();
if(cljs.core.truth_(inst_39833)){
var statearr_39910_41507 = state_39903__$1;
(statearr_39910_41507[(1)] = (5));

} else {
var statearr_39911_41508 = state_39903__$1;
(statearr_39911_41508[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39904 === (15))){
var inst_39874 = (state_39903[(2)]);
var state_39903__$1 = state_39903;
var statearr_39912_41509 = state_39903__$1;
(statearr_39912_41509[(2)] = inst_39874);

(statearr_39912_41509[(1)] = (12));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39904 === (21))){
var inst_39895 = (state_39903[(2)]);
var state_39903__$1 = (function (){var statearr_39913 = state_39903;
(statearr_39913[(9)] = inst_39895);

return statearr_39913;
})();
var statearr_39914_41510 = state_39903__$1;
(statearr_39914_41510[(2)] = null);

(statearr_39914_41510[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39904 === (13))){
var inst_39856 = (state_39903[(10)]);
var inst_39858 = cljs.core.chunked_seq_QMARK_(inst_39856);
var state_39903__$1 = state_39903;
if(inst_39858){
var statearr_39915_41511 = state_39903__$1;
(statearr_39915_41511[(1)] = (16));

} else {
var statearr_39916_41512 = state_39903__$1;
(statearr_39916_41512[(1)] = (17));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39904 === (22))){
var inst_39886 = (state_39903[(2)]);
var state_39903__$1 = state_39903;
if(cljs.core.truth_(inst_39886)){
var statearr_39918_41513 = state_39903__$1;
(statearr_39918_41513[(1)] = (23));

} else {
var statearr_39919_41514 = state_39903__$1;
(statearr_39919_41514[(1)] = (24));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39904 === (6))){
var inst_39832 = (state_39903[(8)]);
var inst_39880 = (state_39903[(7)]);
var inst_39882 = (state_39903[(11)]);
var inst_39880__$1 = (topic_fn.cljs$core$IFn$_invoke$arity$1 ? topic_fn.cljs$core$IFn$_invoke$arity$1(inst_39832) : topic_fn.call(null,inst_39832));
var inst_39881 = cljs.core.deref(mults);
var inst_39882__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_39881,inst_39880__$1);
var state_39903__$1 = (function (){var statearr_39920 = state_39903;
(statearr_39920[(7)] = inst_39880__$1);

(statearr_39920[(11)] = inst_39882__$1);

return statearr_39920;
})();
if(cljs.core.truth_(inst_39882__$1)){
var statearr_39921_41515 = state_39903__$1;
(statearr_39921_41515[(1)] = (19));

} else {
var statearr_39922_41516 = state_39903__$1;
(statearr_39922_41516[(1)] = (20));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39904 === (25))){
var inst_39891 = (state_39903[(2)]);
var state_39903__$1 = state_39903;
var statearr_39923_41517 = state_39903__$1;
(statearr_39923_41517[(2)] = inst_39891);

(statearr_39923_41517[(1)] = (21));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39904 === (17))){
var inst_39856 = (state_39903[(10)]);
var inst_39865 = cljs.core.first(inst_39856);
var inst_39866 = cljs.core.async.muxch_STAR_(inst_39865);
var inst_39867 = cljs.core.async.close_BANG_(inst_39866);
var inst_39868 = cljs.core.next(inst_39856);
var inst_39842 = inst_39868;
var inst_39843 = null;
var inst_39844 = (0);
var inst_39845 = (0);
var state_39903__$1 = (function (){var statearr_39924 = state_39903;
(statearr_39924[(12)] = inst_39867);

(statearr_39924[(13)] = inst_39842);

(statearr_39924[(14)] = inst_39843);

(statearr_39924[(15)] = inst_39844);

(statearr_39924[(16)] = inst_39845);

return statearr_39924;
})();
var statearr_39988_41520 = state_39903__$1;
(statearr_39988_41520[(2)] = null);

(statearr_39988_41520[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39904 === (3))){
var inst_39900 = (state_39903[(2)]);
var state_39903__$1 = state_39903;
return cljs.core.async.impl.ioc_helpers.return_chan(state_39903__$1,inst_39900);
} else {
if((state_val_39904 === (12))){
var inst_39876 = (state_39903[(2)]);
var state_39903__$1 = state_39903;
var statearr_39989_41521 = state_39903__$1;
(statearr_39989_41521[(2)] = inst_39876);

(statearr_39989_41521[(1)] = (9));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39904 === (2))){
var state_39903__$1 = state_39903;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_39903__$1,(4),ch);
} else {
if((state_val_39904 === (23))){
var state_39903__$1 = state_39903;
var statearr_39990_41522 = state_39903__$1;
(statearr_39990_41522[(2)] = null);

(statearr_39990_41522[(1)] = (25));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39904 === (19))){
var inst_39882 = (state_39903[(11)]);
var inst_39832 = (state_39903[(8)]);
var inst_39884 = cljs.core.async.muxch_STAR_(inst_39882);
var state_39903__$1 = state_39903;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_39903__$1,(22),inst_39884,inst_39832);
} else {
if((state_val_39904 === (11))){
var inst_39842 = (state_39903[(13)]);
var inst_39856 = (state_39903[(10)]);
var inst_39856__$1 = cljs.core.seq(inst_39842);
var state_39903__$1 = (function (){var statearr_39991 = state_39903;
(statearr_39991[(10)] = inst_39856__$1);

return statearr_39991;
})();
if(inst_39856__$1){
var statearr_39995_41523 = state_39903__$1;
(statearr_39995_41523[(1)] = (13));

} else {
var statearr_40000_41524 = state_39903__$1;
(statearr_40000_41524[(1)] = (14));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39904 === (9))){
var inst_39878 = (state_39903[(2)]);
var state_39903__$1 = state_39903;
var statearr_40007_41525 = state_39903__$1;
(statearr_40007_41525[(2)] = inst_39878);

(statearr_40007_41525[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39904 === (5))){
var inst_39839 = cljs.core.deref(mults);
var inst_39840 = cljs.core.vals(inst_39839);
var inst_39841 = cljs.core.seq(inst_39840);
var inst_39842 = inst_39841;
var inst_39843 = null;
var inst_39844 = (0);
var inst_39845 = (0);
var state_39903__$1 = (function (){var statearr_40014 = state_39903;
(statearr_40014[(13)] = inst_39842);

(statearr_40014[(14)] = inst_39843);

(statearr_40014[(15)] = inst_39844);

(statearr_40014[(16)] = inst_39845);

return statearr_40014;
})();
var statearr_40015_41527 = state_39903__$1;
(statearr_40015_41527[(2)] = null);

(statearr_40015_41527[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39904 === (14))){
var state_39903__$1 = state_39903;
var statearr_40019_41528 = state_39903__$1;
(statearr_40019_41528[(2)] = null);

(statearr_40019_41528[(1)] = (15));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39904 === (16))){
var inst_39856 = (state_39903[(10)]);
var inst_39860 = cljs.core.chunk_first(inst_39856);
var inst_39861 = cljs.core.chunk_rest(inst_39856);
var inst_39862 = cljs.core.count(inst_39860);
var inst_39842 = inst_39861;
var inst_39843 = inst_39860;
var inst_39844 = inst_39862;
var inst_39845 = (0);
var state_39903__$1 = (function (){var statearr_40020 = state_39903;
(statearr_40020[(13)] = inst_39842);

(statearr_40020[(14)] = inst_39843);

(statearr_40020[(15)] = inst_39844);

(statearr_40020[(16)] = inst_39845);

return statearr_40020;
})();
var statearr_40025_41531 = state_39903__$1;
(statearr_40025_41531[(2)] = null);

(statearr_40025_41531[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39904 === (10))){
var inst_39843 = (state_39903[(14)]);
var inst_39845 = (state_39903[(16)]);
var inst_39842 = (state_39903[(13)]);
var inst_39844 = (state_39903[(15)]);
var inst_39850 = cljs.core._nth(inst_39843,inst_39845);
var inst_39851 = cljs.core.async.muxch_STAR_(inst_39850);
var inst_39852 = cljs.core.async.close_BANG_(inst_39851);
var inst_39853 = (inst_39845 + (1));
var tmp40016 = inst_39842;
var tmp40017 = inst_39844;
var tmp40018 = inst_39843;
var inst_39842__$1 = tmp40016;
var inst_39843__$1 = tmp40018;
var inst_39844__$1 = tmp40017;
var inst_39845__$1 = inst_39853;
var state_39903__$1 = (function (){var statearr_40032 = state_39903;
(statearr_40032[(17)] = inst_39852);

(statearr_40032[(13)] = inst_39842__$1);

(statearr_40032[(14)] = inst_39843__$1);

(statearr_40032[(15)] = inst_39844__$1);

(statearr_40032[(16)] = inst_39845__$1);

return statearr_40032;
})();
var statearr_40033_41535 = state_39903__$1;
(statearr_40033_41535[(2)] = null);

(statearr_40033_41535[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39904 === (18))){
var inst_39871 = (state_39903[(2)]);
var state_39903__$1 = state_39903;
var statearr_40034_41536 = state_39903__$1;
(statearr_40034_41536[(2)] = inst_39871);

(statearr_40034_41536[(1)] = (15));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_39904 === (8))){
var inst_39845 = (state_39903[(16)]);
var inst_39844 = (state_39903[(15)]);
var inst_39847 = (inst_39845 < inst_39844);
var inst_39848 = inst_39847;
var state_39903__$1 = state_39903;
if(cljs.core.truth_(inst_39848)){
var statearr_40038_41537 = state_39903__$1;
(statearr_40038_41537[(1)] = (10));

} else {
var statearr_40039_41538 = state_39903__$1;
(statearr_40039_41538[(1)] = (11));

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
var cljs$core$async$state_machine__37085__auto__ = null;
var cljs$core$async$state_machine__37085__auto____0 = (function (){
var statearr_40040 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_40040[(0)] = cljs$core$async$state_machine__37085__auto__);

(statearr_40040[(1)] = (1));

return statearr_40040;
});
var cljs$core$async$state_machine__37085__auto____1 = (function (state_39903){
while(true){
var ret_value__37086__auto__ = (function (){try{while(true){
var result__37087__auto__ = switch__37084__auto__(state_39903);
if(cljs.core.keyword_identical_QMARK_(result__37087__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__37087__auto__;
}
break;
}
}catch (e40041){var ex__37088__auto__ = e40041;
var statearr_40042_41539 = state_39903;
(statearr_40042_41539[(2)] = ex__37088__auto__);


if(cljs.core.seq((state_39903[(4)]))){
var statearr_40043_41540 = state_39903;
(statearr_40043_41540[(1)] = cljs.core.first((state_39903[(4)])));

} else {
throw ex__37088__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__37086__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__41541 = state_39903;
state_39903 = G__41541;
continue;
} else {
return ret_value__37086__auto__;
}
break;
}
});
cljs$core$async$state_machine__37085__auto__ = function(state_39903){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__37085__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__37085__auto____1.call(this,state_39903);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__37085__auto____0;
cljs$core$async$state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__37085__auto____1;
return cljs$core$async$state_machine__37085__auto__;
})()
})();
var state__37596__auto__ = (function (){var statearr_40044 = f__37595__auto__();
(statearr_40044[(6)] = c__37594__auto___41500);

return statearr_40044;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__37596__auto__);
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
var G__40050 = arguments.length;
switch (G__40050) {
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
var G__40059 = arguments.length;
switch (G__40059) {
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
var G__40062 = arguments.length;
switch (G__40062) {
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
var c__37594__auto___41549 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__37595__auto__ = (function (){var switch__37084__auto__ = (function (state_40135){
var state_val_40136 = (state_40135[(1)]);
if((state_val_40136 === (7))){
var state_40135__$1 = state_40135;
var statearr_40144_41551 = state_40135__$1;
(statearr_40144_41551[(2)] = null);

(statearr_40144_41551[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40136 === (1))){
var state_40135__$1 = state_40135;
var statearr_40145_41552 = state_40135__$1;
(statearr_40145_41552[(2)] = null);

(statearr_40145_41552[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40136 === (4))){
var inst_40085 = (state_40135[(7)]);
var inst_40084 = (state_40135[(8)]);
var inst_40087 = (inst_40085 < inst_40084);
var state_40135__$1 = state_40135;
if(cljs.core.truth_(inst_40087)){
var statearr_40150_41553 = state_40135__$1;
(statearr_40150_41553[(1)] = (6));

} else {
var statearr_40151_41554 = state_40135__$1;
(statearr_40151_41554[(1)] = (7));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40136 === (15))){
var inst_40118 = (state_40135[(9)]);
var inst_40123 = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,inst_40118);
var state_40135__$1 = state_40135;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_40135__$1,(17),out,inst_40123);
} else {
if((state_val_40136 === (13))){
var inst_40118 = (state_40135[(9)]);
var inst_40118__$1 = (state_40135[(2)]);
var inst_40119 = cljs.core.some(cljs.core.nil_QMARK_,inst_40118__$1);
var state_40135__$1 = (function (){var statearr_40152 = state_40135;
(statearr_40152[(9)] = inst_40118__$1);

return statearr_40152;
})();
if(cljs.core.truth_(inst_40119)){
var statearr_40153_41558 = state_40135__$1;
(statearr_40153_41558[(1)] = (14));

} else {
var statearr_40154_41559 = state_40135__$1;
(statearr_40154_41559[(1)] = (15));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40136 === (6))){
var state_40135__$1 = state_40135;
var statearr_40155_41560 = state_40135__$1;
(statearr_40155_41560[(2)] = null);

(statearr_40155_41560[(1)] = (9));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40136 === (17))){
var inst_40125 = (state_40135[(2)]);
var state_40135__$1 = (function (){var statearr_40171 = state_40135;
(statearr_40171[(10)] = inst_40125);

return statearr_40171;
})();
var statearr_40172_41562 = state_40135__$1;
(statearr_40172_41562[(2)] = null);

(statearr_40172_41562[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40136 === (3))){
var inst_40130 = (state_40135[(2)]);
var state_40135__$1 = state_40135;
return cljs.core.async.impl.ioc_helpers.return_chan(state_40135__$1,inst_40130);
} else {
if((state_val_40136 === (12))){
var _ = (function (){var statearr_40175 = state_40135;
(statearr_40175[(4)] = cljs.core.rest((state_40135[(4)])));

return statearr_40175;
})();
var state_40135__$1 = state_40135;
var ex40156 = (state_40135__$1[(2)]);
var statearr_40176_41563 = state_40135__$1;
(statearr_40176_41563[(5)] = ex40156);


if((ex40156 instanceof Object)){
var statearr_40177_41565 = state_40135__$1;
(statearr_40177_41565[(1)] = (11));

(statearr_40177_41565[(5)] = null);

} else {
throw ex40156;

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40136 === (2))){
var inst_40083 = cljs.core.reset_BANG_(dctr,cnt);
var inst_40084 = cnt;
var inst_40085 = (0);
var state_40135__$1 = (function (){var statearr_40178 = state_40135;
(statearr_40178[(11)] = inst_40083);

(statearr_40178[(8)] = inst_40084);

(statearr_40178[(7)] = inst_40085);

return statearr_40178;
})();
var statearr_40179_41566 = state_40135__$1;
(statearr_40179_41566[(2)] = null);

(statearr_40179_41566[(1)] = (4));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40136 === (11))){
var inst_40094 = (state_40135[(2)]);
var inst_40098 = cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(dctr,cljs.core.dec);
var state_40135__$1 = (function (){var statearr_40181 = state_40135;
(statearr_40181[(12)] = inst_40094);

return statearr_40181;
})();
var statearr_40182_41568 = state_40135__$1;
(statearr_40182_41568[(2)] = inst_40098);

(statearr_40182_41568[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40136 === (9))){
var inst_40085 = (state_40135[(7)]);
var _ = (function (){var statearr_40183 = state_40135;
(statearr_40183[(4)] = cljs.core.cons((12),(state_40135[(4)])));

return statearr_40183;
})();
var inst_40104 = (chs__$1.cljs$core$IFn$_invoke$arity$1 ? chs__$1.cljs$core$IFn$_invoke$arity$1(inst_40085) : chs__$1.call(null,inst_40085));
var inst_40105 = (done.cljs$core$IFn$_invoke$arity$1 ? done.cljs$core$IFn$_invoke$arity$1(inst_40085) : done.call(null,inst_40085));
var inst_40106 = cljs.core.async.take_BANG_.cljs$core$IFn$_invoke$arity$2(inst_40104,inst_40105);
var ___$1 = (function (){var statearr_40184 = state_40135;
(statearr_40184[(4)] = cljs.core.rest((state_40135[(4)])));

return statearr_40184;
})();
var state_40135__$1 = state_40135;
var statearr_40185_41569 = state_40135__$1;
(statearr_40185_41569[(2)] = inst_40106);

(statearr_40185_41569[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40136 === (5))){
var inst_40116 = (state_40135[(2)]);
var state_40135__$1 = (function (){var statearr_40189 = state_40135;
(statearr_40189[(13)] = inst_40116);

return statearr_40189;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_40135__$1,(13),dchan);
} else {
if((state_val_40136 === (14))){
var inst_40121 = cljs.core.async.close_BANG_(out);
var state_40135__$1 = state_40135;
var statearr_40190_41570 = state_40135__$1;
(statearr_40190_41570[(2)] = inst_40121);

(statearr_40190_41570[(1)] = (16));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40136 === (16))){
var inst_40128 = (state_40135[(2)]);
var state_40135__$1 = state_40135;
var statearr_40194_41571 = state_40135__$1;
(statearr_40194_41571[(2)] = inst_40128);

(statearr_40194_41571[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40136 === (10))){
var inst_40085 = (state_40135[(7)]);
var inst_40109 = (state_40135[(2)]);
var inst_40110 = (inst_40085 + (1));
var inst_40085__$1 = inst_40110;
var state_40135__$1 = (function (){var statearr_40199 = state_40135;
(statearr_40199[(14)] = inst_40109);

(statearr_40199[(7)] = inst_40085__$1);

return statearr_40199;
})();
var statearr_40201_41572 = state_40135__$1;
(statearr_40201_41572[(2)] = null);

(statearr_40201_41572[(1)] = (4));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40136 === (8))){
var inst_40114 = (state_40135[(2)]);
var state_40135__$1 = state_40135;
var statearr_40202_41573 = state_40135__$1;
(statearr_40202_41573[(2)] = inst_40114);

(statearr_40202_41573[(1)] = (5));


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
var cljs$core$async$state_machine__37085__auto__ = null;
var cljs$core$async$state_machine__37085__auto____0 = (function (){
var statearr_40203 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_40203[(0)] = cljs$core$async$state_machine__37085__auto__);

(statearr_40203[(1)] = (1));

return statearr_40203;
});
var cljs$core$async$state_machine__37085__auto____1 = (function (state_40135){
while(true){
var ret_value__37086__auto__ = (function (){try{while(true){
var result__37087__auto__ = switch__37084__auto__(state_40135);
if(cljs.core.keyword_identical_QMARK_(result__37087__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__37087__auto__;
}
break;
}
}catch (e40204){var ex__37088__auto__ = e40204;
var statearr_40205_41574 = state_40135;
(statearr_40205_41574[(2)] = ex__37088__auto__);


if(cljs.core.seq((state_40135[(4)]))){
var statearr_40206_41575 = state_40135;
(statearr_40206_41575[(1)] = cljs.core.first((state_40135[(4)])));

} else {
throw ex__37088__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__37086__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__41576 = state_40135;
state_40135 = G__41576;
continue;
} else {
return ret_value__37086__auto__;
}
break;
}
});
cljs$core$async$state_machine__37085__auto__ = function(state_40135){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__37085__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__37085__auto____1.call(this,state_40135);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__37085__auto____0;
cljs$core$async$state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__37085__auto____1;
return cljs$core$async$state_machine__37085__auto__;
})()
})();
var state__37596__auto__ = (function (){var statearr_40208 = f__37595__auto__();
(statearr_40208[(6)] = c__37594__auto___41549);

return statearr_40208;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__37596__auto__);
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
var G__40213 = arguments.length;
switch (G__40213) {
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
var c__37594__auto___41578 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__37595__auto__ = (function (){var switch__37084__auto__ = (function (state_40267){
var state_val_40268 = (state_40267[(1)]);
if((state_val_40268 === (7))){
var inst_40226 = (state_40267[(7)]);
var inst_40227 = (state_40267[(8)]);
var inst_40226__$1 = (state_40267[(2)]);
var inst_40227__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_40226__$1,(0),null);
var inst_40228 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_40226__$1,(1),null);
var inst_40229 = (inst_40227__$1 == null);
var state_40267__$1 = (function (){var statearr_40289 = state_40267;
(statearr_40289[(7)] = inst_40226__$1);

(statearr_40289[(8)] = inst_40227__$1);

(statearr_40289[(9)] = inst_40228);

return statearr_40289;
})();
if(cljs.core.truth_(inst_40229)){
var statearr_40290_41583 = state_40267__$1;
(statearr_40290_41583[(1)] = (8));

} else {
var statearr_40291_41584 = state_40267__$1;
(statearr_40291_41584[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40268 === (1))){
var inst_40216 = cljs.core.vec(chs);
var inst_40217 = inst_40216;
var state_40267__$1 = (function (){var statearr_40292 = state_40267;
(statearr_40292[(10)] = inst_40217);

return statearr_40292;
})();
var statearr_40293_41588 = state_40267__$1;
(statearr_40293_41588[(2)] = null);

(statearr_40293_41588[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40268 === (4))){
var inst_40217 = (state_40267[(10)]);
var state_40267__$1 = state_40267;
return cljs.core.async.ioc_alts_BANG_(state_40267__$1,(7),inst_40217);
} else {
if((state_val_40268 === (6))){
var inst_40263 = (state_40267[(2)]);
var state_40267__$1 = state_40267;
var statearr_40300_41589 = state_40267__$1;
(statearr_40300_41589[(2)] = inst_40263);

(statearr_40300_41589[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40268 === (3))){
var inst_40265 = (state_40267[(2)]);
var state_40267__$1 = state_40267;
return cljs.core.async.impl.ioc_helpers.return_chan(state_40267__$1,inst_40265);
} else {
if((state_val_40268 === (2))){
var inst_40217 = (state_40267[(10)]);
var inst_40219 = cljs.core.count(inst_40217);
var inst_40220 = (inst_40219 > (0));
var state_40267__$1 = state_40267;
if(cljs.core.truth_(inst_40220)){
var statearr_40302_41590 = state_40267__$1;
(statearr_40302_41590[(1)] = (4));

} else {
var statearr_40304_41591 = state_40267__$1;
(statearr_40304_41591[(1)] = (5));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40268 === (11))){
var inst_40217 = (state_40267[(10)]);
var inst_40256 = (state_40267[(2)]);
var tmp40301 = inst_40217;
var inst_40217__$1 = tmp40301;
var state_40267__$1 = (function (){var statearr_40308 = state_40267;
(statearr_40308[(11)] = inst_40256);

(statearr_40308[(10)] = inst_40217__$1);

return statearr_40308;
})();
var statearr_40309_41593 = state_40267__$1;
(statearr_40309_41593[(2)] = null);

(statearr_40309_41593[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40268 === (9))){
var inst_40227 = (state_40267[(8)]);
var state_40267__$1 = state_40267;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_40267__$1,(11),out,inst_40227);
} else {
if((state_val_40268 === (5))){
var inst_40261 = cljs.core.async.close_BANG_(out);
var state_40267__$1 = state_40267;
var statearr_40317_41596 = state_40267__$1;
(statearr_40317_41596[(2)] = inst_40261);

(statearr_40317_41596[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40268 === (10))){
var inst_40259 = (state_40267[(2)]);
var state_40267__$1 = state_40267;
var statearr_40318_41598 = state_40267__$1;
(statearr_40318_41598[(2)] = inst_40259);

(statearr_40318_41598[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40268 === (8))){
var inst_40217 = (state_40267[(10)]);
var inst_40226 = (state_40267[(7)]);
var inst_40227 = (state_40267[(8)]);
var inst_40228 = (state_40267[(9)]);
var inst_40245 = (function (){var cs = inst_40217;
var vec__40222 = inst_40226;
var v = inst_40227;
var c = inst_40228;
return (function (p1__40210_SHARP_){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(c,p1__40210_SHARP_);
});
})();
var inst_40246 = cljs.core.filterv(inst_40245,inst_40217);
var inst_40217__$1 = inst_40246;
var state_40267__$1 = (function (){var statearr_40322 = state_40267;
(statearr_40322[(10)] = inst_40217__$1);

return statearr_40322;
})();
var statearr_40326_41600 = state_40267__$1;
(statearr_40326_41600[(2)] = null);

(statearr_40326_41600[(1)] = (2));


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
var cljs$core$async$state_machine__37085__auto__ = null;
var cljs$core$async$state_machine__37085__auto____0 = (function (){
var statearr_40330 = [null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_40330[(0)] = cljs$core$async$state_machine__37085__auto__);

(statearr_40330[(1)] = (1));

return statearr_40330;
});
var cljs$core$async$state_machine__37085__auto____1 = (function (state_40267){
while(true){
var ret_value__37086__auto__ = (function (){try{while(true){
var result__37087__auto__ = switch__37084__auto__(state_40267);
if(cljs.core.keyword_identical_QMARK_(result__37087__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__37087__auto__;
}
break;
}
}catch (e40331){var ex__37088__auto__ = e40331;
var statearr_40332_41602 = state_40267;
(statearr_40332_41602[(2)] = ex__37088__auto__);


if(cljs.core.seq((state_40267[(4)]))){
var statearr_40333_41603 = state_40267;
(statearr_40333_41603[(1)] = cljs.core.first((state_40267[(4)])));

} else {
throw ex__37088__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__37086__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__41604 = state_40267;
state_40267 = G__41604;
continue;
} else {
return ret_value__37086__auto__;
}
break;
}
});
cljs$core$async$state_machine__37085__auto__ = function(state_40267){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__37085__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__37085__auto____1.call(this,state_40267);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__37085__auto____0;
cljs$core$async$state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__37085__auto____1;
return cljs$core$async$state_machine__37085__auto__;
})()
})();
var state__37596__auto__ = (function (){var statearr_40334 = f__37595__auto__();
(statearr_40334[(6)] = c__37594__auto___41578);

return statearr_40334;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__37596__auto__);
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
var G__40336 = arguments.length;
switch (G__40336) {
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
var c__37594__auto___41613 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__37595__auto__ = (function (){var switch__37084__auto__ = (function (state_40363){
var state_val_40364 = (state_40363[(1)]);
if((state_val_40364 === (7))){
var inst_40345 = (state_40363[(7)]);
var inst_40345__$1 = (state_40363[(2)]);
var inst_40346 = (inst_40345__$1 == null);
var inst_40347 = cljs.core.not(inst_40346);
var state_40363__$1 = (function (){var statearr_40368 = state_40363;
(statearr_40368[(7)] = inst_40345__$1);

return statearr_40368;
})();
if(inst_40347){
var statearr_40371_41616 = state_40363__$1;
(statearr_40371_41616[(1)] = (8));

} else {
var statearr_40373_41617 = state_40363__$1;
(statearr_40373_41617[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40364 === (1))){
var inst_40340 = (0);
var state_40363__$1 = (function (){var statearr_40374 = state_40363;
(statearr_40374[(8)] = inst_40340);

return statearr_40374;
})();
var statearr_40375_41618 = state_40363__$1;
(statearr_40375_41618[(2)] = null);

(statearr_40375_41618[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40364 === (4))){
var state_40363__$1 = state_40363;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_40363__$1,(7),ch);
} else {
if((state_val_40364 === (6))){
var inst_40358 = (state_40363[(2)]);
var state_40363__$1 = state_40363;
var statearr_40379_41619 = state_40363__$1;
(statearr_40379_41619[(2)] = inst_40358);

(statearr_40379_41619[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40364 === (3))){
var inst_40360 = (state_40363[(2)]);
var inst_40361 = cljs.core.async.close_BANG_(out);
var state_40363__$1 = (function (){var statearr_40381 = state_40363;
(statearr_40381[(9)] = inst_40360);

return statearr_40381;
})();
return cljs.core.async.impl.ioc_helpers.return_chan(state_40363__$1,inst_40361);
} else {
if((state_val_40364 === (2))){
var inst_40340 = (state_40363[(8)]);
var inst_40342 = (inst_40340 < n);
var state_40363__$1 = state_40363;
if(cljs.core.truth_(inst_40342)){
var statearr_40382_41623 = state_40363__$1;
(statearr_40382_41623[(1)] = (4));

} else {
var statearr_40383_41624 = state_40363__$1;
(statearr_40383_41624[(1)] = (5));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40364 === (11))){
var inst_40340 = (state_40363[(8)]);
var inst_40350 = (state_40363[(2)]);
var inst_40351 = (inst_40340 + (1));
var inst_40340__$1 = inst_40351;
var state_40363__$1 = (function (){var statearr_40384 = state_40363;
(statearr_40384[(10)] = inst_40350);

(statearr_40384[(8)] = inst_40340__$1);

return statearr_40384;
})();
var statearr_40385_41625 = state_40363__$1;
(statearr_40385_41625[(2)] = null);

(statearr_40385_41625[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40364 === (9))){
var state_40363__$1 = state_40363;
var statearr_40386_41626 = state_40363__$1;
(statearr_40386_41626[(2)] = null);

(statearr_40386_41626[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40364 === (5))){
var state_40363__$1 = state_40363;
var statearr_40387_41628 = state_40363__$1;
(statearr_40387_41628[(2)] = null);

(statearr_40387_41628[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40364 === (10))){
var inst_40355 = (state_40363[(2)]);
var state_40363__$1 = state_40363;
var statearr_40388_41630 = state_40363__$1;
(statearr_40388_41630[(2)] = inst_40355);

(statearr_40388_41630[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40364 === (8))){
var inst_40345 = (state_40363[(7)]);
var state_40363__$1 = state_40363;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_40363__$1,(11),out,inst_40345);
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
var cljs$core$async$state_machine__37085__auto__ = null;
var cljs$core$async$state_machine__37085__auto____0 = (function (){
var statearr_40389 = [null,null,null,null,null,null,null,null,null,null,null];
(statearr_40389[(0)] = cljs$core$async$state_machine__37085__auto__);

(statearr_40389[(1)] = (1));

return statearr_40389;
});
var cljs$core$async$state_machine__37085__auto____1 = (function (state_40363){
while(true){
var ret_value__37086__auto__ = (function (){try{while(true){
var result__37087__auto__ = switch__37084__auto__(state_40363);
if(cljs.core.keyword_identical_QMARK_(result__37087__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__37087__auto__;
}
break;
}
}catch (e40390){var ex__37088__auto__ = e40390;
var statearr_40391_41632 = state_40363;
(statearr_40391_41632[(2)] = ex__37088__auto__);


if(cljs.core.seq((state_40363[(4)]))){
var statearr_40392_41633 = state_40363;
(statearr_40392_41633[(1)] = cljs.core.first((state_40363[(4)])));

} else {
throw ex__37088__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__37086__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__41634 = state_40363;
state_40363 = G__41634;
continue;
} else {
return ret_value__37086__auto__;
}
break;
}
});
cljs$core$async$state_machine__37085__auto__ = function(state_40363){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__37085__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__37085__auto____1.call(this,state_40363);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__37085__auto____0;
cljs$core$async$state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__37085__auto____1;
return cljs$core$async$state_machine__37085__auto__;
})()
})();
var state__37596__auto__ = (function (){var statearr_40393 = f__37595__auto__();
(statearr_40393[(6)] = c__37594__auto___41613);

return statearr_40393;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__37596__auto__);
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
cljs.core.async.t_cljs$core$async40402 = (function (f,ch,meta40400,_,fn1,meta40403){
this.f = f;
this.ch = ch;
this.meta40400 = meta40400;
this._ = _;
this.fn1 = fn1;
this.meta40403 = meta40403;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async40402.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_40404,meta40403__$1){
var self__ = this;
var _40404__$1 = this;
return (new cljs.core.async.t_cljs$core$async40402(self__.f,self__.ch,self__.meta40400,self__._,self__.fn1,meta40403__$1));
}));

(cljs.core.async.t_cljs$core$async40402.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_40404){
var self__ = this;
var _40404__$1 = this;
return self__.meta40403;
}));

(cljs.core.async.t_cljs$core$async40402.prototype.cljs$core$async$impl$protocols$Handler$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async40402.prototype.cljs$core$async$impl$protocols$Handler$active_QMARK_$arity$1 = (function (___$1){
var self__ = this;
var ___$2 = this;
return cljs.core.async.impl.protocols.active_QMARK_(self__.fn1);
}));

(cljs.core.async.t_cljs$core$async40402.prototype.cljs$core$async$impl$protocols$Handler$blockable_QMARK_$arity$1 = (function (___$1){
var self__ = this;
var ___$2 = this;
return true;
}));

(cljs.core.async.t_cljs$core$async40402.prototype.cljs$core$async$impl$protocols$Handler$commit$arity$1 = (function (___$1){
var self__ = this;
var ___$2 = this;
var f1 = cljs.core.async.impl.protocols.commit(self__.fn1);
return (function (p1__40398_SHARP_){
var G__40419 = (((p1__40398_SHARP_ == null))?null:(self__.f.cljs$core$IFn$_invoke$arity$1 ? self__.f.cljs$core$IFn$_invoke$arity$1(p1__40398_SHARP_) : self__.f.call(null,p1__40398_SHARP_)));
return (f1.cljs$core$IFn$_invoke$arity$1 ? f1.cljs$core$IFn$_invoke$arity$1(G__40419) : f1.call(null,G__40419));
});
}));

(cljs.core.async.t_cljs$core$async40402.getBasis = (function (){
return new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"f","f",43394975,null),new cljs.core.Symbol(null,"ch","ch",1085813622,null),new cljs.core.Symbol(null,"meta40400","meta40400",-1665087276,null),cljs.core.with_meta(new cljs.core.Symbol(null,"_","_",-1201019570,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol("cljs.core.async","t_cljs$core$async40399","cljs.core.async/t_cljs$core$async40399",193937929,null)], null)),new cljs.core.Symbol(null,"fn1","fn1",895834444,null),new cljs.core.Symbol(null,"meta40403","meta40403",201940141,null)], null);
}));

(cljs.core.async.t_cljs$core$async40402.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async40402.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async40402");

(cljs.core.async.t_cljs$core$async40402.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async40402");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async40402.
 */
cljs.core.async.__GT_t_cljs$core$async40402 = (function cljs$core$async$__GT_t_cljs$core$async40402(f,ch,meta40400,_,fn1,meta40403){
return (new cljs.core.async.t_cljs$core$async40402(f,ch,meta40400,_,fn1,meta40403));
});



/**
* @constructor
 * @implements {cljs.core.async.impl.protocols.Channel}
 * @implements {cljs.core.async.impl.protocols.WritePort}
 * @implements {cljs.core.async.impl.protocols.ReadPort}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
cljs.core.async.t_cljs$core$async40399 = (function (f,ch,meta40400){
this.f = f;
this.ch = ch;
this.meta40400 = meta40400;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async40399.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_40401,meta40400__$1){
var self__ = this;
var _40401__$1 = this;
return (new cljs.core.async.t_cljs$core$async40399(self__.f,self__.ch,meta40400__$1));
}));

(cljs.core.async.t_cljs$core$async40399.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_40401){
var self__ = this;
var _40401__$1 = this;
return self__.meta40400;
}));

(cljs.core.async.t_cljs$core$async40399.prototype.cljs$core$async$impl$protocols$Channel$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async40399.prototype.cljs$core$async$impl$protocols$Channel$close_BANG_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.close_BANG_(self__.ch);
}));

(cljs.core.async.t_cljs$core$async40399.prototype.cljs$core$async$impl$protocols$Channel$closed_QMARK_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.closed_QMARK_(self__.ch);
}));

(cljs.core.async.t_cljs$core$async40399.prototype.cljs$core$async$impl$protocols$ReadPort$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async40399.prototype.cljs$core$async$impl$protocols$ReadPort$take_BANG_$arity$2 = (function (_,fn1){
var self__ = this;
var ___$1 = this;
var ret = cljs.core.async.impl.protocols.take_BANG_(self__.ch,(new cljs.core.async.t_cljs$core$async40402(self__.f,self__.ch,self__.meta40400,___$1,fn1,cljs.core.PersistentArrayMap.EMPTY)));
if(cljs.core.truth_((function (){var and__5000__auto__ = ret;
if(cljs.core.truth_(and__5000__auto__)){
return (!((cljs.core.deref(ret) == null)));
} else {
return and__5000__auto__;
}
})())){
return cljs.core.async.impl.channels.box((function (){var G__40420 = cljs.core.deref(ret);
return (self__.f.cljs$core$IFn$_invoke$arity$1 ? self__.f.cljs$core$IFn$_invoke$arity$1(G__40420) : self__.f.call(null,G__40420));
})());
} else {
return ret;
}
}));

(cljs.core.async.t_cljs$core$async40399.prototype.cljs$core$async$impl$protocols$WritePort$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async40399.prototype.cljs$core$async$impl$protocols$WritePort$put_BANG_$arity$3 = (function (_,val,fn1){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.put_BANG_(self__.ch,val,fn1);
}));

(cljs.core.async.t_cljs$core$async40399.getBasis = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"f","f",43394975,null),new cljs.core.Symbol(null,"ch","ch",1085813622,null),new cljs.core.Symbol(null,"meta40400","meta40400",-1665087276,null)], null);
}));

(cljs.core.async.t_cljs$core$async40399.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async40399.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async40399");

(cljs.core.async.t_cljs$core$async40399.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async40399");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async40399.
 */
cljs.core.async.__GT_t_cljs$core$async40399 = (function cljs$core$async$__GT_t_cljs$core$async40399(f,ch,meta40400){
return (new cljs.core.async.t_cljs$core$async40399(f,ch,meta40400));
});


/**
 * Deprecated - this function will be removed. Use transducer instead
 */
cljs.core.async.map_LT_ = (function cljs$core$async$map_LT_(f,ch){
return (new cljs.core.async.t_cljs$core$async40399(f,ch,cljs.core.PersistentArrayMap.EMPTY));
});

/**
* @constructor
 * @implements {cljs.core.async.impl.protocols.Channel}
 * @implements {cljs.core.async.impl.protocols.WritePort}
 * @implements {cljs.core.async.impl.protocols.ReadPort}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
cljs.core.async.t_cljs$core$async40421 = (function (f,ch,meta40422){
this.f = f;
this.ch = ch;
this.meta40422 = meta40422;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async40421.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_40423,meta40422__$1){
var self__ = this;
var _40423__$1 = this;
return (new cljs.core.async.t_cljs$core$async40421(self__.f,self__.ch,meta40422__$1));
}));

(cljs.core.async.t_cljs$core$async40421.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_40423){
var self__ = this;
var _40423__$1 = this;
return self__.meta40422;
}));

(cljs.core.async.t_cljs$core$async40421.prototype.cljs$core$async$impl$protocols$Channel$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async40421.prototype.cljs$core$async$impl$protocols$Channel$close_BANG_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.close_BANG_(self__.ch);
}));

(cljs.core.async.t_cljs$core$async40421.prototype.cljs$core$async$impl$protocols$ReadPort$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async40421.prototype.cljs$core$async$impl$protocols$ReadPort$take_BANG_$arity$2 = (function (_,fn1){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.take_BANG_(self__.ch,fn1);
}));

(cljs.core.async.t_cljs$core$async40421.prototype.cljs$core$async$impl$protocols$WritePort$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async40421.prototype.cljs$core$async$impl$protocols$WritePort$put_BANG_$arity$3 = (function (_,val,fn1){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.put_BANG_(self__.ch,(self__.f.cljs$core$IFn$_invoke$arity$1 ? self__.f.cljs$core$IFn$_invoke$arity$1(val) : self__.f.call(null,val)),fn1);
}));

(cljs.core.async.t_cljs$core$async40421.getBasis = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"f","f",43394975,null),new cljs.core.Symbol(null,"ch","ch",1085813622,null),new cljs.core.Symbol(null,"meta40422","meta40422",-1709870138,null)], null);
}));

(cljs.core.async.t_cljs$core$async40421.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async40421.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async40421");

(cljs.core.async.t_cljs$core$async40421.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async40421");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async40421.
 */
cljs.core.async.__GT_t_cljs$core$async40421 = (function cljs$core$async$__GT_t_cljs$core$async40421(f,ch,meta40422){
return (new cljs.core.async.t_cljs$core$async40421(f,ch,meta40422));
});


/**
 * Deprecated - this function will be removed. Use transducer instead
 */
cljs.core.async.map_GT_ = (function cljs$core$async$map_GT_(f,ch){
return (new cljs.core.async.t_cljs$core$async40421(f,ch,cljs.core.PersistentArrayMap.EMPTY));
});

/**
* @constructor
 * @implements {cljs.core.async.impl.protocols.Channel}
 * @implements {cljs.core.async.impl.protocols.WritePort}
 * @implements {cljs.core.async.impl.protocols.ReadPort}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
cljs.core.async.t_cljs$core$async40426 = (function (p,ch,meta40427){
this.p = p;
this.ch = ch;
this.meta40427 = meta40427;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async40426.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_40428,meta40427__$1){
var self__ = this;
var _40428__$1 = this;
return (new cljs.core.async.t_cljs$core$async40426(self__.p,self__.ch,meta40427__$1));
}));

(cljs.core.async.t_cljs$core$async40426.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_40428){
var self__ = this;
var _40428__$1 = this;
return self__.meta40427;
}));

(cljs.core.async.t_cljs$core$async40426.prototype.cljs$core$async$impl$protocols$Channel$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async40426.prototype.cljs$core$async$impl$protocols$Channel$close_BANG_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.close_BANG_(self__.ch);
}));

(cljs.core.async.t_cljs$core$async40426.prototype.cljs$core$async$impl$protocols$Channel$closed_QMARK_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.closed_QMARK_(self__.ch);
}));

(cljs.core.async.t_cljs$core$async40426.prototype.cljs$core$async$impl$protocols$ReadPort$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async40426.prototype.cljs$core$async$impl$protocols$ReadPort$take_BANG_$arity$2 = (function (_,fn1){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.take_BANG_(self__.ch,fn1);
}));

(cljs.core.async.t_cljs$core$async40426.prototype.cljs$core$async$impl$protocols$WritePort$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async40426.prototype.cljs$core$async$impl$protocols$WritePort$put_BANG_$arity$3 = (function (_,val,fn1){
var self__ = this;
var ___$1 = this;
if(cljs.core.truth_((self__.p.cljs$core$IFn$_invoke$arity$1 ? self__.p.cljs$core$IFn$_invoke$arity$1(val) : self__.p.call(null,val)))){
return cljs.core.async.impl.protocols.put_BANG_(self__.ch,val,fn1);
} else {
return cljs.core.async.impl.channels.box(cljs.core.not(cljs.core.async.impl.protocols.closed_QMARK_(self__.ch)));
}
}));

(cljs.core.async.t_cljs$core$async40426.getBasis = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"p","p",1791580836,null),new cljs.core.Symbol(null,"ch","ch",1085813622,null),new cljs.core.Symbol(null,"meta40427","meta40427",160628284,null)], null);
}));

(cljs.core.async.t_cljs$core$async40426.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async40426.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async40426");

(cljs.core.async.t_cljs$core$async40426.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async40426");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async40426.
 */
cljs.core.async.__GT_t_cljs$core$async40426 = (function cljs$core$async$__GT_t_cljs$core$async40426(p,ch,meta40427){
return (new cljs.core.async.t_cljs$core$async40426(p,ch,meta40427));
});


/**
 * Deprecated - this function will be removed. Use transducer instead
 */
cljs.core.async.filter_GT_ = (function cljs$core$async$filter_GT_(p,ch){
return (new cljs.core.async.t_cljs$core$async40426(p,ch,cljs.core.PersistentArrayMap.EMPTY));
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
var G__40436 = arguments.length;
switch (G__40436) {
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
var c__37594__auto___41732 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__37595__auto__ = (function (){var switch__37084__auto__ = (function (state_40457){
var state_val_40458 = (state_40457[(1)]);
if((state_val_40458 === (7))){
var inst_40453 = (state_40457[(2)]);
var state_40457__$1 = state_40457;
var statearr_40459_41735 = state_40457__$1;
(statearr_40459_41735[(2)] = inst_40453);

(statearr_40459_41735[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40458 === (1))){
var state_40457__$1 = state_40457;
var statearr_40460_41743 = state_40457__$1;
(statearr_40460_41743[(2)] = null);

(statearr_40460_41743[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40458 === (4))){
var inst_40439 = (state_40457[(7)]);
var inst_40439__$1 = (state_40457[(2)]);
var inst_40440 = (inst_40439__$1 == null);
var state_40457__$1 = (function (){var statearr_40461 = state_40457;
(statearr_40461[(7)] = inst_40439__$1);

return statearr_40461;
})();
if(cljs.core.truth_(inst_40440)){
var statearr_40462_41751 = state_40457__$1;
(statearr_40462_41751[(1)] = (5));

} else {
var statearr_40463_41752 = state_40457__$1;
(statearr_40463_41752[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40458 === (6))){
var inst_40439 = (state_40457[(7)]);
var inst_40444 = (p.cljs$core$IFn$_invoke$arity$1 ? p.cljs$core$IFn$_invoke$arity$1(inst_40439) : p.call(null,inst_40439));
var state_40457__$1 = state_40457;
if(cljs.core.truth_(inst_40444)){
var statearr_40464_41762 = state_40457__$1;
(statearr_40464_41762[(1)] = (8));

} else {
var statearr_40465_41763 = state_40457__$1;
(statearr_40465_41763[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40458 === (3))){
var inst_40455 = (state_40457[(2)]);
var state_40457__$1 = state_40457;
return cljs.core.async.impl.ioc_helpers.return_chan(state_40457__$1,inst_40455);
} else {
if((state_val_40458 === (2))){
var state_40457__$1 = state_40457;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_40457__$1,(4),ch);
} else {
if((state_val_40458 === (11))){
var inst_40447 = (state_40457[(2)]);
var state_40457__$1 = state_40457;
var statearr_40469_41768 = state_40457__$1;
(statearr_40469_41768[(2)] = inst_40447);

(statearr_40469_41768[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40458 === (9))){
var state_40457__$1 = state_40457;
var statearr_40470_41769 = state_40457__$1;
(statearr_40470_41769[(2)] = null);

(statearr_40470_41769[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40458 === (5))){
var inst_40442 = cljs.core.async.close_BANG_(out);
var state_40457__$1 = state_40457;
var statearr_40471_41770 = state_40457__$1;
(statearr_40471_41770[(2)] = inst_40442);

(statearr_40471_41770[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40458 === (10))){
var inst_40450 = (state_40457[(2)]);
var state_40457__$1 = (function (){var statearr_40472 = state_40457;
(statearr_40472[(8)] = inst_40450);

return statearr_40472;
})();
var statearr_40473_41772 = state_40457__$1;
(statearr_40473_41772[(2)] = null);

(statearr_40473_41772[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40458 === (8))){
var inst_40439 = (state_40457[(7)]);
var state_40457__$1 = state_40457;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_40457__$1,(11),out,inst_40439);
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
var cljs$core$async$state_machine__37085__auto__ = null;
var cljs$core$async$state_machine__37085__auto____0 = (function (){
var statearr_40474 = [null,null,null,null,null,null,null,null,null];
(statearr_40474[(0)] = cljs$core$async$state_machine__37085__auto__);

(statearr_40474[(1)] = (1));

return statearr_40474;
});
var cljs$core$async$state_machine__37085__auto____1 = (function (state_40457){
while(true){
var ret_value__37086__auto__ = (function (){try{while(true){
var result__37087__auto__ = switch__37084__auto__(state_40457);
if(cljs.core.keyword_identical_QMARK_(result__37087__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__37087__auto__;
}
break;
}
}catch (e40475){var ex__37088__auto__ = e40475;
var statearr_40476_41781 = state_40457;
(statearr_40476_41781[(2)] = ex__37088__auto__);


if(cljs.core.seq((state_40457[(4)]))){
var statearr_40477_41782 = state_40457;
(statearr_40477_41782[(1)] = cljs.core.first((state_40457[(4)])));

} else {
throw ex__37088__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__37086__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__41784 = state_40457;
state_40457 = G__41784;
continue;
} else {
return ret_value__37086__auto__;
}
break;
}
});
cljs$core$async$state_machine__37085__auto__ = function(state_40457){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__37085__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__37085__auto____1.call(this,state_40457);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__37085__auto____0;
cljs$core$async$state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__37085__auto____1;
return cljs$core$async$state_machine__37085__auto__;
})()
})();
var state__37596__auto__ = (function (){var statearr_40478 = f__37595__auto__();
(statearr_40478[(6)] = c__37594__auto___41732);

return statearr_40478;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__37596__auto__);
}));


return out;
}));

(cljs.core.async.filter_LT_.cljs$lang$maxFixedArity = 3);

/**
 * Deprecated - this function will be removed. Use transducer instead
 */
cljs.core.async.remove_LT_ = (function cljs$core$async$remove_LT_(var_args){
var G__40480 = arguments.length;
switch (G__40480) {
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
var c__37594__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__37595__auto__ = (function (){var switch__37084__auto__ = (function (state_40587){
var state_val_40588 = (state_40587[(1)]);
if((state_val_40588 === (7))){
var inst_40583 = (state_40587[(2)]);
var state_40587__$1 = state_40587;
var statearr_40591_41792 = state_40587__$1;
(statearr_40591_41792[(2)] = inst_40583);

(statearr_40591_41792[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40588 === (20))){
var inst_40546 = (state_40587[(7)]);
var inst_40564 = (state_40587[(2)]);
var inst_40565 = cljs.core.next(inst_40546);
var inst_40520 = inst_40565;
var inst_40521 = null;
var inst_40522 = (0);
var inst_40523 = (0);
var state_40587__$1 = (function (){var statearr_40592 = state_40587;
(statearr_40592[(8)] = inst_40564);

(statearr_40592[(9)] = inst_40520);

(statearr_40592[(10)] = inst_40521);

(statearr_40592[(11)] = inst_40522);

(statearr_40592[(12)] = inst_40523);

return statearr_40592;
})();
var statearr_40593_41800 = state_40587__$1;
(statearr_40593_41800[(2)] = null);

(statearr_40593_41800[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40588 === (1))){
var state_40587__$1 = state_40587;
var statearr_40594_41801 = state_40587__$1;
(statearr_40594_41801[(2)] = null);

(statearr_40594_41801[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40588 === (4))){
var inst_40506 = (state_40587[(13)]);
var inst_40506__$1 = (state_40587[(2)]);
var inst_40507 = (inst_40506__$1 == null);
var state_40587__$1 = (function (){var statearr_40596 = state_40587;
(statearr_40596[(13)] = inst_40506__$1);

return statearr_40596;
})();
if(cljs.core.truth_(inst_40507)){
var statearr_40597_41802 = state_40587__$1;
(statearr_40597_41802[(1)] = (5));

} else {
var statearr_40598_41803 = state_40587__$1;
(statearr_40598_41803[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40588 === (15))){
var state_40587__$1 = state_40587;
var statearr_40602_41805 = state_40587__$1;
(statearr_40602_41805[(2)] = null);

(statearr_40602_41805[(1)] = (16));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40588 === (21))){
var state_40587__$1 = state_40587;
var statearr_40603_41807 = state_40587__$1;
(statearr_40603_41807[(2)] = null);

(statearr_40603_41807[(1)] = (23));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40588 === (13))){
var inst_40523 = (state_40587[(12)]);
var inst_40520 = (state_40587[(9)]);
var inst_40521 = (state_40587[(10)]);
var inst_40522 = (state_40587[(11)]);
var inst_40530 = (state_40587[(2)]);
var inst_40534 = (inst_40523 + (1));
var tmp40599 = inst_40521;
var tmp40600 = inst_40522;
var tmp40601 = inst_40520;
var inst_40520__$1 = tmp40601;
var inst_40521__$1 = tmp40599;
var inst_40522__$1 = tmp40600;
var inst_40523__$1 = inst_40534;
var state_40587__$1 = (function (){var statearr_40604 = state_40587;
(statearr_40604[(14)] = inst_40530);

(statearr_40604[(9)] = inst_40520__$1);

(statearr_40604[(10)] = inst_40521__$1);

(statearr_40604[(11)] = inst_40522__$1);

(statearr_40604[(12)] = inst_40523__$1);

return statearr_40604;
})();
var statearr_40605_41809 = state_40587__$1;
(statearr_40605_41809[(2)] = null);

(statearr_40605_41809[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40588 === (22))){
var state_40587__$1 = state_40587;
var statearr_40606_41810 = state_40587__$1;
(statearr_40606_41810[(2)] = null);

(statearr_40606_41810[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40588 === (6))){
var inst_40506 = (state_40587[(13)]);
var inst_40518 = (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(inst_40506) : f.call(null,inst_40506));
var inst_40519 = cljs.core.seq(inst_40518);
var inst_40520 = inst_40519;
var inst_40521 = null;
var inst_40522 = (0);
var inst_40523 = (0);
var state_40587__$1 = (function (){var statearr_40607 = state_40587;
(statearr_40607[(9)] = inst_40520);

(statearr_40607[(10)] = inst_40521);

(statearr_40607[(11)] = inst_40522);

(statearr_40607[(12)] = inst_40523);

return statearr_40607;
})();
var statearr_40608_41812 = state_40587__$1;
(statearr_40608_41812[(2)] = null);

(statearr_40608_41812[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40588 === (17))){
var inst_40546 = (state_40587[(7)]);
var inst_40557 = cljs.core.chunk_first(inst_40546);
var inst_40558 = cljs.core.chunk_rest(inst_40546);
var inst_40559 = cljs.core.count(inst_40557);
var inst_40520 = inst_40558;
var inst_40521 = inst_40557;
var inst_40522 = inst_40559;
var inst_40523 = (0);
var state_40587__$1 = (function (){var statearr_40611 = state_40587;
(statearr_40611[(9)] = inst_40520);

(statearr_40611[(10)] = inst_40521);

(statearr_40611[(11)] = inst_40522);

(statearr_40611[(12)] = inst_40523);

return statearr_40611;
})();
var statearr_40613_41813 = state_40587__$1;
(statearr_40613_41813[(2)] = null);

(statearr_40613_41813[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40588 === (3))){
var inst_40585 = (state_40587[(2)]);
var state_40587__$1 = state_40587;
return cljs.core.async.impl.ioc_helpers.return_chan(state_40587__$1,inst_40585);
} else {
if((state_val_40588 === (12))){
var inst_40573 = (state_40587[(2)]);
var state_40587__$1 = state_40587;
var statearr_40615_41814 = state_40587__$1;
(statearr_40615_41814[(2)] = inst_40573);

(statearr_40615_41814[(1)] = (9));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40588 === (2))){
var state_40587__$1 = state_40587;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_40587__$1,(4),in$);
} else {
if((state_val_40588 === (23))){
var inst_40581 = (state_40587[(2)]);
var state_40587__$1 = state_40587;
var statearr_40618_41815 = state_40587__$1;
(statearr_40618_41815[(2)] = inst_40581);

(statearr_40618_41815[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40588 === (19))){
var inst_40568 = (state_40587[(2)]);
var state_40587__$1 = state_40587;
var statearr_40619_41816 = state_40587__$1;
(statearr_40619_41816[(2)] = inst_40568);

(statearr_40619_41816[(1)] = (16));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40588 === (11))){
var inst_40520 = (state_40587[(9)]);
var inst_40546 = (state_40587[(7)]);
var inst_40546__$1 = cljs.core.seq(inst_40520);
var state_40587__$1 = (function (){var statearr_40620 = state_40587;
(statearr_40620[(7)] = inst_40546__$1);

return statearr_40620;
})();
if(inst_40546__$1){
var statearr_40621_41817 = state_40587__$1;
(statearr_40621_41817[(1)] = (14));

} else {
var statearr_40622_41818 = state_40587__$1;
(statearr_40622_41818[(1)] = (15));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40588 === (9))){
var inst_40575 = (state_40587[(2)]);
var inst_40576 = cljs.core.async.impl.protocols.closed_QMARK_(out);
var state_40587__$1 = (function (){var statearr_40623 = state_40587;
(statearr_40623[(15)] = inst_40575);

return statearr_40623;
})();
if(cljs.core.truth_(inst_40576)){
var statearr_40624_41819 = state_40587__$1;
(statearr_40624_41819[(1)] = (21));

} else {
var statearr_40625_41820 = state_40587__$1;
(statearr_40625_41820[(1)] = (22));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40588 === (5))){
var inst_40509 = cljs.core.async.close_BANG_(out);
var state_40587__$1 = state_40587;
var statearr_40626_41823 = state_40587__$1;
(statearr_40626_41823[(2)] = inst_40509);

(statearr_40626_41823[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40588 === (14))){
var inst_40546 = (state_40587[(7)]);
var inst_40551 = cljs.core.chunked_seq_QMARK_(inst_40546);
var state_40587__$1 = state_40587;
if(inst_40551){
var statearr_40627_41826 = state_40587__$1;
(statearr_40627_41826[(1)] = (17));

} else {
var statearr_40628_41827 = state_40587__$1;
(statearr_40628_41827[(1)] = (18));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40588 === (16))){
var inst_40571 = (state_40587[(2)]);
var state_40587__$1 = state_40587;
var statearr_40629_41828 = state_40587__$1;
(statearr_40629_41828[(2)] = inst_40571);

(statearr_40629_41828[(1)] = (12));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40588 === (10))){
var inst_40521 = (state_40587[(10)]);
var inst_40523 = (state_40587[(12)]);
var inst_40528 = cljs.core._nth(inst_40521,inst_40523);
var state_40587__$1 = state_40587;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_40587__$1,(13),out,inst_40528);
} else {
if((state_val_40588 === (18))){
var inst_40546 = (state_40587[(7)]);
var inst_40562 = cljs.core.first(inst_40546);
var state_40587__$1 = state_40587;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_40587__$1,(20),out,inst_40562);
} else {
if((state_val_40588 === (8))){
var inst_40523 = (state_40587[(12)]);
var inst_40522 = (state_40587[(11)]);
var inst_40525 = (inst_40523 < inst_40522);
var inst_40526 = inst_40525;
var state_40587__$1 = state_40587;
if(cljs.core.truth_(inst_40526)){
var statearr_40630_41833 = state_40587__$1;
(statearr_40630_41833[(1)] = (10));

} else {
var statearr_40631_41834 = state_40587__$1;
(statearr_40631_41834[(1)] = (11));

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
var cljs$core$async$mapcat_STAR__$_state_machine__37085__auto__ = null;
var cljs$core$async$mapcat_STAR__$_state_machine__37085__auto____0 = (function (){
var statearr_40632 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_40632[(0)] = cljs$core$async$mapcat_STAR__$_state_machine__37085__auto__);

(statearr_40632[(1)] = (1));

return statearr_40632;
});
var cljs$core$async$mapcat_STAR__$_state_machine__37085__auto____1 = (function (state_40587){
while(true){
var ret_value__37086__auto__ = (function (){try{while(true){
var result__37087__auto__ = switch__37084__auto__(state_40587);
if(cljs.core.keyword_identical_QMARK_(result__37087__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__37087__auto__;
}
break;
}
}catch (e40633){var ex__37088__auto__ = e40633;
var statearr_40634_41843 = state_40587;
(statearr_40634_41843[(2)] = ex__37088__auto__);


if(cljs.core.seq((state_40587[(4)]))){
var statearr_40635_41844 = state_40587;
(statearr_40635_41844[(1)] = cljs.core.first((state_40587[(4)])));

} else {
throw ex__37088__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__37086__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__41845 = state_40587;
state_40587 = G__41845;
continue;
} else {
return ret_value__37086__auto__;
}
break;
}
});
cljs$core$async$mapcat_STAR__$_state_machine__37085__auto__ = function(state_40587){
switch(arguments.length){
case 0:
return cljs$core$async$mapcat_STAR__$_state_machine__37085__auto____0.call(this);
case 1:
return cljs$core$async$mapcat_STAR__$_state_machine__37085__auto____1.call(this,state_40587);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$mapcat_STAR__$_state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$mapcat_STAR__$_state_machine__37085__auto____0;
cljs$core$async$mapcat_STAR__$_state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$mapcat_STAR__$_state_machine__37085__auto____1;
return cljs$core$async$mapcat_STAR__$_state_machine__37085__auto__;
})()
})();
var state__37596__auto__ = (function (){var statearr_40636 = f__37595__auto__();
(statearr_40636[(6)] = c__37594__auto__);

return statearr_40636;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__37596__auto__);
}));

return c__37594__auto__;
});
/**
 * Deprecated - this function will be removed. Use transducer instead
 */
cljs.core.async.mapcat_LT_ = (function cljs$core$async$mapcat_LT_(var_args){
var G__40640 = arguments.length;
switch (G__40640) {
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
var G__40653 = arguments.length;
switch (G__40653) {
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
var G__40659 = arguments.length;
switch (G__40659) {
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
var c__37594__auto___41850 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__37595__auto__ = (function (){var switch__37084__auto__ = (function (state_40687){
var state_val_40688 = (state_40687[(1)]);
if((state_val_40688 === (7))){
var inst_40682 = (state_40687[(2)]);
var state_40687__$1 = state_40687;
var statearr_40696_41851 = state_40687__$1;
(statearr_40696_41851[(2)] = inst_40682);

(statearr_40696_41851[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40688 === (1))){
var inst_40664 = null;
var state_40687__$1 = (function (){var statearr_40697 = state_40687;
(statearr_40697[(7)] = inst_40664);

return statearr_40697;
})();
var statearr_40698_41852 = state_40687__$1;
(statearr_40698_41852[(2)] = null);

(statearr_40698_41852[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40688 === (4))){
var inst_40667 = (state_40687[(8)]);
var inst_40667__$1 = (state_40687[(2)]);
var inst_40668 = (inst_40667__$1 == null);
var inst_40669 = cljs.core.not(inst_40668);
var state_40687__$1 = (function (){var statearr_40699 = state_40687;
(statearr_40699[(8)] = inst_40667__$1);

return statearr_40699;
})();
if(inst_40669){
var statearr_40701_41854 = state_40687__$1;
(statearr_40701_41854[(1)] = (5));

} else {
var statearr_40702_41855 = state_40687__$1;
(statearr_40702_41855[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40688 === (6))){
var state_40687__$1 = state_40687;
var statearr_40703_41858 = state_40687__$1;
(statearr_40703_41858[(2)] = null);

(statearr_40703_41858[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40688 === (3))){
var inst_40684 = (state_40687[(2)]);
var inst_40685 = cljs.core.async.close_BANG_(out);
var state_40687__$1 = (function (){var statearr_40704 = state_40687;
(statearr_40704[(9)] = inst_40684);

return statearr_40704;
})();
return cljs.core.async.impl.ioc_helpers.return_chan(state_40687__$1,inst_40685);
} else {
if((state_val_40688 === (2))){
var state_40687__$1 = state_40687;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_40687__$1,(4),ch);
} else {
if((state_val_40688 === (11))){
var inst_40667 = (state_40687[(8)]);
var inst_40676 = (state_40687[(2)]);
var inst_40664 = inst_40667;
var state_40687__$1 = (function (){var statearr_40716 = state_40687;
(statearr_40716[(10)] = inst_40676);

(statearr_40716[(7)] = inst_40664);

return statearr_40716;
})();
var statearr_40717_41860 = state_40687__$1;
(statearr_40717_41860[(2)] = null);

(statearr_40717_41860[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40688 === (9))){
var inst_40667 = (state_40687[(8)]);
var state_40687__$1 = state_40687;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_40687__$1,(11),out,inst_40667);
} else {
if((state_val_40688 === (5))){
var inst_40667 = (state_40687[(8)]);
var inst_40664 = (state_40687[(7)]);
var inst_40671 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_40667,inst_40664);
var state_40687__$1 = state_40687;
if(inst_40671){
var statearr_40721_41861 = state_40687__$1;
(statearr_40721_41861[(1)] = (8));

} else {
var statearr_40723_41862 = state_40687__$1;
(statearr_40723_41862[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40688 === (10))){
var inst_40679 = (state_40687[(2)]);
var state_40687__$1 = state_40687;
var statearr_40724_41863 = state_40687__$1;
(statearr_40724_41863[(2)] = inst_40679);

(statearr_40724_41863[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40688 === (8))){
var inst_40664 = (state_40687[(7)]);
var tmp40720 = inst_40664;
var inst_40664__$1 = tmp40720;
var state_40687__$1 = (function (){var statearr_40725 = state_40687;
(statearr_40725[(7)] = inst_40664__$1);

return statearr_40725;
})();
var statearr_40726_41864 = state_40687__$1;
(statearr_40726_41864[(2)] = null);

(statearr_40726_41864[(1)] = (2));


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
var cljs$core$async$state_machine__37085__auto__ = null;
var cljs$core$async$state_machine__37085__auto____0 = (function (){
var statearr_40727 = [null,null,null,null,null,null,null,null,null,null,null];
(statearr_40727[(0)] = cljs$core$async$state_machine__37085__auto__);

(statearr_40727[(1)] = (1));

return statearr_40727;
});
var cljs$core$async$state_machine__37085__auto____1 = (function (state_40687){
while(true){
var ret_value__37086__auto__ = (function (){try{while(true){
var result__37087__auto__ = switch__37084__auto__(state_40687);
if(cljs.core.keyword_identical_QMARK_(result__37087__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__37087__auto__;
}
break;
}
}catch (e40728){var ex__37088__auto__ = e40728;
var statearr_40730_41869 = state_40687;
(statearr_40730_41869[(2)] = ex__37088__auto__);


if(cljs.core.seq((state_40687[(4)]))){
var statearr_40731_41870 = state_40687;
(statearr_40731_41870[(1)] = cljs.core.first((state_40687[(4)])));

} else {
throw ex__37088__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__37086__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__41871 = state_40687;
state_40687 = G__41871;
continue;
} else {
return ret_value__37086__auto__;
}
break;
}
});
cljs$core$async$state_machine__37085__auto__ = function(state_40687){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__37085__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__37085__auto____1.call(this,state_40687);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__37085__auto____0;
cljs$core$async$state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__37085__auto____1;
return cljs$core$async$state_machine__37085__auto__;
})()
})();
var state__37596__auto__ = (function (){var statearr_40732 = f__37595__auto__();
(statearr_40732[(6)] = c__37594__auto___41850);

return statearr_40732;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__37596__auto__);
}));


return out;
}));

(cljs.core.async.unique.cljs$lang$maxFixedArity = 2);

/**
 * Deprecated - this function will be removed. Use transducer instead
 */
cljs.core.async.partition = (function cljs$core$async$partition(var_args){
var G__40734 = arguments.length;
switch (G__40734) {
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
var c__37594__auto___41880 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__37595__auto__ = (function (){var switch__37084__auto__ = (function (state_40780){
var state_val_40781 = (state_40780[(1)]);
if((state_val_40781 === (7))){
var inst_40775 = (state_40780[(2)]);
var state_40780__$1 = state_40780;
var statearr_40783_41883 = state_40780__$1;
(statearr_40783_41883[(2)] = inst_40775);

(statearr_40783_41883[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40781 === (1))){
var inst_40737 = (new Array(n));
var inst_40738 = inst_40737;
var inst_40739 = (0);
var state_40780__$1 = (function (){var statearr_40784 = state_40780;
(statearr_40784[(7)] = inst_40738);

(statearr_40784[(8)] = inst_40739);

return statearr_40784;
})();
var statearr_40785_41884 = state_40780__$1;
(statearr_40785_41884[(2)] = null);

(statearr_40785_41884[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40781 === (4))){
var inst_40742 = (state_40780[(9)]);
var inst_40742__$1 = (state_40780[(2)]);
var inst_40743 = (inst_40742__$1 == null);
var inst_40744 = cljs.core.not(inst_40743);
var state_40780__$1 = (function (){var statearr_40786 = state_40780;
(statearr_40786[(9)] = inst_40742__$1);

return statearr_40786;
})();
if(inst_40744){
var statearr_40787_41886 = state_40780__$1;
(statearr_40787_41886[(1)] = (5));

} else {
var statearr_40788_41887 = state_40780__$1;
(statearr_40788_41887[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40781 === (15))){
var inst_40769 = (state_40780[(2)]);
var state_40780__$1 = state_40780;
var statearr_40789_41888 = state_40780__$1;
(statearr_40789_41888[(2)] = inst_40769);

(statearr_40789_41888[(1)] = (14));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40781 === (13))){
var state_40780__$1 = state_40780;
var statearr_40790_41889 = state_40780__$1;
(statearr_40790_41889[(2)] = null);

(statearr_40790_41889[(1)] = (14));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40781 === (6))){
var inst_40739 = (state_40780[(8)]);
var inst_40765 = (inst_40739 > (0));
var state_40780__$1 = state_40780;
if(cljs.core.truth_(inst_40765)){
var statearr_40791_41890 = state_40780__$1;
(statearr_40791_41890[(1)] = (12));

} else {
var statearr_40792_41891 = state_40780__$1;
(statearr_40792_41891[(1)] = (13));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40781 === (3))){
var inst_40777 = (state_40780[(2)]);
var state_40780__$1 = state_40780;
return cljs.core.async.impl.ioc_helpers.return_chan(state_40780__$1,inst_40777);
} else {
if((state_val_40781 === (12))){
var inst_40738 = (state_40780[(7)]);
var inst_40767 = cljs.core.vec(inst_40738);
var state_40780__$1 = state_40780;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_40780__$1,(15),out,inst_40767);
} else {
if((state_val_40781 === (2))){
var state_40780__$1 = state_40780;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_40780__$1,(4),ch);
} else {
if((state_val_40781 === (11))){
var inst_40759 = (state_40780[(2)]);
var inst_40760 = (new Array(n));
var inst_40738 = inst_40760;
var inst_40739 = (0);
var state_40780__$1 = (function (){var statearr_40793 = state_40780;
(statearr_40793[(10)] = inst_40759);

(statearr_40793[(7)] = inst_40738);

(statearr_40793[(8)] = inst_40739);

return statearr_40793;
})();
var statearr_40794_41892 = state_40780__$1;
(statearr_40794_41892[(2)] = null);

(statearr_40794_41892[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40781 === (9))){
var inst_40738 = (state_40780[(7)]);
var inst_40757 = cljs.core.vec(inst_40738);
var state_40780__$1 = state_40780;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_40780__$1,(11),out,inst_40757);
} else {
if((state_val_40781 === (5))){
var inst_40738 = (state_40780[(7)]);
var inst_40739 = (state_40780[(8)]);
var inst_40742 = (state_40780[(9)]);
var inst_40747 = (state_40780[(11)]);
var inst_40746 = (inst_40738[inst_40739] = inst_40742);
var inst_40747__$1 = (inst_40739 + (1));
var inst_40748 = (inst_40747__$1 < n);
var state_40780__$1 = (function (){var statearr_40795 = state_40780;
(statearr_40795[(12)] = inst_40746);

(statearr_40795[(11)] = inst_40747__$1);

return statearr_40795;
})();
if(cljs.core.truth_(inst_40748)){
var statearr_40796_41896 = state_40780__$1;
(statearr_40796_41896[(1)] = (8));

} else {
var statearr_40797_41898 = state_40780__$1;
(statearr_40797_41898[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40781 === (14))){
var inst_40772 = (state_40780[(2)]);
var inst_40773 = cljs.core.async.close_BANG_(out);
var state_40780__$1 = (function (){var statearr_40800 = state_40780;
(statearr_40800[(13)] = inst_40772);

return statearr_40800;
})();
var statearr_40801_41899 = state_40780__$1;
(statearr_40801_41899[(2)] = inst_40773);

(statearr_40801_41899[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40781 === (10))){
var inst_40763 = (state_40780[(2)]);
var state_40780__$1 = state_40780;
var statearr_40803_41900 = state_40780__$1;
(statearr_40803_41900[(2)] = inst_40763);

(statearr_40803_41900[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40781 === (8))){
var inst_40738 = (state_40780[(7)]);
var inst_40747 = (state_40780[(11)]);
var tmp40799 = inst_40738;
var inst_40738__$1 = tmp40799;
var inst_40739 = inst_40747;
var state_40780__$1 = (function (){var statearr_40804 = state_40780;
(statearr_40804[(7)] = inst_40738__$1);

(statearr_40804[(8)] = inst_40739);

return statearr_40804;
})();
var statearr_40805_41901 = state_40780__$1;
(statearr_40805_41901[(2)] = null);

(statearr_40805_41901[(1)] = (2));


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
var cljs$core$async$state_machine__37085__auto__ = null;
var cljs$core$async$state_machine__37085__auto____0 = (function (){
var statearr_40806 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_40806[(0)] = cljs$core$async$state_machine__37085__auto__);

(statearr_40806[(1)] = (1));

return statearr_40806;
});
var cljs$core$async$state_machine__37085__auto____1 = (function (state_40780){
while(true){
var ret_value__37086__auto__ = (function (){try{while(true){
var result__37087__auto__ = switch__37084__auto__(state_40780);
if(cljs.core.keyword_identical_QMARK_(result__37087__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__37087__auto__;
}
break;
}
}catch (e40814){var ex__37088__auto__ = e40814;
var statearr_40815_41906 = state_40780;
(statearr_40815_41906[(2)] = ex__37088__auto__);


if(cljs.core.seq((state_40780[(4)]))){
var statearr_40816_41907 = state_40780;
(statearr_40816_41907[(1)] = cljs.core.first((state_40780[(4)])));

} else {
throw ex__37088__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__37086__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__41908 = state_40780;
state_40780 = G__41908;
continue;
} else {
return ret_value__37086__auto__;
}
break;
}
});
cljs$core$async$state_machine__37085__auto__ = function(state_40780){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__37085__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__37085__auto____1.call(this,state_40780);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__37085__auto____0;
cljs$core$async$state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__37085__auto____1;
return cljs$core$async$state_machine__37085__auto__;
})()
})();
var state__37596__auto__ = (function (){var statearr_40818 = f__37595__auto__();
(statearr_40818[(6)] = c__37594__auto___41880);

return statearr_40818;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__37596__auto__);
}));


return out;
}));

(cljs.core.async.partition.cljs$lang$maxFixedArity = 3);

/**
 * Deprecated - this function will be removed. Use transducer instead
 */
cljs.core.async.partition_by = (function cljs$core$async$partition_by(var_args){
var G__40829 = arguments.length;
switch (G__40829) {
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
var c__37594__auto___41910 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__37595__auto__ = (function (){var switch__37084__auto__ = (function (state_40891){
var state_val_40894 = (state_40891[(1)]);
if((state_val_40894 === (7))){
var inst_40884 = (state_40891[(2)]);
var state_40891__$1 = state_40891;
var statearr_40895_41911 = state_40891__$1;
(statearr_40895_41911[(2)] = inst_40884);

(statearr_40895_41911[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40894 === (1))){
var inst_40842 = [];
var inst_40843 = inst_40842;
var inst_40844 = new cljs.core.Keyword("cljs.core.async","nothing","cljs.core.async/nothing",-69252123);
var state_40891__$1 = (function (){var statearr_40897 = state_40891;
(statearr_40897[(7)] = inst_40843);

(statearr_40897[(8)] = inst_40844);

return statearr_40897;
})();
var statearr_40898_41912 = state_40891__$1;
(statearr_40898_41912[(2)] = null);

(statearr_40898_41912[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40894 === (4))){
var inst_40847 = (state_40891[(9)]);
var inst_40847__$1 = (state_40891[(2)]);
var inst_40848 = (inst_40847__$1 == null);
var inst_40849 = cljs.core.not(inst_40848);
var state_40891__$1 = (function (){var statearr_40903 = state_40891;
(statearr_40903[(9)] = inst_40847__$1);

return statearr_40903;
})();
if(inst_40849){
var statearr_40904_41913 = state_40891__$1;
(statearr_40904_41913[(1)] = (5));

} else {
var statearr_40905_41914 = state_40891__$1;
(statearr_40905_41914[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40894 === (15))){
var inst_40843 = (state_40891[(7)]);
var inst_40876 = cljs.core.vec(inst_40843);
var state_40891__$1 = state_40891;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_40891__$1,(18),out,inst_40876);
} else {
if((state_val_40894 === (13))){
var inst_40871 = (state_40891[(2)]);
var state_40891__$1 = state_40891;
var statearr_40906_41915 = state_40891__$1;
(statearr_40906_41915[(2)] = inst_40871);

(statearr_40906_41915[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40894 === (6))){
var inst_40843 = (state_40891[(7)]);
var inst_40873 = inst_40843.length;
var inst_40874 = (inst_40873 > (0));
var state_40891__$1 = state_40891;
if(cljs.core.truth_(inst_40874)){
var statearr_40909_41916 = state_40891__$1;
(statearr_40909_41916[(1)] = (15));

} else {
var statearr_40916_41917 = state_40891__$1;
(statearr_40916_41917[(1)] = (16));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40894 === (17))){
var inst_40881 = (state_40891[(2)]);
var inst_40882 = cljs.core.async.close_BANG_(out);
var state_40891__$1 = (function (){var statearr_40917 = state_40891;
(statearr_40917[(10)] = inst_40881);

return statearr_40917;
})();
var statearr_40918_41918 = state_40891__$1;
(statearr_40918_41918[(2)] = inst_40882);

(statearr_40918_41918[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40894 === (3))){
var inst_40886 = (state_40891[(2)]);
var state_40891__$1 = state_40891;
return cljs.core.async.impl.ioc_helpers.return_chan(state_40891__$1,inst_40886);
} else {
if((state_val_40894 === (12))){
var inst_40843 = (state_40891[(7)]);
var inst_40862 = cljs.core.vec(inst_40843);
var state_40891__$1 = state_40891;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_40891__$1,(14),out,inst_40862);
} else {
if((state_val_40894 === (2))){
var state_40891__$1 = state_40891;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_40891__$1,(4),ch);
} else {
if((state_val_40894 === (11))){
var inst_40843 = (state_40891[(7)]);
var inst_40847 = (state_40891[(9)]);
var inst_40851 = (state_40891[(11)]);
var inst_40859 = inst_40843.push(inst_40847);
var tmp40920 = inst_40843;
var inst_40843__$1 = tmp40920;
var inst_40844 = inst_40851;
var state_40891__$1 = (function (){var statearr_40924 = state_40891;
(statearr_40924[(12)] = inst_40859);

(statearr_40924[(7)] = inst_40843__$1);

(statearr_40924[(8)] = inst_40844);

return statearr_40924;
})();
var statearr_40925_41924 = state_40891__$1;
(statearr_40925_41924[(2)] = null);

(statearr_40925_41924[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40894 === (9))){
var inst_40844 = (state_40891[(8)]);
var inst_40855 = cljs.core.keyword_identical_QMARK_(inst_40844,new cljs.core.Keyword("cljs.core.async","nothing","cljs.core.async/nothing",-69252123));
var state_40891__$1 = state_40891;
var statearr_40928_41925 = state_40891__$1;
(statearr_40928_41925[(2)] = inst_40855);

(statearr_40928_41925[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40894 === (5))){
var inst_40847 = (state_40891[(9)]);
var inst_40851 = (state_40891[(11)]);
var inst_40844 = (state_40891[(8)]);
var inst_40852 = (state_40891[(13)]);
var inst_40851__$1 = (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(inst_40847) : f.call(null,inst_40847));
var inst_40852__$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_40851__$1,inst_40844);
var state_40891__$1 = (function (){var statearr_40931 = state_40891;
(statearr_40931[(11)] = inst_40851__$1);

(statearr_40931[(13)] = inst_40852__$1);

return statearr_40931;
})();
if(inst_40852__$1){
var statearr_40932_41934 = state_40891__$1;
(statearr_40932_41934[(1)] = (8));

} else {
var statearr_40933_41935 = state_40891__$1;
(statearr_40933_41935[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40894 === (14))){
var inst_40847 = (state_40891[(9)]);
var inst_40851 = (state_40891[(11)]);
var inst_40864 = (state_40891[(2)]);
var inst_40867 = [];
var inst_40868 = inst_40867.push(inst_40847);
var inst_40843 = inst_40867;
var inst_40844 = inst_40851;
var state_40891__$1 = (function (){var statearr_40936 = state_40891;
(statearr_40936[(14)] = inst_40864);

(statearr_40936[(15)] = inst_40868);

(statearr_40936[(7)] = inst_40843);

(statearr_40936[(8)] = inst_40844);

return statearr_40936;
})();
var statearr_40937_41940 = state_40891__$1;
(statearr_40937_41940[(2)] = null);

(statearr_40937_41940[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40894 === (16))){
var state_40891__$1 = state_40891;
var statearr_40939_41944 = state_40891__$1;
(statearr_40939_41944[(2)] = null);

(statearr_40939_41944[(1)] = (17));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40894 === (10))){
var inst_40857 = (state_40891[(2)]);
var state_40891__$1 = state_40891;
if(cljs.core.truth_(inst_40857)){
var statearr_40940_41945 = state_40891__$1;
(statearr_40940_41945[(1)] = (11));

} else {
var statearr_40941_41946 = state_40891__$1;
(statearr_40941_41946[(1)] = (12));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40894 === (18))){
var inst_40878 = (state_40891[(2)]);
var state_40891__$1 = state_40891;
var statearr_40943_41950 = state_40891__$1;
(statearr_40943_41950[(2)] = inst_40878);

(statearr_40943_41950[(1)] = (17));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_40894 === (8))){
var inst_40852 = (state_40891[(13)]);
var state_40891__$1 = state_40891;
var statearr_40950_41957 = state_40891__$1;
(statearr_40950_41957[(2)] = inst_40852);

(statearr_40950_41957[(1)] = (10));


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
var cljs$core$async$state_machine__37085__auto__ = null;
var cljs$core$async$state_machine__37085__auto____0 = (function (){
var statearr_40951 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_40951[(0)] = cljs$core$async$state_machine__37085__auto__);

(statearr_40951[(1)] = (1));

return statearr_40951;
});
var cljs$core$async$state_machine__37085__auto____1 = (function (state_40891){
while(true){
var ret_value__37086__auto__ = (function (){try{while(true){
var result__37087__auto__ = switch__37084__auto__(state_40891);
if(cljs.core.keyword_identical_QMARK_(result__37087__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__37087__auto__;
}
break;
}
}catch (e40958){var ex__37088__auto__ = e40958;
var statearr_40959_41958 = state_40891;
(statearr_40959_41958[(2)] = ex__37088__auto__);


if(cljs.core.seq((state_40891[(4)]))){
var statearr_40960_41959 = state_40891;
(statearr_40960_41959[(1)] = cljs.core.first((state_40891[(4)])));

} else {
throw ex__37088__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__37086__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__41966 = state_40891;
state_40891 = G__41966;
continue;
} else {
return ret_value__37086__auto__;
}
break;
}
});
cljs$core$async$state_machine__37085__auto__ = function(state_40891){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__37085__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__37085__auto____1.call(this,state_40891);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__37085__auto____0;
cljs$core$async$state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__37085__auto____1;
return cljs$core$async$state_machine__37085__auto__;
})()
})();
var state__37596__auto__ = (function (){var statearr_40961 = f__37595__auto__();
(statearr_40961[(6)] = c__37594__auto___41910);

return statearr_40961;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__37596__auto__);
}));


return out;
}));

(cljs.core.async.partition_by.cljs$lang$maxFixedArity = 3);


//# sourceMappingURL=cljs.core.async.js.map
