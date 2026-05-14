goog.provide('logseq.outliner.validate');
/**
 * Validates characters that must not be in a page title
 */
logseq.outliner.validate.validate_page_title_characters = (function logseq$outliner$validate$validate_page_title_characters(page_title,meta_m){
if(clojure.string.includes_QMARK_(page_title,"#")){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Page name can't include \"#\".",cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([meta_m,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"notification","notification",-222338233),new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"message","message",-406056002),"Page name can't include \"#\".",new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"warning","warning",-1685650671)], null)], null)], 0)));
} else {
}

if(((clojure.string.includes_QMARK_(page_title,logseq.common.util.namespace.parent_char)) && (cljs.core.not(logseq.common.date.normalize_date(page_title,null))))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Page name can't include \"/\".",cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([meta_m,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"notification","notification",-222338233),new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"message","message",-406056002),"Page name can't include \"/\".",new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"warning","warning",-1685650671)], null)], null)], 0)));
} else {
return null;
}
});
logseq.outliner.validate.validate_page_title = (function logseq$outliner$validate$validate_page_title(page_title,meta_m){
if(clojure.string.blank_QMARK_(page_title)){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Page name can't be blank",cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([meta_m,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"notification","notification",-222338233),new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"message","message",-406056002),"Page name can't be blank.",new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"warning","warning",-1685650671)], null)], null)], 0)));
} else {
return null;
}
});
/**
 * Validates built-in pages shouldn't be modified
 */
