goog.provide('frontend.handler.export$.text');
/**
 * also consider (get-in *state* [:export-options :indent-style])
 */
frontend.handler.export$.text.indent_with_2_spaces = (function frontend$handler$export$text$indent_with_2_spaces(level){
var indent_style = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"export-options","export-options",672321679),new cljs.core.Keyword(null,"indent-style","indent-style",855468755)], null));
var G__64170 = indent_style;
switch (G__64170) {
case "dashes":
return frontend.handler.export$.common.indent(level,(2));

break;
case "spaces":
case "no-indent":
return frontend.handler.export$.common.indent(level,(0));

break;
default:
throw (new Error(["Assert failed: ",cljs.core.print_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["unknown indent-style:",indent_style], 0)),"\n","false"].join('')));


}
});

frontend.handler.export$.text.block_heading = (function frontend$handler$export$text$block_heading(p__64171){
var map__64178 = p__64171;
var map__64178__$1 = cljs.core.__destructure_map(map__64178);
var _meta = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64178__$1,new cljs.core.Keyword(null,"_meta","_meta",937543236));
var marker = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64178__$1,new cljs.core.Keyword(null,"marker","marker",865118313));
var _anchor = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64178__$1,new cljs.core.Keyword(null,"_anchor","_anchor",-1041309458));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64178__$1,new cljs.core.Keyword(null,"title","title",636505583));
var size = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64178__$1,new cljs.core.Keyword(null,"size","size",1098693007));
var level = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64178__$1,new cljs.core.Keyword(null,"level","level",1290497552));
var priority = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64178__$1,new cljs.core.Keyword(null,"priority","priority",1431093715));
var _tags = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64178__$1,new cljs.core.Keyword(null,"_tags","_tags",58828915));
var _numbering = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64178__$1,new cljs.core.Keyword(null,"_numbering","_numbering",1825467892));
var _unordered = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64178__$1,new cljs.core.Keyword(null,"_unordered","_unordered",1249595382));
var indent_style = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"export-options","export-options",672321679),new cljs.core.Keyword(null,"indent-style","indent-style",855468755)], null));
var priority_STAR_ = (function (){var and__5000__auto__ = priority;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.handler.export$.common.priority__GT_string(priority)], 0));
} else {
return and__5000__auto__;
}
})();
var heading_STAR_ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(indent_style,"dashes"))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.indent((level - (1)),(0)),frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["-"], 0))], null):new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.indent((level - (1)),(0))], null));
var size_STAR_ = (function (){var and__5000__auto__ = size;
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.space,frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core.str,cljs.core.repeat.cljs$core$IFn$_invoke$arity$2(size,"#"))], 0))], null);
} else {
return and__5000__auto__;
}
})();
var marker_STAR_ = (function (){var and__5000__auto__ = marker;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([marker], 0));
} else {
return and__5000__auto__;
}
})();
(frontend.handler.export$.common._STAR_state_STAR_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.Keyword(null,"current-level","current-level",-11925890),level));

var simple_asts = cljs.core.vec(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"export-options","export-options",672321679),new cljs.core.Keyword(null,"newline-after-block","newline-after-block",137428571)], null));
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"newline-after-block","newline-after-block",137428571),new cljs.core.Keyword(null,"current-block-is-first-heading-block?","current-block-is-first-heading-block?",2033274655)], null)));
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.newline_STAR_((2))], null):null),heading_STAR_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([size_STAR_,new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.space,marker_STAR_,frontend.handler.export$.common.space,priority_STAR_,frontend.handler.export$.common.space], null),cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(frontend.handler.export$.text.inline_ast__GT_simple_ast,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([title], 0))),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.newline_STAR_((1))], null)], 0)))));
(frontend.handler.export$.common._STAR_state_STAR_ = cljs.core.assoc_in(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"newline-after-block","newline-after-block",137428571),new cljs.core.Keyword(null,"current-block-is-first-heading-block?","current-block-is-first-heading-block?",2033274655)], null),false));

return simple_asts;
});
frontend.handler.export$.text.block_list_item = (function frontend$handler$export$text$block_list_item(p__64212){
var map__64213 = p__64212;
var map__64213__$1 = cljs.core.__destructure_map(map__64213);
var content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64213__$1,new cljs.core.Keyword(null,"content","content",15833224));
var items = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64213__$1,new cljs.core.Keyword(null,"items","items",1031954938));
var number = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64213__$1,new cljs.core.Keyword(null,"number","number",1570378438));
var _name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64213__$1,new cljs.core.Keyword(null,"_name","_name",-1979660747));
var checkbox = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64213__$1,new cljs.core.Keyword(null,"checkbox","checkbox",1612615655));
var content_STAR_ = cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(frontend.handler.export$.text.block_ast__GT_simple_ast,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([content], 0)));
var number_STAR_ = frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(cljs.core.truth_(number)?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(number),". "].join(''):"* ")], 0));
var checkbox_STAR_ = frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(((!((checkbox == null))))?((cljs.core.boolean$(checkbox))?"[X]":"[ ]"):"")], 0));
var current_level = cljs.core.get.cljs$core$IFn$_invoke$arity$3(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.Keyword(null,"current-level","current-level",-11925890),(1));
var indent_SINGLEQUOTE_ = (((current_level > (1)))?frontend.handler.export$.common.indent((current_level - (1)),(0)):null);
var items_STAR_ = (frontend.handler.export$.text.block_list.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.export$.text.block_list.cljs$core$IFn$_invoke$arity$3(items,new cljs.core.Keyword(null,"in-list?","in-list?",-632658365),true) : frontend.handler.export$.text.block_list.call(null,items,new cljs.core.Keyword(null,"in-list?","in-list?",-632658365),true));
return cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [indent_SINGLEQUOTE_,number_STAR_,checkbox_STAR_,frontend.handler.export$.common.space], null),content_STAR_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.newline_STAR_((1))], null),items_STAR_,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.newline_STAR_((1))], null)], 0)));
});
frontend.handler.export$.text.block_list = (function frontend$handler$export$text$block_list(var_args){
var args__5732__auto__ = [];
var len__5726__auto___64412 = arguments.length;
var i__5727__auto___64414 = (0);
while(true){
if((i__5727__auto___64414 < len__5726__auto___64412)){
args__5732__auto__.push((arguments[i__5727__auto___64414]));

var G__64416 = (i__5727__auto___64414 + (1));
i__5727__auto___64414 = G__64416;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.handler.export$.text.block_list.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.handler.export$.text.block_list.cljs$core$IFn$_invoke$arity$variadic = (function (l,p__64217){
var map__64218 = p__64217;
var map__64218__$1 = cljs.core.__destructure_map(map__64218);
var in_list_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64218__$1,new cljs.core.Keyword(null,"in-list?","in-list?",-632658365));
var _STAR_state_STAR__orig_val__64219 = frontend.handler.export$.common._STAR_state_STAR_;
var _STAR_state_STAR__temp_val__64220 = cljs.core.update.cljs$core$IFn$_invoke$arity$3(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.Keyword(null,"current-level","current-level",-11925890),cljs.core.inc);
(frontend.handler.export$.common._STAR_state_STAR_ = _STAR_state_STAR__temp_val__64220);

try{return cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(frontend.handler.export$.text.block_list_item,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([l], 0))),(((((cljs.core.count(l) > (0))) && (cljs.core.not(in_list_QMARK_))))?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.newline_STAR_((2))], null):null)));
}finally {(frontend.handler.export$.common._STAR_state_STAR_ = _STAR_state_STAR__orig_val__64219);
}}));

