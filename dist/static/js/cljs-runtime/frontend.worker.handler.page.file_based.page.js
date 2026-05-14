goog.provide('frontend.worker.handler.page.file_based.page');
frontend.worker.handler.page.file_based.page.file_based_properties_block = (function frontend$worker$handler$page$file_based$page$file_based_properties_block(repo,conn,config,date_formatter,properties,format,page){
var content = logseq.graph_parser.property.insert_properties(repo,format,"",properties);
var refs = logseq.graph_parser.block.get_page_refs_from_properties(properties,cljs.core.deref(conn),date_formatter,config);
return cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword("block","pre-block?","block/pre-block?",-1671958521),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","properties","block/properties",708347145),new cljs.core.Keyword("block","refs","block/refs",-1214495349),new cljs.core.Keyword("block","properties-order","block/properties-order",-968493873),new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("block","parent","block/parent",-918309064),new cljs.core.Keyword("block","order","block/order",-1429282437),new cljs.core.Keyword("block","page","block/page",822314108)],[true,logseq.db.new_block_id(),properties,refs,cljs.core.keys(properties),format,content,page,logseq.db.common.order.gen_key(null,null),page]);
});
frontend.worker.handler.page.file_based.page.build_page_tx = (function frontend$worker$handler$page$file_based$page$build_page_tx(repo,conn,config,date_formatter,format,properties,page,p__186801){
var map__186802 = p__186801;
var map__186802__$1 = cljs.core.__destructure_map(map__186802);
var whiteboard_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186802__$1,new cljs.core.Keyword(null,"whiteboard?","whiteboard?",-1968190788));
var tags = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186802__$1,new cljs.core.Keyword(null,"tags","tags",1771418977));
if(cljs.core.truth_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page))){
var page_entity = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page)], null);
var page_SINGLEQUOTE_ = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([page,(cljs.core.truth_(whiteboard_QMARK_)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","type","block/type",1537584409),"whiteboard"], null):null),(cljs.core.truth_(tags)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","tags","block/tags",1814948340),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__186800_SHARP_){
return cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword("db","id","db/id",-1388397098)],[new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((function (){var G__186803 = cljs.core.deref(conn);
var G__186804 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),p1__186800_SHARP_], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186803,G__186804) : datascript.core.entity.call(null,G__186803,G__186804));
})())]);
}),tags)], null):null)], 0));
var file_page = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([page_SINGLEQUOTE_,((cljs.core.seq(properties))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","properties","block/properties",708347145),properties], null):null)], 0));
if(((cljs.core.seq(properties)) && (((cljs.core.not(whiteboard_QMARK_)) && (logseq.db.page_empty_QMARK_(cljs.core.deref(conn),new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(page))))))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [file_page,frontend.worker.handler.page.file_based.page.file_based_properties_block(repo,conn,config,date_formatter,properties,format,page_entity)], null);
} else {
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [file_page], null);
}
} else {
return null;
}
});
frontend.worker.handler.page.file_based.page.get_title_and_pagename = (function frontend$worker$handler$page$file_based$page$get_title_and_pagename(title){
var title__$1 = clojure.string.replace((function (){var G__186805 = clojure.string.trim(title);
return (logseq.graph_parser.text.page_ref_un_brackets_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.graph_parser.text.page_ref_un_brackets_BANG_.cljs$core$IFn$_invoke$arity$1(G__186805) : logseq.graph_parser.text.page_ref_un_brackets_BANG_.call(null,G__186805));
})(),/^#+/,"");
var title__$2 = logseq.common.util.remove_boundary_slashes(title__$1);
var page_name = logseq.common.util.page_name_sanity_lc(title__$2);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [title__$2,page_name], null);
});
frontend.worker.handler.page.file_based.page.create_BANG_ = (function frontend$worker$handler$page$file_based$page$create_BANG_(repo,conn,config,title,p__186807){
var map__186808 = p__186807;
var map__186808__$1 = cljs.core.__destructure_map(map__186808);
var options = map__186808__$1;
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__186808__$1,new cljs.core.Keyword(null,"format","format",-1306924766),null);
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__186808__$1,new cljs.core.Keyword(null,"properties","properties",685819552),null);
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__186808__$1,new cljs.core.Keyword(null,"uuid","uuid",-2145095719),null);
var persist_op_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__186808__$1,new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),true);
var today_journal_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186808__$1,new cljs.core.Keyword(null,"today-journal?","today-journal?",-388258460));
var date_formatter = logseq.common.config.get_date_formatter(config);
var split_namespace_QMARK_ = (!(((clojure.string.starts_with_QMARK_(title,"hls__")) || (logseq.common.date.valid_journal_title_QMARK_(date_formatter,title)))));
var vec__186809 = frontend.worker.handler.page.file_based.page.get_title_and_pagename(title);
var title__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186809,(0),null);
var page_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186809,(1),null);
if(cljs.core.truth_(logseq.db.get_page(cljs.core.deref(conn),page_name))){
return null;
} else {
var pages = ((split_namespace_QMARK_)?logseq.common.util.split_namespace_pages(title__$1):new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [title__$1], null));
var format__$1 = (function (){var or__5002__auto__ = format;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return logseq.common.config.get_preferred_format(config);
}
})();
var pages__$1 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (page){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(logseq.graph_parser.block.page_name__GT_map.cljs$core$IFn$_invoke$arity$variadic(page,cljs.core.deref(conn),true,date_formatter,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"page-uuid","page-uuid",1152600915),((cljs.core.uuid_QMARK_(uuid))?uuid:null)], null)], 0)),new cljs.core.Keyword("block","format","block/format",-1212045901),format__$1);
}),pages);
var txs = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__186806_SHARP_){
return frontend.worker.handler.page.file_based.page.build_page_tx(repo,conn,config,date_formatter,format__$1,null,p1__186806_SHARP_,cljs.core.PersistentArrayMap.EMPTY);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.drop_last.cljs$core$IFn$_invoke$arity$1(pages__$1)], 0)));
var txs__$1 = cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2((function (i,page){
if((i === (0))){
return page;
} else {
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(page,new cljs.core.Keyword("block","namespace","block/namespace",-282500695),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(txs,(i - (1))))], null));
}
}),txs);
var page_uuid = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(cljs.core.last(pages__$1));
var page_txs = frontend.worker.handler.page.file_based.page.build_page_tx(repo,conn,config,date_formatter,format__$1,properties,cljs.core.last(pages__$1),cljs.core.select_keys(options,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"whiteboard?","whiteboard?",-1968190788),new cljs.core.Keyword(null,"tags","tags",1771418977)], null)));
var page_txs__$1 = ((cljs.core.seq(txs__$1))?cljs.core.update.cljs$core$IFn$_invoke$arity$3(page_txs,(0),(function (p){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p,new cljs.core.Keyword("block","namespace","block/namespace",-282500695),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(cljs.core.last(txs__$1))], null));
})):page_txs);
var txs__$2 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(txs__$1,page_txs__$1);
if(cljs.core.seq(txs__$2)){
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,txs__$2,(function (){var G__186812 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),persist_op_QMARK_,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"create-page","create-page",-1352656443)], null);
if(cljs.core.truth_(today_journal_QMARK_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(G__186812,new cljs.core.Keyword(null,"create-today-journal?","create-today-journal?",136893930),true,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"today-journal-name","today-journal-name",1965349294),page_name], 0));
} else {
return G__186812;
}
})());
} else {
}

return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [page_name,page_uuid], null);
}
});

//# sourceMappingURL=frontend.worker.handler.page.file_based.page.js.map
