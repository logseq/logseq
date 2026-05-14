goog.provide('frontend.worker.search');
goog.scope(function(){
  frontend.worker.search.goog$module$goog$object = goog.module.get('goog.object');
});
var module$node_modules$fuse_DOT_js$dist$fuse_common=shadow.js.require("module$node_modules$fuse_DOT_js$dist$fuse_common", {});
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.search !== 'undefined') && (typeof frontend.worker.search.fuzzy_search_indices !== 'undefined')){
} else {
frontend.worker.search.fuzzy_search_indices = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
}
/**
 * Table bindings of blocks tables and the blocks FTS virtual tables
 */
frontend.worker.search.add_blocks_fts_triggers_BANG_ = (function frontend$worker$search$add_blocks_fts_triggers_BANG_(db){
var triggers = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["CREATE TRIGGER IF NOT EXISTS blocks_ad AFTER DELETE ON blocks\n                  BEGIN\n                      DELETE from blocks_fts where id = old.id;\n                  END;","CREATE TRIGGER IF NOT EXISTS blocks_ai AFTER INSERT ON blocks\n                  BEGIN\n                      INSERT INTO blocks_fts (id, title, page)\n                      VALUES (new.id, new.title, new.page);\n                  END;","CREATE TRIGGER IF NOT EXISTS blocks_au AFTER UPDATE ON blocks\n                  BEGIN\n                      DELETE from blocks_fts where id = old.id;\n                      INSERT INTO blocks_fts (id, title, page)\n                      VALUES (new.id, new.title, new.page);\n                  END;"], null);
var seq__100409 = cljs.core.seq(triggers);
var chunk__100410 = null;
var count__100411 = (0);
var i__100412 = (0);
while(true){
if((i__100412 < count__100411)){
var trigger = chunk__100410.cljs$core$IIndexed$_nth$arity$2(null,i__100412);
db.exec(trigger);


var G__100659 = seq__100409;
var G__100660 = chunk__100410;
var G__100661 = count__100411;
var G__100662 = (i__100412 + (1));
seq__100409 = G__100659;
chunk__100410 = G__100660;
count__100411 = G__100661;
i__100412 = G__100662;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__100409);
if(temp__5804__auto__){
var seq__100409__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__100409__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__100409__$1);
var G__100663 = cljs.core.chunk_rest(seq__100409__$1);
var G__100664 = c__5525__auto__;
var G__100665 = cljs.core.count(c__5525__auto__);
var G__100666 = (0);
seq__100409 = G__100663;
chunk__100410 = G__100664;
count__100411 = G__100665;
i__100412 = G__100666;
continue;
} else {
var trigger = cljs.core.first(seq__100409__$1);
db.exec(trigger);


var G__100667 = cljs.core.next(seq__100409__$1);
var G__100668 = null;
var G__100669 = (0);
var G__100670 = (0);
seq__100409 = G__100667;
chunk__100410 = G__100668;
count__100411 = G__100669;
i__100412 = G__100670;
continue;
}
} else {
return null;
}
}
break;
}
});
frontend.worker.search.create_blocks_table_BANG_ = (function frontend$worker$search$create_blocks_table_BANG_(db){
return db.exec("CREATE TABLE IF NOT EXISTS blocks (\n                        id TEXT NOT NULL PRIMARY KEY,\n                        title TEXT NOT NULL,\n                        page TEXT)");
});
frontend.worker.search.create_blocks_fts_table_BANG_ = (function frontend$worker$search$create_blocks_fts_table_BANG_(db){
return db.exec("CREATE VIRTUAL TABLE IF NOT EXISTS blocks_fts USING fts5(id, title, page, tokenize=\"trigram\")");
});
/**
 * Open a SQLite db for search index
 */
frontend.worker.search.create_tables_and_triggers_BANG_ = (function frontend$worker$search$create_tables_and_triggers_BANG_(db){
try{frontend.worker.search.create_blocks_table_BANG_(db);

frontend.worker.search.create_blocks_fts_table_BANG_(db);

return frontend.worker.search.add_blocks_fts_triggers_BANG_(db);
}catch (e100432){var e = e100432;
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Failed to create tables and triggers"], 0));

return console.error(e);
}});
frontend.worker.search.drop_tables_and_triggers_BANG_ = (function frontend$worker$search$drop_tables_and_triggers_BANG_(db){
return db.exec("\nDROP TABLE IF EXISTS blocks;\nDROP TABLE IF EXISTS blocks_fts;\nDROP TRIGGER IF EXISTS blocks_ad;\nDROP TRIGGER IF EXISTS blocks_ai;\nDROP TRIGGER IF EXISTS blocks_au;\n");
});
/**
 * Turn clojure list into SQL list
 * '(1 2 3 4)
 * ->
 * "('1','2','3','4')"
 */