(frontend.handler.export$.text.block_list.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.handler.export$.text.block_list.cljs$lang$applyTo = (function (seq64215){
var G__64216 = cljs.core.first(seq64215);
var seq64215__$1 = cljs.core.next(seq64215);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__64216,seq64215__$1);
}));

frontend.handler.export$.text.block_property_drawer = (function frontend$handler$export$text$block_property_drawer(properties){
if(cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"export-options","export-options",672321679),new cljs.core.Keyword(null,"remove-properties?","remove-properties?",1053410556)], null)))){
return null;
} else {
var level = (cljs.core.get.cljs$core$IFn$_invoke$arity$3(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.Keyword(null,"current-level","current-level",-11925890),(1)) - (1));
var indent_SINGLEQUOTE_ = frontend.handler.export$.text.indent_with_2_spaces(level);
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (r,p__64224){
var vec__64225 = p__64224;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64225,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64225,(1),null);
return cljs.core.conj.cljs$core$IFn$_invoke$arity$variadic(r,indent_SINGLEQUOTE_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([k,"::"], 0)),frontend.handler.export$.common.space,frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([v], 0)),frontend.handler.export$.common.newline_STAR_((1))], 0));
}),cljs.core.PersistentVector.EMPTY,properties);
}
});
frontend.handler.export$.text.block_example = (function frontend$handler$export$text$block_example(l){
var level = (cljs.core.get.cljs$core$IFn$_invoke$arity$3(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.Keyword(null,"current-level","current-level",-11925890),(1)) - (1));
return cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (line){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.text.indent_with_2_spaces(level),frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["    "], 0)),frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([line], 0)),frontend.handler.export$.common.newline_STAR_((1))], null);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([l], 0)));
});
frontend.handler.export$.text.remove_max_prefix_spaces = (function frontend$handler$export$text$remove_max_prefix_spaces(lines){
var common_prefix_spaces = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (r,line){
if(clojure.string.blank_QMARK_(line)){
return r;
} else {
var leading_spaces = cljs.core.re_find(/^\s+/,line);
if((r == null)){
return leading_spaces;
} else {
if(clojure.string.starts_with_QMARK_(r,leading_spaces)){
return leading_spaces;
} else {
return r;
}
}
}
}),null,lines);
var pattern = cljs.core.re_pattern(["^",cljs.core.str.cljs$core$IFn$_invoke$arity$1(common_prefix_spaces)].join(''));
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (line){
return clojure.string.replace_first(line,pattern,"");
}),lines);
});
frontend.handler.export$.text.block_src = (function frontend$handler$export$text$block_src(p__64228){
var map__64229 = p__64228;
var map__64229__$1 = cljs.core.__destructure_map(map__64229);
var lines = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64229__$1,new cljs.core.Keyword(null,"lines","lines",-700165781));
var language = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64229__$1,new cljs.core.Keyword(null,"language","language",-1591107564));
var level = (cljs.core.get.cljs$core$IFn$_invoke$arity$3(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.Keyword(null,"current-level","current-level",-11925890),(1)) - (1));
var lines_STAR_ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("no-indent",cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"export-options","export-options",672321679),new cljs.core.Keyword(null,"indent-style","indent-style",855468755)], null))))?frontend.handler.export$.text.remove_max_prefix_spaces(lines):lines);
return cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.text.indent_with_2_spaces(level),frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["```"], 0))], null),(cljs.core.truth_(language)?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([language], 0))], null):null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.newline_STAR_((1))], null),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common.raw_text,lines_STAR_),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.text.indent_with_2_spaces(level),frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["```"], 0)),frontend.handler.export$.common.newline_STAR_((1))], null)], 0)));
});
frontend.handler.export$.text.block_quote = (function frontend$handler$export$text$block_quote(block_coll){
var level = (cljs.core.get.cljs$core$IFn$_invoke$arity$3(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.Keyword(null,"current-level","current-level",-11925890),(1)) - (1));
var _STAR_state_STAR__orig_val__64230 = frontend.handler.export$.common._STAR_state_STAR_;
var _STAR_state_STAR__temp_val__64231 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.Keyword(null,"indent-after-break-line?","indent-after-break-line?",-736379041),true);
(frontend.handler.export$.common._STAR_state_STAR_ = _STAR_state_STAR__temp_val__64231);

try{return cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (block){
var block_simple_ast = (frontend.handler.export$.text.block_ast__GT_simple_ast.cljs$core$IFn$_invoke$arity$1 ? frontend.handler.export$.text.block_ast__GT_simple_ast.cljs$core$IFn$_invoke$arity$1(block) : frontend.handler.export$.text.block_ast__GT_simple_ast.call(null,block));
if(cljs.core.seq(block_simple_ast)){
return cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.text.indent_with_2_spaces(level),frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([">"], 0)),frontend.handler.export$.common.space], null),block_simple_ast));
} else {
return null;
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([block_coll], 0))),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.newline_STAR_((2))], null)));
}finally {(frontend.handler.export$.common._STAR_state_STAR_ = _STAR_state_STAR__orig_val__64230);
}});
frontend.handler.export$.text.block_latex_fragment = (function frontend$handler$export$text$block_latex_fragment(ast_content){
return (frontend.handler.export$.text.inline_latex_fragment.cljs$core$IFn$_invoke$arity$1 ? frontend.handler.export$.text.inline_latex_fragment.cljs$core$IFn$_invoke$arity$1(ast_content) : frontend.handler.export$.text.inline_latex_fragment.call(null,ast_content));
});
frontend.handler.export$.text.block_latex_env = (function frontend$handler$export$text$block_latex_env(p__64233){
var vec__64234 = p__64233;
var name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64234,(0),null);
var options = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64234,(1),null);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64234,(2),null);
var level = (cljs.core.get.cljs$core$IFn$_invoke$arity$3(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.Keyword(null,"current-level","current-level",-11925890),(1)) - (1));
return new cljs.core.PersistentVector(null, 9, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.text.indent_with_2_spaces(level),frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["\\begin{",name,"}",options], 0)),frontend.handler.export$.common.newline_STAR_((1)),frontend.handler.export$.text.indent_with_2_spaces(level),frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([content], 0)),frontend.handler.export$.common.newline_STAR_((1)),frontend.handler.export$.text.indent_with_2_spaces(level),frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["\\end{",name,"}"], 0)),frontend.handler.export$.common.newline_STAR_((1))], null);
});
frontend.handler.export$.text.block_displayed_math = (function frontend$handler$export$text$block_displayed_math(ast_content){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.space,frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["$$",ast_content,"$$"], 0)),frontend.handler.export$.common.space], null);
});
frontend.handler.export$.text.block_drawer = (function frontend$handler$export$text$block_drawer(p__64238){
var vec__64239 = p__64238;
var name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64239,(0),null);
var lines = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64239,(1),null);
var level = (cljs.core.get.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.Keyword(null,"current-level","current-level",-11925890)) - (1));
return cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([":",name,":"], 0)),frontend.handler.export$.common.newline_STAR_((1))], null),cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (line){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.text.indent_with_2_spaces(level),frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([line], 0))], null);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([lines], 0))),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.newline_STAR_((1)),frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([":END:"], 0)),frontend.handler.export$.common.newline_STAR_((1))], null)], 0)));
});
frontend.handler.export$.text.block_footnote_definition = (function frontend$handler$export$text$block_footnote_definition(p__64242){
var vec__64243 = p__64242;
var name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64243,(0),null);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64243,(1),null);
return cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["[^",name,"]:"], 0)),frontend.handler.export$.common.space], null),cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(frontend.handler.export$.text.inline_ast__GT_simple_ast,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([content], 0))),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.newline_STAR_((1))], null)], 0)));
});
frontend.handler.export$.text.block_horizontal_rule = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.newline_STAR_((1)),frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["---"], 0)),frontend.handler.export$.common.newline_STAR_((1))], null);
frontend.handler.export$.text.block_table = (function frontend$handler$export$text$block_table(p__64246){
var map__64247 = p__64246;
var map__64247__$1 = cljs.core.__destructure_map(map__64247);
var header = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64247__$1,new cljs.core.Keyword(null,"header","header",119441134));
var groups = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64247__$1,new cljs.core.Keyword(null,"groups","groups",-136896102));
var level = (cljs.core.get.cljs$core$IFn$_invoke$arity$3(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.Keyword(null,"current-level","current-level",-11925890),(1)) - (1));
var sep_line = frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["|",clojure.string.join.cljs$core$IFn$_invoke$arity$2("|",cljs.core.repeat.cljs$core$IFn$_invoke$arity$2(cljs.core.count(header),"---")),"|"], 0));
var header_line = cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (h){
return cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.space,frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["|"], 0)),frontend.handler.export$.common.space], null),cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(frontend.handler.export$.text.inline_ast__GT_simple_ast,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([h], 0)))));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([header], 0))),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.space,frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["|"], 0))], null)));
var group_lines = cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (group){
return cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (row){
return cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.text.indent_with_2_spaces(level)], null),cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (col){
return cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["|"], 0)),frontend.handler.export$.common.space], null),cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(frontend.handler.export$.text.inline_ast__GT_simple_ast,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([col], 0))),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.space], null)], 0)));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([row], 0))),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["|"], 0)),frontend.handler.export$.common.newline_STAR_((1))], null)], 0)));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([group], 0)));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([groups], 0)));
return cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.newline_STAR_((1)),frontend.handler.export$.text.indent_with_2_spaces(level)], null),((cljs.core.seq(header))?header_line:null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([((cljs.core.seq(header))?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.newline_STAR_((1)),frontend.handler.export$.text.indent_with_2_spaces(level),sep_line,frontend.handler.export$.common.newline_STAR_((1))], null):null),group_lines], 0)));
});
frontend.handler.export$.text.block_comment = (function frontend$handler$export$text$block_comment(s){
var level = (cljs.core.get.cljs$core$IFn$_invoke$arity$3(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.Keyword(null,"current-level","current-level",-11925890),(1)) - (1));
return new cljs.core.PersistentVector(null, 9, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.text.indent_with_2_spaces(level),frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["<!---"], 0)),frontend.handler.export$.common.newline_STAR_((1)),frontend.handler.export$.text.indent_with_2_spaces(level),frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([s], 0)),frontend.handler.export$.common.newline_STAR_((1)),frontend.handler.export$.text.indent_with_2_spaces(level),frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["-->"], 0)),frontend.handler.export$.common.newline_STAR_((1))], null);
});
frontend.handler.export$.text.block_raw_html = (function frontend$handler$export$text$block_raw_html(s){
var level = (cljs.core.get.cljs$core$IFn$_invoke$arity$3(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.Keyword(null,"current-level","current-level",-11925890),(1)) - (1));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.text.indent_with_2_spaces(level),frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([s], 0)),frontend.handler.export$.common.newline_STAR_((1))], null);
});
frontend.handler.export$.text.block_hiccup = (function frontend$handler$export$text$block_hiccup(s){
var level = (cljs.core.get.cljs$core$IFn$_invoke$arity$3(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.Keyword(null,"current-level","current-level",-11925890),(1)) - (1));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.text.indent_with_2_spaces(level),frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([s], 0)),frontend.handler.export$.common.space], null);
});
frontend.handler.export$.text.inline_link = (function frontend$handler$export$text$inline_link(p__64262){
var map__64263 = p__64262;
var map__64263__$1 = cljs.core.__destructure_map(map__64263);
var full_text = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64263__$1,new cljs.core.Keyword(null,"full_text","full_text",1634289075));
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([full_text], 0))], null);
});
frontend.handler.export$.text.inline_nested_link = (function frontend$handler$export$text$inline_nested_link(p__64264){
var map__64265 = p__64264;
var map__64265__$1 = cljs.core.__destructure_map(map__64265);
var content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64265__$1,new cljs.core.Keyword(null,"content","content",15833224));
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([content], 0))], null);
});
frontend.handler.export$.text.inline_subscript = (function frontend$handler$export$text$inline_subscript(inline_coll){
return cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["_{"], 0))], null),cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (inline){
return cljs.core.cons(frontend.handler.export$.common.space,(frontend.handler.export$.text.inline_ast__GT_simple_ast.cljs$core$IFn$_invoke$arity$1 ? frontend.handler.export$.text.inline_ast__GT_simple_ast.cljs$core$IFn$_invoke$arity$1(inline) : frontend.handler.export$.text.inline_ast__GT_simple_ast.call(null,inline)));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([inline_coll], 0))),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["}"], 0))], null)], 0)));
});
frontend.handler.export$.text.inline_superscript = (function frontend$handler$export$text$inline_superscript(inline_coll){
return cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["^{"], 0))], null),cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (inline){
return cljs.core.cons(frontend.handler.export$.common.space,(frontend.handler.export$.text.inline_ast__GT_simple_ast.cljs$core$IFn$_invoke$arity$1 ? frontend.handler.export$.text.inline_ast__GT_simple_ast.cljs$core$IFn$_invoke$arity$1(inline) : frontend.handler.export$.text.inline_ast__GT_simple_ast.call(null,inline)));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([inline_coll], 0))),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["}"], 0))], null)], 0)));
});
frontend.handler.export$.text.inline_footnote_reference = (function frontend$handler$export$text$inline_footnote_reference(p__64266){
var map__64267 = p__64266;
var map__64267__$1 = cljs.core.__destructure_map(map__64267);
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64267__$1,new cljs.core.Keyword(null,"name","name",1843675177));
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["[",name,"]"], 0))], null);
});
frontend.handler.export$.text.inline_cookie = (function frontend$handler$export$text$inline_cookie(ast_content){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(function (){var G__64268 = cljs.core.first(ast_content);
switch (G__64268) {
case "Absolute":
var vec__64269 = ast_content;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64269,(0),null);
var current = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64269,(1),null);
var total = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64269,(2),null);
return ["[",cljs.core.str.cljs$core$IFn$_invoke$arity$1(current),"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(total),"]"].join('');

break;
case "Percent":
return ["[",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.second(ast_content)),"%]"].join('');

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__64268)].join('')));

}
})()], 0))], null);
});
frontend.handler.export$.text.inline_latex_fragment = (function frontend$handler$export$text$inline_latex_fragment(ast_content){
var vec__64273 = ast_content;
var type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64273,(0),null);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64273,(1),null);
var wrapper = (function (){var G__64276 = type;
switch (G__64276) {
case "Inline":
return "$";

break;
case "Displayed":
return "$$";

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__64276)].join('')));

}
})();
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.space,frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([[cljs.core.str.cljs$core$IFn$_invoke$arity$1(wrapper),cljs.core.str.cljs$core$IFn$_invoke$arity$1(content),cljs.core.str.cljs$core$IFn$_invoke$arity$1(wrapper)].join('')], 0)),frontend.handler.export$.common.space], null);
});
frontend.handler.export$.text.inline_macro = (function frontend$handler$export$text$inline_macro(p__64277){
var map__64278 = p__64277;
var map__64278__$1 = cljs.core.__destructure_map(map__64278);
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64278__$1,new cljs.core.Keyword(null,"name","name",1843675177));
var arguments$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64278__$1,new cljs.core.Keyword(null,"arguments","arguments",-1182834456));
return (new cljs.core.PersistentVector(null,1,(5),cljs.core.PersistentVector.EMPTY_NODE,[frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(name,"cloze"))?clojure.string.join.cljs$core$IFn$_invoke$arity$2(",",arguments$):(function (){var l = (function (){var G__64279 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["{{",name], null);
var G__64279__$1 = (((cljs.core.count(arguments$) > (0)))?cljs.core.conj.cljs$core$IFn$_invoke$arity$variadic(G__64279,"(",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([clojure.string.join.cljs$core$IFn$_invoke$arity$2(",",arguments$),")"], 0)):G__64279);
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__64279__$1,"}}");

})();
return clojure.string.join.cljs$core$IFn$_invoke$arity$1(l);
})())], 0))],null));
});
frontend.handler.export$.text.inline_entity = (function frontend$handler$export$text$inline_entity(p__64280){
var map__64281 = p__64280;
var map__64281__$1 = cljs.core.__destructure_map(map__64281);
var unicode = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64281__$1,new cljs.core.Keyword(null,"unicode","unicode",-542572710));
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([unicode], 0))], null);
});
frontend.handler.export$.text.inline_timestamp = (function frontend$handler$export$text$inline_timestamp(ast_content){
var vec__64282 = ast_content;
var type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64282,(0),null);
var timestamp_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64282,(1),null);
return (new cljs.core.PersistentVector(null,1,(5),cljs.core.PersistentVector.EMPTY_NODE,[frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([clojure.string.join.cljs$core$IFn$_invoke$arity$1((function (){var G__64285 = type;
switch (G__64285) {
case "Scheduled":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["SCHEDULED: ",frontend.handler.export$.common.timestamp_to_string(timestamp_content)], null);

break;
case "Deadline":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["DEADLINE: ",frontend.handler.export$.common.timestamp_to_string(timestamp_content)], null);

break;
case "Date":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.timestamp_to_string(timestamp_content)], null);

break;
case "Closed":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["CLOSED: ",frontend.handler.export$.common.timestamp_to_string(timestamp_content)], null);

break;
case "Clock":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["CLOCK: ",frontend.handler.export$.common.timestamp_to_string(cljs.core.second(timestamp_content))], null);

break;
case "Range":
var map__64286 = timestamp_content;
var map__64286__$1 = cljs.core.__destructure_map(map__64286);
var start = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64286__$1,new cljs.core.Keyword(null,"start","start",-355208981));
var stop = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64286__$1,new cljs.core.Keyword(null,"stop","stop",-2140911342));
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.handler.export$.common.timestamp_to_string(start)),"--",cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.handler.export$.common.timestamp_to_string(stop))].join('')], null);

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__64285)].join('')));

}
})())], 0))],null));
});
frontend.handler.export$.text.inline_email = (function frontend$handler$export$text$inline_email(p__64287){
var map__64288 = p__64287;
var map__64288__$1 = cljs.core.__destructure_map(map__64288);
var local_part = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64288__$1,new cljs.core.Keyword(null,"local_part","local_part",-1705904558));
var domain = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64288__$1,new cljs.core.Keyword(null,"domain","domain",1847214937));
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([["<",cljs.core.str.cljs$core$IFn$_invoke$arity$1(local_part),"@",cljs.core.str.cljs$core$IFn$_invoke$arity$1(domain),">"].join('')], 0))], null);
});
frontend.handler.export$.text.emphasis_wrap_with = (function frontend$handler$export$text$emphasis_wrap_with(inline_coll,em_symbol){
var _STAR_state_STAR__orig_val__64289 = frontend.handler.export$.common._STAR_state_STAR_;
var _STAR_state_STAR__temp_val__64290 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.Keyword(null,"outside-em-symbol","outside-em-symbol",478063381),cljs.core.first(em_symbol));
(frontend.handler.export$.common._STAR_state_STAR_ = _STAR_state_STAR__temp_val__64290);

try{return cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([em_symbol], 0))], null),cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(frontend.handler.export$.text.inline_ast__GT_simple_ast,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([inline_coll], 0))),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([em_symbol], 0))], null)], 0)));
}finally {(frontend.handler.export$.common._STAR_state_STAR_ = _STAR_state_STAR__orig_val__64289);
}});
frontend.handler.export$.text.inline_emphasis = (function frontend$handler$export$text$inline_emphasis(emphasis){
var vec__64291 = emphasis;
var vec__64294 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64291,(0),null);
var type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64294,(0),null);
var inline_coll = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64291,(1),null);
var outside_em_symbol = new cljs.core.Keyword(null,"outside-em-symbol","outside-em-symbol",478063381).cljs$core$IFn$_invoke$arity$1(frontend.handler.export$.common._STAR_state_STAR_);
var G__64297 = type;
switch (G__64297) {
case "Bold":
return frontend.handler.export$.text.emphasis_wrap_with(inline_coll,((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(outside_em_symbol,"*"))?"__":"**"));

break;
case "Italic":
return frontend.handler.export$.text.emphasis_wrap_with(inline_coll,((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(outside_em_symbol,"*"))?"_":"*"));

break;
case "Underline":
var _STAR_state_STAR__orig_val__64299 = frontend.handler.export$.common._STAR_state_STAR_;
var _STAR_state_STAR__temp_val__64300 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.Keyword(null,"outside-em-symbol","outside-em-symbol",478063381),outside_em_symbol);
(frontend.handler.export$.common._STAR_state_STAR_ = _STAR_state_STAR__temp_val__64300);

