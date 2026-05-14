goog.provide('rewrite_clj.reader');
/**
 * Throw reader exception, including line line/column.
 */
rewrite_clj.reader.throw_reader = (function rewrite_clj$reader$throw_reader(var_args){
var args__5732__auto__ = [];
var len__5726__auto___64278 = arguments.length;
var i__5727__auto___64280 = (0);
while(true){
if((i__5727__auto___64280 < len__5726__auto___64278)){
args__5732__auto__.push((arguments[i__5727__auto___64280]));

var G__64281 = (i__5727__auto___64280 + (1));
i__5727__auto___64280 = G__64281;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return rewrite_clj.reader.throw_reader.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(rewrite_clj.reader.throw_reader.cljs$core$IFn$_invoke$arity$variadic = (function (reader,fmt,data){
var m = cljs.core.apply.cljs$core$IFn$_invoke$arity$3(rewrite_clj.interop.simple_format,fmt,data);
var c = cljs.tools.reader.reader_types.get_column_number(reader);
var l = cljs.tools.reader.reader_types.get_line_number(reader);
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2([cljs.core.str.cljs$core$IFn$_invoke$arity$1(m)," [at line ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(l),", column ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(c),"]"].join(''),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"msg","msg",-1386103444),m,new cljs.core.Keyword(null,"row","row",-570139521),l,new cljs.core.Keyword(null,"col","col",-1959363084),c], null));
}));

(rewrite_clj.reader.throw_reader.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(rewrite_clj.reader.throw_reader.cljs$lang$applyTo = (function (seq64183){
var G__64184 = cljs.core.first(seq64183);
var seq64183__$1 = cljs.core.next(seq64183);
var G__64185 = cljs.core.first(seq64183__$1);
var seq64183__$2 = cljs.core.next(seq64183__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__64184,G__64185,seq64183__$2);
}));

/**
 * Check whether a given char is a token boundary.
 */
rewrite_clj.reader.boundary_QMARK_ = (function rewrite_clj$reader$boundary_QMARK_(c){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 16, [null,null,"@",null,"`",null,"\"",null,"'",null,"(",null,")",null,":",null,";",null,"[",null,"{",null,"\\",null,"]",null,"}",null,"^",null,"~",null], null), null),c);
});
rewrite_clj.reader.comma_QMARK_ = (function rewrite_clj$reader$comma_QMARK_(c){
return ("," === c);
});
/**
 * Checks whether a given character is whitespace
 */
rewrite_clj.reader.whitespace_QMARK_ = (function rewrite_clj$reader$whitespace_QMARK_(c){
return rewrite_clj.interop.clojure_whitespace_QMARK_(c);
});
/**
 * Checks whether the character is a newline
 */
rewrite_clj.reader.linebreak_QMARK_ = (function rewrite_clj$reader$linebreak_QMARK_(c){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["\n",null,"\r",null], null), null),c);
});
/**
 * Checks whether the character is a space
 */
rewrite_clj.reader.space_QMARK_ = (function rewrite_clj$reader$space_QMARK_(c){
var and__5000__auto__ = c;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = rewrite_clj.reader.whitespace_QMARK_(c);
if(cljs.core.truth_(and__5000__auto____$1)){
return (!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, ["\n",null,",",null,"\r",null], null), null),c)));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
});
rewrite_clj.reader.whitespace_or_boundary_QMARK_ = (function rewrite_clj$reader$whitespace_or_boundary_QMARK_(c){
var or__5002__auto__ = rewrite_clj.reader.whitespace_QMARK_(c);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return rewrite_clj.reader.boundary_QMARK_(c);
}
});
/**
 * Read while the chars fulfill the given condition. Ignores
 *  the unmatching char.
 */
