goog.provide('frontend.handler.export$.common');
/**
 * dynamic var, state used for exporting
 */
frontend.handler.export$.common._STAR_state_STAR_ = new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"current-level","current-level",-11925890),(1),new cljs.core.Keyword(null,"outside-em-symbol","outside-em-symbol",478063381),null,new cljs.core.Keyword(null,"indent-after-break-line?","indent-after-break-line?",-736379041),false,new cljs.core.Keyword(null,"replace-ref-embed","replace-ref-embed",-2123548135),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"current-level","current-level",-11925890),(1),new cljs.core.Keyword(null,"block-ref-replaced?","block-ref-replaced?",-939904476),false,new cljs.core.Keyword(null,"block&page-embed-replaced?","block&page-embed-replaced?",-180485858),false], null),new cljs.core.Keyword(null,"newline-after-block","newline-after-block",137428571),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"current-block-is-first-heading-block?","current-block-is-first-heading-block?",2033274655),true], null),new cljs.core.Keyword(null,"export-options","export-options",672321679),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"indent-style","indent-style",855468755),"dashes",new cljs.core.Keyword(null,"remove-page-ref-brackets?","remove-page-ref-brackets?",-276534720),false,new cljs.core.Keyword(null,"remove-emphasis?","remove-emphasis?",-1751965539),false,new cljs.core.Keyword(null,"remove-tags?","remove-tags?",690905372),false,new cljs.core.Keyword(null,"remove-properties?","remove-properties?",1053410556),true,new cljs.core.Keyword(null,"keep-only-level<=N","keep-only-level<=N",-1010734857),new cljs.core.Keyword(null,"all","all",892129742),new cljs.core.Keyword(null,"newline-after-block","newline-after-block",137428571),false], null)], null);
frontend.handler.export$.common.get_blocks_contents = (function frontend$handler$export$common$get_blocks_contents(var_args){
var args__5732__auto__ = [];
var len__5726__auto___103098 = arguments.length;
var i__5727__auto___103099 = (0);
while(true){
if((i__5727__auto___103099 < len__5726__auto___103098)){
args__5732__auto__.push((arguments[i__5727__auto___103099]));

var G__103100 = (i__5727__auto___103099 + (1));
i__5727__auto___103099 = G__103100;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.handler.export$.common.get_blocks_contents.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.handler.export$.common.get_blocks_contents.cljs$core$IFn$_invoke$arity$variadic = (function (repo,root_block_uuid,p__102730){
var map__102731 = p__102730;
var map__102731__$1 = cljs.core.__destructure_map(map__102731);
var init_level = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__102731__$1,new cljs.core.Keyword(null,"init-level","init-level",-1605905283),(1));
var block = (function (){var G__102732 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),root_block_uuid], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__102732) : frontend.db.entity.call(null,G__102732));
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
(frontend.handler.export$.common.get_blocks_contents.cljs$lang$applyTo = (function (seq102727){
var G__102728 = cljs.core.first(seq102727);
var seq102727__$1 = cljs.core.next(seq102727);
var G__102729 = cljs.core.first(seq102727__$1);
var seq102727__$2 = cljs.core.next(seq102727__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__102728,G__102729,seq102727__$2);
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
var vec__102734 = block_ast;
var ast_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102734,(0),null);
var ast_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102734,(1),null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(ast_type,"Heading")){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [ast_type,cljs.core.update.cljs$core$IFn$_invoke$arity$3(ast_content,new cljs.core.Keyword(null,"level","level",1290497552),(function (p1__102733_SHARP_){
return ((p1__102733_SHARP_ - (1)) + origin_level);
}))], null);
} else {
return block_ast;
}
}),block_ast_coll);
});
frontend.handler.export$.common.plain_indent_inline_ast = (function frontend$handler$export$common$plain_indent_inline_ast(var_args){
var args__5732__auto__ = [];
var len__5726__auto___103102 = arguments.length;
var i__5727__auto___103103 = (0);
while(true){
if((i__5727__auto___103103 < len__5726__auto___103102)){
args__5732__auto__.push((arguments[i__5727__auto___103103]));

var G__103104 = (i__5727__auto___103103 + (1));
i__5727__auto___103103 = G__103104;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.handler.export$.common.plain_indent_inline_ast.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.handler.export$.common.plain_indent_inline_ast.cljs$core$IFn$_invoke$arity$variadic = (function (level,p__102739){
var map__102740 = p__102739;
var map__102740__$1 = cljs.core.__destructure_map(map__102740);
var spaces = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__102740__$1,new cljs.core.Keyword(null,"spaces","spaces",365984563),"  ");
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Plain",[cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core.str,cljs.core.repeat.cljs$core$IFn$_invoke$arity$2((level - (1)),"\t"))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(spaces)].join('')], null);
}));

(frontend.handler.export$.common.plain_indent_inline_ast.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.handler.export$.common.plain_indent_inline_ast.cljs$lang$applyTo = (function (seq102737){
var G__102738 = cljs.core.first(seq102737);
var seq102737__$1 = cljs.core.next(seq102737);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__102738,seq102737__$1);
}));

frontend.handler.export$.common.mk_paragraph_ast = (function frontend$handler$export$common$mk_paragraph_ast(inline_coll,meta){
return cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Paragraph",inline_coll], null),meta);
});
frontend.handler.export$.common.priority__GT_string = (function frontend$handler$export$common$priority__GT_string(priority){
return ["[#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(priority),"]"].join('');
});
frontend.handler.export$.common.repetition_to_string = (function frontend$handler$export$common$repetition_to_string(p__102741){
var vec__102742 = p__102741;
var vec__102745 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102742,(0),null);
var kind = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102745,(0),null);
var vec__102748 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102742,(1),null);
var duration = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102748,(0),null);
var n = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102742,(2),null);
var kind__$1 = (function (){var G__102751 = kind;
switch (G__102751) {
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
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__102751)].join('')));

}
})();
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(kind__$1),cljs.core.str.cljs$core$IFn$_invoke$arity$1(n),clojure.string.lower_case(cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.first(duration)))].join('');
});
frontend.handler.export$.common.timestamp_to_string = (function frontend$handler$export$common$timestamp_to_string(p__102752){
var map__102753 = p__102752;
var map__102753__$1 = cljs.core.__destructure_map(map__102753);
var date = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102753__$1,new cljs.core.Keyword(null,"date","date",-1463434462));
var time = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102753__$1,new cljs.core.Keyword(null,"time","time",1385887882));
var repetition = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102753__$1,new cljs.core.Keyword(null,"repetition","repetition",1938392115));
var wday = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102753__$1,new cljs.core.Keyword(null,"wday","wday",-543142502));
var active = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102753__$1,new cljs.core.Keyword(null,"active","active",1895962068));
var map__102754 = date;
var map__102754__$1 = cljs.core.__destructure_map(map__102754);
var year = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102754__$1,new cljs.core.Keyword(null,"year","year",335913393));
var month = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102754__$1,new cljs.core.Keyword(null,"month","month",-1960248533));
var day = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102754__$1,new cljs.core.Keyword(null,"day","day",-274800446));
var map__102755 = time;
var map__102755__$1 = cljs.core.__destructure_map(map__102755);
var hour = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102755__$1,new cljs.core.Keyword(null,"hour","hour",-555989214));
var min = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102755__$1,new cljs.core.Keyword(null,"min","min",444991522));
var vec__102756 = (cljs.core.truth_(active)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["<",">"], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["[","]"], null));
var open = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102756,(0),null);
var close = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102756,(1),null);
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
var G__102759 = "%s%s-%s-%s %s%s%s%s";
var G__102760 = open;
var G__102761 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(year);
var G__102762 = frontend.util.zero_pad(month);
var G__102763 = frontend.util.zero_pad(day);
var G__102764 = wday;
var G__102765 = time__$1;
var G__102766 = repetition__$1;
var G__102767 = close;
return (frontend.util.format.cljs$core$IFn$_invoke$arity$9 ? frontend.util.format.cljs$core$IFn$_invoke$arity$9(G__102759,G__102760,G__102761,G__102762,G__102763,G__102764,G__102765,G__102766,G__102767) : frontend.util.format.call(null,G__102759,G__102760,G__102761,G__102762,G__102763,G__102764,G__102765,G__102766,G__102767));
});
frontend.handler.export$.common.hashtag_value__GT_string = (function frontend$handler$export$common$hashtag_value__GT_string(inline_coll){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core.str,cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (inline){
var vec__102768 = inline;
var ast_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102768,(0),null);
var ast_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102768,(1),null);
var G__102771 = ast_type;
switch (G__102771) {
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
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__102771)].join('')));

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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.export$.common._LT_get_all_page__GT_content(repo,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"export-bullet-indentation","export-bullet-indentation",-248047595),frontend.state.get_export_bullet_indentation()], null))),(function (page__GT_content){
return promesa.protocols._promise(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__102772){
var vec__102773 = p__102772;
var page_title = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102773,(0),null);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102773,(1),null);
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"path","path",-188191168),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(page_title),".",cljs.core.str.cljs$core$IFn$_invoke$arity$1(suffix)].join(''),new cljs.core.Keyword(null,"content","content",15833224),content,new cljs.core.Keyword(null,"title","title",636505583),page_title,new cljs.core.Keyword(null,"format","format",-1306924766),new cljs.core.Keyword(null,"markdown","markdown",1227225089)], null);
}),page__GT_content));
}));
}));
});
frontend.handler.export$.common.replace_block_reference_in_heading = (function frontend$handler$export$common$replace_block_reference_in_heading(p__102777){
var map__102778 = p__102777;
var map__102778__$1 = cljs.core.__destructure_map(map__102778);
var ast_content = map__102778__$1;
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102778__$1,new cljs.core.Keyword(null,"title","title",636505583));
var inline_coll = title;
var inline_coll_STAR_ = cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__102776_SHARP_){
try{if(((cljs.core.vector_QMARK_(p1__102776_SHARP_)) && ((cljs.core.count(p1__102776_SHARP_) === 2)))){
try{var p1__102776_SHARP__0__102780 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(p1__102776_SHARP_,(0));
if((p1__102776_SHARP__0__102780 === "Link")){
try{var p1__102776_SHARP__1__102781 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(p1__102776_SHARP_,(1));
if((((!((p1__102776_SHARP__1__102781 == null))))?(((((p1__102776_SHARP__1__102781.cljs$lang$protocol_mask$partition0$ & (256))) || ((cljs.core.PROTOCOL_SENTINEL === p1__102776_SHARP__1__102781.cljs$core$ILookup$))))?true:(((!p1__102776_SHARP__1__102781.cljs$lang$protocol_mask$partition0$))?cljs.core.native_satisfies_QMARK_(cljs.core.ILookup,p1__102776_SHARP__1__102781):false)):cljs.core.native_satisfies_QMARK_(cljs.core.ILookup,p1__102776_SHARP__1__102781))){
try{var p1__102776_SHARP__1__102781_url__102784 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(p1__102776_SHARP__1__102781,new cljs.core.Keyword(null,"url","url",276297046),new cljs.core.Keyword("clojure.core.match","not-found","clojure.core.match/not-found",1553053780));
if(((cljs.core.vector_QMARK_(p1__102776_SHARP__1__102781_url__102784)) && ((cljs.core.count(p1__102776_SHARP__1__102781_url__102784) === 2)))){
try{var p1__102776_SHARP__1__102781_url__102784_0__102785 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(p1__102776_SHARP__1__102781_url__102784,(0));
if((p1__102776_SHARP__1__102781_url__102784_0__102785 === "Block_ref")){
var block_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(p1__102776_SHARP__1__102781_url__102784,(1));
var vec__102793 = frontend.handler.export$.common.block_uuid__GT_ast(cljs.core.uuid(block_uuid));
var vec__102796 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102793,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102796,(0),null);
var map__102799 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102796,(1),null);
var map__102799__$1 = cljs.core.__destructure_map(map__102799);
var title_inline_coll = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102799__$1,new cljs.core.Keyword(null,"title","title",636505583));
(frontend.handler.export$.common._STAR_state_STAR_ = cljs.core.assoc_in(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"replace-ref-embed","replace-ref-embed",-2123548135),new cljs.core.Keyword(null,"block-ref-replaced?","block-ref-replaced?",-939904476)], null),true));

return title_inline_coll;
} else {
throw cljs.core.match.backtrack;

}
}catch (e102792){if((e102792 instanceof Error)){
var e__53206__auto__ = e102792;
if((e__53206__auto__ === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__53206__auto__;
}
} else {
throw e102792;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e102791){if((e102791 instanceof Error)){
var e__53206__auto__ = e102791;
if((e__53206__auto__ === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__53206__auto__;
}
} else {
throw e102791;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e102789){if((e102789 instanceof Error)){
var e__53206__auto__ = e102789;
if((e__53206__auto__ === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__53206__auto__;
}
} else {
throw e102789;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e102788){if((e102788 instanceof Error)){
var e__53206__auto__ = e102788;
if((e__53206__auto__ === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__53206__auto__;
}
} else {
throw e102788;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e102787){if((e102787 instanceof Error)){
var e__53206__auto__ = e102787;
if((e__53206__auto__ === cljs.core.match.backtrack)){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [p1__102776_SHARP_], null);
} else {
throw e__53206__auto__;
}
} else {
throw e102787;

}
}}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([inline_coll], 0)));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ast_content,new cljs.core.Keyword(null,"title","title",636505583),inline_coll_STAR_);
});
frontend.handler.export$.common.replace_block_reference_in_paragraph = (function frontend$handler$export$common$replace_block_reference_in_paragraph(inline_coll){
return cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__102800_SHARP_){
try{if(((cljs.core.vector_QMARK_(p1__102800_SHARP_)) && ((cljs.core.count(p1__102800_SHARP_) === 2)))){
try{var p1__102800_SHARP__0__102802 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(p1__102800_SHARP_,(0));
if((p1__102800_SHARP__0__102802 === "Link")){
try{var p1__102800_SHARP__1__102803 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(p1__102800_SHARP_,(1));
if((((!((p1__102800_SHARP__1__102803 == null))))?(((((p1__102800_SHARP__1__102803.cljs$lang$protocol_mask$partition0$ & (256))) || ((cljs.core.PROTOCOL_SENTINEL === p1__102800_SHARP__1__102803.cljs$core$ILookup$))))?true:(((!p1__102800_SHARP__1__102803.cljs$lang$protocol_mask$partition0$))?cljs.core.native_satisfies_QMARK_(cljs.core.ILookup,p1__102800_SHARP__1__102803):false)):cljs.core.native_satisfies_QMARK_(cljs.core.ILookup,p1__102800_SHARP__1__102803))){
try{var p1__102800_SHARP__1__102803_url__102806 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(p1__102800_SHARP__1__102803,new cljs.core.Keyword(null,"url","url",276297046),new cljs.core.Keyword("clojure.core.match","not-found","clojure.core.match/not-found",1553053780));
if(((cljs.core.vector_QMARK_(p1__102800_SHARP__1__102803_url__102806)) && ((cljs.core.count(p1__102800_SHARP__1__102803_url__102806) === 2)))){
try{var p1__102800_SHARP__1__102803_url__102806_0__102807 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(p1__102800_SHARP__1__102803_url__102806,(0));
if((p1__102800_SHARP__1__102803_url__102806_0__102807 === "Block_ref")){
var block_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(p1__102800_SHARP__1__102803_url__102806,(1));
var vec__102815 = frontend.handler.export$.common.block_uuid__GT_ast(cljs.core.uuid(block_uuid));
var vec__102818 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102815,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102818,(0),null);
var map__102821 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102818,(1),null);
var map__102821__$1 = cljs.core.__destructure_map(map__102821);
var title_inline_coll = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102821__$1,new cljs.core.Keyword(null,"title","title",636505583));
(frontend.handler.export$.common._STAR_state_STAR_ = cljs.core.assoc_in(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"replace-ref-embed","replace-ref-embed",-2123548135),new cljs.core.Keyword(null,"block-ref-replaced?","block-ref-replaced?",-939904476)], null),true));

return title_inline_coll;
} else {
throw cljs.core.match.backtrack;

}
}catch (e102814){if((e102814 instanceof Error)){
var e__53206__auto__ = e102814;
if((e__53206__auto__ === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__53206__auto__;
}
} else {
throw e102814;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e102813){if((e102813 instanceof Error)){
var e__53206__auto__ = e102813;
if((e__53206__auto__ === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__53206__auto__;
}
} else {
throw e102813;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e102811){if((e102811 instanceof Error)){
var e__53206__auto__ = e102811;
if((e__53206__auto__ === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__53206__auto__;
}
} else {
throw e102811;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e102810){if((e102810 instanceof Error)){
var e__53206__auto__ = e102810;
if((e__53206__auto__ === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__53206__auto__;
}
} else {
throw e102810;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e102809){if((e102809 instanceof Error)){
var e__53206__auto__ = e102809;
if((e__53206__auto__ === cljs.core.match.backtrack)){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [p1__102800_SHARP_], null);
} else {
throw e__53206__auto__;
}
} else {
throw e102809;

}
}}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([inline_coll], 0)));
});
frontend.handler.export$.common.replace_block_reference_in_list = (function frontend$handler$export$common$replace_block_reference_in_list(list_items){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p__102822){
var map__102823 = p__102822;
var map__102823__$1 = cljs.core.__destructure_map(map__102823);
var item = map__102823__$1;
var block_ast_coll = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102823__$1,new cljs.core.Keyword(null,"content","content",15833224));
var sub_items = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102823__$1,new cljs.core.Keyword(null,"items","items",1031954938));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(item,new cljs.core.Keyword(null,"content","content",15833224),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common.replace_block_references,block_ast_coll),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"items","items",1031954938),(frontend.handler.export$.common.replace_block_reference_in_list.cljs$core$IFn$_invoke$arity$1 ? frontend.handler.export$.common.replace_block_reference_in_list.cljs$core$IFn$_invoke$arity$1(sub_items) : frontend.handler.export$.common.replace_block_reference_in_list.call(null,sub_items))], 0));
}),list_items);
});
frontend.handler.export$.common.replace_block_reference_in_quote = (function frontend$handler$export$common$replace_block_reference_in_quote(block_ast_coll){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common.replace_block_references,block_ast_coll);
});
frontend.handler.export$.common.replace_block_reference_in_table = (function frontend$handler$export$common$replace_block_reference_in_table(p__102826){
var map__102827 = p__102826;
var map__102827__$1 = cljs.core.__destructure_map(map__102827);
var table = map__102827__$1;
var header = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102827__$1,new cljs.core.Keyword(null,"header","header",119441134));
var groups = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102827__$1,new cljs.core.Keyword(null,"groups","groups",-136896102));
var header_STAR_ = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (col){
return cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__102824_SHARP_){
try{if(((cljs.core.vector_QMARK_(p1__102824_SHARP_)) && ((cljs.core.count(p1__102824_SHARP_) === 2)))){
try{var p1__102824_SHARP__0__102829 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(p1__102824_SHARP_,(0));
if((p1__102824_SHARP__0__102829 === "Link")){
try{var p1__102824_SHARP__1__102830 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(p1__102824_SHARP_,(1));
if((((!((p1__102824_SHARP__1__102830 == null))))?(((((p1__102824_SHARP__1__102830.cljs$lang$protocol_mask$partition0$ & (256))) || ((cljs.core.PROTOCOL_SENTINEL === p1__102824_SHARP__1__102830.cljs$core$ILookup$))))?true:(((!p1__102824_SHARP__1__102830.cljs$lang$protocol_mask$partition0$))?cljs.core.native_satisfies_QMARK_(cljs.core.ILookup,p1__102824_SHARP__1__102830):false)):cljs.core.native_satisfies_QMARK_(cljs.core.ILookup,p1__102824_SHARP__1__102830))){
try{var p1__102824_SHARP__1__102830_url__102833 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(p1__102824_SHARP__1__102830,new cljs.core.Keyword(null,"url","url",276297046),new cljs.core.Keyword("clojure.core.match","not-found","clojure.core.match/not-found",1553053780));
if(((cljs.core.vector_QMARK_(p1__102824_SHARP__1__102830_url__102833)) && ((cljs.core.count(p1__102824_SHARP__1__102830_url__102833) === 2)))){
try{var p1__102824_SHARP__1__102830_url__102833_0__102834 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(p1__102824_SHARP__1__102830_url__102833,(0));
if((p1__102824_SHARP__1__102830_url__102833_0__102834 === "Block_ref")){
var block_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(p1__102824_SHARP__1__102830_url__102833,(1));
var vec__102842 = frontend.handler.export$.common.block_uuid__GT_ast(cljs.core.uuid(block_uuid));
var vec__102845 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102842,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102845,(0),null);
var map__102848 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102845,(1),null);
var map__102848__$1 = cljs.core.__destructure_map(map__102848);
var title_inline_coll = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102848__$1,new cljs.core.Keyword(null,"title","title",636505583));
(frontend.handler.export$.common._STAR_state_STAR_ = cljs.core.assoc_in(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"replace-ref-embed","replace-ref-embed",-2123548135),new cljs.core.Keyword(null,"block-ref-replaced?","block-ref-replaced?",-939904476)], null),true));

return title_inline_coll;
} else {
throw cljs.core.match.backtrack;

}
}catch (e102841){if((e102841 instanceof Error)){
var e__53206__auto__ = e102841;
if((e__53206__auto__ === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__53206__auto__;
}
} else {
throw e102841;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e102840){if((e102840 instanceof Error)){
var e__53206__auto__ = e102840;
if((e__53206__auto__ === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__53206__auto__;
}
} else {
throw e102840;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e102838){if((e102838 instanceof Error)){
var e__53206__auto__ = e102838;
if((e__53206__auto__ === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__53206__auto__;
}
} else {
throw e102838;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e102837){if((e102837 instanceof Error)){
var e__53206__auto__ = e102837;
if((e__53206__auto__ === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__53206__auto__;
}
} else {
throw e102837;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e102836){if((e102836 instanceof Error)){
var e__53206__auto__ = e102836;
if((e__53206__auto__ === cljs.core.match.backtrack)){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [p1__102824_SHARP_], null);
} else {
throw e__53206__auto__;
}
} else {
throw e102836;

}
}}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([col], 0)));
}),header);
var groups_STAR_ = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (group){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (row){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (col){
return cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__102825_SHARP_){
try{if(((cljs.core.vector_QMARK_(p1__102825_SHARP_)) && ((cljs.core.count(p1__102825_SHARP_) === 2)))){
try{var p1__102825_SHARP__0__102850 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(p1__102825_SHARP_,(0));
if((p1__102825_SHARP__0__102850 === "Link")){
try{var p1__102825_SHARP__1__102851 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(p1__102825_SHARP_,(1));
if((((!((p1__102825_SHARP__1__102851 == null))))?(((((p1__102825_SHARP__1__102851.cljs$lang$protocol_mask$partition0$ & (256))) || ((cljs.core.PROTOCOL_SENTINEL === p1__102825_SHARP__1__102851.cljs$core$ILookup$))))?true:(((!p1__102825_SHARP__1__102851.cljs$lang$protocol_mask$partition0$))?cljs.core.native_satisfies_QMARK_(cljs.core.ILookup,p1__102825_SHARP__1__102851):false)):cljs.core.native_satisfies_QMARK_(cljs.core.ILookup,p1__102825_SHARP__1__102851))){
try{var p1__102825_SHARP__1__102851_url__102854 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(p1__102825_SHARP__1__102851,new cljs.core.Keyword(null,"url","url",276297046),new cljs.core.Keyword("clojure.core.match","not-found","clojure.core.match/not-found",1553053780));
if(((cljs.core.vector_QMARK_(p1__102825_SHARP__1__102851_url__102854)) && ((cljs.core.count(p1__102825_SHARP__1__102851_url__102854) === 2)))){
try{var p1__102825_SHARP__1__102851_url__102854_0__102855 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(p1__102825_SHARP__1__102851_url__102854,(0));
if((p1__102825_SHARP__1__102851_url__102854_0__102855 === "Block_ref")){
var block_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(p1__102825_SHARP__1__102851_url__102854,(1));
var vec__102863 = frontend.handler.export$.common.block_uuid__GT_ast(cljs.core.uuid(block_uuid));
var vec__102866 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102863,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102866,(0),null);
var map__102869 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102866,(1),null);
var map__102869__$1 = cljs.core.__destructure_map(map__102869);
var title_inline_coll = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102869__$1,new cljs.core.Keyword(null,"title","title",636505583));
(frontend.handler.export$.common._STAR_state_STAR_ = cljs.core.assoc_in(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"replace-ref-embed","replace-ref-embed",-2123548135),new cljs.core.Keyword(null,"block-ref-replaced?","block-ref-replaced?",-939904476)], null),true));

return title_inline_coll;
} else {
throw cljs.core.match.backtrack;

}
}catch (e102862){if((e102862 instanceof Error)){
var e__53206__auto__ = e102862;
if((e__53206__auto__ === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__53206__auto__;
}
} else {
throw e102862;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e102861){if((e102861 instanceof Error)){
var e__53206__auto__ = e102861;
if((e__53206__auto__ === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__53206__auto__;
}
} else {
throw e102861;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e102859){if((e102859 instanceof Error)){
var e__53206__auto__ = e102859;
if((e__53206__auto__ === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__53206__auto__;
}
} else {
throw e102859;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e102858){if((e102858 instanceof Error)){
var e__53206__auto__ = e102858;
if((e__53206__auto__ === cljs.core.match.backtrack)){
throw cljs.core.match.backtrack;
} else {
throw e__53206__auto__;
}
} else {
throw e102858;

}
}} else {
throw cljs.core.match.backtrack;

}
}catch (e102857){if((e102857 instanceof Error)){
var e__53206__auto__ = e102857;
if((e__53206__auto__ === cljs.core.match.backtrack)){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [p1__102825_SHARP_], null);
} else {
throw e__53206__auto__;
}
} else {
throw e102857;

}
}}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([col], 0)));
}),row);
}),group);
}),groups);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(table,new cljs.core.Keyword(null,"header","header",119441134),header_STAR_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"groups","groups",-136896102),groups_STAR_], 0));
});
frontend.handler.export$.common.replace_block_references = (function frontend$handler$export$common$replace_block_references(block_ast){
var vec__102870 = block_ast;
var ast_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102870,(0),null);
var ast_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102870,(1),null);
var G__102873 = ast_type;
switch (G__102873) {
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
var _STAR_state_STAR__orig_val__102874 = frontend.handler.export$.common._STAR_state_STAR_;
var _STAR_state_STAR__temp_val__102875 = frontend.handler.export$.common._STAR_state_STAR_;
(frontend.handler.export$.common._STAR_state_STAR_ = _STAR_state_STAR__temp_val__102875);

try{var block_ast__$1 = block_ast;
while(true){
var block_ast_STAR_ = frontend.handler.export$.common.replace_block_references(block_ast__$1);
if(cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"replace-ref-embed","replace-ref-embed",-2123548135),new cljs.core.Keyword(null,"block-ref-replaced?","block-ref-replaced?",-939904476)], null)))){
(frontend.handler.export$.common._STAR_state_STAR_ = cljs.core.assoc_in(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"replace-ref-embed","replace-ref-embed",-2123548135),new cljs.core.Keyword(null,"block-ref-replaced?","block-ref-replaced?",-939904476)], null),false));

