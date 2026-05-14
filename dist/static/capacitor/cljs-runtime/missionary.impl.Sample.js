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
var G__56838 = (arguments.length - (1));
switch (G__56838) {
case (0):
return self__.cljs$core$IFn$_invoke$arity$0();

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((arguments.length - (1)))].join('')));

}
}));

(missionary.impl.Sample.Process.prototype.apply = (function (self__,args56837){
var self__ = this;
var self____$1 = this;
return self____$1.call.apply(self____$1,[self____$1].concat(cljs.core.aclone(args56837)));
}));

(missionary.impl.Sample.Process.prototype.cljs$core$IFn$_invoke$arity$0 = (function (){
var self__ = this;
var _ = this;
var n__5593__auto__ = self__.inputs.length;
var i = (0);
while(true){
if((i < n__5593__auto__)){
var fexpr__56850_57068 = (self__.inputs[i]);
(fexpr__56850_57068.cljs$core$IFn$_invoke$arity$0 ? fexpr__56850_57068.cljs$core$IFn$_invoke$arity$0() : fexpr__56850_57068.call(null));

var G__57069 = (i + (1));
i = G__57069;
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
var n__5593__auto___57076 = sampled;
var i_57077 = (0);
while(true){
if((i_57077 < n__5593__auto___57076)){
var input_57078 = (inputs[i_57077]);
(input_57078.cljs$core$IFn$_invoke$arity$0 ? input_57078.cljs$core$IFn$_invoke$arity$0() : input_57078.call(null));

if(((args[i_57077]) === args)){
try{cljs.core.deref(input_57078);
}catch (e56891){var __57081 = e56891;
}} else {
(args[i_57077] = args);
}

var G__57082 = (i_57077 + (1));
i_57077 = G__57082;
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
}catch (e56896){var __57085 = e56896;
}
var G__57086 = cb;
cb = G__57086;
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

var n__5593__auto___57088 = sampled;
var i_57091 = (0);
while(true){
if((i_57091 < n__5593__auto___57088)){
if(((args[i_57091]) === args)){
var input_57093 = (inputs[i_57091]);
while(true){
(args[i_57091] = null);

var x_57095 = cljs.core.deref(input_57093);
if(((args[i_57091]) === args)){
continue;
} else {
(args[i_57091] = x_57095);
}
break;
}
} else {
}

var G__57097 = (i_57091 + (1));
i_57091 = G__57097;
continue;
} else {
}
break;
}
}catch (e56911){var e_57098 = e56911;
try{cljs.core.deref(sampler);
}catch (e56912){var __57100 = e56912;
}
throw e_57098;
}
(args[sampled] = cljs.core.deref(sampler));

return c.apply(null,args);
}catch (e56907){var e = e56907;
(ps.notifier = null);

(sampler.cljs$core$IFn$_invoke$arity$0 ? sampler.cljs$core$IFn$_invoke$arity$0() : sampler.call(null));

(args[sampled] = args);

return e;
}})();
var temp__5808__auto___57102 = missionary.impl.Sample.ready(ps);
if((temp__5808__auto___57102 == null)){
} else {
var cb_57104 = temp__5808__auto___57102;
(cb_57104.cljs$core$IFn$_invoke$arity$0 ? cb_57104.cljs$core$IFn$_invoke$arity$0() : cb_57104.call(null));
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
}catch (e56980){var _ = e56980;
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
var fexpr__57007 = ps.terminator;
return (fexpr__57007.cljs$core$IFn$_invoke$arity$0 ? fexpr__57007.cljs$core$IFn$_invoke$arity$0() : fexpr__57007.call(null));
} else {
return null;
}
});
var index_57106 = (0);
var flow_57107 = f;
while(true){
if(cljs.core.truth_(it.hasNext())){
(inputs[index_57106] = (function (){var G__57021 = ((function (index_57106,flow_57107,it,arity,args,inputs,ps,done){
return (function (){
return missionary.impl.Sample.dirty(ps,index_57106);
});})(index_57106,flow_57107,it,arity,args,inputs,ps,done))
;
var G__57022 = done;
return (flow_57107.cljs$core$IFn$_invoke$arity$2 ? flow_57107.cljs$core$IFn$_invoke$arity$2(G__57021,G__57022) : flow_57107.call(null,G__57021,G__57022));
})());

if(((args[index_57106]) == null)){
(ps.combinator = null);
} else {
}

var G__57108 = (index_57106 + (1));
var G__57109 = it.next();
index_57106 = G__57108;
flow_57107 = G__57109;
continue;
} else {
(inputs[index_57106] = (function (){var G__57030 = ((function (index_57106,flow_57107,it,arity,args,inputs,ps,done){
return (function (){
var temp__5808__auto__ = missionary.impl.Sample.ready(ps);
if((temp__5808__auto__ == null)){
return null;
} else {
var cb = temp__5808__auto__;
return (cb.cljs$core$IFn$_invoke$arity$0 ? cb.cljs$core$IFn$_invoke$arity$0() : cb.call(null));
}
});})(index_57106,flow_57107,it,arity,args,inputs,ps,done))
;
var G__57031 = ((function (index_57106,flow_57107,G__57030,it,arity,args,inputs,ps,done){
return (function (){
(ps.done = true);

var temp__5808__auto__ = missionary.impl.Sample.ready(ps);
if((temp__5808__auto__ == null)){
return null;
} else {
var cb = temp__5808__auto__;
return (cb.cljs$core$IFn$_invoke$arity$0 ? cb.cljs$core$IFn$_invoke$arity$0() : cb.call(null));
}
});})(index_57106,flow_57107,G__57030,it,arity,args,inputs,ps,done))
;
return (flow_57107.cljs$core$IFn$_invoke$arity$2 ? flow_57107.cljs$core$IFn$_invoke$arity$2(G__57030,G__57031) : flow_57107.call(null,G__57030,G__57031));
})());
}
break;
}

return ps;
});

//# sourceMappingURL=missionary.impl.Sample.js.map
