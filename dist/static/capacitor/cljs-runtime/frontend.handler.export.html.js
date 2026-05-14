goog.provide('frontend.handler.export$.html');
frontend.handler.export$.html.hiccup_malli_schema = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"cat","cat",-1457810207),new cljs.core.Keyword(null,"keyword","keyword",811389747),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"*","*",-1294732318),new cljs.core.Keyword(null,"any","any",1705907423)], null)], null);
frontend.handler.export$.html.branch_QMARK_ = (function frontend$handler$export$html$branch_QMARK_(node){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"ul","ul",-1349521403),cljs.core.first(node));
});
frontend.handler.export$.html.ul_hiccup_zip = (function frontend$handler$export$html$ul_hiccup_zip(root){
return clojure.zip.zipper(frontend.handler.export$.html.branch_QMARK_,cljs.core.rest,(function (node,children){
return cljs.core.with_meta(cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.vector,new cljs.core.Keyword(null,"ul","ul",-1349521403),children),cljs.core.meta(node));
}),root);
});
frontend.handler.export$.html.empty_ul_hiccup = frontend.handler.export$.html.ul_hiccup_zip(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ul","ul",-1349521403),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"placeholder","placeholder",-104873083)], null)], null));
/**
 * [:ul [:li ]
 */
frontend.handler.export$.html.add_same_level_li_at_right = (function frontend$handler$export$html$add_same_level_li_at_right(loc){
return clojure.zip.right(clojure.zip.insert_right(loc,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921)], null)));
});
frontend.handler.export$.html.add_next_level_li_at_right = (function frontend$handler$export$html$add_next_level_li_at_right(loc){
return clojure.zip.down(clojure.zip.right(clojure.zip.insert_right(loc,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ul","ul",-1349521403),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921)], null)], null))));
});
frontend.handler.export$.html.add_next_level_ul_at_right = (function frontend$handler$export$html$add_next_level_ul_at_right(loc){
return clojure.zip.down(clojure.zip.right(clojure.zip.insert_right(loc,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ul","ul",-1349521403)], null))));
});
frontend.handler.export$.html.replace_same_level_li = (function frontend$handler$export$html$replace_same_level_li(loc){
return clojure.zip.replace(loc,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921)], null));
});
frontend.handler.export$.html.add_items_in_li = (function frontend$handler$export$html$add_items_in_li(loc,items){
return clojure.zip.edit(loc,(function (li){
return cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(li,items));
}));
});

frontend.handler.export$.html.inline_emphasis = (function frontend$handler$export$html$inline_emphasis(p__64085){
var vec__64086 = p__64085;
var vec__64089 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64086,(0),null);
var type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64089,(0),null);
var inline_coll = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64086,(1),null);
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.vector,(function (){var G__64092 = type;
switch (G__64092) {
case "Bold":
return new cljs.core.Keyword(null,"b","b",1482224470);

break;
case "Italic":
return new cljs.core.Keyword(null,"i","i",-1386841315);

break;
case "Underline":
return new cljs.core.Keyword(null,"ins","ins",-1021983570);

break;
case "Strike_through":
return new cljs.core.Keyword(null,"del","del",574975584);

break;
case "Highlight":
return new cljs.core.Keyword(null,"mark","mark",-373816345);

break;
default:
return new cljs.core.Keyword(null,"b","b",1482224470);

}
})(),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.html.inline_ast__GT_hiccup,inline_coll));
});
frontend.handler.export$.html.inline_tag = (function frontend$handler$export$html$inline_tag(inline_coll){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a","a",-2123407586),["#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.handler.export$.common.hashtag_value__GT_string(inline_coll))].join('')], null);
});
frontend.handler.export$.html.inline_link = (function frontend$handler$export$html$inline_link(p__64093){
var map__64094 = p__64093;
var map__64094__$1 = cljs.core.__destructure_map(map__64094);
var url = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64094__$1,new cljs.core.Keyword(null,"url","url",276297046));
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64094__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var full_text = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64094__$1,new cljs.core.Keyword(null,"full_text","full_text",1634289075));
var href = (function (){var G__64095 = cljs.core.first(url);
switch (G__64095) {
case "Search":
return cljs.core.second(url);

break;
case "Complex":
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"protocol","protocol",652470118).cljs$core$IFn$_invoke$arity$1(cljs.core.second(url))),"://",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"link","link",-1769163468).cljs$core$IFn$_invoke$arity$1(cljs.core.second(url)))].join('');