frontend.worker.search.clj_list__GT_sql = (function frontend$worker$search$clj_list__GT_sql(ids){
return ["(",clojure.string.join.cljs$core$IFn$_invoke$arity$2(", ",cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (id){
return ["'",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),"'"].join('');
}),ids)),")"].join('');
});
frontend.worker.search.upsert_blocks_BANG_ = (function frontend$worker$search$upsert_blocks_BANG_(db,blocks){
return db.transaction((function (tx){
var seq__100441 = cljs.core.seq(blocks);
var chunk__100442 = null;
var count__100443 = (0);
var i__100444 = (0);
while(true){
if((i__100444 < count__100443)){
var item = chunk__100442.cljs$core$IIndexed$_nth$arity$2(null,i__100444);
if(((logseq.common.util.uuid_string_QMARK_(item.id)) && (logseq.common.util.uuid_string_QMARK_(item.page)))){
tx.exec(({"sql": "INSERT INTO blocks (id, title, page) VALUES ($id, $title, $page) ON CONFLICT (id) DO UPDATE SET (title, page) = ($title, $page)", "bind": ({"$id": item.id, "$title": item.title, "$page": item.page})}));
} else {
console.error("Upsert blocks wrong data: ");

console.dir(item);

throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Search upsert-blocks wrong data: ",cljs_bean.core.__GT_clj(item));
}


var G__100671 = seq__100441;
var G__100672 = chunk__100442;
var G__100673 = count__100443;
var G__100674 = (i__100444 + (1));
seq__100441 = G__100671;
chunk__100442 = G__100672;
count__100443 = G__100673;
i__100444 = G__100674;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__100441);
if(temp__5804__auto__){
var seq__100441__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__100441__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__100441__$1);
var G__100675 = cljs.core.chunk_rest(seq__100441__$1);
var G__100676 = c__5525__auto__;
var G__100677 = cljs.core.count(c__5525__auto__);
var G__100678 = (0);
seq__100441 = G__100675;
chunk__100442 = G__100676;
count__100443 = G__100677;
i__100444 = G__100678;
continue;
} else {
var item = cljs.core.first(seq__100441__$1);
if(((logseq.common.util.uuid_string_QMARK_(item.id)) && (logseq.common.util.uuid_string_QMARK_(item.page)))){
tx.exec(({"sql": "INSERT INTO blocks (id, title, page) VALUES ($id, $title, $page) ON CONFLICT (id) DO UPDATE SET (title, page) = ($title, $page)", "bind": ({"$id": item.id, "$title": item.title, "$page": item.page})}));
} else {
console.error("Upsert blocks wrong data: ");

console.dir(item);

throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Search upsert-blocks wrong data: ",cljs_bean.core.__GT_clj(item));
}


var G__100679 = cljs.core.next(seq__100441__$1);
var G__100680 = null;
var G__100681 = (0);
var G__100682 = (0);
seq__100441 = G__100679;
chunk__100442 = G__100680;
count__100443 = G__100681;
i__100444 = G__100682;
continue;
}
} else {
return null;
}
}
break;
}
}));
});
frontend.worker.search.delete_blocks_BANG_ = (function frontend$worker$search$delete_blocks_BANG_(db,ids){
var sql = ["DELETE from blocks WHERE id IN ",frontend.worker.search.clj_list__GT_sql(ids)].join('');
return db.exec(sql);
});
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.search !== 'undefined') && (typeof frontend.worker.search.max_snippet_length !== 'undefined')){
} else {
frontend.worker.search.max_snippet_length = (250);
}
frontend.worker.search.snippet_by = (function frontend$worker$search$snippet_by(content,length){
return [cljs.core.subs.cljs$core$IFn$_invoke$arity$3(content,(0),length),(((cljs.core.count(content) > frontend.worker.search.max_snippet_length))?"...":null)].join('');
});
frontend.worker.search.get_snippet_result = (function frontend$worker$search$get_snippet_result(snippet){
var flag_highlight = "$pfts_2lqh>$ ";
var snippet__$1 = ((clojure.string.includes_QMARK_(snippet,flag_highlight))?snippet:frontend.worker.search.snippet_by(snippet,frontend.worker.search.max_snippet_length));
return snippet__$1;
});
frontend.worker.search.get_match_input = (function frontend$worker$search$get_match_input(q){
var match_input = clojure.string.replace(clojure.string.replace(clojure.string.replace(clojure.string.replace(clojure.string.replace(q," and "," AND ")," & "," AND ")," or "," OR ")," | "," OR ")," not "," NOT ");
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.re_find(/[^\w\s]/,q);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(cljs.core.some((function (p1__100483_SHARP_){
return clojure.string.includes_QMARK_(match_input,p1__100483_SHARP_);
}),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["AND","OR","NOT"], null)));
} else {
return and__5000__auto__;
}
})())){
return ["\"",match_input,"\"*"].join('');
} else {
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(q,match_input)){
return clojure.string.replace(match_input,",","");
} else {
return match_input;

}
}
});
frontend.worker.search.search_blocks_aux = (function frontend$worker$search$search_blocks_aux(db,sql,q,input,page,limit,enable_snippet_QMARK_){
try{var namespace_QMARK_ = logseq.common.util.namespace.namespace_page_QMARK_(q);
var last_part = ((namespace_QMARK_)?(function (){var G__100518 = (logseq.graph_parser.text.get_namespace_last_part.cljs$core$IFn$_invoke$arity$1 ? logseq.graph_parser.text.get_namespace_last_part.cljs$core$IFn$_invoke$arity$1(q) : logseq.graph_parser.text.get_namespace_last_part.call(null,q));
if((G__100518 == null)){
return null;
} else {
return frontend.worker.search.get_match_input(G__100518);
}
})():null);
var bind = (cljs.core.truth_((function (){var and__5000__auto__ = namespace_QMARK_;
if(and__5000__auto__){
return page;
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [page,input,last_part,limit], null):(cljs.core.truth_(page)?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [page,input,limit], null):((namespace_QMARK_)?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [input,last_part,limit], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [input,limit], null)
)));
var result = db.exec(cljs_bean.core.__GT_js(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"sql","sql",1251448786),sql,new cljs.core.Keyword(null,"bind","bind",-113428417),bind,new cljs.core.Keyword(null,"rowMode","rowMode",812194884),"array"], null)));
var blocks = cljs_bean.core.__GT_clj(result);
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block){
var vec__100537 = (cljs.core.truth_(enable_snippet_QMARK_)?cljs.core.update.cljs$core$IFn$_invoke$arity$3(block,(3),frontend.worker.search.get_snippet_result):block);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__100537,(0),null);
var page__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__100537,(1),null);
var title = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__100537,(2),null);
var snippet = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__100537,(3),null);
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"id","id",-1388402092),id,new cljs.core.Keyword(null,"page","page",849072397),page__$1,new cljs.core.Keyword(null,"title","title",636505583),title,new cljs.core.Keyword(null,"snippet","snippet",953581994),snippet], null);
}),blocks);
}catch (e100513){var e = e100513;
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"debug","debug",-1608172596),"Search blocks failed: "], 0));

