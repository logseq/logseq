goog.provide('frontend.handler.export$.common');
/**
 * dynamic var, state used for exporting
 */
frontend.handler.export$.common._STAR_state_STAR_ = new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"current-level","current-level",-11925890),(1),new cljs.core.Keyword(null,"outside-em-symbol","outside-em-symbol",478063381),null,new cljs.core.Keyword(null,"indent-after-break-line?","indent-after-break-line?",-736379041),false,new cljs.core.Keyword(null,"replace-ref-embed","replace-ref-embed",-2123548135),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"current-level","current-level",-11925890),(1),new cljs.core.Keyword(null,"block-ref-replaced?","block-ref-replaced?",-939904476),false,new cljs.core.Keyword(null,"block&page-embed-replaced?","block&page-embed-replaced?",-180485858),false], null),new cljs.core.Keyword(null,"newline-after-block","newline-after-block",137428571),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"current-block-is-first-heading-block?","current-block-is-first-heading-block?",2033274655),true], null),new cljs.core.Keyword(null,"export-options","export-options",672321679),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"indent-style","indent-style",855468755),"dashes",new cljs.core.Keyword(null,"remove-page-ref-brackets?","remove-page-ref-brackets?",-276534720),false,new cljs.core.Keyword(null,"remove-emphasis?","remove-emphasis?",-1751965539),false,new cljs.core.Keyword(null,"remove-tags?","remove-tags?",690905372),false,new cljs.core.Keyword(null,"remove-properties?","remove-properties?",1053410556),true,new cljs.core.Keyword(null,"keep-only-level<=N","keep-only-level<=N",-1010734857),new cljs.core.Keyword(null,"all","all",892129742),new cljs.core.Keyword(null,"newline-after-block","newline-after-block",137428571),false], null)], null);
frontend.handler.export$.common.get_blocks_contents = (function frontend$handler$export$common$get_blocks_contents(var_args){
var args__5732__auto__ = [];
var len__5726__auto___63876 = arguments.length;
var i__5727__auto___63877 = (0);
while(true){
if((i__5727__auto___63877 < len__5726__auto___63876)){
args__5732__auto__.push((arguments[i__5727__auto___63877]));

var G__63878 = (i__5727__auto___63877 + (1));
i__5727__auto___63877 = G__63878;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.handler.export$.common.get_blocks_contents.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.handler.export$.common.get_blocks_contents.cljs$core$IFn$_invoke$arity$variadic = (function (repo,root_block_uuid,p__63531){
var map__63532 = p__63531;
var map__63532__$1 = cljs.core.__destructure_map(map__63532);
var init_level = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__63532__$1,new cljs.core.Keyword(null,"init-level","init-level",-1605905283),(1));
var block = (function (){var G__63533 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),root_block_uuid], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__63533) : frontend.db.entity.call(null,G__63533));
})();
var link = new cljs.core.Keyword("block","link","block/link",-1872399993).cljs$core$IFn$_invoke$arity$1(block);
var block_SINGLEQUOTE_ = (function (){var or__5002__auto__ = link;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return block;
}
})();
var root_id = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block_SINGLEQUOTE_);
var blocks = (frontend.db.get_block_and_children.cljs$core$IFn$_invoke$arity$2 ? frontend.db.get_block_and_children.cljs$core$IFn$_invoke$arity$2(repo,root_id) : frontend.db.get_block_and_children.call(null,repo,root_id));
return frontend.modules.file.core.tree__GT_file_content(frontend.modules.outliner.tree.blocks__GT_vec_tree.cljs$core$IFn$_invoke$arity$variadic(repo,blocks,root_id,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"link","link",-1769163468),link], null)], 0)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"init-level","init-level",-1605905283),init_level,new cljs.core.Keyword(null,"link","link",-1769163468),link], null));
}));

(frontend.handler.export$.common.get_blocks_contents.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.handler.export$.common.get_blocks_contents.cljs$lang$applyTo = (function (seq63528){
var G__63529 = cljs.core.first(seq63528);
var seq63528__$1 = cljs.core.next(seq63528);
var G__63530 = cljs.core.first(seq63528__$1);
var seq63528__$2 = cljs.core.next(seq63528__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__63529,G__63530,seq63528__$2);
}));

frontend.handler.export$.common.root_block_uuids__GT_content = (function frontend$handler$export$common$root_block_uuids__GT_content(repo,root_block_uuids){
var contents = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (id){
return frontend.handler.export$.common.get_blocks_contents(repo,id);
}),root_block_uuids);
return clojure.string.join.cljs$core$IFn$_invoke$arity$2("\n",cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(clojure.string.trim_newline,contents));
});

