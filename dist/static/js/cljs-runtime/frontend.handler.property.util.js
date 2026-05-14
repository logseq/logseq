goog.provide('frontend.handler.property.util');
/**
 * Get the property value by a built-in property's db-ident from block. For file and db graphs
 */
frontend.handler.property.util.lookup = (function frontend$handler$property$util$lookup(block,key){
var repo = frontend.state.get_current_repo();
return logseq.db.common.property_util.lookup(repo,block,key);
});
/**
 * Get the value of a built-in block's property by its db-ident
 */
frontend.handler.property.util.get_block_property_value = (function frontend$handler$property$util$get_block_property_value(block,db_ident){
var repo = frontend.state.get_current_repo();
var db = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo);
return logseq.db.common.property_util.get_block_property_value(repo,db,block,db_ident);
});
/**
 * Get a built-in property's id (db-ident or name) given its db-ident. For file and db graphs
 */
frontend.handler.property.util.get_pid = (function frontend$handler$property$util$get_pid(db_ident){
var repo = frontend.state.get_current_repo();
return logseq.db.common.property_util.get_pid(repo,db_ident);
});
frontend.handler.property.util.block__GT_shape = (function frontend$handler$property$util$block__GT_shape(block){
return frontend.handler.property.util.get_block_property_value(block,new cljs.core.Keyword("logseq.property.tldraw","shape","logseq.property.tldraw/shape",-1313245420));
});
frontend.handler.property.util.page_block__GT_tldr_page = (function frontend$handler$property$util$page_block__GT_tldr_page(block){
return frontend.handler.property.util.get_block_property_value(block,new cljs.core.Keyword("logseq.property.tldraw","page","logseq.property.tldraw/page",-354621457));
});
frontend.handler.property.util.shape_block_QMARK_ = (function frontend$handler$property$util$shape_block_QMARK_(block){
var repo = frontend.state.get_current_repo();
var db = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo);
return logseq.db.common.property_util.shape_block_QMARK_(repo,db,block);
});

//# sourceMappingURL=frontend.handler.property.util.js.map