var G__103120 = block_ast_STAR_;
block_ast__$1 = G__103120;
continue;
} else {
return block_ast_STAR_;
}
break;
}
}finally {(frontend.handler.export$.common._STAR_state_STAR_ = _STAR_state_STAR__orig_val__102874);
}});
frontend.handler.export$.common.replace_block_embeds_helper = (function frontend$handler$export$common$replace_block_embeds_helper(current_paragraph_inlines,block_uuid,blocks_tcoll,level){
var block_uuid_STAR_ = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(block_uuid,(2),(cljs.core.count(block_uuid) - (2)));
var ast_coll = frontend.handler.export$.common.update_level_in_block_ast_coll(frontend.handler.export$.common.block_uuid__GT_ast_with_children(cljs.core.uuid(block_uuid_STAR_)),level);
var G__102877 = blocks_tcoll;
var G__102877__$1 = ((cljs.core.seq(current_paragraph_inlines))?cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(G__102877,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Paragraph",current_paragraph_inlines], null)):G__102877);
return (function (p1__102876_SHARP_){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core.conj_BANG_,p1__102876_SHARP_,ast_coll);
})(G__102877__$1);

});
frontend.handler.export$.common.replace_page_embeds_helper = (function frontend$handler$export$common$replace_page_embeds_helper(current_paragraph_inlines,page_name,blocks_tcoll,level){
var page_name_STAR_ = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(page_name,(2),(cljs.core.count(page_name) - (2)));
var ast_coll = frontend.handler.export$.common.update_level_in_block_ast_coll(frontend.handler.export$.common.page_name__GT_ast(page_name_STAR_),level);
var G__102879 = blocks_tcoll;
var G__102879__$1 = ((cljs.core.seq(current_paragraph_inlines))?cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(G__102879,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Paragraph",current_paragraph_inlines], null)):G__102879);
return (function (p1__102878_SHARP_){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core.conj_BANG_,p1__102878_SHARP_,ast_coll);
})(G__102879__$1);

});
frontend.handler.export$.common.replace_block_AMPERSAND_page_embeds_in_heading = (function frontend$handler$export$common$replace_block_AMPERSAND_page_embeds_in_heading(p__102880){
var map__102881 = p__102880;
var map__102881__$1 = cljs.core.__destructure_map(map__102881);
var ast_content = map__102881__$1;
var inline_coll = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102881__$1,new cljs.core.Keyword(null,"title","title",636505583));
var origin_level = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102881__$1,new cljs.core.Keyword(null,"level","level",1290497552));
(frontend.handler.export$.common._STAR_state_STAR_ = cljs.core.assoc_in(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"replace-ref-embed","replace-ref-embed",-2123548135),new cljs.core.Keyword(null,"current-level","current-level",-11925890)], null),origin_level));

