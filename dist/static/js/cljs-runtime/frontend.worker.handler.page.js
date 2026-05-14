goog.provide('frontend.worker.handler.page');
frontend.worker.handler.page.rtc_create_page_BANG_ = (function frontend$worker$handler$page$rtc_create_page_BANG_(conn,config,title,p__186813){
var map__186814 = p__186813;
var map__186814__$1 = cljs.core.__destructure_map(map__186814);
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186814__$1,new cljs.core.Keyword(null,"uuid","uuid",-2145095719));
if(cljs.core.uuid_QMARK_(uuid)){
} else {
throw (new Error(["Assert failed: ",["rtc-create-page! `uuid` is not a uuid ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(uuid)].join(''),"\n","(uuid? uuid)"].join('')));
}

var date_formatter = logseq.common.config.get_date_formatter(config);
var title__$1 = frontend.worker.handler.page.db_based.page.sanitize_title(title);
var page_name = logseq.common.util.page_name_sanity_lc(title__$1);
var page = logseq.graph_parser.block.page_name__GT_map.cljs$core$IFn$_invoke$arity$variadic(title__$1,cljs.core.deref(conn),true,date_formatter,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"page-uuid","page-uuid",1152600915),uuid,new cljs.core.Keyword(null,"skip-existing-page-check?","skip-existing-page-check?",1358622588),true], null)], 0));
var result = logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [page], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"create-page","create-page",-1352656443)], null));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [result,page_name,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page)], null);
});
/**
 * Create page. Has the following options:
 * 
 * * :uuid                     - when set, use this uuid instead of generating a new one.
 * * :class?                   - when true, adds a :block/tags ':logseq.class/Tag'
 * * :whiteboard?              - when true, adds a :block/tags ':logseq.class/Whiteboard'
 * * :tags                     - tag uuids that are added to :block/tags
 * * :persist-op?              - when true, add an update-page op
 * * :properties               - properties to add to the page
 *   TODO: Add other options
 */
frontend.worker.handler.page.create_BANG_ = (function frontend$worker$handler$page$create_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___186838 = arguments.length;
var i__5727__auto___186839 = (0);
while(true){
if((i__5727__auto___186839 < len__5726__auto___186838)){
args__5732__auto__.push((arguments[i__5727__auto___186839]));

var G__186840 = (i__5727__auto___186839 + (1));
i__5727__auto___186839 = G__186840;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((4) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((4)),(0),null)):null);
return frontend.worker.handler.page.create_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),argseq__5733__auto__);
});

(frontend.worker.handler.page.create_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (repo,conn,config,title,p__186820){
var map__186821 = p__186820;
var map__186821__$1 = cljs.core.__destructure_map(map__186821);
var options = map__186821__$1;
if(cljs.core.truth_((function (){var G__186822 = cljs.core.deref(conn);
return (logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(G__186822) : logseq.db.db_based_graph_QMARK_.call(null,G__186822));
})())){
return frontend.worker.handler.page.db_based.page.create_BANG_(conn,title,options);
} else {
return frontend.worker.handler.page.file_based.page.create_BANG_(repo,conn,config,title,options);
}
}));

(frontend.worker.handler.page.create_BANG_.cljs$lang$maxFixedArity = (4));

/** @this {Function} */
(frontend.worker.handler.page.create_BANG_.cljs$lang$applyTo = (function (seq186815){
var G__186816 = cljs.core.first(seq186815);
var seq186815__$1 = cljs.core.next(seq186815);
var G__186817 = cljs.core.first(seq186815__$1);
var seq186815__$2 = cljs.core.next(seq186815__$1);
var G__186818 = cljs.core.first(seq186815__$2);
var seq186815__$3 = cljs.core.next(seq186815__$2);
var G__186819 = cljs.core.first(seq186815__$3);
var seq186815__$4 = cljs.core.next(seq186815__$3);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__186816,G__186817,G__186818,G__186819,seq186815__$4);
}));