logseq.outliner.validate.validate_built_in_pages = (function logseq$outliner$validate$validate_built_in_pages(entity){
if(cljs.core.truth_((logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1(entity) : logseq.db.built_in_QMARK_.call(null,entity)))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Rename built-in pages",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"notification","notification",-222338233),new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"message","message",-406056002),"Built-in pages can't be edited",new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"warning","warning",-1685650671)], null)], null));
} else {
return null;
}
});
logseq.outliner.validate.validate_unique_by_parent_and_name = (function logseq$outliner$validate$validate_unique_by_parent_and_name(db,entity,new_title){
var temp__5804__auto__ = cljs.core.seq((function (){var G__143946 = new cljs.core.PersistentVector(null, 11, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?eid","?eid",1087837141,null),new cljs.core.Symbol(null,"?type","?type",-1287409101,null),new cljs.core.Symbol(null,"?title","?title",-835622503,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Symbol(null,"?title","?title",-835622503,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509),new cljs.core.Symbol(null,"?type","?type",-1287409101,null)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"not=","not=",1466536204,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Symbol(null,"?eid","?eid",1087837141,null))], null)], null);
var G__143947 = db;
var G__143948 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity);
var G__143949 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509).cljs$core$IFn$_invoke$arity$1(entity));
var G__143950 = new_title;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$5 ? datascript.core.q.cljs$core$IFn$_invoke$arity$5(G__143946,G__143947,G__143948,G__143949,G__143950) : datascript.core.q.call(null,G__143946,G__143947,G__143948,G__143949,G__143950));
})());
if(temp__5804__auto__){
var _res = temp__5804__auto__;
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Duplicate page by parent",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"notification","notification",-222338233),new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"message","message",-406056002),["Another page named ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new_title], 0))," already exists for parents ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([clojure.string.join.cljs$core$IFn$_invoke$arity$2(logseq.common.util.namespace.parent_char,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","title","block/title",710445684),(logseq.db.get_page_parents.cljs$core$IFn$_invoke$arity$1 ? logseq.db.get_page_parents.cljs$core$IFn$_invoke$arity$1(entity) : logseq.db.get_page_parents.call(null,entity))))], 0))].join(''),new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"warning","warning",-1685650671)], null)], null));
} else {
return null;
}
});
logseq.outliner.validate.validate_unique_for_page = (function logseq$outliner$validate$validate_unique_for_page(db,new_title,p__143954){
var map__143955 = p__143954;
var map__143955__$1 = cljs.core.__destructure_map(map__143955);
var entity = map__143955__$1;
var tags = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__143955__$1,new cljs.core.Keyword("block","tags","block/tags",1814948340));
if(cljs.core.seq(tags)){
var temp__5804__auto__ = cljs.core.first((function (){var G__143956 = (cljs.core.truth_((logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1(entity) : logseq.db.property_QMARK_.call(null,entity)))?new cljs.core.PersistentVector(null, 12, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?eid","?eid",1087837141,null),new cljs.core.Symbol(null,"?title","?title",-835622503,null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?tag-id","?tag-id",-748587738,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Symbol(null,"?title","?title",-835622503,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Symbol(null,"?tag-id","?tag-id",-748587738,null)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"missing?","missing?",-1710383910,null),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160))], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"not=","not=",1466536204,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Symbol(null,"?eid","?eid",1087837141,null))], null)], null):(cljs.core.truth_(new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509).cljs$core$IFn$_invoke$arity$1(entity))?new cljs.core.PersistentVector(null, 14, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?eid","?eid",1087837141,null),new cljs.core.Symbol(null,"?title","?title",-835622503,null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?tag-id","?tag-id",-748587738,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Symbol(null,"?title","?title",-835622503,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Symbol(null,"?tag-id","?tag-id",-748587738,null)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"not=","not=",1466536204,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Symbol(null,"?eid","?eid",1087837141,null))], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509),new cljs.core.Symbol(null,"?bp","?bp",-568502339,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?eid","?eid",1087837141,null),new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509),new cljs.core.Symbol(null,"?ep","?ep",-340206877,null)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"=","=",-1501502141,null),new cljs.core.Symbol(null,"?bp","?bp",-568502339,null),new cljs.core.Symbol(null,"?ep","?ep",-340206877,null))], null)], null):new cljs.core.PersistentVector(null, 11, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?eid","?eid",1087837141,null),new cljs.core.Symbol(null,"?title","?title",-835622503,null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?tag-id","?tag-id",-748587738,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Symbol(null,"?title","?title",-835622503,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Symbol(null,"?tag-id","?tag-id",-748587738,null)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"not=","not=",1466536204,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Symbol(null,"?eid","?eid",1087837141,null))], null)], null)
));
var G__143957 = db;
var G__143958 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity);
var G__143959 = new_title;
var G__143960 = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),tags);
return (datascript.core.q.cljs$core$IFn$_invoke$arity$5 ? datascript.core.q.cljs$core$IFn$_invoke$arity$5(G__143956,G__143957,G__143958,G__143959,G__143960) : datascript.core.q.call(null,G__143956,G__143957,G__143958,G__143959,G__143960));
})());
if(cljs.core.truth_(temp__5804__auto__)){
var another_id = temp__5804__auto__;
var another = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,another_id) : datascript.core.entity.call(null,db,another_id));
var this_tags = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096),tags));
var another_tags = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(another)));
var common_tag_ids = clojure.set.intersection.cljs$core$IFn$_invoke$arity$2(this_tags,another_tags);
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(common_tag_ids,new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329),null], null), null))) && ((((cljs.core.count(this_tags) > (1))) && ((cljs.core.count(another_tags) > (1))))))){
return null;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Duplicate page",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"notification","notification",-222338233),new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"message","message",-406056002),["Another page named ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new_title], 0))," already exists for tags: ",clojure.string.join.cljs$core$IFn$_invoke$arity$2(", ",cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (id){
return ["#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,id) : datascript.core.entity.call(null,db,id))))].join('');
}),common_tag_ids))].join(''),new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"warning","warning",-1685650671)], null)], null));
}
} else {
return null;
}
} else {
if(cljs.core.truth_(new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509).cljs$core$IFn$_invoke$arity$1(entity))){
return logseq.outliner.validate.validate_unique_by_parent_and_name(db,entity,new_title);
} else {
return null;
}
}
});
/**
 * Validates uniqueness of nodes for the following cases:
 * - Page names are unique for a tag e.g. their can be Apple #Company and Apple #Fruit
 * - Page names are unique for a :logseq.property/parent
 */
logseq.outliner.validate.validate_unique_by_name_tag_and_block_type = (function logseq$outliner$validate$validate_unique_by_name_tag_and_block_type(db,new_title,entity){
if(cljs.core.truth_(logseq.db.frontend.entity_util.page_QMARK_(entity))){
return logseq.outliner.validate.validate_unique_for_page(db,new_title,entity);
} else {
return null;
}
});
/**
 * Validates a non-journal page renamed to journal format
 */