if(cljs.core.empty_QMARK_(inline_coll)){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Heading",ast_content], null)], null);
} else {
var G__102885 = inline_coll;
var vec__102886 = G__102885;
var seq__102887 = cljs.core.seq(vec__102886);
var first__102888 = cljs.core.first(seq__102887);
var seq__102887__$1 = cljs.core.next(seq__102887);
var inline = first__102888;
var other_inlines = seq__102887__$1;
var heading_exist_QMARK_ = false;
var current_paragraph_inlines = cljs.core.PersistentVector.EMPTY;
var r = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
var G__102885__$1 = G__102885;
var heading_exist_QMARK___$1 = heading_exist_QMARK_;
var current_paragraph_inlines__$1 = current_paragraph_inlines;
var r__$1 = r;
while(true){
var vec__102902 = G__102885__$1;
var seq__102903 = cljs.core.seq(vec__102902);
var first__102904 = cljs.core.first(seq__102903);
var seq__102903__$1 = cljs.core.next(seq__102903);
var inline__$1 = first__102904;
var other_inlines__$1 = seq__102903__$1;
var heading_exist_QMARK___$2 = heading_exist_QMARK___$1;
var current_paragraph_inlines__$2 = current_paragraph_inlines__$1;
var r__$2 = r__$1;
if(cljs.core.not(inline__$1)){
return cljs.core.persistent_BANG_(((cljs.core.seq(current_paragraph_inlines__$2))?cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(r__$2,((heading_exist_QMARK___$2)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Paragraph",current_paragraph_inlines__$2], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Heading",cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ast_content,new cljs.core.Keyword(null,"title","title",636505583),current_paragraph_inlines__$2)], null))):r__$2));
} else {
if(((cljs.core.vector_QMARK_(inline__$1)) && ((cljs.core.count(inline__$1) === 2)))){
var inline_0__102906 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(inline__$1,(0));
if((inline_0__102906 === "Macro")){
var inline_1__102907 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(inline__$1,(1));
if((((!((inline_1__102907 == null))))?(((((inline_1__102907.cljs$lang$protocol_mask$partition0$ & (256))) || ((cljs.core.PROTOCOL_SENTINEL === inline_1__102907.cljs$core$ILookup$))))?true:(((!inline_1__102907.cljs$lang$protocol_mask$partition0$))?cljs.core.native_satisfies_QMARK_(cljs.core.ILookup,inline_1__102907):false)):cljs.core.native_satisfies_QMARK_(cljs.core.ILookup,inline_1__102907))){
var inline_1__102907_arguments__102911 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(inline_1__102907,new cljs.core.Keyword(null,"arguments","arguments",-1182834456),new cljs.core.Keyword("clojure.core.match","not-found","clojure.core.match/not-found",1553053780));
if(((cljs.core.vector_QMARK_(inline_1__102907_arguments__102911)) && ((cljs.core.count(inline_1__102907_arguments__102911) === 1)))){
var inline_1__102907_name__102912 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(inline_1__102907,new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword("clojure.core.match","not-found","clojure.core.match/not-found",1553053780));
if((inline_1__102907_name__102912 === "embed")){
var block_uuid_or_page_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(inline_1__102907_arguments__102911,(0));
if(((clojure.string.starts_with_QMARK_(block_uuid_or_page_name,"((")) && (clojure.string.ends_with_QMARK_(block_uuid_or_page_name,"))")))){
(frontend.handler.export$.common._STAR_state_STAR_ = cljs.core.assoc_in(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"replace-ref-embed","replace-ref-embed",-2123548135),new cljs.core.Keyword(null,"block&page-embed-replaced?","block&page-embed-replaced?",-180485858)], null),true));

var G__103123 = other_inlines__$1;
var G__103124 = true;
var G__103125 = cljs.core.PersistentVector.EMPTY;
var G__103126 = frontend.handler.export$.common.replace_block_embeds_helper(current_paragraph_inlines__$2,block_uuid_or_page_name,r__$2,origin_level);
G__102885__$1 = G__103123;
heading_exist_QMARK___$1 = G__103124;
current_paragraph_inlines__$1 = G__103125;
r__$1 = G__103126;
continue;
} else {
if(((clojure.string.starts_with_QMARK_(block_uuid_or_page_name,"[[")) && (clojure.string.ends_with_QMARK_(block_uuid_or_page_name,"]]")))){
(frontend.handler.export$.common._STAR_state_STAR_ = cljs.core.assoc_in(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"replace-ref-embed","replace-ref-embed",-2123548135),new cljs.core.Keyword(null,"block&page-embed-replaced?","block&page-embed-replaced?",-180485858)], null),true));

var G__103127 = other_inlines__$1;
var G__103128 = true;
var G__103129 = cljs.core.PersistentVector.EMPTY;
var G__103130 = frontend.handler.export$.common.replace_page_embeds_helper(current_paragraph_inlines__$2,block_uuid_or_page_name,r__$2,origin_level);
G__102885__$1 = G__103127;
heading_exist_QMARK___$1 = G__103128;
current_paragraph_inlines__$1 = G__103129;
r__$1 = G__103130;
continue;
} else {
var G__103131 = other_inlines__$1;
var G__103132 = heading_exist_QMARK___$2;
var G__103133 = current_paragraph_inlines__$2;
var G__103134 = r__$2;
G__102885__$1 = G__103131;
heading_exist_QMARK___$1 = G__103132;
current_paragraph_inlines__$1 = G__103133;
r__$1 = G__103134;
continue;

}
}
} else {
var current_paragraph_inlines_STAR_ = ((((cljs.core.empty_QMARK_(current_paragraph_inlines__$2)) && (heading_exist_QMARK___$2)))?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines__$2,frontend.handler.export$.common.plain_indent_inline_ast(origin_level)):current_paragraph_inlines__$2);
var G__103137 = other_inlines__$1;
var G__103138 = heading_exist_QMARK___$2;
var G__103139 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines_STAR_,inline__$1);
var G__103140 = r__$2;
G__102885__$1 = G__103137;
heading_exist_QMARK___$1 = G__103138;
current_paragraph_inlines__$1 = G__103139;
r__$1 = G__103140;
continue;

}
} else {
var current_paragraph_inlines_STAR_ = ((((cljs.core.empty_QMARK_(current_paragraph_inlines__$2)) && (heading_exist_QMARK___$2)))?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines__$2,frontend.handler.export$.common.plain_indent_inline_ast(origin_level)):current_paragraph_inlines__$2);
var G__103141 = other_inlines__$1;
var G__103142 = heading_exist_QMARK___$2;
var G__103143 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines_STAR_,inline__$1);
var G__103144 = r__$2;
G__102885__$1 = G__103141;
heading_exist_QMARK___$1 = G__103142;
current_paragraph_inlines__$1 = G__103143;
r__$1 = G__103144;
continue;

}
} else {
var current_paragraph_inlines_STAR_ = ((((cljs.core.empty_QMARK_(current_paragraph_inlines__$2)) && (heading_exist_QMARK___$2)))?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines__$2,frontend.handler.export$.common.plain_indent_inline_ast(origin_level)):current_paragraph_inlines__$2);
var G__103147 = other_inlines__$1;
var G__103148 = heading_exist_QMARK___$2;
var G__103149 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines_STAR_,inline__$1);
var G__103150 = r__$2;
G__102885__$1 = G__103147;
heading_exist_QMARK___$1 = G__103148;
current_paragraph_inlines__$1 = G__103149;
r__$1 = G__103150;
continue;

}
} else {
var current_paragraph_inlines_STAR_ = ((((cljs.core.empty_QMARK_(current_paragraph_inlines__$2)) && (heading_exist_QMARK___$2)))?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines__$2,frontend.handler.export$.common.plain_indent_inline_ast(origin_level)):current_paragraph_inlines__$2);
var G__103151 = other_inlines__$1;
var G__103152 = heading_exist_QMARK___$2;
var G__103153 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines_STAR_,inline__$1);
var G__103154 = r__$2;
G__102885__$1 = G__103151;
heading_exist_QMARK___$1 = G__103152;
current_paragraph_inlines__$1 = G__103153;
r__$1 = G__103154;
continue;

}
} else {
var current_paragraph_inlines_STAR_ = ((((cljs.core.empty_QMARK_(current_paragraph_inlines__$2)) && (heading_exist_QMARK___$2)))?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines__$2,frontend.handler.export$.common.plain_indent_inline_ast(origin_level)):current_paragraph_inlines__$2);
var G__103155 = other_inlines__$1;
var G__103156 = heading_exist_QMARK___$2;
var G__103157 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines_STAR_,inline__$1);
var G__103158 = r__$2;
G__102885__$1 = G__103155;
heading_exist_QMARK___$1 = G__103156;
current_paragraph_inlines__$1 = G__103157;
r__$1 = G__103158;
continue;

}
}
break;
}
}
});
frontend.handler.export$.common.replace_block_AMPERSAND_page_embeds_in_paragraph = (function frontend$handler$export$common$replace_block_AMPERSAND_page_embeds_in_paragraph(inline_coll,meta){
var current_level = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"replace-ref-embed","replace-ref-embed",-2123548135),new cljs.core.Keyword(null,"current-level","current-level",-11925890)], null));
var G__102918 = inline_coll;
var vec__102919 = G__102918;
var seq__102920 = cljs.core.seq(vec__102919);
var first__102921 = cljs.core.first(seq__102920);
var seq__102920__$1 = cljs.core.next(seq__102920);
var inline = first__102921;
var other_inlines = seq__102920__$1;
var current_paragraph_inlines = cljs.core.PersistentVector.EMPTY;
var just_after_embed_QMARK_ = false;
var blocks = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
var G__102918__$1 = G__102918;
var current_paragraph_inlines__$1 = current_paragraph_inlines;
var just_after_embed_QMARK___$1 = just_after_embed_QMARK_;
var blocks__$1 = blocks;
while(true){
var vec__102938 = G__102918__$1;
var seq__102939 = cljs.core.seq(vec__102938);
var first__102940 = cljs.core.first(seq__102939);
var seq__102939__$1 = cljs.core.next(seq__102939);
var inline__$1 = first__102940;
var other_inlines__$1 = seq__102939__$1;
var current_paragraph_inlines__$2 = current_paragraph_inlines__$1;
var just_after_embed_QMARK___$2 = just_after_embed_QMARK___$1;
var blocks__$2 = blocks__$1;
if(cljs.core.not(inline__$1)){
var vec__102941 = cljs.core.persistent_BANG_(((cljs.core.seq(current_paragraph_inlines__$2))?cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(blocks__$2,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Paragraph",current_paragraph_inlines__$2], null)):blocks__$2));
var seq__102942 = cljs.core.seq(vec__102941);
var first__102943 = cljs.core.first(seq__102942);
var seq__102942__$1 = cljs.core.next(seq__102942);
var first_block = first__102943;
var other_blocks = seq__102942__$1;
if(cljs.core.truth_(first_block)){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.vector,cljs.core.with_meta(first_block,meta),other_blocks);
} else {
return cljs.core.PersistentVector.EMPTY;
}
} else {
if(((cljs.core.vector_QMARK_(inline__$1)) && ((cljs.core.count(inline__$1) === 2)))){
var inline_0__102945 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(inline__$1,(0));
if((inline_0__102945 === "Macro")){
var inline_1__102946 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(inline__$1,(1));
if((((!((inline_1__102946 == null))))?(((((inline_1__102946.cljs$lang$protocol_mask$partition0$ & (256))) || ((cljs.core.PROTOCOL_SENTINEL === inline_1__102946.cljs$core$ILookup$))))?true:(((!inline_1__102946.cljs$lang$protocol_mask$partition0$))?cljs.core.native_satisfies_QMARK_(cljs.core.ILookup,inline_1__102946):false)):cljs.core.native_satisfies_QMARK_(cljs.core.ILookup,inline_1__102946))){
var inline_1__102946_arguments__102950 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(inline_1__102946,new cljs.core.Keyword(null,"arguments","arguments",-1182834456),new cljs.core.Keyword("clojure.core.match","not-found","clojure.core.match/not-found",1553053780));
if(((cljs.core.vector_QMARK_(inline_1__102946_arguments__102950)) && ((cljs.core.count(inline_1__102946_arguments__102950) === 1)))){
var inline_1__102946_name__102951 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(inline_1__102946,new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword("clojure.core.match","not-found","clojure.core.match/not-found",1553053780));
if((inline_1__102946_name__102951 === "embed")){
var block_uuid_or_page_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(inline_1__102946_arguments__102950,(0));
if(((clojure.string.starts_with_QMARK_(block_uuid_or_page_name,"((")) && (clojure.string.ends_with_QMARK_(block_uuid_or_page_name,"))")))){
(frontend.handler.export$.common._STAR_state_STAR_ = cljs.core.assoc_in(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"replace-ref-embed","replace-ref-embed",-2123548135),new cljs.core.Keyword(null,"block&page-embed-replaced?","block&page-embed-replaced?",-180485858)], null),true));

var G__103162 = other_inlines__$1;
var G__103163 = cljs.core.PersistentVector.EMPTY;
var G__103164 = true;
var G__103165 = frontend.handler.export$.common.replace_block_embeds_helper(current_paragraph_inlines__$2,block_uuid_or_page_name,blocks__$2,current_level);
G__102918__$1 = G__103162;
current_paragraph_inlines__$1 = G__103163;
just_after_embed_QMARK___$1 = G__103164;
blocks__$1 = G__103165;
continue;
} else {
if(((clojure.string.starts_with_QMARK_(block_uuid_or_page_name,"[[")) && (clojure.string.ends_with_QMARK_(block_uuid_or_page_name,"]]")))){
(frontend.handler.export$.common._STAR_state_STAR_ = cljs.core.assoc_in(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"replace-ref-embed","replace-ref-embed",-2123548135),new cljs.core.Keyword(null,"block&page-embed-replaced?","block&page-embed-replaced?",-180485858)], null),true));

var G__103166 = other_inlines__$1;
var G__103167 = cljs.core.PersistentVector.EMPTY;
var G__103168 = true;
var G__103169 = frontend.handler.export$.common.replace_page_embeds_helper(current_paragraph_inlines__$2,block_uuid_or_page_name,blocks__$2,current_level);
G__102918__$1 = G__103166;
current_paragraph_inlines__$1 = G__103167;
just_after_embed_QMARK___$1 = G__103168;
blocks__$1 = G__103169;
continue;
} else {
var G__103170 = other_inlines__$1;
var G__103171 = current_paragraph_inlines__$2;
var G__103172 = false;
var G__103173 = blocks__$2;
G__102918__$1 = G__103170;
current_paragraph_inlines__$1 = G__103171;
just_after_embed_QMARK___$1 = G__103172;
blocks__$1 = G__103173;
continue;

}
}
} else {
var current_paragraph_inlines_STAR_ = ((just_after_embed_QMARK___$2)?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines__$2,frontend.handler.export$.common.plain_indent_inline_ast(current_level)):current_paragraph_inlines__$2);
var G__103174 = other_inlines__$1;
var G__103175 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines_STAR_,inline__$1);
var G__103176 = false;
var G__103177 = blocks__$2;
G__102918__$1 = G__103174;
current_paragraph_inlines__$1 = G__103175;
just_after_embed_QMARK___$1 = G__103176;
blocks__$1 = G__103177;
continue;

}
} else {
var current_paragraph_inlines_STAR_ = ((just_after_embed_QMARK___$2)?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines__$2,frontend.handler.export$.common.plain_indent_inline_ast(current_level)):current_paragraph_inlines__$2);
var G__103178 = other_inlines__$1;
var G__103179 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines_STAR_,inline__$1);
var G__103180 = false;
var G__103181 = blocks__$2;
G__102918__$1 = G__103178;
current_paragraph_inlines__$1 = G__103179;
just_after_embed_QMARK___$1 = G__103180;
blocks__$1 = G__103181;
continue;

}
} else {
var current_paragraph_inlines_STAR_ = ((just_after_embed_QMARK___$2)?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines__$2,frontend.handler.export$.common.plain_indent_inline_ast(current_level)):current_paragraph_inlines__$2);
var G__103182 = other_inlines__$1;
var G__103183 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines_STAR_,inline__$1);
var G__103184 = false;
var G__103185 = blocks__$2;
G__102918__$1 = G__103182;
current_paragraph_inlines__$1 = G__103183;
just_after_embed_QMARK___$1 = G__103184;
blocks__$1 = G__103185;
continue;

}
} else {
var current_paragraph_inlines_STAR_ = ((just_after_embed_QMARK___$2)?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines__$2,frontend.handler.export$.common.plain_indent_inline_ast(current_level)):current_paragraph_inlines__$2);
var G__103187 = other_inlines__$1;
var G__103188 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines_STAR_,inline__$1);
var G__103189 = false;
var G__103190 = blocks__$2;
G__102918__$1 = G__103187;
current_paragraph_inlines__$1 = G__103188;
just_after_embed_QMARK___$1 = G__103189;
blocks__$1 = G__103190;
continue;

}
} else {
var current_paragraph_inlines_STAR_ = ((just_after_embed_QMARK___$2)?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines__$2,frontend.handler.export$.common.plain_indent_inline_ast(current_level)):current_paragraph_inlines__$2);
var G__103191 = other_inlines__$1;
var G__103192 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_paragraph_inlines_STAR_,inline__$1);
var G__103193 = false;
var G__103194 = blocks__$2;
G__102918__$1 = G__103191;
current_paragraph_inlines__$1 = G__103192;
just_after_embed_QMARK___$1 = G__103193;
blocks__$1 = G__103194;
continue;

}
}
break;
}
});
frontend.handler.export$.common.replace_block_AMPERSAND_page_embeds_in_list_helper = (function frontend$handler$export$common$replace_block_AMPERSAND_page_embeds_in_list_helper(list_items){
var _STAR_state_STAR__orig_val__102954 = frontend.handler.export$.common._STAR_state_STAR_;
var _STAR_state_STAR__temp_val__102955 = cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"replace-ref-embed","replace-ref-embed",-2123548135),new cljs.core.Keyword(null,"current-level","current-level",-11925890)], null),cljs.core.inc);
(frontend.handler.export$.common._STAR_state_STAR_ = _STAR_state_STAR__temp_val__102955);

