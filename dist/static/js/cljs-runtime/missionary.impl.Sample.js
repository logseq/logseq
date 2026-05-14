goog.provide('missionary.impl.Sample');

/**
* @constructor
 * @implements {cljs.core.IFn}
 * @implements {cljs.core.IDeref}
*/
missionary.impl.Sample.Process = (function (combinator,notifier,terminator,args,inputs,busy,done,alive){
this.combinator = combinator;
this.notifier = notifier;
this.terminator = terminator;
this.args = args;
this.inputs = inputs;
this.busy = busy;
this.done = done;
this.alive = alive;
this.cljs$lang$protocol_mask$partition0$ = 32769;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(missionary.impl.Sample.Process.prototype.call = (function (unused__11818__auto__){
var self__ = this;
var self__ = this;
var G__43361 = (arguments.length - (1));
switch (G__43361) {
case (0):
return self__.cljs$core$IFn$_invoke$arity$0();

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((arguments.length - (1)))].join('')));

}
}));

(missionary.impl.Sample.Process.prototype.apply = (function (self__,args43358){
var self__ = this;
var self____$1 = this;
return self____$1.call.apply(self____$1,[self____$1].concat(cljs.core.aclone(args43358)));
}));

(missionary.impl.Sample.Process.prototype.cljs$core$IFn$_invoke$arity$0 = (function (){
var self__ = this;
var _ = this;
var n__5593__auto__ = self__.inputs.length;
var i = (0);
while(true){
if((i < n__5593__auto__)){
var fexpr__43367_43440 = (self__.inputs[i]);
(fexpr__43367_43440.cljs$core$IFn$_invoke$arity$0 ? fexpr__43367_43440.cljs$core$IFn$_invoke$arity$0() : fexpr__43367_43440.call(null));

var G__43442 = (i + (1));
i = G__43442;
continue;
} else {
return null;
}
break;
}
}));

(missionary.impl.Sample.Process.prototype.cljs$core$IDeref$_deref$arity$1 = (function (p){
var self__ = this;
var p__$1 = this;
return (missionary.impl.Sample.transfer.cljs$core$IFn$_invoke$arity$1 ? missionary.impl.Sample.transfer.cljs$core$IFn$_invoke$arity$1(p__$1) : missionary.impl.Sample.transfer.call(null,p__$1));
}));

(missionary.impl.Sample.Process.getBasis = (function (){
return new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"combinator","combinator",-746639828,null),new cljs.core.Symbol(null,"notifier","notifier",1670358652,null),new cljs.core.Symbol(null,"terminator","terminator",-1051388676,null),new cljs.core.Symbol(null,"args","args",-1338879193,null),new cljs.core.Symbol(null,"inputs","inputs",-1788631911,null),cljs.core.with_meta(new cljs.core.Symbol(null,"busy","busy",1312244726,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"boolean","boolean",-278886877,null)], null)),cljs.core.with_meta(new cljs.core.Symbol(null,"done","done",750687339,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"boolean","boolean",-278886877,null)], null)),cljs.core.with_meta(new cljs.core.Symbol(null,"alive","alive",-1229505839,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"number","number",-1084057331,null)], null))], null);
}));

(missionary.impl.Sample.Process.cljs$lang$type = true);

(missionary.impl.Sample.Process.cljs$lang$ctorStr = "missionary.impl.Sample/Process");

(missionary.impl.Sample.Process.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"missionary.impl.Sample/Process");
}));

/**
 * Positional factory function for missionary.impl.Sample/Process.
 */
missionary.impl.Sample.__GT_Process = (function missionary$impl$Sample$__GT_Process(combinator,notifier,terminator,args,inputs,busy,done,alive){
return (new missionary.impl.Sample.Process(combinator,notifier,terminator,args,inputs,busy,done,alive));
});

