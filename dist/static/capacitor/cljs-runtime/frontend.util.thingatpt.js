goog.provide('frontend.util.thingatpt');
goog.scope(function(){
  frontend.util.thingatpt.goog$module$goog$object = goog.module.get('goog.object');
});
frontend.util.thingatpt.thing_at_point = (function frontend$util$thingatpt$thing_at_point(var_args){
var args__5732__auto__ = [];
var len__5726__auto___64688 = arguments.length;
var i__5727__auto___64689 = (0);
while(true){
if((i__5727__auto___64689 < len__5726__auto___64688)){
args__5732__auto__.push((arguments[i__5727__auto___64689]));

var G__64690 = (i__5727__auto___64689 + (1));
i__5727__auto___64689 = G__64690;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.util.thingatpt.thing_at_point.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.util.thingatpt.thing_at_point.cljs$core$IFn$_invoke$arity$variadic = (function (bounds,p__64604){
var vec__64605 = p__64604;
var input = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64605,(0),null);
var ignore = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64605,(1),null);
var input__$1 = (function (){var or__5002__auto__ = input;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.state.get_input();
}
})();
var content = frontend.util.thingatpt.goog$module$goog$object.get(input__$1,"value");
var pos = frontend.util.cursor.pos(input__$1);
var vec__64609 = ((cljs.core.coll_QMARK_(bounds))?bounds:new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [bounds,bounds], null));
var left = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64609,(0),null);
var right = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64609,(1),null);
if(clojure.string.blank_QMARK_(content)){
return null;
} else {
var start = clojure.string.last_index_of.cljs$core$IFn$_invoke$arity$3(content,left,((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(left,right))?(pos - cljs.core.count(left)):(pos - (1))));
var end = clojure.string.index_of.cljs$core$IFn$_invoke$arity$3(content,right,((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(left,right))?pos:((pos - cljs.core.count(right)) + (1))));
var end_STAR_ = (cljs.core.count(right) + end);
if(cljs.core.truth_((function (){var and__5000__auto__ = start;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = end;
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(start,pos);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
var thing = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(content,(start + cljs.core.count(left)),end);
if(cljs.core.every_QMARK_(cljs.core.false_QMARK_,cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__64599_SHARP_){
return clojure.string.includes_QMARK_(thing,p1__64599_SHARP_);
}),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [left,right,ignore], null)))){
return new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"full-content","full-content",-817477443),cljs.core.subs.cljs$core$IFn$_invoke$arity$3(content,start,end_STAR_),new cljs.core.Keyword(null,"raw-content","raw-content",-1509321159),cljs.core.subs.cljs$core$IFn$_invoke$arity$3(content,(start + cljs.core.count(left)),end),new cljs.core.Keyword(null,"bounds","bounds",1691609455),bounds,new cljs.core.Keyword(null,"start","start",-355208981),start,new cljs.core.Keyword(null,"end","end",-268185958),end_STAR_], null);
} else {
return null;
}
} else {
return null;
}
}
}));

(frontend.util.thingatpt.thing_at_point.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.util.thingatpt.thing_at_point.cljs$lang$applyTo = (function (seq64600){
var G__64601 = cljs.core.first(seq64600);
var seq64600__$1 = cljs.core.next(seq64600);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__64601,seq64600__$1);
}));

frontend.util.thingatpt.line_at_point = (function frontend$util$thingatpt$line_at_point(var_args){
var args__5732__auto__ = [];
var len__5726__auto___64691 = arguments.length;
var i__5727__auto___64692 = (0);
while(true){
if((i__5727__auto___64692 < len__5726__auto___64691)){
args__5732__auto__.push((arguments[i__5727__auto___64692]));

var G__64693 = (i__5727__auto___64692 + (1));
i__5727__auto___64692 = G__64693;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.util.thingatpt.line_at_point.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.util.thingatpt.line_at_point.cljs$core$IFn$_invoke$arity$variadic = (function (p__64613){
var vec__64614 = p__64613;
var input = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64614,(0),null);
var input__$1 = (function (){var or__5002__auto__ = input;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.state.get_input();
}
})();
var line_beginning_pos = frontend.util.cursor.line_beginning_pos(input__$1);
var line_end_pos = frontend.util.cursor.line_end_pos(input__$1);
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(line_beginning_pos,line_end_pos)){
var content = frontend.util.thingatpt.goog$module$goog$object.get(input__$1,"value");
var line = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(content,line_beginning_pos,line_end_pos);
return new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"type","type",1174270348),"line",new cljs.core.Keyword(null,"full-content","full-content",-817477443),line,new cljs.core.Keyword(null,"raw-content","raw-content",-1509321159),line,new cljs.core.Keyword(null,"start","start",-355208981),line_beginning_pos,new cljs.core.Keyword(null,"end","end",-268185958),line_end_pos], null);
} else {
return null;
}
}));