break;
default:
return null;

}
})();
var G__64096 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a","a",-2123407586)], null);
var G__64096__$1 = (cljs.core.truth_(href)?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__64096,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"href","href",-793805698),href], null)):G__64096);
var G__64096__$2 = (cljs.core.truth_(href)?cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(G__64096__$1,cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.html.inline_ast__GT_hiccup,label))):G__64096__$1);
if(cljs.core.not(href)){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__64096__$2,full_text);
} else {
return G__64096__$2;
}
});
frontend.handler.export$.html.inline_nested_link = (function frontend$handler$export$html$inline_nested_link(p__64097){
var map__64098 = p__64097;
var map__64098__$1 = cljs.core.__destructure_map(map__64098);
var content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64098__$1,new cljs.core.Keyword(null,"content","content",15833224));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a","a",-2123407586),content], null);
});
frontend.handler.export$.html.inline_subscript = (function frontend$handler$export$html$inline_subscript(inline_coll){
return cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"sub","sub",-2093760025)], null),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.html.inline_ast__GT_hiccup,inline_coll)));
});
frontend.handler.export$.html.inline_superscript = (function frontend$handler$export$html$inline_superscript(inline_coll){
return cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"sup","sup",-2039492346)], null),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.html.inline_ast__GT_hiccup,inline_coll)));
});
frontend.handler.export$.html.inline_footnote_reference = (function frontend$handler$export$html$inline_footnote_reference(p__64099){
var map__64100 = p__64099;
var map__64100__$1 = cljs.core.__destructure_map(map__64100);
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64100__$1,new cljs.core.Keyword(null,"name","name",1843675177));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"sup","sup",-2039492346),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a","a",-2123407586),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"href","href",-793805698),["#fnd.",cljs.core.str.cljs$core$IFn$_invoke$arity$1(name)].join('')], null),name], null)], null);
});
frontend.handler.export$.html.inline_cookie = (function frontend$handler$export$html$inline_cookie(ast_content){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),(function (){var G__64101 = cljs.core.first(ast_content);
switch (G__64101) {
case "Absolute":
var vec__64102 = ast_content;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64102,(0),null);
var current = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64102,(1),null);
var total = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64102,(2),null);
return ["[",cljs.core.str.cljs$core$IFn$_invoke$arity$1(current),"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(total),"]"].join('');

break;
case "Percent":
return ["[",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.second(ast_content)),"%]"].join('');

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__64101)].join('')));

}
})()], null);
});
frontend.handler.export$.html.inline_latex_fragment = (function frontend$handler$export$html$inline_latex_fragment(ast_content){
var vec__64105 = ast_content;
var type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64105,(0),null);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64105,(1),null);
var wrapper = (function (){var G__64108 = type;
switch (G__64108) {
case "Inline":
return "$";

break;
case "Displayed":
return "$$";

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__64108)].join('')));

}
})();
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(wrapper),cljs.core.str.cljs$core$IFn$_invoke$arity$1(content),cljs.core.str.cljs$core$IFn$_invoke$arity$1(wrapper)].join('')], null);
});
frontend.handler.export$.html.inline_macro = (function frontend$handler$export$html$inline_macro(p__64109){
var map__64110 = p__64109;
var map__64110__$1 = cljs.core.__destructure_map(map__64110);
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64110__$1,new cljs.core.Keyword(null,"name","name",1843675177));
var arguments$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64110__$1,new cljs.core.Keyword(null,"arguments","arguments",-1182834456));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"code","code",1586293142),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(name,"cloze"))?clojure.string.join.cljs$core$IFn$_invoke$arity$2(",",arguments$):(function (){var l = (function (){var G__64111 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["{{",name], null);
var G__64111__$1 = (((cljs.core.count(arguments$) > (0)))?cljs.core.conj.cljs$core$IFn$_invoke$arity$variadic(G__64111,"(",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([clojure.string.join.cljs$core$IFn$_invoke$arity$2(",",arguments$),")"], 0)):G__64111);
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__64111__$1,"}}");

})();
return clojure.string.join.cljs$core$IFn$_invoke$arity$1(l);
})())], null);
});
frontend.handler.export$.html.inline_entity = (function frontend$handler$export$html$inline_entity(p__64112){
var map__64113 = p__64112;
var map__64113__$1 = cljs.core.__destructure_map(map__64113);
var unicode = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64113__$1,new cljs.core.Keyword(null,"unicode","unicode",-542572710));
return unicode;
});
frontend.handler.export$.html.inline_timestamp = (function frontend$handler$export$html$inline_timestamp(ast_content){
var vec__64114 = ast_content;
var type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64114,(0),null);
var timestamp_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64114,(1),null);
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"span","span",1394872991),clojure.string.join.cljs$core$IFn$_invoke$arity$1((function (){var G__64117 = type;
switch (G__64117) {
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
var map__64118 = timestamp_content;
var map__64118__$1 = cljs.core.__destructure_map(map__64118);
var start = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64118__$1,new cljs.core.Keyword(null,"start","start",-355208981));
var stop = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64118__$1,new cljs.core.Keyword(null,"stop","stop",-2140911342));
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.handler.export$.common.timestamp_to_string(start)),"--",cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.handler.export$.common.timestamp_to_string(stop))].join('')], null);

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__64117)].join('')));

}
})())],null));
});
frontend.handler.export$.html.inline_email = (function frontend$handler$export$html$inline_email(p__64119){
var map__64120 = p__64119;
var map__64120__$1 = cljs.core.__destructure_map(map__64120);
var local_part = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64120__$1,new cljs.core.Keyword(null,"local_part","local_part",-1705904558));
var domain = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64120__$1,new cljs.core.Keyword(null,"domain","domain",1847214937));
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(local_part),"@",cljs.core.str.cljs$core$IFn$_invoke$arity$1(domain)].join('');
});
frontend.handler.export$.html.block_paragraph = (function frontend$handler$export$html$block_paragraph(loc,inline_coll){
return frontend.handler.export$.html.add_items_in_li(frontend.handler.export$.zip_helper.goto_last(loc),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.vector,new cljs.core.Keyword(null,"p","p",151049309),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.html.inline_ast__GT_hiccup,inline_coll))], null));
});
frontend.handler.export$.html.block_heading = (function frontend$handler$export$html$block_heading(loc,p__64121){
var map__64122 = p__64121;
var map__64122__$1 = cljs.core.__destructure_map(map__64122);
var _meta = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64122__$1,new cljs.core.Keyword(null,"_meta","_meta",937543236));
var marker = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64122__$1,new cljs.core.Keyword(null,"marker","marker",865118313));
var _size = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64122__$1,new cljs.core.Keyword(null,"_size","_size",-746489012));
var _anchor = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64122__$1,new cljs.core.Keyword(null,"_anchor","_anchor",-1041309458));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64122__$1,new cljs.core.Keyword(null,"title","title",636505583));
var level = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64122__$1,new cljs.core.Keyword(null,"level","level",1290497552));
var priority = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64122__$1,new cljs.core.Keyword(null,"priority","priority",1431093715));
var _tags = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64122__$1,new cljs.core.Keyword(null,"_tags","_tags",58828915));
var _numbering = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64122__$1,new cljs.core.Keyword(null,"_numbering","_numbering",1825467892));
var _unordered = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64122__$1,new cljs.core.Keyword(null,"_unordered","_unordered",1249595382));
var loc__$1 = frontend.handler.export$.zip_helper.goto_last(loc);
var current_level = frontend.handler.export$.zip_helper.get_level(loc__$1);
var title_STAR_ = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.html.inline_ast__GT_hiccup,title);
var items = (function (){var G__64123 = cljs.core.PersistentVector.EMPTY;
var G__64123__$1 = (cljs.core.truth_(marker)?cljs.core.conj.cljs$core$IFn$_invoke$arity$variadic(G__64123,marker,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([" "], 0)):G__64123);
var G__64123__$2 = (cljs.core.truth_(priority)?cljs.core.conj.cljs$core$IFn$_invoke$arity$variadic(G__64123__$1,frontend.handler.export$.common.priority__GT_string(priority),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([" "], 0)):G__64123__$1);
return cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(G__64123__$2,title_STAR_));

})();
if((level > current_level)){
return frontend.handler.export$.html.add_items_in_li(frontend.handler.export$.html.add_next_level_li_at_right(loc__$1),items);
} else {
return frontend.handler.export$.html.add_items_in_li(frontend.handler.export$.html.add_same_level_li_at_right(clojure.zip.rightmost(frontend.handler.export$.zip_helper.goto_level(loc__$1,level))),items);
}
});
frontend.handler.export$.html.block_list_item = (function frontend$handler$export$html$block_list_item(loc,p__64124){
var map__64125 = p__64124;
var map__64125__$1 = cljs.core.__destructure_map(map__64125);
var content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64125__$1,new cljs.core.Keyword(null,"content","content",15833224));
var items = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64125__$1,new cljs.core.Keyword(null,"items","items",1031954938));
var current_level = frontend.handler.export$.zip_helper.get_level(loc);
var loc_STAR_ = (((clojure.zip.node(loc) == null))?frontend.handler.export$.html.replace_same_level_li(loc):frontend.handler.export$.html.add_same_level_li_at_right(loc));
var loc_STAR__STAR_ = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(frontend.handler.export$.html.block_ast__GT_hiccup,loc_STAR_,content);
var loc_STAR__STAR__STAR_ = ((cljs.core.seq(items))?(frontend.handler.export$.html.block_list.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.export$.html.block_list.cljs$core$IFn$_invoke$arity$2(loc_STAR__STAR_,items) : frontend.handler.export$.html.block_list.call(null,loc_STAR__STAR_,items)):loc_STAR__STAR_);
return clojure.zip.rightmost(frontend.handler.export$.zip_helper.goto_level(loc_STAR__STAR__STAR_,current_level));
});
frontend.handler.export$.html.block_list = (function frontend$handler$export$html$block_list(loc,list_items){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(frontend.handler.export$.html.block_list_item,frontend.handler.export$.html.add_next_level_ul_at_right(loc),list_items);
});
frontend.handler.export$.html.block_example = (function frontend$handler$export$html$block_example(loc,str_coll){
return frontend.handler.export$.html.add_items_in_li(loc,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"pre","pre",2118456869),str_coll], null)], null));
});
frontend.handler.export$.html.block_src = (function frontend$handler$export$html$block_src(loc,p__64126){
var map__64127 = p__64126;
var map__64127__$1 = cljs.core.__destructure_map(map__64127);
var language = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64127__$1,new cljs.core.Keyword(null,"language","language",-1591107564));
var lines = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64127__$1,new cljs.core.Keyword(null,"lines","lines",-700165781));
var code = (function (){var G__64128 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"pre","pre",2118456869)], null);
var G__64128__$1 = (((!((language == null))))?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__64128,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data-lang","data-lang",969460304),language], null)):G__64128);
return cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(G__64128__$1,lines));

})();
return frontend.handler.export$.html.add_items_in_li(loc,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [code], null));
});
frontend.handler.export$.html.block_quote = (function frontend$handler$export$html$block_quote(loc,block_ast_coll){
return frontend.handler.export$.html.add_items_in_li(loc,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [clojure.zip.root(cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(frontend.handler.export$.html.block_ast__GT_hiccup,frontend.handler.export$.zip_helper.goto_last(frontend.handler.export$.html.ul_hiccup_zip(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"blockquote","blockquote",372264190)], null))),block_ast_coll))], null));
});
frontend.handler.export$.html.block_latex_env = (function frontend$handler$export$html$block_latex_env(loc,p__64130){
var vec__64131 = p__64130;
var name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64131,(0),null);
var options = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64131,(1),null);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64131,(2),null);
return frontend.handler.export$.html.add_items_in_li(loc,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"pre","pre",2118456869),["\\begin{",cljs.core.str.cljs$core$IFn$_invoke$arity$1(name),"}",cljs.core.str.cljs$core$IFn$_invoke$arity$1(options)].join(''),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"br","br",934104792)], null),content,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"br","br",934104792)], null),["\\end{",cljs.core.str.cljs$core$IFn$_invoke$arity$1(name),"}"].join('')], null)], null));
});
frontend.handler.export$.html.block_displayed_math = (function frontend$handler$export$html$block_displayed_math(loc,s){
return frontend.handler.export$.html.add_items_in_li(loc,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),s], null)], null));
});
frontend.handler.export$.html.block_footnote_definition = (function frontend$handler$export$html$block_footnote_definition(loc,p__64134){
var vec__64135 = p__64134;
var name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64135,(0),null);
var inline_coll = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64135,(1),null);
var inline_hiccup_coll = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.html.inline_ast__GT_hiccup,inline_coll);
return frontend.handler.export$.html.add_items_in_li(loc,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632)], null),inline_hiccup_coll,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"sup","sup",-2039492346),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"id","id",-1388402092),["fnd.",cljs.core.str.cljs$core$IFn$_invoke$arity$1(name)].join('')], null),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(name),"\u21A9"].join('')], null)], null)], 0)))], null));
});
frontend.handler.export$.html.block_table = (function frontend$handler$export$html$block_table(loc,p__64138){
var map__64139 = p__64138;
var map__64139__$1 = cljs.core.__destructure_map(map__64139);
var header = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64139__$1,new cljs.core.Keyword(null,"header","header",119441134));
var groups = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64139__$1,new cljs.core.Keyword(null,"groups","groups",-136896102));
var header_STAR_ = cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tr","tr",-1424774646)], null),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (col){
return cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"th","th",-545608566)], null),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.html.inline_ast__GT_hiccup,col)));
}),header)));
var groups_STAR_ = cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (group){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (row){
return cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tr","tr",-1424774646)], null),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (col){
return cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"td","td",1479933353)], null),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.html.inline_ast__GT_hiccup,col)));
}),row)));
}),group);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([groups], 0)));
return frontend.handler.export$.html.add_items_in_li(loc,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"table","table",-564943036),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),"width:100%"], null),header_STAR_], null),groups_STAR_))], null));
});
frontend.handler.export$.html.block_comment = (function frontend$handler$export$html$block_comment(loc,s){
return frontend.handler.export$.html.add_items_in_li(loc,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [["<!---\n",cljs.core.str.cljs$core$IFn$_invoke$arity$1(s),"\n-->\n"].join('')], null));
});
malli.core._register_function_schema_BANG_.cljs$core$IFn$_invoke$arity$6(new cljs.core.Symbol(null,"frontend.handler.export.html","frontend.handler.export.html",-208279680,null),new cljs.core.Symbol(null,"inline-ast->hiccup","inline-ast->hiccup",-1223929282,null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"=>","=>",1841166128),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"cat","cat",-1457810207),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"sequential","sequential",-1082983960),new cljs.core.Keyword(null,"any","any",1705907423)], null)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"or","or",235744169),frontend.handler.export$.html.hiccup_malli_schema,new cljs.core.Keyword(null,"string","string",-1989541586),new cljs.core.Keyword(null,"nil","nil",99600501)], null)], null),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"file","file",-1269645878),"frontend/handler/export/html.cljs",new cljs.core.Keyword(null,"line","line",212345235),278,new cljs.core.Keyword(null,"column","column",2078222095),7,new cljs.core.Keyword(null,"end-line","end-line",1837326455),278,new cljs.core.Keyword(null,"end-column","end-column",1425389514),25], null),new cljs.core.Keyword(null,"cljs","cljs",1492417629),cljs.core.identity);