/**
 * Replace [[page name]] with page name
 */
frontend.worker.handler.page.db_refs__GT_page = (function frontend$worker$handler$page$db_refs__GT_page(repo,page_entity){
if(cljs.core.truth_(logseq.db.sqlite.util.db_based_graph_QMARK_(repo))){
var refs = new cljs.core.Keyword("block","_refs","block/_refs",830218531).cljs$core$IFn$_invoke$arity$1(page_entity);
var id_ref__GT_page = (function (p1__186823_SHARP_){
return logseq.db.frontend.content.content_id_ref__GT_page(p1__186823_SHARP_,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [page_entity], null));
});
if(cljs.core.seq(refs)){
var tx_data = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__186824){
var map__186825 = p__186824;
var map__186825__$1 = cljs.core.__destructure_map(map__186825);
var ref = map__186825__$1;
var raw_title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186825__$1,new cljs.core.Keyword("block","raw-title","block/raw-title",1833669090));
var content_SINGLEQUOTE_ = id_ref__GT_page(raw_title);
var content_tx = ((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(raw_title,content_SINGLEQUOTE_))?new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(ref),new cljs.core.Keyword("block","title","block/title",710445684),content_SINGLEQUOTE_], null):null);
var tx = content_tx;
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(ref),new cljs.core.Keyword("block","refs","block/refs",-1214495349),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page_entity)], null)], null),(cljs.core.truth_(tx)?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [tx], null):null));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([refs], 0));
return tx_data;
} else {
return null;
}
} else {
return null;
}
});
/**
 * Deletes a page. Returns true if able to delete page. If unable to delete,
 *   calls error-handler fn and returns false
 */
frontend.worker.handler.page.delete_BANG_ = (function frontend$worker$handler$page$delete_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___186841 = arguments.length;
var i__5727__auto___186842 = (0);
while(true){
if((i__5727__auto___186842 < len__5726__auto___186841)){
args__5732__auto__.push((arguments[i__5727__auto___186842]));

var G__186843 = (i__5727__auto___186842 + (1));
i__5727__auto___186842 = G__186843;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((3) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((3)),(0),null)):null);
return frontend.worker.handler.page.delete_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),argseq__5733__auto__);
});

(frontend.worker.handler.page.delete_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (repo,conn,page_uuid,p__186830){
var map__186831 = p__186830;
var map__186831__$1 = cljs.core.__destructure_map(map__186831);
var persist_op_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__186831__$1,new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),true);
var rename_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186831__$1,new cljs.core.Keyword(null,"rename?","rename?",-1728043099));
var error_handler = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__186831__$1,new cljs.core.Keyword(null,"error-handler","error-handler",-484945776),(function (p__186832){
var map__186833 = p__186832;
var map__186833__$1 = cljs.core.__destructure_map(map__186833);
var msg = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186833__$1,new cljs.core.Keyword(null,"msg","msg",-1386103444));
return console.error(msg);
}));
if(cljs.core.uuid_QMARK_(page_uuid)){
} else {
throw (new Error(["Assert failed: ",["frontend.worker.handler.page/delete! srong page-uuid: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((cljs.core.truth_(page_uuid)?page_uuid:"nil"))].join(''),"\n","(uuid? page-uuid)"].join('')));
}

if(cljs.core.truth_((function (){var and__5000__auto__ = repo;
if(cljs.core.truth_(and__5000__auto__)){
return page_uuid;
} else {
return and__5000__auto__;
}
})())){
var temp__5804__auto__ = (function (){var G__186834 = cljs.core.deref(conn);
var G__186835 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),page_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186834,G__186835) : datascript.core.entity.call(null,G__186834,G__186835));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var page = temp__5804__auto__;
var page_name = new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(page);
var blocks = new cljs.core.Keyword("block","_page","block/_page",1150043350).cljs$core$IFn$_invoke$arity$1(page);
var truncate_blocks_tx_data = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (block){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db.fn","retractEntity","db.fn/retractEntity",-1423535441),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)], null)], null);
}),blocks);
var db_based_QMARK_ = logseq.db.sqlite.util.db_based_graph_QMARK_(repo);
if(cljs.core.truth_((function (){var or__5002__auto__ = (logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.built_in_QMARK_.call(null,page));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (logseq.db.hidden_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.hidden_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.hidden_QMARK_.call(null,page));
}
})())){
var G__186836_186844 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"msg","msg",-1386103444),"Built-in page cannot be deleted"], null);
(error_handler.cljs$core$IFn$_invoke$arity$1 ? error_handler.cljs$core$IFn$_invoke$arity$1(G__186836_186844) : error_handler.call(null,G__186836_186844));

