goog.provide('missionary.impl.Buffer');


/**
* @constructor
 * @implements {cljs.core.IFn}
 * @implements {cljs.core.IDeref}
*/
missionary.impl.Buffer.Process = (function (notifier,terminator,iterator,buffer,failed,size,push,pull,busy,done){
this.notifier = notifier;
this.terminator = terminator;
this.iterator = iterator;
this.buffer = buffer;
this.failed = failed;
this.size = size;
this.push = push;
this.pull = pull;
this.busy = busy;
this.done = done;
this.cljs$lang$protocol_mask$partition0$ = 32769;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(missionary.impl.Buffer.Process.prototype.call = (function (unused__11818__auto__){
var self__ = this;
var self__ = this;
var G__57378 = (arguments.length - (1));
switch (G__57378) {
case (0):
return self__.cljs$core$IFn$_invoke$arity$0();

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((arguments.length - (1)))].join('')));

}
}));

(missionary.impl.Buffer.Process.prototype.apply = (function (self__,args57377){
var self__ = this;
var self____$1 = this;
return self____$1.call.apply(self____$1,[self____$1].concat(cljs.core.aclone(args57377)));
}));

(missionary.impl.Buffer.Process.prototype.cljs$core$IFn$_invoke$arity$0 = (function (){
var self__ = this;
var ps = this;
return (missionary.impl.Buffer.kill.cljs$core$IFn$_invoke$arity$1 ? missionary.impl.Buffer.kill.cljs$core$IFn$_invoke$arity$1(ps) : missionary.impl.Buffer.kill.call(null,ps));
}));

(missionary.impl.Buffer.Process.prototype.cljs$core$IDeref$_deref$arity$1 = (function (ps){
var self__ = this;
var ps__$1 = this;
return (missionary.impl.Buffer.transfer.cljs$core$IFn$_invoke$arity$1 ? missionary.impl.Buffer.transfer.cljs$core$IFn$_invoke$arity$1(ps__$1) : missionary.impl.Buffer.transfer.call(null,ps__$1));
}));

(missionary.impl.Buffer.Process.getBasis = (function (){
return new cljs.core.PersistentVector(null, 10, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"notifier","notifier",1670358652,null),new cljs.core.Symbol(null,"terminator","terminator",-1051388676,null),new cljs.core.Symbol(null,"iterator","iterator",-32550441,null),new cljs.core.Symbol(null,"buffer","buffer",-2037140571,null),cljs.core.with_meta(new cljs.core.Symbol(null,"failed","failed",243105765,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"number","number",-1084057331,null)], null)),cljs.core.with_meta(new cljs.core.Symbol(null,"size","size",-1555742762,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"number","number",-1084057331,null)], null)),cljs.core.with_meta(new cljs.core.Symbol(null,"push","push",-1854644502,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"number","number",-1084057331,null)], null)),cljs.core.with_meta(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"number","number",-1084057331,null)], null)),cljs.core.with_meta(new cljs.core.Symbol(null,"busy","busy",1312244726,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"boolean","boolean",-278886877,null)], null)),cljs.core.with_meta(new cljs.core.Symbol(null,"done","done",750687339,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"boolean","boolean",-278886877,null)], null))], null);
}));

(missionary.impl.Buffer.Process.cljs$lang$type = true);

(missionary.impl.Buffer.Process.cljs$lang$ctorStr = "missionary.impl.Buffer/Process");

(missionary.impl.Buffer.Process.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"missionary.impl.Buffer/Process");
}));

/**
 * Positional factory function for missionary.impl.Buffer/Process.
 */
missionary.impl.Buffer.__GT_Process = (function missionary$impl$Buffer$__GT_Process(notifier,terminator,iterator,buffer,failed,size,push,pull,busy,done){
return (new missionary.impl.Buffer.Process(notifier,terminator,iterator,buffer,failed,size,push,pull,busy,done));
});