frontend.handler.export$.html.inline_ast__GT_hiccup = (function frontend$handler$export$html$inline_ast__GT_hiccup(inline_ast){
var vec__64143 = inline_ast;
var ast_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64143,(0),null);
var ast_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64143,(1),null);
var G__64146 = ast_type;
switch (G__64146) {
case "Emphasis":
return frontend.handler.export$.html.inline_emphasis(ast_content);

break;
case "Break_Line":
case "Hard_Break_Line":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"br","br",934104792)], null);

break;
case "Verbatim":
case "Code":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"code","code",1586293142),ast_content], null);

break;
case "Tag":
return frontend.handler.export$.html.inline_tag(ast_content);

break;
case "Spaces":
return null;

break;
case "Plain":
return ast_content;

break;
case "Link":
return frontend.handler.export$.html.inline_link(ast_content);

break;
case "Nested_link":
return frontend.handler.export$.html.inline_nested_link(ast_content);

break;
case "Target":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a","a",-2123407586),ast_content], null);

break;
case "Subscript":
return frontend.handler.export$.html.inline_subscript(ast_content);

break;
case "Superscript":
return frontend.handler.export$.html.inline_superscript(ast_content);

break;
case "Footnote_Reference":
return frontend.handler.export$.html.inline_footnote_reference(ast_content);