frontend.handler.export$.common.block_uuid__GT_ast = (function frontend$handler$export$common$block_uuid__GT_ast(block_uuid){
var block = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,(frontend.db.get_block_by_uuid.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_block_by_uuid.cljs$core$IFn$_invoke$arity$1(block_uuid) : frontend.db.get_block_by_uuid.call(null,block_uuid)));
var content = frontend.modules.file.core.tree__GT_file_content(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"init-level","init-level",-1605905283),(1)], null));
var format = new cljs.core.Keyword(null,"markdown","markdown",1227225089);
if(cljs.core.truth_(content)){
return cljs.core.vec(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common.Properties_block_ast_QMARK_,cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common.remove_block_ast_pos,frontend.format.mldoc.__GT_edn(content,format))));
} else {
return null;
}
});
frontend.handler.export$.common.block_uuid__GT_ast_with_children = (function frontend$handler$export$common$block_uuid__GT_ast_with_children(block_uuid){
var content = frontend.handler.export$.common.get_blocks_contents(frontend.state.get_current_repo(),block_uuid);
var format = new cljs.core.Keyword(null,"markdown","markdown",1227225089);
if(cljs.core.truth_(content)){
return cljs.core.vec(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common.Properties_block_ast_QMARK_,cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common.remove_block_ast_pos,frontend.format.mldoc.__GT_edn(content,format))));
} else {
return null;
}
});
frontend.handler.export$.common.get_page_content = (function frontend$handler$export$common$get_page_content(page_uuid){
var repo = frontend.state.get_current_repo();
var db = (frontend.db.get_db.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$1(repo) : frontend.db.get_db.call(null,repo));
return frontend.common.file.core.block__GT_content(repo,db,page_uuid,null,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"export-bullet-indentation","export-bullet-indentation",-248047595),frontend.state.get_export_bullet_indentation()], null));
});
frontend.handler.export$.common.page_name__GT_ast = (function frontend$handler$export$common$page_name__GT_ast(page_name){
var page = (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page_name) : frontend.db.get_page.call(null,page_name));
var temp__5804__auto__ = frontend.handler.export$.common.get_page_content(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page));
if(cljs.core.truth_(temp__5804__auto__)){
var content = temp__5804__auto__;
if(cljs.core.truth_(content)){
var format = new cljs.core.Keyword(null,"markdown","markdown",1227225089);
return cljs.core.vec(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common.Properties_block_ast_QMARK_,cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common.remove_block_ast_pos,frontend.format.mldoc.__GT_edn(content,format))));
} else {
return null;
}
} else {
return null;
}
});
frontend.handler.export$.common.update_level_in_block_ast_coll = (function frontend$handler$export$common$update_level_in_block_ast_coll(block_ast_coll,origin_level){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (block_ast){
var vec__63535 = block_ast;
var ast_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63535,(0),null);
var ast_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63535,(1),null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(ast_type,"Heading")){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [ast_type,cljs.core.update.cljs$core$IFn$_invoke$arity$3(ast_content,new cljs.core.Keyword(null,"level","level",1290497552),(function (p1__63534_SHARP_){
return ((p1__63534_SHARP_ - (1)) + origin_level);
}))], null);
} else {
return block_ast;
}
}),block_ast_coll);
});
frontend.handler.export$.common.plain_indent_inline_ast = (function frontend$handler$export$common$plain_indent_inline_ast(var_args){
var args__5732__auto__ = [];
var len__5726__auto___63879 = arguments.length;
var i__5727__auto___63880 = (0);
while(true){
if((i__5727__auto___63880 < len__5726__auto___63879)){
args__5732__auto__.push((arguments[i__5727__auto___63880]));

var G__63881 = (i__5727__auto___63880 + (1));
i__5727__auto___63880 = G__63881;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.handler.export$.common.plain_indent_inline_ast.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.handler.export$.common.plain_indent_inline_ast.cljs$core$IFn$_invoke$arity$variadic = (function (level,p__63540){
var map__63541 = p__63540;
var map__63541__$1 = cljs.core.__destructure_map(map__63541);
var spaces = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__63541__$1,new cljs.core.Keyword(null,"spaces","spaces",365984563),"  ");
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Plain",[cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core.str,cljs.core.repeat.cljs$core$IFn$_invoke$arity$2((level - (1)),"\t"))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(spaces)].join('')], null);
}));

(frontend.handler.export$.common.plain_indent_inline_ast.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.handler.export$.common.plain_indent_inline_ast.cljs$lang$applyTo = (function (seq63538){
var G__63539 = cljs.core.first(seq63538);
var seq63538__$1 = cljs.core.next(seq63538);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__63539,seq63538__$1);
}));

frontend.handler.export$.common.mk_paragraph_ast = (function frontend$handler$export$common$mk_paragraph_ast(inline_coll,meta){
return cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Paragraph",inline_coll], null),meta);
});
frontend.handler.export$.common.priority__GT_string = (function frontend$handler$export$common$priority__GT_string(priority){
return ["[#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(priority),"]"].join('');
});
frontend.handler.export$.common.repetition_to_string = (function frontend$handler$export$common$repetition_to_string(p__63542){
var vec__63543 = p__63542;
var vec__63546 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63543,(0),null);
var kind = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63546,(0),null);
var vec__63549 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63543,(1),null);
var duration = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63549,(0),null);
var n = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63543,(2),null);
var kind__$1 = (function (){var G__63552 = kind;
switch (G__63552) {
case "Dotted":
return ".";

break;
case "Plus":
return "+";

break;
case "DoublePlus":
return "++";

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__63552)].join('')));

}
})();
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(kind__$1),cljs.core.str.cljs$core$IFn$_invoke$arity$1(n),clojure.string.lower_case(cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.first(duration)))].join('');
});
frontend.handler.export$.common.timestamp_to_string = (function frontend$handler$export$common$timestamp_to_string(p__63553){
var map__63554 = p__63553;
var map__63554__$1 = cljs.core.__destructure_map(map__63554);
var date = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63554__$1,new cljs.core.Keyword(null,"date","date",-1463434462));
var time = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63554__$1,new cljs.core.Keyword(null,"time","time",1385887882));
var repetition = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63554__$1,new cljs.core.Keyword(null,"repetition","repetition",1938392115));
var wday = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63554__$1,new cljs.core.Keyword(null,"wday","wday",-543142502));
var active = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63554__$1,new cljs.core.Keyword(null,"active","active",1895962068));
var map__63555 = date;
var map__63555__$1 = cljs.core.__destructure_map(map__63555);
var year = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63555__$1,new cljs.core.Keyword(null,"year","year",335913393));
var month = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63555__$1,new cljs.core.Keyword(null,"month","month",-1960248533));
var day = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63555__$1,new cljs.core.Keyword(null,"day","day",-274800446));
var map__63556 = time;
var map__63556__$1 = cljs.core.__destructure_map(map__63556);
var hour = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63556__$1,new cljs.core.Keyword(null,"hour","hour",-555989214));
var min = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63556__$1,new cljs.core.Keyword(null,"min","min",444991522));
var vec__63557 = (cljs.core.truth_(active)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["<",">"], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["[","]"], null));
var open = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63557,(0),null);
var close = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63557,(1),null);
var repetition__$1 = (cljs.core.truth_(repetition)?[" ",frontend.handler.export$.common.repetition_to_string(repetition)].join(''):"");
var hour__$1 = (cljs.core.truth_(hour)?frontend.util.zero_pad(hour):null);
var min__$1 = (cljs.core.truth_(min)?frontend.util.zero_pad(min):null);
var time__$1 = (cljs.core.truth_((function (){var and__5000__auto__ = hour__$1;
if(cljs.core.truth_(and__5000__auto__)){
return min__$1;
} else {
return and__5000__auto__;
}
})())?(frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3(" %s:%s",hour__$1,min__$1) : frontend.util.format.call(null," %s:%s",hour__$1,min__$1)):(cljs.core.truth_(hour__$1)?(frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(" %s",hour__$1) : frontend.util.format.call(null," %s",hour__$1)):""
));
var G__63560 = "%s%s-%s-%s %s%s%s%s";
var G__63561 = open;
var G__63562 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(year);
var G__63563 = frontend.util.zero_pad(month);
var G__63564 = frontend.util.zero_pad(day);
var G__63565 = wday;
var G__63566 = time__$1;
var G__63567 = repetition__$1;
var G__63568 = close;
return (frontend.util.format.cljs$core$IFn$_invoke$arity$9 ? frontend.util.format.cljs$core$IFn$_invoke$arity$9(G__63560,G__63561,G__63562,G__63563,G__63564,G__63565,G__63566,G__63567,G__63568) : frontend.util.format.call(null,G__63560,G__63561,G__63562,G__63563,G__63564,G__63565,G__63566,G__63567,G__63568));
});
frontend.handler.export$.common.hashtag_value__GT_string = (function frontend$handler$export$common$hashtag_value__GT_string(inline_coll){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core.str,cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (inline){
var vec__63569 = inline;
var ast_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63569,(0),null);
var ast_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63569,(1),null);
var G__63572 = ast_type;
switch (G__63572) {
case "Nested_link":
return new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(ast_content);

break;
case "Link":
return new cljs.core.Keyword(null,"full_text","full_text",1634289075).cljs$core$IFn$_invoke$arity$1(ast_content);

break;
case "Plain":
return ast_content;

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__63572)].join('')));

}
}),inline_coll));
});
frontend.handler.export$.common._LT_get_all_pages = (function frontend$handler$export$common$_LT_get_all_pages(repo){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","export-get-all-pages","thread-api/export-get-all-pages",-1366990196),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([repo], 0));
});
frontend.handler.export$.common._LT_get_debug_datoms = (function frontend$handler$export$common$_LT_get_debug_datoms(repo){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","export-get-debug-datoms","thread-api/export-get-debug-datoms",-876994180),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([repo], 0));
});
frontend.handler.export$.common._LT_get_all_page__GT_content = (function frontend$handler$export$common$_LT_get_all_page__GT_content(repo,options){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","export-get-all-page->content","thread-api/export-get-all-page->content",1294444679),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([repo,options], 0));
});
frontend.handler.export$.common._LT_get_file_contents = (function frontend$handler$export$common$_LT_get_file_contents(repo,suffix){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.export$.common._LT_get_all_page__GT_content(repo,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"export-bullet-indentation","export-bullet-indentation",-248047595),frontend.state.get_export_bullet_indentation()], null))),(function (page__GT_content){
return promesa.protocols._promise(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__63573){
var vec__63574 = p__63573;
var page_title = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63574,(0),null);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63574,(1),null);
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"path","path",-188191168),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(page_title),".",cljs.core.str.cljs$core$IFn$_invoke$arity$1(suffix)].join(''),new cljs.core.Keyword(null,"content","content",15833224),content,new cljs.core.Keyword(null,"title","title",636505583),page_title,new cljs.core.Keyword(null,"format","format",-1306924766),new cljs.core.Keyword(null,"markdown","markdown",1227225089)], null);
}),page__GT_content));
}));
}));
});
frontend.handler.export$.common.replace_block_reference_in_heading = (function frontend$handler$export$common$replace_block_reference_in_heading(p__63578){
var map__63579 = p__63578;
var map__63579__$1 = cljs.core.__destructure_map(map__63579);
var ast_content = map__63579__$1;
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63579__$1,new cljs.core.Keyword(null,"title","title",636505583));
var inline_coll = title;
var inline_coll_STAR_ = cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__63577_SHARP_){
try{if(((cljs.core.vector_QMARK_(p1__63577_SHARP_)) && ((cljs.core.count(p1__63577_SHARP_) === 2)))){
try{var p1__63577_SHARP__0__63581 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(p1__63577_SHARP_,(0));
if((p1__63577_SHARP__0__63581 === "Link")){
try{var p1__63577_SHARP__1__63582 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(p1__63577_SHARP_,(1));
if((((!((p1__63577_SHARP__1__63582 == null))))?(((((p1__63577_SHARP__1__63582.cljs$lang$protocol_mask$partition0$ & (256))) || ((cljs.core.PROTOCOL_SENTINEL === p1__63577_SHARP__1__63582.cljs$core$ILookup$))))?true:(((!p1__63577_SHARP__1__63582.cljs$lang$protocol_mask$partition0$))?cljs.core.native_satisfies_QMARK_(cljs.core.ILookup,p1__63577_SHARP__1__63582):false)):cljs.core.native_satisfies_QMARK_(cljs.core.ILookup,p1__63577_SHARP__1__63582))){
try{var p1__63577_SHARP__1__63582_url__63585 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(p1__63577_SHARP__1__63582,new cljs.core.Keyword(null,"url","url",276297046),new cljs.core.Keyword("clojure.core.match","not-found","clojure.core.match/not-found",1553053780));
if(((cljs.core.vector_QMARK_(p1__63577_SHARP__1__63582_url__63585)) && ((cljs.core.count(p1__63577_SHARP__1__63582_url__63585) === 2)))){
try{var p1__63577_SHARP__1__63582_url__63585_0__63586 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(p1__63577_SHARP__1__63582_url__63585,(0));
if((p1__63577_SHARP__1__63582_url__63585_0__63586 === "Block_ref")){
var block_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(p1__63577_SHARP__1__63582_url__63585,(1));
var vec__63594 = frontend.handler.export$.common.block_uuid__GT_ast(cljs.core.uuid(block_uuid));
var vec__63597 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63594,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63597,(0),null);
var map__63600 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63597,(1),null);
var map__63600__$1 = cljs.core.__destructure_map(map__63600);
var title_inline_coll = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63600__$1,new cljs.core.Keyword(null,"title","title",636505583));
(frontend.handler.export$.common._STAR_state_STAR_ = cljs.core.assoc_in(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"replace-ref-embed","replace-ref-embed",-2123548135),new cljs.core.Keyword(null,"block-ref-replaced?","block-ref-replaced?",-939904476)], null),true));

return title_inline_coll;
} else {
throw cljs.core.match.backtrack;

}
}catch (e63593){if((e63593 instanceof Error)){
var e__46744__auto__ = e63593;
if((e__46744__auto__ === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto__;
}
} else {
throw e63593;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e63592){if((e63592 instanceof Error)){
var e__46744__auto__ = e63592;
if((e__46744__auto__ === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto__;
}
} else {
throw e63592;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e63590){if((e63590 instanceof Error)){
var e__46744__auto__ = e63590;
if((e__46744__auto__ === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto__;
}
} else {
throw e63590;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e63589){if((e63589 instanceof Error)){
var e__46744__auto__ = e63589;
if((e__46744__auto__ === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto__;
}
} else {
throw e63589;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e63588){if((e63588 instanceof Error)){
var e__46744__auto__ = e63588;
if((e__46744__auto__ === cljs.core.match.backtrack)){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [p1__63577_SHARP_], null);
} else {
throw e__46744__auto__;
}
} else {
throw e63588;

}
}}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([inline_coll], 0)));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ast_content,new cljs.core.Keyword(null,"title","title",636505583),inline_coll_STAR_);
});
frontend.handler.export$.common.replace_block_reference_in_paragraph = (function frontend$handler$export$common$replace_block_reference_in_paragraph(inline_coll){
return cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__63601_SHARP_){
try{if(((cljs.core.vector_QMARK_(p1__63601_SHARP_)) && ((cljs.core.count(p1__63601_SHARP_) === 2)))){
try{var p1__63601_SHARP__0__63603 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(p1__63601_SHARP_,(0));
if((p1__63601_SHARP__0__63603 === "Link")){
try{var p1__63601_SHARP__1__63604 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(p1__63601_SHARP_,(1));
if((((!((p1__63601_SHARP__1__63604 == null))))?(((((p1__63601_SHARP__1__63604.cljs$lang$protocol_mask$partition0$ & (256))) || ((cljs.core.PROTOCOL_SENTINEL === p1__63601_SHARP__1__63604.cljs$core$ILookup$))))?true:(((!p1__63601_SHARP__1__63604.cljs$lang$protocol_mask$partition0$))?cljs.core.native_satisfies_QMARK_(cljs.core.ILookup,p1__63601_SHARP__1__63604):false)):cljs.core.native_satisfies_QMARK_(cljs.core.ILookup,p1__63601_SHARP__1__63604))){
try{var p1__63601_SHARP__1__63604_url__63607 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(p1__63601_SHARP__1__63604,new cljs.core.Keyword(null,"url","url",276297046),new cljs.core.Keyword("clojure.core.match","not-found","clojure.core.match/not-found",1553053780));
if(((cljs.core.vector_QMARK_(p1__63601_SHARP__1__63604_url__63607)) && ((cljs.core.count(p1__63601_SHARP__1__63604_url__63607) === 2)))){
try{var p1__63601_SHARP__1__63604_url__63607_0__63608 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(p1__63601_SHARP__1__63604_url__63607,(0));
if((p1__63601_SHARP__1__63604_url__63607_0__63608 === "Block_ref")){
var block_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(p1__63601_SHARP__1__63604_url__63607,(1));
var vec__63616 = frontend.handler.export$.common.block_uuid__GT_ast(cljs.core.uuid(block_uuid));
var vec__63619 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63616,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63619,(0),null);
var map__63622 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63619,(1),null);
var map__63622__$1 = cljs.core.__destructure_map(map__63622);
var title_inline_coll = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63622__$1,new cljs.core.Keyword(null,"title","title",636505583));
(frontend.handler.export$.common._STAR_state_STAR_ = cljs.core.assoc_in(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"replace-ref-embed","replace-ref-embed",-2123548135),new cljs.core.Keyword(null,"block-ref-replaced?","block-ref-replaced?",-939904476)], null),true));

return title_inline_coll;
} else {
throw cljs.core.match.backtrack;

}
}catch (e63615){if((e63615 instanceof Error)){
var e__46744__auto__ = e63615;
if((e__46744__auto__ === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto__;
}
} else {
throw e63615;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e63614){if((e63614 instanceof Error)){
var e__46744__auto__ = e63614;
if((e__46744__auto__ === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto__;
}
} else {
throw e63614;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e63612){if((e63612 instanceof Error)){
var e__46744__auto__ = e63612;
if((e__46744__auto__ === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto__;
}
} else {
throw e63612;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e63611){if((e63611 instanceof Error)){
var e__46744__auto__ = e63611;
if((e__46744__auto__ === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto__;
}
} else {
throw e63611;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e63610){if((e63610 instanceof Error)){
var e__46744__auto__ = e63610;
if((e__46744__auto__ === cljs.core.match.backtrack)){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [p1__63601_SHARP_], null);
} else {
throw e__46744__auto__;
}
} else {
throw e63610;

}
}}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([inline_coll], 0)));
});
frontend.handler.export$.common.replace_block_reference_in_list = (function frontend$handler$export$common$replace_block_reference_in_list(list_items){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p__63623){
var map__63624 = p__63623;
var map__63624__$1 = cljs.core.__destructure_map(map__63624);
var item = map__63624__$1;
var block_ast_coll = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63624__$1,new cljs.core.Keyword(null,"content","content",15833224));
var sub_items = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63624__$1,new cljs.core.Keyword(null,"items","items",1031954938));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(item,new cljs.core.Keyword(null,"content","content",15833224),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common.replace_block_references,block_ast_coll),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"items","items",1031954938),(frontend.handler.export$.common.replace_block_reference_in_list.cljs$core$IFn$_invoke$arity$1 ? frontend.handler.export$.common.replace_block_reference_in_list.cljs$core$IFn$_invoke$arity$1(sub_items) : frontend.handler.export$.common.replace_block_reference_in_list.call(null,sub_items))], 0));
}),list_items);
});
frontend.handler.export$.common.replace_block_reference_in_quote = (function frontend$handler$export$common$replace_block_reference_in_quote(block_ast_coll){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common.replace_block_references,block_ast_coll);
});
frontend.handler.export$.common.replace_block_reference_in_table = (function frontend$handler$export$common$replace_block_reference_in_table(p__63627){
var map__63628 = p__63627;
var map__63628__$1 = cljs.core.__destructure_map(map__63628);
var table = map__63628__$1;
var header = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63628__$1,new cljs.core.Keyword(null,"header","header",119441134));
var groups = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63628__$1,new cljs.core.Keyword(null,"groups","groups",-136896102));
var header_STAR_ = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (col){
return cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__63625_SHARP_){
try{if(((cljs.core.vector_QMARK_(p1__63625_SHARP_)) && ((cljs.core.count(p1__63625_SHARP_) === 2)))){
try{var p1__63625_SHARP__0__63630 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(p1__63625_SHARP_,(0));
if((p1__63625_SHARP__0__63630 === "Link")){
try{var p1__63625_SHARP__1__63631 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(p1__63625_SHARP_,(1));
if((((!((p1__63625_SHARP__1__63631 == null))))?(((((p1__63625_SHARP__1__63631.cljs$lang$protocol_mask$partition0$ & (256))) || ((cljs.core.PROTOCOL_SENTINEL === p1__63625_SHARP__1__63631.cljs$core$ILookup$))))?true:(((!p1__63625_SHARP__1__63631.cljs$lang$protocol_mask$partition0$))?cljs.core.native_satisfies_QMARK_(cljs.core.ILookup,p1__63625_SHARP__1__63631):false)):cljs.core.native_satisfies_QMARK_(cljs.core.ILookup,p1__63625_SHARP__1__63631))){
try{var p1__63625_SHARP__1__63631_url__63634 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(p1__63625_SHARP__1__63631,new cljs.core.Keyword(null,"url","url",276297046),new cljs.core.Keyword("clojure.core.match","not-found","clojure.core.match/not-found",1553053780));
if(((cljs.core.vector_QMARK_(p1__63625_SHARP__1__63631_url__63634)) && ((cljs.core.count(p1__63625_SHARP__1__63631_url__63634) === 2)))){
try{var p1__63625_SHARP__1__63631_url__63634_0__63635 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(p1__63625_SHARP__1__63631_url__63634,(0));
if((p1__63625_SHARP__1__63631_url__63634_0__63635 === "Block_ref")){
var block_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(p1__63625_SHARP__1__63631_url__63634,(1));
var vec__63643 = frontend.handler.export$.common.block_uuid__GT_ast(cljs.core.uuid(block_uuid));
var vec__63646 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63643,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63646,(0),null);
var map__63649 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63646,(1),null);
var map__63649__$1 = cljs.core.__destructure_map(map__63649);
var title_inline_coll = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63649__$1,new cljs.core.Keyword(null,"title","title",636505583));
(frontend.handler.export$.common._STAR_state_STAR_ = cljs.core.assoc_in(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"replace-ref-embed","replace-ref-embed",-2123548135),new cljs.core.Keyword(null,"block-ref-replaced?","block-ref-replaced?",-939904476)], null),true));

return title_inline_coll;
} else {
throw cljs.core.match.backtrack;

}
}catch (e63642){if((e63642 instanceof Error)){
var e__46744__auto__ = e63642;
if((e__46744__auto__ === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto__;
}
} else {
throw e63642;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e63641){if((e63641 instanceof Error)){
var e__46744__auto__ = e63641;
if((e__46744__auto__ === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto__;
}
} else {
throw e63641;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e63639){if((e63639 instanceof Error)){
var e__46744__auto__ = e63639;
if((e__46744__auto__ === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto__;
}
} else {
throw e63639;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e63638){if((e63638 instanceof Error)){
var e__46744__auto__ = e63638;
if((e__46744__auto__ === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto__;
}
} else {
throw e63638;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e63637){if((e63637 instanceof Error)){
var e__46744__auto__ = e63637;
if((e__46744__auto__ === cljs.core.match.backtrack)){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [p1__63625_SHARP_], null);
} else {
throw e__46744__auto__;
}
} else {
throw e63637;

}
}}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([col], 0)));
}),header);
var groups_STAR_ = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (group){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (row){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (col){
return cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__63626_SHARP_){
try{if(((cljs.core.vector_QMARK_(p1__63626_SHARP_)) && ((cljs.core.count(p1__63626_SHARP_) === 2)))){
try{var p1__63626_SHARP__0__63651 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(p1__63626_SHARP_,(0));
if((p1__63626_SHARP__0__63651 === "Link")){
try{var p1__63626_SHARP__1__63652 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(p1__63626_SHARP_,(1));
if((((!((p1__63626_SHARP__1__63652 == null))))?(((((p1__63626_SHARP__1__63652.cljs$lang$protocol_mask$partition0$ & (256))) || ((cljs.core.PROTOCOL_SENTINEL === p1__63626_SHARP__1__63652.cljs$core$ILookup$))))?true:(((!p1__63626_SHARP__1__63652.cljs$lang$protocol_mask$partition0$))?cljs.core.native_satisfies_QMARK_(cljs.core.ILookup,p1__63626_SHARP__1__63652):false)):cljs.core.native_satisfies_QMARK_(cljs.core.ILookup,p1__63626_SHARP__1__63652))){
try{var p1__63626_SHARP__1__63652_url__63655 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(p1__63626_SHARP__1__63652,new cljs.core.Keyword(null,"url","url",276297046),new cljs.core.Keyword("clojure.core.match","not-found","clojure.core.match/not-found",1553053780));
if(((cljs.core.vector_QMARK_(p1__63626_SHARP__1__63652_url__63655)) && ((cljs.core.count(p1__63626_SHARP__1__63652_url__63655) === 2)))){
try{var p1__63626_SHARP__1__63652_url__63655_0__63656 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(p1__63626_SHARP__1__63652_url__63655,(0));
if((p1__63626_SHARP__1__63652_url__63655_0__63656 === "Block_ref")){
var block_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(p1__63626_SHARP__1__63652_url__63655,(1));
var vec__63664 = frontend.handler.export$.common.block_uuid__GT_ast(cljs.core.uuid(block_uuid));
var vec__63667 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63664,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63667,(0),null);
var map__63670 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63667,(1),null);
var map__63670__$1 = cljs.core.__destructure_map(map__63670);
var title_inline_coll = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63670__$1,new cljs.core.Keyword(null,"title","title",636505583));
(frontend.handler.export$.common._STAR_state_STAR_ = cljs.core.assoc_in(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"replace-ref-embed","replace-ref-embed",-2123548135),new cljs.core.Keyword(null,"block-ref-replaced?","block-ref-replaced?",-939904476)], null),true));

return title_inline_coll;
} else {
throw cljs.core.match.backtrack;

}
}catch (e63663){if((e63663 instanceof Error)){
var e__46744__auto__ = e63663;
if((e__46744__auto__ === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto__;
}
} else {
throw e63663;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e63662){if((e63662 instanceof Error)){
var e__46744__auto__ = e63662;
if((e__46744__auto__ === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto__;
}
} else {
throw e63662;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e63660){if((e63660 instanceof Error)){
var e__46744__auto__ = e63660;
if((e__46744__auto__ === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto__;
}
} else {
throw e63660;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e63659){if((e63659 instanceof Error)){
var e__46744__auto__ = e63659;
if((e__46744__auto__ === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__46744__auto__;
}
} else {
throw e63659;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e63658){if((e63658 instanceof Error)){
var e__46744__auto__ = e63658;
if((e__46744__auto__ === cljs.core.match.backtrack)){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [p1__63626_SHARP_], null);
} else {
throw e__46744__auto__;
}
} else {
throw e63658;

}
}}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([col], 0)));
}),row);
}),group);
}),groups);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(table,new cljs.core.Keyword(null,"header","header",119441134),header_STAR_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"groups","groups",-136896102),groups_STAR_], 0));
});
frontend.handler.export$.common.replace_block_references = (function frontend$handler$export$common$replace_block_references(block_ast){
var vec__63671 = block_ast;
var ast_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63671,(0),null);
var ast_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63671,(1),null);
var G__63674 = ast_type;
switch (G__63674) {
case "Heading":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [ast_type,frontend.handler.export$.common.replace_block_reference_in_heading(ast_content)], null);

