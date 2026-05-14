goog.provide('shadow.dom');
shadow.dom.transition_supported_QMARK_ = true;

/**
 * @interface
 */
shadow.dom.IElement = function(){};

var shadow$dom$IElement$_to_dom$dyn_34422 = (function (this$){
var x__5350__auto__ = (((this$ == null))?null:this$);
var m__5351__auto__ = (shadow.dom._to_dom[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(this$) : m__5351__auto__.call(null,this$));
} else {
var m__5349__auto__ = (shadow.dom._to_dom["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(this$) : m__5349__auto__.call(null,this$));
} else {
throw cljs.core.missing_protocol("IElement.-to-dom",this$);
}
}
});
shadow.dom._to_dom = (function shadow$dom$_to_dom(this$){
if((((!((this$ == null)))) && ((!((this$.shadow$dom$IElement$_to_dom$arity$1 == null)))))){
return this$.shadow$dom$IElement$_to_dom$arity$1(this$);
} else {
return shadow$dom$IElement$_to_dom$dyn_34422(this$);
}
});


/**
 * @interface
 */
shadow.dom.SVGElement = function(){};

var shadow$dom$SVGElement$_to_svg$dyn_34431 = (function (this$){
var x__5350__auto__ = (((this$ == null))?null:this$);
var m__5351__auto__ = (shadow.dom._to_svg[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(this$) : m__5351__auto__.call(null,this$));
} else {
var m__5349__auto__ = (shadow.dom._to_svg["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(this$) : m__5349__auto__.call(null,this$));
} else {
throw cljs.core.missing_protocol("SVGElement.-to-svg",this$);
}
}
});
shadow.dom._to_svg = (function shadow$dom$_to_svg(this$){
if((((!((this$ == null)))) && ((!((this$.shadow$dom$SVGElement$_to_svg$arity$1 == null)))))){
return this$.shadow$dom$SVGElement$_to_svg$arity$1(this$);
} else {
return shadow$dom$SVGElement$_to_svg$dyn_34431(this$);
}
});

shadow.dom.lazy_native_coll_seq = (function shadow$dom$lazy_native_coll_seq(coll,idx){
if((idx < coll.length)){
return (new cljs.core.LazySeq(null,(function (){
return cljs.core.cons((coll[idx]),(function (){var G__33418 = coll;
var G__33419 = (idx + (1));
return (shadow.dom.lazy_native_coll_seq.cljs$core$IFn$_invoke$arity$2 ? shadow.dom.lazy_native_coll_seq.cljs$core$IFn$_invoke$arity$2(G__33418,G__33419) : shadow.dom.lazy_native_coll_seq.call(null,G__33418,G__33419));
})());
}),null,null));
} else {
return null;
}
});

/**
* @constructor
 * @implements {cljs.core.IIndexed}
 * @implements {cljs.core.ICounted}
 * @implements {cljs.core.ISeqable}
 * @implements {cljs.core.IDeref}
 * @implements {shadow.dom.IElement}
*/
shadow.dom.NativeColl = (function (coll){
this.coll = coll;
this.cljs$lang$protocol_mask$partition0$ = 8421394;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(shadow.dom.NativeColl.prototype.cljs$core$IDeref$_deref$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
return self__.coll;
}));

(shadow.dom.NativeColl.prototype.cljs$core$IIndexed$_nth$arity$2 = (function (this$,n){
var self__ = this;
var this$__$1 = this;
return (self__.coll[n]);
}));

(shadow.dom.NativeColl.prototype.cljs$core$IIndexed$_nth$arity$3 = (function (this$,n,not_found){
var self__ = this;
var this$__$1 = this;
var or__5002__auto__ = (self__.coll[n]);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return not_found;
}
}));

(shadow.dom.NativeColl.prototype.cljs$core$ICounted$_count$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
return self__.coll.length;
}));

(shadow.dom.NativeColl.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
return shadow.dom.lazy_native_coll_seq(self__.coll,(0));
}));

(shadow.dom.NativeColl.prototype.shadow$dom$IElement$ = cljs.core.PROTOCOL_SENTINEL);

(shadow.dom.NativeColl.prototype.shadow$dom$IElement$_to_dom$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
return self__.coll;
}));

(shadow.dom.NativeColl.getBasis = (function (){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"coll","coll",-1006698606,null)], null);
}));

(shadow.dom.NativeColl.cljs$lang$type = true);

(shadow.dom.NativeColl.cljs$lang$ctorStr = "shadow.dom/NativeColl");

(shadow.dom.NativeColl.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"shadow.dom/NativeColl");
}));

/**
 * Positional factory function for shadow.dom/NativeColl.
 */
shadow.dom.__GT_NativeColl = (function shadow$dom$__GT_NativeColl(coll){
return (new shadow.dom.NativeColl(coll));
});

