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
var G__58119 = (arguments.length - (1));
switch (G__58119) {
case (0):
return self__.cljs$core$IFn$_invoke$arity$0();

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((arguments.length - (1)))].join('')));

}
}));

(missionary.impl.Zip.Process.prototype.apply = (function (self__,args58118){
var self__ = this;
var self____$1 = this;
return self____$1.call.apply(self____$1,[self____$1].concat(cljs.core.aclone(args58118)));
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
var G__58181 = (i + (1));
var G__58182 = c;
i = G__58181;
c = G__58182;
continue;
} else {
try{cljs.core.deref(input);
}catch (e58146){var __58183 = e58146;
}
var G__58184 = (i + (1));
var G__58185 = (c + (1));
i = G__58184;
c = G__58185;
continue;
}
} else {
var p = (ps.pending = (ps.pending + c));
if((c === (0))){
var fexpr__58148 = ps.done;
return (fexpr__58148.cljs$core$IFn$_invoke$arity$0 ? fexpr__58148.cljs$core$IFn$_invoke$arity$0() : fexpr__58148.call(null));
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
var input_58190 = (inputs[i]);
if((input_58190 === ps)){
} else {
(input_58190.cljs$core$IFn$_invoke$arity$0 ? input_58190.cljs$core$IFn$_invoke$arity$0() : input_58190.call(null));
}

var G__58192 = (i + (1));
i = G__58192;
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
try{var n__5593__auto___58193 = arity;
var i_58194 = (0);
while(true){
if((i_58194 < n__5593__auto___58193)){
c.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,(c.cljs$core$IDeref$_deref$arity$1(null) + (1)));

(buffer[i_58194] = cljs.core.deref((inputs[i_58194])));

var G__58195 = (i_58194 + (1));
i_58194 = G__58195;
continue;
} else {
}
break;
}

return ps.combine.apply(null,buffer);
}catch (e58156){var e = e58156;
(ps.step = null);

throw e;
}finally {var p_58199 = (ps.pending = (ps.pending + cljs.core.deref(c)));
if((ps.step == null)){
missionary.impl.Zip.cancel(ps);
} else {
}

if((p_58199 === (0))){
missionary.impl.Zip.ready(ps);
} else {
}
}});
missionary.impl.Zip.run = (function missionary$impl$Zip$run(f,fs,s,d){
var arity = cljs.core.count(fs);
var inputs = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(arity);
var ps = missionary.impl.Zip.__GT_Process(f,s,d,inputs,(0));
var it = cljs.core.iter(fs);
var i_58200 = (0);
while(true){
var input_58201 = (function (){var G__58173 = ((function (i_58200,arity,inputs,ps,it){
return (function (){
var p = (ps.pending = (ps.pending - (1)));
if((p === (0))){
return missionary.impl.Zip.ready(ps);
} else {
return null;
}
});})(i_58200,arity,inputs,ps,it))
;
var G__58174 = ((function (i_58200,G__58173,arity,inputs,ps,it){
return (function (){
(ps.inputs[i_58200] = ps);

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
});})(i_58200,G__58173,arity,inputs,ps,it))
;
var fexpr__58172 = it.next();
return (fexpr__58172.cljs$core$IFn$_invoke$arity$2 ? fexpr__58172.cljs$core$IFn$_invoke$arity$2(G__58173,G__58174) : fexpr__58172.call(null,G__58173,G__58174));
})();
if(((inputs[i_58200]) == null)){
(inputs[i_58200] = input_58201);
} else {
}

if(cljs.core.truth_(it.hasNext())){
var G__58202 = (i_58200 + (1));
i_58200 = G__58202;
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