rewrite_clj.reader.read_while = (function rewrite_clj$reader$read_while(var_args){
var G__64201 = arguments.length;
switch (G__64201) {
case 2:
return rewrite_clj.reader.read_while.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return rewrite_clj.reader.read_while.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(rewrite_clj.reader.read_while.cljs$core$IFn$_invoke$arity$2 = (function (reader,p_QMARK_){
return rewrite_clj.reader.read_while.cljs$core$IFn$_invoke$arity$3(reader,p_QMARK_,cljs.core.not((p_QMARK_.cljs$core$IFn$_invoke$arity$1 ? p_QMARK_.cljs$core$IFn$_invoke$arity$1(null) : p_QMARK_.call(null,null))));
}));

(rewrite_clj.reader.read_while.cljs$core$IFn$_invoke$arity$3 = (function (reader,p_QMARK_,eof_QMARK_){
var buf = (new goog.string.StringBuffer());
while(true){
var temp__5802__auto__ = reader.cljs$tools$reader$reader_types$Reader$read_char$arity$1(null);
if(cljs.core.truth_(temp__5802__auto__)){
var c = temp__5802__auto__;
if(cljs.core.truth_((p_QMARK_.cljs$core$IFn$_invoke$arity$1 ? p_QMARK_.cljs$core$IFn$_invoke$arity$1(c) : p_QMARK_.call(null,c)))){
buf.append(c);

continue;
} else {
reader.cljs$tools$reader$reader_types$IPushbackReader$unread$arity$2(null,c);

return buf.toString();
}
} else {
if(cljs.core.truth_(eof_QMARK_)){
return buf.toString();
} else {
return rewrite_clj.reader.throw_reader(reader,"unexpected EOF");
}
}
break;
}
}));

(rewrite_clj.reader.read_while.cljs$lang$maxFixedArity = 3);

/**
 * Read until a char fulfills the given condition. Ignores the
 * matching char.
 */
rewrite_clj.reader.read_until = (function rewrite_clj$reader$read_until(reader,p_QMARK_){
return rewrite_clj.reader.read_while.cljs$core$IFn$_invoke$arity$3(reader,cljs.core.complement(p_QMARK_),(p_QMARK_.cljs$core$IFn$_invoke$arity$1 ? p_QMARK_.cljs$core$IFn$_invoke$arity$1(null) : p_QMARK_.call(null,null)));
});
/**
 * Read until linebreak and include it.
 */
rewrite_clj.reader.read_include_linebreak = (function rewrite_clj$reader$read_include_linebreak(reader){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(rewrite_clj.reader.read_until(reader,(function (p1__64203_SHARP_){
return (((p1__64203_SHARP_ == null)) || (rewrite_clj.reader.linebreak_QMARK_(p1__64203_SHARP_)));
}))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(reader.cljs$tools$reader$reader_types$Reader$read_char$arity$1(null))].join('');
});
/**
 * Convert string to EDN value.
 */
rewrite_clj.reader.string__GT_edn = (function rewrite_clj$reader$string__GT_edn(s){
return cljs.tools.reader.edn.read_string.cljs$core$IFn$_invoke$arity$1(s);
});
/**
 * Ignore the next character.
 */
rewrite_clj.reader.ignore = (function rewrite_clj$reader$ignore(reader){
reader.cljs$tools$reader$reader_types$Reader$read_char$arity$1(null);

return null;
});
/**
 * Read next char.
 */
rewrite_clj.reader.next = (function rewrite_clj$reader$next(reader){
return reader.cljs$tools$reader$reader_types$Reader$read_char$arity$1(null);
});
/**
 * Unreads a char. Puts the char back on the reader.
 */
rewrite_clj.reader.unread = (function rewrite_clj$reader$unread(reader,ch){
return reader.cljs$tools$reader$reader_types$IPushbackReader$unread$arity$2(null,ch);
});
/**
 * Peek next char.
 */
rewrite_clj.reader.peek = (function rewrite_clj$reader$peek(reader){
var ch = reader.cljs$tools$reader$reader_types$Reader$peek_char$arity$1(null);
if(("\r" === ch)){
return "\n";
} else {
return ch;
}
});
/**
 * Create map of `row-k` and `col-k` representing the current reader position.
 */
rewrite_clj.reader.position = (function rewrite_clj$reader$position(reader,row_k,col_k){
return cljs.core.PersistentArrayMap.createAsIfByAssoc([row_k,reader.cljs$tools$reader$reader_types$IndexingReader$get_line_number$arity$1(null),col_k,reader.cljs$tools$reader$reader_types$IndexingReader$get_column_number$arity$1(null)]);
});
/**
 * Use the given function to read value, then attach row/col metadata.
 */
rewrite_clj.reader.read_with_meta = (function rewrite_clj$reader$read_with_meta(reader,read_fn){
var start_position = rewrite_clj.reader.position(reader,new cljs.core.Keyword(null,"row","row",-570139521),new cljs.core.Keyword(null,"col","col",-1959363084));
var temp__5804__auto__ = (read_fn.cljs$core$IFn$_invoke$arity$1 ? read_fn.cljs$core$IFn$_invoke$arity$1(reader) : read_fn.call(null,reader));
if(cljs.core.truth_(temp__5804__auto__)){
var entry = temp__5804__auto__;
return cljs.core.with_meta(entry,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([start_position,rewrite_clj.reader.position(reader,new cljs.core.Keyword(null,"end-row","end-row",-545103581),new cljs.core.Keyword(null,"end-col","end-col",-724155879))], 0)));
} else {
return null;
}
});
/**
 * Call the given function on the given reader until it returns
 * a non-truthy value.
 */
rewrite_clj.reader.read_repeatedly = (function rewrite_clj$reader$read_repeatedly(reader,read_fn){
return cljs.core.doall.cljs$core$IFn$_invoke$arity$1(cljs.core.take_while.cljs$core$IFn$_invoke$arity$2(cljs.core.identity,cljs.core.repeatedly.cljs$core$IFn$_invoke$arity$1((function (){
return (read_fn.cljs$core$IFn$_invoke$arity$1 ? read_fn.cljs$core$IFn$_invoke$arity$1(reader) : read_fn.call(null,reader));
}))));
});
/**
 * Call the given function on the given reader until `n` values matching `p?` have been
 * collected.
 */
rewrite_clj.reader.read_n = (function rewrite_clj$reader$read_n(reader,node_tag,read_fn,p_QMARK_,n){
if((n > (0))){
} else {
throw (new Error("Assert failed: (pos? n)"));
}

var c = (0);
var vs = cljs.core.PersistentVector.EMPTY;
while(true){
if((c < n)){
var temp__5802__auto__ = (read_fn.cljs$core$IFn$_invoke$arity$1 ? read_fn.cljs$core$IFn$_invoke$arity$1(reader) : read_fn.call(null,reader));
if(cljs.core.truth_(temp__5802__auto__)){
var v = temp__5802__auto__;
var G__64310 = (cljs.core.truth_((p_QMARK_.cljs$core$IFn$_invoke$arity$1 ? p_QMARK_.cljs$core$IFn$_invoke$arity$1(v) : p_QMARK_.call(null,v)))?(c + (1)):c);
var G__64311 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(vs,v);
c = G__64310;
vs = G__64311;
continue;
} else {
return rewrite_clj.reader.throw_reader.cljs$core$IFn$_invoke$arity$variadic(reader,"%s node expects %d value%s.",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([node_tag,n,((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(n,(1)))?"":"s")], 0));
}
} else {
return vs;
}
break;
}
});
/**
 * This customized version of clojure.tools.reader.edn's read-keyword allows for
 *   an embedded `::` in a keyword to to support [garden-style keywords](https://github.com/noprompt/garden)
 *   like `:&::before`. This function was transcribed from clj-kondo.
 */
rewrite_clj.reader.read_keyword = (function rewrite_clj$reader$read_keyword(reader){
var ch = cljs.tools.reader.reader_types.read_char(reader);
if((!(cljs.tools.reader.impl.utils.whitespace_QMARK_(ch)))){
var token = (function (){var fexpr__64224 = new cljs.core.Var(function(){return cljs.tools.reader.edn.read_token;},new cljs.core.Symbol("cljs.tools.reader.edn","read-token","cljs.tools.reader.edn/read-token",-1809266548,null),cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"private","private",-558947994),new cljs.core.Keyword(null,"ns","ns",441598760),new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword(null,"file","file",-1269645878),new cljs.core.Keyword(null,"end-column","end-column",1425389514),new cljs.core.Keyword(null,"top-fn","top-fn",-2056129173),new cljs.core.Keyword(null,"column","column",2078222095),new cljs.core.Keyword(null,"line","line",212345235),new cljs.core.Keyword(null,"end-line","end-line",1837326455),new cljs.core.Keyword(null,"arglists","arglists",1661989754),new cljs.core.Keyword(null,"doc","doc",1913296891),new cljs.core.Keyword(null,"test","test",577538877)],[true,new cljs.core.Symbol(null,"cljs.tools.reader.edn","cljs.tools.reader.edn",-1275821532,null),new cljs.core.Symbol(null,"read-token","read-token",392624627,null),"cljs/tools/reader/edn.cljs",18,new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"variadic?","variadic?",584179762),false,new cljs.core.Keyword(null,"fixed-arity","fixed-arity",1586445869),4,new cljs.core.Keyword(null,"max-fixed-arity","max-fixed-arity",-690205543),4,new cljs.core.Keyword(null,"method-params","method-params",-980792179),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"rdr","rdr",190007785,null),new cljs.core.Symbol(null,"kind","kind",923265724,null),new cljs.core.Symbol(null,"initch","initch",946908919,null)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"rdr","rdr",190007785,null),new cljs.core.Symbol(null,"kind","kind",923265724,null),new cljs.core.Symbol(null,"initch","initch",946908919,null),new cljs.core.Symbol(null,"validate-leading?","validate-leading?",1185429770,null)], null)], null),new cljs.core.Keyword(null,"arglists","arglists",1661989754),cljs.core.list(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"rdr","rdr",190007785,null),new cljs.core.Symbol(null,"kind","kind",923265724,null),new cljs.core.Symbol(null,"initch","initch",946908919,null)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"rdr","rdr",190007785,null),new cljs.core.Symbol(null,"kind","kind",923265724,null),new cljs.core.Symbol(null,"initch","initch",946908919,null),new cljs.core.Symbol(null,"validate-leading?","validate-leading?",1185429770,null)], null)),new cljs.core.Keyword(null,"arglists-meta","arglists-meta",1944829838),cljs.core.list(null,null)], null),1,42,42,cljs.core.list(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"rdr","rdr",190007785,null),new cljs.core.Symbol(null,"kind","kind",923265724,null),new cljs.core.Symbol(null,"initch","initch",946908919,null)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"rdr","rdr",190007785,null),new cljs.core.Symbol(null,"kind","kind",923265724,null),new cljs.core.Symbol(null,"initch","initch",946908919,null),new cljs.core.Symbol(null,"validate-leading?","validate-leading?",1185429770,null)], null)),null,(cljs.core.truth_(cljs.tools.reader.edn.read_token)?cljs.tools.reader.edn.read_token.cljs$lang$test:null)]));
return (fexpr__64224.cljs$core$IFn$_invoke$arity$3 ? fexpr__64224.cljs$core$IFn$_invoke$arity$3(reader,new cljs.core.Keyword(null,"keyword","keyword",811389747),ch) : fexpr__64224.call(null,reader,new cljs.core.Keyword(null,"keyword","keyword",811389747),ch));
})();
var s = cljs.tools.reader.impl.commons.parse_symbol(token);
if(cljs.core.truth_((function (){var and__5000__auto__ = s;
if(cljs.core.truth_(and__5000__auto__)){
return (!((token.indexOf("::") === (0))));
} else {
return and__5000__auto__;
}
})())){
var ns = (s.cljs$core$IFn$_invoke$arity$1 ? s.cljs$core$IFn$_invoke$arity$1((0)) : s.call(null,(0)));
var name = (s.cljs$core$IFn$_invoke$arity$1 ? s.cljs$core$IFn$_invoke$arity$1((1)) : s.call(null,(1)));
if((":" === cljs.core.nth.cljs$core$IFn$_invoke$arity$2(token,(0)))){
return cljs.tools.reader.impl.errors.throw_invalid(reader,new cljs.core.Keyword(null,"keyword","keyword",811389747),token);
} else {
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$2(ns,name);
}
} else {
return cljs.tools.reader.impl.errors.throw_invalid(reader,new cljs.core.Keyword(null,"keyword","keyword",811389747),token);
}
} else {
return cljs.tools.reader.impl.errors.throw_single_colon(reader);
}
});
/**
 * Parses a string into a vector of the namespace and symbol
 * 
 *   Cribbed from clojure/cljs.tools.reader.impl.commons/parse-symbol merging clj and cljs fns into single implementation
 *   Added in equivalent of TRDR-73 patch to allow array class symbols (e.g. foobar/3).
 */