shadow.dom.native_coll = (function shadow$dom$native_coll(coll){
return (new shadow.dom.NativeColl(coll));
});
shadow.dom.dom_node = (function shadow$dom$dom_node(el){
if((el == null)){
return null;
} else {
if((((!((el == null))))?((((false) || ((cljs.core.PROTOCOL_SENTINEL === el.shadow$dom$IElement$))))?true:false):false)){
return el.shadow$dom$IElement$_to_dom$arity$1(null);
} else {
if(typeof el === 'string'){
return document.createTextNode(el);
} else {
if(typeof el === 'number'){
return document.createTextNode(cljs.core.str.cljs$core$IFn$_invoke$arity$1(el));
} else {
return el;

}
}
}
}
});
shadow.dom.query_one = (function shadow$dom$query_one(var_args){
var G__33457 = arguments.length;
switch (G__33457) {
case 1:
return shadow.dom.query_one.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return shadow.dom.query_one.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(shadow.dom.query_one.cljs$core$IFn$_invoke$arity$1 = (function (sel){
return document.querySelector(sel);
}));

(shadow.dom.query_one.cljs$core$IFn$_invoke$arity$2 = (function (sel,root){
return shadow.dom.dom_node(root).querySelector(sel);
}));

(shadow.dom.query_one.cljs$lang$maxFixedArity = 2);

shadow.dom.query = (function shadow$dom$query(var_args){
var G__33459 = arguments.length;
switch (G__33459) {
case 1:
return shadow.dom.query.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return shadow.dom.query.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(shadow.dom.query.cljs$core$IFn$_invoke$arity$1 = (function (sel){
return (new shadow.dom.NativeColl(document.querySelectorAll(sel)));
}));

(shadow.dom.query.cljs$core$IFn$_invoke$arity$2 = (function (sel,root){
return (new shadow.dom.NativeColl(shadow.dom.dom_node(root).querySelectorAll(sel)));
}));

(shadow.dom.query.cljs$lang$maxFixedArity = 2);

shadow.dom.by_id = (function shadow$dom$by_id(var_args){
var G__33474 = arguments.length;
switch (G__33474) {
case 2:
return shadow.dom.by_id.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 1:
return shadow.dom.by_id.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(shadow.dom.by_id.cljs$core$IFn$_invoke$arity$2 = (function (id,el){
return shadow.dom.dom_node(el).getElementById(id);
}));

(shadow.dom.by_id.cljs$core$IFn$_invoke$arity$1 = (function (id){
return document.getElementById(id);
}));

(shadow.dom.by_id.cljs$lang$maxFixedArity = 2);

shadow.dom.build = shadow.dom.dom_node;
shadow.dom.ev_stop = (function shadow$dom$ev_stop(var_args){
var G__33476 = arguments.length;
switch (G__33476) {
case 1:
return shadow.dom.ev_stop.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return shadow.dom.ev_stop.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 4:
return shadow.dom.ev_stop.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(shadow.dom.ev_stop.cljs$core$IFn$_invoke$arity$1 = (function (e){
if(cljs.core.truth_(e.stopPropagation)){
e.stopPropagation();

e.preventDefault();
} else {
(e.cancelBubble = true);

(e.returnValue = false);
}

return e;
}));

(shadow.dom.ev_stop.cljs$core$IFn$_invoke$arity$2 = (function (e,el){
shadow.dom.ev_stop.cljs$core$IFn$_invoke$arity$1(e);

return el;
}));

(shadow.dom.ev_stop.cljs$core$IFn$_invoke$arity$4 = (function (e,el,scope,owner){
shadow.dom.ev_stop.cljs$core$IFn$_invoke$arity$1(e);

return el;
}));

(shadow.dom.ev_stop.cljs$lang$maxFixedArity = 4);

/**
 * check wether a parent node (or the document) contains the child
 */
shadow.dom.contains_QMARK_ = (function shadow$dom$contains_QMARK_(var_args){
var G__33504 = arguments.length;
switch (G__33504) {
case 1:
return shadow.dom.contains_QMARK_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return shadow.dom.contains_QMARK_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(shadow.dom.contains_QMARK_.cljs$core$IFn$_invoke$arity$1 = (function (el){
return goog.dom.contains(document,shadow.dom.dom_node(el));
}));

(shadow.dom.contains_QMARK_.cljs$core$IFn$_invoke$arity$2 = (function (parent,el){
return goog.dom.contains(shadow.dom.dom_node(parent),shadow.dom.dom_node(el));
}));

(shadow.dom.contains_QMARK_.cljs$lang$maxFixedArity = 2);

shadow.dom.add_class = (function shadow$dom$add_class(el,cls){
return goog.dom.classlist.add(shadow.dom.dom_node(el),cls);
});
shadow.dom.remove_class = (function shadow$dom$remove_class(el,cls){
return goog.dom.classlist.remove(shadow.dom.dom_node(el),cls);
});
shadow.dom.toggle_class = (function shadow$dom$toggle_class(var_args){
var G__33512 = arguments.length;
switch (G__33512) {
case 2:
return shadow.dom.toggle_class.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return shadow.dom.toggle_class.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(shadow.dom.toggle_class.cljs$core$IFn$_invoke$arity$2 = (function (el,cls){
return goog.dom.classlist.toggle(shadow.dom.dom_node(el),cls);
}));

(shadow.dom.toggle_class.cljs$core$IFn$_invoke$arity$3 = (function (el,cls,v){
if(cljs.core.truth_(v)){
return shadow.dom.add_class(el,cls);
} else {
return shadow.dom.remove_class(el,cls);
}
}));

(shadow.dom.toggle_class.cljs$lang$maxFixedArity = 3);

shadow.dom.dom_listen = (cljs.core.truth_((function (){var or__5002__auto__ = (!((typeof document !== 'undefined')));
if(or__5002__auto__){
return or__5002__auto__;
} else {
return document.addEventListener;
}
})())?(function shadow$dom$dom_listen_good(el,ev,handler){
return el.addEventListener(ev,handler,false);
}):(function shadow$dom$dom_listen_ie(el,ev,handler){
try{return el.attachEvent(["on",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ev)].join(''),(function (e){
return (handler.cljs$core$IFn$_invoke$arity$2 ? handler.cljs$core$IFn$_invoke$arity$2(e,el) : handler.call(null,e,el));
}));
}catch (e33517){if((e33517 instanceof Object)){
var e = e33517;
return console.log("didnt support attachEvent",el,e);
} else {
throw e33517;

}
}}));
shadow.dom.dom_listen_remove = (cljs.core.truth_((function (){var or__5002__auto__ = (!((typeof document !== 'undefined')));
if(or__5002__auto__){
return or__5002__auto__;
} else {
return document.removeEventListener;
}
})())?(function shadow$dom$dom_listen_remove_good(el,ev,handler){
return el.removeEventListener(ev,handler,false);
}):(function shadow$dom$dom_listen_remove_ie(el,ev,handler){
return el.detachEvent(["on",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ev)].join(''),handler);
}));
shadow.dom.on_query = (function shadow$dom$on_query(root_el,ev,selector,handler){
var seq__33519 = cljs.core.seq(shadow.dom.query.cljs$core$IFn$_invoke$arity$2(selector,root_el));
var chunk__33520 = null;
var count__33521 = (0);
var i__33522 = (0);
while(true){
if((i__33522 < count__33521)){
var el = chunk__33520.cljs$core$IIndexed$_nth$arity$2(null,i__33522);
var handler_34557__$1 = ((function (seq__33519,chunk__33520,count__33521,i__33522,el){
return (function (e){
return (handler.cljs$core$IFn$_invoke$arity$2 ? handler.cljs$core$IFn$_invoke$arity$2(e,el) : handler.call(null,e,el));
});})(seq__33519,chunk__33520,count__33521,i__33522,el))
;
shadow.dom.dom_listen(el,cljs.core.name(ev),handler_34557__$1);


var G__34558 = seq__33519;
var G__34559 = chunk__33520;
var G__34560 = count__33521;
var G__34561 = (i__33522 + (1));
seq__33519 = G__34558;
chunk__33520 = G__34559;
count__33521 = G__34560;
i__33522 = G__34561;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__33519);
if(temp__5804__auto__){
var seq__33519__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__33519__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__33519__$1);
var G__34562 = cljs.core.chunk_rest(seq__33519__$1);
var G__34563 = c__5525__auto__;
var G__34564 = cljs.core.count(c__5525__auto__);
var G__34565 = (0);
seq__33519 = G__34562;
chunk__33520 = G__34563;
count__33521 = G__34564;
i__33522 = G__34565;
continue;
} else {
var el = cljs.core.first(seq__33519__$1);
var handler_34566__$1 = ((function (seq__33519,chunk__33520,count__33521,i__33522,el,seq__33519__$1,temp__5804__auto__){
return (function (e){
return (handler.cljs$core$IFn$_invoke$arity$2 ? handler.cljs$core$IFn$_invoke$arity$2(e,el) : handler.call(null,e,el));
});})(seq__33519,chunk__33520,count__33521,i__33522,el,seq__33519__$1,temp__5804__auto__))
;
shadow.dom.dom_listen(el,cljs.core.name(ev),handler_34566__$1);


var G__34567 = cljs.core.next(seq__33519__$1);
var G__34568 = null;
var G__34569 = (0);
var G__34570 = (0);
seq__33519 = G__34567;
chunk__33520 = G__34568;
count__33521 = G__34569;
i__33522 = G__34570;
continue;
}
} else {
return null;
}
}
break;
}
});
shadow.dom.on = (function shadow$dom$on(var_args){
var G__33532 = arguments.length;
switch (G__33532) {
case 3:
return shadow.dom.on.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return shadow.dom.on.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(shadow.dom.on.cljs$core$IFn$_invoke$arity$3 = (function (el,ev,handler){
return shadow.dom.on.cljs$core$IFn$_invoke$arity$4(el,ev,handler,false);
}));

(shadow.dom.on.cljs$core$IFn$_invoke$arity$4 = (function (el,ev,handler,capture){
if(cljs.core.vector_QMARK_(ev)){
return shadow.dom.on_query(el,cljs.core.first(ev),cljs.core.second(ev),handler);
} else {
var handler__$1 = (function (e){
return (handler.cljs$core$IFn$_invoke$arity$2 ? handler.cljs$core$IFn$_invoke$arity$2(e,el) : handler.call(null,e,el));
});
return shadow.dom.dom_listen(shadow.dom.dom_node(el),cljs.core.name(ev),handler__$1);
}
}));

(shadow.dom.on.cljs$lang$maxFixedArity = 4);

shadow.dom.remove_event_handler = (function shadow$dom$remove_event_handler(el,ev,handler){
return shadow.dom.dom_listen_remove(shadow.dom.dom_node(el),cljs.core.name(ev),handler);
});
shadow.dom.add_event_listeners = (function shadow$dom$add_event_listeners(el,events){
var seq__33534 = cljs.core.seq(events);
var chunk__33535 = null;
var count__33536 = (0);
var i__33537 = (0);
while(true){
if((i__33537 < count__33536)){
var vec__33552 = chunk__33535.cljs$core$IIndexed$_nth$arity$2(null,i__33537);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33552,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33552,(1),null);
shadow.dom.on.cljs$core$IFn$_invoke$arity$3(el,k,v);


var G__34574 = seq__33534;
var G__34575 = chunk__33535;
var G__34576 = count__33536;
var G__34577 = (i__33537 + (1));
seq__33534 = G__34574;
chunk__33535 = G__34575;
count__33536 = G__34576;
i__33537 = G__34577;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__33534);
if(temp__5804__auto__){
var seq__33534__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__33534__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__33534__$1);
var G__34578 = cljs.core.chunk_rest(seq__33534__$1);
var G__34579 = c__5525__auto__;
var G__34580 = cljs.core.count(c__5525__auto__);
var G__34581 = (0);
seq__33534 = G__34578;
chunk__33535 = G__34579;
count__33536 = G__34580;
i__33537 = G__34581;
continue;
} else {
var vec__33558 = cljs.core.first(seq__33534__$1);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33558,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33558,(1),null);
shadow.dom.on.cljs$core$IFn$_invoke$arity$3(el,k,v);


var G__34586 = cljs.core.next(seq__33534__$1);
var G__34587 = null;
var G__34588 = (0);
var G__34589 = (0);
seq__33534 = G__34586;
chunk__33535 = G__34587;
count__33536 = G__34588;
i__33537 = G__34589;
continue;
}
} else {
return null;
}
}
break;
}
});
shadow.dom.set_style = (function shadow$dom$set_style(el,styles){
var dom = shadow.dom.dom_node(el);
var seq__33566 = cljs.core.seq(styles);
var chunk__33567 = null;
var count__33568 = (0);
var i__33569 = (0);
while(true){
if((i__33569 < count__33568)){
var vec__33589 = chunk__33567.cljs$core$IIndexed$_nth$arity$2(null,i__33569);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33589,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33589,(1),null);
goog.style.setStyle(dom,cljs.core.name(k),(((v == null))?"":v));


var G__34593 = seq__33566;
var G__34594 = chunk__33567;
var G__34595 = count__33568;
var G__34596 = (i__33569 + (1));
seq__33566 = G__34593;
chunk__33567 = G__34594;
count__33568 = G__34595;
i__33569 = G__34596;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__33566);
if(temp__5804__auto__){
var seq__33566__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__33566__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__33566__$1);
var G__34597 = cljs.core.chunk_rest(seq__33566__$1);
var G__34598 = c__5525__auto__;
var G__34599 = cljs.core.count(c__5525__auto__);
var G__34600 = (0);
seq__33566 = G__34597;
chunk__33567 = G__34598;
count__33568 = G__34599;
i__33569 = G__34600;
continue;
} else {
var vec__33595 = cljs.core.first(seq__33566__$1);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33595,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33595,(1),null);
goog.style.setStyle(dom,cljs.core.name(k),(((v == null))?"":v));


var G__34606 = cljs.core.next(seq__33566__$1);
var G__34607 = null;
var G__34608 = (0);
var G__34609 = (0);
seq__33566 = G__34606;
chunk__33567 = G__34607;
count__33568 = G__34608;
i__33569 = G__34609;
continue;
}
} else {
return null;
}
}
break;
}
});
shadow.dom.set_attr_STAR_ = (function shadow$dom$set_attr_STAR_(el,key,value){
var G__33603_34614 = key;
var G__33603_34615__$1 = (((G__33603_34614 instanceof cljs.core.Keyword))?G__33603_34614.fqn:null);
switch (G__33603_34615__$1) {
case "id":
(el.id = cljs.core.str.cljs$core$IFn$_invoke$arity$1(value));

break;
case "class":
(el.className = cljs.core.str.cljs$core$IFn$_invoke$arity$1(value));

break;
case "for":
(el.htmlFor = value);

break;
case "cellpadding":
el.setAttribute("cellPadding",value);

break;
case "cellspacing":
el.setAttribute("cellSpacing",value);

break;
case "colspan":
el.setAttribute("colSpan",value);

break;
case "frameborder":
el.setAttribute("frameBorder",value);

break;
case "height":
el.setAttribute("height",value);

break;
case "maxlength":
el.setAttribute("maxLength",value);

break;
case "role":
el.setAttribute("role",value);

break;
case "rowspan":
el.setAttribute("rowSpan",value);

break;
case "type":
el.setAttribute("type",value);

break;
case "usemap":
el.setAttribute("useMap",value);

break;
case "valign":
el.setAttribute("vAlign",value);

break;
case "width":
el.setAttribute("width",value);

break;
case "on":
shadow.dom.add_event_listeners(el,value);

break;
case "style":
if((value == null)){
} else {
if(typeof value === 'string'){
el.setAttribute("style",value);
} else {
if(cljs.core.map_QMARK_(value)){
shadow.dom.set_style(el,value);
} else {
goog.style.setStyle(el,value);

}
}
}

break;
default:
var ks_34620 = cljs.core.name(key);
if(cljs.core.truth_((function (){var or__5002__auto__ = goog.string.startsWith(ks_34620,"data-");
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return goog.string.startsWith(ks_34620,"aria-");
}
})())){
el.setAttribute(ks_34620,value);
} else {
(el[ks_34620] = value);
}

}

return el;
});
shadow.dom.set_attrs = (function shadow$dom$set_attrs(el,attrs){
return cljs.core.reduce_kv((function (el__$1,key,value){
shadow.dom.set_attr_STAR_(el__$1,key,value);

return el__$1;
}),shadow.dom.dom_node(el),attrs);
});
shadow.dom.set_attr = (function shadow$dom$set_attr(el,key,value){
return shadow.dom.set_attr_STAR_(shadow.dom.dom_node(el),key,value);
});
shadow.dom.has_class_QMARK_ = (function shadow$dom$has_class_QMARK_(el,cls){
return goog.dom.classlist.contains(shadow.dom.dom_node(el),cls);
});
shadow.dom.merge_class_string = (function shadow$dom$merge_class_string(current,extra_class){
if(cljs.core.seq(current)){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(current)," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(extra_class)].join('');
} else {
return extra_class;
}
});
shadow.dom.parse_tag = (function shadow$dom$parse_tag(spec){
var spec__$1 = cljs.core.name(spec);
var fdot = spec__$1.indexOf(".");
var fhash = spec__$1.indexOf("#");
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((-1),fdot)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((-1),fhash)))){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [spec__$1,null,null], null);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((-1),fhash)){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [spec__$1.substring((0),fdot),null,clojure.string.replace(spec__$1.substring((fdot + (1))),/\./," ")], null);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((-1),fdot)){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [spec__$1.substring((0),fhash),spec__$1.substring((fhash + (1))),null], null);
} else {
if((fhash > fdot)){
throw ["cant have id after class?",spec__$1].join('');
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [spec__$1.substring((0),fhash),spec__$1.substring((fhash + (1)),fdot),clojure.string.replace(spec__$1.substring((fdot + (1))),/\./," ")], null);

}
}
}
}
});
shadow.dom.create_dom_node = (function shadow$dom$create_dom_node(tag_def,p__33623){
var map__33624 = p__33623;
var map__33624__$1 = cljs.core.__destructure_map(map__33624);
var props = map__33624__$1;
var class$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__33624__$1,new cljs.core.Keyword(null,"class","class",-2030961996));
var tag_props = ({});
var vec__33626 = shadow.dom.parse_tag(tag_def);
var tag_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33626,(0),null);
var tag_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33626,(1),null);
var tag_classes = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33626,(2),null);
if(cljs.core.truth_(tag_id)){
(tag_props["id"] = tag_id);
} else {
}

