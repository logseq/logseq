goog.provide('frontend.handler.property');
frontend.handler.property.remove_block_property_BANG_ = (function frontend$handler$property$remove_block_property_BANG_(repo,block_id,property_id_or_key){
if((!((property_id_or_key == null)))){
} else {
throw (new Error(["Assert failed: ","remove-block-property! remove-block-property! is nil","\n","(some? property-id-or-key)"].join('')));
}

if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)){
var eid = ((cljs.core.uuid_QMARK_(block_id))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null):block_id);
return frontend.handler.db_based.property.remove_block_property_BANG_(eid,property_id_or_key);
} else {
return frontend.handler.file_based.property.remove_block_property_BANG_(block_id,property_id_or_key);
}
});
frontend.handler.property.set_block_property_BANG_ = (function frontend$handler$property$set_block_property_BANG_(repo,block_id,key,v){
if((!((key == null)))){
} else {
throw (new Error(["Assert failed: ","set-block-property! key is nil","\n","(some? key)"].join('')));
}

if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)){
var eid = ((cljs.core.uuid_QMARK_(block_id))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null):block_id);
if((((v == null)) || (((cljs.core.coll_QMARK_(v)) && (cljs.core.empty_QMARK_(v)))))){
return frontend.handler.db_based.property.remove_block_property_BANG_(eid,key);
} else {
return frontend.handler.db_based.property.set_block_property_BANG_(eid,key,v);
}
} else {
return frontend.handler.file_based.property.set_block_property_BANG_(block_id,key,v);
}
});
/**
 * Sanitized page-name, unsanitized key / value
 */
frontend.handler.property.add_page_property_BANG_ = (function frontend$handler$property$add_page_property_BANG_(page_entity,key,value){
if((!((key == null)))){
} else {
throw (new Error(["Assert failed: ","key is nil","\n","(some? key)"].join('')));
}

if(cljs.core.truth_(page_entity)){
var repo = frontend.state.get_current_repo();
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)){
return frontend.handler.property.set_block_property_BANG_(repo,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page_entity),key,value);
} else {
return frontend.handler.file_based.page_property.add_property_BANG_(page_entity,key,value);
}
} else {
return null;
}
});
frontend.handler.property.remove_id_property = (function frontend$handler$property$remove_id_property(repo,format,content){
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)){
return content;
} else {
return frontend.handler.file_based.property.remove_id_property(format,content);
}
});
frontend.handler.property.file_persist_block_id_BANG_ = (function frontend$handler$property$file_persist_block_id_BANG_(repo,block_id){
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)){
return null;
} else {
return frontend.handler.file_based.property.set_block_property_BANG_(block_id,new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.str.cljs$core$IFn$_invoke$arity$1(block_id));
}
});
frontend.handler.property.batch_remove_block_property_BANG_ = (function frontend$handler$property$batch_remove_block_property_BANG_(repo,block_ids,key){
if((!((key == null)))){
} else {
throw (new Error(["Assert failed: ","key is nil","\n","(some? key)"].join('')));
}

if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)){
return frontend.handler.db_based.property.batch_remove_property_BANG_(block_ids,key);
} else {
return frontend.handler.file_based.property.batch_remove_block_property_BANG_(block_ids,key);
}
});
frontend.handler.property.batch_set_block_property_BANG_ = (function frontend$handler$property$batch_set_block_property_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___62522 = arguments.length;
var i__5727__auto___62523 = (0);
while(true){
if((i__5727__auto___62523 < len__5726__auto___62522)){
args__5732__auto__.push((arguments[i__5727__auto___62523]));

var G__62524 = (i__5727__auto___62523 + (1));
i__5727__auto___62523 = G__62524;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((4) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((4)),(0),null)):null);
return frontend.handler.property.batch_set_block_property_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),argseq__5733__auto__);
});