(frontend.util.thingatpt.line_at_point.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(frontend.util.thingatpt.line_at_point.cljs$lang$applyTo = (function (seq64612){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq64612));
}));

frontend.util.thingatpt.block_ref_at_point = (function frontend$util$thingatpt$block_ref_at_point(var_args){
var args__5732__auto__ = [];
var len__5726__auto___64694 = arguments.length;
var i__5727__auto___64695 = (0);
while(true){
if((i__5727__auto___64695 < len__5726__auto___64694)){
args__5732__auto__.push((arguments[i__5727__auto___64695]));

var G__64696 = (i__5727__auto___64695 + (1));
i__5727__auto___64695 = G__64696;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.util.thingatpt.block_ref_at_point.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.util.thingatpt.block_ref_at_point.cljs$core$IFn$_invoke$arity$variadic = (function (p__64618){
var vec__64619 = p__64618;
var input = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64619,(0),null);
var temp__5804__auto__ = frontend.util.thingatpt.thing_at_point.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [logseq.common.util.block_ref.left_parens,logseq.common.util.block_ref.right_parens], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input," "], 0));
if(cljs.core.truth_(temp__5804__auto__)){
var block_ref = temp__5804__auto__;
var temp__5804__auto____$1 = cljs.core.uuid(new cljs.core.Keyword(null,"raw-content","raw-content",-1509321159).cljs$core$IFn$_invoke$arity$1(block_ref));
if(cljs.core.truth_(temp__5804__auto____$1)){
var uuid = temp__5804__auto____$1;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(block_ref,new cljs.core.Keyword(null,"type","type",1174270348),"block-ref",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"link","link",-1769163468),uuid], 0));
} else {
return null;
}
} else {
return null;
}
}));

(frontend.util.thingatpt.block_ref_at_point.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(frontend.util.thingatpt.block_ref_at_point.cljs$lang$applyTo = (function (seq64617){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq64617));
}));

frontend.util.thingatpt.page_ref_at_point = (function frontend$util$thingatpt$page_ref_at_point(var_args){
var args__5732__auto__ = [];
var len__5726__auto___64699 = arguments.length;
var i__5727__auto___64700 = (0);
while(true){
if((i__5727__auto___64700 < len__5726__auto___64699)){
args__5732__auto__.push((arguments[i__5727__auto___64700]));

var G__64701 = (i__5727__auto___64700 + (1));
i__5727__auto___64700 = G__64701;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.util.thingatpt.page_ref_at_point.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.util.thingatpt.page_ref_at_point.cljs$core$IFn$_invoke$arity$variadic = (function (p__64623){
var vec__64624 = p__64623;
var input = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64624,(0),null);
var temp__5804__auto__ = frontend.util.thingatpt.thing_at_point.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [logseq.common.util.page_ref.left_brackets,logseq.common.util.page_ref.right_brackets], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0));
if(cljs.core.truth_(temp__5804__auto__)){
var page_ref = temp__5804__auto__;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(page_ref,new cljs.core.Keyword(null,"type","type",1174270348),"page-ref",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"link","link",-1769163468),(function (){var G__64627 = new cljs.core.Keyword(null,"full-content","full-content",-817477443).cljs$core$IFn$_invoke$arity$1(page_ref);
return (logseq.graph_parser.text.get_page_name.cljs$core$IFn$_invoke$arity$1 ? logseq.graph_parser.text.get_page_name.cljs$core$IFn$_invoke$arity$1(G__64627) : logseq.graph_parser.text.get_page_name.call(null,G__64627));
})()], 0));
} else {
return null;
}
}));