rewrite_clj.reader.parse_symbol = (function rewrite_clj$reader$parse_symbol(token){
if(((("" === token)) || (((clojure.string.ends_with_QMARK_(token,":")) || (clojure.string.starts_with_QMARK_(token,"::")))))){
return null;
} else {
var temp__5802__auto__ = clojure.string.index_of.cljs$core$IFn$_invoke$arity$2(token,"/");
if(cljs.core.truth_(temp__5802__auto__)){
var ns_idx = temp__5802__auto__;
var ns = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(token,(0),ns_idx);
var ns_idx__$1 = (ns_idx + (1));
if((ns_idx__$1 === cljs.core.count(token))){
return null;
} else {
var sym = cljs.core.subs.cljs$core$IFn$_invoke$arity$2(token,ns_idx__$1);
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 9, ["9",null,"3",null,"4",null,"8",null,"7",null,"5",null,"6",null,"1",null,"2",null], null), null),sym)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [ns,sym], null);
} else {
if(((cljs.core.not(rewrite_clj.interop.numeric_QMARK_(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(sym,(0))))) && ((((!(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("",sym)))) && ((((!(clojure.string.ends_with_QMARK_(ns,":")))) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(sym,"/")) || ((clojure.string.index_of.cljs$core$IFn$_invoke$arity$2(sym,"/") == null)))))))))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [ns,sym], null);
} else {
return null;
}
}
}
} else {
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(token,"/")) || ((clojure.string.index_of.cljs$core$IFn$_invoke$arity$2(token,"/") == null)))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [null,token], null);
} else {
return null;
}
}
}
});
/**
 * Return symbol parsed from `token`.
 * 
 *   Cribbed from clojure/cljs.tools.reader.edn/read-symbol and - adapted to work on string
 */