if(cljs.core.truth_(tag_classes)){
(tag_props["class"] = shadow.dom.merge_class_string(class$,tag_classes));
} else {
}

var G__33629 = goog.dom.createDom(tag_name,tag_props);
shadow.dom.set_attrs(G__33629,cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(props,new cljs.core.Keyword(null,"class","class",-2030961996)));

return G__33629;
});
shadow.dom.append = (function shadow$dom$append(var_args){
var G__33632 = arguments.length;
switch (G__33632) {
case 1:
return shadow.dom.append.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return shadow.dom.append.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(shadow.dom.append.cljs$core$IFn$_invoke$arity$1 = (function (node){
if(cljs.core.truth_(node)){
var temp__5804__auto__ = shadow.dom.dom_node(node);
if(cljs.core.truth_(temp__5804__auto__)){
var n = temp__5804__auto__;
document.body.appendChild(n);

return n;
} else {
return null;
}
} else {
return null;
}
}));

(shadow.dom.append.cljs$core$IFn$_invoke$arity$2 = (function (el,node){
if(cljs.core.truth_(node)){
var temp__5804__auto__ = shadow.dom.dom_node(node);
if(cljs.core.truth_(temp__5804__auto__)){
var n = temp__5804__auto__;
shadow.dom.dom_node(el).appendChild(n);

return n;
} else {
return null;
}
} else {
return null;
}
}));

(shadow.dom.append.cljs$lang$maxFixedArity = 2);

shadow.dom.destructure_node = (function shadow$dom$destructure_node(create_fn,p__33635){
var vec__33636 = p__33635;
var seq__33637 = cljs.core.seq(vec__33636);
var first__33638 = cljs.core.first(seq__33637);
var seq__33637__$1 = cljs.core.next(seq__33637);
var nn = first__33638;
var first__33638__$1 = cljs.core.first(seq__33637__$1);
var seq__33637__$2 = cljs.core.next(seq__33637__$1);
var np = first__33638__$1;
var nc = seq__33637__$2;
var node = vec__33636;
if((nn instanceof cljs.core.Keyword)){
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("invalid dom node",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"node","node",581201198),node], null));
}

if((((np == null)) && ((nc == null)))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var G__33640 = nn;
var G__33641 = cljs.core.PersistentArrayMap.EMPTY;
return (create_fn.cljs$core$IFn$_invoke$arity$2 ? create_fn.cljs$core$IFn$_invoke$arity$2(G__33640,G__33641) : create_fn.call(null,G__33640,G__33641));
})(),cljs.core.List.EMPTY], null);
} else {
if(cljs.core.map_QMARK_(np)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(create_fn.cljs$core$IFn$_invoke$arity$2 ? create_fn.cljs$core$IFn$_invoke$arity$2(nn,np) : create_fn.call(null,nn,np)),nc], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var G__33645 = nn;
var G__33646 = cljs.core.PersistentArrayMap.EMPTY;
return (create_fn.cljs$core$IFn$_invoke$arity$2 ? create_fn.cljs$core$IFn$_invoke$arity$2(G__33645,G__33646) : create_fn.call(null,G__33645,G__33646));
})(),cljs.core.conj.cljs$core$IFn$_invoke$arity$2(nc,np)], null);

}
}
});
shadow.dom.make_dom_node = (function shadow$dom$make_dom_node(structure){
var vec__33648 = shadow.dom.destructure_node(shadow.dom.create_dom_node,structure);
var node = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33648,(0),null);
var node_children = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33648,(1),null);
var seq__33651_34674 = cljs.core.seq(node_children);
var chunk__33652_34675 = null;
var count__33653_34676 = (0);
var i__33654_34677 = (0);
while(true){
if((i__33654_34677 < count__33653_34676)){
var child_struct_34678 = chunk__33652_34675.cljs$core$IIndexed$_nth$arity$2(null,i__33654_34677);
var children_34679 = shadow.dom.dom_node(child_struct_34678);
if(cljs.core.seq_QMARK_(children_34679)){
var seq__33674_34682 = cljs.core.seq(cljs.core.map.cljs$core$IFn$_invoke$arity$2(shadow.dom.dom_node,children_34679));
var chunk__33676_34683 = null;
var count__33677_34684 = (0);
var i__33678_34685 = (0);
while(true){
if((i__33678_34685 < count__33677_34684)){
var child_34693 = chunk__33676_34683.cljs$core$IIndexed$_nth$arity$2(null,i__33678_34685);
if(cljs.core.truth_(child_34693)){
shadow.dom.append.cljs$core$IFn$_invoke$arity$2(node,child_34693);


var G__34701 = seq__33674_34682;
var G__34702 = chunk__33676_34683;
var G__34703 = count__33677_34684;
var G__34704 = (i__33678_34685 + (1));
seq__33674_34682 = G__34701;
chunk__33676_34683 = G__34702;
count__33677_34684 = G__34703;
i__33678_34685 = G__34704;
continue;
} else {
var G__34706 = seq__33674_34682;
var G__34707 = chunk__33676_34683;
var G__34708 = count__33677_34684;
var G__34709 = (i__33678_34685 + (1));
seq__33674_34682 = G__34706;
chunk__33676_34683 = G__34707;
count__33677_34684 = G__34708;
i__33678_34685 = G__34709;
continue;
}
} else {
var temp__5804__auto___34712 = cljs.core.seq(seq__33674_34682);
if(temp__5804__auto___34712){
var seq__33674_34713__$1 = temp__5804__auto___34712;
if(cljs.core.chunked_seq_QMARK_(seq__33674_34713__$1)){
var c__5525__auto___34714 = cljs.core.chunk_first(seq__33674_34713__$1);
var G__34715 = cljs.core.chunk_rest(seq__33674_34713__$1);
var G__34716 = c__5525__auto___34714;
var G__34717 = cljs.core.count(c__5525__auto___34714);
var G__34718 = (0);
seq__33674_34682 = G__34715;
chunk__33676_34683 = G__34716;
count__33677_34684 = G__34717;
i__33678_34685 = G__34718;
continue;
} else {
var child_34719 = cljs.core.first(seq__33674_34713__$1);
if(cljs.core.truth_(child_34719)){
shadow.dom.append.cljs$core$IFn$_invoke$arity$2(node,child_34719);


var G__34722 = cljs.core.next(seq__33674_34713__$1);
var G__34723 = null;
var G__34724 = (0);
var G__34725 = (0);
seq__33674_34682 = G__34722;
chunk__33676_34683 = G__34723;
count__33677_34684 = G__34724;
i__33678_34685 = G__34725;
continue;
} else {
var G__34726 = cljs.core.next(seq__33674_34713__$1);
var G__34727 = null;
var G__34728 = (0);
var G__34729 = (0);
seq__33674_34682 = G__34726;
chunk__33676_34683 = G__34727;
count__33677_34684 = G__34728;
i__33678_34685 = G__34729;
continue;
}
}
} else {
}
}
break;
}
} else {
shadow.dom.append.cljs$core$IFn$_invoke$arity$2(node,children_34679);
}


var G__34734 = seq__33651_34674;
var G__34735 = chunk__33652_34675;
var G__34736 = count__33653_34676;
var G__34737 = (i__33654_34677 + (1));
seq__33651_34674 = G__34734;
chunk__33652_34675 = G__34735;
count__33653_34676 = G__34736;
i__33654_34677 = G__34737;
continue;
} else {
var temp__5804__auto___34745 = cljs.core.seq(seq__33651_34674);
if(temp__5804__auto___34745){
var seq__33651_34747__$1 = temp__5804__auto___34745;
if(cljs.core.chunked_seq_QMARK_(seq__33651_34747__$1)){
var c__5525__auto___34751 = cljs.core.chunk_first(seq__33651_34747__$1);
var G__34752 = cljs.core.chunk_rest(seq__33651_34747__$1);
var G__34753 = c__5525__auto___34751;
var G__34754 = cljs.core.count(c__5525__auto___34751);
var G__34755 = (0);
seq__33651_34674 = G__34752;
chunk__33652_34675 = G__34753;
count__33653_34676 = G__34754;
i__33654_34677 = G__34755;
continue;
} else {
var child_struct_34757 = cljs.core.first(seq__33651_34747__$1);
var children_34758 = shadow.dom.dom_node(child_struct_34757);
if(cljs.core.seq_QMARK_(children_34758)){
var seq__33684_34761 = cljs.core.seq(cljs.core.map.cljs$core$IFn$_invoke$arity$2(shadow.dom.dom_node,children_34758));
var chunk__33686_34762 = null;
var count__33687_34763 = (0);
var i__33688_34765 = (0);
while(true){
if((i__33688_34765 < count__33687_34763)){
var child_34775 = chunk__33686_34762.cljs$core$IIndexed$_nth$arity$2(null,i__33688_34765);
if(cljs.core.truth_(child_34775)){
shadow.dom.append.cljs$core$IFn$_invoke$arity$2(node,child_34775);


var G__34776 = seq__33684_34761;
var G__34777 = chunk__33686_34762;
var G__34778 = count__33687_34763;
var G__34779 = (i__33688_34765 + (1));
seq__33684_34761 = G__34776;
chunk__33686_34762 = G__34777;
count__33687_34763 = G__34778;
i__33688_34765 = G__34779;
continue;
} else {
var G__34784 = seq__33684_34761;
var G__34785 = chunk__33686_34762;
var G__34786 = count__33687_34763;
var G__34787 = (i__33688_34765 + (1));
seq__33684_34761 = G__34784;
chunk__33686_34762 = G__34785;
count__33687_34763 = G__34786;
i__33688_34765 = G__34787;
continue;
}
} else {
var temp__5804__auto___34790__$1 = cljs.core.seq(seq__33684_34761);
if(temp__5804__auto___34790__$1){
var seq__33684_34792__$1 = temp__5804__auto___34790__$1;
if(cljs.core.chunked_seq_QMARK_(seq__33684_34792__$1)){
var c__5525__auto___34795 = cljs.core.chunk_first(seq__33684_34792__$1);
var G__34797 = cljs.core.chunk_rest(seq__33684_34792__$1);
var G__34798 = c__5525__auto___34795;
var G__34799 = cljs.core.count(c__5525__auto___34795);
var G__34800 = (0);
seq__33684_34761 = G__34797;
chunk__33686_34762 = G__34798;
count__33687_34763 = G__34799;
i__33688_34765 = G__34800;
continue;
} else {
var child_34803 = cljs.core.first(seq__33684_34792__$1);
if(cljs.core.truth_(child_34803)){
shadow.dom.append.cljs$core$IFn$_invoke$arity$2(node,child_34803);


var G__34805 = cljs.core.next(seq__33684_34792__$1);
var G__34806 = null;
var G__34807 = (0);
var G__34808 = (0);
seq__33684_34761 = G__34805;
chunk__33686_34762 = G__34806;
count__33687_34763 = G__34807;
i__33688_34765 = G__34808;
continue;
} else {
var G__34811 = cljs.core.next(seq__33684_34792__$1);
var G__34812 = null;
var G__34813 = (0);
var G__34814 = (0);
seq__33684_34761 = G__34811;
chunk__33686_34762 = G__34812;
count__33687_34763 = G__34813;
i__33688_34765 = G__34814;
continue;
}
}
} else {
}
}
break;
}
} else {
shadow.dom.append.cljs$core$IFn$_invoke$arity$2(node,children_34758);
}


var G__34815 = cljs.core.next(seq__33651_34747__$1);
var G__34816 = null;
var G__34817 = (0);
var G__34818 = (0);
seq__33651_34674 = G__34815;
chunk__33652_34675 = G__34816;
count__33653_34676 = G__34817;
i__33654_34677 = G__34818;
continue;
}
} else {
}
}
break;
}