break;
case "Paragraph":
return frontend.handler.export$.common.mk_paragraph_ast(frontend.handler.export$.common.replace_block_reference_in_paragraph(ast_content),cljs.core.meta(block_ast));

break;
case "List":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [ast_type,frontend.handler.export$.common.replace_block_reference_in_list(ast_content)], null);

break;
case "Quote":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [ast_type,frontend.handler.export$.common.replace_block_reference_in_quote(ast_content)], null);

break;
case "Table":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [ast_type,frontend.handler.export$.common.replace_block_reference_in_table(ast_content)], null);

break;
default:
return block_ast;

}
});
frontend.handler.export$.common.replace_block_references_until_stable = (function frontend$handler$export$common$replace_block_references_until_stable(block_ast){
var _STAR_state_STAR__orig_val__63675 = frontend.handler.export$.common._STAR_state_STAR_;
var _STAR_state_STAR__temp_val__63676 = frontend.handler.export$.common._STAR_state_STAR_;
(frontend.handler.export$.common._STAR_state_STAR_ = _STAR_state_STAR__temp_val__63676);

try{var block_ast__$1 = block_ast;
while(true){
var block_ast_STAR_ = frontend.handler.export$.common.replace_block_references(block_ast__$1);
if(cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"replace-ref-embed","replace-ref-embed",-2123548135),new cljs.core.Keyword(null,"block-ref-replaced?","block-ref-replaced?",-939904476)], null)))){
(frontend.handler.export$.common._STAR_state_STAR_ = cljs.core.assoc_in(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"replace-ref-embed","replace-ref-embed",-2123548135),new cljs.core.Keyword(null,"block-ref-replaced?","block-ref-replaced?",-939904476)], null),false));

var G__63885 = block_ast_STAR_;
block_ast__$1 = G__63885;
continue;
} else {
return block_ast_STAR_;
}
break;
}
}finally {(frontend.handler.export$.common._STAR_state_STAR_ = _STAR_state_STAR__orig_val__63675);
}});
frontend.handler.export$.common.replace_block_embeds_helper = (function frontend$handler$export$common$replace_block_embeds_helper(current_paragraph_inlines,block_uuid,blocks_tcoll,level){
var block_uuid_STAR_ = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(block_uuid,(2),(cljs.core.count(block_uuid) - (2)));
var ast_coll = frontend.handler.export$.common.update_level_in_block_ast_coll(frontend.handler.export$.common.block_uuid__GT_ast_with_children(cljs.core.uuid(block_uuid_STAR_)),level);
var G__63678 = blocks_tcoll;
var G__63678__$1 = ((cljs.core.seq(current_paragraph_inlines))?cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(G__63678,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Paragraph",current_paragraph_inlines], null)):G__63678);
return (function (p1__63677_SHARP_){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core.conj_BANG_,p1__63677_SHARP_,ast_coll);
})(G__63678__$1);

});
frontend.handler.export$.common.replace_page_embeds_helper = (function frontend$handler$export$common$replace_page_embeds_helper(current_paragraph_inlines,page_name,blocks_tcoll,level){
var page_name_STAR_ = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(page_name,(2),(cljs.core.count(page_name) - (2)));
var ast_coll = frontend.handler.export$.common.update_level_in_block_ast_coll(frontend.handler.export$.common.page_name__GT_ast(page_name_STAR_),level);
var G__63680 = blocks_tcoll;
var G__63680__$1 = ((cljs.core.seq(current_paragraph_inlines))?cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(G__63680,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Paragraph",current_paragraph_inlines], null)):G__63680);
return (function (p1__63679_SHARP_){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core.conj_BANG_,p1__63679_SHARP_,ast_coll);
})(G__63680__$1);

});
frontend.handler.export$.common.replace_block_AMPERSAND_page_embeds_in_heading = (function frontend$handler$export$common$replace_block_AMPERSAND_page_embeds_in_heading(p__63681){
var map__63682 = p__63681;
var map__63682__$1 = cljs.core.__destructure_map(map__63682);
var ast_content = map__63682__$1;
var inline_coll = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63682__$1,new cljs.core.Keyword(null,"title","title",636505583));
var origin_level = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63682__$1,new cljs.core.Keyword(null,"level","level",1290497552));
(frontend.handler.export$.common._STAR_state_STAR_ = cljs.core.assoc_in(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"replace-ref-embed","replace-ref-embed",-2123548135),new cljs.core.Keyword(null,"current-level","current-level",-11925890)], null),origin_level));