break;
case "Cookie":
return frontend.handler.export$.html.inline_cookie(ast_content);

break;
case "Latex_Fragment":
return frontend.handler.export$.html.inline_latex_fragment(ast_content);

break;
case "Macro":
return frontend.handler.export$.html.inline_macro(ast_content);

break;
case "Entity":
return frontend.handler.export$.html.inline_entity(ast_content);

break;
case "Timestamp":
return frontend.handler.export$.html.inline_timestamp(ast_content);

break;
case "Email":
return frontend.handler.export$.html.inline_email(ast_content);

break;
case "Inline_Hiccup":
return clojure.edn.read_string.cljs$core$IFn$_invoke$arity$1(ast_content);

break;
case "Radio_Target":
case "Inline_Html":
case "Export_Snippet":
case "Inline_Source_Block":
return null;

break;
default:
throw (new Error(["Assert failed: ",[cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"inline-ast->simple-ast","inline-ast->simple-ast",-258439344))," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ast_type)," not implemented yet"].join(''),"\n","false"].join('')));


}
});
malli.core._register_function_schema_BANG_.cljs$core$IFn$_invoke$arity$6(new cljs.core.Symbol(null,"frontend.handler.export.html","frontend.handler.export.html",-208279680,null),new cljs.core.Symbol(null,"block-ast->hiccup","block-ast->hiccup",-1990488835,null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"=>","=>",1841166128),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"cat","cat",-1457810207),new cljs.core.Keyword(null,"some","some",-1951079573),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"sequential","sequential",-1082983960),new cljs.core.Keyword(null,"any","any",1705907423)], null)], null),new cljs.core.Keyword(null,"some","some",-1951079573)], null),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"file","file",-1269645878),"frontend/handler/export/html.cljs",new cljs.core.Keyword(null,"line","line",212345235),325,new cljs.core.Keyword(null,"column","column",2078222095),7,new cljs.core.Keyword(null,"end-line","end-line",1837326455),325,new cljs.core.Keyword(null,"end-column","end-column",1425389514),24], null),new cljs.core.Keyword(null,"cljs","cljs",1492417629),cljs.core.identity);