try{return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p__102956){
var map__102957 = p__102956;
var map__102957__$1 = cljs.core.__destructure_map(map__102957);
var item = map__102957__$1;
var block_ast_coll = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102957__$1,new cljs.core.Keyword(null,"content","content",15833224));
var sub_items = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102957__$1,new cljs.core.Keyword(null,"items","items",1031954938));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(item,new cljs.core.Keyword(null,"content","content",15833224),cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(frontend.handler.export$.common.replace_block_AMPERSAND_page_embeds,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([block_ast_coll], 0))),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"items","items",1031954938),(frontend.handler.export$.common.replace_block_AMPERSAND_page_embeds_in_list_helper.cljs$core$IFn$_invoke$arity$1 ? frontend.handler.export$.common.replace_block_AMPERSAND_page_embeds_in_list_helper.cljs$core$IFn$_invoke$arity$1(sub_items) : frontend.handler.export$.common.replace_block_AMPERSAND_page_embeds_in_list_helper.call(null,sub_items))], 0));
}),list_items);
}finally {(frontend.handler.export$.common._STAR_state_STAR_ = _STAR_state_STAR__orig_val__102954);
}});
frontend.handler.export$.common.replace_block_AMPERSAND_page_embeds_in_list = (function frontend$handler$export$common$replace_block_AMPERSAND_page_embeds_in_list(list_items){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["List",frontend.handler.export$.common.replace_block_AMPERSAND_page_embeds_in_list_helper(list_items)], null)], null);
});
frontend.handler.export$.common.replace_block_AMPERSAND_page_embeds_in_quote = (function frontend$handler$export$common$replace_block_AMPERSAND_page_embeds_in_quote(block_ast_coll){
return (new cljs.core.PersistentVector(null,1,(5),cljs.core.PersistentVector.EMPTY_NODE,[(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,["Quote",cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(frontend.handler.export$.common.replace_block_AMPERSAND_page_embeds,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([block_ast_coll], 0)))],null))],null));
});
frontend.handler.export$.common.replace_block_AMPERSAND_page_embeds = (function frontend$handler$export$common$replace_block_AMPERSAND_page_embeds(block_ast){
var vec__102958 = block_ast;
var ast_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102958,(0),null);
var ast_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102958,(1),null);
var G__102961 = ast_type;
switch (G__102961) {
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
var vec__102972 = block_ast_coll_to_replace_references;
var seq__102973 = cljs.core.seq(vec__102972);
var first__102974 = cljs.core.first(seq__102973);
var seq__102973__$1 = cljs.core.next(seq__102973);
var block_ast_to_replace_ref = first__102974;
var other_block_asts_to_replace_ref = seq__102973__$1;
var embed_depth = new cljs.core.Keyword(null,"embed-depth","embed-depth",874062386).cljs$core$IFn$_invoke$arity$2(cljs.core.meta(block_ast_to_replace_ref),(0));
var block_ast_replaced = cljs.core.with_meta(frontend.handler.export$.common.replace_block_references_until_stable(block_ast_to_replace_ref),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"embed-depth","embed-depth",874062386),embed_depth], null));
if((embed_depth >= (5))){
var G__103196 = block_ast_coll__$1;
var G__103197 = cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(result_block_ast_tcoll,block_ast_replaced);
var G__103198 = cljs.core.vec(other_block_asts_to_replace_ref);
var G__103199 = block_ast_coll_to_replace_embeds;
block_ast_coll__$1 = G__103196;
result_block_ast_tcoll = G__103197;
block_ast_coll_to_replace_references = G__103198;
block_ast_coll_to_replace_embeds = G__103199;
continue;
} else {
var G__103200 = block_ast_coll__$1;
var G__103201 = result_block_ast_tcoll;
var G__103202 = cljs.core.vec(other_block_asts_to_replace_ref);
var G__103203 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(block_ast_coll_to_replace_embeds,block_ast_replaced);
block_ast_coll__$1 = G__103200;
result_block_ast_tcoll = G__103201;
block_ast_coll_to_replace_references = G__103202;
block_ast_coll_to_replace_embeds = G__103203;
continue;
}
} else {
if(cljs.core.seq(block_ast_coll_to_replace_embeds)){
var vec__102975 = block_ast_coll_to_replace_embeds;
var seq__102976 = cljs.core.seq(vec__102975);
var first__102977 = cljs.core.first(seq__102976);
var seq__102976__$1 = cljs.core.next(seq__102976);
var block_ast_to_replace_embed = first__102977;
var other_block_asts_to_replace_embed = seq__102976__$1;
var embed_depth = new cljs.core.Keyword(null,"embed-depth","embed-depth",874062386).cljs$core$IFn$_invoke$arity$2(cljs.core.meta(block_ast_to_replace_embed),(0));
var block_ast_coll_replaced = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(((function (block_ast_coll__$1,result_block_ast_tcoll,block_ast_coll_to_replace_references,block_ast_coll_to_replace_embeds,vec__102975,seq__102976,first__102977,seq__102976__$1,block_ast_to_replace_embed,other_block_asts_to_replace_embed,embed_depth){
return (function (p1__102962_SHARP_){
return cljs.core.with_meta(p1__102962_SHARP_,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"embed-depth","embed-depth",874062386),(embed_depth + (1))], null));
});})(block_ast_coll__$1,result_block_ast_tcoll,block_ast_coll_to_replace_references,block_ast_coll_to_replace_embeds,vec__102975,seq__102976,first__102977,seq__102976__$1,block_ast_to_replace_embed,other_block_asts_to_replace_embed,embed_depth))
,frontend.handler.export$.common.replace_block_AMPERSAND_page_embeds(block_ast_to_replace_embed));
if(cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"replace-ref-embed","replace-ref-embed",-2123548135),new cljs.core.Keyword(null,"block&page-embed-replaced?","block&page-embed-replaced?",-180485858)], null)))){
(frontend.handler.export$.common._STAR_state_STAR_ = cljs.core.assoc_in(frontend.handler.export$.common._STAR_state_STAR_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"replace-ref-embed","replace-ref-embed",-2123548135),new cljs.core.Keyword(null,"block&page-embed-replaced?","block&page-embed-replaced?",-180485858)], null),false));