logseq.outliner.validate.validate_disallow_page_with_journal_name = (function logseq$outliner$validate$validate_disallow_page_with_journal_name(new_title,entity){
if(cljs.core.truth_((function (){var and__5000__auto__ = logseq.db.frontend.entity_util.page_QMARK_(entity);
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = cljs.core.not(logseq.db.frontend.entity_util.journal_QMARK_(entity));
if(and__5000__auto____$1){
return logseq.common.date.normalize_date(new_title,null);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Page can't be renamed to a journal",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"notification","notification",-222338233),new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"message","message",-406056002),"This page can't be changed to a journal page",new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"warning","warning",-1685650671)], null)], null));
} else {
return null;
}
});
/**
 * Validates a block title when it has changed for a entity-util/page? or tagged node
 */
logseq.outliner.validate.validate_block_title = (function logseq$outliner$validate$validate_block_title(db,new_title,existing_block_entity){
logseq.outliner.validate.validate_built_in_pages(existing_block_entity);

logseq.outliner.validate.validate_unique_by_name_tag_and_block_type(db,new_title,existing_block_entity);

return logseq.outliner.validate.validate_disallow_page_with_journal_name(new_title,existing_block_entity);
});
/**
 * Validates a property's title when it has changed
 */
logseq.outliner.validate.validate_property_title = (function logseq$outliner$validate$validate_property_title(new_title){
if(logseq.db.frontend.property.valid_property_name_QMARK_(new_title)){
return null;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Property name is invalid",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"notification","notification",-222338233),new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"message","message",-406056002),"This is an invalid property name. A property name cannot start with page reference characters '#' or '[['.",new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"error","error",-978969032)], null)], null));
}
});
/**
 * Validates whether given parent and children are valid. Allows 'class' and
 *   'page' types to have a relationship with their own type. May consider allowing more
 *   page types if they don't cause systemic bugs
 */
logseq.outliner.validate.validate_parent_property_have_same_type = (function logseq$outliner$validate$validate_parent_property_have_same_type(parent_ent,child_ents){
if(cljs.core.truth_((function (){var or__5002__auto__ = (function (){var and__5000__auto__ = (logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(parent_ent) : logseq.db.class_QMARK_.call(null,parent_ent));
if(cljs.core.truth_(and__5000__auto__)){
return (!(cljs.core.every_QMARK_(logseq.db.class_QMARK_,child_ents)));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = (function (){var and__5000__auto__ = (logseq.db.internal_page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.internal_page_QMARK_.cljs$core$IFn$_invoke$arity$1(parent_ent) : logseq.db.internal_page_QMARK_.call(null,parent_ent));
if(cljs.core.truth_(and__5000__auto__)){
return (!(cljs.core.every_QMARK_(logseq.db.internal_page_QMARK_,child_ents)));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return cljs.core.not(cljs.core.some_fn.cljs$core$IFn$_invoke$arity$2(logseq.db.class_QMARK_,logseq.db.internal_page_QMARK_)(parent_ent));
}
}
})())){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Can't set this page as a parent because the child page is a different type",new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"notification","notification",-222338233),new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"message","message",-406056002),"Can't set this page as a parent because the child page is a different type",new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"warning","warning",-1685650671)], null),new cljs.core.Keyword(null,"blocks","blocks",-610462153),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__144012_SHARP_){
return cljs.core.select_keys(p1__144012_SHARP_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","title","block/title",710445684)], null));
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2(logseq.db.class_QMARK_,child_ents))], null));
} else {
return null;
}
});
logseq.outliner.validate.disallow_built_in_class_parent_change = (function logseq$outliner$validate$disallow_built_in_class_parent_change(_parent_ent,child_ents){
if(cljs.core.truth_(cljs.core.some((function (p1__144014_SHARP_){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.class$.built_in_classes,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(p1__144014_SHARP_));
}),child_ents))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Can't change the parent of a built-in tag",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"notification","notification",-222338233),new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"message","message",-406056002),"Can't change the parent of a built-in tag",new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"warning","warning",-1685650671)], null)], null));
} else {
return null;
}
});
logseq.outliner.validate.validate_parent_property = (function logseq$outliner$validate$validate_parent_property(parent_ent,child_ents){
logseq.outliner.validate.disallow_built_in_class_parent_change(parent_ent,child_ents);

return logseq.outliner.validate.validate_parent_property_have_same_type(parent_ent,child_ents);
});
logseq.outliner.validate.disallow_node_cant_tag_with_built_in_non_tags = (function logseq$outliner$validate$disallow_node_cant_tag_with_built_in_non_tags(db,_block_eids,v){
var tag_ent = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,v) : datascript.core.entity.call(null,db,v));
if(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160).cljs$core$IFn$_invoke$arity$1(tag_ent);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not((logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(tag_ent) : logseq.db.class_QMARK_.call(null,tag_ent)));
} else {
return and__5000__auto__;
}
})())){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Can't set tag with built-in page that isn't a tag ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(tag_ent)], 0))].join(''),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"notification","notification",-222338233),new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"message","message",-406056002),["Can't set tag with built-in page that isn't a tag ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(tag_ent)], 0))].join(''),new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"error","error",-978969032)], null),new cljs.core.Keyword(null,"property-value","property-value",1516163307),v], null));
} else {
return null;
}
});
logseq.outliner.validate.disallow_node_cant_tag_with_private_tags = (function logseq$outliner$validate$disallow_node_cant_tag_with_private_tags(var_args){
var args__5732__auto__ = [];
var len__5726__auto___144111 = arguments.length;
var i__5727__auto___144112 = (0);
while(true){
if((i__5727__auto___144112 < len__5726__auto___144111)){
args__5732__auto__.push((arguments[i__5727__auto___144112]));

var G__144113 = (i__5727__auto___144112 + (1));
i__5727__auto___144112 = G__144113;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((3) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((3)),(0),null)):null);
return logseq.outliner.validate.disallow_node_cant_tag_with_private_tags.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),argseq__5733__auto__);
});