frontend.handler.export$.html.block_ast__GT_hiccup = (function frontend$handler$export$html$block_ast__GT_hiccup(loc,block_ast){
var vec__64147 = block_ast;
var ast_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64147,(0),null);
var ast_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64147,(1),null);
var G__64150 = ast_type;
switch (G__64150) {
case "Paragraph":
return frontend.handler.export$.html.block_paragraph(loc,ast_content);

break;
case "Paragraph_line":
throw (new Error(["Assert failed: ","Paragraph_line is mldoc internal ast","\n","false"].join('')));


break;
case "Paragraph_Sep":
return frontend.handler.export$.html.add_items_in_li(frontend.handler.export$.zip_helper.goto_last(loc),cljs.core.repeat.cljs$core$IFn$_invoke$arity$2(ast_content,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"br","br",934104792)], null)));

break;
case "Heading":
return frontend.handler.export$.html.block_heading(loc,ast_content);

break;
case "List":
return frontend.handler.export$.html.block_list(loc,ast_content);

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
return frontend.handler.export$.html.block_example(loc,ast_content);

break;
case "Src":
return frontend.handler.export$.html.block_src(loc,ast_content);

break;
case "Quote":
return frontend.handler.export$.html.block_quote(loc,ast_content);

break;
case "Latex_Fragment":
return frontend.handler.export$.html.add_items_in_li(loc,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.export$.html.inline_latex_fragment(ast_content)], null));