var G__103206 = block_ast_coll__$1;
var G__103207 = result_block_ast_tcoll;
var G__103208 = cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(block_ast_coll_to_replace_references,block_ast_coll_replaced));
var G__103209 = cljs.core.vec(other_block_asts_to_replace_embed);
block_ast_coll__$1 = G__103206;
result_block_ast_tcoll = G__103207;
block_ast_coll_to_replace_references = G__103208;
block_ast_coll_to_replace_embeds = G__103209;
continue;
} else {
var G__103211 = block_ast_coll__$1;
var G__103212 = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core.conj_BANG_,result_block_ast_tcoll,block_ast_coll_replaced);
var G__103213 = cljs.core.vec(block_ast_coll_to_replace_references);
var G__103214 = cljs.core.vec(other_block_asts_to_replace_embed);
block_ast_coll__$1 = G__103211;
result_block_ast_tcoll = G__103212;
block_ast_coll_to_replace_references = G__103213;
block_ast_coll_to_replace_embeds = G__103214;
continue;
}
} else {
var vec__102978 = block_ast_coll__$1;
var seq__102979 = cljs.core.seq(vec__102978);
var first__102980 = cljs.core.first(seq__102979);
var seq__102979__$1 = cljs.core.next(seq__102979);
var block_ast = first__102980;
var other_block_ast = seq__102979__$1;
if(cljs.core.not(block_ast)){
return cljs.core.persistent_BANG_(result_block_ast_tcoll);
} else {
var G__103218 = other_block_ast;
var G__103219 = result_block_ast_tcoll;
var G__103220 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(block_ast_coll_to_replace_references,block_ast);
var G__103221 = cljs.core.vec(block_ast_coll_to_replace_embeds);
block_ast_coll__$1 = G__103218;
result_block_ast_tcoll = G__103219;
block_ast_coll_to_replace_references = G__103220;
block_ast_coll_to_replace_embeds = G__103221;
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
frontend.handler.export$.common.Properties_block_ast_QMARK_ = (function frontend$handler$export$common$Properties_block_ast_QMARK_(p__102981){
var vec__102982 = p__102981;
var tp = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102982,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102982,(1),null);
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(tp,"Properties");
});
/**
 * works on block-ast
 *   replace all heading with paragraph when indent-style is no-indent
 */
frontend.handler.export$.common.replace_Heading_with_Paragraph = (function frontend$handler$export$common$replace_Heading_with_Paragraph(heading_ast){
var vec__102985 = heading_ast;
var heading_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102985,(0),null);
var map__102988 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102985,(1),null);
var map__102988__$1 = cljs.core.__destructure_map(map__102988);
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102988__$1,new cljs.core.Keyword(null,"title","title",636505583));
var marker = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102988__$1,new cljs.core.Keyword(null,"marker","marker",865118313));
var priority = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102988__$1,new cljs.core.Keyword(null,"priority","priority",1431093715));
var size = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102988__$1,new cljs.core.Keyword(null,"size","size",1098693007));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(heading_type,"Heading")){
var inline_coll = (function (){var G__102989 = title;
var G__102989__$1 = (cljs.core.truth_(priority)?cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Plain",[frontend.handler.export$.common.priority__GT_string(priority)," "].join('')], null),G__102989):G__102989);
var G__102989__$2 = (cljs.core.truth_(marker)?cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Plain",[cljs.core.str.cljs$core$IFn$_invoke$arity$1(marker)," "].join('')], null),G__102989__$1):G__102989__$1);
var G__102989__$3 = (cljs.core.truth_(size)?cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Plain",[cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core.str,cljs.core.repeat.cljs$core$IFn$_invoke$arity$2(size,"#")))," "].join('')], null),G__102989__$2):G__102989__$2);
return cljs.core.vec(G__102989__$3);

})();
return frontend.handler.export$.common.mk_paragraph_ast(inline_coll,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"origin-ast","origin-ast",915928394),heading_ast], null));
} else {
return heading_ast;
}
});
frontend.handler.export$.common.keep_only_level_LT__EQ_n = (function frontend$handler$export$common$keep_only_level_LT__EQ_n(block_ast_coll,n){
return cljs.core.persistent_BANG_(new cljs.core.Keyword(null,"result-ast-tcoll","result-ast-tcoll",1530092637).cljs$core$IFn$_invoke$arity$1(cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (p__102990,ast){
var map__102991 = p__102990;
var map__102991__$1 = cljs.core.__destructure_map(map__102991);
var r = map__102991__$1;
var result_ast_tcoll = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102991__$1,new cljs.core.Keyword(null,"result-ast-tcoll","result-ast-tcoll",1530092637));
var accepted_heading = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102991__$1,new cljs.core.Keyword(null,"accepted-heading","accepted-heading",-1816434288));
var vec__102992 = ast;
var heading_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102992,(0),null);
var map__102995 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102992,(1),null);
var map__102995__$1 = cljs.core.__destructure_map(map__102995);
var level = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102995__$1,new cljs.core.Keyword(null,"level","level",1290497552));
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
var vec__102996 = inline_ast;
var ast_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102996,(0),null);
var ast_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102996,(1),null);
var G__102999 = ast_type;
switch (G__102999) {
case "Emphasis":
var vec__103000 = ast_content;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103000,(0),null);
var inline_coll = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103000,(1),null);
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
var vec__103003 = inline_ast;
var ast_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103003,(0),null);
var ast_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103003,(1),null);
var G__103006 = ast_type;
switch (G__103006) {
case "Link":
var map__103007 = ast_content;
var map__103007__$1 = cljs.core.__destructure_map(map__103007);
var url = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103007__$1,new cljs.core.Keyword(null,"url","url",276297046));
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103007__$1,new cljs.core.Keyword(null,"label","label",1718410804));
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
var vec__103008 = inline_ast;
var ast_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103008,(0),null);
var _ast_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103008,(1),null);
var G__103011 = ast_type;
switch (G__103011) {
case "Tag":
return cljs.core.PersistentVector.EMPTY;

break;
default:
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [inline_ast], null);

}
});
frontend.handler.export$.common.remove_prefix_spaces_in_Plain = (function frontend$handler$export$common$remove_prefix_spaces_in_Plain(inline_coll){
return new cljs.core.Keyword(null,"r","r",-471384190).cljs$core$IFn$_invoke$arity$1(cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (p__103012,ast){
var map__103013 = p__103012;
var map__103013__$1 = cljs.core.__destructure_map(map__103013);
var r = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103013__$1,new cljs.core.Keyword(null,"r","r",-471384190));
var after_break_line_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103013__$1,new cljs.core.Keyword(null,"after-break-line?","after-break-line?",-2088072838));
var vec__103014 = ast;
var ast_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103014,(0),null);
var ast_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103014,(1),null);
var G__103017 = ast_type;
switch (G__103017) {
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
return cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__103019_SHARP_){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (inline_ast_coll,f){
return cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(f,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([inline_ast_coll], 0)));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [p1__103019_SHARP_], null),mapcat_fns_on_inline_ast);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__103018_SHARP_){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (inline_ast,f){
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(inline_ast) : f.call(null,inline_ast));
}),p1__103018_SHARP_,map_fns_on_inline_ast);
}),cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (inline_coll__$1,f){
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(inline_coll__$1) : f.call(null,inline_coll__$1));
}),inline_coll,fns_on_inline_coll))], 0)));
});
frontend.handler.export$.common.walk_block_ast_for_list = (function frontend$handler$export$common$walk_block_ast_for_list(list_items,map_fns_on_inline_ast,mapcat_fns_on_inline_ast){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p__103022){
var map__103023 = p__103022;
var map__103023__$1 = cljs.core.__destructure_map(map__103023);
var item = map__103023__$1;
var block_ast_coll = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103023__$1,new cljs.core.Keyword(null,"content","content",15833224));
var sub_items = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103023__$1,new cljs.core.Keyword(null,"items","items",1031954938));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(item,new cljs.core.Keyword(null,"content","content",15833224),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(cljs.core.partial.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common.walk_block_ast,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"map-fns-on-inline-ast","map-fns-on-inline-ast",-1834139513),map_fns_on_inline_ast,new cljs.core.Keyword(null,"mapcat-fns-on-inline-ast","mapcat-fns-on-inline-ast",-988900078),mapcat_fns_on_inline_ast], null)),block_ast_coll),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"items","items",1031954938),(frontend.handler.export$.common.walk_block_ast_for_list.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.export$.common.walk_block_ast_for_list.cljs$core$IFn$_invoke$arity$3(sub_items,map_fns_on_inline_ast,mapcat_fns_on_inline_ast) : frontend.handler.export$.common.walk_block_ast_for_list.call(null,sub_items,map_fns_on_inline_ast,mapcat_fns_on_inline_ast))], 0));
}),list_items);
});
frontend.handler.export$.common.walk_block_ast = (function frontend$handler$export$common$walk_block_ast(p__103025,block_ast){
var map__103026 = p__103025;
var map__103026__$1 = cljs.core.__destructure_map(map__103026);
var fns = map__103026__$1;
var map_fns_on_inline_ast = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103026__$1,new cljs.core.Keyword(null,"map-fns-on-inline-ast","map-fns-on-inline-ast",-1834139513));
var mapcat_fns_on_inline_ast = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103026__$1,new cljs.core.Keyword(null,"mapcat-fns-on-inline-ast","mapcat-fns-on-inline-ast",-988900078));
var fns_on_inline_coll = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103026__$1,new cljs.core.Keyword(null,"fns-on-inline-coll","fns-on-inline-coll",-2007934714));
var vec__103027 = block_ast;
var ast_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103027,(0),null);
var ast_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103027,(1),null);
var G__103030 = ast_type;
switch (G__103030) {
case "Paragraph":
return frontend.handler.export$.common.mk_paragraph_ast(frontend.handler.export$.common.walk_block_ast_helper(ast_content,map_fns_on_inline_ast,mapcat_fns_on_inline_ast,fns_on_inline_coll),cljs.core.meta(block_ast));

break;
case "Heading":
var map__103031 = ast_content;
var map__103031__$1 = cljs.core.__destructure_map(map__103031);
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103031__$1,new cljs.core.Keyword(null,"title","title",636505583));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Heading",cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ast_content,new cljs.core.Keyword(null,"title","title",636505583),frontend.handler.export$.common.walk_block_ast_helper(title,map_fns_on_inline_ast,mapcat_fns_on_inline_ast,fns_on_inline_coll))], null);