return node;
});
(cljs.core.Keyword.prototype.shadow$dom$IElement$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.Keyword.prototype.shadow$dom$IElement$_to_dom$arity$1 = (function (this$){
var this$__$1 = this;
return shadow.dom.make_dom_node(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [this$__$1], null));
}));

(cljs.core.PersistentVector.prototype.shadow$dom$IElement$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.PersistentVector.prototype.shadow$dom$IElement$_to_dom$arity$1 = (function (this$){
var this$__$1 = this;
return shadow.dom.make_dom_node(this$__$1);
}));

(cljs.core.LazySeq.prototype.shadow$dom$IElement$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.LazySeq.prototype.shadow$dom$IElement$_to_dom$arity$1 = (function (this$){
var this$__$1 = this;
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(shadow.dom._to_dom,this$__$1);
}));
if(cljs.core.truth_(((typeof HTMLElement) != 'undefined'))){
(HTMLElement.prototype.shadow$dom$IElement$ = cljs.core.PROTOCOL_SENTINEL);

(HTMLElement.prototype.shadow$dom$IElement$_to_dom$arity$1 = (function (this$){
var this$__$1 = this;
return this$__$1;
}));
} else {
}
if(cljs.core.truth_(((typeof DocumentFragment) != 'undefined'))){
(DocumentFragment.prototype.shadow$dom$IElement$ = cljs.core.PROTOCOL_SENTINEL);

(DocumentFragment.prototype.shadow$dom$IElement$_to_dom$arity$1 = (function (this$){
var this$__$1 = this;
return this$__$1;
}));
} else {
}
/**
 * clear node children
 */
