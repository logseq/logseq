goog.provide('frontend.db.file_based.model');
/**
 * In file graphs, use it to replace '*' for datalog queries
 */
frontend.db.file_based.model.file_graph_block_attrs = new cljs.core.PersistentVector(null, 27, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","parent","block/parent",-918309064),new cljs.core.Keyword("block","order","block/order",-1429282437),new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991),new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword("block","refs","block/refs",-1214495349),new cljs.core.Keyword("block","_refs","block/_refs",830218531),new cljs.core.Keyword("block","path-refs","block/path-refs",-2109181352),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("block","link","block/link",-1872399993),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("block","marker","block/marker",1231576318),new cljs.core.Keyword("block","priority","block/priority",1491369544),new cljs.core.Keyword("block","properties","block/properties",708347145),new cljs.core.Keyword("block","properties-order","block/properties-order",-968493873),new cljs.core.Keyword("block","properties-text-values","block/properties-text-values",1271244708),new cljs.core.Keyword("block","pre-block?","block/pre-block?",-1671958521),new cljs.core.Keyword("block","scheduled","block/scheduled",584810412),new cljs.core.Keyword("block","deadline","block/deadline",660945231),new cljs.core.Keyword("block","repeated?","block/repeated?",-1344319799),new cljs.core.Keyword("block","created-at","block/created-at",1440015),new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551),new cljs.core.Keyword("block","heading-level","block/heading-level",661361785),new cljs.core.Keyword("block","file","block/file",183171933),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","journal-day","block/journal-day",-145748366),new cljs.core.Keyword("block","type","block/type",1537584409)], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","_parent","block/_parent",-639389670),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null)], null);
/**
 * page-name: the page name, original name
 * return: a list with elements in:
 *     :id    - a list of block ids, sorted by :block/order
 *     :level - the level of the block, 1 for root, 2 for children of root, etc.
 */