missionary.impl.Sample.ready = (function missionary$impl$Sample$ready(ps){
var args = ps.args;
var inputs = ps.inputs;
var sampled = (inputs.length - (1));
var cb = null;
while(true){
if(cljs.core.truth_((ps.busy = cljs.core.not(ps.busy)))){
if(cljs.core.truth_(ps.done)){
var n__5593__auto___43450 = sampled;
var i_43451 = (0);
while(true){
if((i_43451 < n__5593__auto___43450)){
var input_43453 = (inputs[i_43451]);
(input_43453.cljs$core$IFn$_invoke$arity$0 ? input_43453.cljs$core$IFn$_invoke$arity$0() : input_43453.call(null));

if(((args[i_43451]) === args)){
try{cljs.core.deref(input_43453);
}catch (e43400){var __43454 = e43400;
}} else {
(args[i_43451] = args);
}

var G__43455 = (i_43451 + (1));
i_43451 = G__43455;
continue;
} else {
}
break;
}

if(((ps.alive = (ps.alive - (1))) === (0))){
return ps.terminator;
} else {
return null;
}
} else {
if(((args[sampled]) === args)){
try{cljs.core.deref((inputs[sampled]));
}catch (e43402){var __43457 = e43402;
}
var G__43458 = cb;
cb = G__43458;
continue;
} else {
return ps.notifier;
}
}
} else {
return cb;
}
break;
}
});
missionary.impl.Sample.transfer = (function missionary$impl$Sample$transfer(ps){
var c = ps.combinator;
var args = ps.args;
var inputs = ps.inputs;
var sampled = (inputs.length - (1));
var sampler = (inputs[sampled]);
var x = (function (){try{try{if((c == null)){
throw (new Error("Undefined continuous flow."));
} else {
}

var n__5593__auto___43459 = sampled;
var i_43460 = (0);
while(true){
if((i_43460 < n__5593__auto___43459)){
if(((args[i_43460]) === args)){
var input_43461 = (inputs[i_43460]);
while(true){
(args[i_43460] = null);

var x_43462 = cljs.core.deref(input_43461);
if(((args[i_43460]) === args)){
continue;
} else {
(args[i_43460] = x_43462);
}
break;
}
} else {
}

var G__43464 = (i_43460 + (1));
i_43460 = G__43464;
continue;
} else {
}
break;
}
}catch (e43408){var e_43465 = e43408;
try{cljs.core.deref(sampler);
}catch (e43409){var __43466 = e43409;
}
throw e_43465;
}
(args[sampled] = cljs.core.deref(sampler));

return c.apply(null,args);
}catch (e43406){var e = e43406;
(ps.notifier = null);

(sampler.cljs$core$IFn$_invoke$arity$0 ? sampler.cljs$core$IFn$_invoke$arity$0() : sampler.call(null));

(args[sampled] = args);

return e;
}})();
var temp__5808__auto___43467 = missionary.impl.Sample.ready(ps);
if((temp__5808__auto___43467 == null)){
} else {
var cb_43468 = temp__5808__auto___43467;
(cb_43468.cljs$core$IFn$_invoke$arity$0 ? cb_43468.cljs$core$IFn$_invoke$arity$0() : cb_43468.call(null));
}

if((ps.notifier == null)){
throw x;
} else {
return x;
}
});
missionary.impl.Sample.dirty = (function missionary$impl$Sample$dirty(p,i){
var args = p.args;
if(((args[i]) === args)){
try{return cljs.core.deref((p.inputs[i]));
}catch (e43417){var _ = e43417;
return null;
}} else {
return (args[i] = args);
}
});
missionary.impl.Sample.run = (function missionary$impl$Sample$run(c,f,fs,n,t){
var it = cljs.core.iter(fs);
var arity = (cljs.core.count(fs) + (1));
var args = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(arity);
var inputs = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(arity);
var ps = missionary.impl.Sample.__GT_Process(c,n,t,args,inputs,false,false,arity);
var done = (function (){
if(((ps.alive = (ps.alive - (1))) === (0))){
var fexpr__43425 = ps.terminator;
return (fexpr__43425.cljs$core$IFn$_invoke$arity$0 ? fexpr__43425.cljs$core$IFn$_invoke$arity$0() : fexpr__43425.call(null));
} else {
return null;
}
});
var index_43470 = (0);
var flow_43471 = f;
while(true){
if(cljs.core.truth_(it.hasNext())){
(inputs[index_43470] = (function (){var G__43432 = ((function (index_43470,flow_43471,it,arity,args,inputs,ps,done){
return (function (){
return missionary.impl.Sample.dirty(ps,index_43470);
});})(index_43470,flow_43471,it,arity,args,inputs,ps,done))
;
var G__43433 = done;
return (flow_43471.cljs$core$IFn$_invoke$arity$2 ? flow_43471.cljs$core$IFn$_invoke$arity$2(G__43432,G__43433) : flow_43471.call(null,G__43432,G__43433));
})());

if(((args[index_43470]) == null)){
(ps.combinator = null);
} else {
}

var G__43475 = (index_43470 + (1));
var G__43476 = it.next();
index_43470 = G__43475;
flow_43471 = G__43476;
continue;
} else {
(inputs[index_43470] = (function (){var G__43435 = ((function (index_43470,flow_43471,it,arity,args,inputs,ps,done){
return (function (){
var temp__5808__auto__ = missionary.impl.Sample.ready(ps);
if((temp__5808__auto__ == null)){
return null;
} else {
var cb = temp__5808__auto__;
return (cb.cljs$core$IFn$_invoke$arity$0 ? cb.cljs$core$IFn$_invoke$arity$0() : cb.call(null));
}
});})(index_43470,flow_43471,it,arity,args,inputs,ps,done))
;
var G__43436 = ((function (index_43470,flow_43471,G__43435,it,arity,args,inputs,ps,done){
return (function (){
(ps.done = true);

var temp__5808__auto__ = missionary.impl.Sample.ready(ps);
if((temp__5808__auto__ == null)){
return null;
} else {
var cb = temp__5808__auto__;
return (cb.cljs$core$IFn$_invoke$arity$0 ? cb.cljs$core$IFn$_invoke$arity$0() : cb.call(null));
}
});})(index_43470,flow_43471,G__43435,it,arity,args,inputs,ps,done))
;
return (flow_43471.cljs$core$IFn$_invoke$arity$2 ? flow_43471.cljs$core$IFn$_invoke$arity$2(G__43435,G__43436) : flow_43471.call(null,G__43435,G__43436));
})());
}
break;
}

return ps;
});

//# sourceMappingURL=missionary.impl.Sample.js.map