(frontend.util.thingatpt.page_ref_at_point.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(frontend.util.thingatpt.page_ref_at_point.cljs$lang$applyTo = (function (seq64622){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq64622));
}));

frontend.util.thingatpt.embed_macro_at_point = (function frontend$util$thingatpt$embed_macro_at_point(var_args){
var args__5732__auto__ = [];
var len__5726__auto___64705 = arguments.length;
var i__5727__auto___64706 = (0);
while(true){
if((i__5727__auto___64706 < len__5726__auto___64705)){
args__5732__auto__.push((arguments[i__5727__auto___64706]));

var G__64707 = (i__5727__auto___64706 + (1));
i__5727__auto___64706 = G__64707;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.util.thingatpt.embed_macro_at_point.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.util.thingatpt.embed_macro_at_point.cljs$core$IFn$_invoke$arity$variadic = (function (p__64629){
var vec__64630 = p__64629;
var input = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64630,(0),null);
var temp__5804__auto__ = frontend.util.thingatpt.thing_at_point.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["{{embed","}}"], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0));
if(cljs.core.truth_(temp__5804__auto__)){
var macro = temp__5804__auto__;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(macro,new cljs.core.Keyword(null,"type","type",1174270348),"macro");
} else {
return null;
}
}));

(frontend.util.thingatpt.embed_macro_at_point.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(frontend.util.thingatpt.embed_macro_at_point.cljs$lang$applyTo = (function (seq64628){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq64628));
}));

frontend.util.thingatpt.properties_at_point = (function frontend$util$thingatpt$properties_at_point(var_args){
var args__5732__auto__ = [];
var len__5726__auto___64708 = arguments.length;
var i__5727__auto___64709 = (0);
while(true){
if((i__5727__auto___64709 < len__5726__auto___64708)){
args__5732__auto__.push((arguments[i__5727__auto___64709]));

var G__64710 = (i__5727__auto___64709 + (1));
i__5727__auto___64709 = G__64710;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.util.thingatpt.properties_at_point.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.util.thingatpt.properties_at_point.cljs$core$IFn$_invoke$arity$variadic = (function (p__64634){
var vec__64635 = p__64634;
var input = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64635,(0),null);
var temp__5804__auto__ = (function (){var G__64641 = frontend.state.get_preferred_format.cljs$core$IFn$_invoke$arity$0();
var G__64641__$1 = (((G__64641 instanceof cljs.core.Keyword))?G__64641.fqn:null);
switch (G__64641__$1) {
case "org":
return frontend.util.thingatpt.thing_at_point.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [logseq.graph_parser.property.properties_start,logseq.graph_parser.property.properties_end], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0));

break;
default:
var temp__5804__auto__ = frontend.util.thingatpt.line_at_point.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0));
if(cljs.core.truth_(temp__5804__auto__)){
var line = temp__5804__auto__;
if(cljs.core.truth_(cljs.core.re_matches(/^[^\s.]+:: .*$/,new cljs.core.Keyword(null,"raw-content","raw-content",-1509321159).cljs$core$IFn$_invoke$arity$1(line)))){
return line;
} else {
return null;
}
} else {
return null;
}

}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var properties = temp__5804__auto__;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(properties,new cljs.core.Keyword(null,"type","type",1174270348),"properties-drawer");
} else {
return null;
}
}));

(frontend.util.thingatpt.properties_at_point.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(frontend.util.thingatpt.properties_at_point.cljs$lang$applyTo = (function (seq64633){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq64633));
}));