if(cljs.core.empty_QMARK_(inline_coll)){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Heading",ast_content], null)], null);
} else {
var G__63686 = inline_coll;
var vec__63687 = G__63686;
var seq__63688 = cljs.core.seq(vec__63687);
var first__63689 = cljs.core.first(seq__63688);
var seq__63688__$1 = cljs.core.next(seq__63688);
var inline = first__63689;
var other_inlines = seq__63688__$1;
var heading_exist_QMARK_ = false;
var current_paragraph_inlines = cljs.core.PersistentVector.EMPTY;
var r = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
var G__63686__$1 = G__63686;
var heading_exist_QMARK___$1 = heading_exist_QMARK_;
var current_paragraph_inlines__$1 = current_paragraph_inlines;
var r__$1 = r;
while(true){
var vec__63703 = G__63686__$1;
var seq__63704 = cljs.core.seq(vec__63703);
var first__63705 = cljs.core.first(seq__63704);
var seq__63704__$1 = cljs.core.next(seq__63704);
var inline__$1 = first__63705;
var other_inlines__$1 = seq__63704__$1;
var heading_exist_QMARK___$2 = heading_exist_QMARK___$1;
var current_paragraph_inlines__$2 = current_paragraph_inlines__$1;
var r__$2 = r__$1;
if(cljs.core.not(inline__$1)){
return cljs.core.persistent_BANG_(((cljs.core.seq(current_paragraph_inlines__$2))?cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(r__$2,((heading_exist_QMARK___$2)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Paragraph",current_paragraph_inlines__$2], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Heading",cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ast_content,new cljs.core.Keyword(null,"title","title",636505583),current_paragraph_inlines__$2)], null))):r__$2));
} else {
if(((cljs.core.vector_QMARK_(inline__$1)) && ((cljs.core.count(inline__$1) === 2)))){
var inline_0__63707 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(inline__$1,(0));
if((inline_0__63707 === "Macro")){
var inline_1__63708 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(inline__$1,(1));
if((((!((inline_1__63708 == null))))?(((((inline_1__63708.cljs$lang$protocol_mask$partition0$ & (256))) || ((cljs.core.PROTOCOL_SENTINEL === inline_1__63708.cljs$core$ILookup$))))?true:(((!inline_1__63708.cljs$lang$protocol_mask$partition0$))?cljs.core.native_satisfies_QMARK_(cljs.core.ILookup,inline_1__63708):false)):cljs.core.native_satisfies_QMARK_(cljs.core.ILookup,inline_1__63708))){
var inline_1__63708_arguments__63712 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(inline_1__63708,new cljs.core.Keyword(null,"arguments","arguments",-1182834456),new cljs.core.Keyword("clojure.core.match","not-found","clojure.core.match/not-found",1553053780));
if(((cljs.core.vector_QMARK_(inline_1__63708_arguments__63712)) && ((cljs.core.count(inline_1__63708_arguments__63712) === 1)))){
var inline_1__63708_name__63713 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(inline_1__63708,new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword("clojure.core.match","not-found","clojure.core.match/not-found",1553053780));
if((inline_1__63708_name__63713 === "embed")){
var block_uuid_or_page_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(inline_1__63708_arguments__63712,(0));
if(((clojure.string.starts_with_QMARK_(block_uuid_or_page_name,"((")) && (clojure.string.ends_with_QMARK_(block_uuid_or_page_name,"))")))){
(frontend.handler.export$.common._STAR_state_STAR_ = cljs.core.assoc_in(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"replace-ref-embed","replace-ref-embed",-2123548135),new cljs.core.Keyword(null,"block&page-embed-replaced?","block&page-embed-replaced?",-180485858)], null),true));

var G__63886 = other_inlines__$1;
var G__63887 = true;
var G__63888 = cljs.core.PersistentVector.EMPTY;
var G__63889 = frontend.handler.export$.common.replace_block_embeds_helper(current_paragraph_inlines__$2,block_uuid_or_page_name,r__$2,origin_level);
G__63686__$1 = G__63886;
heading_exist_QMARK___$1 = G__63887;
current_paragraph_inlines__$1 = G__63888;
r__$1 = G__63889;
continue;
} else {
if(((clojure.string.starts_with_QMARK_(block_uuid_or_page_name,"[[")) && (clojure.string.ends_with_QMARK_(block_uuid_or_page_name,"]]")))){
(frontend.handler.export$.common._STAR_state_STAR_ = cljs.core.assoc_in(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"replace-ref-embed","replace-ref-embed",-2123548135),new cljs.core.Keyword(null,"block&page-embed-replaced?","block&page-embed-replaced?",-180485858)], null),true));

var G__63890 = other_inlines__$1;
var G__63891 = true;
var G__63892 = cljs.core.PersistentVector.EMPTY;
var G__63893 = frontend.handler.export$.common.replace_page_embeds_helper(current_paragraph_inlines__$2,block_uuid_or_page_name,r__$2,origin_level);
G__63686__$1 = G__63890;
heading_exist_QMARK___$1 = G__63891;
current_paragraph_inlines__$1 = G__63892;
r__$1 = G__63893;
continue;
} else {
var G__63894 = other_inlines__$1;
var G__63895 = heading_exist_QMARK___$2;
var G__63896 = current_paragraph_inlines__$2;
var G__63897 = r__$2;
G__63686__$1 = G__63894;
heading_exist_QMARK___$1 = G__63895;
current_paragraph_inlines__$1 = G__63896;
r__$1 = G__63897;
continue;

}
}
} else {
var current_paragraph_inlines_STAR_ = ((((cljs.core.empty_QMARK_(current_paragraph_inlines__$2)) && (heading_exist_QMARK___$2)))?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines__$2,frontend.handler.export$.common.plain_indent_inline_ast(origin_level)):current_paragraph_inlines__$2);
var G__63898 = other_inlines__$1;
var G__63899 = heading_exist_QMARK___$2;
var G__63900 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines_STAR_,inline__$1);
var G__63901 = r__$2;
G__63686__$1 = G__63898;
heading_exist_QMARK___$1 = G__63899;
current_paragraph_inlines__$1 = G__63900;
r__$1 = G__63901;
continue;

}
} else {
var current_paragraph_inlines_STAR_ = ((((cljs.core.empty_QMARK_(current_paragraph_inlines__$2)) && (heading_exist_QMARK___$2)))?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines__$2,frontend.handler.export$.common.plain_indent_inline_ast(origin_level)):current_paragraph_inlines__$2);
var G__63902 = other_inlines__$1;
var G__63903 = heading_exist_QMARK___$2;
var G__63904 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines_STAR_,inline__$1);
var G__63905 = r__$2;
G__63686__$1 = G__63902;
heading_exist_QMARK___$1 = G__63903;
current_paragraph_inlines__$1 = G__63904;
r__$1 = G__63905;
continue;

}
} else {
var current_paragraph_inlines_STAR_ = ((((cljs.core.empty_QMARK_(current_paragraph_inlines__$2)) && (heading_exist_QMARK___$2)))?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines__$2,frontend.handler.export$.common.plain_indent_inline_ast(origin_level)):current_paragraph_inlines__$2);
var G__63906 = other_inlines__$1;
var G__63907 = heading_exist_QMARK___$2;
var G__63908 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines_STAR_,inline__$1);
var G__63909 = r__$2;
G__63686__$1 = G__63906;
heading_exist_QMARK___$1 = G__63907;
current_paragraph_inlines__$1 = G__63908;
r__$1 = G__63909;
continue;

}
} else {
var current_paragraph_inlines_STAR_ = ((((cljs.core.empty_QMARK_(current_paragraph_inlines__$2)) && (heading_exist_QMARK___$2)))?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines__$2,frontend.handler.export$.common.plain_indent_inline_ast(origin_level)):current_paragraph_inlines__$2);
var G__63910 = other_inlines__$1;
var G__63911 = heading_exist_QMARK___$2;
var G__63912 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines_STAR_,inline__$1);
var G__63913 = r__$2;
G__63686__$1 = G__63910;
heading_exist_QMARK___$1 = G__63911;
current_paragraph_inlines__$1 = G__63912;
r__$1 = G__63913;
continue;

}
} else {
var current_paragraph_inlines_STAR_ = ((((cljs.core.empty_QMARK_(current_paragraph_inlines__$2)) && (heading_exist_QMARK___$2)))?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines__$2,frontend.handler.export$.common.plain_indent_inline_ast(origin_level)):current_paragraph_inlines__$2);
var G__63914 = other_inlines__$1;
var G__63915 = heading_exist_QMARK___$2;
var G__63916 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines_STAR_,inline__$1);
var G__63917 = r__$2;
G__63686__$1 = G__63914;
heading_exist_QMARK___$1 = G__63915;
current_paragraph_inlines__$1 = G__63916;
r__$1 = G__63917;
continue;

}
}
break;
}
}
});
frontend.handler.export$.common.replace_block_AMPERSAND_page_embeds_in_paragraph = (function frontend$handler$export$common$replace_block_AMPERSAND_page_embeds_in_paragraph(inline_coll,meta){
var current_level = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"replace-ref-embed","replace-ref-embed",-2123548135),new cljs.core.Keyword(null,"current-level","current-level",-11925890)], null));
var G__63719 = inline_coll;
var vec__63720 = G__63719;
var seq__63721 = cljs.core.seq(vec__63720);
var first__63722 = cljs.core.first(seq__63721);
var seq__63721__$1 = cljs.core.next(seq__63721);
var inline = first__63722;
var other_inlines = seq__63721__$1;
var current_paragraph_inlines = cljs.core.PersistentVector.EMPTY;
var just_after_embed_QMARK_ = false;
var blocks = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
var G__63719__$1 = G__63719;
var current_paragraph_inlines__$1 = current_paragraph_inlines;
var just_after_embed_QMARK___$1 = just_after_embed_QMARK_;
var blocks__$1 = blocks;
while(true){
var vec__63739 = G__63719__$1;
var seq__63740 = cljs.core.seq(vec__63739);
var first__63741 = cljs.core.first(seq__63740);
var seq__63740__$1 = cljs.core.next(seq__63740);
var inline__$1 = first__63741;
var other_inlines__$1 = seq__63740__$1;
var current_paragraph_inlines__$2 = current_paragraph_inlines__$1;
var just_after_embed_QMARK___$2 = just_after_embed_QMARK___$1;
var blocks__$2 = blocks__$1;
if(cljs.core.not(inline__$1)){
var vec__63742 = cljs.core.persistent_BANG_(((cljs.core.seq(current_paragraph_inlines__$2))?cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(blocks__$2,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Paragraph",current_paragraph_inlines__$2], null)):blocks__$2));
var seq__63743 = cljs.core.seq(vec__63742);
var first__63744 = cljs.core.first(seq__63743);
var seq__63743__$1 = cljs.core.next(seq__63743);
var first_block = first__63744;
var other_blocks = seq__63743__$1;
if(cljs.core.truth_(first_block)){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.vector,cljs.core.with_meta(first_block,meta),other_blocks);
} else {
return cljs.core.PersistentVector.EMPTY;
}
} else {
if(((cljs.core.vector_QMARK_(inline__$1)) && ((cljs.core.count(inline__$1) === 2)))){
var inline_0__63746 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(inline__$1,(0));
if((inline_0__63746 === "Macro")){
var inline_1__63747 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(inline__$1,(1));
if((((!((inline_1__63747 == null))))?(((((inline_1__63747.cljs$lang$protocol_mask$partition0$ & (256))) || ((cljs.core.PROTOCOL_SENTINEL === inline_1__63747.cljs$core$ILookup$))))?true:(((!inline_1__63747.cljs$lang$protocol_mask$partition0$))?cljs.core.native_satisfies_QMARK_(cljs.core.ILookup,inline_1__63747):false)):cljs.core.native_satisfies_QMARK_(cljs.core.ILookup,inline_1__63747))){
var inline_1__63747_arguments__63751 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(inline_1__63747,new cljs.core.Keyword(null,"arguments","arguments",-1182834456),new cljs.core.Keyword("clojure.core.match","not-found","clojure.core.match/not-found",1553053780));
if(((cljs.core.vector_QMARK_(inline_1__63747_arguments__63751)) && ((cljs.core.count(inline_1__63747_arguments__63751) === 1)))){
var inline_1__63747_name__63752 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(inline_1__63747,new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword("clojure.core.match","not-found","clojure.core.match/not-found",1553053780));
if((inline_1__63747_name__63752 === "embed")){
var block_uuid_or_page_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(inline_1__63747_arguments__63751,(0));
if(((clojure.string.starts_with_QMARK_(block_uuid_or_page_name,"((")) && (clojure.string.ends_with_QMARK_(block_uuid_or_page_name,"))")))){
(frontend.handler.export$.common._STAR_state_STAR_ = cljs.core.assoc_in(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"replace-ref-embed","replace-ref-embed",-2123548135),new cljs.core.Keyword(null,"block&page-embed-replaced?","block&page-embed-replaced?",-180485858)], null),true));

var G__63918 = other_inlines__$1;
var G__63919 = cljs.core.PersistentVector.EMPTY;
var G__63920 = true;
var G__63921 = frontend.handler.export$.common.replace_block_embeds_helper(current_paragraph_inlines__$2,block_uuid_or_page_name,blocks__$2,current_level);
G__63719__$1 = G__63918;
current_paragraph_inlines__$1 = G__63919;
just_after_embed_QMARK___$1 = G__63920;
blocks__$1 = G__63921;
continue;
} else {
if(((clojure.string.starts_with_QMARK_(block_uuid_or_page_name,"[[")) && (clojure.string.ends_with_QMARK_(block_uuid_or_page_name,"]]")))){
(frontend.handler.export$.common._STAR_state_STAR_ = cljs.core.assoc_in(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"replace-ref-embed","replace-ref-embed",-2123548135),new cljs.core.Keyword(null,"block&page-embed-replaced?","block&page-embed-replaced?",-180485858)], null),true));

var G__63922 = other_inlines__$1;
var G__63923 = cljs.core.PersistentVector.EMPTY;
var G__63924 = true;
var G__63925 = frontend.handler.export$.common.replace_page_embeds_helper(current_paragraph_inlines__$2,block_uuid_or_page_name,blocks__$2,current_level);
G__63719__$1 = G__63922;
current_paragraph_inlines__$1 = G__63923;
just_after_embed_QMARK___$1 = G__63924;
blocks__$1 = G__63925;
continue;
} else {
var G__63926 = other_inlines__$1;
var G__63927 = current_paragraph_inlines__$2;
var G__63928 = false;
var G__63929 = blocks__$2;
G__63719__$1 = G__63926;
current_paragraph_inlines__$1 = G__63927;
just_after_embed_QMARK___$1 = G__63928;
blocks__$1 = G__63929;
continue;

}
}
} else {
var current_paragraph_inlines_STAR_ = ((just_after_embed_QMARK___$2)?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines__$2,frontend.handler.export$.common.plain_indent_inline_ast(current_level)):current_paragraph_inlines__$2);
var G__63930 = other_inlines__$1;
var G__63931 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines_STAR_,inline__$1);
var G__63932 = false;
var G__63933 = blocks__$2;
G__63719__$1 = G__63930;
current_paragraph_inlines__$1 = G__63931;
just_after_embed_QMARK___$1 = G__63932;
blocks__$1 = G__63933;
continue;

}
} else {
var current_paragraph_inlines_STAR_ = ((just_after_embed_QMARK___$2)?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines__$2,frontend.handler.export$.common.plain_indent_inline_ast(current_level)):current_paragraph_inlines__$2);
var G__63934 = other_inlines__$1;
var G__63935 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines_STAR_,inline__$1);
var G__63936 = false;
var G__63937 = blocks__$2;
G__63719__$1 = G__63934;
current_paragraph_inlines__$1 = G__63935;
just_after_embed_QMARK___$1 = G__63936;
blocks__$1 = G__63937;
continue;

}
} else {
var current_paragraph_inlines_STAR_ = ((just_after_embed_QMARK___$2)?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines__$2,frontend.handler.export$.common.plain_indent_inline_ast(current_level)):current_paragraph_inlines__$2);
var G__63938 = other_inlines__$1;
var G__63939 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines_STAR_,inline__$1);
var G__63940 = false;
var G__63941 = blocks__$2;
G__63719__$1 = G__63938;
current_paragraph_inlines__$1 = G__63939;
just_after_embed_QMARK___$1 = G__63940;
blocks__$1 = G__63941;
continue;

}
} else {
var current_paragraph_inlines_STAR_ = ((just_after_embed_QMARK___$2)?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines__$2,frontend.handler.export$.common.plain_indent_inline_ast(current_level)):current_paragraph_inlines__$2);
var G__63942 = other_inlines__$1;
var G__63943 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines_STAR_,inline__$1);
var G__63944 = false;
var G__63945 = blocks__$2;
G__63719__$1 = G__63942;
current_paragraph_inlines__$1 = G__63943;
just_after_embed_QMARK___$1 = G__63944;
blocks__$1 = G__63945;
continue;

}
} else {
var current_paragraph_inlines_STAR_ = ((just_after_embed_QMARK___$2)?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines__$2,frontend.handler.export$.common.plain_indent_inline_ast(current_level)):current_paragraph_inlines__$2);
var G__63946 = other_inlines__$1;
var G__63947 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines_STAR_,inline__$1);
var G__63948 = false;
var G__63949 = blocks__$2;
G__63719__$1 = G__63946;
current_paragraph_inlines__$1 = G__63947;
just_after_embed_QMARK___$1 = G__63948;
blocks__$1 = G__63949;
continue;

}
}
break;
}
});
frontend.handler.export$.common.replace_block_AMPERSAND_page_embeds_in_list_helper = (function frontend$handler$export$common$replace_block_AMPERSAND_page_embeds_in_list_helper(list_items){
var _STAR_state_STAR__orig_val__63755 = frontend.handler.export$.common._STAR_state_STAR_;
var _STAR_state_STAR__temp_val__63756 = cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"replace-ref-embed","replace-ref-embed",-2123548135),new cljs.core.Keyword(null,"current-level","current-level",-11925890)], null),cljs.core.inc);
(frontend.handler.export$.common._STAR_state_STAR_ = _STAR_state_STAR__temp_val__63756);