break;
case "Latex_Environment":
return frontend.handler.export$.html.block_latex_env(loc,cljs.core.rest(block_ast));

break;
case "Displayed_Math":
return frontend.handler.export$.html.block_displayed_math(loc,ast_content);

break;
case "Drawer":
return loc;

break;
case "Footnote_Definition":
return frontend.handler.export$.html.block_footnote_definition(loc,cljs.core.rest(block_ast));

break;
case "Horizontal_Rule":
return frontend.handler.export$.html.add_items_in_li(loc,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"hr","hr",1377740067)], null)], null));

break;
case "Table":
return frontend.handler.export$.html.block_table(loc,ast_content);

break;
case "Comment":
return frontend.handler.export$.html.block_comment(loc,ast_content);

break;
case "Raw_Html":
return loc;

break;
case "Hiccup":
return frontend.handler.export$.html.add_items_in_li(loc,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [clojure.edn.read_string.cljs$core$IFn$_invoke$arity$1(ast_content)], null));

break;
default:
throw (new Error(["Assert failed: ",[cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"block-ast->simple-ast","block-ast->simple-ast",1296273434))," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ast_type)," not implemented yet"].join(''),"\n","false"].join('')));


}
});
frontend.handler.export$.html.export_helper = (function frontend$handler$export$html$export_helper(content,format,options){
var remove_options = cljs.core.set(new cljs.core.Keyword(null,"remove-options","remove-options",768737839).cljs$core$IFn$_invoke$arity$1(options));
var other_options = new cljs.core.Keyword(null,"other-options","other-options",170412142).cljs$core$IFn$_invoke$arity$1(options);
var _STAR_state_STAR__orig_val__64151 = frontend.handler.export$.common._STAR_state_STAR_;
var _STAR_state_STAR__temp_val__64152 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"export-options","export-options",672321679),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"remove-emphasis?","remove-emphasis?",-1751965539),cljs.core.contains_QMARK_(remove_options,new cljs.core.Keyword(null,"emphasis","emphasis",293543451)),new cljs.core.Keyword(null,"remove-page-ref-brackets?","remove-page-ref-brackets?",-276534720),cljs.core.contains_QMARK_(remove_options,new cljs.core.Keyword(null,"page-ref","page-ref",-1047131151)),new cljs.core.Keyword(null,"remove-tags?","remove-tags?",690905372),cljs.core.contains_QMARK_(remove_options,new cljs.core.Keyword(null,"tag","tag",-1290361223)),new cljs.core.Keyword(null,"keep-only-level<=N","keep-only-level<=N",-1010734857),new cljs.core.Keyword(null,"keep-only-level<=N","keep-only-level<=N",-1010734857).cljs$core$IFn$_invoke$arity$1(other_options)], null)], null)], 0));
(frontend.handler.export$.common._STAR_state_STAR_ = _STAR_state_STAR__temp_val__64152);