frontend.util.thingatpt.property_key_at_point = (function frontend$util$thingatpt$property_key_at_point(var_args){
var args__5732__auto__ = [];
var len__5726__auto___64712 = arguments.length;
var i__5727__auto___64713 = (0);
while(true){
if((i__5727__auto___64713 < len__5726__auto___64712)){
args__5732__auto__.push((arguments[i__5727__auto___64713]));

var G__64714 = (i__5727__auto___64713 + (1));
i__5727__auto___64713 = G__64714;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.util.thingatpt.property_key_at_point.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.util.thingatpt.property_key_at_point.cljs$core$IFn$_invoke$arity$variadic = (function (p__64643){
var vec__64644 = p__64643;
var input = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64644,(0),null);
if(cljs.core.truth_(frontend.util.thingatpt.properties_at_point.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0)))){
var property = (function (){var G__64647 = frontend.state.get_preferred_format.cljs$core$IFn$_invoke$arity$0();
var G__64647__$1 = (((G__64647 instanceof cljs.core.Keyword))?G__64647.fqn:null);
switch (G__64647__$1) {
case "org":
return frontend.util.thingatpt.thing_at_point.cljs$core$IFn$_invoke$arity$variadic(":",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input,"\n"], 0));

break;
default:
var temp__5804__auto__ = new cljs.core.Keyword(null,"raw-content","raw-content",-1509321159).cljs$core$IFn$_invoke$arity$1(frontend.util.thingatpt.line_at_point.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0)));
if(cljs.core.truth_(temp__5804__auto__)){
var line = temp__5804__auto__;
var key = cljs.core.first(clojure.string.split.cljs$core$IFn$_invoke$arity$2(line,logseq.graph_parser.property.colons));
var line_beginning_pos = frontend.util.cursor.line_beginning_pos(input);
var pos_in_line = (frontend.util.cursor.pos(input) - line_beginning_pos);
if(((((0) <= pos_in_line)) && ((pos_in_line <= (cljs.core.count(key) + ((logseq.graph_parser.property.colons).length)))))){
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"full-content","full-content",-817477443),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(key),logseq.graph_parser.property.colons].join(''),new cljs.core.Keyword(null,"raw-content","raw-content",-1509321159),key,new cljs.core.Keyword(null,"start","start",-355208981),line_beginning_pos,new cljs.core.Keyword(null,"end","end",-268185958),(line_beginning_pos + (([cljs.core.str.cljs$core$IFn$_invoke$arity$1(key),logseq.graph_parser.property.colons].join('')).length))], null);
} else {
return null;
}
} else {
return null;
}

}
})();
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(property,new cljs.core.Keyword(null,"type","type",1174270348),"property-key");
} else {
return null;
}
}));

(frontend.util.thingatpt.property_key_at_point.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(frontend.util.thingatpt.property_key_at_point.cljs$lang$applyTo = (function (seq64642){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq64642));
}));

frontend.util.thingatpt.get_list_item_indent_AMPERSAND_bullet = (function frontend$util$thingatpt$get_list_item_indent_AMPERSAND_bullet(line){
if(clojure.string.blank_QMARK_(line)){
return null;
} else {
var or__5002__auto__ = cljs.core.re_matches(/^([ \t\r]*)(\+|\*|-){1} (\[[X ]\])?.*$/,line);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.re_matches(/^([\s]*)(\d+){1}\. (\[[X ]\])?.*$/,line);
}
}
});
frontend.util.thingatpt.list_item_at_point = (function frontend$util$thingatpt$list_item_at_point(var_args){
var args__5732__auto__ = [];
var len__5726__auto___64716 = arguments.length;
var i__5727__auto___64717 = (0);
while(true){
if((i__5727__auto___64717 < len__5726__auto___64716)){
args__5732__auto__.push((arguments[i__5727__auto___64717]));

var G__64718 = (i__5727__auto___64717 + (1));
i__5727__auto___64717 = G__64718;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.util.thingatpt.list_item_at_point.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.util.thingatpt.list_item_at_point.cljs$core$IFn$_invoke$arity$variadic = (function (p__64653){
var vec__64654 = p__64653;
var input = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64654,(0),null);
var temp__5804__auto__ = frontend.util.thingatpt.line_at_point.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0));
if(cljs.core.truth_(temp__5804__auto__)){
var line = temp__5804__auto__;
var temp__5804__auto____$1 = frontend.util.thingatpt.get_list_item_indent_AMPERSAND_bullet(new cljs.core.Keyword(null,"raw-content","raw-content",-1509321159).cljs$core$IFn$_invoke$arity$1(line));
if(cljs.core.truth_(temp__5804__auto____$1)){
var vec__64657 = temp__5804__auto____$1;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64657,(0),null);
var indent = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64657,(1),null);
var bullet = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64657,(2),null);
var checkbox = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64657,(3),null);
var bullet__$1 = cljs.reader.read_string.cljs$core$IFn$_invoke$arity$1(bullet);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(line,new cljs.core.Keyword(null,"type","type",1174270348),"list-item",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"indent","indent",-148200125),indent,new cljs.core.Keyword(null,"bullet","bullet",726988937),bullet__$1,new cljs.core.Keyword(null,"checkbox","checkbox",1612615655),checkbox,new cljs.core.Keyword(null,"ordered","ordered",1187041426),cljs.core.int_QMARK_(bullet__$1)], 0));
} else {
return null;
}
} else {
return null;
}
}));

