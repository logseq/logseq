goog.provide('missionary.impl.Zip');


/**
* @constructor
 * @implements {cljs.core.IFn}
 * @implements {cljs.core.IDeref}
*/
missionary.impl.Zip.Process = (function (combine,step,done,inputs,pending){
this.combine = combine;
this.step = step;
this.done = done;
this.inputs = inputs;
this.pending = pending;
this.cljs$lang$protocol_mask$partition0$ = 32769;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(missionary.impl.Zip.Process.prototype.call = (function (unused__11818__auto__){
var self__ = this;
var self__ = this;
var G__43977 = (arguments.length - (1));
switch (G__43977) {
case (0):
return self__.cljs$core$IFn$_invoke$arity$0();

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((arguments.length - (1)))].join('')));

}
}));

(missionary.impl.Zip.Process.prototype.apply = (function (self__,args43973){
var self__ = this;
var self____$1 = this;
return self____$1.call.apply(self____$1,[self____$1].concat(cljs.core.aclone(args43973)));
}));

(missionary.impl.Zip.Process.prototype.cljs$core$IFn$_invoke$arity$0 = (function (){
var self__ = this;
var z = this;
return (missionary.impl.Zip.cancel.cljs$core$IFn$_invoke$arity$1 ? missionary.impl.Zip.cancel.cljs$core$IFn$_invoke$arity$1(z) : missionary.impl.Zip.cancel.call(null,z));
}));

(missionary.impl.Zip.Process.prototype.cljs$core$IDeref$_deref$arity$1 = (function (z){
var self__ = this;
var z__$1 = this;
return (missionary.impl.Zip.transfer.cljs$core$IFn$_invoke$arity$1 ? missionary.impl.Zip.transfer.cljs$core$IFn$_invoke$arity$1(z__$1) : missionary.impl.Zip.transfer.call(null,z__$1));
}));

(missionary.impl.Zip.Process.getBasis = (function (){
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"combine","combine",207448214,null),new cljs.core.Symbol(null,"step","step",-1365547645,null),new cljs.core.Symbol(null,"done","done",750687339,null),new cljs.core.Symbol(null,"inputs","inputs",-1788631911,null),cljs.core.with_meta(new cljs.core.Symbol(null,"pending","pending",1420494800,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"number","number",-1084057331,null)], null))], null);
}));

(missionary.impl.Zip.Process.cljs$lang$type = true);

(missionary.impl.Zip.Process.cljs$lang$ctorStr = "missionary.impl.Zip/Process");

(missionary.impl.Zip.Process.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"missionary.impl.Zip/Process");
}));

/**
 * Positional factory function for missionary.impl.Zip/Process.
 */
missionary.impl.Zip.__GT_Process = (function missionary$impl$Zip$__GT_Process(combine,step,done,inputs,pending){
return (new missionary.impl.Zip.Process(combine,step,done,inputs,pending));
});