try{return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p__63757){
var map__63758 = p__63757;
var map__63758__$1 = cljs.core.__destructure_map(map__63758);
var item = map__63758__$1;
var block_ast_coll = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63758__$1,new cljs.core.Keyword(null,"content","content",15833224));
var sub_items = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63758__$1,new cljs.core.Keyword(null,"items","items",1031954938));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(item,new cljs.core.Keyword(null,"content","content",15833224),cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(frontend.handler.export$.common.replace_block_AMPERSAND_page_embeds,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([block_ast_coll], 0))),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"items","items",1031954938),(frontend.handler.export$.common.replace_block_AMPERSAND_page_embeds_in_list_helper.cljs$core$IFn$_invoke$arity$1 ? frontend.handler.export$.common.replace_block_AMPERSAND_page_embeds_in_list_helper.cljs$core$IFn$_invoke$arity$1(sub_items) : frontend.handler.export$.common.replace_block_AMPERSAND_page_embeds_in_list_helper.call(null,sub_items))], 0));
}),list_items);
}finally {(frontend.handler.export$.common._STAR_state_STAR_ = _STAR_state_STAR__orig_val__63755);
}});
frontend.handler.export$.common.replace_block_AMPERSAND_page_embeds_in_list = (function frontend$handler$export$common$replace_block_AMPERSAND_page_embeds_in_list(list_items){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["List",frontend.handler.export$.common.replace_block_AMPERSAND_page_embeds_in_list_helper(list_items)], null)], null);
});
frontend.handler.export$.common.replace_block_AMPERSAND_page_embeds_in_quote = (function frontend$handler$export$common$replace_block_AMPERSAND_page_embeds_in_quote(block_ast_coll){
return (new cljs.core.PersistentVector(null,1,(5),cljs.core.PersistentVector.EMPTY_NODE,[(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,["Quote",cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(frontend.handler.export$.common.replace_block_AMPERSAND_page_embeds,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([block_ast_coll], 0)))],null))],null));
});
frontend.handler.export$.common.replace_block_AMPERSAND_page_embeds = (function frontend$handler$export$common$replace_block_AMPERSAND_page_embeds(block_ast){
var vec__63759 = block_ast;
var ast_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63759,(0),null);
var ast_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63759,(1),null);
var G__63762 = ast_type;
switch (G__63762) {
case "Heading":
return frontend.handler.export$.common.replace_block_AMPERSAND_page_embeds_in_heading(ast_content);

break;
case "Paragraph":
return frontend.handler.export$.common.replace_block_AMPERSAND_page_embeds_in_paragraph(ast_content,cljs.core.meta(block_ast));

break;
case "List":
return frontend.handler.export$.common.replace_block_AMPERSAND_page_embeds_in_list(ast_content);

break;
case "Quote":
return frontend.handler.export$.common.replace_block_AMPERSAND_page_embeds_in_quote(ast_content);

break;
case "Table":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_ast], null);

break;
default:
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_ast], null);

}
});
/**
 * add meta :embed-depth to the embed replaced block-ast,
 *   to avoid too deep block-ref&embed (or maybe it's a cycle)
 */
frontend.handler.export$.common.replace_block_AMPERSAND_page_reference_AMPERSAND_embed = (function frontend$handler$export$common$replace_block_AMPERSAND_page_reference_AMPERSAND_embed(block_ast_coll){
var block_ast_coll__$1 = block_ast_coll;
var result_block_ast_tcoll = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
var block_ast_coll_to_replace_references = cljs.core.PersistentVector.EMPTY;
var block_ast_coll_to_replace_embeds = cljs.core.PersistentVector.EMPTY;
while(true){
if(cljs.core.seq(block_ast_coll_to_replace_references)){
var vec__63773 = block_ast_coll_to_replace_references;
var seq__63774 = cljs.core.seq(vec__63773);
var first__63775 = cljs.core.first(seq__63774);
var seq__63774__$1 = cljs.core.next(seq__63774);
var block_ast_to_replace_ref = first__63775;
var other_block_asts_to_replace_ref = seq__63774__$1;
var embed_depth = new cljs.core.Keyword(null,"embed-depth","embed-depth",874062386).cljs$core$IFn$_invoke$arity$2(cljs.core.meta(block_ast_to_replace_ref),(0));
var block_ast_replaced = cljs.core.with_meta(frontend.handler.export$.common.replace_block_references_until_stable(block_ast_to_replace_ref),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"embed-depth","embed-depth",874062386),embed_depth], null));
if((embed_depth >= (5))){
var G__63951 = block_ast_coll__$1;
var G__63952 = cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(result_block_ast_tcoll,block_ast_replaced);
var G__63953 = cljs.core.vec(other_block_asts_to_replace_ref);
var G__63954 = block_ast_coll_to_replace_embeds;
block_ast_coll__$1 = G__63951;
result_block_ast_tcoll = G__63952;
block_ast_coll_to_replace_references = G__63953;
block_ast_coll_to_replace_embeds = G__63954;
continue;
} else {
var G__63955 = block_ast_coll__$1;
var G__63956 = result_block_ast_tcoll;
var G__63957 = cljs.core.vec(other_block_asts_to_replace_ref);
var G__63958 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(block_ast_coll_to_replace_embeds,block_ast_replaced);
block_ast_coll__$1 = G__63955;
result_block_ast_tcoll = G__63956;
block_ast_coll_to_replace_references = G__63957;
block_ast_coll_to_replace_embeds = G__63958;
continue;
}
} else {
if(cljs.core.seq(block_ast_coll_to_replace_embeds)){
var vec__63776 = block_ast_coll_to_replace_embeds;
var seq__63777 = cljs.core.seq(vec__63776);
var first__63778 = cljs.core.first(seq__63777);
var seq__63777__$1 = cljs.core.next(seq__63777);
var block_ast_to_replace_embed = first__63778;
var other_block_asts_to_replace_embed = seq__63777__$1;
var embed_depth = new cljs.core.Keyword(null,"embed-depth","embed-depth",874062386).cljs$core$IFn$_invoke$arity$2(cljs.core.meta(block_ast_to_replace_embed),(0));
var block_ast_coll_replaced = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(((function (block_ast_coll__$1,result_block_ast_tcoll,block_ast_coll_to_replace_references,block_ast_coll_to_replace_embeds,vec__63776,seq__63777,first__63778,seq__63777__$1,block_ast_to_replace_embed,other_block_asts_to_replace_embed,embed_depth){
return (function (p1__63763_SHARP_){
return cljs.core.with_meta(p1__63763_SHARP_,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"embed-depth","embed-depth",874062386),(embed_depth + (1))], null));
});})(block_ast_coll__$1,result_block_ast_tcoll,block_ast_coll_to_replace_references,block_ast_coll_to_replace_embeds,vec__63776,seq__63777,first__63778,seq__63777__$1,block_ast_to_replace_embed,other_block_asts_to_replace_embed,embed_depth))
,frontend.handler.export$.common.replace_block_AMPERSAND_page_embeds(block_ast_to_replace_embed));
if(cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"replace-ref-embed","replace-ref-embed",-2123548135),new cljs.core.Keyword(null,"block&page-embed-replaced?","block&page-embed-replaced?",-180485858)], null)))){
(frontend.handler.export$.common._STAR_state_STAR_ = cljs.core.assoc_in(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"replace-ref-embed","replace-ref-embed",-2123548135),new cljs.core.Keyword(null,"block&page-embed-replaced?","block&page-embed-replaced?",-180485858)], null),false));