(logseq.outliner.validate.disallow_node_cant_tag_with_private_tags.cljs$core$IFn$_invoke$arity$variadic = (function (db,block_eids,v,p__144039){
var map__144040 = p__144039;
var map__144040__$1 = cljs.core.__destructure_map(map__144040);
var delete_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144040__$1,new cljs.core.Keyword(null,"delete?","delete?",789956376));
if(cljs.core.truth_((function (){var and__5000__auto__ = (function (){var G__144042 = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,v) : datascript.core.entity.call(null,db,v)));
return (logseq.db.private_tags.cljs$core$IFn$_invoke$arity$1 ? logseq.db.private_tags.cljs$core$IFn$_invoke$arity$1(G__144042) : logseq.db.private_tags.call(null,G__144042));
})();
if(cljs.core.truth_(and__5000__auto__)){
return (!(((cljs.core.every_QMARK_((function (id){
var G__144043 = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,id) : datascript.core.entity.call(null,db,id));
return (logseq.db.asset_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.asset_QMARK_.cljs$core$IFn$_invoke$arity$1(G__144043) : logseq.db.asset_QMARK_.call(null,G__144043));
}),block_eids)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.class","Asset","logseq.class/Asset",-797502970),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,v) : datascript.core.entity.call(null,db,v))))))));
} else {
return and__5000__auto__;
}
})())){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2([(cljs.core.truth_(delete_QMARK_)?"Can't remove tag":"Can't set tag")," with built-in #",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,v) : datascript.core.entity.call(null,db,v))))].join(''),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"notification","notification",-222338233),new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"message","message",-406056002),[(cljs.core.truth_(delete_QMARK_)?"Can't remove tag":"Can't set tag")," with built-in #",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,v) : datascript.core.entity.call(null,db,v))))].join(''),new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"error","error",-978969032)], null),new cljs.core.Keyword(null,"property-id","property-id",404996975),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword(null,"property-value","property-value",1516163307),v], null));
} else {
return null;
}
}));

(logseq.outliner.validate.disallow_node_cant_tag_with_private_tags.cljs$lang$maxFixedArity = (3));

