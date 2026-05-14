goog.provide('frontend.handler.export$.opml');
frontend.handler.export$.opml._STAR_opml_state_STAR_ = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outside-em-symbol","outside-em-symbol",478063381),null], null);
frontend.handler.export$.opml.branch_QMARK_ = (function frontend$handler$export$opml$branch_QMARK_(node){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"outline","outline",793464534),cljs.core.first(node));
});
frontend.handler.export$.opml.outline_hiccup_zip = (function frontend$handler$export$opml$outline_hiccup_zip(root){
return clojure.zip.zipper(frontend.handler.export$.opml.branch_QMARK_,cljs.core.rest,(function (node,children){
return cljs.core.with_meta(cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.vector,new cljs.core.Keyword(null,"outline","outline",793464534),children),cljs.core.meta(node));
}),root);
});
frontend.handler.export$.opml.init_opml_body_hiccup = clojure.zip.down(frontend.handler.export$.opml.outline_hiccup_zip(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"outline","outline",793464534),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"placeholder","placeholder",-104873083)], null)], null)));
/**
 * [:outline [:outline [:outline]]]
 *                     ^
 *                 goto here
 */
frontend.handler.export$.opml.goto_last_outline = (function frontend$handler$export$opml$goto_last_outline(loc){
return clojure.zip.up(frontend.handler.export$.zip_helper.goto_last(loc));
});
frontend.handler.export$.opml.add_same_level_outline_at_right = (function frontend$handler$export$opml$add_same_level_outline_at_right(loc,attr_map){
if(cljs.core.map_QMARK_(attr_map)){
} else {
throw (new Error("Assert failed: (map? attr-map)"));
}

return clojure.zip.right(clojure.zip.insert_right(loc,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"outline","outline",793464534),attr_map], null)));
});
frontend.handler.export$.opml.add_next_level_outline = (function frontend$handler$export$opml$add_next_level_outline(loc,attr_map){
if(cljs.core.map_QMARK_(attr_map)){
} else {
throw (new Error("Assert failed: (map? attr-map)"));
}

return frontend.handler.export$.opml.goto_last_outline(clojure.zip.append_child(loc,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"outline","outline",793464534),attr_map], null)));
});
frontend.handler.export$.opml.append_text_to_current_outline = (function frontend$handler$export$opml$append_text_to_current_outline(loc,text){
return clojure.zip.up(clojure.zip.edit(clojure.zip.down(loc),(function (p1__74052_SHARP_){
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(p1__74052_SHARP_,new cljs.core.Keyword(null,"text","text",-1790561697),cljs.core.str,text);
})));
});
/**
 * if current-level = 0(it's just `init-opml-body-hiccup`), need to add a new outline item.
 */
frontend.handler.export$.opml.append_text_to_current_outline_STAR_ = (function frontend$handler$export$opml$append_text_to_current_outline_STAR_(loc,text){
if((frontend.handler.export$.zip_helper.get_level(loc) > (0))){
return frontend.handler.export$.opml.append_text_to_current_outline(loc,text);
} else {
return frontend.handler.export$.opml.append_text_to_current_outline(frontend.handler.export$.opml.add_same_level_outline_at_right(clojure.zip.down(loc),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"text","text",-1790561697),null], null)),text);
}
});
frontend.handler.export$.opml.zip_loc__GT_opml = (function frontend$handler$export$opml$zip_loc__GT_opml(hiccup,title){
var vec__74053 = hiccup;
var seq__74054 = cljs.core.seq(vec__74053);
var first__74055 = cljs.core.first(seq__74054);
var seq__74054__$1 = cljs.core.next(seq__74054);
var _ = first__74055;
var first__74055__$1 = cljs.core.first(seq__74054__$1);
var seq__74054__$2 = cljs.core.next(seq__74054__$1);
var ___$1 = first__74055__$1;
var body = seq__74054__$2;
return ["<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n",cljs.core.str.cljs$core$IFn$_invoke$arity$1(module$frontend$utils.prettifyXml(hiccups.runtime.render_html(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"opml","opml",2114938640),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"version","version",425292698),"2.0"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"head","head",-771383919),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"title","title",636505583),title], null)], null),cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"body","body",-2049205669)], null),body))], null))))].join('');
});