return console.error(e);
}});
/**
 * Check if two strings points toward same search result
 */
frontend.worker.search.exact_matched_QMARK_ = (function frontend$worker$search$exact_matched_QMARK_(q,match){
if(((typeof q === 'string') && (typeof match === 'string'))){
return cljs.core.boolean$(cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (coll,char_SINGLEQUOTE_){
var coll_SINGLEQUOTE_ = cljs.core.drop_while.cljs$core$IFn$_invoke$arity$2((function (p1__100545_SHARP_){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(char_SINGLEQUOTE_,p1__100545_SHARP_);
}),coll);
if(cljs.core.seq(coll_SINGLEQUOTE_)){
return cljs.core.rest(coll_SINGLEQUOTE_);
} else {
return cljs.core.reduced(false);
}
}),cljs.core.seq(frontend.common.search_fuzzy.search_normalize(match,true)),cljs.core.seq(frontend.common.search_fuzzy.search_normalize(q,true))));
} else {
return null;
}
});
frontend.worker.search.page_or_object_QMARK_ = (function frontend$worker$search$page_or_object_QMARK_(entity){
var and__5000__auto__ = (function (){var or__5002__auto__ = (logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(entity) : logseq.db.page_QMARK_.call(null,entity));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (logseq.db.object_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.object_QMARK_.cljs$core$IFn$_invoke$arity$1(entity) : logseq.db.object_QMARK_.call(null,entity));
}
})();
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core.not((logseq.db.hidden_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.hidden_QMARK_.cljs$core$IFn$_invoke$arity$1(entity) : logseq.db.hidden_QMARK_.call(null,entity)))) && (cljs.core.not((function (){var G__100548 = new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(entity);
return (logseq.db.hidden_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.hidden_QMARK_.cljs$core$IFn$_invoke$arity$1(G__100548) : logseq.db.hidden_QMARK_.call(null,G__100548));
})())));
} else {
return and__5000__auto__;
}
});
/**
 * Only pages and objects are supported now.
 */
frontend.worker.search.get_all_fuzzy_supported_blocks = (function frontend$worker$search$get_all_fuzzy_supported_blocks(db){
var page_ids = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"e","e",1381269198),datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","name","block/name",1619760316)));
var object_ids = (cljs.core.truth_((logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(db) : logseq.db.db_based_graph_QMARK_.call(null,db)))?cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"e","e",1381269198),datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","tags","block/tags",1814948340))):null);
var blocks = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__100550_SHARP_){
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,p1__100550_SHARP_) : datascript.core.entity.call(null,db,p1__100550_SHARP_));
}),cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(page_ids,object_ids)));
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__100551_SHARP_){
var G__100553 = new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(p1__100551_SHARP_);
return (logseq.db.hidden_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.hidden_QMARK_.cljs$core$IFn$_invoke$arity$1(G__100553) : logseq.db.hidden_QMARK_.call(null,G__100553));
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2(logseq.db.hidden_QMARK_,blocks));
});
frontend.worker.search.sanitize = (function frontend$worker$search$sanitize(content){
var G__100560 = content;
if((G__100560 == null)){
return null;
} else {
return frontend.common.search_fuzzy.search_normalize(G__100560,true);
}
});
/**
 * Convert a block to the index for searching
 */