var G__63959 = block_ast_coll__$1;
var G__63960 = result_block_ast_tcoll;
var G__63961 = cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(block_ast_coll_to_replace_references,block_ast_coll_replaced));
var G__63962 = cljs.core.vec(other_block_asts_to_replace_embed);
block_ast_coll__$1 = G__63959;
result_block_ast_tcoll = G__63960;
block_ast_coll_to_replace_references = G__63961;
block_ast_coll_to_replace_embeds = G__63962;
continue;
} else {
var G__63963 = block_ast_coll__$1;
var G__63964 = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core.conj_BANG_,result_block_ast_tcoll,block_ast_coll_replaced);
var G__63965 = cljs.core.vec(block_ast_coll_to_replace_references);
var G__63966 = cljs.core.vec(other_block_asts_to_replace_embed);
block_ast_coll__$1 = G__63963;
result_block_ast_tcoll = G__63964;
block_ast_coll_to_replace_references = G__63965;
block_ast_coll_to_replace_embeds = G__63966;
continue;
}
} else {
var vec__63779 = block_ast_coll__$1;
var seq__63780 = cljs.core.seq(vec__63779);
var first__63781 = cljs.core.first(seq__63780);
var seq__63780__$1 = cljs.core.next(seq__63780);
var block_ast = first__63781;
var other_block_ast = seq__63780__$1;
if(cljs.core.not(block_ast)){
return cljs.core.persistent_BANG_(result_block_ast_tcoll);
} else {
var G__63967 = other_block_ast;
var G__63968 = result_block_ast_tcoll;
var G__63969 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(block_ast_coll_to_replace_references,block_ast);
var G__63970 = cljs.core.vec(block_ast_coll_to_replace_embeds);
block_ast_coll__$1 = G__63967;
result_block_ast_tcoll = G__63968;
block_ast_coll_to_replace_references = G__63969;
block_ast_coll_to_replace_embeds = G__63970;
continue;
}

}
}
break;
}
});
/**
 * [[ast-type ast-content] _pos] -> [ast-type ast-content]
 */
frontend.handler.export$.common.remove_block_ast_pos = cljs.core.first;
frontend.handler.export$.common.Properties_block_ast_QMARK_ = (function frontend$handler$export$common$Properties_block_ast_QMARK_(p__63782){
var vec__63783 = p__63782;
var tp = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63783,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63783,(1),null);
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(tp,"Properties");
});
/**
 * works on block-ast
 *   replace all heading with paragraph when indent-style is no-indent
 */
frontend.handler.export$.common.replace_Heading_with_Paragraph = (function frontend$handler$export$common$replace_Heading_with_Paragraph(heading_ast){
var vec__63786 = heading_ast;
var heading_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63786,(0),null);
var map__63789 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63786,(1),null);
var map__63789__$1 = cljs.core.__destructure_map(map__63789);
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63789__$1,new cljs.core.Keyword(null,"title","title",636505583));
var marker = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63789__$1,new cljs.core.Keyword(null,"marker","marker",865118313));
var priority = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63789__$1,new cljs.core.Keyword(null,"priority","priority",1431093715));
var size = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63789__$1,new cljs.core.Keyword(null,"size","size",1098693007));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(heading_type,"Heading")){
var inline_coll = (function (){var G__63790 = title;
var G__63790__$1 = (cljs.core.truth_(priority)?cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Plain",[frontend.handler.export$.common.priority__GT_string(priority)," "].join('')], null),G__63790):G__63790);
var G__63790__$2 = (cljs.core.truth_(marker)?cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Plain",[cljs.core.str.cljs$core$IFn$_invoke$arity$1(marker)," "].join('')], null),G__63790__$1):G__63790__$1);
var G__63790__$3 = (cljs.core.truth_(size)?cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Plain",[cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core.str,cljs.core.repeat.cljs$core$IFn$_invoke$arity$2(size,"#")))," "].join('')], null),G__63790__$2):G__63790__$2);
return cljs.core.vec(G__63790__$3);

})();
return frontend.handler.export$.common.mk_paragraph_ast(inline_coll,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"origin-ast","origin-ast",915928394),heading_ast], null));
} else {
return heading_ast;
}
});
frontend.handler.export$.common.keep_only_level_LT__EQ_n = (function frontend$handler$export$common$keep_only_level_LT__EQ_n(block_ast_coll,n){
return cljs.core.persistent_BANG_(new cljs.core.Keyword(null,"result-ast-tcoll","result-ast-tcoll",1530092637).cljs$core$IFn$_invoke$arity$1(cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (p__63791,ast){
var map__63792 = p__63791;
var map__63792__$1 = cljs.core.__destructure_map(map__63792);
var r = map__63792__$1;
var result_ast_tcoll = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63792__$1,new cljs.core.Keyword(null,"result-ast-tcoll","result-ast-tcoll",1530092637));
var accepted_heading = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63792__$1,new cljs.core.Keyword(null,"accepted-heading","accepted-heading",-1816434288));
var vec__63793 = ast;
var heading_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63793,(0),null);
var map__63796 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63793,(1),null);
var map__63796__$1 = cljs.core.__destructure_map(map__63796);
var level = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63796__$1,new cljs.core.Keyword(null,"level","level",1290497552));
var is_heading_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(heading_type,"Heading");
if(cljs.core.truth_((function (){var and__5000__auto__ = (!(is_heading_QMARK_));
if(and__5000__auto__){
return accepted_heading;
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"result-ast-tcoll","result-ast-tcoll",1530092637),cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(result_ast_tcoll,ast),new cljs.core.Keyword(null,"accepted-heading","accepted-heading",-1816434288),accepted_heading], null);
} else {
if((((!(is_heading_QMARK_))) && (cljs.core.not(accepted_heading)))){
return r;
} else {
if(((is_heading_QMARK_) && ((level <= n)))){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"result-ast-tcoll","result-ast-tcoll",1530092637),cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(result_ast_tcoll,ast),new cljs.core.Keyword(null,"accepted-heading","accepted-heading",-1816434288),true], null);
} else {
if(((is_heading_QMARK_) && ((level > n)))){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"result-ast-tcoll","result-ast-tcoll",1530092637),result_ast_tcoll,new cljs.core.Keyword(null,"accepted-heading","accepted-heading",-1816434288),false], null);
} else {
return null;
}
}
}
}
}),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"result-ast-tcoll","result-ast-tcoll",1530092637),cljs.core.transient$(cljs.core.PersistentVector.EMPTY),new cljs.core.Keyword(null,"accepted-heading","accepted-heading",-1816434288),false], null),block_ast_coll)));
});
/**
 * :mapcat-fns-on-inline-ast
 */
frontend.handler.export$.common.remove_emphasis = (function frontend$handler$export$common$remove_emphasis(inline_ast){
var vec__63797 = inline_ast;
var ast_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63797,(0),null);
var ast_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63797,(1),null);
var G__63800 = ast_type;
switch (G__63800) {
case "Emphasis":
var vec__63801 = ast_content;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63801,(0),null);
var inline_coll = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63801,(1),null);
return inline_coll;

break;
default:
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [inline_ast], null);

}
});
/**
 * :map-fns-on-inline-ast
 */
frontend.handler.export$.common.remove_page_ref_brackets = (function frontend$handler$export$common$remove_page_ref_brackets(inline_ast){
var vec__63804 = inline_ast;
var ast_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63804,(0),null);
var ast_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63804,(1),null);
var G__63807 = ast_type;
switch (G__63807) {
case "Link":
var map__63808 = ast_content;
var map__63808__$1 = cljs.core.__destructure_map(map__63808);
var url = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63808__$1,new cljs.core.Keyword(null,"url","url",276297046));
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63808__$1,new cljs.core.Keyword(null,"label","label",1718410804));
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Page_ref",cljs.core.first(url))) && (((cljs.core.empty_QMARK_(label)) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(label,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Plain",""], null)], null))))))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Plain",cljs.core.second(url)], null);
} else {
return inline_ast;
}

break;
default:
return inline_ast;

}
});
/**
 * :mapcat-fns-on-inline-ast
 */
frontend.handler.export$.common.remove_tags = (function frontend$handler$export$common$remove_tags(inline_ast){
var vec__63809 = inline_ast;
var ast_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63809,(0),null);
var _ast_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63809,(1),null);
var G__63812 = ast_type;
switch (G__63812) {
case "Tag":
return cljs.core.PersistentVector.EMPTY;

break;
default:
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [inline_ast], null);

}
});
frontend.handler.export$.common.remove_prefix_spaces_in_Plain = (function frontend$handler$export$common$remove_prefix_spaces_in_Plain(inline_coll){
return new cljs.core.Keyword(null,"r","r",-471384190).cljs$core$IFn$_invoke$arity$1(cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (p__63813,ast){
var map__63814 = p__63813;
var map__63814__$1 = cljs.core.__destructure_map(map__63814);
var r = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63814__$1,new cljs.core.Keyword(null,"r","r",-471384190));
var after_break_line_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63814__$1,new cljs.core.Keyword(null,"after-break-line?","after-break-line?",-2088072838));
var vec__63815 = ast;
var ast_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63815,(0),null);
var ast_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63815,(1),null);
var G__63818 = ast_type;
switch (G__63818) {
case "Plain":
var trimmed_content = clojure.string.triml(ast_content);
if(cljs.core.truth_(after_break_line_QMARK_)){
if(cljs.core.empty_QMARK_(trimmed_content)){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"r","r",-471384190),r,new cljs.core.Keyword(null,"after-break-line?","after-break-line?",-2088072838),false], null);
} else {
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"r","r",-471384190),cljs.core.conj.cljs$core$IFn$_invoke$arity$2(r,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Plain",trimmed_content], null)),new cljs.core.Keyword(null,"after-break-line?","after-break-line?",-2088072838),false], null);
}
} else {
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"r","r",-471384190),cljs.core.conj.cljs$core$IFn$_invoke$arity$2(r,ast),new cljs.core.Keyword(null,"after-break-line?","after-break-line?",-2088072838),false], null);
}

break;
case "Break_Line":
case "Hard_Break_Line":
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"r","r",-471384190),cljs.core.conj.cljs$core$IFn$_invoke$arity$2(r,ast),new cljs.core.Keyword(null,"after-break-line?","after-break-line?",-2088072838),true], null);