missionary.impl.Zip.ready = (function missionary$impl$Zip$ready(ps){
var temp__5806__auto__ = ps.step;
if((temp__5806__auto__ == null)){
var inputs = ps.inputs;
var arity = inputs.length;
var i = (0);
var c = (0);
while(true){
if((i < arity)){
var input = (inputs[i]);
if((input === ps)){
var G__44048 = (i + (1));
var G__44049 = c;
i = G__44048;
c = G__44049;
continue;
} else {
try{cljs.core.deref(input);
}catch (e44009){var __44050 = e44009;
}
var G__44051 = (i + (1));
var G__44052 = (c + (1));
i = G__44051;
c = G__44052;
continue;
}
} else {
var p = (ps.pending = (ps.pending + c));
if((c === (0))){
var fexpr__44011 = ps.done;
return (fexpr__44011.cljs$core$IFn$_invoke$arity$0 ? fexpr__44011.cljs$core$IFn$_invoke$arity$0() : fexpr__44011.call(null));
} else {
if((p === (0))){
return (missionary.impl.Zip.ready.cljs$core$IFn$_invoke$arity$1 ? missionary.impl.Zip.ready.cljs$core$IFn$_invoke$arity$1(ps) : missionary.impl.Zip.ready.call(null,ps));
} else {
return null;
}
}
}
break;
}
} else {
var s = temp__5806__auto__;
return (s.cljs$core$IFn$_invoke$arity$0 ? s.cljs$core$IFn$_invoke$arity$0() : s.call(null));
}
});
missionary.impl.Zip.cancel = (function missionary$impl$Zip$cancel(ps){
var inputs = ps.inputs;
var n__5593__auto__ = inputs.length;
var i = (0);
while(true){
if((i < n__5593__auto__)){
var input_44053 = (inputs[i]);
if((input_44053 === ps)){
} else {
(input_44053.cljs$core$IFn$_invoke$arity$0 ? input_44053.cljs$core$IFn$_invoke$arity$0() : input_44053.call(null));
}

var G__44054 = (i + (1));
i = G__44054;
continue;
} else {
return null;
}
break;
}
});
missionary.impl.Zip.transfer = (function missionary$impl$Zip$transfer(ps){
var c = cljs.core.volatile_BANG_((0));
var inputs = ps.inputs;
var arity = inputs.length;
var buffer = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(arity);
try{var n__5593__auto___44055 = arity;
var i_44056 = (0);
while(true){
if((i_44056 < n__5593__auto___44055)){
c.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,(c.cljs$core$IDeref$_deref$arity$1(null) + (1)));

(buffer[i_44056] = cljs.core.deref((inputs[i_44056])));

var G__44057 = (i_44056 + (1));
i_44056 = G__44057;
continue;
} else {
}
break;
}

return ps.combine.apply(null,buffer);
}catch (e44039){var e = e44039;
(ps.step = null);

throw e;
}finally {var p_44058 = (ps.pending = (ps.pending + cljs.core.deref(c)));
if((ps.step == null)){
missionary.impl.Zip.cancel(ps);
} else {
}

if((p_44058 === (0))){
missionary.impl.Zip.ready(ps);
} else {
}
}});
missionary.impl.Zip.run = (function missionary$impl$Zip$run(f,fs,s,d){
var arity = cljs.core.count(fs);
var inputs = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(arity);
var ps = missionary.impl.Zip.__GT_Process(f,s,d,inputs,(0));
var it = cljs.core.iter(fs);
var i_44059 = (0);
while(true){
var input_44060 = (function (){var G__44043 = ((function (i_44059,arity,inputs,ps,it){
return (function (){
var p = (ps.pending = (ps.pending - (1)));
if((p === (0))){
return missionary.impl.Zip.ready(ps);
} else {
return null;
}
});})(i_44059,arity,inputs,ps,it))
;
var G__44044 = ((function (i_44059,G__44043,arity,inputs,ps,it){
return (function (){
(ps.inputs[i_44059] = ps);

(ps.step = null);

var p = (ps.pending = (ps.pending - (1)));
if((p < (0))){
} else {
missionary.impl.Zip.cancel(ps);
}

if((p === (0))){
return missionary.impl.Zip.ready(ps);
} else {
return null;
}
});})(i_44059,G__44043,arity,inputs,ps,it))
;
var fexpr__44042 = it.next();
return (fexpr__44042.cljs$core$IFn$_invoke$arity$2 ? fexpr__44042.cljs$core$IFn$_invoke$arity$2(G__44043,G__44044) : fexpr__44042.call(null,G__44043,G__44044));
})();
if(((inputs[i_44059]) == null)){
(inputs[i_44059] = input_44060);
} else {
}

if(cljs.core.truth_(it.hasNext())){
var G__44061 = (i_44059 + (1));
i_44059 = G__44061;
continue;
} else {
}
break;
}

var p = (ps.pending = (ps.pending + arity));
if((ps.step == null)){
missionary.impl.Zip.cancel(ps);
} else {
}

if((p === (0))){
missionary.impl.Zip.ready(ps);
} else {
}

return ps;
});

//# sourceMappingURL=missionary.impl.Zip.js.map