try{return cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (inline){
return cljs.core.cons(frontend.handler.export$.common.space,(frontend.handler.export$.text.inline_ast__GT_simple_ast.cljs$core$IFn$_invoke$arity$1 ? frontend.handler.export$.text.inline_ast__GT_simple_ast.cljs$core$IFn$_invoke$arity$1(inline) : frontend.handler.export$.text.inline_ast__GT_simple_ast.call(null,inline)));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([inline_coll], 0)));
}finally {(frontend.handler.export$.common._STAR_state_STAR_ = _STAR_state_STAR__orig_val__64299);
}
break;
case "Strike_through":
return frontend.handler.export$.text.emphasis_wrap_with(inline_coll,"~~");

break;
case "Highlight":
return frontend.handler.export$.text.emphasis_wrap_with(inline_coll,"^^");

break;
default:
throw (new Error(["Assert failed: ",cljs.core.print_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"inline-emphasis","inline-emphasis",1774829182),emphasis,"is invalid"], 0)),"\n","false"].join('')));


}
});
frontend.handler.export$.text.inline_break_line = (function frontend$handler$export$text$inline_break_line(){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("no-indent",cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"export-options","export-options",672321679),new cljs.core.Keyword(null,"indent-style","indent-style",855468755)], null))))?frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["\n"], 0)):frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["  \n"], 0))),(cljs.core.truth_(new cljs.core.Keyword(null,"indent-after-break-line?","indent-after-break-line?",-736379041).cljs$core$IFn$_invoke$arity$1(frontend.handler.export$.common._STAR_state_STAR_))?(function (){var current_level = cljs.core.get.cljs$core$IFn$_invoke$arity$3(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.Keyword(null,"current-level","current-level",-11925890),(1));
if((current_level > (1))){
return frontend.handler.export$.text.indent_with_2_spaces((current_level - (1)));
} else {
return null;
}
})():null)], null);
});
malli.core._register_function_schema_BANG_.cljs$core$IFn$_invoke$arity$6(new cljs.core.Symbol(null,"frontend.handler.export.text","frontend.handler.export.text",-1199376101,null),new cljs.core.Symbol(null,"block-ast->simple-ast","block-ast->simple-ast",-1358162335,null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"=>","=>",1841166128),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"cat","cat",-1457810207),logseq.graph_parser.schema.mldoc.block_ast_schema], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"sequential","sequential",-1082983960),frontend.handler.export$.common.simple_ast_malli_schema], null)], null),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"file","file",-1269645878),"frontend/handler/export/text.cljs",new cljs.core.Keyword(null,"line","line",212345235),347,new cljs.core.Keyword(null,"column","column",2078222095),7,new cljs.core.Keyword(null,"end-line","end-line",1837326455),347,new cljs.core.Keyword(null,"end-column","end-column",1425389514),28], null),new cljs.core.Keyword(null,"cljs","cljs",1492417629),cljs.core.identity);