frontend.handler.export$.opml.emphasis_wrap_with = (function frontend$handler$export$opml$emphasis_wrap_with(inline_coll,em_symbol){
var _STAR_opml_state_STAR__orig_val__74056 = frontend.handler.export$.opml._STAR_opml_state_STAR_;
var _STAR_opml_state_STAR__temp_val__74057 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.handler.export$.opml._STAR_opml_state_STAR_,new cljs.core.Keyword(null,"outside-em-symbol","outside-em-symbol",478063381),cljs.core.first(em_symbol));
(frontend.handler.export$.opml._STAR_opml_state_STAR_ = _STAR_opml_state_STAR__temp_val__74057);

try{return cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([em_symbol], 0))], null),cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(frontend.handler.export$.opml.inline_ast__GT_simple_ast,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([inline_coll], 0))),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([em_symbol], 0))], null)], 0)));
}finally {(frontend.handler.export$.opml._STAR_opml_state_STAR_ = _STAR_opml_state_STAR__orig_val__74056);
}});
frontend.handler.export$.opml.inline_emphasis = (function frontend$handler$export$opml$inline_emphasis(p__74064){
var vec__74065 = p__74064;
var vec__74068 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74065,(0),null);
var type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74068,(0),null);
var inline_coll = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74065,(1),null);
var outside_em_symbol = new cljs.core.Keyword(null,"outside-em-symbol","outside-em-symbol",478063381).cljs$core$IFn$_invoke$arity$1(frontend.handler.export$.opml._STAR_opml_state_STAR_);
var G__74073 = type;
switch (G__74073) {
case "Bold":
return frontend.handler.export$.opml.emphasis_wrap_with(inline_coll,((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(outside_em_symbol,"*"))?"__":"**"));

break;
case "Italic":
return frontend.handler.export$.opml.emphasis_wrap_with(inline_coll,((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(outside_em_symbol,"*"))?"_":"*"));

break;
case "Underline":
var _STAR_opml_state_STAR__orig_val__74074 = frontend.handler.export$.opml._STAR_opml_state_STAR_;
var _STAR_opml_state_STAR__temp_val__74075 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.handler.export$.opml._STAR_opml_state_STAR_,new cljs.core.Keyword(null,"outside-em-symbol","outside-em-symbol",478063381),outside_em_symbol);
(frontend.handler.export$.opml._STAR_opml_state_STAR_ = _STAR_opml_state_STAR__temp_val__74075);

try{return cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (inline){
return cljs.core.cons(frontend.handler.export$.common.space,(frontend.handler.export$.opml.inline_ast__GT_simple_ast.cljs$core$IFn$_invoke$arity$1 ? frontend.handler.export$.opml.inline_ast__GT_simple_ast.cljs$core$IFn$_invoke$arity$1(inline) : frontend.handler.export$.opml.inline_ast__GT_simple_ast.call(null,inline)));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([inline_coll], 0)));
}finally {(frontend.handler.export$.opml._STAR_opml_state_STAR_ = _STAR_opml_state_STAR__orig_val__74074);
}
break;
case "Strike_through":
return frontend.handler.export$.opml.emphasis_wrap_with(inline_coll,"~~");

break;
case "Highlight":
return frontend.handler.export$.opml.emphasis_wrap_with(inline_coll,"^^");

