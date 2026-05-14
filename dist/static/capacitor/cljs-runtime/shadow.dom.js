goog.provide('shadow.dom');
shadow.dom.transition_supported_QMARK_ = true;

/**
 * @interface
 */
shadow.dom.IElement = function(){};

var shadow$dom$IElement$_to_dom$dyn_34627 = (function (this$){
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
return shadow$dom$IElement$_to_dom$dyn_34627(this$);
}
});


/**
 * @interface
 */
shadow.dom.SVGElement = function(){};

var shadow$dom$SVGElement$_to_svg$dyn_34639 = (function (this$){
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
return shadow$dom$SVGElement$_to_svg$dyn_34639(this$);
}
});

shadow.dom.lazy_native_coll_seq = (function shadow$dom$lazy_native_coll_seq(coll,idx){
if((idx < coll.length)){
return (new cljs.core.LazySeq(null,(function (){
return cljs.core.cons((coll[idx]),(function (){var G__33705 = coll;
var G__33706 = (idx + (1));
return (shadow.dom.lazy_native_coll_seq.cljs$core$IFn$_invoke$arity$2 ? shadow.dom.lazy_native_coll_seq.cljs$core$IFn$_invoke$arity$2(G__33705,G__33706) : shadow.dom.lazy_native_coll_seq.call(null,G__33705,G__33706));
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
var G__33778 = arguments.length;
switch (G__33778) {
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
var G__33795 = arguments.length;
switch (G__33795) {
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
var G__33804 = arguments.length;
switch (G__33804) {
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
var G__33817 = arguments.length;
switch (G__33817) {
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
var G__33842 = arguments.length;
switch (G__33842) {
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
var G__33857 = arguments.length;
switch (G__33857) {
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
}catch (e33858){if((e33858 instanceof Object)){
var e = e33858;
return console.log("didnt support attachEvent",el,e);
} else {
throw e33858;

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
var seq__33862 = cljs.core.seq(shadow.dom.query.cljs$core$IFn$_invoke$arity$2(selector,root_el));
var chunk__33863 = null;
var count__33864 = (0);
var i__33865 = (0);
while(true){
if((i__33865 < count__33864)){
var el = chunk__33863.cljs$core$IIndexed$_nth$arity$2(null,i__33865);
var handler_34690__$1 = ((function (seq__33862,chunk__33863,count__33864,i__33865,el){
return (function (e){
return (handler.cljs$core$IFn$_invoke$arity$2 ? handler.cljs$core$IFn$_invoke$arity$2(e,el) : handler.call(null,e,el));
});})(seq__33862,chunk__33863,count__33864,i__33865,el))
;
shadow.dom.dom_listen(el,cljs.core.name(ev),handler_34690__$1);


var G__34691 = seq__33862;
var G__34692 = chunk__33863;
var G__34693 = count__33864;
var G__34694 = (i__33865 + (1));
seq__33862 = G__34691;
chunk__33863 = G__34692;
count__33864 = G__34693;
i__33865 = G__34694;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__33862);
if(temp__5804__auto__){
var seq__33862__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__33862__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__33862__$1);
var G__34695 = cljs.core.chunk_rest(seq__33862__$1);
var G__34696 = c__5525__auto__;
var G__34697 = cljs.core.count(c__5525__auto__);
var G__34698 = (0);
seq__33862 = G__34695;
chunk__33863 = G__34696;
count__33864 = G__34697;
i__33865 = G__34698;
continue;
} else {
var el = cljs.core.first(seq__33862__$1);
var handler_34699__$1 = ((function (seq__33862,chunk__33863,count__33864,i__33865,el,seq__33862__$1,temp__5804__auto__){
return (function (e){
return (handler.cljs$core$IFn$_invoke$arity$2 ? handler.cljs$core$IFn$_invoke$arity$2(e,el) : handler.call(null,e,el));
});})(seq__33862,chunk__33863,count__33864,i__33865,el,seq__33862__$1,temp__5804__auto__))
;
shadow.dom.dom_listen(el,cljs.core.name(ev),handler_34699__$1);


var G__34700 = cljs.core.next(seq__33862__$1);
var G__34701 = null;
var G__34702 = (0);
var G__34703 = (0);
seq__33862 = G__34700;
chunk__33863 = G__34701;
count__33864 = G__34702;
i__33865 = G__34703;
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
var G__33871 = arguments.length;
switch (G__33871) {
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
var seq__33893 = cljs.core.seq(events);
var chunk__33894 = null;
var count__33895 = (0);
var i__33896 = (0);
while(true){
if((i__33896 < count__33895)){
var vec__33907 = chunk__33894.cljs$core$IIndexed$_nth$arity$2(null,i__33896);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33907,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33907,(1),null);
shadow.dom.on.cljs$core$IFn$_invoke$arity$3(el,k,v);


var G__34720 = seq__33893;
var G__34721 = chunk__33894;
var G__34722 = count__33895;
var G__34723 = (i__33896 + (1));
seq__33893 = G__34720;
chunk__33894 = G__34721;
count__33895 = G__34722;
i__33896 = G__34723;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__33893);
if(temp__5804__auto__){
var seq__33893__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__33893__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__33893__$1);
var G__34725 = cljs.core.chunk_rest(seq__33893__$1);
var G__34726 = c__5525__auto__;
var G__34727 = cljs.core.count(c__5525__auto__);
var G__34728 = (0);
seq__33893 = G__34725;
chunk__33894 = G__34726;
count__33895 = G__34727;
i__33896 = G__34728;
continue;
} else {
var vec__33920 = cljs.core.first(seq__33893__$1);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33920,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33920,(1),null);
shadow.dom.on.cljs$core$IFn$_invoke$arity$3(el,k,v);


var G__34731 = cljs.core.next(seq__33893__$1);
var G__34732 = null;
var G__34733 = (0);
var G__34734 = (0);
seq__33893 = G__34731;
chunk__33894 = G__34732;
count__33895 = G__34733;
i__33896 = G__34734;
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
var seq__33934 = cljs.core.seq(styles);
var chunk__33935 = null;
var count__33936 = (0);
var i__33937 = (0);
while(true){
if((i__33937 < count__33936)){
var vec__33953 = chunk__33935.cljs$core$IIndexed$_nth$arity$2(null,i__33937);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33953,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33953,(1),null);
goog.style.setStyle(dom,cljs.core.name(k),(((v == null))?"":v));


var G__34736 = seq__33934;
var G__34737 = chunk__33935;
var G__34738 = count__33936;
var G__34739 = (i__33937 + (1));
seq__33934 = G__34736;
chunk__33935 = G__34737;
count__33936 = G__34738;
i__33937 = G__34739;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__33934);
if(temp__5804__auto__){
var seq__33934__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__33934__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__33934__$1);
var G__34740 = cljs.core.chunk_rest(seq__33934__$1);
var G__34741 = c__5525__auto__;
var G__34742 = cljs.core.count(c__5525__auto__);
var G__34743 = (0);
seq__33934 = G__34740;
chunk__33935 = G__34741;
count__33936 = G__34742;
i__33937 = G__34743;
continue;
} else {
var vec__33956 = cljs.core.first(seq__33934__$1);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33956,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33956,(1),null);
goog.style.setStyle(dom,cljs.core.name(k),(((v == null))?"":v));


var G__34745 = cljs.core.next(seq__33934__$1);
var G__34746 = null;
var G__34747 = (0);
var G__34748 = (0);
seq__33934 = G__34745;
chunk__33935 = G__34746;
count__33936 = G__34747;
i__33937 = G__34748;
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
var G__33959_34750 = key;
var G__33959_34751__$1 = (((G__33959_34750 instanceof cljs.core.Keyword))?G__33959_34750.fqn:null);
switch (G__33959_34751__$1) {
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
var ks_34758 = cljs.core.name(key);
if(cljs.core.truth_((function (){var or__5002__auto__ = goog.string.startsWith(ks_34758,"data-");
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return goog.string.startsWith(ks_34758,"aria-");
}
})())){
el.setAttribute(ks_34758,value);
} else {
(el[ks_34758] = value);
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
shadow.dom.create_dom_node = (function shadow$dom$create_dom_node(tag_def,p__33987){
var map__33988 = p__33987;
var map__33988__$1 = cljs.core.__destructure_map(map__33988);
var props = map__33988__$1;
var class$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__33988__$1,new cljs.core.Keyword(null,"class","class",-2030961996));
var tag_props = ({});
var vec__33992 = shadow.dom.parse_tag(tag_def);
var tag_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33992,(0),null);
var tag_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33992,(1),null);
var tag_classes = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33992,(2),null);
if(cljs.core.truth_(tag_id)){
(tag_props["id"] = tag_id);
} else {
}

if(cljs.core.truth_(tag_classes)){
(tag_props["class"] = shadow.dom.merge_class_string(class$,tag_classes));
} else {
}

var G__33999 = goog.dom.createDom(tag_name,tag_props);
shadow.dom.set_attrs(G__33999,cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(props,new cljs.core.Keyword(null,"class","class",-2030961996)));

return G__33999;
});
shadow.dom.append = (function shadow$dom$append(var_args){
var G__34004 = arguments.length;
switch (G__34004) {
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

shadow.dom.destructure_node = (function shadow$dom$destructure_node(create_fn,p__34014){
var vec__34015 = p__34014;
var seq__34016 = cljs.core.seq(vec__34015);
var first__34017 = cljs.core.first(seq__34016);
var seq__34016__$1 = cljs.core.next(seq__34016);
var nn = first__34017;
var first__34017__$1 = cljs.core.first(seq__34016__$1);
var seq__34016__$2 = cljs.core.next(seq__34016__$1);
var np = first__34017__$1;
var nc = seq__34016__$2;
var node = vec__34015;
if((nn instanceof cljs.core.Keyword)){
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("invalid dom node",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"node","node",581201198),node], null));
}

if((((np == null)) && ((nc == null)))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var G__34018 = nn;
var G__34019 = cljs.core.PersistentArrayMap.EMPTY;
return (create_fn.cljs$core$IFn$_invoke$arity$2 ? create_fn.cljs$core$IFn$_invoke$arity$2(G__34018,G__34019) : create_fn.call(null,G__34018,G__34019));
})(),cljs.core.List.EMPTY], null);
} else {
if(cljs.core.map_QMARK_(np)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(create_fn.cljs$core$IFn$_invoke$arity$2 ? create_fn.cljs$core$IFn$_invoke$arity$2(nn,np) : create_fn.call(null,nn,np)),nc], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var G__34020 = nn;
var G__34021 = cljs.core.PersistentArrayMap.EMPTY;
return (create_fn.cljs$core$IFn$_invoke$arity$2 ? create_fn.cljs$core$IFn$_invoke$arity$2(G__34020,G__34021) : create_fn.call(null,G__34020,G__34021));
})(),cljs.core.conj.cljs$core$IFn$_invoke$arity$2(nc,np)], null);

}
}
});
shadow.dom.make_dom_node = (function shadow$dom$make_dom_node(structure){
var vec__34022 = shadow.dom.destructure_node(shadow.dom.create_dom_node,structure);
var node = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__34022,(0),null);
var node_children = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__34022,(1),null);
var seq__34025_34770 = cljs.core.seq(node_children);
var chunk__34026_34771 = null;
var count__34027_34772 = (0);
var i__34028_34773 = (0);
while(true){
if((i__34028_34773 < count__34027_34772)){
var child_struct_34774 = chunk__34026_34771.cljs$core$IIndexed$_nth$arity$2(null,i__34028_34773);
var children_34775 = shadow.dom.dom_node(child_struct_34774);
if(cljs.core.seq_QMARK_(children_34775)){
var seq__34054_34776 = cljs.core.seq(cljs.core.map.cljs$core$IFn$_invoke$arity$2(shadow.dom.dom_node,children_34775));
var chunk__34056_34777 = null;
var count__34057_34778 = (0);
var i__34058_34779 = (0);
while(true){
if((i__34058_34779 < count__34057_34778)){
var child_34780 = chunk__34056_34777.cljs$core$IIndexed$_nth$arity$2(null,i__34058_34779);
if(cljs.core.truth_(child_34780)){
shadow.dom.append.cljs$core$IFn$_invoke$arity$2(node,child_34780);


var G__34781 = seq__34054_34776;
var G__34782 = chunk__34056_34777;
var G__34783 = count__34057_34778;
var G__34784 = (i__34058_34779 + (1));
seq__34054_34776 = G__34781;
chunk__34056_34777 = G__34782;
count__34057_34778 = G__34783;
i__34058_34779 = G__34784;
continue;
} else {
var G__34786 = seq__34054_34776;
var G__34787 = chunk__34056_34777;
var G__34788 = count__34057_34778;
var G__34789 = (i__34058_34779 + (1));
seq__34054_34776 = G__34786;
chunk__34056_34777 = G__34787;
count__34057_34778 = G__34788;
i__34058_34779 = G__34789;
continue;
}
} else {
var temp__5804__auto___34790 = cljs.core.seq(seq__34054_34776);
if(temp__5804__auto___34790){
var seq__34054_34791__$1 = temp__5804__auto___34790;
if(cljs.core.chunked_seq_QMARK_(seq__34054_34791__$1)){
var c__5525__auto___34793 = cljs.core.chunk_first(seq__34054_34791__$1);
var G__34812 = cljs.core.chunk_rest(seq__34054_34791__$1);
var G__34813 = c__5525__auto___34793;
var G__34814 = cljs.core.count(c__5525__auto___34793);
var G__34815 = (0);
seq__34054_34776 = G__34812;
chunk__34056_34777 = G__34813;
count__34057_34778 = G__34814;
i__34058_34779 = G__34815;
continue;
} else {
var child_34816 = cljs.core.first(seq__34054_34791__$1);
if(cljs.core.truth_(child_34816)){
shadow.dom.append.cljs$core$IFn$_invoke$arity$2(node,child_34816);


var G__34818 = cljs.core.next(seq__34054_34791__$1);
var G__34819 = null;
var G__34820 = (0);
var G__34821 = (0);
seq__34054_34776 = G__34818;
chunk__34056_34777 = G__34819;
count__34057_34778 = G__34820;
i__34058_34779 = G__34821;
continue;
} else {
var G__34823 = cljs.core.next(seq__34054_34791__$1);
var G__34824 = null;
var G__34825 = (0);
var G__34826 = (0);
seq__34054_34776 = G__34823;
chunk__34056_34777 = G__34824;
count__34057_34778 = G__34825;
i__34058_34779 = G__34826;
continue;
}
}
} else {
}
}
break;
}
} else {
shadow.dom.append.cljs$core$IFn$_invoke$arity$2(node,children_34775);
}


var G__34831 = seq__34025_34770;
var G__34832 = chunk__34026_34771;
var G__34833 = count__34027_34772;
var G__34834 = (i__34028_34773 + (1));
seq__34025_34770 = G__34831;
chunk__34026_34771 = G__34832;
count__34027_34772 = G__34833;
i__34028_34773 = G__34834;
continue;
} else {
var temp__5804__auto___34836 = cljs.core.seq(seq__34025_34770);
if(temp__5804__auto___34836){
var seq__34025_34838__$1 = temp__5804__auto___34836;
if(cljs.core.chunked_seq_QMARK_(seq__34025_34838__$1)){
var c__5525__auto___34839 = cljs.core.chunk_first(seq__34025_34838__$1);
var G__34840 = cljs.core.chunk_rest(seq__34025_34838__$1);
var G__34841 = c__5525__auto___34839;
var G__34842 = cljs.core.count(c__5525__auto___34839);
var G__34843 = (0);
seq__34025_34770 = G__34840;
chunk__34026_34771 = G__34841;
count__34027_34772 = G__34842;
i__34028_34773 = G__34843;
continue;
} else {
var child_struct_34844 = cljs.core.first(seq__34025_34838__$1);
var children_34845 = shadow.dom.dom_node(child_struct_34844);
if(cljs.core.seq_QMARK_(children_34845)){
var seq__34060_34846 = cljs.core.seq(cljs.core.map.cljs$core$IFn$_invoke$arity$2(shadow.dom.dom_node,children_34845));
var chunk__34062_34847 = null;
var count__34063_34848 = (0);
var i__34064_34849 = (0);
while(true){
if((i__34064_34849 < count__34063_34848)){
var child_34853 = chunk__34062_34847.cljs$core$IIndexed$_nth$arity$2(null,i__34064_34849);
if(cljs.core.truth_(child_34853)){
shadow.dom.append.cljs$core$IFn$_invoke$arity$2(node,child_34853);


var G__34854 = seq__34060_34846;
var G__34855 = chunk__34062_34847;
var G__34856 = count__34063_34848;
var G__34857 = (i__34064_34849 + (1));
seq__34060_34846 = G__34854;
chunk__34062_34847 = G__34855;
count__34063_34848 = G__34856;
i__34064_34849 = G__34857;
continue;
} else {
var G__34859 = seq__34060_34846;
var G__34860 = chunk__34062_34847;
var G__34861 = count__34063_34848;
var G__34862 = (i__34064_34849 + (1));
seq__34060_34846 = G__34859;
chunk__34062_34847 = G__34860;
count__34063_34848 = G__34861;
i__34064_34849 = G__34862;
continue;
}
} else {
var temp__5804__auto___34863__$1 = cljs.core.seq(seq__34060_34846);
if(temp__5804__auto___34863__$1){
var seq__34060_34865__$1 = temp__5804__auto___34863__$1;
if(cljs.core.chunked_seq_QMARK_(seq__34060_34865__$1)){
var c__5525__auto___34866 = cljs.core.chunk_first(seq__34060_34865__$1);
var G__34867 = cljs.core.chunk_rest(seq__34060_34865__$1);
var G__34868 = c__5525__auto___34866;
var G__34869 = cljs.core.count(c__5525__auto___34866);
var G__34870 = (0);
seq__34060_34846 = G__34867;
chunk__34062_34847 = G__34868;
count__34063_34848 = G__34869;
i__34064_34849 = G__34870;
continue;
} else {
var child_34871 = cljs.core.first(seq__34060_34865__$1);
if(cljs.core.truth_(child_34871)){
shadow.dom.append.cljs$core$IFn$_invoke$arity$2(node,child_34871);


var G__34875 = cljs.core.next(seq__34060_34865__$1);
var G__34876 = null;
var G__34877 = (0);
var G__34878 = (0);
seq__34060_34846 = G__34875;
chunk__34062_34847 = G__34876;
count__34063_34848 = G__34877;
i__34064_34849 = G__34878;
continue;
} else {
var G__34897 = cljs.core.next(seq__34060_34865__$1);
var G__34898 = null;
var G__34899 = (0);
var G__34900 = (0);
seq__34060_34846 = G__34897;
chunk__34062_34847 = G__34898;
count__34063_34848 = G__34899;
i__34064_34849 = G__34900;
continue;
}
}
} else {
}
}
break;
}
} else {
shadow.dom.append.cljs$core$IFn$_invoke$arity$2(node,children_34845);
}


var G__34901 = cljs.core.next(seq__34025_34838__$1);
var G__34902 = null;
var G__34903 = (0);
var G__34904 = (0);
seq__34025_34770 = G__34901;
chunk__34026_34771 = G__34902;
count__34027_34772 = G__34903;
i__34028_34773 = G__34904;
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
var seq__34081 = cljs.core.seq(node);
var chunk__34082 = null;
var count__34083 = (0);
var i__34084 = (0);
while(true){
if((i__34084 < count__34083)){
var n = chunk__34082.cljs$core$IIndexed$_nth$arity$2(null,i__34084);
(shadow.dom.remove.cljs$core$IFn$_invoke$arity$1 ? shadow.dom.remove.cljs$core$IFn$_invoke$arity$1(n) : shadow.dom.remove.call(null,n));


var G__34910 = seq__34081;
var G__34911 = chunk__34082;
var G__34912 = count__34083;
var G__34913 = (i__34084 + (1));
seq__34081 = G__34910;
chunk__34082 = G__34911;
count__34083 = G__34912;
i__34084 = G__34913;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__34081);
if(temp__5804__auto__){
var seq__34081__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__34081__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__34081__$1);
var G__34915 = cljs.core.chunk_rest(seq__34081__$1);
var G__34916 = c__5525__auto__;
var G__34917 = cljs.core.count(c__5525__auto__);
var G__34918 = (0);
seq__34081 = G__34915;
chunk__34082 = G__34916;
count__34083 = G__34917;
i__34084 = G__34918;
continue;
} else {
var n = cljs.core.first(seq__34081__$1);
(shadow.dom.remove.cljs$core$IFn$_invoke$arity$1 ? shadow.dom.remove.cljs$core$IFn$_invoke$arity$1(n) : shadow.dom.remove.call(null,n));


var G__34919 = cljs.core.next(seq__34081__$1);
var G__34920 = null;
var G__34921 = (0);
var G__34922 = (0);
seq__34081 = G__34919;
chunk__34082 = G__34920;
count__34083 = G__34921;
i__34084 = G__34922;
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
var G__34107 = arguments.length;
switch (G__34107) {
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
var G__34109 = arguments.length;
switch (G__34109) {
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
var G__34111 = arguments.length;
switch (G__34111) {
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
var len__5726__auto___34968 = arguments.length;
var i__5727__auto___34970 = (0);
while(true){
if((i__5727__auto___34970 < len__5726__auto___34968)){
args__5732__auto__.push((arguments[i__5727__auto___34970]));

var G__34972 = (i__5727__auto___34970 + (1));
i__5727__auto___34970 = G__34972;
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
var seq__34119_34980 = cljs.core.seq(nodes);
var chunk__34120_34981 = null;
var count__34121_34982 = (0);
var i__34122_34983 = (0);
while(true){
if((i__34122_34983 < count__34121_34982)){
var node_34987 = chunk__34120_34981.cljs$core$IIndexed$_nth$arity$2(null,i__34122_34983);
fragment.appendChild(shadow.dom._to_dom(node_34987));


var G__34992 = seq__34119_34980;
var G__34993 = chunk__34120_34981;
var G__34994 = count__34121_34982;
var G__34995 = (i__34122_34983 + (1));
seq__34119_34980 = G__34992;
chunk__34120_34981 = G__34993;
count__34121_34982 = G__34994;
i__34122_34983 = G__34995;
continue;
} else {
var temp__5804__auto___34998 = cljs.core.seq(seq__34119_34980);
if(temp__5804__auto___34998){
var seq__34119_35000__$1 = temp__5804__auto___34998;
if(cljs.core.chunked_seq_QMARK_(seq__34119_35000__$1)){
var c__5525__auto___35003 = cljs.core.chunk_first(seq__34119_35000__$1);
var G__35004 = cljs.core.chunk_rest(seq__34119_35000__$1);
var G__35005 = c__5525__auto___35003;
var G__35006 = cljs.core.count(c__5525__auto___35003);
var G__35007 = (0);
seq__34119_34980 = G__35004;
chunk__34120_34981 = G__35005;
count__34121_34982 = G__35006;
i__34122_34983 = G__35007;
continue;
} else {
var node_35009 = cljs.core.first(seq__34119_35000__$1);
fragment.appendChild(shadow.dom._to_dom(node_35009));


var G__35011 = cljs.core.next(seq__34119_35000__$1);
var G__35012 = null;
var G__35013 = (0);
var G__35014 = (0);
seq__34119_34980 = G__35011;
chunk__34120_34981 = G__35012;
count__34121_34982 = G__35013;
i__34122_34983 = G__35014;
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
(shadow.dom.fragment.cljs$lang$applyTo = (function (seq34118){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq34118));
}));

/**
 * given a html string, eval all <script> tags and return the html without the scripts
 * don't do this for everything, only content you trust.
 */
shadow.dom.eval_scripts = (function shadow$dom$eval_scripts(s){
var scripts = cljs.core.re_seq(/<script[^>]*?>(.+?)<\/script>/,s);
var seq__34129_35024 = cljs.core.seq(scripts);
var chunk__34130_35025 = null;
var count__34131_35026 = (0);
var i__34132_35027 = (0);
while(true){
if((i__34132_35027 < count__34131_35026)){
var vec__34141_35031 = chunk__34130_35025.cljs$core$IIndexed$_nth$arity$2(null,i__34132_35027);
var script_tag_35032 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__34141_35031,(0),null);
var script_body_35033 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__34141_35031,(1),null);
eval(script_body_35033);


var G__35038 = seq__34129_35024;
var G__35039 = chunk__34130_35025;
var G__35040 = count__34131_35026;
var G__35041 = (i__34132_35027 + (1));
seq__34129_35024 = G__35038;
chunk__34130_35025 = G__35039;
count__34131_35026 = G__35040;
i__34132_35027 = G__35041;
continue;
} else {
var temp__5804__auto___35042 = cljs.core.seq(seq__34129_35024);
if(temp__5804__auto___35042){
var seq__34129_35043__$1 = temp__5804__auto___35042;
if(cljs.core.chunked_seq_QMARK_(seq__34129_35043__$1)){
var c__5525__auto___35044 = cljs.core.chunk_first(seq__34129_35043__$1);
var G__35047 = cljs.core.chunk_rest(seq__34129_35043__$1);
var G__35048 = c__5525__auto___35044;
var G__35049 = cljs.core.count(c__5525__auto___35044);
var G__35050 = (0);
seq__34129_35024 = G__35047;
chunk__34130_35025 = G__35048;
count__34131_35026 = G__35049;
i__34132_35027 = G__35050;
continue;
} else {
var vec__34144_35054 = cljs.core.first(seq__34129_35043__$1);
var script_tag_35055 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__34144_35054,(0),null);
var script_body_35056 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__34144_35054,(1),null);
eval(script_body_35056);


var G__35057 = cljs.core.next(seq__34129_35043__$1);
var G__35058 = null;
var G__35059 = (0);
var G__35060 = (0);
seq__34129_35024 = G__35057;
chunk__34130_35025 = G__35058;
count__34131_35026 = G__35059;
i__34132_35027 = G__35060;
continue;
}
} else {
}
}
break;
}

return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (s__$1,p__34147){
var vec__34148 = p__34147;
var script_tag = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__34148,(0),null);
var script_body = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__34148,(1),null);
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
var G__34157 = arguments.length;
switch (G__34157) {
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
var seq__34172 = cljs.core.seq(style_keys);
var chunk__34173 = null;
var count__34174 = (0);
var i__34175 = (0);
while(true){
if((i__34175 < count__34174)){
var it = chunk__34173.cljs$core$IIndexed$_nth$arity$2(null,i__34175);
shadow.dom.remove_style_STAR_(el__$1,it);


var G__35080 = seq__34172;
var G__35081 = chunk__34173;
var G__35082 = count__34174;
var G__35083 = (i__34175 + (1));
seq__34172 = G__35080;
chunk__34173 = G__35081;
count__34174 = G__35082;
i__34175 = G__35083;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__34172);
if(temp__5804__auto__){
var seq__34172__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__34172__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__34172__$1);
var G__35086 = cljs.core.chunk_rest(seq__34172__$1);
var G__35087 = c__5525__auto__;
var G__35088 = cljs.core.count(c__5525__auto__);
var G__35089 = (0);
seq__34172 = G__35086;
chunk__34173 = G__35087;
count__34174 = G__35088;
i__34175 = G__35089;
continue;
} else {
var it = cljs.core.first(seq__34172__$1);
shadow.dom.remove_style_STAR_(el__$1,it);


var G__35090 = cljs.core.next(seq__34172__$1);
var G__35091 = null;
var G__35092 = (0);
var G__35093 = (0);
seq__34172 = G__35090;
chunk__34173 = G__35091;
count__34174 = G__35092;
i__34175 = G__35093;
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

(shadow.dom.Coordinate.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k34180,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__34186 = k34180;
var G__34186__$1 = (((G__34186 instanceof cljs.core.Keyword))?G__34186.fqn:null);
switch (G__34186__$1) {
case "x":
return self__.x;

break;
case "y":
return self__.y;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k34180,else__5303__auto__);

}
}));

(shadow.dom.Coordinate.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__34187){
var vec__34188 = p__34187;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__34188,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__34188,(1),null);
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

(shadow.dom.Coordinate.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__34179){
var self__ = this;
var G__34179__$1 = this;
return (new cljs.core.RecordIter((0),G__34179__$1,2,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"x","x",2099068185),new cljs.core.Keyword(null,"y","y",-1757859776)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
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

(shadow.dom.Coordinate.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this34181,other34182){
var self__ = this;
var this34181__$1 = this;
return (((!((other34182 == null)))) && ((((this34181__$1.constructor === other34182.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this34181__$1.x,other34182.x)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this34181__$1.y,other34182.y)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this34181__$1.__extmap,other34182.__extmap)))))))));
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

(shadow.dom.Coordinate.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k34180){
var self__ = this;
var this__5307__auto____$1 = this;
var G__34202 = k34180;
var G__34202__$1 = (((G__34202 instanceof cljs.core.Keyword))?G__34202.fqn:null);
switch (G__34202__$1) {
case "x":
case "y":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k34180);

}
}));

(shadow.dom.Coordinate.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__34179){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__34203 = cljs.core.keyword_identical_QMARK_;
var expr__34204 = k__5309__auto__;
if(cljs.core.truth_((pred__34203.cljs$core$IFn$_invoke$arity$2 ? pred__34203.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"x","x",2099068185),expr__34204) : pred__34203.call(null,new cljs.core.Keyword(null,"x","x",2099068185),expr__34204)))){
return (new shadow.dom.Coordinate(G__34179,self__.y,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__34203.cljs$core$IFn$_invoke$arity$2 ? pred__34203.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"y","y",-1757859776),expr__34204) : pred__34203.call(null,new cljs.core.Keyword(null,"y","y",-1757859776),expr__34204)))){
return (new shadow.dom.Coordinate(self__.x,G__34179,self__.__meta,self__.__extmap,null));
} else {
return (new shadow.dom.Coordinate(self__.x,self__.y,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__34179),null));
}
}
}));