frontend.handler.export$.text.block_ast__GT_simple_ast = (function frontend$handler$export$text$block_ast__GT_simple_ast(block){
var newline_after_block_QMARK_ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"export-options","export-options",672321679),new cljs.core.Keyword(null,"newline-after-block","newline-after-block",137428571)], null));
return cljs.core.vec(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,(function (){var vec__64305 = block;
var ast_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64305,(0),null);
var ast_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64305,(1),null);
var G__64308 = ast_type;
switch (G__64308) {
case "Paragraph":
var map__64309 = cljs.core.meta(block);
var map__64309__$1 = cljs.core.__destructure_map(map__64309);
var origin_ast = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64309__$1,new cljs.core.Keyword(null,"origin-ast","origin-ast",915928394));
var current_block_is_first_heading_block_QMARK_ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"newline-after-block","newline-after-block",137428571),new cljs.core.Keyword(null,"current-block-is-first-heading-block?","current-block-is-first-heading-block?",2033274655)], null));
(frontend.handler.export$.common._STAR_state_STAR_ = cljs.core.assoc_in(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"newline-after-block","newline-after-block",137428571),new cljs.core.Keyword(null,"current-block-is-first-heading-block?","current-block-is-first-heading-block?",2033274655)], null),false));

return cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((cljs.core.truth_((function (){var and__5000__auto__ = origin_ast;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = newline_after_block_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not(current_block_is_first_heading_block_QMARK_);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.newline_STAR_((2))], null):null),cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(frontend.handler.export$.text.inline_ast__GT_simple_ast,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([ast_content], 0))),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(function (){var last_element = cljs.core.last(ast_content);
var vec__64310 = last_element;
var last_element_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64310,(0),null);
if(cljs.core.truth_((function (){var and__5000__auto__ = newline_after_block_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Break_Line",last_element_type);
} else {
return and__5000__auto__;
}
})())){
return frontend.handler.export$.text.inline_break_line();
} else {
return null;
}
})(),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.newline_STAR_((1))], null)], 0)));

