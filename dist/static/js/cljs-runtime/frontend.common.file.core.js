goog.provide('frontend.common.file.core');
frontend.common.file.core.indented_block_content = (function frontend$common$file$core$indented_block_content(content,spaces_tabs){
var lines = clojure.string.split_lines(content);
return clojure.string.join.cljs$core$IFn$_invoke$arity$2(["\n",cljs.core.str.cljs$core$IFn$_invoke$arity$1(spaces_tabs)].join(''),lines);
});
/**
 * Only accept nake content (without any indentation)
 */
frontend.common.file.core.content_with_collapsed_state = (function frontend$common$file$core$content_with_collapsed_state(repo,format,content,collapsed_QMARK_){
if(cljs.core.truth_(collapsed_QMARK_)){
return logseq.graph_parser.property.insert_property.cljs$core$IFn$_invoke$arity$5(repo,format,content,new cljs.core.Keyword(null,"collapsed","collapsed",-628494523),true);
} else {
if(collapsed_QMARK_ === false){
return logseq.graph_parser.property.remove_property.cljs$core$IFn$_invoke$arity$3(format,new cljs.core.Keyword(null,"collapsed","collapsed",-628494523),content);
} else {
return content;

}
}
});
frontend.common.file.core.transform_content = (function frontend$common$file$core$transform_content(repo,db,p__154832,level,p__154833,context,p__154834){
var map__154839 = p__154832;
var map__154839__$1 = cljs.core.__destructure_map(map__154839);
var b = map__154839__$1;
var collapsed_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__154839__$1,new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991));
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__154839__$1,new cljs.core.Keyword("block","format","block/format",-1212045901));
var pre_block_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__154839__$1,new cljs.core.Keyword("block","pre-block?","block/pre-block?",-1671958521));
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__154839__$1,new cljs.core.Keyword("block","properties","block/properties",708347145));
var map__154840 = p__154833;
var map__154840__$1 = cljs.core.__destructure_map(map__154840);
var heading_to_list_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__154840__$1,new cljs.core.Keyword(null,"heading-to-list?","heading-to-list?",2108324466));
var map__154841 = p__154834;
var map__154841__$1 = cljs.core.__destructure_map(map__154841);
var db_based_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__154841__$1,new cljs.core.Keyword(null,"db-based?","db-based?",-1746581232));
var title = (function (){var or__5002__auto__ = new cljs.core.Keyword("block","raw-title","block/raw-title",1833669090).cljs$core$IFn$_invoke$arity$1(b);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(b);
}
})();
var block_ref_not_saved_QMARK_ = (function (){var and__5000__auto__ = cljs.core.not(db_based_QMARK_);
if(and__5000__auto__){
var and__5000__auto____$1 = cljs.core.first(new cljs.core.Keyword("block","_refs","block/_refs",830218531).cljs$core$IFn$_invoke$arity$1((function (){var G__154857 = db;
var G__154858 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(b);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__154857,G__154858) : datascript.core.entity.call(null,G__154857,G__154858));
})()));
if(cljs.core.truth_(and__5000__auto____$1)){
return (!(clojure.string.includes_QMARK_(title,cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(b)))));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
var heading = new cljs.core.Keyword(null,"heading","heading",-1312171873).cljs$core$IFn$_invoke$arity$1(properties);
var title__$1 = (cljs.core.truth_(db_based_QMARK_)?logseq.db.frontend.content.recur_replace_uuid_in_block_title.cljs$core$IFn$_invoke$arity$1((function (){var G__154861 = db;
var G__154862 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(b);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__154861,G__154862) : datascript.core.entity.call(null,G__154861,G__154862));
})()):title);
var content = (function (){var or__5002__auto__ = title__$1;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})();
var content__$1 = (cljs.core.truth_(pre_block_QMARK_)?(function (){var content__$1 = clojure.string.trim(content);
return [content__$1,"\n"].join('');
})():(function (){var vec__154865 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(format,new cljs.core.Keyword(null,"org","org",1495985)))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,cljs.core.repeat.cljs$core$IFn$_invoke$arity$2(level,"*")),""], null):(function (){var level__$1 = (cljs.core.truth_((function (){var and__5000__auto__ = heading_to_list_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return heading;
} else {
return and__5000__auto__;
}
})())?(((heading > (1)))?(heading - (1)):heading):level);
var spaces_tabs = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,cljs.core.repeat.cljs$core$IFn$_invoke$arity$2((level__$1 - (1)),new cljs.core.Keyword(null,"export-bullet-indentation","export-bullet-indentation",-248047595).cljs$core$IFn$_invoke$arity$1(context)));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [[cljs.core.str.cljs$core$IFn$_invoke$arity$1(spaces_tabs),"-"].join(''),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(spaces_tabs),"  "].join('')], null);
})()
);
var prefix = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__154865,(0),null);
var spaces_tabs = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__154865,(1),null);
var content__$1 = (cljs.core.truth_(heading_to_list_QMARK_)?clojure.string.replace(clojure.string.replace(content,/^\s?#+\s+/,""),/^\s?#+\s?$/,""):content);
var content__$2 = (cljs.core.truth_(db_based_QMARK_)?content__$1:frontend.common.file.core.content_with_collapsed_state(repo,format,content__$1,collapsed_QMARK_));
var new_content = frontend.common.file.core.indented_block_content(clojure.string.trim(content__$2),spaces_tabs);
var sep = ((clojure.string.blank_QMARK_(new_content))?"":" ");
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(prefix),sep,new_content].join('');
})()
);
if(cljs.core.truth_(block_ref_not_saved_QMARK_)){
return logseq.graph_parser.property.insert_property.cljs$core$IFn$_invoke$arity$5(repo,format,content__$1,new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(b)));
} else {
return content__$1;
}
});
frontend.common.file.core.tree__GT_file_content_aux = (function frontend$common$file$core$tree__GT_file_content_aux(repo,db,tree,p__154884,context){
var map__154885 = p__154884;
var map__154885__$1 = cljs.core.__destructure_map(map__154885);
var opts = map__154885__$1;
var init_level = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__154885__$1,new cljs.core.Keyword(null,"init-level","init-level",-1605905283));
var link = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__154885__$1,new cljs.core.Keyword(null,"link","link",-1769163468));
var db_based_QMARK_ = logseq.db.sqlite.util.db_based_graph_QMARK_(repo);
var block_contents = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
var G__154894 = tree;
var vec__154895 = G__154894;
var seq__154896 = cljs.core.seq(vec__154895);
var first__154897 = cljs.core.first(seq__154896);
var seq__154896__$1 = cljs.core.next(seq__154896);
var f = first__154897;
var r = seq__154896__$1;
var level = init_level;
var G__154894__$1 = G__154894;
var level__$1 = level;
while(true){
var vec__154923 = G__154894__$1;
var seq__154924 = cljs.core.seq(vec__154923);
var first__154925 = cljs.core.first(seq__154924);
var seq__154924__$1 = cljs.core.next(seq__154924);
var f__$1 = first__154925;
var r__$1 = seq__154924__$1;
var level__$2 = level__$1;
if((f__$1 == null)){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.flatten(cljs.core.persistent_BANG_(block_contents)));
} else {
var page_QMARK_ = (new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(f__$1) == null);
var content = ((((page_QMARK_) && (cljs.core.not(link))))?null:frontend.common.file.core.transform_content(repo,db,f__$1,level__$2,opts,context,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"db-based?","db-based?",-1746581232),db_based_QMARK_], null)));
var new_content = (function (){var temp__5802__auto__ = cljs.core.seq(new cljs.core.Keyword("block","children","block/children",-1040716209).cljs$core$IFn$_invoke$arity$1(f__$1));
if(temp__5802__auto__){
var children = temp__5802__auto__;
return cljs.core.cons(content,(function (){var G__154939 = repo;
var G__154940 = db;
var G__154941 = children;
var G__154942 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"init-level","init-level",-1605905283),(level__$2 + (1))], null);
var G__154943 = context;
return (frontend.common.file.core.tree__GT_file_content_aux.cljs$core$IFn$_invoke$arity$5 ? frontend.common.file.core.tree__GT_file_content_aux.cljs$core$IFn$_invoke$arity$5(G__154939,G__154940,G__154941,G__154942,G__154943) : frontend.common.file.core.tree__GT_file_content_aux.call(null,G__154939,G__154940,G__154941,G__154942,G__154943));
})());
} else {
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [content], null);
}
})();
cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(block_contents,new_content);

