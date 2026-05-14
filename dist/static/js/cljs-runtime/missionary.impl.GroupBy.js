goog.provide('missionary.impl.GroupBy');





/**
* @constructor
 * @implements {cljs.core.IFn}
 * @implements {cljs.core.IDeref}
*/
missionary.impl.GroupBy.Process = (function (keyfn,notifier,terminator,key,value,input,table,load,live,busy,done){
this.keyfn = keyfn;
this.notifier = notifier;
this.terminator = terminator;
this.key = key;
this.value = value;
this.input = input;
this.table = table;
this.load = load;
this.live = live;
this.busy = busy;
this.done = done;
this.cljs$lang$protocol_mask$partition0$ = 32769;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(missionary.impl.GroupBy.Process.prototype.call = (function (unused__11818__auto__){
var self__ = this;
var self__ = this;
var G__43060 = (arguments.length - (1));
switch (G__43060) {
case (0):
return self__.cljs$core$IFn$_invoke$arity$0();

break;
case (2):
return self__.cljs$core$IFn$_invoke$arity$2((arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((arguments.length - (1)))].join('')));

}
}));

(missionary.impl.GroupBy.Process.prototype.apply = (function (self__,args43058){
var self__ = this;
var self____$1 = this;
return self____$1.call.apply(self____$1,[self____$1].concat(cljs.core.aclone(args43058)));
}));

(missionary.impl.GroupBy.Process.prototype.cljs$core$IFn$_invoke$arity$0 = (function (){
var self__ = this;
var p = this;
(missionary.impl.GroupBy.kill.cljs$core$IFn$_invoke$arity$1 ? missionary.impl.GroupBy.kill.cljs$core$IFn$_invoke$arity$1(p) : missionary.impl.GroupBy.kill.call(null,p));

return null;
}));

(missionary.impl.GroupBy.Process.prototype.cljs$core$IFn$_invoke$arity$2 = (function (n,t){
var self__ = this;
var p = this;
return (missionary.impl.GroupBy.group.cljs$core$IFn$_invoke$arity$3 ? missionary.impl.GroupBy.group.cljs$core$IFn$_invoke$arity$3(p,n,t) : missionary.impl.GroupBy.group.call(null,p,n,t));
}));

(missionary.impl.GroupBy.Process.prototype.cljs$core$IDeref$_deref$arity$1 = (function (p){
var self__ = this;
var p__$1 = this;
return (missionary.impl.GroupBy.sample.cljs$core$IFn$_invoke$arity$1 ? missionary.impl.GroupBy.sample.cljs$core$IFn$_invoke$arity$1(p__$1) : missionary.impl.GroupBy.sample.call(null,p__$1));
}));

(missionary.impl.GroupBy.Process.getBasis = (function (){
return new cljs.core.PersistentVector(null, 11, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"keyfn","keyfn",-1874375437,null),new cljs.core.Symbol(null,"notifier","notifier",1670358652,null),new cljs.core.Symbol(null,"terminator","terminator",-1051388676,null),new cljs.core.Symbol(null,"key","key",124488940,null),new cljs.core.Symbol(null,"value","value",1946509744,null),new cljs.core.Symbol(null,"input","input",-2097503808,null),new cljs.core.Symbol(null,"table","table",1075588491,null),cljs.core.with_meta(new cljs.core.Symbol(null,"load","load",321890343,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"number","number",-1084057331,null)], null)),cljs.core.with_meta(new cljs.core.Symbol(null,"live","live",30383488,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"boolean","boolean",-278886877,null)], null)),cljs.core.with_meta(new cljs.core.Symbol(null,"busy","busy",1312244726,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"boolean","boolean",-278886877,null)], null)),cljs.core.with_meta(new cljs.core.Symbol(null,"done","done",750687339,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"boolean","boolean",-278886877,null)], null))], null);
}));

(missionary.impl.GroupBy.Process.cljs$lang$type = true);

(missionary.impl.GroupBy.Process.cljs$lang$ctorStr = "missionary.impl.GroupBy/Process");

(missionary.impl.GroupBy.Process.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"missionary.impl.GroupBy/Process");
}));

/**
 * Positional factory function for missionary.impl.GroupBy/Process.
 */