return false;
} else {
var db = cljs.core.deref(conn);
var file = (cljs.core.truth_(db_based_QMARK_)?null:logseq.graph_parser.db.get_page_file(db,page_name));
var file_path = new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(file);
var delete_file_tx = (cljs.core.truth_(file)?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db.fn","retractEntity","db.fn/retractEntity",-1423535441),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file","path","file/path",-191335748),file_path], null)], null)], null):null);
var delete_property_tx = (cljs.core.truth_((logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.property_QMARK_.call(null,page)))?cljs.core.concat.cljs$core$IFn$_invoke$arity$2((function (){var datoms = datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(conn),new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(page));
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (d){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(d)], null);
}),datoms);
})(),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (d){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d)], null);
}),datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(cljs.core.deref(conn),new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("logseq.property.history","property","logseq.property.history/property",1600409082),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(page)))):null);
var delete_page_tx = cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(frontend.worker.handler.page.db_refs__GT_page(repo,page),delete_property_tx,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db.fn","retractEntity","db.fn/retractEntity",-1423535441),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page)], null)], null)], 0));
var restore_class_parent_tx = (cljs.core.truth_(db_based_QMARK_)?cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(p),new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509),new cljs.core.Keyword("logseq.class","Root","logseq.class/Root",273783827)], null);
}),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p){
return (logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(p) : logseq.db.class_QMARK_.call(null,p));
}),new cljs.core.Keyword("logseq.property","_parent","logseq.property/_parent",444328035).cljs$core$IFn$_invoke$arity$1(page))):null);
var tx_data = cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(truncate_blocks_tx_data,restore_class_parent_tx,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([delete_page_tx,delete_file_tx], 0));
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,tx_data,(function (){var G__186837 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"delete-page","delete-page",-1371381770),new cljs.core.Keyword(null,"deleted-page","deleted-page",-665410015),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page)),new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),persist_op_QMARK_], null);
var G__186837__$1 = (cljs.core.truth_(rename_QMARK_)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__186837,new cljs.core.Keyword(null,"real-outliner-op","real-outliner-op",1979985933),new cljs.core.Keyword(null,"rename-page","rename-page",-2094129371)):G__186837);
if(cljs.core.truth_(file_path)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__186837__$1,new cljs.core.Keyword(null,"file-path","file-path",-2005501162),file_path);
} else {
return G__186837__$1;
}
})());

return true;
}
} else {
return null;
}
} else {
return null;
}
}));

(frontend.worker.handler.page.delete_BANG_.cljs$lang$maxFixedArity = (3));

/** @this {Function} */
(frontend.worker.handler.page.delete_BANG_.cljs$lang$applyTo = (function (seq186826){
var G__186827 = cljs.core.first(seq186826);
var seq186826__$1 = cljs.core.next(seq186826);
var G__186828 = cljs.core.first(seq186826__$1);
var seq186826__$2 = cljs.core.next(seq186826__$1);
var G__186829 = cljs.core.first(seq186826__$2);
var seq186826__$3 = cljs.core.next(seq186826__$2);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__186827,G__186828,G__186829,seq186826__$3);
}));


//# sourceMappingURL=frontend.worker.handler.page.js.map