(shadow.dom.Coordinate.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"x","x",2099068185),self__.x,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"y","y",-1757859776),self__.y,null))], null),self__.__extmap));
}));

(shadow.dom.Coordinate.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__34179){
var self__ = this;
var this__5299__auto____$1 = this;
return (new shadow.dom.Coordinate(self__.x,self__.y,G__34179,self__.__extmap,self__.__hash));
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
shadow.dom.map__GT_Coordinate = (function shadow$dom$map__GT_Coordinate(G__34183){
var extmap__5342__auto__ = (function (){var G__34213 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(G__34183,new cljs.core.Keyword(null,"x","x",2099068185),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"y","y",-1757859776)], 0));
if(cljs.core.record_QMARK_(G__34183)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__34213);
} else {
return G__34213;
}
})();
return (new shadow.dom.Coordinate(new cljs.core.Keyword(null,"x","x",2099068185).cljs$core$IFn$_invoke$arity$1(G__34183),new cljs.core.Keyword(null,"y","y",-1757859776).cljs$core$IFn$_invoke$arity$1(G__34183),null,cljs.core.not_empty(extmap__5342__auto__),null));
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

(shadow.dom.Size.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k34225,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__34243 = k34225;
var G__34243__$1 = (((G__34243 instanceof cljs.core.Keyword))?G__34243.fqn:null);
switch (G__34243__$1) {
case "w":
return self__.w;

break;
case "h":
return self__.h;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k34225,else__5303__auto__);

}
}));