/** @this {Function} */
(logseq.outliner.validate.disallow_node_cant_tag_with_private_tags.cljs$lang$applyTo = (function (seq144031){
var G__144032 = cljs.core.first(seq144031);
var seq144031__$1 = cljs.core.next(seq144031);
var G__144033 = cljs.core.first(seq144031__$1);
var seq144031__$2 = cljs.core.next(seq144031__$1);
var G__144034 = cljs.core.first(seq144031__$2);
var seq144031__$3 = cljs.core.next(seq144031__$2);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__144032,G__144033,G__144034,seq144031__$3);
}));

logseq.outliner.validate.disallow_tagging_a_built_in_entity = (function logseq$outliner$validate$disallow_tagging_a_built_in_entity(var_args){
var args__5732__auto__ = [];
var len__5726__auto___144126 = arguments.length;
var i__5727__auto___144127 = (0);
while(true){
if((i__5727__auto___144127 < len__5726__auto___144126)){
args__5732__auto__.push((arguments[i__5727__auto___144127]));

var G__144128 = (i__5727__auto___144127 + (1));
i__5727__auto___144127 = G__144128;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return logseq.outliner.validate.disallow_tagging_a_built_in_entity.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(logseq.outliner.validate.disallow_tagging_a_built_in_entity.cljs$core$IFn$_invoke$arity$variadic = (function (db,block_eids,p__144065){
var map__144066 = p__144065;
var map__144066__$1 = cljs.core.__destructure_map(map__144066);
var delete_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__144066__$1,new cljs.core.Keyword(null,"delete?","delete?",789956376));
var temp__5804__auto__ = cljs.core.some((function (p1__144052_SHARP_){
if(cljs.core.truth_(new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160).cljs$core$IFn$_invoke$arity$1(p1__144052_SHARP_))){
return p1__144052_SHARP_;
} else {
return null;
}
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__144053_SHARP_){
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,p1__144053_SHARP_) : datascript.core.entity.call(null,db,p1__144053_SHARP_));
}),block_eids));
if(cljs.core.truth_(temp__5804__auto__)){
var built_in_ent = temp__5804__auto__;
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2([(cljs.core.truth_(delete_QMARK_)?"Can't remove tag":"Can't add tag")," on built-in ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(built_in_ent)], 0))].join(''),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"notification","notification",-222338233),new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"message","message",-406056002),[(cljs.core.truth_(delete_QMARK_)?"Can't remove tag":"Can't add tag")," on built-in ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(built_in_ent)], 0))].join(''),new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"error","error",-978969032)], null)], null));
} else {
return null;
}
}));

(logseq.outliner.validate.disallow_tagging_a_built_in_entity.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(logseq.outliner.validate.disallow_tagging_a_built_in_entity.cljs$lang$applyTo = (function (seq144055){
var G__144056 = cljs.core.first(seq144055);
var seq144055__$1 = cljs.core.next(seq144055);
var G__144057 = cljs.core.first(seq144055__$1);
var seq144055__$2 = cljs.core.next(seq144055__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__144056,G__144057,seq144055__$2);
}));

/**
 * Validates adding a property value to :block/tags for given blocks
 */
logseq.outliner.validate.validate_tags_property = (function logseq$outliner$validate$validate_tags_property(db,block_eids,v){
logseq.outliner.validate.disallow_tagging_a_built_in_entity(db,block_eids);

logseq.outliner.validate.disallow_node_cant_tag_with_private_tags(db,block_eids,v);

return logseq.outliner.validate.disallow_node_cant_tag_with_built_in_non_tags(db,block_eids,v);
});
/**
 * Validates deleting a property value from :block/tags for given blocks
 */
logseq.outliner.validate.validate_tags_property_deletion = (function logseq$outliner$validate$validate_tags_property_deletion(db,block_eids,v){
logseq.outliner.validate.disallow_tagging_a_built_in_entity.cljs$core$IFn$_invoke$arity$variadic(db,block_eids,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"delete?","delete?",789956376),true], null)], 0));

return logseq.outliner.validate.disallow_node_cant_tag_with_private_tags.cljs$core$IFn$_invoke$arity$variadic(db,block_eids,v,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"delete?","delete?",789956376),true], null)], 0));
});

//# sourceMappingURL=logseq.outliner.validate.js.map