break;
case "Paragraph_line":
throw (new Error(["Assert failed: ","Paragraph_line is mldoc internal ast","\n","false"].join('')));


break;
case "Paragraph_Sep":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.newline_STAR_(ast_content)], null);

break;
case "Heading":
return frontend.handler.export$.text.block_heading(ast_content);

break;
case "List":
return frontend.handler.export$.text.block_list(ast_content);

break;
case "Directive":
case "Results":
case "Export":
case "CommentBlock":
case "Custom":
return null;

break;
case "Example":
return frontend.handler.export$.text.block_example(ast_content);

break;
case "Src":
return frontend.handler.export$.text.block_src(ast_content);

break;
case "Quote":
return frontend.handler.export$.text.block_quote(ast_content);

break;
case "Latex_Fragment":
return frontend.handler.export$.text.block_latex_fragment(ast_content);

break;
case "Latex_Environment":
return frontend.handler.export$.text.block_latex_env(cljs.core.rest(block));

break;
case "Displayed_Math":
return frontend.handler.export$.text.block_displayed_math(ast_content);

break;
case "Drawer":
return frontend.handler.export$.text.block_drawer(cljs.core.rest(block));

break;
case "Property_Drawer":
return frontend.handler.export$.text.block_property_drawer(ast_content);

break;
case "Footnote_Definition":
return frontend.handler.export$.text.block_footnote_definition(cljs.core.rest(block));