break;
default:
throw (new Error(["Assert failed: ",cljs.core.print_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"inline-emphasis","inline-emphasis",1774829182),type,"is invalid"], 0)),"\n","false"].join('')));


}
});
frontend.handler.export$.opml.inline_break_line = (function frontend$handler$export$opml$inline_break_line(){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.space], null);
});
frontend.handler.export$.opml.inline_link = (function frontend$handler$export$opml$inline_link(p__74077){
var map__74078 = p__74077;
var map__74078__$1 = cljs.core.__destructure_map(map__74078);
var full_text = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74078__$1,new cljs.core.Keyword(null,"full_text","full_text",1634289075));
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([full_text], 0))], null);
});
frontend.handler.export$.opml.inline_nested_link = (function frontend$handler$export$opml$inline_nested_link(p__74079){
var map__74080 = p__74079;
var map__74080__$1 = cljs.core.__destructure_map(map__74080);
var content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74080__$1,new cljs.core.Keyword(null,"content","content",15833224));
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([content], 0))], null);
});
frontend.handler.export$.opml.inline_subscript = (function frontend$handler$export$opml$inline_subscript(inline_coll){
return cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["_{"], 0))], null),cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (inline){
return cljs.core.cons(frontend.handler.export$.common.space,(frontend.handler.export$.opml.inline_ast__GT_simple_ast.cljs$core$IFn$_invoke$arity$1 ? frontend.handler.export$.opml.inline_ast__GT_simple_ast.cljs$core$IFn$_invoke$arity$1(inline) : frontend.handler.export$.opml.inline_ast__GT_simple_ast.call(null,inline)));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([inline_coll], 0))),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["}"], 0))], null)], 0)));
});
frontend.handler.export$.opml.inline_superscript = (function frontend$handler$export$opml$inline_superscript(inline_coll){
return cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["^{"], 0))], null),cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (inline){
return cljs.core.cons(frontend.handler.export$.common.space,(frontend.handler.export$.opml.inline_ast__GT_simple_ast.cljs$core$IFn$_invoke$arity$1 ? frontend.handler.export$.opml.inline_ast__GT_simple_ast.cljs$core$IFn$_invoke$arity$1(inline) : frontend.handler.export$.opml.inline_ast__GT_simple_ast.call(null,inline)));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([inline_coll], 0))),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["}"], 0))], null)], 0)));
});
frontend.handler.export$.opml.inline_footnote_reference = (function frontend$handler$export$opml$inline_footnote_reference(p__74081){
var map__74082 = p__74081;
var map__74082__$1 = cljs.core.__destructure_map(map__74082);
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74082__$1,new cljs.core.Keyword(null,"name","name",1843675177));
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["[",name,"]"], 0))], null);
});
frontend.handler.export$.opml.inline_cookie = (function frontend$handler$export$opml$inline_cookie(ast_content){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(function (){var G__74085 = cljs.core.first(ast_content);
switch (G__74085) {
case "Absolute":
var vec__74088 = ast_content;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74088,(0),null);
var current = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74088,(1),null);
var total = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74088,(2),null);
return ["[",cljs.core.str.cljs$core$IFn$_invoke$arity$1(current),"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(total),"]"].join('');

break;
case "Percent":
return ["[",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.second(ast_content)),"%]"].join('');

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__74085)].join('')));

}
})()], 0))], null);
});
frontend.handler.export$.opml.inline_latex_fragment = (function frontend$handler$export$opml$inline_latex_fragment(ast_content){
var vec__74095 = ast_content;
var type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74095,(0),null);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74095,(1),null);
var wrapper = (function (){var G__74098 = type;
switch (G__74098) {
case "Inline":
return "$";

break;
case "Displayed":
return "$$";

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__74098)].join('')));

}
})();
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.space,frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([[cljs.core.str.cljs$core$IFn$_invoke$arity$1(wrapper),cljs.core.str.cljs$core$IFn$_invoke$arity$1(content),cljs.core.str.cljs$core$IFn$_invoke$arity$1(wrapper)].join('')], 0)),frontend.handler.export$.common.space], null);
});
frontend.handler.export$.opml.inline_macro = (function frontend$handler$export$opml$inline_macro(p__74102){
var map__74103 = p__74102;
var map__74103__$1 = cljs.core.__destructure_map(map__74103);
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74103__$1,new cljs.core.Keyword(null,"name","name",1843675177));
var arguments$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74103__$1,new cljs.core.Keyword(null,"arguments","arguments",-1182834456));
return (new cljs.core.PersistentVector(null,1,(5),cljs.core.PersistentVector.EMPTY_NODE,[frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(name,"cloze"))?clojure.string.join.cljs$core$IFn$_invoke$arity$2(",",arguments$):(function (){var l = (function (){var G__74104 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["{{",name], null);
var G__74104__$1 = (((cljs.core.count(arguments$) > (0)))?cljs.core.conj.cljs$core$IFn$_invoke$arity$variadic(G__74104,"(",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([clojure.string.join.cljs$core$IFn$_invoke$arity$2(",",arguments$),")"], 0)):G__74104);
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__74104__$1,"}}");

})();
return clojure.string.join.cljs$core$IFn$_invoke$arity$1(l);
})())], 0))],null));
});
frontend.handler.export$.opml.inline_entity = (function frontend$handler$export$opml$inline_entity(p__74105){
var map__74106 = p__74105;
var map__74106__$1 = cljs.core.__destructure_map(map__74106);
var unicode = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74106__$1,new cljs.core.Keyword(null,"unicode","unicode",-542572710));
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([unicode], 0))], null);
});
frontend.handler.export$.opml.inline_timestamp = (function frontend$handler$export$opml$inline_timestamp(ast_content){
var vec__74107 = ast_content;
var type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74107,(0),null);
var timestamp_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74107,(1),null);
return (new cljs.core.PersistentVector(null,1,(5),cljs.core.PersistentVector.EMPTY_NODE,[frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([clojure.string.join.cljs$core$IFn$_invoke$arity$1((function (){var G__74110 = type;
switch (G__74110) {
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
var map__74112 = timestamp_content;
var map__74112__$1 = cljs.core.__destructure_map(map__74112);
var start = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74112__$1,new cljs.core.Keyword(null,"start","start",-355208981));
var stop = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74112__$1,new cljs.core.Keyword(null,"stop","stop",-2140911342));
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.handler.export$.common.timestamp_to_string(start)),"--",cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.handler.export$.common.timestamp_to_string(stop))].join('')], null);

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__74110)].join('')));

}
})())], 0))],null));
});
frontend.handler.export$.opml.inline_email = (function frontend$handler$export$opml$inline_email(p__74113){
var map__74114 = p__74113;
var map__74114__$1 = cljs.core.__destructure_map(map__74114);
var local_part = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74114__$1,new cljs.core.Keyword(null,"local_part","local_part",-1705904558));
var domain = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74114__$1,new cljs.core.Keyword(null,"domain","domain",1847214937));
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([["<",cljs.core.str.cljs$core$IFn$_invoke$arity$1(local_part),"@",cljs.core.str.cljs$core$IFn$_invoke$arity$1(domain),">"].join('')], 0))], null);
});
frontend.handler.export$.opml.inline_ast__GT_simple_ast = (function frontend$handler$export$opml$inline_ast__GT_simple_ast(inline){
var vec__74115 = inline;
var ast_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74115,(0),null);
var ast_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74115,(1),null);
var G__74118 = ast_type;
switch (G__74118) {
case "Emphasis":
return frontend.handler.export$.opml.inline_emphasis(ast_content);

break;
case "Break_Line":
case "Hard_Break_Line":
return frontend.handler.export$.opml.inline_break_line();

break;
case "Verbatim":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([ast_content], 0))], null);