frontend.worker.search.block__GT_index = (function frontend$worker$search$block__GT_index(p__100562){
var map__100563 = p__100562;
var map__100563__$1 = cljs.core.__destructure_map(map__100563);
var block = map__100563__$1;
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100563__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
var page = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100563__$1,new cljs.core.Keyword("block","page","block/page",822314108));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100563__$1,new cljs.core.Keyword("block","title","block/title",710445684));
if(cljs.core.truth_((function (){var or__5002__auto__ = (logseq.db.closed_value_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.closed_value_QMARK_.cljs$core$IFn$_invoke$arity$1(block) : logseq.db.closed_value_QMARK_.call(null,block));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return ((((typeof title === 'string') && ((cljs.core.count(title) > (10000))))) || (clojure.string.blank_QMARK_(title)));
}
})())){
return null;
} else {
var title__$1 = logseq.db.frontend.content.recur_replace_uuid_in_block_title.cljs$core$IFn$_invoke$arity$1(cljs.core.update.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","title","block/title",710445684),logseq.db.get_title_with_parents));
if(cljs.core.truth_(uuid)){
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.str.cljs$core$IFn$_invoke$arity$1(uuid),new cljs.core.Keyword(null,"page","page",849072397),cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return uuid;
}
})()),new cljs.core.Keyword(null,"title","title",636505583),(cljs.core.truth_(frontend.worker.search.page_or_object_QMARK_(block))?title__$1:frontend.worker.search.sanitize(title__$1))], null);
} else {
return null;
}
}
});
/**
 * Build a block title indice from scratch.
 * Incremental page title indice is implemented in frontend.search.sync-search-indice!
 */
frontend.worker.search.build_fuzzy_search_indice = (function frontend$worker$search$build_fuzzy_search_indice(repo,db){
var blocks = cljs_bean.core.__GT_js(cljs.core.map.cljs$core$IFn$_invoke$arity$2(frontend.worker.search.block__GT_index,frontend.worker.search.get_all_fuzzy_supported_blocks(db)));
var indice = (new module$node_modules$fuse_DOT_js$dist$fuse_common(blocks,cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"keys","keys",1068423698),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["title"], null),new cljs.core.Keyword(null,"shouldSort","shouldSort",-1733947834),true,new cljs.core.Keyword(null,"tokenize","tokenize",1336117716),true,new cljs.core.Keyword(null,"distance","distance",-1671893894),(1024),new cljs.core.Keyword(null,"threshold","threshold",204221583),0.5,new cljs.core.Keyword(null,"minMatchCharLength","minMatchCharLength",-46930554),(1)], null))));
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.worker.search.fuzzy_search_indices,cljs.core.assoc,repo,indice);

return indice;
});
/**
 * Return a list of blocks (pages && tagged blocks) that match the query. Takes the following
 *   options:
 * * :limit - Number of result to limit search results. Defaults to 100
 */
frontend.worker.search.fuzzy_search = (function frontend$worker$search$fuzzy_search(repo,db,q,p__100572){
var map__100575 = p__100572;
var map__100575__$1 = cljs.core.__destructure_map(map__100575);
var limit = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__100575__$1,new cljs.core.Keyword(null,"limit","limit",-1355822363),(100));
if(cljs.core.truth_(repo)){
var q__$1 = frontend.common.search_fuzzy.search_normalize(q,true);
var q__$2 = frontend.common.search_fuzzy.clean_str(q__$1);
var q__$3 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("#",cljs.core.first(q__$2)))?cljs.core.subs.cljs$core$IFn$_invoke$arity$2(q__$2,(1)):q__$2);
if(clojure.string.blank_QMARK_(q__$3)){
return null;
} else {
var indice = (function (){var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.worker.search.fuzzy_search_indices),repo);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.worker.search.build_fuzzy_search_indice(repo,db);
}
})();
var result = cljs_bean.core.__GT_clj(indice.search(q__$3,cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"limit","limit",-1355822363),limit], null))));
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p__100576){
var map__100577 = p__100576;
var map__100577__$1 = cljs.core.__destructure_map(map__100577);
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100577__$1,new cljs.core.Keyword(null,"title","title",636505583));
return frontend.worker.search.exact_matched_QMARK_(q__$3,title);
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"item","item",249373802),result));
}
} else {
return null;
}
});
/**
 * Options:
 * * :page - the page to specifically search on
 * * :limit - Number of result to limit search results. Defaults to 100
 * * :dev? - Allow all nodes to be seen for development. Defaults to false
 * * :built-in?  - Whether to return public built-in nodes for db graphs. Defaults to false
 */