(shadow.dom.Size.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__34246){
var vec__34248 = p__34246;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__34248,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__34248,(1),null);
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

(shadow.dom.Size.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__34224){
var self__ = this;
var G__34224__$1 = this;
return (new cljs.core.RecordIter((0),G__34224__$1,2,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"w","w",354169001),new cljs.core.Keyword(null,"h","h",1109658740)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
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

(shadow.dom.Size.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this34226,other34227){
var self__ = this;
var this34226__$1 = this;
return (((!((other34227 == null)))) && ((((this34226__$1.constructor === other34227.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this34226__$1.w,other34227.w)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this34226__$1.h,other34227.h)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this34226__$1.__extmap,other34227.__extmap)))))))));
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

(shadow.dom.Size.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k34225){
var self__ = this;
var this__5307__auto____$1 = this;
var G__34318 = k34225;
var G__34318__$1 = (((G__34318 instanceof cljs.core.Keyword))?G__34318.fqn:null);
switch (G__34318__$1) {
case "w":
case "h":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k34225);

}
}));

(shadow.dom.Size.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__34224){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__34320 = cljs.core.keyword_identical_QMARK_;
var expr__34321 = k__5309__auto__;
if(cljs.core.truth_((pred__34320.cljs$core$IFn$_invoke$arity$2 ? pred__34320.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"w","w",354169001),expr__34321) : pred__34320.call(null,new cljs.core.Keyword(null,"w","w",354169001),expr__34321)))){
return (new shadow.dom.Size(G__34224,self__.h,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__34320.cljs$core$IFn$_invoke$arity$2 ? pred__34320.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"h","h",1109658740),expr__34321) : pred__34320.call(null,new cljs.core.Keyword(null,"h","h",1109658740),expr__34321)))){
return (new shadow.dom.Size(self__.w,G__34224,self__.__meta,self__.__extmap,null));
} else {
return (new shadow.dom.Size(self__.w,self__.h,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__34224),null));
}
}
}));

