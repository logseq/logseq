goog.provide('rewrite_clj.parser.token');
rewrite_clj.parser.token.read_to_boundary = (function rewrite_clj$parser$token$read_to_boundary(var_args){
var args__5732__auto__ = [];
var len__5726__auto___65594 = arguments.length;
var i__5727__auto___65595 = (0);
while(true){
if((i__5727__auto___65595 < len__5726__auto___65594)){
args__5732__auto__.push((arguments[i__5727__auto___65595]));

var G__65596 = (i__5727__auto___65595 + (1));
i__5727__auto___65595 = G__65596;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return rewrite_clj.parser.token.read_to_boundary.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(rewrite_clj.parser.token.read_to_boundary.cljs$core$IFn$_invoke$arity$variadic = (function (reader,p__65547){
var vec__65551 = p__65547;
var allowed = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65551,(0),null);
var allowed_QMARK_ = cljs.core.set(allowed);
return rewrite_clj.reader.read_until(reader,(function (p1__65531_SHARP_){
var and__5000__auto__ = cljs.core.not((allowed_QMARK_.cljs$core$IFn$_invoke$arity$1 ? allowed_QMARK_.cljs$core$IFn$_invoke$arity$1(p1__65531_SHARP_) : allowed_QMARK_.call(null,p1__65531_SHARP_)));
if(and__5000__auto__){
return rewrite_clj.reader.whitespace_or_boundary_QMARK_(p1__65531_SHARP_);
} else {
return and__5000__auto__;
}
}));
}));

(rewrite_clj.parser.token.read_to_boundary.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(rewrite_clj.parser.token.read_to_boundary.cljs$lang$applyTo = (function (seq65535){
var G__65536 = cljs.core.first(seq65535);
var seq65535__$1 = cljs.core.next(seq65535);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__65536,seq65535__$1);
}));

rewrite_clj.parser.token.read_to_char_boundary = (function rewrite_clj$parser$token$read_to_char_boundary(reader){
var c = rewrite_clj.reader.next(reader);
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(c),cljs.core.str.cljs$core$IFn$_invoke$arity$1(((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(c,"\\"))?rewrite_clj.parser.token.read_to_boundary(reader):""))].join('');
});
/**
 * Symbols allow for certain boundary characters that have
 * to be handled explicitly.
 */
rewrite_clj.parser.token.symbol_node = (function rewrite_clj$parser$token$symbol_node(reader,value,value_string){
var suffix = rewrite_clj.parser.token.read_to_boundary.cljs$core$IFn$_invoke$arity$variadic(reader,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["'",":"], null)], 0));
if(cljs.core.empty_QMARK_(suffix)){
return rewrite_clj.node.token.token_node.cljs$core$IFn$_invoke$arity$2(value,value_string);
} else {
var s = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(value_string),cljs.core.str.cljs$core$IFn$_invoke$arity$1(suffix)].join('');
return rewrite_clj.node.token.token_node.cljs$core$IFn$_invoke$arity$2(rewrite_clj.reader.read_symbol(s),s);
}
});
/**
 * Checks whether the reader is at the start of a number literal
 * 
 *   Cribbed and adapted from clojure.tools.reader.impl.commons
 */
rewrite_clj.parser.token.number_literal_QMARK_ = (function rewrite_clj$parser$token$number_literal_QMARK_(p__65572){
var vec__65576 = p__65572;
var c1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65576,(0),null);
var c2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65576,(1),null);
var or__5002__auto__ = rewrite_clj.interop.numeric_QMARK_(c1);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var and__5000__auto__ = ((("+" === c1)) || (("-" === c1)));
if(and__5000__auto__){
return rewrite_clj.interop.numeric_QMARK_(c2);
} else {
return and__5000__auto__;
}
}
});
/**
 * Parse a single token. For example: symbol, number or character.
 */
rewrite_clj.parser.token.parse_token = (function rewrite_clj$parser$token$parse_token(reader){
var first_char = rewrite_clj.reader.next(reader);
var s = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(first_char),cljs.core.str.cljs$core$IFn$_invoke$arity$1(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(first_char,"\\"))?rewrite_clj.parser.token.read_to_char_boundary(reader):rewrite_clj.parser.token.read_to_boundary(reader)))].join('');
var v = (cljs.core.truth_((function (){var or__5002__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(first_char,"\\");
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(first_char,"#");
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
return rewrite_clj.parser.token.number_literal_QMARK_(s);
}
}
})())?rewrite_clj.reader.string__GT_edn(s):rewrite_clj.reader.read_symbol(s));
if((v instanceof cljs.core.Symbol)){
return rewrite_clj.parser.token.symbol_node(reader,v,s);
} else {
return rewrite_clj.node.token.token_node.cljs$core$IFn$_invoke$arity$2(v,s);
}
});

//# sourceMappingURL=rewrite_clj.parser.token.js.map