(frontend.util.thingatpt.list_item_at_point.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(frontend.util.thingatpt.list_item_at_point.cljs$lang$applyTo = (function (seq64652){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq64652));
}));

frontend.util.thingatpt.get_markup_at_point = (function frontend$util$thingatpt$get_markup_at_point(var_args){
var args__5732__auto__ = [];
var len__5726__auto___64723 = arguments.length;
var i__5727__auto___64724 = (0);
while(true){
if((i__5727__auto___64724 < len__5726__auto___64723)){
args__5732__auto__.push((arguments[i__5727__auto___64724]));

var G__64725 = (i__5727__auto___64724 + (1));
i__5727__auto___64724 = G__64725;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.util.thingatpt.get_markup_at_point.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.util.thingatpt.get_markup_at_point.cljs$core$IFn$_invoke$arity$variadic = (function (p__64662){
var vec__64663 = p__64662;
var input = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64663,(0),null);
var format = frontend.state.get_preferred_format.cljs$core$IFn$_invoke$arity$0();
var or__5002__auto__ = frontend.util.thingatpt.thing_at_point.cljs$core$IFn$_invoke$arity$variadic(frontend.config.get_hr(format),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = frontend.util.thingatpt.thing_at_point.cljs$core$IFn$_invoke$arity$variadic(frontend.config.get_bold(format),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0));
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = frontend.util.thingatpt.thing_at_point.cljs$core$IFn$_invoke$arity$variadic(frontend.config.get_italic(format),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0));
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = frontend.util.thingatpt.thing_at_point.cljs$core$IFn$_invoke$arity$variadic(frontend.config.get_underline(format),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0));
if(cljs.core.truth_(or__5002__auto____$3)){
return or__5002__auto____$3;
} else {
var or__5002__auto____$4 = frontend.util.thingatpt.thing_at_point.cljs$core$IFn$_invoke$arity$variadic(frontend.config.get_strike_through(format),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0));
if(cljs.core.truth_(or__5002__auto____$4)){
return or__5002__auto____$4;
} else {
var or__5002__auto____$5 = frontend.util.thingatpt.thing_at_point.cljs$core$IFn$_invoke$arity$variadic(frontend.config.get_highlight(format),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0));
if(cljs.core.truth_(or__5002__auto____$5)){
return or__5002__auto____$5;
} else {
return frontend.util.thingatpt.thing_at_point.cljs$core$IFn$_invoke$arity$variadic(frontend.config.get_code(format),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0));
}
}
}
}
}
}
}));

(frontend.util.thingatpt.get_markup_at_point.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(frontend.util.thingatpt.get_markup_at_point.cljs$lang$applyTo = (function (seq64661){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq64661));
}));