shadow.dom.reset = (function shadow$dom$reset(node){
return goog.dom.removeChildren(shadow.dom.dom_node(node));
});
shadow.dom.remove = (function shadow$dom$remove(node){
if((((!((node == null))))?(((((node.cljs$lang$protocol_mask$partition0$ & (8388608))) || ((cljs.core.PROTOCOL_SENTINEL === node.cljs$core$ISeqable$))))?true:false):false)){
var seq__33706 = cljs.core.seq(node);
var chunk__33707 = null;
var count__33708 = (0);
var i__33709 = (0);
while(true){
if((i__33709 < count__33708)){
var n = chunk__33707.cljs$core$IIndexed$_nth$arity$2(null,i__33709);
(shadow.dom.remove.cljs$core$IFn$_invoke$arity$1 ? shadow.dom.remove.cljs$core$IFn$_invoke$arity$1(n) : shadow.dom.remove.call(null,n));


var G__34846 = seq__33706;
var G__34847 = chunk__33707;
var G__34848 = count__33708;
var G__34849 = (i__33709 + (1));
seq__33706 = G__34846;
chunk__33707 = G__34847;
count__33708 = G__34848;
i__33709 = G__34849;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__33706);
if(temp__5804__auto__){
var seq__33706__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__33706__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__33706__$1);
var G__34855 = cljs.core.chunk_rest(seq__33706__$1);
var G__34856 = c__5525__auto__;
var G__34857 = cljs.core.count(c__5525__auto__);
var G__34858 = (0);
seq__33706 = G__34855;
chunk__33707 = G__34856;
count__33708 = G__34857;
i__33709 = G__34858;
continue;
} else {
var n = cljs.core.first(seq__33706__$1);
(shadow.dom.remove.cljs$core$IFn$_invoke$arity$1 ? shadow.dom.remove.cljs$core$IFn$_invoke$arity$1(n) : shadow.dom.remove.call(null,n));


var G__34868 = cljs.core.next(seq__33706__$1);
var G__34869 = null;
var G__34870 = (0);
var G__34871 = (0);
seq__33706 = G__34868;
chunk__33707 = G__34869;
count__33708 = G__34870;
i__33709 = G__34871;
continue;
}
} else {
return null;
}
}
break;
}
} else {
return goog.dom.removeNode(node);
}
});
shadow.dom.replace_node = (function shadow$dom$replace_node(old,new$){
return goog.dom.replaceNode(shadow.dom.dom_node(new$),shadow.dom.dom_node(old));
});
shadow.dom.text = (function shadow$dom$text(var_args){
var G__33715 = arguments.length;
switch (G__33715) {
case 2:
return shadow.dom.text.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 1:
return shadow.dom.text.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(shadow.dom.text.cljs$core$IFn$_invoke$arity$2 = (function (el,new_text){
return (shadow.dom.dom_node(el).innerText = new_text);
}));

(shadow.dom.text.cljs$core$IFn$_invoke$arity$1 = (function (el){
return shadow.dom.dom_node(el).innerText;
}));

(shadow.dom.text.cljs$lang$maxFixedArity = 2);

shadow.dom.check = (function shadow$dom$check(var_args){
var G__33723 = arguments.length;
switch (G__33723) {
case 1:
return shadow.dom.check.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return shadow.dom.check.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(shadow.dom.check.cljs$core$IFn$_invoke$arity$1 = (function (el){
return shadow.dom.check.cljs$core$IFn$_invoke$arity$2(el,true);
}));

(shadow.dom.check.cljs$core$IFn$_invoke$arity$2 = (function (el,checked){
return (shadow.dom.dom_node(el).checked = checked);
}));

(shadow.dom.check.cljs$lang$maxFixedArity = 2);

shadow.dom.checked_QMARK_ = (function shadow$dom$checked_QMARK_(el){
return shadow.dom.dom_node(el).checked;
});
shadow.dom.form_elements = (function shadow$dom$form_elements(el){
return (new shadow.dom.NativeColl(shadow.dom.dom_node(el).elements));
});
shadow.dom.children = (function shadow$dom$children(el){
return (new shadow.dom.NativeColl(shadow.dom.dom_node(el).children));
});
shadow.dom.child_nodes = (function shadow$dom$child_nodes(el){
return (new shadow.dom.NativeColl(shadow.dom.dom_node(el).childNodes));
});
shadow.dom.attr = (function shadow$dom$attr(var_args){
var G__33727 = arguments.length;
switch (G__33727) {
case 2:
return shadow.dom.attr.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return shadow.dom.attr.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(shadow.dom.attr.cljs$core$IFn$_invoke$arity$2 = (function (el,key){
return shadow.dom.dom_node(el).getAttribute(cljs.core.name(key));
}));

(shadow.dom.attr.cljs$core$IFn$_invoke$arity$3 = (function (el,key,default$){
var or__5002__auto__ = shadow.dom.dom_node(el).getAttribute(cljs.core.name(key));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return default$;
}
}));

(shadow.dom.attr.cljs$lang$maxFixedArity = 3);

shadow.dom.del_attr = (function shadow$dom$del_attr(el,key){
return shadow.dom.dom_node(el).removeAttribute(cljs.core.name(key));
});
shadow.dom.data = (function shadow$dom$data(el,key){
return shadow.dom.dom_node(el).getAttribute(["data-",cljs.core.name(key)].join(''));
});
shadow.dom.set_data = (function shadow$dom$set_data(el,key,value){
return shadow.dom.dom_node(el).setAttribute(["data-",cljs.core.name(key)].join(''),cljs.core.str.cljs$core$IFn$_invoke$arity$1(value));
});
shadow.dom.set_html = (function shadow$dom$set_html(node,text){
return (shadow.dom.dom_node(node).innerHTML = text);
});
shadow.dom.get_html = (function shadow$dom$get_html(node){
return shadow.dom.dom_node(node).innerHTML;
});
shadow.dom.fragment = (function shadow$dom$fragment(var_args){
var args__5732__auto__ = [];
var len__5726__auto___34931 = arguments.length;
var i__5727__auto___34932 = (0);
while(true){
if((i__5727__auto___34932 < len__5726__auto___34931)){
args__5732__auto__.push((arguments[i__5727__auto___34932]));

var G__34933 = (i__5727__auto___34932 + (1));
i__5727__auto___34932 = G__34933;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return shadow.dom.fragment.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(shadow.dom.fragment.cljs$core$IFn$_invoke$arity$variadic = (function (nodes){
var fragment = document.createDocumentFragment();
var seq__33754_34935 = cljs.core.seq(nodes);
var chunk__33755_34936 = null;
var count__33756_34937 = (0);
var i__33757_34938 = (0);
while(true){
if((i__33757_34938 < count__33756_34937)){
var node_34939 = chunk__33755_34936.cljs$core$IIndexed$_nth$arity$2(null,i__33757_34938);
fragment.appendChild(shadow.dom._to_dom(node_34939));


var G__34944 = seq__33754_34935;
var G__34945 = chunk__33755_34936;
var G__34946 = count__33756_34937;
var G__34947 = (i__33757_34938 + (1));
seq__33754_34935 = G__34944;
chunk__33755_34936 = G__34945;
count__33756_34937 = G__34946;
i__33757_34938 = G__34947;
continue;
} else {
var temp__5804__auto___34949 = cljs.core.seq(seq__33754_34935);
if(temp__5804__auto___34949){
var seq__33754_34950__$1 = temp__5804__auto___34949;
if(cljs.core.chunked_seq_QMARK_(seq__33754_34950__$1)){
var c__5525__auto___34951 = cljs.core.chunk_first(seq__33754_34950__$1);
var G__34952 = cljs.core.chunk_rest(seq__33754_34950__$1);
var G__34953 = c__5525__auto___34951;
var G__34954 = cljs.core.count(c__5525__auto___34951);
var G__34955 = (0);
seq__33754_34935 = G__34952;
chunk__33755_34936 = G__34953;
count__33756_34937 = G__34954;
i__33757_34938 = G__34955;
continue;
} else {
var node_34956 = cljs.core.first(seq__33754_34950__$1);
fragment.appendChild(shadow.dom._to_dom(node_34956));


var G__34957 = cljs.core.next(seq__33754_34950__$1);
var G__34958 = null;
var G__34959 = (0);
var G__34960 = (0);
seq__33754_34935 = G__34957;
chunk__33755_34936 = G__34958;
count__33756_34937 = G__34959;
i__33757_34938 = G__34960;
continue;
}
} else {
}
}
break;
}

return (new shadow.dom.NativeColl(fragment));
}));

(shadow.dom.fragment.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(shadow.dom.fragment.cljs$lang$applyTo = (function (seq33747){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq33747));
}));

/**
 * given a html string, eval all <script> tags and return the html without the scripts
 * don't do this for everything, only content you trust.
 */
shadow.dom.eval_scripts = (function shadow$dom$eval_scripts(s){
var scripts = cljs.core.re_seq(/<script[^>]*?>(.+?)<\/script>/,s);
var seq__33773_34964 = cljs.core.seq(scripts);
var chunk__33774_34965 = null;
var count__33775_34966 = (0);
var i__33776_34967 = (0);
while(true){
if((i__33776_34967 < count__33775_34966)){
var vec__33789_34968 = chunk__33774_34965.cljs$core$IIndexed$_nth$arity$2(null,i__33776_34967);
var script_tag_34969 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33789_34968,(0),null);
var script_body_34970 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33789_34968,(1),null);
eval(script_body_34970);


var G__34974 = seq__33773_34964;
var G__34975 = chunk__33774_34965;
var G__34976 = count__33775_34966;
var G__34977 = (i__33776_34967 + (1));
seq__33773_34964 = G__34974;
chunk__33774_34965 = G__34975;
count__33775_34966 = G__34976;
i__33776_34967 = G__34977;
continue;
} else {
var temp__5804__auto___34979 = cljs.core.seq(seq__33773_34964);
if(temp__5804__auto___34979){
var seq__33773_34980__$1 = temp__5804__auto___34979;
if(cljs.core.chunked_seq_QMARK_(seq__33773_34980__$1)){
var c__5525__auto___34982 = cljs.core.chunk_first(seq__33773_34980__$1);
var G__34983 = cljs.core.chunk_rest(seq__33773_34980__$1);
var G__34984 = c__5525__auto___34982;
var G__34985 = cljs.core.count(c__5525__auto___34982);
var G__34986 = (0);
seq__33773_34964 = G__34983;
chunk__33774_34965 = G__34984;
count__33775_34966 = G__34985;
i__33776_34967 = G__34986;
continue;
} else {
var vec__33798_34987 = cljs.core.first(seq__33773_34980__$1);
var script_tag_34988 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33798_34987,(0),null);
var script_body_34989 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33798_34987,(1),null);
eval(script_body_34989);


var G__34993 = cljs.core.next(seq__33773_34980__$1);
var G__34994 = null;
var G__34995 = (0);
var G__34996 = (0);
seq__33773_34964 = G__34993;
chunk__33774_34965 = G__34994;
count__33775_34966 = G__34995;
i__33776_34967 = G__34996;
continue;
}
} else {
}
}
break;
}

return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (s__$1,p__33801){
var vec__33803 = p__33801;
var script_tag = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33803,(0),null);
var script_body = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33803,(1),null);
return clojure.string.replace(s__$1,script_tag,"");
}),s,scripts);
});
shadow.dom.str__GT_fragment = (function shadow$dom$str__GT_fragment(s){
var el = document.createElement("div");
(el.innerHTML = s);

return (new shadow.dom.NativeColl(goog.dom.childrenToNode_(document,el)));
});
shadow.dom.node_name = (function shadow$dom$node_name(el){
return shadow.dom.dom_node(el).nodeName;
});
shadow.dom.ancestor_by_class = (function shadow$dom$ancestor_by_class(el,cls){
return goog.dom.getAncestorByClass(shadow.dom.dom_node(el),cls);
});
shadow.dom.ancestor_by_tag = (function shadow$dom$ancestor_by_tag(var_args){
var G__33820 = arguments.length;
switch (G__33820) {
case 2:
return shadow.dom.ancestor_by_tag.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return shadow.dom.ancestor_by_tag.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(shadow.dom.ancestor_by_tag.cljs$core$IFn$_invoke$arity$2 = (function (el,tag){
return goog.dom.getAncestorByTagNameAndClass(shadow.dom.dom_node(el),cljs.core.name(tag));
}));

(shadow.dom.ancestor_by_tag.cljs$core$IFn$_invoke$arity$3 = (function (el,tag,cls){
return goog.dom.getAncestorByTagNameAndClass(shadow.dom.dom_node(el),cljs.core.name(tag),cljs.core.name(cls));
}));

(shadow.dom.ancestor_by_tag.cljs$lang$maxFixedArity = 3);

shadow.dom.get_value = (function shadow$dom$get_value(dom){
return goog.dom.forms.getValue(shadow.dom.dom_node(dom));
});
shadow.dom.set_value = (function shadow$dom$set_value(dom,value){
return goog.dom.forms.setValue(shadow.dom.dom_node(dom),value);
});
shadow.dom.px = (function shadow$dom$px(value){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1((value | (0))),"px"].join('');
});
shadow.dom.pct = (function shadow$dom$pct(value){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(value),"%"].join('');
});
shadow.dom.remove_style_STAR_ = (function shadow$dom$remove_style_STAR_(el,style){
return el.style.removeProperty(cljs.core.name(style));
});
shadow.dom.remove_style = (function shadow$dom$remove_style(el,style){
var el__$1 = shadow.dom.dom_node(el);
return shadow.dom.remove_style_STAR_(el__$1,style);
});
shadow.dom.remove_styles = (function shadow$dom$remove_styles(el,style_keys){
var el__$1 = shadow.dom.dom_node(el);
var seq__33838 = cljs.core.seq(style_keys);
var chunk__33839 = null;
var count__33840 = (0);
var i__33841 = (0);
while(true){
if((i__33841 < count__33840)){
var it = chunk__33839.cljs$core$IIndexed$_nth$arity$2(null,i__33841);
shadow.dom.remove_style_STAR_(el__$1,it);


var G__35042 = seq__33838;
var G__35043 = chunk__33839;
var G__35044 = count__33840;
var G__35045 = (i__33841 + (1));
seq__33838 = G__35042;
chunk__33839 = G__35043;
count__33840 = G__35044;
i__33841 = G__35045;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__33838);
if(temp__5804__auto__){
var seq__33838__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__33838__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__33838__$1);
var G__35049 = cljs.core.chunk_rest(seq__33838__$1);
var G__35050 = c__5525__auto__;
var G__35051 = cljs.core.count(c__5525__auto__);
var G__35052 = (0);
seq__33838 = G__35049;
chunk__33839 = G__35050;
count__33840 = G__35051;
i__33841 = G__35052;
continue;
} else {
var it = cljs.core.first(seq__33838__$1);
shadow.dom.remove_style_STAR_(el__$1,it);


var G__35057 = cljs.core.next(seq__33838__$1);
var G__35058 = null;
var G__35059 = (0);
var G__35060 = (0);
seq__33838 = G__35057;
chunk__33839 = G__35058;
count__33840 = G__35059;
i__33841 = G__35060;
continue;
}
} else {
return null;
}
}
break;
}
});

/**
* @constructor
 * @implements {cljs.core.IRecord}
 * @implements {cljs.core.IKVReduce}
 * @implements {cljs.core.IEquiv}
 * @implements {cljs.core.IHash}
 * @implements {cljs.core.ICollection}
 * @implements {cljs.core.ICounted}
 * @implements {cljs.core.ISeqable}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.ICloneable}
 * @implements {cljs.core.IPrintWithWriter}
 * @implements {cljs.core.IIterable}
 * @implements {cljs.core.IWithMeta}
 * @implements {cljs.core.IAssociative}
 * @implements {cljs.core.IMap}
 * @implements {cljs.core.ILookup}
*/
shadow.dom.Coordinate = (function (x,y,__meta,__extmap,__hash){
this.x = x;
this.y = y;
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(shadow.dom.Coordinate.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(shadow.dom.Coordinate.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k33846,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__33866 = k33846;
var G__33866__$1 = (((G__33866 instanceof cljs.core.Keyword))?G__33866.fqn:null);
switch (G__33866__$1) {
case "x":
return self__.x;

break;
case "y":
return self__.y;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k33846,else__5303__auto__);

}
}));

(shadow.dom.Coordinate.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__33867){
var vec__33868 = p__33867;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33868,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33868,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(shadow.dom.Coordinate.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#shadow.dom.Coordinate{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"x","x",2099068185),self__.x],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"y","y",-1757859776),self__.y],null))], null),self__.__extmap));
}));