var G__155021 = r__$1;
var G__155022 = level__$2;
G__154894__$1 = G__155021;
level__$1 = G__155022;
continue;
}
break;
}
});
/**
 * Used by both file and DB graphs for export and for file-graph specific features
 */
frontend.common.file.core.tree__GT_file_content = (function frontend$common$file$core$tree__GT_file_content(repo,db,tree,opts,context){
return clojure.string.join.cljs$core$IFn$_invoke$arity$2("\n",frontend.common.file.core.tree__GT_file_content_aux(repo,db,tree,opts,context));
});
frontend.common.file.core.update_block_content = (function frontend$common$file$core$update_block_content(db,item,eid){
if(cljs.core.truth_(logseq.db.common.entity_plus.db_based_graph_QMARK_(db))){
return logseq.db.frontend.content.update_block_content(db,item,eid);
} else {
return item;
}
});
/**
 * Converts a block including its children (recursively) to plain-text.
 */
frontend.common.file.core.block__GT_content = (function frontend$common$file$core$block__GT_content(repo,db,root_block_uuid,tree__GT_file_opts,context){
if(cljs.core.uuid_QMARK_(root_block_uuid)){
} else {
throw (new Error("Assert failed: (uuid? root-block-uuid)"));
}

var init_level = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"init-level","init-level",-1605905283).cljs$core$IFn$_invoke$arity$1(tree__GT_file_opts);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
if(cljs.core.truth_((function (){var G__154982 = (function (){var G__154983 = db;
var G__154984 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),root_block_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__154983,G__154984) : datascript.core.entity.call(null,G__154983,G__154984));
})();
return (logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(G__154982) : logseq.db.page_QMARK_.call(null,G__154982));
})())){
return (0);
} else {
return (1);
}
}
})();
var blocks = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__154976_SHARP_){
return frontend.common.file.core.update_block_content(db,p1__154976_SHARP_,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(p1__154976_SHARP_));
}),(function (){var G__154989 = db;
var G__154990 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null);
var G__154991 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),logseq.db.get_block_and_children(db,root_block_uuid));
return (datascript.core.pull_many.cljs$core$IFn$_invoke$arity$3 ? datascript.core.pull_many.cljs$core$IFn$_invoke$arity$3(G__154989,G__154990,G__154991) : datascript.core.pull_many.call(null,G__154989,G__154990,G__154991));
})());
var tree = logseq.outliner.tree.blocks__GT_vec_tree(repo,db,blocks,cljs.core.str.cljs$core$IFn$_invoke$arity$1(root_block_uuid));
return frontend.common.file.core.tree__GT_file_content(repo,db,tree,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(tree__GT_file_opts,new cljs.core.Keyword(null,"init-level","init-level",-1605905283),init_level),context);
});

//# sourceMappingURL=frontend.common.file.core.js.map