break;
case "Code":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["`",ast_content,"`"], 0))], null);

break;
case "Tag":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["#",frontend.handler.export$.common.hashtag_value__GT_string(ast_content)], 0))], null);

break;
case "Spaces":
return null;

break;
case "Plain":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([ast_content], 0))], null);

break;
case "Link":
return frontend.handler.export$.opml.inline_link(ast_content);

break;
case "Nested_link":
return frontend.handler.export$.opml.inline_nested_link(ast_content);

break;
case "Target":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([["<<",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ast_content),">>"].join('')], 0))], null);

break;
case "Subscript":
return frontend.handler.export$.opml.inline_subscript(ast_content);

break;
case "Superscript":
return frontend.handler.export$.opml.inline_superscript(ast_content);

break;
case "Footnote_Reference":
return frontend.handler.export$.opml.inline_footnote_reference(ast_content);

break;
case "Cookie":
return frontend.handler.export$.opml.inline_cookie(ast_content);

break;
case "Latex_Fragment":
return frontend.handler.export$.opml.inline_latex_fragment(ast_content);

break;
case "Macro":
return frontend.handler.export$.opml.inline_macro(ast_content);

break;
case "Entity":
return frontend.handler.export$.opml.inline_entity(ast_content);

break;
case "Timestamp":
return frontend.handler.export$.opml.inline_timestamp(ast_content);

break;
case "Radio_Target":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([["<<<",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ast_content),">>>"].join('')], 0))], null);