frontend.worker.search.search_blocks = (function frontend$worker$search$search_blocks(repo,conn,search_db,q,p__100580){
var map__100581 = p__100580;
var map__100581__$1 = cljs.core.__destructure_map(map__100581);
var option = map__100581__$1;
var limit = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100581__$1,new cljs.core.Keyword(null,"limit","limit",-1355822363));
var page = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100581__$1,new cljs.core.Keyword(null,"page","page",849072397));
var enable_snippet_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__100581__$1,new cljs.core.Keyword(null,"enable-snippet?","enable-snippet?",-692858749),true);
var built_in_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100581__$1,new cljs.core.Keyword(null,"built-in?","built-in?",2078421512));
var dev_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100581__$1,new cljs.core.Keyword(null,"dev?","dev?",-613971064));
var page_only_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100581__$1,new cljs.core.Keyword(null,"page-only?","page-only?",654695800));
if(clojure.string.blank_QMARK_(q)){
return null;
} else {
var match_input = frontend.worker.search.get_match_input(q);
var page_count = cljs.core.count(datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(conn),new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","name","block/name",1619760316)));
var large_graph_QMARK_ = (page_count > (2500));
var non_match_input = (((cljs.core.count(q) <= (2)))?["%",clojure.string.replace(q,/\s+/,"%"),"%"].join(''):null);
var limit__$1 = (function (){var or__5002__auto__ = limit;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (100);
}
})();
var snippet_aux = "snippet(blocks_fts, 1, '$pfts_2lqh>$', '$<pfts_2lqh$', '...', 256)";
var select = (cljs.core.truth_(enable_snippet_QMARK_)?["select id, page, title, ",snippet_aux," from blocks_fts where "].join(''):"select id, page, title from blocks_fts where ");
var pg_sql = (cljs.core.truth_(page)?"page = ? and":"");
var match_sql = ((logseq.common.util.namespace.namespace_page_QMARK_(q))?[select,pg_sql," title match ? or title match ? order by rank limit ?"].join(''):[select,pg_sql," title match ? order by rank limit ?"].join(''));
var non_match_sql = [select,pg_sql," title like ? limit ?"].join('');
var matched_result = (cljs.core.truth_(page_only_QMARK_)?null:frontend.worker.search.search_blocks_aux(search_db,match_sql,q,match_input,page,limit__$1,enable_snippet_QMARK_));
var non_match_result = (cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not(page_only_QMARK_);
if(and__5000__auto__){
return non_match_input;
} else {
return and__5000__auto__;
}
})())?frontend.worker.search.search_blocks_aux(search_db,non_match_sql,q,non_match_input,page,limit__$1,enable_snippet_QMARK_):null);
var fuzzy_result = (cljs.core.truth_((function (){var or__5002__auto__ = page;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return large_graph_QMARK_;
}
})())?null:frontend.worker.search.fuzzy_search(repo,cljs.core.deref(conn),q,option));
var result = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (result){
var map__100597 = result;
var map__100597__$1 = cljs.core.__destructure_map(map__100597);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100597__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var page__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100597__$1,new cljs.core.Keyword(null,"page","page",849072397));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100597__$1,new cljs.core.Keyword(null,"title","title",636505583));
var snippet = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100597__$1,new cljs.core.Keyword(null,"snippet","snippet",953581994));
var block_id = cljs.core.uuid(id);
var temp__5804__auto__ = (function (){var G__100599 = cljs.core.deref(conn);
var G__100600 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__100599,G__100600) : datascript.core.entity.call(null,G__100599,G__100600));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
if(cljs.core.truth_((cljs.core.truth_(dev_QMARK_)?true:(cljs.core.truth_(built_in_QMARK_)?(function (){var or__5002__auto__ = cljs.core.not((logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1(block) : logseq.db.built_in_QMARK_.call(null,block)));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = cljs.core.not((logseq.db.private_built_in_page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.private_built_in_page_QMARK_.cljs$core$IFn$_invoke$arity$1(block) : logseq.db.private_built_in_page_QMARK_.call(null,block)));
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
return (logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(block) : logseq.db.class_QMARK_.call(null,block));
}
}
})():(function (){var or__5002__auto__ = cljs.core.not((logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1(block) : logseq.db.built_in_QMARK_.call(null,block)));
if(or__5002__auto__){
return or__5002__auto__;
} else {
return (logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(block) : logseq.db.class_QMARK_.call(null,block));
}
})())))){
return new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id,new cljs.core.Keyword("block","title","block/title",710445684),(cljs.core.truth_((logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(block) : logseq.db.page_QMARK_.call(null,block)))?(logseq.db.get_title_with_parents.cljs$core$IFn$_invoke$arity$1 ? logseq.db.get_title_with_parents.cljs$core$IFn$_invoke$arity$1(block) : logseq.db.get_title_with_parents.call(null,block)):(function (){var or__5002__auto__ = snippet;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return title;
}
})()),new cljs.core.Keyword("block","page","block/page",822314108),((logseq.common.util.uuid_string_QMARK_(page__$1))?cljs.core.uuid(page__$1):null),new cljs.core.Keyword("block","tags","block/tags",1814948340),cljs.core.seq(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(block))),new cljs.core.Keyword(null,"page?","page?",644039860),(logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(block) : logseq.db.page_QMARK_.call(null,block))], null);
} else {
return null;
}
} else {
return null;
}
}),logseq.common.util.distinct_by(new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(fuzzy_result,matched_result,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([non_match_result], 0))));
var page_or_object_result = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (b){
var or__5002__auto__ = new cljs.core.Keyword(null,"page?","page?",644039860).cljs$core$IFn$_invoke$arity$1(b);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(result);
}
}),result);
return logseq.common.util.distinct_by(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(page_or_object_result,cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (b){
var or__5002__auto__ = new cljs.core.Keyword(null,"page?","page?",644039860).cljs$core$IFn$_invoke$arity$1(b);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(result);
}
}),result)));
}
});
frontend.worker.search.truncate_table_BANG_ = (function frontend$worker$search$truncate_table_BANG_(db){
frontend.worker.search.drop_tables_and_triggers_BANG_(db);

return frontend.worker.search.create_tables_and_triggers_BANG_(db);
});
frontend.worker.search.get_all_blocks = (function frontend$worker$search$get_all_blocks(db){
if(cljs.core.truth_(db)){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (e){
var or__5002__auto__ = (logseq.db.hidden_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.hidden_QMARK_.cljs$core$IFn$_invoke$arity$1(e) : logseq.db.hidden_QMARK_.call(null,e));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var G__100609 = new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(e);
return (logseq.db.hidden_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.hidden_QMARK_.cljs$core$IFn$_invoke$arity$1(G__100609) : logseq.db.hidden_QMARK_.call(null,G__100609));
}
}),cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p1__100606_SHARP_){
var G__100611 = db;
var G__100612 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),p1__100606_SHARP_], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__100611,G__100612) : datascript.core.entity.call(null,G__100611,G__100612));
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"v","v",21465059),datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)))));
} else {
return null;
}
});
frontend.worker.search.build_blocks_indice = (function frontend$worker$search$build_blocks_indice(repo,db){
frontend.worker.search.build_fuzzy_search_indice(repo,db);

return cljs.core.keep.cljs$core$IFn$_invoke$arity$2(frontend.worker.search.block__GT_index,frontend.worker.search.get_all_blocks(db));
});
frontend.worker.search.get_blocks_from_datoms_impl = (function frontend$worker$search$get_blocks_from_datoms_impl(repo,p__100618,datoms){
var map__100619 = p__100618;
var map__100619__$1 = cljs.core.__destructure_map(map__100619);
var db_after = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100619__$1,new cljs.core.Keyword(null,"db-after","db-after",-571884666));
var db_before = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100619__$1,new cljs.core.Keyword(null,"db-before","db-before",-553691536));
if(cljs.core.seq(datoms)){
var blocks_to_add_set = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"e","e",1381269198),cljs.core.filter.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"added","added",2057651688),datoms)));
var blocks_to_remove_set = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"e","e",1381269198),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__100614_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(p1__100614_SHARP_));
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"added","added",2057651688),datoms))));
var blocks_to_add_set_SINGLEQUOTE_ = (cljs.core.truth_((function (){var and__5000__auto__ = logseq.db.sqlite.util.db_based_graph_QMARK_(repo);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.seq(blocks_to_add_set);
} else {
return and__5000__auto__;
}
})())?cljs.core.set(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(blocks_to_add_set,cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (id){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","_refs","block/_refs",830218531).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db_after,id) : datascript.core.entity.call(null,db_after,id))));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([blocks_to_add_set], 0)))):blocks_to_add_set);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"blocks-to-remove","blocks-to-remove",818616402),cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p1__100615_SHARP_){
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db_before,p1__100615_SHARP_) : datascript.core.entity.call(null,db_before,p1__100615_SHARP_));
}),blocks_to_remove_set),new cljs.core.Keyword(null,"blocks-to-add","blocks-to-add",-814061792),cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__100617_SHARP_){
var G__100621 = new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(p1__100617_SHARP_);
return (logseq.db.hidden_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.hidden_QMARK_.cljs$core$IFn$_invoke$arity$1(G__100621) : logseq.db.hidden_QMARK_.call(null,G__100621));
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2(logseq.db.hidden_QMARK_,cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p1__100616_SHARP_){
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db_after,p1__100616_SHARP_) : datascript.core.entity.call(null,db_after,p1__100616_SHARP_));
}),blocks_to_add_set_SINGLEQUOTE_)))], null);
} else {
return null;
}
});
frontend.worker.search.get_affected_blocks = (function frontend$worker$search$get_affected_blocks(repo,tx_report){
var data = new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(tx_report);
var datoms = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (datom){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),null,new cljs.core.Keyword("block","properties","block/properties",708347145),null,new cljs.core.Keyword("block","title","block/title",710445684),null,new cljs.core.Keyword("block","name","block/name",1619760316),null], null), null),new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(datom));
}),data);
if(cljs.core.seq(datoms)){
return frontend.worker.search.get_blocks_from_datoms_impl(repo,tx_report,datoms);
} else {
return null;
}
});
frontend.worker.search.sync_search_indice = (function frontend$worker$search$sync_search_indice(repo,tx_report){
var map__100624 = frontend.worker.search.get_affected_blocks(repo,tx_report);
var map__100624__$1 = cljs.core.__destructure_map(map__100624);
var blocks_to_add = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100624__$1,new cljs.core.Keyword(null,"blocks-to-add","blocks-to-add",-814061792));
var blocks_to_remove = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100624__$1,new cljs.core.Keyword(null,"blocks-to-remove","blocks-to-remove",818616402));
var fuzzy_blocks_to_add_100711 = cljs.core.filter.cljs$core$IFn$_invoke$arity$2(frontend.worker.search.page_or_object_QMARK_,blocks_to_add);
var fuzzy_blocks_to_remove_100712 = cljs.core.filter.cljs$core$IFn$_invoke$arity$2(frontend.worker.search.page_or_object_QMARK_,blocks_to_remove);
if(((cljs.core.seq(fuzzy_blocks_to_add_100711)) || (cljs.core.seq(fuzzy_blocks_to_remove_100712)))){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.worker.search.fuzzy_search_indices,cljs.core.update,repo,(function (indice){
if(cljs.core.truth_(indice)){
var seq__100625_100713 = cljs.core.seq(fuzzy_blocks_to_remove_100712);
var chunk__100626_100714 = null;
var count__100627_100715 = (0);
var i__100628_100716 = (0);
while(true){
if((i__100628_100716 < count__100627_100715)){
var page_entity_100717 = chunk__100626_100714.cljs$core$IIndexed$_nth$arity$2(null,i__100628_100716);
indice.remove(((function (seq__100625_100713,chunk__100626_100714,count__100627_100715,i__100628_100716,page_entity_100717,fuzzy_blocks_to_add_100711,fuzzy_blocks_to_remove_100712,map__100624,map__100624__$1,blocks_to_add,blocks_to_remove){
return (function (page){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page_entity_100717)),frontend.worker.search.goog$module$goog$object.get(page,"id"));
});})(seq__100625_100713,chunk__100626_100714,count__100627_100715,i__100628_100716,page_entity_100717,fuzzy_blocks_to_add_100711,fuzzy_blocks_to_remove_100712,map__100624,map__100624__$1,blocks_to_add,blocks_to_remove))
);


var G__100721 = seq__100625_100713;
var G__100722 = chunk__100626_100714;
var G__100723 = count__100627_100715;
var G__100724 = (i__100628_100716 + (1));
seq__100625_100713 = G__100721;
chunk__100626_100714 = G__100722;
count__100627_100715 = G__100723;
i__100628_100716 = G__100724;
continue;
} else {
var temp__5804__auto___100725 = cljs.core.seq(seq__100625_100713);
if(temp__5804__auto___100725){
var seq__100625_100726__$1 = temp__5804__auto___100725;
if(cljs.core.chunked_seq_QMARK_(seq__100625_100726__$1)){
var c__5525__auto___100727 = cljs.core.chunk_first(seq__100625_100726__$1);
var G__100728 = cljs.core.chunk_rest(seq__100625_100726__$1);
var G__100729 = c__5525__auto___100727;
var G__100730 = cljs.core.count(c__5525__auto___100727);
var G__100731 = (0);
seq__100625_100713 = G__100728;
chunk__100626_100714 = G__100729;
count__100627_100715 = G__100730;
i__100628_100716 = G__100731;
continue;
} else {
var page_entity_100732 = cljs.core.first(seq__100625_100726__$1);
indice.remove(((function (seq__100625_100713,chunk__100626_100714,count__100627_100715,i__100628_100716,page_entity_100732,seq__100625_100726__$1,temp__5804__auto___100725,fuzzy_blocks_to_add_100711,fuzzy_blocks_to_remove_100712,map__100624,map__100624__$1,blocks_to_add,blocks_to_remove){
return (function (page){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page_entity_100732)),frontend.worker.search.goog$module$goog$object.get(page,"id"));
});})(seq__100625_100713,chunk__100626_100714,count__100627_100715,i__100628_100716,page_entity_100732,seq__100625_100726__$1,temp__5804__auto___100725,fuzzy_blocks_to_add_100711,fuzzy_blocks_to_remove_100712,map__100624,map__100624__$1,blocks_to_add,blocks_to_remove))
);


var G__100733 = cljs.core.next(seq__100625_100726__$1);
var G__100734 = null;
var G__100735 = (0);
var G__100736 = (0);
seq__100625_100713 = G__100733;
chunk__100626_100714 = G__100734;
count__100627_100715 = G__100735;
i__100628_100716 = G__100736;
continue;
}
} else {
}
}
break;
}