(shadow.dom.Coordinate.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__33845){
var self__ = this;
var G__33845__$1 = this;
return (new cljs.core.RecordIter((0),G__33845__$1,2,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"x","x",2099068185),new cljs.core.Keyword(null,"y","y",-1757859776)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(shadow.dom.Coordinate.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(shadow.dom.Coordinate.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new shadow.dom.Coordinate(self__.x,self__.y,self__.__meta,self__.__extmap,self__.__hash));
}));

(shadow.dom.Coordinate.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (2 + cljs.core.count(self__.__extmap));
}));

(shadow.dom.Coordinate.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (145542109 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(shadow.dom.Coordinate.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this33847,other33848){
var self__ = this;
var this33847__$1 = this;
return (((!((other33848 == null)))) && ((((this33847__$1.constructor === other33848.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this33847__$1.x,other33848.x)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this33847__$1.y,other33848.y)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this33847__$1.__extmap,other33848.__extmap)))))))));
}));

(shadow.dom.Coordinate.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"y","y",-1757859776),null,new cljs.core.Keyword(null,"x","x",2099068185),null], null), null),k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new shadow.dom.Coordinate(self__.x,self__.y,self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(shadow.dom.Coordinate.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k33846){
var self__ = this;
var this__5307__auto____$1 = this;
var G__33879 = k33846;
var G__33879__$1 = (((G__33879 instanceof cljs.core.Keyword))?G__33879.fqn:null);
switch (G__33879__$1) {
case "x":
case "y":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k33846);

}
}));

(shadow.dom.Coordinate.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__33845){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__33880 = cljs.core.keyword_identical_QMARK_;
var expr__33881 = k__5309__auto__;
if(cljs.core.truth_((pred__33880.cljs$core$IFn$_invoke$arity$2 ? pred__33880.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"x","x",2099068185),expr__33881) : pred__33880.call(null,new cljs.core.Keyword(null,"x","x",2099068185),expr__33881)))){
return (new shadow.dom.Coordinate(G__33845,self__.y,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__33880.cljs$core$IFn$_invoke$arity$2 ? pred__33880.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"y","y",-1757859776),expr__33881) : pred__33880.call(null,new cljs.core.Keyword(null,"y","y",-1757859776),expr__33881)))){
return (new shadow.dom.Coordinate(self__.x,G__33845,self__.__meta,self__.__extmap,null));
} else {
return (new shadow.dom.Coordinate(self__.x,self__.y,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__33845),null));
}
}
}));

(shadow.dom.Coordinate.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"x","x",2099068185),self__.x,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"y","y",-1757859776),self__.y,null))], null),self__.__extmap));
}));

(shadow.dom.Coordinate.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__33845){
var self__ = this;
var this__5299__auto____$1 = this;
return (new shadow.dom.Coordinate(self__.x,self__.y,G__33845,self__.__extmap,self__.__hash));
}));

(shadow.dom.Coordinate.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(shadow.dom.Coordinate.getBasis = (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"x","x",-555367584,null),new cljs.core.Symbol(null,"y","y",-117328249,null)], null);
}));

(shadow.dom.Coordinate.cljs$lang$type = true);

(shadow.dom.Coordinate.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"shadow.dom/Coordinate",null,(1),null));
}));

(shadow.dom.Coordinate.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"shadow.dom/Coordinate");
}));

/**
 * Positional factory function for shadow.dom/Coordinate.
 */
shadow.dom.__GT_Coordinate = (function shadow$dom$__GT_Coordinate(x,y){
return (new shadow.dom.Coordinate(x,y,null,null,null));
});

/**
 * Factory function for shadow.dom/Coordinate, taking a map of keywords to field values.
 */
shadow.dom.map__GT_Coordinate = (function shadow$dom$map__GT_Coordinate(G__33850){
var extmap__5342__auto__ = (function (){var G__33907 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(G__33850,new cljs.core.Keyword(null,"x","x",2099068185),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"y","y",-1757859776)], 0));
if(cljs.core.record_QMARK_(G__33850)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__33907);
} else {
return G__33907;
}
})();
return (new shadow.dom.Coordinate(new cljs.core.Keyword(null,"x","x",2099068185).cljs$core$IFn$_invoke$arity$1(G__33850),new cljs.core.Keyword(null,"y","y",-1757859776).cljs$core$IFn$_invoke$arity$1(G__33850),null,cljs.core.not_empty(extmap__5342__auto__),null));
});

shadow.dom.get_position = (function shadow$dom$get_position(el){
var pos = goog.style.getPosition(shadow.dom.dom_node(el));
return shadow.dom.__GT_Coordinate(pos.x,pos.y);
});
shadow.dom.get_client_position = (function shadow$dom$get_client_position(el){
var pos = goog.style.getClientPosition(shadow.dom.dom_node(el));
return shadow.dom.__GT_Coordinate(pos.x,pos.y);
});
shadow.dom.get_page_offset = (function shadow$dom$get_page_offset(el){
var pos = goog.style.getPageOffset(shadow.dom.dom_node(el));
return shadow.dom.__GT_Coordinate(pos.x,pos.y);
});

/**
* @constructor
 * @implements {cljs.core.IRecord}
 * @implements {cljs.core.IKVReduce}
 * @implements {cljs.core.IEquiv}
 * @implements {cljs.core.IHash}
 * @implements {cljs.core.ICollection}
 * @implements {cljs.core.ICounted}
 * @implements {cljs.core.ISeqable}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.ICloneable}
 * @implements {cljs.core.IPrintWithWriter}
 * @implements {cljs.core.IIterable}
 * @implements {cljs.core.IWithMeta}
 * @implements {cljs.core.IAssociative}
 * @implements {cljs.core.IMap}
 * @implements {cljs.core.ILookup}
*/
shadow.dom.Size = (function (w,h,__meta,__extmap,__hash){
this.w = w;
this.h = h;
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(shadow.dom.Size.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(shadow.dom.Size.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k33913,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__33924 = k33913;
var G__33924__$1 = (((G__33924 instanceof cljs.core.Keyword))?G__33924.fqn:null);
switch (G__33924__$1) {
case "w":
return self__.w;

break;
case "h":
return self__.h;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k33913,else__5303__auto__);

}
}));

(shadow.dom.Size.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__33925){
var vec__33927 = p__33925;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33927,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33927,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(shadow.dom.Size.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#shadow.dom.Size{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"w","w",354169001),self__.w],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"h","h",1109658740),self__.h],null))], null),self__.__extmap));
}));

(shadow.dom.Size.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__33912){
var self__ = this;
var G__33912__$1 = this;
return (new cljs.core.RecordIter((0),G__33912__$1,2,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"w","w",354169001),new cljs.core.Keyword(null,"h","h",1109658740)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(shadow.dom.Size.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(shadow.dom.Size.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new shadow.dom.Size(self__.w,self__.h,self__.__meta,self__.__extmap,self__.__hash));
}));

(shadow.dom.Size.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (2 + cljs.core.count(self__.__extmap));
}));

(shadow.dom.Size.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (-1228019642 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(shadow.dom.Size.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this33914,other33915){
var self__ = this;
var this33914__$1 = this;
return (((!((other33915 == null)))) && ((((this33914__$1.constructor === other33915.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this33914__$1.w,other33915.w)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this33914__$1.h,other33915.h)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this33914__$1.__extmap,other33915.__extmap)))))))));
}));

(shadow.dom.Size.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"w","w",354169001),null,new cljs.core.Keyword(null,"h","h",1109658740),null], null), null),k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new shadow.dom.Size(self__.w,self__.h,self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(shadow.dom.Size.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k33913){
var self__ = this;
var this__5307__auto____$1 = this;
var G__33952 = k33913;
var G__33952__$1 = (((G__33952 instanceof cljs.core.Keyword))?G__33952.fqn:null);
switch (G__33952__$1) {
case "w":
case "h":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k33913);

}
}));

(shadow.dom.Size.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__33912){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__33953 = cljs.core.keyword_identical_QMARK_;
var expr__33954 = k__5309__auto__;
if(cljs.core.truth_((pred__33953.cljs$core$IFn$_invoke$arity$2 ? pred__33953.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"w","w",354169001),expr__33954) : pred__33953.call(null,new cljs.core.Keyword(null,"w","w",354169001),expr__33954)))){
return (new shadow.dom.Size(G__33912,self__.h,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__33953.cljs$core$IFn$_invoke$arity$2 ? pred__33953.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"h","h",1109658740),expr__33954) : pred__33953.call(null,new cljs.core.Keyword(null,"h","h",1109658740),expr__33954)))){
return (new shadow.dom.Size(self__.w,G__33912,self__.__meta,self__.__extmap,null));
} else {
return (new shadow.dom.Size(self__.w,self__.h,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__33912),null));
}
}
}));

(shadow.dom.Size.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"w","w",354169001),self__.w,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"h","h",1109658740),self__.h,null))], null),self__.__extmap));
}));

(shadow.dom.Size.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__33912){
var self__ = this;
var this__5299__auto____$1 = this;
return (new shadow.dom.Size(self__.w,self__.h,G__33912,self__.__extmap,self__.__hash));
}));

(shadow.dom.Size.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(shadow.dom.Size.getBasis = (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"w","w",1994700528,null),new cljs.core.Symbol(null,"h","h",-1544777029,null)], null);
}));

(shadow.dom.Size.cljs$lang$type = true);

(shadow.dom.Size.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"shadow.dom/Size",null,(1),null));
}));

(shadow.dom.Size.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"shadow.dom/Size");
}));

/**
 * Positional factory function for shadow.dom/Size.
 */
shadow.dom.__GT_Size = (function shadow$dom$__GT_Size(w,h){
return (new shadow.dom.Size(w,h,null,null,null));
});

/**
 * Factory function for shadow.dom/Size, taking a map of keywords to field values.
 */