break;
case "Email":
return frontend.handler.export$.opml.inline_email(ast_content);

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
frontend.handler.export$.opml.block_paragraph = (function frontend$handler$export$opml$block_paragraph(loc,inline_coll){
return frontend.handler.export$.opml.append_text_to_current_outline_STAR_(frontend.handler.export$.opml.goto_last_outline(loc),frontend.handler.export$.common.simple_asts__GT_string(cljs.core.cons(frontend.handler.export$.common.space,cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(frontend.handler.export$.opml.inline_ast__GT_simple_ast,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([inline_coll], 0))))));
});
frontend.handler.export$.opml.block_heading = (function frontend$handler$export$opml$block_heading(loc,p__74121){
var map__74122 = p__74121;
var map__74122__$1 = cljs.core.__destructure_map(map__74122);
var _meta = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74122__$1,new cljs.core.Keyword(null,"_meta","_meta",937543236));
var marker = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74122__$1,new cljs.core.Keyword(null,"marker","marker",865118313));
var _size = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74122__$1,new cljs.core.Keyword(null,"_size","_size",-746489012));
var _anchor = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74122__$1,new cljs.core.Keyword(null,"_anchor","_anchor",-1041309458));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74122__$1,new cljs.core.Keyword(null,"title","title",636505583));
var level = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74122__$1,new cljs.core.Keyword(null,"level","level",1290497552));
var priority = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74122__$1,new cljs.core.Keyword(null,"priority","priority",1431093715));
var _tags = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74122__$1,new cljs.core.Keyword(null,"_tags","_tags",58828915));
var _numbering = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74122__$1,new cljs.core.Keyword(null,"_numbering","_numbering",1825467892));
var _unordered = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74122__$1,new cljs.core.Keyword(null,"_unordered","_unordered",1249595382));
var loc__$1 = frontend.handler.export$.opml.goto_last_outline(loc);
var current_level = frontend.handler.export$.zip_helper.get_level(loc__$1);
var title_STAR_ = cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(frontend.handler.export$.opml.inline_ast__GT_simple_ast,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([title], 0)));
var marker_STAR_ = (function (){var and__5000__auto__ = marker;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([marker], 0));
} else {
return and__5000__auto__;
}
})();
var priority_STAR_ = (function (){var and__5000__auto__ = priority;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.handler.export$.common.priority__GT_string(priority)], 0));
} else {
return and__5000__auto__;
}
})();
var simple_asts = cljs.core.vec(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [marker_STAR_,frontend.handler.export$.common.space,priority_STAR_,frontend.handler.export$.common.space], null),title_STAR_))));
var simple_asts__$1 = cljs.core.drop_while.cljs$core$IFn$_invoke$arity$2((function (p1__74120_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(p1__74120_SHARP_,frontend.handler.export$.common.space);
}),simple_asts);
var s = frontend.handler.export$.common.simple_asts__GT_string(simple_asts__$1);
if((level > current_level)){
return frontend.handler.export$.opml.add_next_level_outline(loc__$1,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"text","text",-1790561697),s], null));
} else {
return frontend.handler.export$.opml.add_same_level_outline_at_right(clojure.zip.rightmost(frontend.handler.export$.zip_helper.goto_level(loc__$1,level)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"text","text",-1790561697),s], null));
}
});
frontend.handler.export$.opml.block_list_item = (function frontend$handler$export$opml$block_list_item(loc,p__74124){
var map__74125 = p__74124;
var map__74125__$1 = cljs.core.__destructure_map(map__74125);
var content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74125__$1,new cljs.core.Keyword(null,"content","content",15833224));
var items = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74125__$1,new cljs.core.Keyword(null,"items","items",1031954938));
var current_level = frontend.handler.export$.zip_helper.get_level(loc);
var loc__$1 = ((cljs.core.empty_QMARK_(cljs.core.second(clojure.zip.node(loc))))?loc:frontend.handler.export$.opml.add_same_level_outline_at_right(loc,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"text","text",-1790561697),null], null)));
var loc_STAR_ = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(frontend.handler.export$.opml.block_ast__GT_hiccup,loc__$1,content);
var loc_STAR__STAR_ = ((cljs.core.seq(items))?(frontend.handler.export$.opml.block_list.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.export$.opml.block_list.cljs$core$IFn$_invoke$arity$2(loc_STAR_,items) : frontend.handler.export$.opml.block_list.call(null,loc_STAR_,items)):loc_STAR_);
return clojure.zip.rightmost(frontend.handler.export$.zip_helper.goto_level(loc_STAR__STAR_,current_level));
});
frontend.handler.export$.opml.block_list = (function frontend$handler$export$opml$block_list(loc,list_items){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(frontend.handler.export$.opml.block_list_item,frontend.handler.export$.opml.add_next_level_outline(loc,cljs.core.PersistentArrayMap.EMPTY),list_items);
});
frontend.handler.export$.opml.block_example = (function frontend$handler$export$opml$block_example(loc,str_coll){
return frontend.handler.export$.opml.append_text_to_current_outline_STAR_(loc,clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",str_coll));
});
frontend.handler.export$.opml.block_src = (function frontend$handler$export$opml$block_src(loc,p__74130){
var map__74131 = p__74130;
var map__74131__$1 = cljs.core.__destructure_map(map__74131);
var _language = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74131__$1,new cljs.core.Keyword(null,"_language","_language",460812073));
var lines = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74131__$1,new cljs.core.Keyword(null,"lines","lines",-700165781));
return frontend.handler.export$.opml.append_text_to_current_outline_STAR_(loc,clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",lines));
});
frontend.handler.export$.opml.block_quote = (function frontend$handler$export$opml$block_quote(loc,block_ast_coll){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(frontend.handler.export$.opml.block_ast__GT_hiccup,loc,block_ast_coll);
});
frontend.handler.export$.opml.block_latex_env = (function frontend$handler$export$opml$block_latex_env(loc,p__74132){
var vec__74133 = p__74132;
var name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74133,(0),null);
var options = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74133,(1),null);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74133,(2),null);
return frontend.handler.export$.opml.append_text_to_current_outline_STAR_(loc,["\\begin{",cljs.core.str.cljs$core$IFn$_invoke$arity$1(name),"}",cljs.core.str.cljs$core$IFn$_invoke$arity$1(options),"\n",cljs.core.str.cljs$core$IFn$_invoke$arity$1(content),"\n","\\end{",cljs.core.str.cljs$core$IFn$_invoke$arity$1(name),"}"].join(''));
});
frontend.handler.export$.opml.block_displayed_math = (function frontend$handler$export$opml$block_displayed_math(loc,s){
return frontend.handler.export$.opml.append_text_to_current_outline_STAR_(loc,s);
});
frontend.handler.export$.opml.block_footnote_definition = (function frontend$handler$export$opml$block_footnote_definition(loc,p__74137){
var vec__74138 = p__74137;
var name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74138,(0),null);
var inline_coll = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74138,(1),null);
var inline_simple_asts = cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(frontend.handler.export$.opml.inline_ast__GT_simple_ast,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([inline_coll], 0)));
return frontend.handler.export$.opml.append_text_to_current_outline_STAR_(loc,["[^",cljs.core.str.cljs$core$IFn$_invoke$arity$1(name),"]: ",frontend.handler.export$.common.simple_asts__GT_string(inline_simple_asts)].join(''));
});
frontend.handler.export$.opml.block_ast__GT_hiccup = (function frontend$handler$export$opml$block_ast__GT_hiccup(loc,block_ast){
var vec__74144 = block_ast;
var ast_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74144,(0),null);
var ast_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74144,(1),null);
var G__74147 = ast_type;
switch (G__74147) {
case "Paragraph":
return frontend.handler.export$.opml.block_paragraph(loc,ast_content);

break;
case "Paragraph_line":
throw (new Error(["Assert failed: ","Paragraph_line is mldoc internal ast","\n","false"].join('')));


break;
case "Paragraph_Sep":
return loc;

break;
case "Heading":
return frontend.handler.export$.opml.block_heading(loc,ast_content);

break;
case "List":
return frontend.handler.export$.opml.block_list(loc,ast_content);

break;
case "Directive":
case "Results":
case "Property_Drawer":
case "Export":
case "CommentBlock":
case "Custom":
return loc;

break;
case "Example":
return frontend.handler.export$.opml.block_example(loc,ast_content);

break;
case "Src":
return frontend.handler.export$.opml.block_src(loc,ast_content);

break;
case "Quote":
return frontend.handler.export$.opml.block_quote(loc,ast_content);

break;
case "Latex_Fragment":
return frontend.handler.export$.opml.append_text_to_current_outline_STAR_(loc,frontend.handler.export$.common.simple_asts__GT_string(frontend.handler.export$.opml.inline_latex_fragment(ast_content)));

break;
case "Latex_Environment":
return frontend.handler.export$.opml.block_latex_env(loc,cljs.core.rest(block_ast));

break;
case "Displayed_Math":
return frontend.handler.export$.opml.block_displayed_math(loc,ast_content);

break;
case "Drawer":
return loc;

break;
case "Footnote_Definition":
return frontend.handler.export$.opml.block_footnote_definition(loc,cljs.core.rest(block_ast));

break;
case "Horizontal_Rule":
return loc;

break;
case "Table":
return loc;

break;
case "Comment":
return loc;

break;
case "Raw_Html":
return loc;

break;
case "Hiccup":
return loc;

break;
default:
throw (new Error(["Assert failed: ",cljs.core.print_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"block-ast->simple-ast","block-ast->simple-ast",1296273434),ast_type,"not implemented yet"], 0)),"\n","false"].join('')));


}
});
frontend.handler.export$.opml.export_helper = (function frontend$handler$export$opml$export_helper(var_args){
var args__5732__auto__ = [];
var len__5726__auto___74171 = arguments.length;
var i__5727__auto___74172 = (0);
while(true){
if((i__5727__auto___74172 < len__5726__auto___74171)){
args__5732__auto__.push((arguments[i__5727__auto___74172]));

var G__74173 = (i__5727__auto___74172 + (1));
i__5727__auto___74172 = G__74173;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((3) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((3)),(0),null)):null);
return frontend.handler.export$.opml.export_helper.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),argseq__5733__auto__);
});