rewrite_clj.reader.read_symbol = (function rewrite_clj$reader$read_symbol(token){
var G__64250 = token;
switch (G__64250) {
case "nil":
return null;

break;
case "true":
return true;

break;
case "false":
return false;

break;
case "/":
return new cljs.core.Symbol(null,"/","/",-1371932971,null);

break;
default:
var or__5002__auto__ = (function (){var temp__5804__auto__ = rewrite_clj.reader.parse_symbol(token);
if(cljs.core.truth_(temp__5804__auto__)){
var p = temp__5804__auto__;
return cljs.core.symbol.cljs$core$IFn$_invoke$arity$2((p.cljs$core$IFn$_invoke$arity$1 ? p.cljs$core$IFn$_invoke$arity$1((0)) : p.call(null,(0))),(p.cljs$core$IFn$_invoke$arity$1 ? p.cljs$core$IFn$_invoke$arity$1((1)) : p.call(null,(1))));
} else {
return null;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.tools.reader.impl.errors.throw_invalid(null,new cljs.core.Keyword(null,"symbol","symbol",-1038572696),token);
}

}
});
/**
 * Create reader for strings.
 */
rewrite_clj.reader.string_reader = (function rewrite_clj$reader$string_reader(s){
return cljs.tools.reader.reader_types.indexing_push_back_reader.cljs$core$IFn$_invoke$arity$1(cljs.tools.reader.reader_types.string_push_back_reader.cljs$core$IFn$_invoke$arity$1(s));
});

//# sourceMappingURL=rewrite_clj.reader.js.map