break;
default:
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"r","r",-471384190),cljs.core.conj.cljs$core$IFn$_invoke$arity$2(r,ast),new cljs.core.Keyword(null,"after-break-line?","after-break-line?",-2088072838),false], null);

}
}),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"r","r",-471384190),cljs.core.PersistentVector.EMPTY,new cljs.core.Keyword(null,"after-break-line?","after-break-line?",-2088072838),true], null),inline_coll));
});
frontend.handler.export$.common.walk_block_ast_helper = (function frontend$handler$export$common$walk_block_ast_helper(inline_coll,map_fns_on_inline_ast,mapcat_fns_on_inline_ast,fns_on_inline_coll){
return cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__63820_SHARP_){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (inline_ast_coll,f){
return cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(f,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([inline_ast_coll], 0)));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [p1__63820_SHARP_], null),mapcat_fns_on_inline_ast);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__63819_SHARP_){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (inline_ast,f){
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(inline_ast) : f.call(null,inline_ast));
}),p1__63819_SHARP_,map_fns_on_inline_ast);
}),cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (inline_coll__$1,f){
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(inline_coll__$1) : f.call(null,inline_coll__$1));
}),inline_coll,fns_on_inline_coll))], 0)));
});
frontend.handler.export$.common.walk_block_ast_for_list = (function frontend$handler$export$common$walk_block_ast_for_list(list_items,map_fns_on_inline_ast,mapcat_fns_on_inline_ast){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p__63821){
var map__63822 = p__63821;
var map__63822__$1 = cljs.core.__destructure_map(map__63822);
var item = map__63822__$1;
var block_ast_coll = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63822__$1,new cljs.core.Keyword(null,"content","content",15833224));
var sub_items = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63822__$1,new cljs.core.Keyword(null,"items","items",1031954938));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(item,new cljs.core.Keyword(null,"content","content",15833224),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(cljs.core.partial.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common.walk_block_ast,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"map-fns-on-inline-ast","map-fns-on-inline-ast",-1834139513),map_fns_on_inline_ast,new cljs.core.Keyword(null,"mapcat-fns-on-inline-ast","mapcat-fns-on-inline-ast",-988900078),mapcat_fns_on_inline_ast], null)),block_ast_coll),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"items","items",1031954938),(frontend.handler.export$.common.walk_block_ast_for_list.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.export$.common.walk_block_ast_for_list.cljs$core$IFn$_invoke$arity$3(sub_items,map_fns_on_inline_ast,mapcat_fns_on_inline_ast) : frontend.handler.export$.common.walk_block_ast_for_list.call(null,sub_items,map_fns_on_inline_ast,mapcat_fns_on_inline_ast))], 0));
}),list_items);
});
frontend.handler.export$.common.walk_block_ast = (function frontend$handler$export$common$walk_block_ast(p__63824,block_ast){
var map__63825 = p__63824;
var map__63825__$1 = cljs.core.__destructure_map(map__63825);
var fns = map__63825__$1;
var map_fns_on_inline_ast = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63825__$1,new cljs.core.Keyword(null,"map-fns-on-inline-ast","map-fns-on-inline-ast",-1834139513));
var mapcat_fns_on_inline_ast = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63825__$1,new cljs.core.Keyword(null,"mapcat-fns-on-inline-ast","mapcat-fns-on-inline-ast",-988900078));
var fns_on_inline_coll = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63825__$1,new cljs.core.Keyword(null,"fns-on-inline-coll","fns-on-inline-coll",-2007934714));
var vec__63826 = block_ast;
var ast_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63826,(0),null);
var ast_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63826,(1),null);
var G__63829 = ast_type;
switch (G__63829) {
case "Paragraph":
return frontend.handler.export$.common.mk_paragraph_ast(frontend.handler.export$.common.walk_block_ast_helper(ast_content,map_fns_on_inline_ast,mapcat_fns_on_inline_ast,fns_on_inline_coll),cljs.core.meta(block_ast));

break;
case "Heading":
var map__63830 = ast_content;
var map__63830__$1 = cljs.core.__destructure_map(map__63830);
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63830__$1,new cljs.core.Keyword(null,"title","title",636505583));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Heading",cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ast_content,new cljs.core.Keyword(null,"title","title",636505583),frontend.handler.export$.common.walk_block_ast_helper(title,map_fns_on_inline_ast,mapcat_fns_on_inline_ast,fns_on_inline_coll))], null);

break;
case "List":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["List",frontend.handler.export$.common.walk_block_ast_for_list(ast_content,map_fns_on_inline_ast,mapcat_fns_on_inline_ast)], null);

break;
case "Quote":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Quote",cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(cljs.core.partial.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common.walk_block_ast,fns),ast_content)], null);

break;
case "Footnote_Definition":
var vec__63831 = cljs.core.rest(block_ast);
var name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63831,(0),null);
var contents = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__63831,(1),null);
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Footnote_Definition",name,frontend.handler.export$.common.walk_block_ast_helper(contents,map_fns_on_inline_ast,mapcat_fns_on_inline_ast,fns_on_inline_coll)], null);

break;
case "Table":
var map__63834 = ast_content;
var map__63834__$1 = cljs.core.__destructure_map(map__63834);
var header = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63834__$1,new cljs.core.Keyword(null,"header","header",119441134));
var groups = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__63834__$1,new cljs.core.Keyword(null,"groups","groups",-136896102));
var header_STAR_ = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__63823_SHARP_){
return frontend.handler.export$.common.walk_block_ast_helper(p1__63823_SHARP_,map_fns_on_inline_ast,mapcat_fns_on_inline_ast,fns_on_inline_coll);
}),header);
var groups_STAR_ = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (group){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (row){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (col){
return frontend.handler.export$.common.walk_block_ast_helper(col,map_fns_on_inline_ast,mapcat_fns_on_inline_ast,fns_on_inline_coll);
}),row);
}),group);
}),groups);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Table",cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(ast_content,new cljs.core.Keyword(null,"header","header",119441134),header_STAR_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"groups","groups",-136896102),groups_STAR_], 0))], null);

break;
default:
return block_ast;

}
});
frontend.handler.export$.common.simple_ast_malli_schema = malli.util.closed_schema.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"or","or",235744169),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"=","=",1152933628),new cljs.core.Keyword(null,"raw-text","raw-text",-959335662)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.Keyword(null,"string","string",-1989541586)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"=","=",1152933628),new cljs.core.Keyword(null,"space","space",348133475)], null)], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"=","=",1152933628),new cljs.core.Keyword(null,"newline","newline",1790071323)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"line-count","line-count",871713181),new cljs.core.Keyword(null,"int","int",-1741416922)], null)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"=","=",1152933628),new cljs.core.Keyword(null,"indent","indent",-148200125)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"level","level",1290497552),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"extra-space-count","extra-space-count",1763210890),new cljs.core.Keyword(null,"int","int",-1741416922)], null)], null)], null));
frontend.handler.export$.common.raw_text = (function frontend$handler$export$common$raw_text(var_args){
var args__5732__auto__ = [];
var len__5726__auto___63976 = arguments.length;
var i__5727__auto___63977 = (0);
while(true){
if((i__5727__auto___63977 < len__5726__auto___63976)){
args__5732__auto__.push((arguments[i__5727__auto___63977]));

var G__63978 = (i__5727__auto___63977 + (1));
i__5727__auto___63977 = G__63978;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.handler.export$.common.raw_text.cljs$core$IFn$_invoke$arity$variadic = (function (contents){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"raw-text","raw-text",-959335662),new cljs.core.Keyword(null,"content","content",15833224),cljs.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core.str,contents)], null);
}));

(frontend.handler.export$.common.raw_text.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(frontend.handler.export$.common.raw_text.cljs$lang$applyTo = (function (seq63835){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq63835));
}));

frontend.handler.export$.common.space = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"space","space",348133475)], null);
frontend.handler.export$.common.newline_STAR_ = (function frontend$handler$export$common$newline_STAR_(line_count){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"newline","newline",1790071323),new cljs.core.Keyword(null,"line-count","line-count",871713181),line_count], null);
});
frontend.handler.export$.common.indent = (function frontend$handler$export$common$indent(level,extra_space_count){
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"indent","indent",-148200125),new cljs.core.Keyword(null,"level","level",1290497552),level,new cljs.core.Keyword(null,"extra-space-count","extra-space-count",1763210890),extra_space_count], null);
});
frontend.handler.export$.common.simple_ast__GT_string = (function frontend$handler$export$common$simple_ast__GT_string(simple_ast){
if(cljs.core.truth_(malli.core.validate.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common.simple_ast_malli_schema,simple_ast))){
} else {
throw (new Error("Assert failed: (m/validate simple-ast-malli-schema simple-ast)"));
}

var G__63836 = new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(simple_ast);
var G__63836__$1 = (((G__63836 instanceof cljs.core.Keyword))?G__63836.fqn:null);
switch (G__63836__$1) {
case "raw-text":
return new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(simple_ast);

break;
case "space":
return " ";

break;
case "newline":
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core.str,cljs.core.repeat.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"line-count","line-count",871713181).cljs$core$IFn$_invoke$arity$1(simple_ast),"\n"));

break;
case "indent":
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core.str,cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.repeat.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"level","level",1290497552).cljs$core$IFn$_invoke$arity$1(simple_ast),"\t"),cljs.core.repeat.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"extra-space-count","extra-space-count",1763210890).cljs$core$IFn$_invoke$arity$1(simple_ast)," "))));

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__63836__$1)].join('')));

}
});
frontend.handler.export$.common.merge_adjacent_spaces_AMPERSAND_newlines = (function frontend$handler$export$common$merge_adjacent_spaces_AMPERSAND_newlines(simple_ast_coll){
var r = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
var last_ast = null;
var last_raw_text_space_suffix_QMARK_ = false;
var last_raw_text_newline_suffix_QMARK_ = false;
var G__63840 = simple_ast_coll;
var vec__63841 = G__63840;
var seq__63842 = cljs.core.seq(vec__63841);
var first__63843 = cljs.core.first(seq__63842);
var seq__63842__$1 = cljs.core.next(seq__63842);
var simple_ast = first__63843;
var other_ast_coll = seq__63842__$1;
var r__$1 = r;
var last_ast__$1 = last_ast;
var last_raw_text_space_suffix_QMARK___$1 = last_raw_text_space_suffix_QMARK_;
var last_raw_text_newline_suffix_QMARK___$1 = last_raw_text_newline_suffix_QMARK_;
var G__63840__$1 = G__63840;
while(true){
var r__$2 = r__$1;
var last_ast__$2 = last_ast__$1;
var last_raw_text_space_suffix_QMARK___$2 = last_raw_text_space_suffix_QMARK___$1;
var last_raw_text_newline_suffix_QMARK___$2 = last_raw_text_newline_suffix_QMARK___$1;
var vec__63860 = G__63840__$1;
var seq__63861 = cljs.core.seq(vec__63860);
var first__63862 = cljs.core.first(seq__63861);
var seq__63861__$1 = cljs.core.next(seq__63861);
var simple_ast__$1 = first__63862;
var other_ast_coll__$1 = seq__63861__$1;
if((simple_ast__$1 == null)){
return cljs.core.persistent_BANG_((cljs.core.truth_(last_ast__$2)?cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(r__$2,last_ast__$2):r__$2));
} else {
var tp = new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(simple_ast__$1);
var last_ast_type = new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(last_ast__$2);
var G__63863 = tp;
var G__63863__$1 = (((G__63863 instanceof cljs.core.Keyword))?G__63863.fqn:null);
switch (G__63863__$1) {
case "space":
if(cljs.core.truth_((function (){var or__5002__auto__ = cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"space","space",348133475),null,new cljs.core.Keyword(null,"indent","indent",-148200125),null,new cljs.core.Keyword(null,"newline","newline",1790071323),null], null), null),last_ast_type);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = last_raw_text_space_suffix_QMARK___$2;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return last_raw_text_newline_suffix_QMARK___$2;
}
}
})())){
var G__63981 = r__$2;
var G__63982 = last_ast__$2;
var G__63983 = last_raw_text_space_suffix_QMARK___$2;
var G__63984 = last_raw_text_newline_suffix_QMARK___$2;
var G__63985 = other_ast_coll__$1;
r__$1 = G__63981;
last_ast__$1 = G__63982;
last_raw_text_space_suffix_QMARK___$1 = G__63983;
last_raw_text_newline_suffix_QMARK___$1 = G__63984;
G__63840__$1 = G__63985;
continue;
} else {
var G__63986 = (cljs.core.truth_(last_ast__$2)?cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(r__$2,last_ast__$2):r__$2);
var G__63987 = simple_ast__$1;
var G__63988 = false;
var G__63989 = false;
var G__63990 = other_ast_coll__$1;
r__$1 = G__63986;
last_ast__$1 = G__63987;
last_raw_text_space_suffix_QMARK___$1 = G__63988;
last_raw_text_newline_suffix_QMARK___$1 = G__63989;
G__63840__$1 = G__63990;
continue;
}