(shadow.dom.Size.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"w","w",354169001),self__.w,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"h","h",1109658740),self__.h,null))], null),self__.__extmap));
}));

(shadow.dom.Size.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__34224){
var self__ = this;
var this__5299__auto____$1 = this;
return (new shadow.dom.Size(self__.w,self__.h,G__34224,self__.__extmap,self__.__hash));
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
shadow.dom.map__GT_Size = (function shadow$dom$map__GT_Size(G__34228){
var extmap__5342__auto__ = (function (){var G__34329 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(G__34228,new cljs.core.Keyword(null,"w","w",354169001),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"h","h",1109658740)], 0));
if(cljs.core.record_QMARK_(G__34228)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__34329);
} else {
return G__34329;
}
})();
return (new shadow.dom.Size(new cljs.core.Keyword(null,"w","w",354169001).cljs$core$IFn$_invoke$arity$1(G__34228),new cljs.core.Keyword(null,"h","h",1109658740).cljs$core$IFn$_invoke$arity$1(G__34228),null,cljs.core.not_empty(extmap__5342__auto__),null));
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
var G__35202 = (i + (1));
var G__35203 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(ret,(opts[i]["value"]));
i = G__35202;
ret = G__35203;
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
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(path),"?",clojure.string.join.cljs$core$IFn$_invoke$arity$2("&",cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__34353){
var vec__34354 = p__34353;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__34354,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__34354,(1),null);
return [cljs.core.name(k),"=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(encodeURIComponent(cljs.core.str.cljs$core$IFn$_invoke$arity$1(v)))].join('');
}),query_params))].join('');
}
});
shadow.dom.redirect = (function shadow$dom$redirect(var_args){
var G__34359 = arguments.length;
switch (G__34359) {
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
var G__35221 = ps;
var G__35222 = (i + (1));
el__$1 = G__35221;
i = G__35222;
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
var vec__34368 = shadow.dom.parse_tag(tag_def);
var tag_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__34368,(0),null);
var tag_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__34368,(1),null);
var tag_classes = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__34368,(2),null);
var el = document.createElementNS("http://www.w3.org/2000/svg",tag_name);
if(cljs.core.truth_(tag_id)){
el.setAttribute("id",tag_id);
} else {
}