break;
case "Horizontal_Rule":
return frontend.handler.export$.text.block_horizontal_rule;

break;
case "Table":
return frontend.handler.export$.text.block_table(ast_content);

break;
case "Comment":
return frontend.handler.export$.text.block_comment(ast_content);

break;
case "Raw_Html":
return frontend.handler.export$.text.block_raw_html(ast_content);

break;
case "Hiccup":
return frontend.handler.export$.text.block_hiccup(ast_content);

break;
default:
throw (new Error(["Assert failed: ",cljs.core.print_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"block-ast->simple-ast","block-ast->simple-ast",1296273434),ast_type,"not implemented yet"], 0)),"\n","false"].join('')));


}
})()));
});
frontend.handler.export$.text.inline_ast__GT_simple_ast = (function frontend$handler$export$text$inline_ast__GT_simple_ast(inline){
var vec__64354 = inline;
var ast_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64354,(0),null);
var ast_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64354,(1),null);
var G__64357 = ast_type;
switch (G__64357) {
case "Emphasis":
return frontend.handler.export$.text.inline_emphasis(ast_content);

break;
case "Break_Line":
case "Hard_Break_Line":
return frontend.handler.export$.text.inline_break_line();

break;
case "Verbatim":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([ast_content], 0))], null);

break;
case "Code":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["`",ast_content,"`"], 0))], null);

break;
case "Tag":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([["#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.handler.export$.common.hashtag_value__GT_string(ast_content))].join('')], 0))], null);

break;
case "Spaces":
return null;

break;
case "Plain":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([ast_content], 0))], null);

break;
case "Link":
return frontend.handler.export$.text.inline_link(ast_content);

break;
case "Nested_link":
return frontend.handler.export$.text.inline_nested_link(ast_content);

break;
case "Target":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([["<<",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ast_content),">>"].join('')], 0))], null);

break;
case "Subscript":
return frontend.handler.export$.text.inline_subscript(ast_content);

break;
case "Superscript":
return frontend.handler.export$.text.inline_superscript(ast_content);

break;
case "Footnote_Reference":
return frontend.handler.export$.text.inline_footnote_reference(ast_content);

break;
case "Cookie":
return frontend.handler.export$.text.inline_cookie(ast_content);

break;
case "Latex_Fragment":
return frontend.handler.export$.text.inline_latex_fragment(ast_content);

break;
case "Macro":
return frontend.handler.export$.text.inline_macro(ast_content);

break;
case "Entity":
return frontend.handler.export$.text.inline_entity(ast_content);

break;
case "Timestamp":
return frontend.handler.export$.text.inline_timestamp(ast_content);

break;
case "Radio_Target":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([["<<<",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ast_content),">>>"].join('')], 0))], null);

break;
case "Email":
return frontend.handler.export$.text.inline_email(ast_content);

break;
case "Inline_Hiccup":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([ast_content], 0))], null);

break;
case "Inline_Html":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([ast_content], 0))], null);

break;
case "Export_Snippet":
case "Inline_Source_Block":
return null;