missionary.impl.GroupBy.__GT_Process = (function missionary$impl$GroupBy$__GT_Process(keyfn,notifier,terminator,key,value,input,table,load,live,busy,done){
return (new missionary.impl.GroupBy.Process(keyfn,notifier,terminator,key,value,input,table,load,live,busy,done));
});


/**
* @constructor
 * @implements {cljs.core.IFn}
 * @implements {cljs.core.IDeref}
*/
missionary.impl.GroupBy.Group = (function (process,key,notifier,terminator){
this.process = process;
this.key = key;
this.notifier = notifier;
this.terminator = terminator;
this.cljs$lang$protocol_mask$partition0$ = 32769;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(missionary.impl.GroupBy.Group.prototype.call = (function (unused__11818__auto__){
var self__ = this;
var self__ = this;
var G__43079 = (arguments.length - (1));
switch (G__43079) {
case (0):
return self__.cljs$core$IFn$_invoke$arity$0();

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((arguments.length - (1)))].join('')));

}
}));

(missionary.impl.GroupBy.Group.prototype.apply = (function (self__,args43077){
var self__ = this;
var self____$1 = this;
return self____$1.call.apply(self____$1,[self____$1].concat(cljs.core.aclone(args43077)));
}));

(missionary.impl.GroupBy.Group.prototype.cljs$core$IFn$_invoke$arity$0 = (function (){
var self__ = this;
var g = this;
(missionary.impl.GroupBy.cancel.cljs$core$IFn$_invoke$arity$1 ? missionary.impl.GroupBy.cancel.cljs$core$IFn$_invoke$arity$1(g) : missionary.impl.GroupBy.cancel.call(null,g));

return null;
}));

(missionary.impl.GroupBy.Group.prototype.cljs$core$IDeref$_deref$arity$1 = (function (g){
var self__ = this;
var g__$1 = this;
return (missionary.impl.GroupBy.consume.cljs$core$IFn$_invoke$arity$1 ? missionary.impl.GroupBy.consume.cljs$core$IFn$_invoke$arity$1(g__$1) : missionary.impl.GroupBy.consume.call(null,g__$1));
}));

(missionary.impl.GroupBy.Group.getBasis = (function (){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"process","process",-1011242831,null),new cljs.core.Symbol(null,"key","key",124488940,null),new cljs.core.Symbol(null,"notifier","notifier",1670358652,null),new cljs.core.Symbol(null,"terminator","terminator",-1051388676,null)], null);
}));

(missionary.impl.GroupBy.Group.cljs$lang$type = true);

(missionary.impl.GroupBy.Group.cljs$lang$ctorStr = "missionary.impl.GroupBy/Group");

(missionary.impl.GroupBy.Group.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"missionary.impl.GroupBy/Group");
}));

/**
 * Positional factory function for missionary.impl.GroupBy/Group.
 */
missionary.impl.GroupBy.__GT_Group = (function missionary$impl$GroupBy$__GT_Group(process,key,notifier,terminator){
return (new missionary.impl.GroupBy.Group(process,key,notifier,terminator));
});

missionary.impl.GroupBy.kill = (function missionary$impl$GroupBy$kill(p){
if(cljs.core.truth_(p.live)){
(p.live = false);

var fexpr__43101 = p.input;
return (fexpr__43101.cljs$core$IFn$_invoke$arity$0 ? fexpr__43101.cljs$core$IFn$_invoke$arity$0() : fexpr__43101.call(null));
} else {
return null;
}
});
missionary.impl.GroupBy.step = (function missionary$impl$GroupBy$step(i,m){
return ((i + (1)) & m);
});
missionary.impl.GroupBy.group = (function missionary$impl$GroupBy$group(p,n,t){
var k = p.key;
var g = missionary.impl.GroupBy.__GT_Group(p,k,n,t);
var table = p.table;
if((k === p)){
} else {
(p.key = p);

var s_43182 = table.length;
var m_43183 = (s_43182 - (1));
var i_43184 = (cljs.core.hash(k) & m_43183);
while(true){
var G__43105_43185 = (table[i_43184]);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(null,G__43105_43185)){
(table[i_43184] = g);
} else {
var G__43186 = missionary.impl.GroupBy.step(i_43184,m_43183);
i_43184 = G__43186;
continue;

}
break;
}

var ss_43188 = (s_43182 << (1));
if((ss_43188 <= ((3) * (p.load = (p.load + (1)))))){
var mm_43196 = (ss_43188 - (1));
var larger_43197 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(ss_43188);
(p.table = larger_43197);

var n__5593__auto___43201 = s_43182;
var i_43202 = (0);
while(true){
if((i_43202 < n__5593__auto___43201)){
var temp__5808__auto___43203 = (table[i_43202]);
if((temp__5808__auto___43203 == null)){
} else {
var h_43206 = temp__5808__auto___43203;
var j_43207 = (cljs.core.hash(h_43206.key) & mm_43196);
while(true){
var G__43113_43208 = (larger_43197[j_43207]);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(null,G__43113_43208)){
(larger_43197[j_43207] = h_43206);
} else {
var G__43209 = missionary.impl.GroupBy.step(j_43207,mm_43196);
j_43207 = G__43209;
continue;

}
break;
}
}

var G__43210 = (i_43202 + (1));
i_43202 = G__43210;
continue;
} else {
}
break;
}
} else {
}
}