shadow.dom.map__GT_Size = (function shadow$dom$map__GT_Size(G__33916){
var extmap__5342__auto__ = (function (){var G__33963 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(G__33916,new cljs.core.Keyword(null,"w","w",354169001),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"h","h",1109658740)], 0));
if(cljs.core.record_QMARK_(G__33916)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__33963);
} else {
return G__33963;
}
})();
return (new shadow.dom.Size(new cljs.core.Keyword(null,"w","w",354169001).cljs$core$IFn$_invoke$arity$1(G__33916),new cljs.core.Keyword(null,"h","h",1109658740).cljs$core$IFn$_invoke$arity$1(G__33916),null,cljs.core.not_empty(extmap__5342__auto__),null));
});

shadow.dom.size__GT_clj = (function shadow$dom$size__GT_clj(size){
return (new shadow.dom.Size(size.width,size.height,null,null,null));
});
shadow.dom.get_size = (function shadow$dom$get_size(el){
return shadow.dom.size__GT_clj(goog.style.getSize(shadow.dom.dom_node(el)));
});
shadow.dom.get_height = (function shadow$dom$get_height(el){
return shadow.dom.get_size(el).h;
});
shadow.dom.get_viewport_size = (function shadow$dom$get_viewport_size(){
return shadow.dom.size__GT_clj(goog.dom.getViewportSize());
});
shadow.dom.first_child = (function shadow$dom$first_child(el){
return (shadow.dom.dom_node(el).children[(0)]);
});
shadow.dom.select_option_values = (function shadow$dom$select_option_values(el){
var native$ = shadow.dom.dom_node(el);
var opts = (native$["options"]);
var a__5590__auto__ = opts;
var l__5591__auto__ = a__5590__auto__.length;
var i = (0);
var ret = cljs.core.PersistentVector.EMPTY;
while(true){
if((i < l__5591__auto__)){
var G__35185 = (i + (1));
var G__35186 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(ret,(opts[i]["value"]));
i = G__35185;
ret = G__35186;
continue;
} else {
return ret;
}
break;
}
});
shadow.dom.build_url = (function shadow$dom$build_url(path,query_params){
if(cljs.core.empty_QMARK_(query_params)){
return path;
} else {
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(path),"?",clojure.string.join.cljs$core$IFn$_invoke$arity$2("&",cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__34005){
var vec__34006 = p__34005;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__34006,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__34006,(1),null);
return [cljs.core.name(k),"=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(encodeURIComponent(cljs.core.str.cljs$core$IFn$_invoke$arity$1(v)))].join('');
}),query_params))].join('');
}
});
shadow.dom.redirect = (function shadow$dom$redirect(var_args){
var G__34010 = arguments.length;
switch (G__34010) {
case 1:
return shadow.dom.redirect.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return shadow.dom.redirect.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(shadow.dom.redirect.cljs$core$IFn$_invoke$arity$1 = (function (path){
return shadow.dom.redirect.cljs$core$IFn$_invoke$arity$2(path,cljs.core.PersistentArrayMap.EMPTY);
}));

(shadow.dom.redirect.cljs$core$IFn$_invoke$arity$2 = (function (path,query_params){
return (document["location"]["href"] = shadow.dom.build_url(path,query_params));
}));

(shadow.dom.redirect.cljs$lang$maxFixedArity = 2);

shadow.dom.reload_BANG_ = (function shadow$dom$reload_BANG_(){
return (document.location.href = document.location.href);
});
shadow.dom.tag_name = (function shadow$dom$tag_name(el){
var dom = shadow.dom.dom_node(el);
return dom.tagName;
});
shadow.dom.insert_after = (function shadow$dom$insert_after(ref,new$){
var new_node = shadow.dom.dom_node(new$);
goog.dom.insertSiblingAfter(new_node,shadow.dom.dom_node(ref));

return new_node;
});
shadow.dom.insert_before = (function shadow$dom$insert_before(ref,new$){
var new_node = shadow.dom.dom_node(new$);
goog.dom.insertSiblingBefore(new_node,shadow.dom.dom_node(ref));

return new_node;
});
shadow.dom.insert_first = (function shadow$dom$insert_first(ref,new$){
var temp__5802__auto__ = shadow.dom.dom_node(ref).firstChild;
if(cljs.core.truth_(temp__5802__auto__)){
var child = temp__5802__auto__;
return shadow.dom.insert_before(child,new$);
} else {
return shadow.dom.append.cljs$core$IFn$_invoke$arity$2(ref,new$);
}
});
shadow.dom.index_of = (function shadow$dom$index_of(el){
var el__$1 = shadow.dom.dom_node(el);
var i = (0);
while(true){
var ps = el__$1.previousSibling;
if((ps == null)){
return i;
} else {
var G__35195 = ps;
var G__35196 = (i + (1));
el__$1 = G__35195;
i = G__35196;
continue;
}
break;
}
});
shadow.dom.get_parent = (function shadow$dom$get_parent(el){
return goog.dom.getParentElement(shadow.dom.dom_node(el));
});
shadow.dom.parents = (function shadow$dom$parents(el){
var parent = shadow.dom.get_parent(el);
if(cljs.core.truth_(parent)){
return cljs.core.cons(parent,(new cljs.core.LazySeq(null,(function (){
return (shadow.dom.parents.cljs$core$IFn$_invoke$arity$1 ? shadow.dom.parents.cljs$core$IFn$_invoke$arity$1(parent) : shadow.dom.parents.call(null,parent));
}),null,null)));
} else {
return null;
}
});
shadow.dom.matches = (function shadow$dom$matches(el,sel){
return shadow.dom.dom_node(el).matches(sel);
});
shadow.dom.get_next_sibling = (function shadow$dom$get_next_sibling(el){
return goog.dom.getNextElementSibling(shadow.dom.dom_node(el));
});
shadow.dom.get_previous_sibling = (function shadow$dom$get_previous_sibling(el){
return goog.dom.getPreviousElementSibling(shadow.dom.dom_node(el));
});
shadow.dom.xmlns = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 2, ["svg","http://www.w3.org/2000/svg","xlink","http://www.w3.org/1999/xlink"], null));
shadow.dom.create_svg_node = (function shadow$dom$create_svg_node(tag_def,props){
var vec__34110 = shadow.dom.parse_tag(tag_def);
var tag_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__34110,(0),null);
var tag_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__34110,(1),null);
var tag_classes = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__34110,(2),null);
var el = document.createElementNS("http://www.w3.org/2000/svg",tag_name);
if(cljs.core.truth_(tag_id)){
el.setAttribute("id",tag_id);
} else {
}

if(cljs.core.truth_(tag_classes)){
el.setAttribute("class",shadow.dom.merge_class_string(new cljs.core.Keyword(null,"class","class",-2030961996).cljs$core$IFn$_invoke$arity$1(props),tag_classes));
} else {
}

var seq__34114_35207 = cljs.core.seq(props);
var chunk__34115_35208 = null;
var count__34116_35209 = (0);
var i__34117_35210 = (0);
while(true){
if((i__34117_35210 < count__34116_35209)){
var vec__34138_35211 = chunk__34115_35208.cljs$core$IIndexed$_nth$arity$2(null,i__34117_35210);
var k_35212 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__34138_35211,(0),null);
var v_35213 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__34138_35211,(1),null);
el.setAttributeNS((function (){var temp__5804__auto__ = cljs.core.namespace(k_35212);
if(cljs.core.truth_(temp__5804__auto__)){
var ns = temp__5804__auto__;
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(shadow.dom.xmlns),ns);
} else {
return null;
}
})(),cljs.core.name(k_35212),v_35213);


var G__35218 = seq__34114_35207;
var G__35219 = chunk__34115_35208;
var G__35220 = count__34116_35209;
var G__35221 = (i__34117_35210 + (1));
seq__34114_35207 = G__35218;
chunk__34115_35208 = G__35219;
count__34116_35209 = G__35220;
i__34117_35210 = G__35221;
continue;
} else {
var temp__5804__auto___35223 = cljs.core.seq(seq__34114_35207);
if(temp__5804__auto___35223){
var seq__34114_35224__$1 = temp__5804__auto___35223;
if(cljs.core.chunked_seq_QMARK_(seq__34114_35224__$1)){
var c__5525__auto___35226 = cljs.core.chunk_first(seq__34114_35224__$1);
var G__35228 = cljs.core.chunk_rest(seq__34114_35224__$1);
var G__35229 = c__5525__auto___35226;
var G__35230 = cljs.core.count(c__5525__auto___35226);
var G__35231 = (0);
seq__34114_35207 = G__35228;
chunk__34115_35208 = G__35229;
count__34116_35209 = G__35230;
i__34117_35210 = G__35231;
continue;
} else {
var vec__34145_35233 = cljs.core.first(seq__34114_35224__$1);
var k_35234 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__34145_35233,(0),null);
var v_35235 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__34145_35233,(1),null);
el.setAttributeNS((function (){var temp__5804__auto____$1 = cljs.core.namespace(k_35234);
if(cljs.core.truth_(temp__5804__auto____$1)){
var ns = temp__5804__auto____$1;
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(shadow.dom.xmlns),ns);
} else {
return null;
}
})(),cljs.core.name(k_35234),v_35235);


var G__35240 = cljs.core.next(seq__34114_35224__$1);
var G__35241 = null;
var G__35242 = (0);
var G__35243 = (0);
seq__34114_35207 = G__35240;
chunk__34115_35208 = G__35241;
count__34116_35209 = G__35242;
i__34117_35210 = G__35243;
continue;
}
} else {
}
}
break;
}