(frontend.handler.export$.opml.export_helper.cljs$core$IFn$_invoke$arity$variadic = (function (content,format,options,p__74152){
var map__74153 = p__74152;
var map__74153__$1 = cljs.core.__destructure_map(map__74153);
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__74153__$1,new cljs.core.Keyword(null,"title","title",636505583),"untitled");
var remove_options = cljs.core.set(new cljs.core.Keyword(null,"remove-options","remove-options",768737839).cljs$core$IFn$_invoke$arity$1(options));
var other_options = new cljs.core.Keyword(null,"other-options","other-options",170412142).cljs$core$IFn$_invoke$arity$1(options);
var _STAR_state_STAR__orig_val__74154 = frontend.handler.export$.common._STAR_state_STAR_;
var _STAR_opml_state_STAR__orig_val__74155 = frontend.handler.export$.opml._STAR_opml_state_STAR_;
var _STAR_state_STAR__temp_val__74156 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"export-options","export-options",672321679),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"remove-emphasis?","remove-emphasis?",-1751965539),cljs.core.contains_QMARK_(remove_options,new cljs.core.Keyword(null,"emphasis","emphasis",293543451)),new cljs.core.Keyword(null,"remove-page-ref-brackets?","remove-page-ref-brackets?",-276534720),cljs.core.contains_QMARK_(remove_options,new cljs.core.Keyword(null,"page-ref","page-ref",-1047131151)),new cljs.core.Keyword(null,"remove-tags?","remove-tags?",690905372),cljs.core.contains_QMARK_(remove_options,new cljs.core.Keyword(null,"tag","tag",-1290361223)),new cljs.core.Keyword(null,"keep-only-level<=N","keep-only-level<=N",-1010734857),new cljs.core.Keyword(null,"keep-only-level<=N","keep-only-level<=N",-1010734857).cljs$core$IFn$_invoke$arity$1(other_options)], null)], null)], 0));
var _STAR_opml_state_STAR__temp_val__74157 = frontend.handler.export$.opml._STAR_opml_state_STAR_;
(frontend.handler.export$.common._STAR_state_STAR_ = _STAR_state_STAR__temp_val__74156);

(frontend.handler.export$.opml._STAR_opml_state_STAR_ = _STAR_opml_state_STAR__temp_val__74157);