frontend.util.thingatpt.markup_at_point = (function frontend$util$thingatpt$markup_at_point(var_args){
var args__5732__auto__ = [];
var len__5726__auto___64726 = arguments.length;
var i__5727__auto___64727 = (0);
while(true){
if((i__5727__auto___64727 < len__5726__auto___64726)){
args__5732__auto__.push((arguments[i__5727__auto___64727]));

var G__64728 = (i__5727__auto___64727 + (1));
i__5727__auto___64727 = G__64728;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.util.thingatpt.markup_at_point.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.util.thingatpt.markup_at_point.cljs$core$IFn$_invoke$arity$variadic = (function (p__64667){
var vec__64668 = p__64667;
var input = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64668,(0),null);
var temp__5804__auto__ = frontend.util.thingatpt.get_markup_at_point.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0));
if(cljs.core.truth_(temp__5804__auto__)){
var markup = temp__5804__auto__;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(markup,new cljs.core.Keyword(null,"type","type",1174270348),"markup");
} else {
return null;
}
}));

(frontend.util.thingatpt.markup_at_point.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(frontend.util.thingatpt.markup_at_point.cljs$lang$applyTo = (function (seq64666){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq64666));
}));

frontend.util.thingatpt.org_admonition_AMPERSAND_src_at_point = (function frontend$util$thingatpt$org_admonition_AMPERSAND_src_at_point(var_args){
var args__5732__auto__ = [];
var len__5726__auto___64729 = arguments.length;
var i__5727__auto___64730 = (0);
while(true){
if((i__5727__auto___64730 < len__5726__auto___64729)){
args__5732__auto__.push((arguments[i__5727__auto___64730]));

var G__64731 = (i__5727__auto___64730 + (1));
i__5727__auto___64730 = G__64731;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.util.thingatpt.org_admonition_AMPERSAND_src_at_point.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.util.thingatpt.org_admonition_AMPERSAND_src_at_point.cljs$core$IFn$_invoke$arity$variadic = (function (p__64672){
var vec__64673 = p__64672;
var input = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64673,(0),null);
var temp__5804__auto__ = frontend.util.thingatpt.thing_at_point.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["#+BEGIN_","#+END_"], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0));
if(cljs.core.truth_(temp__5804__auto__)){
var admonition_AMPERSAND_src = temp__5804__auto__;
var params = clojure.string.split.cljs$core$IFn$_invoke$arity$2(cljs.core.first(clojure.string.split_lines(new cljs.core.Keyword(null,"full-content","full-content",-817477443).cljs$core$IFn$_invoke$arity$1(admonition_AMPERSAND_src))),/\s/);
if(cljs.core.coll_QMARK_(params)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(admonition_AMPERSAND_src,new cljs.core.Keyword(null,"type","type",1174270348),"source-block",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"language","language",-1591107564),cljs.core.ffirst(params),new cljs.core.Keyword(null,"headers","headers",-835030129),(((cljs.core.count(params) > (2)))?cljs.core.last((params.cljs$core$IFn$_invoke$arity$0 ? params.cljs$core$IFn$_invoke$arity$0() : params.call(null))):null),new cljs.core.Keyword(null,"end","end",-268185958),(new cljs.core.Keyword(null,"end","end",-268185958).cljs$core$IFn$_invoke$arity$1(admonition_AMPERSAND_src) + (("src").length))], 0));
} else {
var temp__5804__auto____$1 = clojure.string.trim(clojure.string.replace(params,"#+BEGIN_",""));
if(cljs.core.truth_(temp__5804__auto____$1)){
var name = temp__5804__auto____$1;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(admonition_AMPERSAND_src,new cljs.core.Keyword(null,"type","type",1174270348),"admonition-block",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"name","name",1843675177),name,new cljs.core.Keyword(null,"end","end",-268185958),(new cljs.core.Keyword(null,"end","end",-268185958).cljs$core$IFn$_invoke$arity$1(admonition_AMPERSAND_src) + ((name).length))], 0));
} else {
return null;
}

}
} else {
return null;
}
}));

(frontend.util.thingatpt.org_admonition_AMPERSAND_src_at_point.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(frontend.util.thingatpt.org_admonition_AMPERSAND_src_at_point.cljs$lang$applyTo = (function (seq64671){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq64671));
}));