return el;
});
shadow.dom.svg_node = (function shadow$dom$svg_node(el){
if((el == null)){
return null;
} else {
if((((!((el == null))))?((((false) || ((cljs.core.PROTOCOL_SENTINEL === el.shadow$dom$SVGElement$))))?true:false):false)){
return el.shadow$dom$SVGElement$_to_svg$arity$1(null);
} else {
return el;

}
}
});
shadow.dom.make_svg_node = (function shadow$dom$make_svg_node(structure){
var vec__34164 = shadow.dom.destructure_node(shadow.dom.create_svg_node,structure);
var node = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__34164,(0),null);
var node_children = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__34164,(1),null);
var seq__34168_35264 = cljs.core.seq(node_children);
var chunk__34170_35265 = null;
var count__34171_35266 = (0);
var i__34172_35267 = (0);
while(true){
if((i__34172_35267 < count__34171_35266)){
var child_struct_35268 = chunk__34170_35265.cljs$core$IIndexed$_nth$arity$2(null,i__34172_35267);
if((!((child_struct_35268 == null)))){
if(typeof child_struct_35268 === 'string'){
var text_35272 = (node["textContent"]);
(node["textContent"] = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(text_35272),child_struct_35268].join(''));
} else {
var children_35273 = shadow.dom.svg_node(child_struct_35268);
if(cljs.core.seq_QMARK_(children_35273)){
var seq__34272_35276 = cljs.core.seq(children_35273);
var chunk__34274_35277 = null;
var count__34275_35278 = (0);
var i__34276_35279 = (0);
while(true){
if((i__34276_35279 < count__34275_35278)){
var child_35281 = chunk__34274_35277.cljs$core$IIndexed$_nth$arity$2(null,i__34276_35279);
if(cljs.core.truth_(child_35281)){
node.appendChild(child_35281);


var G__35284 = seq__34272_35276;
var G__35285 = chunk__34274_35277;
var G__35286 = count__34275_35278;
var G__35287 = (i__34276_35279 + (1));
seq__34272_35276 = G__35284;
chunk__34274_35277 = G__35285;
count__34275_35278 = G__35286;
i__34276_35279 = G__35287;
continue;
} else {
var G__35288 = seq__34272_35276;
var G__35289 = chunk__34274_35277;
var G__35290 = count__34275_35278;
var G__35291 = (i__34276_35279 + (1));
seq__34272_35276 = G__35288;
chunk__34274_35277 = G__35289;
count__34275_35278 = G__35290;
i__34276_35279 = G__35291;
continue;
}
} else {
var temp__5804__auto___35292 = cljs.core.seq(seq__34272_35276);
if(temp__5804__auto___35292){
var seq__34272_35293__$1 = temp__5804__auto___35292;
if(cljs.core.chunked_seq_QMARK_(seq__34272_35293__$1)){
var c__5525__auto___35294 = cljs.core.chunk_first(seq__34272_35293__$1);
var G__35295 = cljs.core.chunk_rest(seq__34272_35293__$1);
var G__35296 = c__5525__auto___35294;
var G__35297 = cljs.core.count(c__5525__auto___35294);
var G__35298 = (0);
seq__34272_35276 = G__35295;
chunk__34274_35277 = G__35296;
count__34275_35278 = G__35297;
i__34276_35279 = G__35298;
continue;
} else {
var child_35299 = cljs.core.first(seq__34272_35293__$1);
if(cljs.core.truth_(child_35299)){
node.appendChild(child_35299);


var G__35300 = cljs.core.next(seq__34272_35293__$1);
var G__35301 = null;
var G__35302 = (0);
var G__35303 = (0);
seq__34272_35276 = G__35300;
chunk__34274_35277 = G__35301;
count__34275_35278 = G__35302;
i__34276_35279 = G__35303;
continue;
} else {
var G__35304 = cljs.core.next(seq__34272_35293__$1);
var G__35305 = null;
var G__35306 = (0);
var G__35307 = (0);
seq__34272_35276 = G__35304;
chunk__34274_35277 = G__35305;
count__34275_35278 = G__35306;
i__34276_35279 = G__35307;
continue;
}
}
} else {
}
}
break;
}
} else {
node.appendChild(children_35273);
}
}


var G__35308 = seq__34168_35264;
var G__35309 = chunk__34170_35265;
var G__35310 = count__34171_35266;
var G__35311 = (i__34172_35267 + (1));
seq__34168_35264 = G__35308;
chunk__34170_35265 = G__35309;
count__34171_35266 = G__35310;
i__34172_35267 = G__35311;
continue;
} else {
var G__35312 = seq__34168_35264;
var G__35313 = chunk__34170_35265;
var G__35314 = count__34171_35266;
var G__35315 = (i__34172_35267 + (1));
seq__34168_35264 = G__35312;
chunk__34170_35265 = G__35313;
count__34171_35266 = G__35314;
i__34172_35267 = G__35315;
continue;
}
} else {
var temp__5804__auto___35316 = cljs.core.seq(seq__34168_35264);
if(temp__5804__auto___35316){
var seq__34168_35317__$1 = temp__5804__auto___35316;
if(cljs.core.chunked_seq_QMARK_(seq__34168_35317__$1)){
var c__5525__auto___35328 = cljs.core.chunk_first(seq__34168_35317__$1);
var G__35330 = cljs.core.chunk_rest(seq__34168_35317__$1);
var G__35331 = c__5525__auto___35328;
var G__35332 = cljs.core.count(c__5525__auto___35328);
var G__35333 = (0);
seq__34168_35264 = G__35330;
chunk__34170_35265 = G__35331;
count__34171_35266 = G__35332;
i__34172_35267 = G__35333;
continue;
} else {
var child_struct_35334 = cljs.core.first(seq__34168_35317__$1);
if((!((child_struct_35334 == null)))){
if(typeof child_struct_35334 === 'string'){
var text_35336 = (node["textContent"]);
(node["textContent"] = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(text_35336),child_struct_35334].join(''));
} else {
var children_35337 = shadow.dom.svg_node(child_struct_35334);
if(cljs.core.seq_QMARK_(children_35337)){
var seq__34310_35342 = cljs.core.seq(children_35337);
var chunk__34312_35343 = null;
var count__34313_35344 = (0);
var i__34314_35345 = (0);
while(true){
if((i__34314_35345 < count__34313_35344)){
var child_35347 = chunk__34312_35343.cljs$core$IIndexed$_nth$arity$2(null,i__34314_35345);
if(cljs.core.truth_(child_35347)){
node.appendChild(child_35347);


var G__35349 = seq__34310_35342;
var G__35350 = chunk__34312_35343;
var G__35351 = count__34313_35344;
var G__35352 = (i__34314_35345 + (1));
seq__34310_35342 = G__35349;
chunk__34312_35343 = G__35350;
count__34313_35344 = G__35351;
i__34314_35345 = G__35352;
continue;
} else {
var G__35353 = seq__34310_35342;
var G__35354 = chunk__34312_35343;
var G__35355 = count__34313_35344;
var G__35356 = (i__34314_35345 + (1));
seq__34310_35342 = G__35353;
chunk__34312_35343 = G__35354;
count__34313_35344 = G__35355;
i__34314_35345 = G__35356;
continue;
}
} else {
var temp__5804__auto___35357__$1 = cljs.core.seq(seq__34310_35342);
if(temp__5804__auto___35357__$1){
var seq__34310_35358__$1 = temp__5804__auto___35357__$1;
if(cljs.core.chunked_seq_QMARK_(seq__34310_35358__$1)){
var c__5525__auto___35359 = cljs.core.chunk_first(seq__34310_35358__$1);
var G__35360 = cljs.core.chunk_rest(seq__34310_35358__$1);
var G__35361 = c__5525__auto___35359;
var G__35362 = cljs.core.count(c__5525__auto___35359);
var G__35363 = (0);
seq__34310_35342 = G__35360;
chunk__34312_35343 = G__35361;
count__34313_35344 = G__35362;
i__34314_35345 = G__35363;
continue;
} else {
var child_35364 = cljs.core.first(seq__34310_35358__$1);
if(cljs.core.truth_(child_35364)){
node.appendChild(child_35364);


var G__35367 = cljs.core.next(seq__34310_35358__$1);
var G__35368 = null;
var G__35369 = (0);
var G__35370 = (0);
seq__34310_35342 = G__35367;
chunk__34312_35343 = G__35368;
count__34313_35344 = G__35369;
i__34314_35345 = G__35370;
continue;
} else {
var G__35371 = cljs.core.next(seq__34310_35358__$1);
var G__35372 = null;
var G__35373 = (0);
var G__35374 = (0);
seq__34310_35342 = G__35371;
chunk__34312_35343 = G__35372;
count__34313_35344 = G__35373;
i__34314_35345 = G__35374;
continue;
}
}
} else {
}
}
break;
}
} else {
node.appendChild(children_35337);
}
}


var G__35375 = cljs.core.next(seq__34168_35317__$1);
var G__35376 = null;
var G__35377 = (0);
var G__35378 = (0);
seq__34168_35264 = G__35375;
chunk__34170_35265 = G__35376;
count__34171_35266 = G__35377;
i__34172_35267 = G__35378;
continue;
} else {
var G__35379 = cljs.core.next(seq__34168_35317__$1);
var G__35380 = null;
var G__35381 = (0);
var G__35382 = (0);
seq__34168_35264 = G__35379;
chunk__34170_35265 = G__35380;
count__34171_35266 = G__35381;
i__34172_35267 = G__35382;
continue;
}
}
} else {
}
}
break;
}

return node;
});
(shadow.dom.SVGElement["string"] = true);

(shadow.dom._to_svg["string"] = (function (this$){
if((this$ instanceof cljs.core.Keyword)){
return shadow.dom.make_svg_node(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [this$], null));
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("strings cannot be in svgs",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"this","this",-611633625),this$], null));
}
}));

(cljs.core.PersistentVector.prototype.shadow$dom$SVGElement$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.PersistentVector.prototype.shadow$dom$SVGElement$_to_svg$arity$1 = (function (this$){
var this$__$1 = this;
return shadow.dom.make_svg_node(this$__$1);
}));

(cljs.core.LazySeq.prototype.shadow$dom$SVGElement$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.LazySeq.prototype.shadow$dom$SVGElement$_to_svg$arity$1 = (function (this$){
var this$__$1 = this;
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(shadow.dom._to_svg,this$__$1);
}));

(shadow.dom.SVGElement["null"] = true);

(shadow.dom._to_svg["null"] = (function (_){
return null;
}));
shadow.dom.svg = (function shadow$dom$svg(var_args){
var args__5732__auto__ = [];
var len__5726__auto___35390 = arguments.length;
var i__5727__auto___35392 = (0);
while(true){
if((i__5727__auto___35392 < len__5726__auto___35390)){
args__5732__auto__.push((arguments[i__5727__auto___35392]));

var G__35394 = (i__5727__auto___35392 + (1));
i__5727__auto___35392 = G__35394;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return shadow.dom.svg.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(shadow.dom.svg.cljs$core$IFn$_invoke$arity$variadic = (function (attrs,children){
return shadow.dom._to_svg(cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"svg","svg",856789142),attrs], null),children)));
}));

(shadow.dom.svg.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(shadow.dom.svg.cljs$lang$applyTo = (function (seq34352){
var G__34353 = cljs.core.first(seq34352);
var seq34352__$1 = cljs.core.next(seq34352);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__34353,seq34352__$1);
}));


//# sourceMappingURL=shadow.dom.js.map