break;
case "newline":
var G__63864 = last_ast_type;
var G__63864__$1 = (((G__63864 instanceof cljs.core.Keyword))?G__63864.fqn:null);
switch (G__63864__$1) {
case "space":
case "indent":
var G__63992 = r__$2;
var G__63993 = simple_ast__$1;
var G__63994 = false;
var G__63995 = false;
var G__63996 = other_ast_coll__$1;
r__$1 = G__63992;
last_ast__$1 = G__63993;
last_raw_text_space_suffix_QMARK___$1 = G__63994;
last_raw_text_newline_suffix_QMARK___$1 = G__63995;
G__63840__$1 = G__63996;
continue;

break;
case "newline":
var last_newline_count = new cljs.core.Keyword(null,"line-count","line-count",871713181).cljs$core$IFn$_invoke$arity$1(last_ast__$2);
var current_newline_count = new cljs.core.Keyword(null,"line-count","line-count",871713181).cljs$core$IFn$_invoke$arity$1(simple_ast__$1);
var kept_ast = (((last_newline_count > current_newline_count))?last_ast__$2:simple_ast__$1);
var G__63997 = r__$2;
var G__63998 = kept_ast;
var G__63999 = false;
var G__64000 = false;
var G__64001 = other_ast_coll__$1;
r__$1 = G__63997;
last_ast__$1 = G__63998;
last_raw_text_space_suffix_QMARK___$1 = G__63999;
last_raw_text_newline_suffix_QMARK___$1 = G__64000;
G__63840__$1 = G__64001;
continue;

break;
case "raw-text":
if(cljs.core.truth_(last_raw_text_newline_suffix_QMARK___$2)){
var G__64002 = r__$2;
var G__64003 = last_ast__$2;
var G__64004 = last_raw_text_space_suffix_QMARK___$2;
var G__64005 = last_raw_text_newline_suffix_QMARK___$2;
var G__64006 = other_ast_coll__$1;
r__$1 = G__64002;
last_ast__$1 = G__64003;
last_raw_text_space_suffix_QMARK___$1 = G__64004;
last_raw_text_newline_suffix_QMARK___$1 = G__64005;
G__63840__$1 = G__64006;
continue;
} else {
var G__64007 = (cljs.core.truth_(last_ast__$2)?cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(r__$2,last_ast__$2):r__$2);
var G__64008 = simple_ast__$1;
var G__64009 = false;
var G__64010 = false;
var G__64011 = other_ast_coll__$1;
r__$1 = G__64007;
last_ast__$1 = G__64008;
last_raw_text_space_suffix_QMARK___$1 = G__64009;
last_raw_text_newline_suffix_QMARK___$1 = G__64010;
G__63840__$1 = G__64011;
continue;
}

break;
default:
var G__64012 = r__$2;
var G__64013 = simple_ast__$1;
var G__64014 = false;
var G__64015 = false;
var G__64016 = other_ast_coll__$1;
r__$1 = G__64012;
last_ast__$1 = G__64013;
last_raw_text_space_suffix_QMARK___$1 = G__64014;
last_raw_text_newline_suffix_QMARK___$1 = G__64015;
G__63840__$1 = G__64016;
continue;

}

break;
case "indent":
var G__63865 = last_ast_type;
var G__63865__$1 = (((G__63865 instanceof cljs.core.Keyword))?G__63865.fqn:null);
switch (G__63865__$1) {
case "space":
case "indent":
var G__64018 = r__$2;
var G__64019 = simple_ast__$1;
var G__64020 = false;
var G__64021 = false;
var G__64022 = other_ast_coll__$1;
r__$1 = G__64018;
last_ast__$1 = G__64019;
last_raw_text_space_suffix_QMARK___$1 = G__64020;
last_raw_text_newline_suffix_QMARK___$1 = G__64021;
G__63840__$1 = G__64022;
continue;

break;
case "newline":
var G__64023 = (cljs.core.truth_(last_ast__$2)?cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(r__$2,last_ast__$2):r__$2);
var G__64024 = simple_ast__$1;
var G__64025 = false;
var G__64026 = false;
var G__64027 = other_ast_coll__$1;
r__$1 = G__64023;
last_ast__$1 = G__64024;
last_raw_text_space_suffix_QMARK___$1 = G__64025;
last_raw_text_newline_suffix_QMARK___$1 = G__64026;
G__63840__$1 = G__64027;
continue;

break;
case "raw-text":
if(cljs.core.truth_(last_raw_text_space_suffix_QMARK___$2)){
var G__64028 = r__$2;
var G__64029 = last_ast__$2;
var G__64030 = last_raw_text_space_suffix_QMARK___$2;
var G__64031 = last_raw_text_newline_suffix_QMARK___$2;
var G__64032 = other_ast_coll__$1;
r__$1 = G__64028;
last_ast__$1 = G__64029;
last_raw_text_space_suffix_QMARK___$1 = G__64030;
last_raw_text_newline_suffix_QMARK___$1 = G__64031;
G__63840__$1 = G__64032;
continue;
} else {
var G__64033 = (cljs.core.truth_(last_ast__$2)?cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(r__$2,last_ast__$2):r__$2);
var G__64034 = simple_ast__$1;
var G__64035 = false;
var G__64036 = false;
var G__64037 = other_ast_coll__$1;
r__$1 = G__64033;
last_ast__$1 = G__64034;
last_raw_text_space_suffix_QMARK___$1 = G__64035;
last_raw_text_newline_suffix_QMARK___$1 = G__64036;
G__63840__$1 = G__64037;
continue;
}

break;
default:
var G__64038 = r__$2;
var G__64039 = simple_ast__$1;
var G__64040 = false;
var G__64041 = false;
var G__64042 = other_ast_coll__$1;
r__$1 = G__64038;
last_ast__$1 = G__64039;
last_raw_text_space_suffix_QMARK___$1 = G__64040;
last_raw_text_newline_suffix_QMARK___$1 = G__64041;
G__63840__$1 = G__64042;
continue;

}

break;
case "raw-text":
var content = new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(simple_ast__$1);
var empty_content_QMARK_ = cljs.core.empty_QMARK_(content);
var first_ch = cljs.core.first(content);
var last_ch = (function (){var num = cljs.core.count(content);
if((num > (0))){
return cljs.core.nth.cljs$core$IFn$_invoke$arity$2(content,(num - (1)));
} else {
return null;
}
})();
var newline_prefix_QMARK_ = (function (){var G__63866 = first_ch;
var G__63866__$1 = (((G__63866 == null))?null:(function (){var fexpr__63867 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["\r",null,"\n",null], null), null);
return (fexpr__63867.cljs$core$IFn$_invoke$arity$1 ? fexpr__63867.cljs$core$IFn$_invoke$arity$1(G__63866) : fexpr__63867.call(null,G__63866));
})());
if((G__63866__$1 == null)){
return null;
} else {
return cljs.core.boolean$(G__63866__$1);
}
})();
var newline_suffix_QMARK_ = (function (){var G__63868 = last_ch;
var G__63868__$1 = (((G__63868 == null))?null:(function (){var fexpr__63869 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, ["\n",null], null), null);
return (fexpr__63869.cljs$core$IFn$_invoke$arity$1 ? fexpr__63869.cljs$core$IFn$_invoke$arity$1(G__63868) : fexpr__63869.call(null,G__63868));
})());
if((G__63868__$1 == null)){
return null;
} else {
return cljs.core.boolean$(G__63868__$1);
}
})();
var space_prefix_QMARK_ = (function (){var G__63870 = first_ch;
var G__63870__$1 = (((G__63870 == null))?null:(function (){var fexpr__63871 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [" ",null], null), null);
return (fexpr__63871.cljs$core$IFn$_invoke$arity$1 ? fexpr__63871.cljs$core$IFn$_invoke$arity$1(G__63870) : fexpr__63871.call(null,G__63870));
})());
if((G__63870__$1 == null)){
return null;
} else {
return cljs.core.boolean$(G__63870__$1);
}
})();
var space_suffix_QMARK_ = (function (){var G__63872 = last_ch;
var G__63872__$1 = (((G__63872 == null))?null:(function (){var fexpr__63873 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [" ",null], null), null);
return (fexpr__63873.cljs$core$IFn$_invoke$arity$1 ? fexpr__63873.cljs$core$IFn$_invoke$arity$1(G__63872) : fexpr__63873.call(null,G__63872));
})());
if((G__63872__$1 == null)){
return null;
} else {
return cljs.core.boolean$(G__63872__$1);
}
})();
if(empty_content_QMARK_){
var G__64043 = r__$2;
var G__64044 = last_ast__$2;
var G__64045 = last_raw_text_space_suffix_QMARK___$2;
var G__64046 = last_raw_text_newline_suffix_QMARK___$2;
var G__64047 = other_ast_coll__$1;
r__$1 = G__64043;
last_ast__$1 = G__64044;
last_raw_text_space_suffix_QMARK___$1 = G__64045;
last_raw_text_newline_suffix_QMARK___$1 = G__64046;
G__63840__$1 = G__64047;
continue;
} else {
if(cljs.core.truth_(newline_prefix_QMARK_)){
var G__63874 = last_ast_type;
var G__63874__$1 = (((G__63874 instanceof cljs.core.Keyword))?G__63874.fqn:null);
switch (G__63874__$1) {
case "space":
case "indent":
case "newline":
var G__64049 = r__$2;
var G__64050 = simple_ast__$1;
var G__64051 = space_suffix_QMARK_;
var G__64052 = newline_suffix_QMARK_;
var G__64053 = other_ast_coll__$1;
r__$1 = G__64049;
last_ast__$1 = G__64050;
last_raw_text_space_suffix_QMARK___$1 = G__64051;
last_raw_text_newline_suffix_QMARK___$1 = G__64052;
G__63840__$1 = G__64053;
continue;

break;
case "raw-text":
var G__64054 = (cljs.core.truth_(last_ast__$2)?cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(r__$2,last_ast__$2):r__$2);
var G__64055 = simple_ast__$1;
var G__64056 = space_suffix_QMARK_;
var G__64057 = newline_suffix_QMARK_;
var G__64058 = other_ast_coll__$1;
r__$1 = G__64054;
last_ast__$1 = G__64055;
last_raw_text_space_suffix_QMARK___$1 = G__64056;
last_raw_text_newline_suffix_QMARK___$1 = G__64057;
G__63840__$1 = G__64058;
continue;

break;
default:
var G__64059 = r__$2;
var G__64060 = simple_ast__$1;
var G__64061 = space_suffix_QMARK_;
var G__64062 = newline_suffix_QMARK_;
var G__64063 = other_ast_coll__$1;
r__$1 = G__64059;
last_ast__$1 = G__64060;
last_raw_text_space_suffix_QMARK___$1 = G__64061;
last_raw_text_newline_suffix_QMARK___$1 = G__64062;
G__63840__$1 = G__64063;
continue;

}
} else {
if(cljs.core.truth_(space_prefix_QMARK_)){
var G__63875 = last_ast_type;
var G__63875__$1 = (((G__63875 instanceof cljs.core.Keyword))?G__63875.fqn:null);
switch (G__63875__$1) {
case "space":
case "indent":
var G__64065 = r__$2;
var G__64066 = simple_ast__$1;
var G__64067 = space_suffix_QMARK_;
var G__64068 = newline_suffix_QMARK_;
var G__64069 = other_ast_coll__$1;
r__$1 = G__64065;
last_ast__$1 = G__64066;
last_raw_text_space_suffix_QMARK___$1 = G__64067;
last_raw_text_newline_suffix_QMARK___$1 = G__64068;
G__63840__$1 = G__64069;
continue;

break;
case "newline":
case "raw-text":
var G__64070 = (cljs.core.truth_(last_ast__$2)?cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(r__$2,last_ast__$2):r__$2);
var G__64071 = simple_ast__$1;
var G__64072 = space_suffix_QMARK_;
var G__64073 = newline_suffix_QMARK_;
var G__64074 = other_ast_coll__$1;
r__$1 = G__64070;
last_ast__$1 = G__64071;
last_raw_text_space_suffix_QMARK___$1 = G__64072;
last_raw_text_newline_suffix_QMARK___$1 = G__64073;
G__63840__$1 = G__64074;
continue;

break;
default:
var G__64075 = r__$2;
var G__64076 = simple_ast__$1;
var G__64077 = space_suffix_QMARK_;
var G__64078 = newline_suffix_QMARK_;
var G__64079 = other_ast_coll__$1;
r__$1 = G__64075;
last_ast__$1 = G__64076;
last_raw_text_space_suffix_QMARK___$1 = G__64077;
last_raw_text_newline_suffix_QMARK___$1 = G__64078;
G__63840__$1 = G__64079;
continue;

}
} else {
var G__64080 = (cljs.core.truth_(last_ast__$2)?cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(r__$2,last_ast__$2):r__$2);
var G__64081 = simple_ast__$1;
var G__64082 = space_suffix_QMARK_;
var G__64083 = newline_suffix_QMARK_;
var G__64084 = other_ast_coll__$1;
r__$1 = G__64080;
last_ast__$1 = G__64081;
last_raw_text_space_suffix_QMARK___$1 = G__64082;
last_raw_text_newline_suffix_QMARK___$1 = G__64083;
G__63840__$1 = G__64084;
continue;

}
}
}

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__63863__$1)].join('')));

}
}
break;
}
});
frontend.handler.export$.common.simple_asts__GT_string = (function frontend$handler$export$common$simple_asts__GT_string(simple_ast_coll){
return clojure.string.join.cljs$core$IFn$_invoke$arity$1(cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common.simple_ast__GT_string,frontend.handler.export$.common.merge_adjacent_spaces_AMPERSAND_newlines(frontend.handler.export$.common.merge_adjacent_spaces_AMPERSAND_newlines(simple_ast_coll))));
});

//# sourceMappingURL=frontend.handler.export.common.js.map