try{var ast = frontend.format.mldoc.__GT_edn(content,format);
var ast__$1 = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common.remove_block_ast_pos,ast);
var ast__$2 = cljs.core.vec(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common.Properties_block_ast_QMARK_,ast__$1));
var keep_level_LT__EQ_n = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"export-options","export-options",672321679),new cljs.core.Keyword(null,"keep-only-level<=N","keep-only-level<=N",-1010734857)], null));
var ast__$3 = (((keep_level_LT__EQ_n > (0)))?frontend.handler.export$.common.keep_only_level_LT__EQ_n(ast__$2,keep_level_LT__EQ_n):ast__$2);
var ast_STAR_ = frontend.handler.export$.common.replace_block_AMPERSAND_page_reference_AMPERSAND_embed(ast__$3);
var ast_STAR__STAR_ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("no-indent",cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"export-options","export-options",672321679),new cljs.core.Keyword(null,"indent-style","indent-style",855468755)], null))))?cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common.replace_Heading_with_Paragraph,ast_STAR_):ast_STAR_);
var config_for_walk_block_ast = (function (){var G__74158 = cljs.core.PersistentArrayMap.EMPTY;
var G__74158__$1 = (cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"export-options","export-options",672321679),new cljs.core.Keyword(null,"remove-emphasis?","remove-emphasis?",-1751965539)], null)))?cljs.core.update.cljs$core$IFn$_invoke$arity$4(G__74158,new cljs.core.Keyword(null,"mapcat-fns-on-inline-ast","mapcat-fns-on-inline-ast",-988900078),cljs.core.conj,frontend.handler.export$.common.remove_emphasis):G__74158);
var G__74158__$2 = (cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"export-options","export-options",672321679),new cljs.core.Keyword(null,"remove-page-ref-brackets?","remove-page-ref-brackets?",-276534720)], null)))?cljs.core.update.cljs$core$IFn$_invoke$arity$4(G__74158__$1,new cljs.core.Keyword(null,"map-fns-on-inline-ast","map-fns-on-inline-ast",-1834139513),cljs.core.conj,frontend.handler.export$.common.remove_page_ref_brackets):G__74158__$1);
var G__74158__$3 = (cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"export-options","export-options",672321679),new cljs.core.Keyword(null,"remove-tags?","remove-tags?",690905372)], null)))?cljs.core.update.cljs$core$IFn$_invoke$arity$4(G__74158__$2,new cljs.core.Keyword(null,"mapcat-fns-on-inline-ast","mapcat-fns-on-inline-ast",-988900078),cljs.core.conj,frontend.handler.export$.common.remove_tags):G__74158__$2);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("no-indent",cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"export-options","export-options",672321679),new cljs.core.Keyword(null,"indent-style","indent-style",855468755)], null)))){
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(G__74158__$3,new cljs.core.Keyword(null,"mapcat-fns-on-inline-ast","mapcat-fns-on-inline-ast",-988900078),cljs.core.conj,frontend.handler.export$.common.remove_prefix_spaces_in_Plain);
} else {
return G__74158__$3;
}
})();
var ast_STAR__STAR__STAR_ = (((!(cljs.core.empty_QMARK_(config_for_walk_block_ast))))?cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(cljs.core.partial.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common.walk_block_ast,config_for_walk_block_ast),ast_STAR__STAR_):ast_STAR__STAR_);
var hiccup = clojure.zip.root(cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(frontend.handler.export$.opml.block_ast__GT_hiccup,frontend.handler.export$.opml.init_opml_body_hiccup,ast_STAR__STAR__STAR_));
return frontend.handler.export$.opml.zip_loc__GT_opml(hiccup,title);
}finally {(frontend.handler.export$.opml._STAR_opml_state_STAR_ = _STAR_opml_state_STAR__orig_val__74155);

(frontend.handler.export$.common._STAR_state_STAR_ = _STAR_state_STAR__orig_val__74154);
}}));

(frontend.handler.export$.opml.export_helper.cljs$lang$maxFixedArity = (3));

/** @this {Function} */
(frontend.handler.export$.opml.export_helper.cljs$lang$applyTo = (function (seq74148){
var G__74149 = cljs.core.first(seq74148);
var seq74148__$1 = cljs.core.next(seq74148);
var G__74150 = cljs.core.first(seq74148__$1);
var seq74148__$2 = cljs.core.next(seq74148__$1);
var G__74151 = cljs.core.first(seq74148__$2);
var seq74148__$3 = cljs.core.next(seq74148__$2);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__74149,G__74150,G__74151,seq74148__$3);
}));

/**
 * options: see also `export-blocks-as-markdown`
 */