break;
default:
throw (new Error(["Assert failed: ",cljs.core.print_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"inline-ast->simple-ast","inline-ast->simple-ast",-258439344),ast_type,"not implemented yet"], 0)),"\n","false"].join('')));


}
});
frontend.handler.export$.text.export_helper = (function frontend$handler$export$text$export_helper(content,format,options){
var remove_options = cljs.core.set(new cljs.core.Keyword(null,"remove-options","remove-options",768737839).cljs$core$IFn$_invoke$arity$1(options));
var other_options = new cljs.core.Keyword(null,"other-options","other-options",170412142).cljs$core$IFn$_invoke$arity$1(options);
var _STAR_state_STAR__orig_val__64364 = frontend.handler.export$.common._STAR_state_STAR_;
var _STAR_state_STAR__temp_val__64365 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"export-options","export-options",672321679),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"indent-style","indent-style",855468755),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"indent-style","indent-style",855468755).cljs$core$IFn$_invoke$arity$1(options);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "dashes";
}
})(),new cljs.core.Keyword(null,"remove-emphasis?","remove-emphasis?",-1751965539),cljs.core.contains_QMARK_(remove_options,new cljs.core.Keyword(null,"emphasis","emphasis",293543451)),new cljs.core.Keyword(null,"remove-page-ref-brackets?","remove-page-ref-brackets?",-276534720),cljs.core.contains_QMARK_(remove_options,new cljs.core.Keyword(null,"page-ref","page-ref",-1047131151)),new cljs.core.Keyword(null,"remove-tags?","remove-tags?",690905372),cljs.core.contains_QMARK_(remove_options,new cljs.core.Keyword(null,"tag","tag",-1290361223)),new cljs.core.Keyword(null,"remove-properties?","remove-properties?",1053410556),cljs.core.contains_QMARK_(remove_options,new cljs.core.Keyword(null,"property","property",-1114278232)),new cljs.core.Keyword(null,"keep-only-level<=N","keep-only-level<=N",-1010734857),new cljs.core.Keyword(null,"keep-only-level<=N","keep-only-level<=N",-1010734857).cljs$core$IFn$_invoke$arity$1(other_options),new cljs.core.Keyword(null,"newline-after-block","newline-after-block",137428571),new cljs.core.Keyword(null,"newline-after-block","newline-after-block",137428571).cljs$core$IFn$_invoke$arity$1(other_options)], null)], null)], 0));
(frontend.handler.export$.common._STAR_state_STAR_ = _STAR_state_STAR__temp_val__64365);

try{var ast = frontend.format.mldoc.__GT_edn(content,format);
var ast__$1 = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common.remove_block_ast_pos,ast);
var ast__$2 = cljs.core.vec(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common.Properties_block_ast_QMARK_,ast__$1));
var ast_STAR_ = frontend.handler.export$.common.replace_block_AMPERSAND_page_reference_AMPERSAND_embed(ast__$2);
var keep_level_LT__EQ_n = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"export-options","export-options",672321679),new cljs.core.Keyword(null,"keep-only-level<=N","keep-only-level<=N",-1010734857)], null));
var ast_STAR___$1 = (((keep_level_LT__EQ_n > (0)))?frontend.handler.export$.common.keep_only_level_LT__EQ_n(ast_STAR_,keep_level_LT__EQ_n):ast_STAR_);
var ast_STAR__STAR_ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("no-indent",cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"export-options","export-options",672321679),new cljs.core.Keyword(null,"indent-style","indent-style",855468755)], null))))?cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common.replace_Heading_with_Paragraph,ast_STAR___$1):ast_STAR___$1);
var config_for_walk_block_ast = (function (){var G__64372 = cljs.core.PersistentArrayMap.EMPTY;
var G__64372__$1 = (cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"export-options","export-options",672321679),new cljs.core.Keyword(null,"remove-emphasis?","remove-emphasis?",-1751965539)], null)))?cljs.core.update.cljs$core$IFn$_invoke$arity$4(G__64372,new cljs.core.Keyword(null,"mapcat-fns-on-inline-ast","mapcat-fns-on-inline-ast",-988900078),cljs.core.conj,frontend.handler.export$.common.remove_emphasis):G__64372);
var G__64372__$2 = (cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"export-options","export-options",672321679),new cljs.core.Keyword(null,"remove-page-ref-brackets?","remove-page-ref-brackets?",-276534720)], null)))?cljs.core.update.cljs$core$IFn$_invoke$arity$4(G__64372__$1,new cljs.core.Keyword(null,"map-fns-on-inline-ast","map-fns-on-inline-ast",-1834139513),cljs.core.conj,frontend.handler.export$.common.remove_page_ref_brackets):G__64372__$1);
var G__64372__$3 = (cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"export-options","export-options",672321679),new cljs.core.Keyword(null,"remove-tags?","remove-tags?",690905372)], null)))?cljs.core.update.cljs$core$IFn$_invoke$arity$4(G__64372__$2,new cljs.core.Keyword(null,"mapcat-fns-on-inline-ast","mapcat-fns-on-inline-ast",-988900078),cljs.core.conj,frontend.handler.export$.common.remove_tags):G__64372__$2);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("no-indent",cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"export-options","export-options",672321679),new cljs.core.Keyword(null,"indent-style","indent-style",855468755)], null)))){
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(G__64372__$3,new cljs.core.Keyword(null,"fns-on-inline-coll","fns-on-inline-coll",-2007934714),cljs.core.conj,frontend.handler.export$.common.remove_prefix_spaces_in_Plain);
} else {
return G__64372__$3;
}
})();
var ast_STAR__STAR__STAR_ = (((!(cljs.core.empty_QMARK_(config_for_walk_block_ast))))?cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(cljs.core.partial.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common.walk_block_ast,config_for_walk_block_ast),ast_STAR__STAR_):ast_STAR__STAR_);
var simple_asts = cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(frontend.handler.export$.text.block_ast__GT_simple_ast,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([ast_STAR__STAR__STAR_], 0)));
return frontend.handler.export$.common.simple_asts__GT_string(simple_asts);
}finally {(frontend.handler.export$.common._STAR_state_STAR_ = _STAR_state_STAR__orig_val__64364);
}});
/**
 * options:
 *   :indent-style "dashes" | "spaces" | "no-indent"
 *   :remove-options [:emphasis :page-ref :tag :property]
 *   :other-options {:keep-only-level<=N int :newline-after-block bool}
 */