break;
case "List":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["List",frontend.handler.export$.common.walk_block_ast_for_list(ast_content,map_fns_on_inline_ast,mapcat_fns_on_inline_ast)], null);

break;
case "Quote":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Quote",cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(cljs.core.partial.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common.walk_block_ast,fns),ast_content)], null);

break;
case "Footnote_Definition":
var vec__103032 = cljs.core.rest(block_ast);
var name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103032,(0),null);
var contents = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103032,(1),null);
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Footnote_Definition",name,frontend.handler.export$.common.walk_block_ast_helper(contents,map_fns_on_inline_ast,mapcat_fns_on_inline_ast,fns_on_inline_coll)], null);

break;
case "Table":
var map__103035 = ast_content;
var map__103035__$1 = cljs.core.__destructure_map(map__103035);
var header = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103035__$1,new cljs.core.Keyword(null,"header","header",119441134));
var groups = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103035__$1,new cljs.core.Keyword(null,"groups","groups",-136896102));
var header_STAR_ = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__103024_SHARP_){
return frontend.handler.export$.common.walk_block_ast_helper(p1__103024_SHARP_,map_fns_on_inline_ast,mapcat_fns_on_inline_ast,fns_on_inline_coll);
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
var len__5726__auto___103264 = arguments.length;
var i__5727__auto___103265 = (0);
while(true){
if((i__5727__auto___103265 < len__5726__auto___103264)){
args__5732__auto__.push((arguments[i__5727__auto___103265]));

var G__103267 = (i__5727__auto___103265 + (1));
i__5727__auto___103265 = G__103267;
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
(frontend.handler.export$.common.raw_text.cljs$lang$applyTo = (function (seq103036){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq103036));
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

var G__103044 = new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(simple_ast);
var G__103044__$1 = (((G__103044 instanceof cljs.core.Keyword))?G__103044.fqn:null);
switch (G__103044__$1) {
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
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__103044__$1)].join('')));

}
});
frontend.handler.export$.common.merge_adjacent_spaces_AMPERSAND_newlines = (function frontend$handler$export$common$merge_adjacent_spaces_AMPERSAND_newlines(simple_ast_coll){
var r = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
var last_ast = null;
var last_raw_text_space_suffix_QMARK_ = false;
var last_raw_text_newline_suffix_QMARK_ = false;
var G__103049 = simple_ast_coll;
var vec__103050 = G__103049;
var seq__103051 = cljs.core.seq(vec__103050);
var first__103052 = cljs.core.first(seq__103051);
var seq__103051__$1 = cljs.core.next(seq__103051);
var simple_ast = first__103052;
var other_ast_coll = seq__103051__$1;
var r__$1 = r;
var last_ast__$1 = last_ast;
var last_raw_text_space_suffix_QMARK___$1 = last_raw_text_space_suffix_QMARK_;
var last_raw_text_newline_suffix_QMARK___$1 = last_raw_text_newline_suffix_QMARK_;
var G__103049__$1 = G__103049;
while(true){
var r__$2 = r__$1;
var last_ast__$2 = last_ast__$1;
var last_raw_text_space_suffix_QMARK___$2 = last_raw_text_space_suffix_QMARK___$1;
var last_raw_text_newline_suffix_QMARK___$2 = last_raw_text_newline_suffix_QMARK___$1;
var vec__103081 = G__103049__$1;
var seq__103082 = cljs.core.seq(vec__103081);
var first__103083 = cljs.core.first(seq__103082);
var seq__103082__$1 = cljs.core.next(seq__103082);
var simple_ast__$1 = first__103083;
var other_ast_coll__$1 = seq__103082__$1;
if((simple_ast__$1 == null)){
return cljs.core.persistent_BANG_((cljs.core.truth_(last_ast__$2)?cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(r__$2,last_ast__$2):r__$2));
} else {
var tp = new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(simple_ast__$1);
var last_ast_type = new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(last_ast__$2);
var G__103085 = tp;
var G__103085__$1 = (((G__103085 instanceof cljs.core.Keyword))?G__103085.fqn:null);
switch (G__103085__$1) {
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
var G__103277 = r__$2;
var G__103278 = last_ast__$2;
var G__103279 = last_raw_text_space_suffix_QMARK___$2;
var G__103280 = last_raw_text_newline_suffix_QMARK___$2;
var G__103281 = other_ast_coll__$1;
r__$1 = G__103277;
last_ast__$1 = G__103278;
last_raw_text_space_suffix_QMARK___$1 = G__103279;
last_raw_text_newline_suffix_QMARK___$1 = G__103280;
G__103049__$1 = G__103281;
continue;
} else {
var G__103283 = (cljs.core.truth_(last_ast__$2)?cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(r__$2,last_ast__$2):r__$2);
var G__103284 = simple_ast__$1;
var G__103285 = false;
var G__103286 = false;
var G__103287 = other_ast_coll__$1;
r__$1 = G__103283;
last_ast__$1 = G__103284;
last_raw_text_space_suffix_QMARK___$1 = G__103285;
last_raw_text_newline_suffix_QMARK___$1 = G__103286;
G__103049__$1 = G__103287;
continue;
}

break;
case "newline":
var G__103086 = last_ast_type;
var G__103086__$1 = (((G__103086 instanceof cljs.core.Keyword))?G__103086.fqn:null);
switch (G__103086__$1) {
case "space":
case "indent":
var G__103290 = r__$2;
var G__103291 = simple_ast__$1;
var G__103292 = false;
var G__103293 = false;
var G__103294 = other_ast_coll__$1;
r__$1 = G__103290;
last_ast__$1 = G__103291;
last_raw_text_space_suffix_QMARK___$1 = G__103292;
last_raw_text_newline_suffix_QMARK___$1 = G__103293;
G__103049__$1 = G__103294;
continue;

break;
case "newline":
var last_newline_count = new cljs.core.Keyword(null,"line-count","line-count",871713181).cljs$core$IFn$_invoke$arity$1(last_ast__$2);
var current_newline_count = new cljs.core.Keyword(null,"line-count","line-count",871713181).cljs$core$IFn$_invoke$arity$1(simple_ast__$1);
var kept_ast = (((last_newline_count > current_newline_count))?last_ast__$2:simple_ast__$1);
var G__103295 = r__$2;
var G__103296 = kept_ast;
var G__103297 = false;
var G__103298 = false;
var G__103299 = other_ast_coll__$1;
r__$1 = G__103295;
last_ast__$1 = G__103296;
last_raw_text_space_suffix_QMARK___$1 = G__103297;
last_raw_text_newline_suffix_QMARK___$1 = G__103298;
G__103049__$1 = G__103299;
continue;

break;
case "raw-text":
if(cljs.core.truth_(last_raw_text_newline_suffix_QMARK___$2)){
var G__103300 = r__$2;
var G__103301 = last_ast__$2;
var G__103302 = last_raw_text_space_suffix_QMARK___$2;
var G__103303 = last_raw_text_newline_suffix_QMARK___$2;
var G__103304 = other_ast_coll__$1;
r__$1 = G__103300;
last_ast__$1 = G__103301;
last_raw_text_space_suffix_QMARK___$1 = G__103302;
last_raw_text_newline_suffix_QMARK___$1 = G__103303;
G__103049__$1 = G__103304;
continue;
} else {
var G__103307 = (cljs.core.truth_(last_ast__$2)?cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(r__$2,last_ast__$2):r__$2);
var G__103308 = simple_ast__$1;
var G__103309 = false;
var G__103310 = false;
var G__103311 = other_ast_coll__$1;
r__$1 = G__103307;
last_ast__$1 = G__103308;
last_raw_text_space_suffix_QMARK___$1 = G__103309;
last_raw_text_newline_suffix_QMARK___$1 = G__103310;
G__103049__$1 = G__103311;
continue;
}

break;
default:
var G__103324 = r__$2;
var G__103325 = simple_ast__$1;
var G__103326 = false;
var G__103327 = false;
var G__103328 = other_ast_coll__$1;
r__$1 = G__103324;
last_ast__$1 = G__103325;
last_raw_text_space_suffix_QMARK___$1 = G__103326;
last_raw_text_newline_suffix_QMARK___$1 = G__103327;
G__103049__$1 = G__103328;
continue;

}

break;
case "indent":
var G__103087 = last_ast_type;
var G__103087__$1 = (((G__103087 instanceof cljs.core.Keyword))?G__103087.fqn:null);
switch (G__103087__$1) {
case "space":
case "indent":
var G__103330 = r__$2;
var G__103331 = simple_ast__$1;
var G__103332 = false;
var G__103333 = false;
var G__103334 = other_ast_coll__$1;
r__$1 = G__103330;
last_ast__$1 = G__103331;
last_raw_text_space_suffix_QMARK___$1 = G__103332;
last_raw_text_newline_suffix_QMARK___$1 = G__103333;
G__103049__$1 = G__103334;
continue;

break;
case "newline":
var G__103335 = (cljs.core.truth_(last_ast__$2)?cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(r__$2,last_ast__$2):r__$2);
var G__103336 = simple_ast__$1;
var G__103337 = false;
var G__103338 = false;
var G__103339 = other_ast_coll__$1;
r__$1 = G__103335;
last_ast__$1 = G__103336;
last_raw_text_space_suffix_QMARK___$1 = G__103337;
last_raw_text_newline_suffix_QMARK___$1 = G__103338;
G__103049__$1 = G__103339;
continue;

break;
case "raw-text":
if(cljs.core.truth_(last_raw_text_space_suffix_QMARK___$2)){
var G__103340 = r__$2;
var G__103341 = last_ast__$2;
var G__103342 = last_raw_text_space_suffix_QMARK___$2;
var G__103343 = last_raw_text_newline_suffix_QMARK___$2;
var G__103344 = other_ast_coll__$1;
r__$1 = G__103340;
last_ast__$1 = G__103341;
last_raw_text_space_suffix_QMARK___$1 = G__103342;
last_raw_text_newline_suffix_QMARK___$1 = G__103343;
G__103049__$1 = G__103344;
continue;
} else {
var G__103345 = (cljs.core.truth_(last_ast__$2)?cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(r__$2,last_ast__$2):r__$2);
var G__103346 = simple_ast__$1;
var G__103347 = false;
var G__103348 = false;
var G__103349 = other_ast_coll__$1;
r__$1 = G__103345;
last_ast__$1 = G__103346;
last_raw_text_space_suffix_QMARK___$1 = G__103347;
last_raw_text_newline_suffix_QMARK___$1 = G__103348;
G__103049__$1 = G__103349;
continue;
}

break;
default:
var G__103350 = r__$2;
var G__103351 = simple_ast__$1;
var G__103352 = false;
var G__103353 = false;
var G__103354 = other_ast_coll__$1;
r__$1 = G__103350;
last_ast__$1 = G__103351;
last_raw_text_space_suffix_QMARK___$1 = G__103352;
last_raw_text_newline_suffix_QMARK___$1 = G__103353;
G__103049__$1 = G__103354;
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
var newline_prefix_QMARK_ = (function (){var G__103088 = first_ch;
var G__103088__$1 = (((G__103088 == null))?null:(function (){var fexpr__103089 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["\r",null,"\n",null], null), null);
return (fexpr__103089.cljs$core$IFn$_invoke$arity$1 ? fexpr__103089.cljs$core$IFn$_invoke$arity$1(G__103088) : fexpr__103089.call(null,G__103088));
})());
if((G__103088__$1 == null)){
return null;
} else {
return cljs.core.boolean$(G__103088__$1);
}
})();
var newline_suffix_QMARK_ = (function (){var G__103090 = last_ch;
var G__103090__$1 = (((G__103090 == null))?null:(function (){var fexpr__103091 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, ["\n",null], null), null);
return (fexpr__103091.cljs$core$IFn$_invoke$arity$1 ? fexpr__103091.cljs$core$IFn$_invoke$arity$1(G__103090) : fexpr__103091.call(null,G__103090));
})());
if((G__103090__$1 == null)){
return null;
} else {
return cljs.core.boolean$(G__103090__$1);
}
})();
var space_prefix_QMARK_ = (function (){var G__103092 = first_ch;
var G__103092__$1 = (((G__103092 == null))?null:(function (){var fexpr__103093 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [" ",null], null), null);
return (fexpr__103093.cljs$core$IFn$_invoke$arity$1 ? fexpr__103093.cljs$core$IFn$_invoke$arity$1(G__103092) : fexpr__103093.call(null,G__103092));
})());
if((G__103092__$1 == null)){
return null;
} else {
return cljs.core.boolean$(G__103092__$1);
}
})();
var space_suffix_QMARK_ = (function (){var G__103094 = last_ch;
var G__103094__$1 = (((G__103094 == null))?null:(function (){var fexpr__103095 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [" ",null], null), null);
return (fexpr__103095.cljs$core$IFn$_invoke$arity$1 ? fexpr__103095.cljs$core$IFn$_invoke$arity$1(G__103094) : fexpr__103095.call(null,G__103094));
})());
if((G__103094__$1 == null)){
return null;
} else {
return cljs.core.boolean$(G__103094__$1);
}
})();
if(empty_content_QMARK_){
var G__103358 = r__$2;
var G__103359 = last_ast__$2;
var G__103360 = last_raw_text_space_suffix_QMARK___$2;
var G__103361 = last_raw_text_newline_suffix_QMARK___$2;
var G__103362 = other_ast_coll__$1;
r__$1 = G__103358;
last_ast__$1 = G__103359;
last_raw_text_space_suffix_QMARK___$1 = G__103360;
last_raw_text_newline_suffix_QMARK___$1 = G__103361;
G__103049__$1 = G__103362;
continue;
} else {
if(cljs.core.truth_(newline_prefix_QMARK_)){
var G__103096 = last_ast_type;
var G__103096__$1 = (((G__103096 instanceof cljs.core.Keyword))?G__103096.fqn:null);
switch (G__103096__$1) {
case "space":
case "indent":
case "newline":
var G__103365 = r__$2;
var G__103366 = simple_ast__$1;
var G__103367 = space_suffix_QMARK_;
var G__103368 = newline_suffix_QMARK_;
var G__103369 = other_ast_coll__$1;
r__$1 = G__103365;
last_ast__$1 = G__103366;
last_raw_text_space_suffix_QMARK___$1 = G__103367;
last_raw_text_newline_suffix_QMARK___$1 = G__103368;
G__103049__$1 = G__103369;
continue;

break;
case "raw-text":
var G__103370 = (cljs.core.truth_(last_ast__$2)?cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(r__$2,last_ast__$2):r__$2);
var G__103371 = simple_ast__$1;
var G__103372 = space_suffix_QMARK_;
var G__103373 = newline_suffix_QMARK_;
var G__103374 = other_ast_coll__$1;
r__$1 = G__103370;
last_ast__$1 = G__103371;
last_raw_text_space_suffix_QMARK___$1 = G__103372;
last_raw_text_newline_suffix_QMARK___$1 = G__103373;
G__103049__$1 = G__103374;
continue;

break;
default:
var G__103375 = r__$2;
var G__103376 = simple_ast__$1;
var G__103377 = space_suffix_QMARK_;
var G__103378 = newline_suffix_QMARK_;
var G__103379 = other_ast_coll__$1;
r__$1 = G__103375;
last_ast__$1 = G__103376;
last_raw_text_space_suffix_QMARK___$1 = G__103377;
last_raw_text_newline_suffix_QMARK___$1 = G__103378;
G__103049__$1 = G__103379;
continue;

}
} else {
if(cljs.core.truth_(space_prefix_QMARK_)){
var G__103097 = last_ast_type;
var G__103097__$1 = (((G__103097 instanceof cljs.core.Keyword))?G__103097.fqn:null);
switch (G__103097__$1) {
case "space":
case "indent":
var G__103381 = r__$2;
var G__103382 = simple_ast__$1;
var G__103383 = space_suffix_QMARK_;
var G__103384 = newline_suffix_QMARK_;
var G__103385 = other_ast_coll__$1;
r__$1 = G__103381;
last_ast__$1 = G__103382;
last_raw_text_space_suffix_QMARK___$1 = G__103383;
last_raw_text_newline_suffix_QMARK___$1 = G__103384;
G__103049__$1 = G__103385;
continue;

break;
case "newline":
case "raw-text":
var G__103386 = (cljs.core.truth_(last_ast__$2)?cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(r__$2,last_ast__$2):r__$2);
var G__103387 = simple_ast__$1;
var G__103388 = space_suffix_QMARK_;
var G__103389 = newline_suffix_QMARK_;
var G__103390 = other_ast_coll__$1;
r__$1 = G__103386;
last_ast__$1 = G__103387;
last_raw_text_space_suffix_QMARK___$1 = G__103388;
last_raw_text_newline_suffix_QMARK___$1 = G__103389;
G__103049__$1 = G__103390;
continue;

break;
default:
var G__103391 = r__$2;
var G__103392 = simple_ast__$1;
var G__103393 = space_suffix_QMARK_;
var G__103394 = newline_suffix_QMARK_;
var G__103395 = other_ast_coll__$1;
r__$1 = G__103391;
last_ast__$1 = G__103392;
last_raw_text_space_suffix_QMARK___$1 = G__103393;
last_raw_text_newline_suffix_QMARK___$1 = G__103394;
G__103049__$1 = G__103395;
continue;

}
} else {
var G__103399 = (cljs.core.truth_(last_ast__$2)?cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(r__$2,last_ast__$2):r__$2);
var G__103400 = simple_ast__$1;
var G__103401 = space_suffix_QMARK_;
var G__103402 = newline_suffix_QMARK_;
var G__103403 = other_ast_coll__$1;
r__$1 = G__103399;
last_ast__$1 = G__103400;
last_raw_text_space_suffix_QMARK___$1 = G__103401;
last_raw_text_newline_suffix_QMARK___$1 = G__103402;
G__103049__$1 = G__103403;
continue;

}
}
}

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__103085__$1)].join('')));

}
}
break;
}
});
frontend.handler.export$.common.simple_asts__GT_string = (function frontend$handler$export$common$simple_asts__GT_string(simple_ast_coll){
return clojure.string.join.cljs$core$IFn$_invoke$arity$1(cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(frontend.handler.export$.common.simple_ast__GT_string,frontend.handler.export$.common.merge_adjacent_spaces_AMPERSAND_newlines(frontend.handler.export$.common.merge_adjacent_spaces_AMPERSAND_newlines(simple_ast_coll))));
});

//# sourceMappingURL=frontend.handler.export.common.js.map