missionary.impl.Buffer.more = (function missionary$impl$Buffer$more(ps){
var buffer = ps.buffer;
var cb = null;
while(true){
if(cljs.core.truth_((ps.busy = cljs.core.not(ps.busy)))){
var i = ps.push;
var s = ps.size;
(ps.push = ((i + (1)) % buffer.length));

var cb__$1 = (((s === (0)))?(cljs.core.truth_(ps.done)?ps.terminator:ps.notifier):cb);
if(cljs.core.truth_(ps.done)){
(buffer[i] = ps);
} else {
try{(buffer[i] = cljs.core.deref(ps.iterator));
}catch (e57442){var e_57628 = e57442;
(ps.failed = i);

(buffer[i] = e_57628);
}}

if(((ps.size = (s + (1))) === buffer.length)){
return cb__$1;
} else {
var G__57631 = cb__$1;
cb = G__57631;
continue;
}
} else {
return cb;
}
break;
}
});
missionary.impl.Buffer.transfer = (function missionary$impl$Buffer$transfer(ps){
var buffer = ps.buffer;
var i = ps.pull;
var s = ps.size;
var n = ((i + (1)) % buffer.length);
var f = (i === ps.failed);
var x = (buffer[i]);
(buffer[i] = null);

(ps.pull = n);

(ps.size = (s - (1)));

var cb_57635 = (((s === buffer.length))?missionary.impl.Buffer.more(ps):null);
var temp__5808__auto___57637 = (((s === (1)))?cb_57635:((((buffer[n]) === ps))?ps.terminator:ps.notifier));
if((temp__5808__auto___57637 == null)){
} else {
var cb_57640__$1 = temp__5808__auto___57637;
(cb_57640__$1.cljs$core$IFn$_invoke$arity$0 ? cb_57640__$1.cljs$core$IFn$_invoke$arity$0() : cb_57640__$1.call(null));
}

if(f){
throw x;
} else {
return x;
}
});
missionary.impl.Buffer.kill = (function missionary$impl$Buffer$kill(ps){
var fexpr__57541 = ps.iterator;
return (fexpr__57541.cljs$core$IFn$_invoke$arity$0 ? fexpr__57541.cljs$core$IFn$_invoke$arity$0() : fexpr__57541.call(null));
});

/**
* @constructor
 * @implements {cljs.core.IFn}
*/
missionary.impl.Buffer.Flow = (function (capacity,input){
this.capacity = capacity;
this.input = input;
this.cljs$lang$protocol_mask$partition0$ = 1;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(missionary.impl.Buffer.Flow.prototype.call = (function (unused__11818__auto__){
var self__ = this;
var self__ = this;
var G__57552 = (arguments.length - (1));
switch (G__57552) {
case (2):
return self__.cljs$core$IFn$_invoke$arity$2((arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((arguments.length - (1)))].join('')));

}
}));

(missionary.impl.Buffer.Flow.prototype.apply = (function (self__,args57549){
var self__ = this;
var self____$1 = this;
return self____$1.call.apply(self____$1,[self____$1].concat(cljs.core.aclone(args57549)));
}));

(missionary.impl.Buffer.Flow.prototype.cljs$core$IFn$_invoke$arity$2 = (function (n,t){
var self__ = this;
var _ = this;
var ps = missionary.impl.Buffer.__GT_Process(n,t,null,cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(self__.capacity),(-1),(0),(0),(0),true,false);
(ps.iterator = (function (){var G__57557 = (function (){
var temp__5808__auto__ = missionary.impl.Buffer.more(ps);
if((temp__5808__auto__ == null)){
return null;
} else {
var cb = temp__5808__auto__;
return (cb.cljs$core$IFn$_invoke$arity$0 ? cb.cljs$core$IFn$_invoke$arity$0() : cb.call(null));
}
});
var G__57558 = (function (){
(ps.done = true);

var temp__5808__auto__ = missionary.impl.Buffer.more(ps);
if((temp__5808__auto__ == null)){
return null;
} else {
var cb = temp__5808__auto__;
return (cb.cljs$core$IFn$_invoke$arity$0 ? cb.cljs$core$IFn$_invoke$arity$0() : cb.call(null));
}
});
return (self__.input.cljs$core$IFn$_invoke$arity$2 ? self__.input.cljs$core$IFn$_invoke$arity$2(G__57557,G__57558) : self__.input.call(null,G__57557,G__57558));
})());

var temp__5808__auto___57651 = missionary.impl.Buffer.more(ps);
if((temp__5808__auto___57651 == null)){
} else {
var cb_57655 = temp__5808__auto___57651;
(cb_57655.cljs$core$IFn$_invoke$arity$0 ? cb_57655.cljs$core$IFn$_invoke$arity$0() : cb_57655.call(null));
}

return ps;
}));

(missionary.impl.Buffer.Flow.getBasis = (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"capacity","capacity",1713221261,null),new cljs.core.Symbol(null,"input","input",-2097503808,null)], null);
}));

(missionary.impl.Buffer.Flow.cljs$lang$type = true);

(missionary.impl.Buffer.Flow.cljs$lang$ctorStr = "missionary.impl.Buffer/Flow");

(missionary.impl.Buffer.Flow.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"missionary.impl.Buffer/Flow");
}));

/**
 * Positional factory function for missionary.impl.Buffer/Flow.
 */
missionary.impl.Buffer.__GT_Flow = (function missionary$impl$Buffer$__GT_Flow(capacity,input){
return (new missionary.impl.Buffer.Flow(capacity,input));
});

missionary.impl.Buffer.flow = missionary.impl.Buffer.__GT_Flow;

//# sourceMappingURL=missionary.impl.Buffer.js.map