(n.cljs$core$IFn$_invoke$arity$0 ? n.cljs$core$IFn$_invoke$arity$0() : n.call(null));

return g;
});
missionary.impl.GroupBy.cancel = (function missionary$impl$GroupBy$cancel(g){
var p = g.process;
var k = g.key;
if(cljs.core.truth_(p.live)){
if((k === p)){
return null;
} else {
(g.key = p);

var table = p.table;
var m = (table.length - (1));
var i = (function (){var i = (cljs.core.hash(k) & m);
while(true){
if((g === (table[i]))){
return i;
} else {
var G__43211 = missionary.impl.GroupBy.step(i,m);
i = G__43211;
continue;
}
break;
}
})();
(table[i] = null);

(p.load = (p.load - (1)));

var i_43218__$1 = missionary.impl.GroupBy.step(i,m);
while(true){
var temp__5808__auto___43219 = (table[i_43218__$1]);
if((temp__5808__auto___43219 == null)){
} else {
var h_43220 = temp__5808__auto___43219;
var j_43221 = (cljs.core.hash(h_43220.key) & m);
if((i_43218__$1 === j_43221)){
} else {
(table[i_43218__$1] = null);

var j_43225__$1 = j_43221;
while(true){
if(((table[j_43225__$1]) == null)){
(table[j_43225__$1] = h_43220);
} else {
var G__43226 = missionary.impl.GroupBy.step(j_43225__$1,m);
j_43225__$1 = G__43226;
continue;
}
break;
}
}

var G__43228 = missionary.impl.GroupBy.step(i_43218__$1,m);
i_43218__$1 = G__43228;
continue;
}
break;
}

var fexpr__43117 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k,p.key))?p.notifier:g.notifier);
return (fexpr__43117.cljs$core$IFn$_invoke$arity$0 ? fexpr__43117.cljs$core$IFn$_invoke$arity$0() : fexpr__43117.call(null));
}
} else {
return null;
}
});
missionary.impl.GroupBy.transfer = (function missionary$impl$GroupBy$transfer(p){
while(true){
if(cljs.core.truth_((p.busy = cljs.core.not(p.busy)))){
if(cljs.core.truth_(p.done)){
(p.live = false);

var temp__5808__auto___43230 = p.table;
if((temp__5808__auto___43230 == null)){
} else {
var table_43231 = temp__5808__auto___43230;
(p.table = null);

var n__5593__auto___43232 = table_43231.length;
var i_43236 = (0);
while(true){
if((i_43236 < n__5593__auto___43232)){
var temp__5808__auto___43237__$1 = (table_43231[i_43236]);
if((temp__5808__auto___43237__$1 == null)){
} else {
var g_43238 = temp__5808__auto___43237__$1;
var fexpr__43122_43239 = g_43238.terminator;
(fexpr__43122_43239.cljs$core$IFn$_invoke$arity$0 ? fexpr__43122_43239.cljs$core$IFn$_invoke$arity$0() : fexpr__43122_43239.call(null));
}

var G__43241 = (i_43236 + (1));
i_43236 = G__43241;
continue;
} else {
}
break;
}
}

var fexpr__43124 = p.terminator;
return (fexpr__43124.cljs$core$IFn$_invoke$arity$0 ? fexpr__43124.cljs$core$IFn$_invoke$arity$0() : fexpr__43124.call(null));
} else {
if((p === p.value)){
var table = p.table;
try{var k = (p.key = (function (){var G__43133 = (p.value = cljs.core.deref(p.input));
var fexpr__43132 = p.keyfn;
return (fexpr__43132.cljs$core$IFn$_invoke$arity$1 ? fexpr__43132.cljs$core$IFn$_invoke$arity$1(G__43133) : fexpr__43132.call(null,G__43133));
})());
var m = (table.length - (1));
var i = (cljs.core.hash(k) & m);
while(true){
var temp__5806__auto__ = (table[i]);
if((temp__5806__auto__ == null)){
var fexpr__43135 = p.notifier;
return (fexpr__43135.cljs$core$IFn$_invoke$arity$0 ? fexpr__43135.cljs$core$IFn$_invoke$arity$0() : fexpr__43135.call(null));
} else {
var h = temp__5806__auto__;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k,h.key)){
var fexpr__43137 = h.notifier;
return (fexpr__43137.cljs$core$IFn$_invoke$arity$0 ? fexpr__43137.cljs$core$IFn$_invoke$arity$0() : fexpr__43137.call(null));
} else {
var G__43248 = missionary.impl.GroupBy.step(i,m);
i = G__43248;
continue;
}
}
break;
}
}catch (e43126){var e = e43126;
(p.value = e);

(p.table = null);

missionary.impl.GroupBy.kill(p);

var n__5593__auto___43249 = table.length;
var i_43250 = (0);
while(true){
if((i_43250 < n__5593__auto___43249)){
var temp__5808__auto___43254 = (table[i_43250]);
if((temp__5808__auto___43254 == null)){
} else {
var g_43256 = temp__5808__auto___43254;
var fexpr__43129_43257 = g_43256.terminator;
(fexpr__43129_43257.cljs$core$IFn$_invoke$arity$0 ? fexpr__43129_43257.cljs$core$IFn$_invoke$arity$0() : fexpr__43129_43257.call(null));
}

var G__43258 = (i_43250 + (1));
i_43250 = G__43258;
continue;
} else {
}
break;
}

var fexpr__43131 = p.notifier;
return (fexpr__43131.cljs$core$IFn$_invoke$arity$0 ? fexpr__43131.cljs$core$IFn$_invoke$arity$0() : fexpr__43131.call(null));
}} else {
try{cljs.core.deref(p.input);
}catch (e43139){var __43259 = e43139;
}
continue;
}
}
} else {
return null;
}
break;
}
});
missionary.impl.GroupBy.sample = (function missionary$impl$GroupBy$sample(p){
var k = p.key;
if((k === p)){
missionary.impl.GroupBy.transfer(p);

throw p.value;
} else {
return cljs.core.__GT_MapEntry(k,p,null);
}
});
missionary.impl.GroupBy.consume = (function missionary$impl$GroupBy$consume(g){
var p = g.process;
if((p === g.key)){
var fexpr__43149_43260 = g.terminator;
(fexpr__43149_43260.cljs$core$IFn$_invoke$arity$0 ? fexpr__43149_43260.cljs$core$IFn$_invoke$arity$0() : fexpr__43149_43260.call(null));

throw (new missionary.Cancelled("Group consumer cancelled."));
} else {
var x = p.value;
(p.value = p);

(p.key = p);

missionary.impl.GroupBy.transfer(p);

return x;
}
});
missionary.impl.GroupBy.run = (function missionary$impl$GroupBy$run(k,f,n,t){
var p = missionary.impl.GroupBy.__GT_Process(k,n,t,null,null,null,cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((8)),(0),true,true,false);
(p.key = p);

(p.value = p);

(p.input = (function (){var G__43150 = (function (){
return missionary.impl.GroupBy.transfer(p);
});
var G__43151 = (function (){
(p.done = true);

return missionary.impl.GroupBy.transfer(p);
});
return (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(G__43150,G__43151) : f.call(null,G__43150,G__43151));
})());

missionary.impl.GroupBy.transfer(p);

return p;
});

//# sourceMappingURL=missionary.impl.GroupBy.js.map