frontend.handler.export$.text.export_blocks_as_markdown = (function frontend$handler$export$text$export_blocks_as_markdown(repo,root_block_uuids_or_page_uuid,options){
if(((cljs.core.coll_QMARK_(root_block_uuids_or_page_uuid)) || (cljs.core.uuid_QMARK_(root_block_uuids_or_page_uuid)))){
} else {
throw (new Error("Assert failed: (or (coll? root-block-uuids-or-page-uuid) (uuid? root-block-uuids-or-page-uuid))"));
}

if(cljs.core.truth_(goog.DEBUG)){
var k__50701__auto__ = new cljs.core.Keyword(null,"export-blocks-as-markdown","export-blocks-as-markdown",-915039746);
console.time(k__50701__auto__);

var res__50702__auto__ = (function (){try{var content = (cljs.core.truth_((function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),cljs.core.count(root_block_uuids_or_page_uuid));
if(and__5000__auto__){
var G__64382 = (function (){var G__64383 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.first(root_block_uuids_or_page_uuid)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__64383) : frontend.db.entity.call(null,G__64383));
})();
return (logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(G__64382) : logseq.db.page_QMARK_.call(null,G__64382));
} else {
return and__5000__auto__;
}
})())?frontend.handler.export$.common.get_page_content(cljs.core.first(root_block_uuids_or_page_uuid)):((((cljs.core.coll_QMARK_(root_block_uuids_or_page_uuid)) && (cljs.core.every_QMARK_((function (p1__64380_SHARP_){
var G__64384 = (function (){var G__64385 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),p1__64380_SHARP_], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__64385) : frontend.db.entity.call(null,G__64385));
})();
return (logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(G__64384) : logseq.db.page_QMARK_.call(null,G__64384));
}),root_block_uuids_or_page_uuid))))?clojure.string.join.cljs$core$IFn$_invoke$arity$2("\n",cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (id){
return new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1((function (){var G__64386 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__64386) : frontend.db.entity.call(null,G__64386));
})());
}),root_block_uuids_or_page_uuid)):frontend.handler.export$.common.root_block_uuids__GT_content(repo,root_block_uuids_or_page_uuid)
));
var first_block = (function (){var and__5000__auto__ = cljs.core.coll_QMARK_(root_block_uuids_or_page_uuid);
if(and__5000__auto__){
var G__64387 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.first(root_block_uuids_or_page_uuid)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__64387) : frontend.db.entity.call(null,G__64387));
} else {
return and__5000__auto__;
}
})();
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$3(first_block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
return frontend.handler.export$.text.export_helper(content,format,options);
}catch (e64381){var e = e64381;
return console.error(e);
}})();
console.timeEnd(k__50701__auto__);

return res__50702__auto__;
} else {
try{var content = (cljs.core.truth_((function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),cljs.core.count(root_block_uuids_or_page_uuid));
if(and__5000__auto__){
var G__64389 = (function (){var G__64390 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.first(root_block_uuids_or_page_uuid)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__64390) : frontend.db.entity.call(null,G__64390));
})();
return (logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(G__64389) : logseq.db.page_QMARK_.call(null,G__64389));
} else {
return and__5000__auto__;
}
})())?frontend.handler.export$.common.get_page_content(cljs.core.first(root_block_uuids_or_page_uuid)):((((cljs.core.coll_QMARK_(root_block_uuids_or_page_uuid)) && (cljs.core.every_QMARK_((function (p1__64380_SHARP_){
var G__64391 = (function (){var G__64392 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),p1__64380_SHARP_], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__64392) : frontend.db.entity.call(null,G__64392));
})();
return (logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(G__64391) : logseq.db.page_QMARK_.call(null,G__64391));
}),root_block_uuids_or_page_uuid))))?clojure.string.join.cljs$core$IFn$_invoke$arity$2("\n",cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (id){
return new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1((function (){var G__64393 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__64393) : frontend.db.entity.call(null,G__64393));
})());
}),root_block_uuids_or_page_uuid)):frontend.handler.export$.common.root_block_uuids__GT_content(repo,root_block_uuids_or_page_uuid)
));
var first_block = (function (){var and__5000__auto__ = cljs.core.coll_QMARK_(root_block_uuids_or_page_uuid);
if(and__5000__auto__){
var G__64394 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.first(root_block_uuids_or_page_uuid)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__64394) : frontend.db.entity.call(null,G__64394));
} else {
return and__5000__auto__;
}
})();
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$3(first_block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
return frontend.handler.export$.text.export_helper(content,format,options);
}catch (e64388){var e = e64388;
return console.error(e);
}}
});
/**
 * options see also `export-blocks-as-markdown`
 */
frontend.handler.export$.text.export_files_as_markdown = (function frontend$handler$export$text$export_files_as_markdown(files,options){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p__64395){
var map__64396 = p__64395;
var map__64396__$1 = cljs.core.__destructure_map(map__64396);
var path = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64396__$1,new cljs.core.Keyword(null,"path","path",-188191168));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64396__$1,new cljs.core.Keyword(null,"title","title",636505583));
var content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64396__$1,new cljs.core.Keyword(null,"content","content",15833224));
if(cljs.core.truth_(goog.DEBUG)){
var k__50701__auto__ = cljs.core.print_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"export-files-as-markdown","export-files-as-markdown",1418547627),title], 0));
console.time(k__50701__auto__);

var res__50702__auto__ = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var or__5002__auto__ = path;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return title;
}
})(),frontend.handler.export$.text.export_helper(content,new cljs.core.Keyword(null,"markdown","markdown",1227225089),options)], null);
console.timeEnd(k__50701__auto__);

return res__50702__auto__;
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var or__5002__auto__ = path;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return title;
}
})(),frontend.handler.export$.text.export_helper(content,new cljs.core.Keyword(null,"markdown","markdown",1227225089),options)], null);
}
}),files);
});
/**
 * TODO: indent-style and remove-options
 */
frontend.handler.export$.text.export_repo_as_markdown_BANG_ = (function frontend$handler$export$text$export_repo_as_markdown_BANG_(repo){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(goog.DEBUG)?(function (){var k__50701__auto__ = new cljs.core.Keyword(null,"get-file-content","get-file-content",643543160);
console.time(k__50701__auto__);

var res__50702__auto__ = frontend.handler.export$.common._LT_get_file_contents(repo,"md");
console.timeEnd(k__50701__auto__);

return res__50702__auto__;
})():frontend.handler.export$.common._LT_get_file_contents(repo,"md"))),(function (files_STAR_){
return promesa.protocols._promise(((cljs.core.seq(files_STAR_))?(function (){var files = frontend.handler.export$.text.export_files_as_markdown(files_STAR_,null);
var repo_SINGLEQUOTE_ = ((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo))?clojure.string.replace(repo,frontend.config.db_version_prefix,""):logseq.common.path.basename(repo));
var zip_file_name = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(repo_SINGLEQUOTE_),"_markdown_",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.quot((frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0 ? frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0() : frontend.util.time_ms.call(null)),(1000)))].join('');
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.extensions.zip.make_zip(zip_file_name,files,repo_SINGLEQUOTE_)),(function (zipfile){
return promesa.protocols._promise((function (){var temp__5804__auto__ = goog.dom.getElement("export-as-markdown");
if(cljs.core.truth_(temp__5804__auto__)){
var anchor = temp__5804__auto__;
anchor.setAttribute("href",window.URL.createObjectURL(zipfile));

anchor.setAttribute("download",zipfile.name);

return anchor.click();
} else {
return null;
}
})());
}));
}));
})():null));
}));
}));
});

//# sourceMappingURL=frontend.handler.export.text.js.map