try{var ast = (cljs.core.truth_(goog.DEBUG)?(function (){var k__50701__auto__ = new cljs.core.Keyword("mldoc","->edn","mldoc/->edn",449358288);
console.time(k__50701__auto__);

var res__50702__auto__ = frontend.format.mldoc.__GT_edn(content,format);
console.timeEnd(k__50701__auto__);

return res__50702__auto__;
})():frontend.format.mldoc.__GT_edn(content,format));
var ast__$1 = (cljs.core.truth_(goog.DEBUG)?(function (){var k__50701__auto__ = new cljs.core.Keyword(null,"remove-pos","remove-pos",-1295249337);
console.time(k__50701__auto__);

var res__50702__auto__ = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common.remove_block_ast_pos,ast);
console.timeEnd(k__50701__auto__);

return res__50702__auto__;
})():cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common.remove_block_ast_pos,ast));
var ast__$2 = cljs.core.vec(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common.Properties_block_ast_QMARK_,ast__$1));
var keep_level_LT__EQ_n = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"export-options","export-options",672321679),new cljs.core.Keyword(null,"keep-only-level<=N","keep-only-level<=N",-1010734857)], null));
var ast__$3 = (((keep_level_LT__EQ_n > (0)))?frontend.handler.export$.common.keep_only_level_LT__EQ_n(ast__$2,keep_level_LT__EQ_n):ast__$2);
var ast_STAR_ = (cljs.core.truth_(goog.DEBUG)?(function (){var k__50701__auto__ = new cljs.core.Keyword(null,"replace-block&page-reference&embed","replace-block&page-reference&embed",-1580340851);
console.time(k__50701__auto__);

var res__50702__auto__ = frontend.handler.export$.common.replace_block_AMPERSAND_page_reference_AMPERSAND_embed(ast__$3);
console.timeEnd(k__50701__auto__);

return res__50702__auto__;
})():frontend.handler.export$.common.replace_block_AMPERSAND_page_reference_AMPERSAND_embed(ast__$3));
var ast_STAR__STAR_ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("no-indent",cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"export-options","export-options",672321679),new cljs.core.Keyword(null,"indent-style","indent-style",855468755)], null))))?(cljs.core.truth_(goog.DEBUG)?(function (){var k__50701__auto__ = new cljs.core.Keyword(null,"replace-Heading-with-Paragraph","replace-Heading-with-Paragraph",208437324);
console.time(k__50701__auto__);

var res__50702__auto__ = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common.replace_Heading_with_Paragraph,ast_STAR_);
console.timeEnd(k__50701__auto__);

return res__50702__auto__;
})():cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common.replace_Heading_with_Paragraph,ast_STAR_)):ast_STAR_);
var config_for_walk_block_ast = (function (){var G__64154 = cljs.core.PersistentArrayMap.EMPTY;
var G__64154__$1 = (cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"export-options","export-options",672321679),new cljs.core.Keyword(null,"remove-emphasis?","remove-emphasis?",-1751965539)], null)))?cljs.core.update.cljs$core$IFn$_invoke$arity$4(G__64154,new cljs.core.Keyword(null,"mapcat-fns-on-inline-ast","mapcat-fns-on-inline-ast",-988900078),cljs.core.conj,frontend.handler.export$.common.remove_emphasis):G__64154);
var G__64154__$2 = (cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"export-options","export-options",672321679),new cljs.core.Keyword(null,"remove-page-ref-brackets?","remove-page-ref-brackets?",-276534720)], null)))?cljs.core.update.cljs$core$IFn$_invoke$arity$4(G__64154__$1,new cljs.core.Keyword(null,"map-fns-on-inline-ast","map-fns-on-inline-ast",-1834139513),cljs.core.conj,frontend.handler.export$.common.remove_page_ref_brackets):G__64154__$1);
var G__64154__$3 = (cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"export-options","export-options",672321679),new cljs.core.Keyword(null,"remove-tags?","remove-tags?",690905372)], null)))?cljs.core.update.cljs$core$IFn$_invoke$arity$4(G__64154__$2,new cljs.core.Keyword(null,"mapcat-fns-on-inline-ast","mapcat-fns-on-inline-ast",-988900078),cljs.core.conj,frontend.handler.export$.common.remove_tags):G__64154__$2);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("no-indent",cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"export-options","export-options",672321679),new cljs.core.Keyword(null,"indent-style","indent-style",855468755)], null)))){
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(G__64154__$3,new cljs.core.Keyword(null,"mapcat-fns-on-inline-ast","mapcat-fns-on-inline-ast",-988900078),cljs.core.conj,frontend.handler.export$.common.remove_prefix_spaces_in_Plain);
} else {
return G__64154__$3;
}
})();
var ast_STAR__STAR__STAR_ = (((!(cljs.core.empty_QMARK_(config_for_walk_block_ast))))?(cljs.core.truth_(goog.DEBUG)?(function (){var k__50701__auto__ = new cljs.core.Keyword(null,"walk-block-ast","walk-block-ast",-1260424195);
console.time(k__50701__auto__);

var res__50702__auto__ = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(cljs.core.partial.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common.walk_block_ast,config_for_walk_block_ast),ast_STAR__STAR_);
console.timeEnd(k__50701__auto__);

return res__50702__auto__;
})():cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(cljs.core.partial.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common.walk_block_ast,config_for_walk_block_ast),ast_STAR__STAR_)):ast_STAR__STAR_);
var hiccup = (cljs.core.truth_(goog.DEBUG)?(function (){var k__50701__auto__ = new cljs.core.Keyword(null,"block-ast->hiccup","block-ast->hiccup",663946934);
console.time(k__50701__auto__);

var res__50702__auto__ = clojure.zip.root(cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(frontend.handler.export$.html.block_ast__GT_hiccup,frontend.handler.export$.html.empty_ul_hiccup,ast_STAR__STAR__STAR_));
console.timeEnd(k__50701__auto__);

return res__50702__auto__;
})():clojure.zip.root(cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(frontend.handler.export$.html.block_ast__GT_hiccup,frontend.handler.export$.html.empty_ul_hiccup,ast_STAR__STAR__STAR_)));
var hiccup_STAR_ = cljs.core.vec(cljs.core.cons(new cljs.core.Keyword(null,"ul","ul",-1349521403),cljs.core.drop.cljs$core$IFn$_invoke$arity$2((2),hiccup)));
return module$frontend$utils.prettifyXml(hiccups.runtime.render_html(hiccup_STAR_));
}finally {(frontend.handler.export$.common._STAR_state_STAR_ = _STAR_state_STAR__orig_val__64151);
}});
/**
 * options: see also `export-blocks-as-markdown`
 */
