goog.provide('rewrite_clj.parser.core');
rewrite_clj.parser.core._STAR_delimiter_STAR_ = null;
rewrite_clj.parser.core.dispatch = (function rewrite_clj$parser$core$dispatch(c){
if((c == null)){
return new cljs.core.Keyword(null,"eof","eof",-489063237);
} else {
if(cljs.core.truth_(rewrite_clj.reader.whitespace_QMARK_(c))){
return new cljs.core.Keyword(null,"whitespace","whitespace",-1340035483);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(c,rewrite_clj.parser.core._STAR_delimiter_STAR_)){
return new cljs.core.Keyword(null,"delimiter","delimiter",-1766618000);
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentHashMap.fromArrays(["@","`","\"","#","'","(",")",":",";","[","{","]","}","^","~"],[new cljs.core.Keyword(null,"deref","deref",-145586795),new cljs.core.Keyword(null,"syntax-quote","syntax-quote",-1233164847),new cljs.core.Keyword(null,"string","string",-1989541586),new cljs.core.Keyword(null,"sharp","sharp",-83698408),new cljs.core.Keyword(null,"quote","quote",-262615245),new cljs.core.Keyword(null,"list","list",765357683),new cljs.core.Keyword(null,"unmatched","unmatched",1628955483),new cljs.core.Keyword(null,"keyword","keyword",811389747),new cljs.core.Keyword(null,"comment","comment",532206069),new cljs.core.Keyword(null,"vector","vector",1902966158),new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.Keyword(null,"unmatched","unmatched",1628955483),new cljs.core.Keyword(null,"unmatched","unmatched",1628955483),new cljs.core.Keyword(null,"meta","meta",1499536964),new cljs.core.Keyword(null,"unquote","unquote",1649741032)]),c,new cljs.core.Keyword(null,"token","token",-1211463215));

}
}
}
});
if((typeof rewrite_clj !== 'undefined') && (typeof rewrite_clj.parser !== 'undefined') && (typeof rewrite_clj.parser.core !== 'undefined') && (typeof rewrite_clj.parser.core.parse_next_STAR_ !== 'undefined')){
} else {
rewrite_clj.parser.core.parse_next_STAR_ = (function (){var method_table__5599__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var prefer_table__5600__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var method_cache__5601__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var cached_hierarchy__5602__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var hierarchy__5603__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),(function (){var fexpr__65977 = cljs.core.get_global_hierarchy;
return (fexpr__65977.cljs$core$IFn$_invoke$arity$0 ? fexpr__65977.cljs$core$IFn$_invoke$arity$0() : fexpr__65977.call(null));
})());
return (new cljs.core.MultiFn(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("rewrite-clj.parser.core","parse-next*"),cljs.core.comp.cljs$core$IFn$_invoke$arity$2(new cljs.core.Var(function(){return rewrite_clj.parser.core.dispatch;},new cljs.core.Symbol("rewrite-clj.parser.core","dispatch","rewrite-clj.parser.core/dispatch",-1962626312,null),cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"private","private",-558947994),new cljs.core.Keyword(null,"ns","ns",441598760),new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword(null,"file","file",-1269645878),new cljs.core.Keyword(null,"end-column","end-column",1425389514),new cljs.core.Keyword(null,"column","column",2078222095),new cljs.core.Keyword(null,"line","line",212345235),new cljs.core.Keyword(null,"end-line","end-line",1837326455),new cljs.core.Keyword(null,"arglists","arglists",1661989754),new cljs.core.Keyword(null,"doc","doc",1913296891),new cljs.core.Keyword(null,"test","test",577538877)],[true,cljs.core.with_meta(new cljs.core.Symbol(null,"rewrite-clj.parser.core","rewrite-clj.parser.core",1408837387,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"no-doc","no-doc",1559921891),true], null)),new cljs.core.Symbol(null,"dispatch","dispatch",-1335098760,null),"rewrite_clj/parser/core.cljc",16,1,28,28,cljs.core.list(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"c","c",-122660552,null)], null)),null,(cljs.core.truth_(rewrite_clj.parser.core.dispatch)?rewrite_clj.parser.core.dispatch.cljs$lang$test:null)])),rewrite_clj.reader.peek),new cljs.core.Keyword(null,"default","default",-1987822328),hierarchy__5603__auto__,method_table__5599__auto__,prefer_table__5600__auto__,method_cache__5601__auto__,cached_hierarchy__5602__auto__));
})();
}
rewrite_clj.parser.core.parse_next = (function rewrite_clj$parser$core$parse_next(reader){
return rewrite_clj.reader.read_with_meta(reader,rewrite_clj.parser.core.parse_next_STAR_);
});
rewrite_clj.parser.core.parse_delim = (function rewrite_clj$parser$core$parse_delim(reader,delimiter){
rewrite_clj.reader.ignore(reader);

return rewrite_clj.reader.read_repeatedly(reader,(function (p1__65983_SHARP_){
var _STAR_delimiter_STAR__orig_val__65985 = rewrite_clj.parser.core._STAR_delimiter_STAR_;
var _STAR_delimiter_STAR__temp_val__65986 = delimiter;
(rewrite_clj.parser.core._STAR_delimiter_STAR_ = _STAR_delimiter_STAR__temp_val__65986);

try{return rewrite_clj.parser.core.parse_next(p1__65983_SHARP_);
}finally {(rewrite_clj.parser.core._STAR_delimiter_STAR_ = _STAR_delimiter_STAR__orig_val__65985);
}}));
});
rewrite_clj.parser.core.parse_printables = (function rewrite_clj$parser$core$parse_printables(var_args){
var args__5732__auto__ = [];
var len__5726__auto___66038 = arguments.length;
var i__5727__auto___66039 = (0);
while(true){
if((i__5727__auto___66039 < len__5726__auto___66038)){
args__5732__auto__.push((arguments[i__5727__auto___66039]));

var G__66040 = (i__5727__auto___66039 + (1));
i__5727__auto___66039 = G__66040;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((3) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((3)),(0),null)):null);
return rewrite_clj.parser.core.parse_printables.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),argseq__5733__auto__);
});