frontend.util.thingatpt.markdown_src_at_point = (function frontend$util$thingatpt$markdown_src_at_point(var_args){
var args__5732__auto__ = [];
var len__5726__auto___64732 = arguments.length;
var i__5727__auto___64733 = (0);
while(true){
if((i__5727__auto___64733 < len__5726__auto___64732)){
args__5732__auto__.push((arguments[i__5727__auto___64733]));

var G__64734 = (i__5727__auto___64733 + (1));
i__5727__auto___64733 = G__64734;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.util.thingatpt.markdown_src_at_point.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.util.thingatpt.markdown_src_at_point.cljs$core$IFn$_invoke$arity$variadic = (function (p__64677){
var vec__64678 = p__64677;
var input = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64678,(0),null);
var temp__5804__auto__ = frontend.util.thingatpt.thing_at_point.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["```","```"], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0));
if(cljs.core.truth_(temp__5804__auto__)){
var markdown_src = temp__5804__auto__;
var language = clojure.string.trim(clojure.string.replace(cljs.core.first(clojure.string.split_lines(new cljs.core.Keyword(null,"full-content","full-content",-817477443).cljs$core$IFn$_invoke$arity$1(markdown_src))),"```",""));
var raw_content = new cljs.core.Keyword(null,"raw-content","raw-content",-1509321159).cljs$core$IFn$_invoke$arity$1(markdown_src);
var blank_raw_content_QMARK_ = clojure.string.blank_QMARK_(raw_content);
var action = ((((blank_raw_content_QMARK_) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(clojure.string.trim(raw_content),language))))?new cljs.core.Keyword(null,"into-code-editor","into-code-editor",-2140962343):new cljs.core.Keyword(null,"none","none",1333468478));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(markdown_src,new cljs.core.Keyword(null,"type","type",1174270348),"source-block",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"language","language",-1591107564),language,new cljs.core.Keyword(null,"action","action",-811238024),action,new cljs.core.Keyword(null,"headers","headers",-835030129),null], 0));
} else {
return null;
}
}));

(frontend.util.thingatpt.markdown_src_at_point.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(frontend.util.thingatpt.markdown_src_at_point.cljs$lang$applyTo = (function (seq64676){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq64676));
}));

frontend.util.thingatpt.admonition_AMPERSAND_src_at_point = (function frontend$util$thingatpt$admonition_AMPERSAND_src_at_point(var_args){
var args__5732__auto__ = [];
var len__5726__auto___64735 = arguments.length;
var i__5727__auto___64736 = (0);
while(true){
if((i__5727__auto___64736 < len__5726__auto___64735)){
args__5732__auto__.push((arguments[i__5727__auto___64736]));

var G__64737 = (i__5727__auto___64736 + (1));
i__5727__auto___64736 = G__64737;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.util.thingatpt.admonition_AMPERSAND_src_at_point.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.util.thingatpt.admonition_AMPERSAND_src_at_point.cljs$core$IFn$_invoke$arity$variadic = (function (p__64684){
var vec__64685 = p__64684;
var input = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64685,(0),null);
var or__5002__auto__ = frontend.util.thingatpt.org_admonition_AMPERSAND_src_at_point.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.util.thingatpt.markdown_src_at_point.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0));
}
}));

(frontend.util.thingatpt.admonition_AMPERSAND_src_at_point.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(frontend.util.thingatpt.admonition_AMPERSAND_src_at_point.cljs$lang$applyTo = (function (seq64682){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq64682));
}));

frontend.util.thingatpt.default_settings = new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"admonition&src?","admonition&src?",1506556328),true,new cljs.core.Keyword(null,"markup?","markup?",-1222732996),false,new cljs.core.Keyword(null,"block-ref?","block-ref?",1391145853),true,new cljs.core.Keyword(null,"page-ref?","page-ref?",677685143),true,new cljs.core.Keyword(null,"properties?","properties?",3428414),true,new cljs.core.Keyword(null,"list?","list?",-1642026156),false], null);
frontend.util.thingatpt.get_setting = (function frontend$util$thingatpt$get_setting(setting){
var value = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("dwim","settings","dwim/settings",1559339906),setting], null));
if((!((value == null)))){
return value;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(frontend.util.thingatpt.default_settings,setting);
}
});

//# sourceMappingURL=frontend.util.thingatpt.js.map
