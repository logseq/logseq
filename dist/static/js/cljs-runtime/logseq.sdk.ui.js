goog.provide('logseq.sdk.ui');
logseq.sdk.ui.parse_hiccup_ui = (function logseq$sdk$ui$parse_hiccup_ui(input){
if(typeof input === 'string'){
try{return sci.core.eval_string.cljs$core$IFn$_invoke$arity$2(input,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"preset","preset",777387345),new cljs.core.Keyword(null,"termination-safe","termination-safe",-1845225130)], null));
}catch (e131663){var e = e131663;
console.error("[parse hiccup error]",e);

return input;
}} else {
return null;
}
});
logseq.sdk.ui._show_msg = (function logseq$sdk$ui$_show_msg(var_args){
var G__131665 = arguments.length;
switch (G__131665) {
case 1:
return logseq.sdk.ui._show_msg.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return logseq.sdk.ui._show_msg.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return logseq.sdk.ui._show_msg.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(logseq.sdk.ui._show_msg.cljs$core$IFn$_invoke$arity$1 = (function (content){
return logseq.sdk.ui._show_msg.cljs$core$IFn$_invoke$arity$3(content,new cljs.core.Keyword(null,"success","success",1890645906),null);
}));

(logseq.sdk.ui._show_msg.cljs$core$IFn$_invoke$arity$2 = (function (content,status){
return logseq.sdk.ui._show_msg.cljs$core$IFn$_invoke$arity$3(content,status,null);
}));

(logseq.sdk.ui._show_msg.cljs$core$IFn$_invoke$arity$3 = (function (content,status,opts){
var map__131666 = cljs_bean.core.__GT_clj(opts);
var map__131666__$1 = cljs.core.__destructure_map(map__131666);
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131666__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var timeout = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131666__$1,new cljs.core.Keyword(null,"timeout","timeout",-318625318));
var hiccup_QMARK_ = ((typeof content === 'string') && (clojure.string.starts_with_QMARK_(clojure.string.triml(content),"[:")));
var content__$1 = ((hiccup_QMARK_)?logseq.sdk.ui.parse_hiccup_ui(content):content);
var uid = ((typeof key === 'string')?cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(key):null);
var clear_QMARK_ = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(timeout,(0));
var key_SINGLEQUOTE_ = frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$6(content__$1,cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(status),clear_QMARK_,uid,timeout,null);
return cljs.core.name(key_SINGLEQUOTE_);
}));

(logseq.sdk.ui._show_msg.cljs$lang$maxFixedArity = 3);

logseq.sdk.ui.show_msg = (function logseq$sdk$ui$show_msg(var_args){
var args__5732__auto__ = [];
var len__5726__auto___131674 = arguments.length;
var i__5727__auto___131675 = (0);
while(true){
if((i__5727__auto___131675 < len__5726__auto___131674)){
args__5732__auto__.push((arguments[i__5727__auto___131675]));

var G__131676 = (i__5727__auto___131675 + (1));
i__5727__auto___131675 = G__131676;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return logseq.sdk.ui.show_msg.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});
goog.exportSymbol('logseq.sdk.ui.show_msg', logseq.sdk.ui.show_msg);

(logseq.sdk.ui.show_msg.cljs$core$IFn$_invoke$arity$variadic = (function (args){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(logseq.sdk.ui._show_msg,args);
}));

(logseq.sdk.ui.show_msg.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(logseq.sdk.ui.show_msg.cljs$lang$applyTo = (function (seq131667){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq131667));
}));

logseq.sdk.ui.close_msg = (function logseq$sdk$ui$close_msg(key){
if(typeof key === 'string'){
frontend.handler.notification.clear_BANG_(cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(key));

return null;
} else {
return null;
}
});
goog.exportSymbol('logseq.sdk.ui.close_msg', logseq.sdk.ui.close_msg);
logseq.sdk.ui.query_element_rect = (function logseq$sdk$ui$query_element_rect(selector){
var temp__5804__auto__ = document.querySelector(selector);
if(cljs.core.truth_(temp__5804__auto__)){
var el = temp__5804__auto__;
return cljs_bean.core.__GT_js(el.getBoundingClientRect().toJSON());
} else {
return null;
}
});
goog.exportSymbol('logseq.sdk.ui.query_element_rect', logseq.sdk.ui.query_element_rect);
logseq.sdk.ui.query_element_by_id = (function logseq$sdk$ui$query_element_by_id(id){
var temp__5804__auto__ = goog.dom.getElement(id);
if(cljs.core.truth_(temp__5804__auto__)){
var el = temp__5804__auto__;
if(cljs.core.truth_(el)){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(el.tagName),"#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)].join('');
} else {
return false;
}
} else {
return null;
}
});
goog.exportSymbol('logseq.sdk.ui.query_element_by_id', logseq.sdk.ui.query_element_by_id);
logseq.sdk.ui.check_slot_valid = (function logseq$sdk$ui$check_slot_valid(slot){
if(typeof slot === 'string'){
return cljs.core.boolean$(logseq.sdk.ui.query_element_by_id(slot));
} else {
return null;
}
});
goog.exportSymbol('logseq.sdk.ui.check_slot_valid', logseq.sdk.ui.check_slot_valid);
logseq.sdk.ui.resolve_theme_css_props_vals = (function logseq$sdk$ui$resolve_theme_css_props_vals(props){
var temp__5804__auto__ = ((typeof props === 'string')?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [props], null):cljs_bean.core.__GT_clj(props));
if(cljs.core.truth_(temp__5804__auto__)){
var props__$1 = temp__5804__auto__;
var s = window.getComputedStyle(document.body);
var G__131668 = (function (){var iter__5480__auto__ = (function logseq$sdk$ui$resolve_theme_css_props_vals_$_iter__131669(s__131670){
return (new cljs.core.LazySeq(null,(function (){
var s__131670__$1 = s__131670;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__131670__$1);
if(temp__5804__auto____$1){
var s__131670__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__131670__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__131670__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__131672 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__131671 = (0);
while(true){
if((i__131671 < size__5479__auto__)){
var prop = cljs.core._nth(c__5478__auto__,i__131671);
cljs.core.chunk_append(b__131672,((typeof prop === 'string')?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [prop,frontend.util.trim_safe(s.getPropertyValue(prop))], null):null));

var G__131677 = (i__131671 + (1));
i__131671 = G__131677;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__131672),logseq$sdk$ui$resolve_theme_css_props_vals_$_iter__131669(cljs.core.chunk_rest(s__131670__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__131672),null);
}
} else {
var prop = cljs.core.first(s__131670__$2);
return cljs.core.cons(((typeof prop === 'string')?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [prop,frontend.util.trim_safe(s.getPropertyValue(prop))], null):null),logseq$sdk$ui$resolve_theme_css_props_vals_$_iter__131669(cljs.core.rest(s__131670__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(props__$1);
})();
var G__131668__$1 = (((G__131668 == null))?null:cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.empty_QMARK_,G__131668));
var G__131668__$2 = (((G__131668__$1 == null))?null:cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__131668__$1));
if((G__131668__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_js(G__131668__$2);
}
} else {
return null;
}
});
goog.exportSymbol('logseq.sdk.ui.resolve_theme_css_props_vals', logseq.sdk.ui.resolve_theme_css_props_vals);

//# sourceMappingURL=logseq.sdk.ui.js.map
