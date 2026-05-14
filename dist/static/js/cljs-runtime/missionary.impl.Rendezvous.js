goog.provide('missionary.impl.Rendezvous');
missionary.impl.Rendezvous.nop = (function missionary$impl$Rendezvous$nop(){
return null;
});

/**
* @constructor
 * @implements {cljs.core.IFn}
*/
missionary.impl.Rendezvous.Port = (function (readers,writers){
this.readers = readers;
this.writers = writers;
this.cljs$lang$protocol_mask$partition0$ = 1;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(missionary.impl.Rendezvous.Port.prototype.call = (function (unused__11818__auto__){
var self__ = this;
var self__ = this;
var G__43610 = (arguments.length - (1));
switch (G__43610) {
case (1):
return self__.cljs$core$IFn$_invoke$arity$1((arguments[(1)]));

break;
case (2):
return self__.cljs$core$IFn$_invoke$arity$2((arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((arguments.length - (1)))].join('')));

}
}));

(missionary.impl.Rendezvous.Port.prototype.apply = (function (self__,args43605){
var self__ = this;
var self____$1 = this;
return self____$1.call.apply(self____$1,[self____$1].concat(cljs.core.aclone(args43605)));
}));

(missionary.impl.Rendezvous.Port.prototype.cljs$core$IFn$_invoke$arity$1 = (function (t){
var self__ = this;
var _ = this;
return (function (s_BANG_,f_BANG_){
var temp__5806__auto__ = cljs.core.seq(self__.readers);
if((temp__5806__auto__ == null)){
var _BANG_ = (function (){
return (s_BANG_.cljs$core$IFn$_invoke$arity$1 ? s_BANG_.cljs$core$IFn$_invoke$arity$1(null) : s_BANG_.call(null,null));
});
(self__.writers = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.writers,_BANG_,t));

return (function (){
if(cljs.core.contains_QMARK_(self__.writers,_BANG_)){
(self__.writers = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.writers,_BANG_));

var G__43622 = (new missionary.Cancelled("Rendez-vous give cancelled."));
return (f_BANG_.cljs$core$IFn$_invoke$arity$1 ? f_BANG_.cljs$core$IFn$_invoke$arity$1(G__43622) : f_BANG_.call(null,G__43622));
} else {
return null;
}
});
} else {
var vec__43623 = temp__5806__auto__;
var _BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__43623,(0),null);
(self__.readers = cljs.core.disj.cljs$core$IFn$_invoke$arity$2(self__.readers,_BANG_));

(_BANG_.cljs$core$IFn$_invoke$arity$1 ? _BANG_.cljs$core$IFn$_invoke$arity$1(t) : _BANG_.call(null,t));

(s_BANG_.cljs$core$IFn$_invoke$arity$1 ? s_BANG_.cljs$core$IFn$_invoke$arity$1(null) : s_BANG_.call(null,null));

return missionary.impl.Rendezvous.nop;
}
});
}));

(missionary.impl.Rendezvous.Port.prototype.cljs$core$IFn$_invoke$arity$2 = (function (s_BANG_,f_BANG_){
var self__ = this;
var _ = this;
var temp__5806__auto__ = cljs.core.seq(self__.writers);
if((temp__5806__auto__ == null)){
var _BANG_ = (function (p1__43603_SHARP_){
return (s_BANG_.cljs$core$IFn$_invoke$arity$1 ? s_BANG_.cljs$core$IFn$_invoke$arity$1(p1__43603_SHARP_) : s_BANG_.call(null,p1__43603_SHARP_));
});
(self__.readers = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(self__.readers,_BANG_));

return (function (){
if(cljs.core.contains_QMARK_(self__.readers,_BANG_)){
(self__.readers = cljs.core.disj.cljs$core$IFn$_invoke$arity$2(self__.readers,_BANG_));

var G__43635 = (new missionary.Cancelled("Rendez-vous take cancelled."));
return (f_BANG_.cljs$core$IFn$_invoke$arity$1 ? f_BANG_.cljs$core$IFn$_invoke$arity$1(G__43635) : f_BANG_.call(null,G__43635));
} else {
return null;
}
});
} else {
var vec__43637 = temp__5806__auto__;
var vec__43640 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__43637,(0),null);
var _BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__43640,(0),null);
var t = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__43640,(1),null);
(self__.writers = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.writers,_BANG_));

(_BANG_.cljs$core$IFn$_invoke$arity$0 ? _BANG_.cljs$core$IFn$_invoke$arity$0() : _BANG_.call(null));

(s_BANG_.cljs$core$IFn$_invoke$arity$1 ? s_BANG_.cljs$core$IFn$_invoke$arity$1(t) : s_BANG_.call(null,t));

return missionary.impl.Rendezvous.nop;
}
}));

(missionary.impl.Rendezvous.Port.getBasis = (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.with_meta(new cljs.core.Symbol(null,"readers","readers",-477731503,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"mutable","mutable",875778266),true], null)),cljs.core.with_meta(new cljs.core.Symbol(null,"writers","writers",-1500612666,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"mutable","mutable",875778266),true], null))], null);
}));

(missionary.impl.Rendezvous.Port.cljs$lang$type = true);

(missionary.impl.Rendezvous.Port.cljs$lang$ctorStr = "missionary.impl.Rendezvous/Port");

(missionary.impl.Rendezvous.Port.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"missionary.impl.Rendezvous/Port");
}));

/**
 * Positional factory function for missionary.impl.Rendezvous/Port.
 */
missionary.impl.Rendezvous.__GT_Port = (function missionary$impl$Rendezvous$__GT_Port(readers,writers){
return (new missionary.impl.Rendezvous.Port(readers,writers));
});

missionary.impl.Rendezvous.make = (function missionary$impl$Rendezvous$make(){
return missionary.impl.Rendezvous.__GT_Port(cljs.core.PersistentHashSet.EMPTY,cljs.core.PersistentArrayMap.EMPTY);
});

//# sourceMappingURL=missionary.impl.Rendezvous.js.map
