goog.provide('frontend.handler.file_based.page_property');
frontend.handler.file_based.page_property.insert_property = (function frontend$handler$file_based$page_property$insert_property(format,content,key,value){
if(((typeof content === 'string') && ((!(clojure.string.blank_QMARK_(cljs.core.name(key))))))){
var key__$1 = ((typeof key === 'string')?cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(key):key);
var key_part = (function (){var G__60793 = (function (){var G__60795 = format;
var G__60795__$1 = (((G__60795 instanceof cljs.core.Keyword))?G__60795.fqn:null);
switch (G__60795__$1) {
case "org":
return "#+%s: ";

break;
default:
return "%s:: ";

}
})();
var G__60794 = clojure.string.lower_case(cljs.core.name(key__$1));
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__60793,G__60794) : frontend.util.format.call(null,G__60793,G__60794));
})();
var new_property_line = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(key_part),cljs.core.str.cljs$core$IFn$_invoke$arity$1(value)].join('');
var lines = clojure.string.split_lines(content);
var key_exists_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
var lines__$1 = cljs.core.doall.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (line){
if(((clojure.string.starts_with_QMARK_(clojure.string.lower_case(line),clojure.string.lower_case(key_part))) && (cljs.core.not(cljs.core.deref(key_exists_QMARK_))))){
cljs.core.reset_BANG_(key_exists_QMARK_,true);

return new_property_line;
} else {
return line;
}
}),lines));
var lines__$2 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(lines__$1,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [""], null)))?null:lines__$1);
var lines__$3 = (cljs.core.truth_(cljs.core.deref(key_exists_QMARK_))?lines__$2:cljs.core.cons(new_property_line,lines__$2));
return clojure.string.join.cljs$core$IFn$_invoke$arity$2("\n",lines__$3);
} else {
return null;
}
});
/**
 * Updates multiple page properties. Mainly just used in legacy title context
 */
frontend.handler.file_based.page_property.insert_properties = (function frontend$handler$file_based$page_property$insert_properties(format,content,kvs){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (content__$1,p__60796){
var vec__60797 = p__60796;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__60797,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__60797,(1),null);
var k__$1 = ((typeof k === 'string')?cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(clojure.string.replace(clojure.string.lower_case(k)," ","-")):k);
var v__$1 = ((cljs.core.coll_QMARK_(v))?(function (){var G__60800 = cljs.core.seq(v);
var G__60800__$1 = (((G__60800 == null))?null:cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(G__60800));
if((G__60800__$1 == null)){
return null;
} else {
return clojure.string.join.cljs$core$IFn$_invoke$arity$2(", ",G__60800__$1);
}
})():v);
return frontend.handler.file_based.page_property.insert_property(format,content__$1,k__$1,v__$1);
}),content,kvs);
});
frontend.handler.file_based.page_property.add_property_BANG_ = (function frontend$handler$file_based$page_property$add_property_BANG_(page,key,value){
var repo = frontend.state.get_current_repo();
var key__$1 = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(key);
var pre_block = frontend.db.file_based.model.get_pre_block(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page));
var format = frontend.state.get_preferred_format.cljs$core$IFn$_invoke$arity$0();
var page_id = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page)], null);
var org_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(format,new cljs.core.Keyword(null,"org","org",1495985));
var value__$1 = ((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"filters","filters",974726919),null], null), null),key__$1))?cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([value], 0)):value);
if(cljs.core.truth_(pre_block)){
var properties = new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(pre_block);
var new_properties = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(properties,key__$1,value__$1);
var content = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(pre_block);
var new_content = frontend.handler.file_based.page_property.insert_property(format,content,key__$1,value__$1);
var block = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(pre_block),new cljs.core.Keyword("block","properties","block/properties",708347145),new_properties,new cljs.core.Keyword("block","title","block/title",710445684),new_content,new cljs.core.Keyword("block","page","block/page",822314108),page_id], null);
var tx = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(page_id,new cljs.core.Keyword("block","properties","block/properties",708347145),new_properties),block], null);
return frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$1(tx);
} else {
var block = new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),(frontend.db.new_block_id.cljs$core$IFn$_invoke$arity$0 ? frontend.db.new_block_id.cljs$core$IFn$_invoke$arity$0() : frontend.db.new_block_id.call(null)),new cljs.core.Keyword("block","parent","block/parent",-918309064),page_id,new cljs.core.Keyword("block","page","block/page",822314108),page_id,new cljs.core.Keyword("block","title","block/title",710445684),((org_QMARK_)?["#+",clojure.string.upper_case(cljs.core.name(key__$1)),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(value__$1)].join(''):[cljs.core.name(key__$1),":: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(value__$1)].join('')),new cljs.core.Keyword("block","format","block/format",-1212045901),format,new cljs.core.Keyword("block","properties","block/properties",708347145),cljs.core.PersistentArrayMap.createAsIfByAssoc([key__$1,value__$1]),new cljs.core.Keyword("block","pre-block?","block/pre-block?",-1671958521),true], null);
var page_properties_tx = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(page_id,new cljs.core.Keyword("block","properties","block/properties",708347145),cljs.core.PersistentArrayMap.createAsIfByAssoc([key__$1,value__$1]))], null);
var test_QMARK___60293__auto__ = frontend.util.node_test_QMARK_;
var ops__60294__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__60295__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__60295__auto__);

if(cljs.core.truth_(ops__60294__auto__)){
return frontend.modules.outliner.op.insert_blocks_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block], null),page,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),false], null));
} else {
var _STAR_outliner_ops_STAR__orig_val__60801 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__60802 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__60802);

try{frontend.modules.outliner.op.insert_blocks_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block], null),page,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),false], null));

var r__60296__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___60293__auto__){
if(cljs.core.seq(r__60296__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__60296__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013),new cljs.core.Keyword(null,"additional-tx","additional-tx",-343057604),page_properties_tx], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__60296__auto__)){
var request_id__60297__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__60298__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__60296__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013),new cljs.core.Keyword(null,"additional-tx","additional-tx",-343057604),page_properties_tx], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__60297__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__60299__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__60297__auto__,request__60298__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__60297__auto__,request__60298__auto__));
return response__60299__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__60801);
}}
}
});

//# sourceMappingURL=frontend.handler.file_based.page_property.js.map