frontend.db.file_based.model.get_sorted_page_block_ids_and_levels = (function frontend$db$file_based$model$get_sorted_page_block_ids_and_levels(page_name){
if(typeof page_name === 'string'){
} else {
throw (new Error("Assert failed: (string? page-name)"));
}

var root = logseq.db.get_page(frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$0(),page_name);
var result = cljs.core.PersistentVector.EMPTY;
var children = logseq.db.sort_by_order(new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(root));
var levels = cljs.core.repeat.cljs$core$IFn$_invoke$arity$2(cljs.core.count(children),(1));
while(true){
if(cljs.core.seq(children)){
var child = cljs.core.first(children);
var cur_level = cljs.core.first(levels);
var next_children = logseq.db.sort_by_order(new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(child));
var G__60421 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(result,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(child),new cljs.core.Keyword(null,"level","level",1290497552),cur_level], null));
var G__60422 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(next_children,cljs.core.rest(children));
var G__60423 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.repeat.cljs$core$IFn$_invoke$arity$2(cljs.core.count(next_children),(cur_level + (1))),cljs.core.rest(levels));
result = G__60421;
children = G__60422;
levels = G__60423;
continue;
} else {
return result;
}
break;
}
});
frontend.db.file_based.model.get_page_file = (function frontend$db$file_based$model$get_page_file(var_args){
var G__60385 = arguments.length;
switch (G__60385) {
case 1:
return frontend.db.file_based.model.get_page_file.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.db.file_based.model.get_page_file.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.db.file_based.model.get_page_file.cljs$core$IFn$_invoke$arity$1 = (function (page_name){
return frontend.db.file_based.model.get_page_file.cljs$core$IFn$_invoke$arity$2(frontend.state.get_current_repo(),page_name);
}));

(frontend.db.file_based.model.get_page_file.cljs$core$IFn$_invoke$arity$2 = (function (repo,page_name){
var temp__5804__auto__ = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var db = temp__5804__auto__;
return logseq.graph_parser.db.get_page_file(db,page_name);
} else {
return null;
}
}));

(frontend.db.file_based.model.get_page_file.cljs$lang$maxFixedArity = 2);

frontend.db.file_based.model.get_block_file_path = (function frontend$db$file_based$model$get_block_file_path(block){
var temp__5804__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block));
if(cljs.core.truth_(temp__5804__auto__)){
var page_id = temp__5804__auto__;
return new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","file","block/file",183171933).cljs$core$IFn$_invoke$arity$1(frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$1(page_id)));
} else {
return null;
}
});
frontend.db.file_based.model.get_file_page_id = (function frontend$db$file_based$model$get_file_page_id(file_path){
var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
var temp__5804__auto____$1 = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo);
if(cljs.core.truth_(temp__5804__auto____$1)){
var db = temp__5804__auto____$1;
var G__60386 = (function (){var G__60387 = new cljs.core.PersistentVector(null, 9, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?path","?path",385070032,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?file","?file",-1121006094,null),new cljs.core.Keyword("file","path","file/path",-191335748),new cljs.core.Symbol(null,"?path","?path",385070032,null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Keyword("block","name","block/name",1619760316)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Keyword("block","file","block/file",183171933),new cljs.core.Symbol(null,"?file","?file",-1121006094,null)], null)], null);
var G__60388 = db;
var G__60389 = file_path;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$3 ? datascript.core.q.cljs$core$IFn$_invoke$arity$3(G__60387,G__60388,G__60389) : datascript.core.q.call(null,G__60387,G__60388,G__60389));
})();
var G__60386__$1 = (((G__60386 == null))?null:frontend.db.utils.seq_flatten(G__60386));
if((G__60386__$1 == null)){
return null;
} else {
return cljs.core.first(G__60386__$1);
}
} else {
return null;
}
} else {
return null;
}
});
frontend.db.file_based.model.get_files_blocks = (function frontend$db$file_based$model$get_files_blocks(repo_url,paths){
var paths__$1 = cljs.core.set(paths);
var pred = (function (_db,e){
return cljs.core.contains_QMARK_(paths__$1,e);
});
return frontend.db.utils.seq_flatten((function (){var G__60390 = new cljs.core.PersistentVector(null, 10, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.Symbol(null,"?block","?block",1541466123,null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?pred","?pred",-310747899,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?file","?file",-1121006094,null),new cljs.core.Keyword("file","path","file/path",-191335748),new cljs.core.Symbol(null,"?path","?path",385070032,null)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"?pred","?pred",-310747899,null),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?path","?path",385070032,null))], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword("block","file","block/file",183171933),new cljs.core.Symbol(null,"?file","?file",-1121006094,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?block","?block",1541466123,null),new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Symbol(null,"?p","?p",-10896580,null)], null)], null);
var G__60391 = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo_url);
var G__60392 = pred;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$3 ? datascript.core.q.cljs$core$IFn$_invoke$arity$3(G__60390,G__60391,G__60392) : datascript.core.q.call(null,G__60390,G__60391,G__60392));
})());
});
frontend.db.file_based.model.delete_blocks = (function frontend$db$file_based$model$delete_blocks(repo_url,files,_delete_page_QMARK_){
if(cljs.core.seq(files)){
var blocks = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,frontend.db.file_based.model.get_files_blocks(repo_url,files));
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (eid){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db.fn","retractEntity","db.fn/retractEntity",-1423535441),eid], null);
}),blocks);
} else {
return null;
}
});
frontend.db.file_based.model.get_file_page = (function frontend$db$file_based$model$get_file_page(var_args){
var G__60398 = arguments.length;
switch (G__60398) {
case 1:
return frontend.db.file_based.model.get_file_page.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.db.file_based.model.get_file_page.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.db.file_based.model.get_file_page.cljs$core$IFn$_invoke$arity$1 = (function (file_path){
return frontend.db.file_based.model.get_file_page.cljs$core$IFn$_invoke$arity$2(file_path,true);
}));

(frontend.db.file_based.model.get_file_page.cljs$core$IFn$_invoke$arity$2 = (function (file_path,title_QMARK_){
var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
var temp__5804__auto____$1 = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo);
if(cljs.core.truth_(temp__5804__auto____$1)){
var db = temp__5804__auto____$1;
var G__60399 = (function (){var G__60400 = (cljs.core.truth_(title_QMARK_)?new cljs.core.PersistentVector(null, 9, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.Symbol(null,"?page-name","?page-name",-1643414076,null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?path","?path",385070032,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?file","?file",-1121006094,null),new cljs.core.Keyword("file","path","file/path",-191335748),new cljs.core.Symbol(null,"?path","?path",385070032,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Keyword("block","file","block/file",183171933),new cljs.core.Symbol(null,"?file","?file",-1121006094,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Symbol(null,"?page-name","?page-name",-1643414076,null)], null)], null):new cljs.core.PersistentVector(null, 9, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.Symbol(null,"?page-name","?page-name",-1643414076,null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?path","?path",385070032,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?file","?file",-1121006094,null),new cljs.core.Keyword("file","path","file/path",-191335748),new cljs.core.Symbol(null,"?path","?path",385070032,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Keyword("block","file","block/file",183171933),new cljs.core.Symbol(null,"?file","?file",-1121006094,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Symbol(null,"?page-name","?page-name",-1643414076,null)], null)], null));
var G__60401 = db;
var G__60402 = file_path;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$3 ? datascript.core.q.cljs$core$IFn$_invoke$arity$3(G__60400,G__60401,G__60402) : datascript.core.q.call(null,G__60400,G__60401,G__60402));
})();
var G__60399__$1 = (((G__60399 == null))?null:frontend.db.utils.seq_flatten(G__60399));
if((G__60399__$1 == null)){
return null;
} else {
return cljs.core.first(G__60399__$1);
}
} else {
return null;
}
} else {
return null;
}
}));

(frontend.db.file_based.model.get_file_page.cljs$lang$maxFixedArity = 2);