(frontend.handler.property.batch_set_block_property_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (repo,block_ids,key,value,p__62518){
var map__62519 = p__62518;
var map__62519__$1 = cljs.core.__destructure_map(map__62519);
var opts = map__62519__$1;
if((!((key == null)))){
} else {
throw (new Error(["Assert failed: ","key is nil","\n","(some? key)"].join('')));
}

if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)){
if((value == null)){
return frontend.handler.db_based.property.batch_remove_property_BANG_(block_ids,key);
} else {
return frontend.handler.db_based.property.batch_set_property_BANG_(block_ids,key,value,opts);
}
} else {
return frontend.handler.file_based.property.batch_set_block_property_BANG_(block_ids,key,value);
}
}));

(frontend.handler.property.batch_set_block_property_BANG_.cljs$lang$maxFixedArity = (4));

/** @this {Function} */
(frontend.handler.property.batch_set_block_property_BANG_.cljs$lang$applyTo = (function (seq62513){
var G__62514 = cljs.core.first(seq62513);
var seq62513__$1 = cljs.core.next(seq62513);
var G__62515 = cljs.core.first(seq62513__$1);
var seq62513__$2 = cljs.core.next(seq62513__$1);
var G__62516 = cljs.core.first(seq62513__$2);
var seq62513__$3 = cljs.core.next(seq62513__$2);
var G__62517 = cljs.core.first(seq62513__$3);
var seq62513__$4 = cljs.core.next(seq62513__$3);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__62514,G__62515,G__62516,G__62517,seq62513__$4);
}));

frontend.handler.property.set_block_properties_BANG_ = (function frontend$handler$property$set_block_properties_BANG_(repo,block_id,properties){
if(cljs.core.uuid_QMARK_(block_id)){
} else {
throw (new Error("Assert failed: (uuid? block-id)"));
}

if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)){
return frontend.handler.db_based.property.set_block_properties_BANG_(block_id,properties);
} else {
return null;
}
});
if((typeof frontend !== 'undefined') && (typeof frontend.handler !== 'undefined') && (typeof frontend.handler.property !== 'undefined') && (typeof frontend.handler.property.class_property_excludes !== 'undefined')){
} else {
frontend.handler.property.class_property_excludes = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 15, [new cljs.core.Keyword("logseq.property.user","name","logseq.property.user/name",-1360026016),null,new cljs.core.Keyword("block","alias","block/alias",-2112644699),null,new cljs.core.Keyword("logseq.property.user","avatar","logseq.property.user/avatar",-416548858),null,new cljs.core.Keyword("logseq.property","hide-empty-value","logseq.property/hide-empty-value",2062325899),null,new cljs.core.Keyword("logseq.property","publishing-public?","logseq.property/publishing-public?",-1094657939),null,new cljs.core.Keyword("logseq.property.class","properties","logseq.property.class/properties",-2123712050),null,new cljs.core.Keyword("logseq.property","enable-history?","logseq.property/enable-history?",-805859602),null,new cljs.core.Keyword("logseq.property","page-tags","logseq.property/page-tags",-2133531185),null,new cljs.core.Keyword("logseq.property.class","hide-from-node","logseq.property.class/hide-from-node",-26103727),null,new cljs.core.Keyword("logseq.property.user","email","logseq.property.user/email",-1655206063),null,new cljs.core.Keyword("block","tags","block/tags",1814948340),null,new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285),null,new cljs.core.Keyword("logseq.property","exclude-from-graph-view","logseq.property/exclude-from-graph-view",-452433065),null,new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509),null,new cljs.core.Keyword("logseq.property","template-applied-to","logseq.property/template-applied-to",-429124322),null], null), null);
}
frontend.handler.property.get_class_property_choices = (function frontend$handler$property$get_class_property_choices(){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p){
return cljs.core.contains_QMARK_(frontend.handler.property.class_property_excludes,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(p));
}),frontend.db.model.get_all_properties.cljs$core$IFn$_invoke$arity$variadic(frontend.state.get_current_repo(),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"remove-ui-non-suitable-properties?","remove-ui-non-suitable-properties?",603866281),true], null)], 0)));
});

//# sourceMappingURL=frontend.handler.property.js.map