frontend.handler.export$.opml.export_blocks_as_opml = (function frontend$handler$export$opml$export_blocks_as_opml(repo,root_block_uuids_or_page_uuid,options){
if(((cljs.core.coll_QMARK_(root_block_uuids_or_page_uuid)) || (cljs.core.uuid_QMARK_(root_block_uuids_or_page_uuid)))){
} else {
throw (new Error("Assert failed: (or (coll? root-block-uuids-or-page-uuid) (uuid? root-block-uuids-or-page-uuid))"));
}

if(cljs.core.truth_(goog.DEBUG)){
var k__50701__auto__ = new cljs.core.Keyword(null,"export-blocks-as-opml","export-blocks-as-opml",-1592224678);
console.time(k__50701__auto__);

var res__50702__auto__ = (function (){var content = ((cljs.core.uuid_QMARK_(root_block_uuids_or_page_uuid))?frontend.handler.export$.common.get_page_content(root_block_uuids_or_page_uuid):frontend.handler.export$.common.root_block_uuids__GT_content(repo,root_block_uuids_or_page_uuid));
var title = ((cljs.core.uuid_QMARK_(root_block_uuids_or_page_uuid))?new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1((function (){var G__74159 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),root_block_uuids_or_page_uuid], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__74159) : frontend.db.entity.call(null,G__74159));
})()):"untitled");
var first_block = (function (){var and__5000__auto__ = cljs.core.coll_QMARK_(root_block_uuids_or_page_uuid);
if(and__5000__auto__){
var G__74160 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.first(root_block_uuids_or_page_uuid)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__74160) : frontend.db.entity.call(null,G__74160));
} else {
return and__5000__auto__;
}
})();
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$3(first_block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
return frontend.handler.export$.opml.export_helper.cljs$core$IFn$_invoke$arity$variadic(content,format,options,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"title","title",636505583),title], 0));
})();
console.timeEnd(k__50701__auto__);

return res__50702__auto__;
} else {
var content = ((cljs.core.uuid_QMARK_(root_block_uuids_or_page_uuid))?frontend.handler.export$.common.get_page_content(root_block_uuids_or_page_uuid):frontend.handler.export$.common.root_block_uuids__GT_content(repo,root_block_uuids_or_page_uuid));
var title = ((cljs.core.uuid_QMARK_(root_block_uuids_or_page_uuid))?new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1((function (){var G__74161 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),root_block_uuids_or_page_uuid], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__74161) : frontend.db.entity.call(null,G__74161));
})()):"untitled");
var first_block = (function (){var and__5000__auto__ = cljs.core.coll_QMARK_(root_block_uuids_or_page_uuid);
if(and__5000__auto__){
var G__74162 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.first(root_block_uuids_or_page_uuid)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__74162) : frontend.db.entity.call(null,G__74162));
} else {
return and__5000__auto__;
}
})();
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$3(first_block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
return frontend.handler.export$.opml.export_helper.cljs$core$IFn$_invoke$arity$variadic(content,format,options,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"title","title",636505583),title], 0));
}
});
/**
 * options see also `export-blocks-as-opml`
 */
frontend.handler.export$.opml.export_files_as_opml = (function frontend$handler$export$opml$export_files_as_opml(files,options){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p__74163){
var map__74164 = p__74163;
var map__74164__$1 = cljs.core.__destructure_map(map__74164);
var path = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74164__$1,new cljs.core.Keyword(null,"path","path",-188191168));
var content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74164__$1,new cljs.core.Keyword(null,"content","content",15833224));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74164__$1,new cljs.core.Keyword(null,"title","title",636505583));
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74164__$1,new cljs.core.Keyword(null,"format","format",-1306924766));
if(cljs.core.truth_((function (){var and__5000__auto__ = title;
if(cljs.core.truth_(and__5000__auto__)){
return (!(clojure.string.blank_QMARK_(content)));
} else {
return and__5000__auto__;
}
})())){
if(cljs.core.truth_(goog.DEBUG)){
var k__50701__auto__ = cljs.core.print_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"export-files-as-opml","export-files-as-opml",2137421559),path], 0));
console.time(k__50701__auto__);

var res__50702__auto__ = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [path,frontend.handler.export$.opml.export_helper.cljs$core$IFn$_invoke$arity$variadic(content,format,options,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"title","title",636505583),title], 0))], null);
console.timeEnd(k__50701__auto__);

return res__50702__auto__;
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [path,frontend.handler.export$.opml.export_helper.cljs$core$IFn$_invoke$arity$variadic(content,format,options,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"title","title",636505583),title], 0))], null);
}
} else {
return null;
}
}),files);
});
frontend.handler.export$.opml.export_repo_as_opml_BANG_ = (function frontend$handler$export$opml$export_repo_as_opml_BANG_(repo){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.export$.common._LT_get_file_contents(repo,"opml")),(function (files){
return promesa.protocols._promise(((cljs.core.seq(files))?(function (){var repo_SINGLEQUOTE_ = ((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo))?clojure.string.replace(repo,frontend.config.db_version_prefix,""):logseq.common.path.basename(repo));
var files__$1 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,frontend.handler.export$.opml.export_files_as_opml(files,null));
var zip_file_name = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(repo_SINGLEQUOTE_),"_opml_",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.quot((frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0 ? frontend.util.time_ms.cljs$core$IFn$_invoke$arity$0() : frontend.util.time_ms.call(null)),(1000)))].join('');
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.extensions.zip.make_zip(zip_file_name,files__$1,repo_SINGLEQUOTE_)),(function (zipfile){
return promesa.protocols._promise((function (){var temp__5804__auto__ = goog.dom.getElement("export-as-opml");
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

//# sourceMappingURL=frontend.handler.export.opml.js.map