var seq__100629_100737 = cljs.core.seq(fuzzy_blocks_to_add_100711);
var chunk__100630_100738 = null;
var count__100631_100739 = (0);
var i__100632_100740 = (0);
while(true){
if((i__100632_100740 < count__100631_100739)){
var page_100741 = chunk__100630_100738.cljs$core$IIndexed$_nth$arity$2(null,i__100632_100740);
indice.remove(((function (seq__100629_100737,chunk__100630_100738,count__100631_100739,i__100632_100740,page_100741,fuzzy_blocks_to_add_100711,fuzzy_blocks_to_remove_100712,map__100624,map__100624__$1,blocks_to_add,blocks_to_remove){
return (function (p){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page_100741)),frontend.worker.search.goog$module$goog$object.get(p,"id"));
});})(seq__100629_100737,chunk__100630_100738,count__100631_100739,i__100632_100740,page_100741,fuzzy_blocks_to_add_100711,fuzzy_blocks_to_remove_100712,map__100624,map__100624__$1,blocks_to_add,blocks_to_remove))
);

indice.add(cljs_bean.core.__GT_js(frontend.worker.search.block__GT_index(page_100741)));


var G__100742 = seq__100629_100737;
var G__100743 = chunk__100630_100738;
var G__100744 = count__100631_100739;
var G__100745 = (i__100632_100740 + (1));
seq__100629_100737 = G__100742;
chunk__100630_100738 = G__100743;
count__100631_100739 = G__100744;
i__100632_100740 = G__100745;
continue;
} else {
var temp__5804__auto___100747 = cljs.core.seq(seq__100629_100737);
if(temp__5804__auto___100747){
var seq__100629_100749__$1 = temp__5804__auto___100747;
if(cljs.core.chunked_seq_QMARK_(seq__100629_100749__$1)){
var c__5525__auto___100750 = cljs.core.chunk_first(seq__100629_100749__$1);
var G__100751 = cljs.core.chunk_rest(seq__100629_100749__$1);
var G__100752 = c__5525__auto___100750;
var G__100753 = cljs.core.count(c__5525__auto___100750);
var G__100754 = (0);
seq__100629_100737 = G__100751;
chunk__100630_100738 = G__100752;
count__100631_100739 = G__100753;
i__100632_100740 = G__100754;
continue;
} else {
var page_100755 = cljs.core.first(seq__100629_100749__$1);
indice.remove(((function (seq__100629_100737,chunk__100630_100738,count__100631_100739,i__100632_100740,page_100755,seq__100629_100749__$1,temp__5804__auto___100747,fuzzy_blocks_to_add_100711,fuzzy_blocks_to_remove_100712,map__100624,map__100624__$1,blocks_to_add,blocks_to_remove){
return (function (p){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page_100755)),frontend.worker.search.goog$module$goog$object.get(p,"id"));
});})(seq__100629_100737,chunk__100630_100738,count__100631_100739,i__100632_100740,page_100755,seq__100629_100749__$1,temp__5804__auto___100747,fuzzy_blocks_to_add_100711,fuzzy_blocks_to_remove_100712,map__100624,map__100624__$1,blocks_to_add,blocks_to_remove))
);

