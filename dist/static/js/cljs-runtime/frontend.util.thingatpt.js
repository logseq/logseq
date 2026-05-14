goog.provide('frontend.util.thingatpt');
goog.scope(function(){
  frontend.util.thingatpt.goog$module$goog$object = goog.module.get('goog.object');
});
frontend.util.thingatpt.thing_at_point = (function frontend$util$thingatpt$thing_at_point(var_args){
var args__5732__auto__ = [];
var len__5726__auto___103840 = arguments.length;
var i__5727__auto___103841 = (0);
while(true){
if((i__5727__auto___103841 < len__5726__auto___103840)){
args__5732__auto__.push((arguments[i__5727__auto___103841]));

var G__103842 = (i__5727__auto___103841 + (1));
i__5727__auto___103841 = G__103842;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.util.thingatpt.thing_at_point.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.util.thingatpt.thing_at_point.cljs$core$IFn$_invoke$arity$variadic = (function (bounds,p__103734){
var vec__103735 = p__103734;
var input = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103735,(0),null);
var ignore = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103735,(1),null);
var input__$1 = (function (){var or__5002__auto__ = input;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.state.get_input();
}
})();
var content = frontend.util.thingatpt.goog$module$goog$object.get(input__$1,"value");
var pos = frontend.util.cursor.pos(input__$1);
var vec__103738 = ((cljs.core.coll_QMARK_(bounds))?bounds:new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [bounds,bounds], null));
var left = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103738,(0),null);
var right = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103738,(1),null);
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
if(cljs.core.every_QMARK_(cljs.core.false_QMARK_,cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__103727_SHARP_){
return clojure.string.includes_QMARK_(thing,p1__103727_SHARP_);
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
(frontend.util.thingatpt.thing_at_point.cljs$lang$applyTo = (function (seq103731){
var G__103732 = cljs.core.first(seq103731);
var seq103731__$1 = cljs.core.next(seq103731);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__103732,seq103731__$1);
}));

frontend.util.thingatpt.line_at_point = (function frontend$util$thingatpt$line_at_point(var_args){
var args__5732__auto__ = [];
var len__5726__auto___103849 = arguments.length;
var i__5727__auto___103850 = (0);
while(true){
if((i__5727__auto___103850 < len__5726__auto___103849)){
args__5732__auto__.push((arguments[i__5727__auto___103850]));

var G__103851 = (i__5727__auto___103850 + (1));
i__5727__auto___103850 = G__103851;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.util.thingatpt.line_at_point.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.util.thingatpt.line_at_point.cljs$core$IFn$_invoke$arity$variadic = (function (p__103743){
var vec__103744 = p__103743;
var input = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103744,(0),null);
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
(frontend.util.thingatpt.line_at_point.cljs$lang$applyTo = (function (seq103742){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq103742));
}));

frontend.util.thingatpt.block_ref_at_point = (function frontend$util$thingatpt$block_ref_at_point(var_args){
var args__5732__auto__ = [];
var len__5726__auto___103853 = arguments.length;
var i__5727__auto___103854 = (0);
while(true){
if((i__5727__auto___103854 < len__5726__auto___103853)){
args__5732__auto__.push((arguments[i__5727__auto___103854]));

var G__103855 = (i__5727__auto___103854 + (1));
i__5727__auto___103854 = G__103855;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.util.thingatpt.block_ref_at_point.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.util.thingatpt.block_ref_at_point.cljs$core$IFn$_invoke$arity$variadic = (function (p__103749){
var vec__103750 = p__103749;
var input = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103750,(0),null);
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
(frontend.util.thingatpt.block_ref_at_point.cljs$lang$applyTo = (function (seq103748){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq103748));
}));

frontend.util.thingatpt.page_ref_at_point = (function frontend$util$thingatpt$page_ref_at_point(var_args){
var args__5732__auto__ = [];
var len__5726__auto___103857 = arguments.length;
var i__5727__auto___103858 = (0);
while(true){
if((i__5727__auto___103858 < len__5726__auto___103857)){
args__5732__auto__.push((arguments[i__5727__auto___103858]));

var G__103859 = (i__5727__auto___103858 + (1));
i__5727__auto___103858 = G__103859;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.util.thingatpt.page_ref_at_point.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.util.thingatpt.page_ref_at_point.cljs$core$IFn$_invoke$arity$variadic = (function (p__103757){
var vec__103758 = p__103757;
var input = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103758,(0),null);
var temp__5804__auto__ = frontend.util.thingatpt.thing_at_point.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [logseq.common.util.page_ref.left_brackets,logseq.common.util.page_ref.right_brackets], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0));
if(cljs.core.truth_(temp__5804__auto__)){
var page_ref = temp__5804__auto__;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(page_ref,new cljs.core.Keyword(null,"type","type",1174270348),"page-ref",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"link","link",-1769163468),(function (){var G__103761 = new cljs.core.Keyword(null,"full-content","full-content",-817477443).cljs$core$IFn$_invoke$arity$1(page_ref);
return (logseq.graph_parser.text.get_page_name.cljs$core$IFn$_invoke$arity$1 ? logseq.graph_parser.text.get_page_name.cljs$core$IFn$_invoke$arity$1(G__103761) : logseq.graph_parser.text.get_page_name.call(null,G__103761));
})()], 0));
} else {
return null;
}
}));

(frontend.util.thingatpt.page_ref_at_point.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(frontend.util.thingatpt.page_ref_at_point.cljs$lang$applyTo = (function (seq103753){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq103753));
}));

frontend.util.thingatpt.embed_macro_at_point = (function frontend$util$thingatpt$embed_macro_at_point(var_args){
var args__5732__auto__ = [];
var len__5726__auto___103860 = arguments.length;
var i__5727__auto___103861 = (0);
while(true){
if((i__5727__auto___103861 < len__5726__auto___103860)){
args__5732__auto__.push((arguments[i__5727__auto___103861]));

var G__103862 = (i__5727__auto___103861 + (1));
i__5727__auto___103861 = G__103862;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.util.thingatpt.embed_macro_at_point.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.util.thingatpt.embed_macro_at_point.cljs$core$IFn$_invoke$arity$variadic = (function (p__103767){
var vec__103768 = p__103767;
var input = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103768,(0),null);
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
(frontend.util.thingatpt.embed_macro_at_point.cljs$lang$applyTo = (function (seq103762){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq103762));
}));

frontend.util.thingatpt.properties_at_point = (function frontend$util$thingatpt$properties_at_point(var_args){
var args__5732__auto__ = [];
var len__5726__auto___103863 = arguments.length;
var i__5727__auto___103864 = (0);
while(true){
if((i__5727__auto___103864 < len__5726__auto___103863)){
args__5732__auto__.push((arguments[i__5727__auto___103864]));

var G__103865 = (i__5727__auto___103864 + (1));
i__5727__auto___103864 = G__103865;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.util.thingatpt.properties_at_point.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.util.thingatpt.properties_at_point.cljs$core$IFn$_invoke$arity$variadic = (function (p__103775){
var vec__103776 = p__103775;
var input = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103776,(0),null);
var temp__5804__auto__ = (function (){var G__103779 = frontend.state.get_preferred_format.cljs$core$IFn$_invoke$arity$0();
var G__103779__$1 = (((G__103779 instanceof cljs.core.Keyword))?G__103779.fqn:null);
switch (G__103779__$1) {
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
(frontend.util.thingatpt.properties_at_point.cljs$lang$applyTo = (function (seq103773){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq103773));
}));

frontend.util.thingatpt.property_key_at_point = (function frontend$util$thingatpt$property_key_at_point(var_args){
var args__5732__auto__ = [];
var len__5726__auto___103868 = arguments.length;
var i__5727__auto___103869 = (0);
while(true){
if((i__5727__auto___103869 < len__5726__auto___103868)){
args__5732__auto__.push((arguments[i__5727__auto___103869]));

var G__103870 = (i__5727__auto___103869 + (1));
i__5727__auto___103869 = G__103870;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.util.thingatpt.property_key_at_point.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.util.thingatpt.property_key_at_point.cljs$core$IFn$_invoke$arity$variadic = (function (p__103784){
var vec__103785 = p__103784;
var input = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103785,(0),null);
if(cljs.core.truth_(frontend.util.thingatpt.properties_at_point.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0)))){
var property = (function (){var G__103788 = frontend.state.get_preferred_format.cljs$core$IFn$_invoke$arity$0();
var G__103788__$1 = (((G__103788 instanceof cljs.core.Keyword))?G__103788.fqn:null);
switch (G__103788__$1) {
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
(frontend.util.thingatpt.property_key_at_point.cljs$lang$applyTo = (function (seq103783){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq103783));
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
var len__5726__auto___103872 = arguments.length;
var i__5727__auto___103874 = (0);
while(true){
if((i__5727__auto___103874 < len__5726__auto___103872)){
args__5732__auto__.push((arguments[i__5727__auto___103874]));

var G__103875 = (i__5727__auto___103874 + (1));
i__5727__auto___103874 = G__103875;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.util.thingatpt.list_item_at_point.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.util.thingatpt.list_item_at_point.cljs$core$IFn$_invoke$arity$variadic = (function (p__103793){
var vec__103794 = p__103793;
var input = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103794,(0),null);
var temp__5804__auto__ = frontend.util.thingatpt.line_at_point.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0));
if(cljs.core.truth_(temp__5804__auto__)){
var line = temp__5804__auto__;
var temp__5804__auto____$1 = frontend.util.thingatpt.get_list_item_indent_AMPERSAND_bullet(new cljs.core.Keyword(null,"raw-content","raw-content",-1509321159).cljs$core$IFn$_invoke$arity$1(line));
if(cljs.core.truth_(temp__5804__auto____$1)){
var vec__103797 = temp__5804__auto____$1;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103797,(0),null);
var indent = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103797,(1),null);
var bullet = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103797,(2),null);
var checkbox = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103797,(3),null);
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
(frontend.util.thingatpt.list_item_at_point.cljs$lang$applyTo = (function (seq103790){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq103790));
}));

frontend.util.thingatpt.get_markup_at_point = (function frontend$util$thingatpt$get_markup_at_point(var_args){
var args__5732__auto__ = [];
var len__5726__auto___103877 = arguments.length;
var i__5727__auto___103879 = (0);
while(true){
if((i__5727__auto___103879 < len__5726__auto___103877)){
args__5732__auto__.push((arguments[i__5727__auto___103879]));

var G__103880 = (i__5727__auto___103879 + (1));
i__5727__auto___103879 = G__103880;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.util.thingatpt.get_markup_at_point.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.util.thingatpt.get_markup_at_point.cljs$core$IFn$_invoke$arity$variadic = (function (p__103806){
var vec__103807 = p__103806;
var input = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103807,(0),null);
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
(frontend.util.thingatpt.get_markup_at_point.cljs$lang$applyTo = (function (seq103804){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq103804));
}));

frontend.util.thingatpt.markup_at_point = (function frontend$util$thingatpt$markup_at_point(var_args){
var args__5732__auto__ = [];
var len__5726__auto___103882 = arguments.length;
var i__5727__auto___103883 = (0);
while(true){
if((i__5727__auto___103883 < len__5726__auto___103882)){
args__5732__auto__.push((arguments[i__5727__auto___103883]));

var G__103884 = (i__5727__auto___103883 + (1));
i__5727__auto___103883 = G__103884;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.util.thingatpt.markup_at_point.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.util.thingatpt.markup_at_point.cljs$core$IFn$_invoke$arity$variadic = (function (p__103811){
var vec__103812 = p__103811;
var input = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103812,(0),null);
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
(frontend.util.thingatpt.markup_at_point.cljs$lang$applyTo = (function (seq103810){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq103810));
}));

frontend.util.thingatpt.org_admonition_AMPERSAND_src_at_point = (function frontend$util$thingatpt$org_admonition_AMPERSAND_src_at_point(var_args){
var args__5732__auto__ = [];
var len__5726__auto___103885 = arguments.length;
var i__5727__auto___103887 = (0);
while(true){
if((i__5727__auto___103887 < len__5726__auto___103885)){
args__5732__auto__.push((arguments[i__5727__auto___103887]));

var G__103888 = (i__5727__auto___103887 + (1));
i__5727__auto___103887 = G__103888;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.util.thingatpt.org_admonition_AMPERSAND_src_at_point.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.util.thingatpt.org_admonition_AMPERSAND_src_at_point.cljs$core$IFn$_invoke$arity$variadic = (function (p__103817){
var vec__103818 = p__103817;
var input = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103818,(0),null);
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
(frontend.util.thingatpt.org_admonition_AMPERSAND_src_at_point.cljs$lang$applyTo = (function (seq103816){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq103816));
}));

frontend.util.thingatpt.markdown_src_at_point = (function frontend$util$thingatpt$markdown_src_at_point(var_args){
var args__5732__auto__ = [];
var len__5726__auto___103891 = arguments.length;
var i__5727__auto___103892 = (0);
while(true){
if((i__5727__auto___103892 < len__5726__auto___103891)){
args__5732__auto__.push((arguments[i__5727__auto___103892]));

var G__103893 = (i__5727__auto___103892 + (1));
i__5727__auto___103892 = G__103893;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.util.thingatpt.markdown_src_at_point.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.util.thingatpt.markdown_src_at_point.cljs$core$IFn$_invoke$arity$variadic = (function (p__103824){
var vec__103825 = p__103824;
var input = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103825,(0),null);
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
(frontend.util.thingatpt.markdown_src_at_point.cljs$lang$applyTo = (function (seq103823){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq103823));
}));

frontend.util.thingatpt.admonition_AMPERSAND_src_at_point = (function frontend$util$thingatpt$admonition_AMPERSAND_src_at_point(var_args){
var args__5732__auto__ = [];
var len__5726__auto___103902 = arguments.length;
var i__5727__auto___103903 = (0);
while(true){
if((i__5727__auto___103903 < len__5726__auto___103902)){
args__5732__auto__.push((arguments[i__5727__auto___103903]));

var G__103904 = (i__5727__auto___103903 + (1));
i__5727__auto___103903 = G__103904;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.util.thingatpt.admonition_AMPERSAND_src_at_point.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.util.thingatpt.admonition_AMPERSAND_src_at_point.cljs$core$IFn$_invoke$arity$variadic = (function (p__103830){
var vec__103831 = p__103830;
var input = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103831,(0),null);
var or__5002__auto__ = frontend.util.thingatpt.org_admonition_AMPERSAND_src_at_point.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.util.thingatpt.markdown_src_at_point.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([input], 0));
}
}));

(frontend.util.thingatpt.admonition_AMPERSAND_src_at_point.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(frontend.util.thingatpt.admonition_AMPERSAND_src_at_point.cljs$lang$applyTo = (function (seq103829){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq103829));
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