(rewrite_clj.parser.core.parse_printables.cljs$core$IFn$_invoke$arity$variadic = (function (reader,node_tag,n,p__66000){
var vec__66001 = p__66000;
var ignore_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__66001,(0),null);
if(cljs.core.truth_(ignore_QMARK_)){
rewrite_clj.reader.ignore(reader);
} else {
}

return rewrite_clj.reader.read_n(reader,node_tag,rewrite_clj.parser.core.parse_next,cljs.core.complement(rewrite_clj.node.protocols.printable_only_QMARK_),n);
}));

(rewrite_clj.parser.core.parse_printables.cljs$lang$maxFixedArity = (3));

/** @this {Function} */
(rewrite_clj.parser.core.parse_printables.cljs$lang$applyTo = (function (seq65991){
var G__65992 = cljs.core.first(seq65991);
var seq65991__$1 = cljs.core.next(seq65991);
var G__65993 = cljs.core.first(seq65991__$1);
var seq65991__$2 = cljs.core.next(seq65991__$1);
var G__65994 = cljs.core.first(seq65991__$2);
var seq65991__$3 = cljs.core.next(seq65991__$2);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__65992,G__65993,G__65994,seq65991__$3);
}));

rewrite_clj.parser.core.parse_next_STAR_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"token","token",-1211463215),(function (reader){
return rewrite_clj.parser.token.parse_token(reader);
}));
rewrite_clj.parser.core.parse_next_STAR_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"delimiter","delimiter",-1766618000),(function (reader){
return rewrite_clj.reader.ignore(reader);
}));
rewrite_clj.parser.core.parse_next_STAR_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"unmatched","unmatched",1628955483),(function (reader){
return rewrite_clj.reader.throw_reader.cljs$core$IFn$_invoke$arity$variadic(reader,"Unmatched delimiter: %s",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rewrite_clj.reader.peek(reader)], 0));
}));
rewrite_clj.parser.core.parse_next_STAR_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"eof","eof",-489063237),(function (reader){
if(cljs.core.truth_(rewrite_clj.parser.core._STAR_delimiter_STAR_)){
return rewrite_clj.reader.throw_reader(reader,"Unexpected EOF.");
} else {
return null;
}
}));
rewrite_clj.parser.core.parse_next_STAR_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"whitespace","whitespace",-1340035483),(function (reader){
return rewrite_clj.parser.whitespace.parse_whitespace(reader);
}));
rewrite_clj.parser.core.parse_next_STAR_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"comment","comment",532206069),(function (reader){
rewrite_clj.reader.ignore(reader);

return rewrite_clj.node.comment.comment_node.cljs$core$IFn$_invoke$arity$2(";",rewrite_clj.reader.read_include_linebreak(reader));
}));
rewrite_clj.parser.core.parse_next_STAR_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"keyword","keyword",811389747),(function (reader){
return rewrite_clj.parser.keyword.parse_keyword(reader);
}));
rewrite_clj.parser.core.parse_next_STAR_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"string","string",-1989541586),(function (reader){
return rewrite_clj.parser.string.parse_string(reader);
}));
rewrite_clj.parser.core.parse_next_STAR_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"meta","meta",1499536964),(function (reader){
rewrite_clj.reader.ignore(reader);

return rewrite_clj.node.meta.meta_node.cljs$core$IFn$_invoke$arity$1(rewrite_clj.parser.core.parse_printables(reader,new cljs.core.Keyword(null,"meta","meta",1499536964),(2)));
}));
rewrite_clj.parser.core.read_symbolic_value = (function rewrite_clj$parser$core$read_symbolic_value(reader){
rewrite_clj.reader.unread(reader,"#");

return rewrite_clj.parser.token.parse_token(reader);
});
rewrite_clj.parser.core.parse_shebang_comment = (function rewrite_clj$parser$core$parse_shebang_comment(reader){
rewrite_clj.reader.ignore(reader);

return rewrite_clj.node.comment.comment_node.cljs$core$IFn$_invoke$arity$2("#!",rewrite_clj.reader.read_include_linebreak(reader));
});
rewrite_clj.parser.core.parse_next_STAR_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"sharp","sharp",-83698408),(function (reader){
rewrite_clj.reader.ignore(reader);

var G__66022 = rewrite_clj.reader.peek(reader);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(null,G__66022)){
return rewrite_clj.reader.throw_reader(reader,"Unexpected EOF.");
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("!",G__66022)){
return rewrite_clj.parser.core.parse_shebang_comment(reader);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("\"",G__66022)){
return rewrite_clj.node.regex.regex_node(rewrite_clj.parser.string.parse_regex(reader));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("#",G__66022)){
return rewrite_clj.parser.core.read_symbolic_value(reader);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("'",G__66022)){
return rewrite_clj.node.reader_macro.var_node(rewrite_clj.parser.core.parse_printables.cljs$core$IFn$_invoke$arity$variadic(reader,new cljs.core.Keyword(null,"var","var",-769682797),(1),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([true], 0)));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("(",G__66022)){
return rewrite_clj.node.fn.fn_node(rewrite_clj.parser.core.parse_delim(reader,")"));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(":",G__66022)){
return rewrite_clj.parser.namespaced_map.parse_namespaced_map(reader,rewrite_clj.parser.core.parse_next);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("{",G__66022)){
return rewrite_clj.node.seq.set_node(rewrite_clj.parser.core.parse_delim(reader,"}"));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("=",G__66022)){
return rewrite_clj.node.reader_macro.eval_node(rewrite_clj.parser.core.parse_printables.cljs$core$IFn$_invoke$arity$variadic(reader,new cljs.core.Keyword(null,"eval","eval",-1103567905),(1),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([true], 0)));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("^",G__66022)){
return rewrite_clj.node.meta.raw_meta_node.cljs$core$IFn$_invoke$arity$1(rewrite_clj.parser.core.parse_printables.cljs$core$IFn$_invoke$arity$variadic(reader,new cljs.core.Keyword(null,"meta","meta",1499536964),(2),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([true], 0)));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("?",G__66022)){
rewrite_clj.reader.next(reader);

return rewrite_clj.node.reader_macro.reader_macro_node.cljs$core$IFn$_invoke$arity$1((function (){var read1 = (function (){
return rewrite_clj.parser.core.parse_printables(reader,new cljs.core.Keyword(null,"reader-macro","reader-macro",750056422),(1));
});
return cljs.core.cons((function (){var G__66026 = rewrite_clj.reader.peek(reader);
switch (G__66026) {
case "(":
return rewrite_clj.node.token.token_node.cljs$core$IFn$_invoke$arity$1(cljs.core.symbol.cljs$core$IFn$_invoke$arity$1("?"));

break;
case "@":
rewrite_clj.reader.next(reader);

return rewrite_clj.node.token.token_node.cljs$core$IFn$_invoke$arity$1(cljs.core.symbol.cljs$core$IFn$_invoke$arity$1("?@"));

break;
default:
rewrite_clj.reader.unread(reader,"?");

return cljs.core.first(read1());

}
})(),read1());
})());
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("_",G__66022)){
return rewrite_clj.node.uneval.uneval_node(rewrite_clj.parser.core.parse_printables.cljs$core$IFn$_invoke$arity$variadic(reader,new cljs.core.Keyword(null,"uneval","uneval",1932037707),(1),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([true], 0)));
} else {
return rewrite_clj.node.reader_macro.reader_macro_node.cljs$core$IFn$_invoke$arity$1(rewrite_clj.parser.core.parse_printables(reader,new cljs.core.Keyword(null,"reader-macro","reader-macro",750056422),(2)));

}
}
}
}
}
}
}
}
}
}
}
}
}));
rewrite_clj.parser.core.parse_next_STAR_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"deref","deref",-145586795),(function (reader){
return rewrite_clj.node.reader_macro.deref_node(rewrite_clj.parser.core.parse_printables.cljs$core$IFn$_invoke$arity$variadic(reader,new cljs.core.Keyword(null,"deref","deref",-145586795),(1),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([true], 0)));
}));
rewrite_clj.parser.core.parse_next_STAR_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"quote","quote",-262615245),(function (reader){
return rewrite_clj.node.quote.quote_node(rewrite_clj.parser.core.parse_printables.cljs$core$IFn$_invoke$arity$variadic(reader,new cljs.core.Keyword(null,"quote","quote",-262615245),(1),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([true], 0)));
}));
rewrite_clj.parser.core.parse_next_STAR_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"syntax-quote","syntax-quote",-1233164847),(function (reader){
return rewrite_clj.node.quote.syntax_quote_node(rewrite_clj.parser.core.parse_printables.cljs$core$IFn$_invoke$arity$variadic(reader,new cljs.core.Keyword(null,"syntax-quote","syntax-quote",-1233164847),(1),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([true], 0)));
}));
rewrite_clj.parser.core.parse_next_STAR_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"unquote","unquote",1649741032),(function (reader){
rewrite_clj.reader.ignore(reader);

var c = rewrite_clj.reader.peek(reader);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(c,"@")){
return rewrite_clj.node.quote.unquote_splicing_node(rewrite_clj.parser.core.parse_printables.cljs$core$IFn$_invoke$arity$variadic(reader,new cljs.core.Keyword(null,"unquote","unquote",1649741032),(1),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([true], 0)));
} else {
return rewrite_clj.node.quote.unquote_node(rewrite_clj.parser.core.parse_printables(reader,new cljs.core.Keyword(null,"unquote","unquote",1649741032),(1)));
}
}));
rewrite_clj.parser.core.parse_next_STAR_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"list","list",765357683),(function (reader){
return rewrite_clj.node.seq.list_node(rewrite_clj.parser.core.parse_delim(reader,")"));
}));
rewrite_clj.parser.core.parse_next_STAR_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"vector","vector",1902966158),(function (reader){
return rewrite_clj.node.seq.vector_node(rewrite_clj.parser.core.parse_delim(reader,"]"));
}));
rewrite_clj.parser.core.parse_next_STAR_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"map","map",1371690461),(function (reader){
return rewrite_clj.node.seq.map_node(rewrite_clj.parser.core.parse_delim(reader,"}"));
}));

//# sourceMappingURL=rewrite_clj.parser.core.js.map