frontend.db.file_based.model.delete_pages_by_files = (function frontend$db$file_based$model$delete_pages_by_files(files){
var pages = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(frontend.db.file_based.model.get_file_page,files));
if(cljs.core.seq(pages)){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (page){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db.fn","retractEntity","db.fn/retractEntity",-1423535441),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","name","block/name",1619760316),page], null)], null);
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2(frontend.util.page_name_sanity_lc,pages));
} else {
return null;
}
});
frontend.db.file_based.model.get_pre_block = (function frontend$db$file_based$model$get_pre_block(repo,page_id){
return cljs.core.ffirst((function (){var G__60403 = new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null)),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?page","?page",-1343187612,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Symbol(null,"?page","?page",-1343187612,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","pre-block?","block/pre-block?",-1671958521),true], null)], null);
var G__60404 = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo);
var G__60405 = page_id;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$3 ? datascript.core.q.cljs$core$IFn$_invoke$arity$3(G__60403,G__60404,G__60405) : datascript.core.q.call(null,G__60403,G__60404,G__60405));
})());
});
frontend.db.file_based.model.get_all_namespace_relation = (function frontend$db$file_based$model$get_all_namespace_relation(repo){
return logseq.graph_parser.db.get_all_namespace_relation(frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo));
});
frontend.db.file_based.model.get_all_namespace_parents = (function frontend$db$file_based$model$get_all_namespace_parents(repo){
var db = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo);
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__60407){
var vec__60408 = p__60407;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__60408,(0),null);
var _QMARK_parent = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__60408,(1),null);
return frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$2(db,_QMARK_parent);
}),frontend.db.file_based.model.get_all_namespace_relation(repo));
});
/**
 * Accepts both sanitized and unsanitized namespaces
 */
frontend.db.file_based.model.get_namespace_pages = (function frontend$db$file_based$model$get_namespace_pages(repo,namespace){
return frontend.common.file_based.db.get_namespace_pages(frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo),namespace);
});
frontend.db.file_based.model.tree = (function frontend$db$file_based$model$tree(flat_col,root){
var sort_fn = (function (p1__60411_SHARP_){
return cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","name","block/name",1619760316),p1__60411_SHARP_);
});
var children = cljs.core.group_by(new cljs.core.Keyword("block","namespace","block/namespace",-282500695),flat_col);
var namespace_children = (function frontend$db$file_based$model$tree_$_namespace_children(parent_id){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (m){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword("namespace","children","namespace/children",-2095628387),sort_fn(frontend$db$file_based$model$tree_$_namespace_children(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(m)], null))));
}),sort_fn(cljs.core.get.cljs$core$IFn$_invoke$arity$2(children,parent_id)));
});
return namespace_children(root);
});
/**
 * Unsanitized namespaces
 */
frontend.db.file_based.model.get_namespace_hierarchy = (function frontend$db$file_based$model$get_namespace_hierarchy(repo,namespace){
var children = frontend.db.file_based.model.get_namespace_pages(repo,namespace);
var namespace_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","name","block/name",1619760316),(frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1 ? frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1(namespace) : frontend.util.page_name_sanity_lc.call(null,namespace))], null)));
var root = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","id","db/id",-1388397098),namespace_id], null);
var col = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(children,root);
return frontend.db.file_based.model.tree(col,root);
});
frontend.db.file_based.model.get_page_namespace = (function frontend$db$file_based$model$get_page_namespace(repo,page){
return new cljs.core.Keyword("block","namespace","block/namespace",-282500695).cljs$core$IFn$_invoke$arity$1(frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$2(repo,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","name","block/name",1619760316),(frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1 ? frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1(page) : frontend.util.page_name_sanity_lc.call(null,page))], null)));
});
frontend.db.file_based.model.get_page_namespace_routes = (function frontend$db$file_based$model$get_page_namespace_routes(repo,page){
if(typeof page === 'string'){
} else {
throw (new Error("Assert failed: (string? page)"));
}

var temp__5804__auto__ = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var db = temp__5804__auto__;
if(clojure.string.blank_QMARK_(page)){
return null;
} else {
var page__$1 = (function (){var G__60419 = clojure.string.trim(page);
return (frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1 ? frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1(G__60419) : frontend.util.page_name_sanity_lc.call(null,G__60419));
})();
var page_exist_QMARK_ = frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$2(repo,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","name","block/name",1619760316),page__$1], null));
var ids = (cljs.core.truth_(page_exist_QMARK_)?cljs.core.List.EMPTY:cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"e","e",1381269198),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (datom){
return clojure.string.ends_with_QMARK_(new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(datom),["/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(page__$1)].join(''));
}),datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"aevt","aevt",-585148059),new cljs.core.Keyword("block","name","block/name",1619760316)))));
if(cljs.core.seq(ids)){
return frontend.db.utils.pull_many.cljs$core$IFn$_invoke$arity$3(repo,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","file","block/file",183171933),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("file","path","file/path",-191335748)], null)], null)], null),ids);
} else {
return null;
}
}
} else {
return null;
}
});

//# sourceMappingURL=frontend.db.file_based.model.js.map