if(cljs.core.truth_(tag_classes)){
el.setAttribute("class",shadow.dom.merge_class_string(new cljs.core.Keyword(null,"class","class",-2030961996).cljs$core$IFn$_invoke$arity$1(props),tag_classes));
} else {
}

var seq__34371_35232 = cljs.core.seq(props);
var chunk__34372_35233 = null;
var count__34373_35234 = (0);
var i__34374_35235 = (0);
while(true){
if((i__34374_35235 < count__34373_35234)){
var vec__34386_35236 = chunk__34372_35233.cljs$core$IIndexed$_nth$arity$2(null,i__34374_35235);
var k_35237 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__34386_35236,(0),null);
var v_35238 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__34386_35236,(1),null);
el.setAttributeNS((function (){var temp__5804__auto__ = cljs.core.namespace(k_35237);
if(cljs.core.truth_(temp__5804__auto__)){
var ns = temp__5804__auto__;
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(shadow.dom.xmlns),ns);
} else {
return null;
}
})(),cljs.core.name(k_35237),v_35238);


var G__35242 = seq__34371_35232;
var G__35243 = chunk__34372_35233;
var G__35244 = count__34373_35234;
var G__35245 = (i__34374_35235 + (1));
seq__34371_35232 = G__35242;
chunk__34372_35233 = G__35243;
count__34373_35234 = G__35244;
i__34374_35235 = G__35245;
continue;
} else {
var temp__5804__auto___35246 = cljs.core.seq(seq__34371_35232);
if(temp__5804__auto___35246){
var seq__34371_35247__$1 = temp__5804__auto___35246;
if(cljs.core.chunked_seq_QMARK_(seq__34371_35247__$1)){
var c__5525__auto___35248 = cljs.core.chunk_first(seq__34371_35247__$1);
var G__35249 = cljs.core.chunk_rest(seq__34371_35247__$1);
var G__35250 = c__5525__auto___35248;
var G__35251 = cljs.core.count(c__5525__auto___35248);
var G__35252 = (0);
seq__34371_35232 = G__35249;
chunk__34372_35233 = G__35250;
count__34373_35234 = G__35251;
i__34374_35235 = G__35252;
continue;
} else {
var vec__34391_35253 = cljs.core.first(seq__34371_35247__$1);
var k_35254 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__34391_35253,(0),null);
var v_35255 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__34391_35253,(1),null);
el.setAttributeNS((function (){var temp__5804__auto____$1 = cljs.core.namespace(k_35254);
if(cljs.core.truth_(temp__5804__auto____$1)){
var ns = temp__5804__auto____$1;
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(shadow.dom.xmlns),ns);
} else {
return null;
}
})(),cljs.core.name(k_35254),v_35255);