frontend.handler.export$.html.export_blocks_as_html = (function frontend$handler$export$html$export_blocks_as_html(repo,root_block_uuids_or_page_uuid,options){
if(((cljs.core.coll_QMARK_(root_block_uuids_or_page_uuid)) || (cljs.core.uuid_QMARK_(root_block_uuids_or_page_uuid)))){
} else {
throw (new Error("Assert failed: (or (coll? root-block-uuids-or-page-uuid) (uuid? root-block-uuids-or-page-uuid))"));
}

var content = ((cljs.core.uuid_QMARK_(root_block_uuids_or_page_uuid))?frontend.handler.export$.common.get_page_content(root_block_uuids_or_page_uuid):frontend.handler.export$.common.root_block_uuids__GT_content(repo,root_block_uuids_or_page_uuid));
var first_block = (function (){var and__5000__auto__ = cljs.core.coll_QMARK_(root_block_uuids_or_page_uuid);
if(and__5000__auto__){
var G__64156 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.first(root_block_uuids_or_page_uuid)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__64156) : frontend.db.entity.call(null,G__64156));
} else {
return and__5000__auto__;
}
})();
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$3(first_block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
return frontend.handler.export$.html.export_helper(content,format,options);
});

//# sourceMappingURL=frontend.handler.export.html.js.map