indice.add(cljs_bean.core.__GT_js(frontend.worker.search.block__GT_index(page_100755)));


var G__100758 = cljs.core.next(seq__100629_100749__$1);
var G__100759 = null;
var G__100760 = (0);
var G__100761 = (0);
seq__100629_100737 = G__100758;
chunk__100630_100738 = G__100759;
count__100631_100739 = G__100760;
i__100632_100740 = G__100761;
continue;
}
} else {
}
}
break;
}

return indice;
} else {
return null;
}
}));
} else {
}

if(((cljs.core.seq(blocks_to_add)) || (cljs.core.seq(blocks_to_remove)))){
var blocks_to_add_SINGLEQUOTE_ = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(frontend.worker.search.block__GT_index,blocks_to_add);
var blocks_to_remove__$1 = cljs.core.set(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(cljs.core.str,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)),blocks_to_remove),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.str,clojure.set.difference.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),blocks_to_add)),cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),blocks_to_add_SINGLEQUOTE_))))));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"blocks-to-remove-set","blocks-to-remove-set",266406009),blocks_to_remove__$1,new cljs.core.Keyword(null,"blocks-to-add","blocks-to-add",-814061792),blocks_to_add_SINGLEQUOTE_], null);
} else {
return null;
}
});

//# sourceMappingURL=frontend.worker.search.js.map