var G__35256 = cljs.core.next(seq__34371_35247__$1);
var G__35257 = null;
var G__35258 = (0);
var G__35259 = (0);
seq__34371_35232 = G__35256;
chunk__34372_35233 = G__35257;
count__34373_35234 = G__35258;
i__34374_35235 = G__35259;
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
var vec__34418 = shadow.dom.destructure_node(shadow.dom.create_svg_node,structure);
var node = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__34418,(0),null);
var node_children = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__34418,(1),null);
var seq__34421_35260 = cljs.core.seq(node_children);
var chunk__34429_35261 = null;
var count__34430_35262 = (0);
var i__34431_35263 = (0);
while(true){
if((i__34431_35263 < count__34430_35262)){
var child_struct_35264 = chunk__34429_35261.cljs$core$IIndexed$_nth$arity$2(null,i__34431_35263);
if((!((child_struct_35264 == null)))){
if(typeof child_struct_35264 === 'string'){
var text_35265 = (node["textContent"]);
(node["textContent"] = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(text_35265),child_struct_35264].join(''));
} else {
var children_35266 = shadow.dom.svg_node(child_struct_35264);
if(cljs.core.seq_QMARK_(children_35266)){
var seq__34490_35268 = cljs.core.seq(children_35266);
var chunk__34492_35269 = null;
var count__34493_35270 = (0);
var i__34494_35271 = (0);
while(true){
if((i__34494_35271 < count__34493_35270)){
var child_35272 = chunk__34492_35269.cljs$core$IIndexed$_nth$arity$2(null,i__34494_35271);
if(cljs.core.truth_(child_35272)){
node.appendChild(child_35272);


var G__35273 = seq__34490_35268;
var G__35274 = chunk__34492_35269;
var G__35275 = count__34493_35270;
var G__35276 = (i__34494_35271 + (1));
seq__34490_35268 = G__35273;
chunk__34492_35269 = G__35274;
count__34493_35270 = G__35275;
i__34494_35271 = G__35276;
continue;
} else {
var G__35277 = seq__34490_35268;
var G__35278 = chunk__34492_35269;
var G__35279 = count__34493_35270;
var G__35280 = (i__34494_35271 + (1));
seq__34490_35268 = G__35277;
chunk__34492_35269 = G__35278;
count__34493_35270 = G__35279;
i__34494_35271 = G__35280;
continue;
}
} else {
var temp__5804__auto___35281 = cljs.core.seq(seq__34490_35268);
if(temp__5804__auto___35281){
var seq__34490_35282__$1 = temp__5804__auto___35281;
if(cljs.core.chunked_seq_QMARK_(seq__34490_35282__$1)){
var c__5525__auto___35285 = cljs.core.chunk_first(seq__34490_35282__$1);
var G__35286 = cljs.core.chunk_rest(seq__34490_35282__$1);
var G__35287 = c__5525__auto___35285;
var G__35288 = cljs.core.count(c__5525__auto___35285);
var G__35289 = (0);
seq__34490_35268 = G__35286;
chunk__34492_35269 = G__35287;
count__34493_35270 = G__35288;
i__34494_35271 = G__35289;
continue;
} else {
var child_35290 = cljs.core.first(seq__34490_35282__$1);
if(cljs.core.truth_(child_35290)){
node.appendChild(child_35290);


var G__35291 = cljs.core.next(seq__34490_35282__$1);
var G__35292 = null;
var G__35293 = (0);
var G__35294 = (0);
seq__34490_35268 = G__35291;
chunk__34492_35269 = G__35292;
count__34493_35270 = G__35293;
i__34494_35271 = G__35294;
continue;
} else {
var G__35296 = cljs.core.next(seq__34490_35282__$1);
var G__35297 = null;
var G__35298 = (0);
var G__35299 = (0);
seq__34490_35268 = G__35296;
chunk__34492_35269 = G__35297;
count__34493_35270 = G__35298;
i__34494_35271 = G__35299;
continue;
}
}
} else {
}
}
break;
}
} else {
node.appendChild(children_35266);
}
}


var G__35309 = seq__34421_35260;
var G__35310 = chunk__34429_35261;
var G__35311 = count__34430_35262;
var G__35312 = (i__34431_35263 + (1));
seq__34421_35260 = G__35309;
chunk__34429_35261 = G__35310;
count__34430_35262 = G__35311;
i__34431_35263 = G__35312;
continue;
} else {
var G__35313 = seq__34421_35260;
var G__35314 = chunk__34429_35261;
var G__35315 = count__34430_35262;
var G__35316 = (i__34431_35263 + (1));
seq__34421_35260 = G__35313;
chunk__34429_35261 = G__35314;
count__34430_35262 = G__35315;
i__34431_35263 = G__35316;
continue;
}
} else {
var temp__5804__auto___35317 = cljs.core.seq(seq__34421_35260);
if(temp__5804__auto___35317){
var seq__34421_35318__$1 = temp__5804__auto___35317;
if(cljs.core.chunked_seq_QMARK_(seq__34421_35318__$1)){
var c__5525__auto___35319 = cljs.core.chunk_first(seq__34421_35318__$1);
var G__35320 = cljs.core.chunk_rest(seq__34421_35318__$1);
var G__35321 = c__5525__auto___35319;
var G__35322 = cljs.core.count(c__5525__auto___35319);
var G__35323 = (0);
seq__34421_35260 = G__35320;
chunk__34429_35261 = G__35321;
count__34430_35262 = G__35322;
i__34431_35263 = G__35323;
continue;
} else {
var child_struct_35328 = cljs.core.first(seq__34421_35318__$1);
if((!((child_struct_35328 == null)))){
if(typeof child_struct_35328 === 'string'){
var text_35330 = (node["textContent"]);
(node["textContent"] = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(text_35330),child_struct_35328].join(''));
} else {
var children_35331 = shadow.dom.svg_node(child_struct_35328);
if(cljs.core.seq_QMARK_(children_35331)){
var seq__34536_35333 = cljs.core.seq(children_35331);
var chunk__34538_35334 = null;
var count__34539_35335 = (0);
var i__34540_35336 = (0);
while(true){
if((i__34540_35336 < count__34539_35335)){
var child_35337 = chunk__34538_35334.cljs$core$IIndexed$_nth$arity$2(null,i__34540_35336);
if(cljs.core.truth_(child_35337)){
node.appendChild(child_35337);


var G__35339 = seq__34536_35333;
var G__35340 = chunk__34538_35334;
var G__35341 = count__34539_35335;
var G__35342 = (i__34540_35336 + (1));
seq__34536_35333 = G__35339;
chunk__34538_35334 = G__35340;
count__34539_35335 = G__35341;
i__34540_35336 = G__35342;
continue;
} else {
var G__35343 = seq__34536_35333;
var G__35344 = chunk__34538_35334;
var G__35345 = count__34539_35335;
var G__35346 = (i__34540_35336 + (1));
seq__34536_35333 = G__35343;
chunk__34538_35334 = G__35344;
count__34539_35335 = G__35345;
i__34540_35336 = G__35346;
continue;
}
} else {
var temp__5804__auto___35347__$1 = cljs.core.seq(seq__34536_35333);
if(temp__5804__auto___35347__$1){
var seq__34536_35348__$1 = temp__5804__auto___35347__$1;
if(cljs.core.chunked_seq_QMARK_(seq__34536_35348__$1)){
var c__5525__auto___35349 = cljs.core.chunk_first(seq__34536_35348__$1);
var G__35350 = cljs.core.chunk_rest(seq__34536_35348__$1);
var G__35351 = c__5525__auto___35349;
var G__35352 = cljs.core.count(c__5525__auto___35349);
var G__35353 = (0);
seq__34536_35333 = G__35350;
chunk__34538_35334 = G__35351;
count__34539_35335 = G__35352;
i__34540_35336 = G__35353;
continue;
} else {
var child_35355 = cljs.core.first(seq__34536_35348__$1);
if(cljs.core.truth_(child_35355)){
node.appendChild(child_35355);


var G__35357 = cljs.core.next(seq__34536_35348__$1);
var G__35358 = null;
var G__35359 = (0);
var G__35360 = (0);
seq__34536_35333 = G__35357;
chunk__34538_35334 = G__35358;
count__34539_35335 = G__35359;
i__34540_35336 = G__35360;
continue;
} else {
var G__35361 = cljs.core.next(seq__34536_35348__$1);
var G__35362 = null;
var G__35363 = (0);
var G__35364 = (0);
seq__34536_35333 = G__35361;
chunk__34538_35334 = G__35362;
count__34539_35335 = G__35363;
i__34540_35336 = G__35364;
continue;
}
}
} else {
}
}
break;
}
} else {
node.appendChild(children_35331);
}
}


var G__35365 = cljs.core.next(seq__34421_35318__$1);
var G__35366 = null;
var G__35367 = (0);
var G__35368 = (0);
seq__34421_35260 = G__35365;
chunk__34429_35261 = G__35366;
count__34430_35262 = G__35367;
i__34431_35263 = G__35368;
continue;
} else {
var G__35369 = cljs.core.next(seq__34421_35318__$1);
var G__35370 = null;
var G__35371 = (0);
var G__35372 = (0);
seq__34421_35260 = G__35369;
chunk__34429_35261 = G__35370;
count__34430_35262 = G__35371;
i__34431_35263 = G__35372;
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
var len__5726__auto___35375 = arguments.length;
var i__5727__auto___35376 = (0);
while(true){
if((i__5727__auto___35376 < len__5726__auto___35375)){
args__5732__auto__.push((arguments[i__5727__auto___35376]));

var G__35377 = (i__5727__auto___35376 + (1));
i__5727__auto___35376 = G__35377;
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
(shadow.dom.svg.cljs$lang$applyTo = (function (seq34579){
var G__34581 = cljs.core.first(seq34579);
var seq34579__$1 = cljs.core.next(seq34579);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__34581,seq34579__$1);
}));


//# sourceMappingURL=shadow.dom.js.map
