goog.provide('frontend.worker.db.migrate');
frontend.worker.db.migrate.replace_original_name_content_with_title = (function frontend$worker$db$migrate$replace_original_name_content_with_title(conn,search_db){
frontend.worker.search.truncate_table_BANG_(search_db);

var G__186435_186723 = conn;
var G__186436_186724 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("db","index","db/index",-1531680669),true], null)], null);
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2(G__186435_186723,G__186436_186724) : datascript.core.transact_BANG_.call(null,G__186435_186723,G__186436_186724));

var datoms = datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(conn),new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
var tx_data = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (d){
var e = (function (){var G__186441 = cljs.core.deref(conn);
var G__186442 = new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186441,G__186442) : datascript.core.entity.call(null,G__186441,G__186442));
})();
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2((cljs.core.truth_(new cljs.core.Keyword("block","content","block/content",-161885195).cljs$core$IFn$_invoke$arity$1(e))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("block","content","block/content",-161885195)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("block","content","block/content",-161885195).cljs$core$IFn$_invoke$arity$1(e)], null)], null):null),(cljs.core.truth_(new cljs.core.Keyword("block","original-name","block/original-name",-1620099234).cljs$core$IFn$_invoke$arity$1(e))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("block","original-name","block/original-name",-1620099234)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("block","original-name","block/original-name",-1620099234).cljs$core$IFn$_invoke$arity$1(e)], null)], null):null));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([datoms], 0));
return tx_data;
});
frontend.worker.db.migrate.replace_object_and_page_type_with_node = (function frontend$worker$db$migrate$replace_object_and_page_type_with_node(conn,_search_db){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(p),new cljs.core.Keyword("block","schema","block/schema",-1756575216),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword("block","schema","block/schema",-1756575216).cljs$core$IFn$_invoke$arity$1(p),new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"node","node",581201198))], null);
}),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"page","page",849072397),null,new cljs.core.Keyword(null,"object","object",1474613949),null], null), null),new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","schema","block/schema",-1756575216).cljs$core$IFn$_invoke$arity$1(p)));
}),(function (){var G__186443 = cljs.core.deref(conn);
return (logseq.db.get_all_properties.cljs$core$IFn$_invoke$arity$1 ? logseq.db.get_all_properties.cljs$core$IFn$_invoke$arity$1(G__186443) : logseq.db.get_all_properties.call(null,G__186443));
})()));
});
frontend.worker.db.migrate.update_task_ident = (function frontend$worker$db$migrate$update_task_ident(conn,_search_db){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((function (){var G__186444 = cljs.core.deref(conn);
var G__186445 = new cljs.core.Keyword("logseq.class","task","logseq.class/task",1275017188);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186444,G__186445) : datascript.core.entity.call(null,G__186444,G__186445));
})()),new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword("logseq.class","Task","logseq.class/Task",-1282181457)], null)], null);
});
frontend.worker.db.migrate.property_checkbox_type_non_ref = (function frontend$worker$db$migrate$property_checkbox_type_non_ref(conn,_search_db){
var db = cljs.core.deref(conn);
var properties = (function (){var G__186447 = new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?ident","?ident",1230589912,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword("block","schema","block/schema",-1756575216),new cljs.core.Symbol(null,"?s","?s",456183954,null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"get","get",-971253014,null),new cljs.core.Symbol(null,"?s","?s",456183954,null),new cljs.core.Keyword(null,"type","type",1174270348)),new cljs.core.Symbol(null,"?t","?t",1786819229,null)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"=","=",-1501502141,null),new cljs.core.Symbol(null,"?t","?t",1786819229,null),new cljs.core.Keyword(null,"checkbox","checkbox",1612615655))], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Symbol(null,"?ident","?ident",1230589912,null)], null)], null);
var G__186448 = db;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$2 ? datascript.core.q.cljs$core$IFn$_invoke$arity$2(G__186447,G__186448) : datascript.core.q.call(null,G__186447,G__186448));
})();
var datoms = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__186446_SHARP_){
return datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),p1__186446_SHARP_);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([properties], 0));
var schema_tx_data = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (ident){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),ident,new cljs.core.Keyword("db","valueType","db/valueType",1827971944)], null);
}),properties);
var value_tx_data = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (d){
var e = new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d);
var a = new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(d);
var v = new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d);
var ve = ((cljs.core.integer_QMARK_(v))?(datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,v) : datascript.core.entity.call(null,db,v)):null);
var ve_value = new cljs.core.Keyword("property.value","content","property.value/content",864202864).cljs$core$IFn$_invoke$arity$1(ve);
if((!((ve_value == null)))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),e,a,ve_value], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),v], null)], null);
} else {
return null;
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([datoms], 0));
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(schema_tx_data,value_tx_data);
});
frontend.worker.db.migrate.update_table_properties = (function frontend$worker$db$migrate$update_table_properties(conn,_search_db){
var old_new_props = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword("logseq.property","table-sorting","logseq.property/table-sorting",-1693683210),new cljs.core.Keyword("logseq.property.table","sorting","logseq.property.table/sorting",208102594),new cljs.core.Keyword("logseq.property","table-filters","logseq.property/table-filters",1056161803),new cljs.core.Keyword("logseq.property.table","filters","logseq.property.table/filters",-1702393633),new cljs.core.Keyword("logseq.property","table-ordered-columns","logseq.property/table-ordered-columns",-726575583),new cljs.core.Keyword("logseq.property.table","ordered-columns","logseq.property.table/ordered-columns",1485587100),new cljs.core.Keyword("logseq.property","table-hidden-columns","logseq.property/table-hidden-columns",-840389376),new cljs.core.Keyword("logseq.property.table","hidden-columns","logseq.property.table/hidden-columns",975057192)], null);
var props_tx = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p__186449){
var vec__186450 = p__186449;
var old = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186450,(0),null);
var new$ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186450,(1),null);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((function (){var G__186453 = cljs.core.deref(conn);
var G__186454 = old;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186453,G__186454) : datascript.core.entity.call(null,G__186453,G__186454));
})()),new cljs.core.Keyword("db","ident","db/ident",-737096),new$], null);
}),old_new_props);
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,props_tx,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"db-migrate?","db-migrate?",-1274296762),true], null));

return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__186455){
var vec__186456 = p__186455;
var old = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186456,(0),null);
var new$ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186456,(1),null);
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__186459){
var vec__186460 = p__186459;
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186460,(0),null);
var prop_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186460,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),id,old], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),id,new$,prop_value], null)], null);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(function (){var G__186463 = new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Symbol(null,"?prop-v","?prop-v",-667103471,null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?prop","?prop",1880869414,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Symbol(null,"?prop","?prop",1880869414,null),new cljs.core.Symbol(null,"?prop-v","?prop-v",-667103471,null)], null)], null);
var G__186464 = cljs.core.deref(conn);
var G__186465 = old;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$3 ? datascript.core.q.cljs$core$IFn$_invoke$arity$3(G__186463,G__186464,G__186465) : datascript.core.q.call(null,G__186463,G__186464,G__186465));
})()], 0));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([old_new_props], 0));
});
frontend.worker.db.migrate.rename_properties_aux = (function frontend$worker$db$migrate$rename_properties_aux(db,props_to_rename){
var property_tx = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__186466){
var vec__186467 = p__186466;
var old = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186467,(0),null);
var new$ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186467,(1),null);
var e_new = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,new$) : datascript.core.entity.call(null,db,new$));
var e_old = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,old) : datascript.core.entity.call(null,db,old));
if(cljs.core.truth_(e_new)){
if(cljs.core.truth_(e_old)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(e_old)], null);
} else {
return null;
}
} else {
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,old) : datascript.core.entity.call(null,db,old))),new cljs.core.Keyword("db","ident","db/ident",-737096),new$], null),(function (){var temp__5804__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.built_in_properties,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new$,new cljs.core.Keyword(null,"title","title",636505583)], null));
if(cljs.core.truth_(temp__5804__auto__)){
var new_title = temp__5804__auto__;
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","title","block/title",710445684),new_title,new cljs.core.Keyword("block","name","block/name",1619760316),logseq.common.util.page_name_sanity_lc(new_title)], null);
} else {
return null;
}
})()], 0));
}
}),props_to_rename);
var titles_tx = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (d){
var title = new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d);
if(typeof title === 'string'){
var temp__5804__auto__ = cljs.core.seq(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p__186470){
var vec__186471 = p__186470;
var old = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186471,(0),null);
var _new = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186471,(1),null);
return clojure.string.includes_QMARK_(new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d),cljs.core.str.cljs$core$IFn$_invoke$arity$1(old));
}),props_to_rename));
if(temp__5804__auto__){
var props = temp__5804__auto__;
var title_SINGLEQUOTE_ = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (title__$1,p__186474){
var vec__186475 = p__186474;
var old = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186475,(0),null);
var new$ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186475,(1),null);
return clojure.string.replace(title__$1,cljs.core.str.cljs$core$IFn$_invoke$arity$1(old),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new$));
}),title,props);
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("block","title","block/title",710445684),title_SINGLEQUOTE_], null);
} else {
return null;
}
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("block","title","block/title",710445684)], null);
}
}),datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","title","block/title",710445684)));
var sorting_tx = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (d){
if(cljs.core.coll_QMARK_(new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d))){
var temp__5804__auto__ = cljs.core.seq(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p__186478){
var vec__186479 = p__186478;
var old = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186479,(0),null);
var _new = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186479,(1),null);
return cljs.core.some((function (item){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(old,new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item));
}),new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d));
}),props_to_rename));
if(temp__5804__auto__){
var props = temp__5804__auto__;
var value = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (sorting,p__186482){
var vec__186483 = p__186482;
var old = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186483,(0),null);
var new$ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186483,(1),null);
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (item){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(old,new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(item,new cljs.core.Keyword(null,"id","id",-1388402092),new$);
} else {
return item;
}
}),sorting);
}),new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d),props);
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("logseq.property.table","sorting","logseq.property.table/sorting",208102594),value], null);
} else {
return null;
}
} else {
return null;
}
}),datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("logseq.property.table","sorting","logseq.property.table/sorting",208102594)));
var sized_columns_tx = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (d){
if(cljs.core.map_QMARK_(new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d))){
var temp__5804__auto__ = cljs.core.seq(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p__186486){
var vec__186487 = p__186486;
var old = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186487,(0),null);
var _new = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186487,(1),null);
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d),old);
}),props_to_rename));
if(temp__5804__auto__){
var props = temp__5804__auto__;
var value = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (sizes,p__186490){
var vec__186491 = p__186490;
var old = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186491,(0),null);
var new$ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186491,(1),null);
var temp__5802__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(sizes,old);
if(cljs.core.truth_(temp__5802__auto__)){
var size = temp__5802__auto__;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(sizes,old),new$,size);
} else {
return sizes;
}
}),new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d),props);
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("logseq.property.table","sized-columns","logseq.property.table/sized-columns",-1675510555),value], null);
} else {
return null;
}
} else {
return null;
}
}),datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("logseq.property.table","sized-columns","logseq.property.table/sized-columns",-1675510555)));
var hidden_columns_tx = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__186494){
var vec__186495 = p__186494;
var old = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186495,(0),null);
var new$ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186495,(1),null);
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (d){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("logseq.property.table","hidden-columns","logseq.property.table/hidden-columns",975057192),old], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("logseq.property.table","hidden-columns","logseq.property.table/hidden-columns",975057192),new$], null)], null);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("logseq.property.table","hidden-columns","logseq.property.table/hidden-columns",975057192),old)], 0));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([props_to_rename], 0));
var ordered_columns_tx = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (d){
if(cljs.core.coll_QMARK_(new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d))){
var temp__5804__auto__ = cljs.core.seq(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p__186498){
var vec__186499 = p__186498;
var old = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186499,(0),null);
var _new = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186499,(1),null);
var fexpr__186502 = cljs.core.set(new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d));
return (fexpr__186502.cljs$core$IFn$_invoke$arity$1 ? fexpr__186502.cljs$core$IFn$_invoke$arity$1(old) : fexpr__186502.call(null,old));
}),props_to_rename));
if(temp__5804__auto__){
var props = temp__5804__auto__;
var value = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (col,p__186503){
var vec__186504 = p__186503;
var old = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186504,(0),null);
var new$ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186504,(1),null);
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (v){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(old,v)){
return new$;
} else {
return v;
}
}),col);
}),new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d),props);
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("logseq.property.table","ordered-columns","logseq.property.table/ordered-columns",1485587100),value], null);
} else {
return null;
}
} else {
return null;
}
}),datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("logseq.property.table","ordered-columns","logseq.property.table/ordered-columns",1485587100)));
var filters_tx = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (d){
var filters = new cljs.core.Keyword(null,"filters","filters",974726919).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d));
if(cljs.core.coll_QMARK_(filters)){
var temp__5804__auto__ = cljs.core.seq(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p__186507){
var vec__186508 = p__186507;
var old = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186508,(0),null);
var _new = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186508,(1),null);
return cljs.core.some((function (item){
return ((cljs.core.vector_QMARK_(item)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(old,cljs.core.first(item))));
}),filters);
}),props_to_rename));
if(temp__5804__auto__){
var props = temp__5804__auto__;
var value = cljs.core.update.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword(null,"filters","filters",974726919),(function (col){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (col__$1,p__186511){
var vec__186512 = p__186511;
var old = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186512,(0),null);
var new$ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186512,(1),null);
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (item){
if(((cljs.core.vector_QMARK_(item)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(old,cljs.core.first(item))))){
return cljs.core.vec(cljs.core.cons(new$,cljs.core.rest(item)));
} else {
return item;
}
}),col__$1);
}),col,props);
}));
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("logseq.property.table","filters","logseq.property.table/filters",-1702393633),value], null);
} else {
return null;
}
} else {
return null;
}
}),datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("logseq.property.table","filters","logseq.property.table/filters",-1702393633)));
return cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(property_tx,titles_tx,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([sorting_tx,sized_columns_tx,hidden_columns_tx,ordered_columns_tx,filters_tx], 0));
});
frontend.worker.db.migrate.rename_properties = (function frontend$worker$db$migrate$rename_properties(props_to_rename){
return (function (conn,_search_db){
if(cljs.core.truth_((function (){var G__186515 = cljs.core.deref(conn);
return (logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(G__186515) : logseq.db.db_based_graph_QMARK_.call(null,G__186515));
})())){
var props_tx = frontend.worker.db.migrate.rename_properties_aux(cljs.core.deref(conn),props_to_rename);
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,props_tx,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"db-migrate?","db-migrate?",-1274296762),true], null));

return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__186516){
var vec__186517 = p__186516;
var old = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186517,(0),null);
var new$ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186517,(1),null);
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__186520){
var vec__186521 = p__186520;
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186521,(0),null);
var prop_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186521,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),id,old], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),id,new$,prop_value], null)], null);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(function (){var G__186524 = new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Symbol(null,"?prop-v","?prop-v",-667103471,null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?prop","?prop",1880869414,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Symbol(null,"?prop","?prop",1880869414,null),new cljs.core.Symbol(null,"?prop-v","?prop-v",-667103471,null)], null)], null);
var G__186525 = cljs.core.deref(conn);
var G__186526 = old;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$3 ? datascript.core.q.cljs$core$IFn$_invoke$arity$3(G__186524,G__186525,G__186526) : datascript.core.q.call(null,G__186524,G__186525,G__186526));
})()], 0));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([props_to_rename], 0));
} else {
return null;
}
});
});
frontend.worker.db.migrate.rename_classes = (function frontend$worker$db$migrate$rename_classes(classes_to_rename){
return (function (conn,_search_db){
if(cljs.core.truth_((function (){var G__186527 = cljs.core.deref(conn);
return (logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(G__186527) : logseq.db.db_based_graph_QMARK_.call(null,G__186527));
})())){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p__186528){
var vec__186529 = p__186528;
var old = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186529,(0),null);
var new$ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186529,(1),null);
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((function (){var G__186532 = cljs.core.deref(conn);
var G__186533 = old;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186532,G__186533) : datascript.core.entity.call(null,G__186532,G__186533));
})()),new cljs.core.Keyword("db","ident","db/ident",-737096),new$], null),(function (){var temp__5804__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.class$.built_in_classes,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new$,new cljs.core.Keyword(null,"title","title",636505583)], null));
if(cljs.core.truth_(temp__5804__auto__)){
var new_title = temp__5804__auto__;
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","title","block/title",710445684),new_title,new cljs.core.Keyword("block","name","block/name",1619760316),logseq.common.util.page_name_sanity_lc(new_title)], null);
} else {
return null;
}
})()], 0));
}),classes_to_rename);
} else {
return null;
}
});
});
frontend.worker.db.migrate.set_hide_empty_value = (function frontend$worker$db$migrate$set_hide_empty_value(_conn,_search_db){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (k){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","ident","db/ident",-737096),k,new cljs.core.Keyword("logseq.property","hide-empty-value","logseq.property/hide-empty-value",2062325899),true], null);
}),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.task","status","logseq.task/status",1399171803),new cljs.core.Keyword("logseq.task","priority","logseq.task/priority",1714785995),new cljs.core.Keyword("logseq.task","deadline","logseq.task/deadline",-214956044)], null));
});
frontend.worker.db.migrate.update_hl_color_and_page = (function frontend$worker$db$migrate$update_hl_color_and_page(conn,_search_db){
if(cljs.core.truth_((function (){var G__186534 = cljs.core.deref(conn);
return (logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(G__186534) : logseq.db.db_based_graph_QMARK_.call(null,G__186534));
})())){
var db = cljs.core.deref(conn);
var hl_color = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword("logseq.property.pdf","hl-color","logseq.property.pdf/hl-color",-674793887)) : datascript.core.entity.call(null,db,new cljs.core.Keyword("logseq.property.pdf","hl-color","logseq.property.pdf/hl-color",-674793887)));
var hl_page = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword("logseq.property.pdf","hl-page","logseq.property.pdf/hl-page",-753284596)) : datascript.core.entity.call(null,db,new cljs.core.Keyword("logseq.property.pdf","hl-page","logseq.property.pdf/hl-page",-753284596)));
var existing_colors = datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("logseq.property.pdf","hl-color","logseq.property.pdf/hl-color",-674793887));
var color_update_tx = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (datom){
var block = (function (){var G__186535 = db;
var G__186536 = new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(datom);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186535,G__186536) : datascript.core.entity.call(null,G__186535,G__186536));
})();
var color_ident = cljs.core.keyword.cljs$core$IFn$_invoke$arity$2("logseq.property",["color.",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block))].join(''));
if(cljs.core.truth_(block)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(datom),new cljs.core.Keyword("logseq.property.pdf","hl-color","logseq.property.pdf/hl-color",-674793887),color_ident], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block)], null)], null);
} else {
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(datom),new cljs.core.Keyword("logseq.property.pdf","hl-color","logseq.property.pdf/hl-color",-674793887)], null)], null);
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([existing_colors], 0));
var page_datoms = datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("logseq.property.pdf","hl-page","logseq.property.pdf/hl-page",-753284596));
var page_update_tx = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (datom){
var block = (function (){var G__186537 = db;
var G__186538 = new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(datom);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186537,G__186538) : datascript.core.entity.call(null,G__186537,G__186538));
})();
var value = logseq.db.frontend.property.property_value_content(block);
if(cljs.core.integer_QMARK_(value)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(datom),new cljs.core.Keyword("logseq.property.pdf","hl-page","logseq.property.pdf/hl-page",-753284596),value], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block)], null)], null);
} else {
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(datom),new cljs.core.Keyword("logseq.property.pdf","hl-page","logseq.property.pdf/hl-page",-753284596)], null)], null);
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([page_datoms], 0));
var G__186539_186725 = conn;
var G__186540_186726 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword("logseq.property.pdf","hl-page","logseq.property.pdf/hl-page",-753284596),new cljs.core.Keyword("block","schema","block/schema",-1756575216),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"raw-number","raw-number",280226247)], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(hl_page),new cljs.core.Keyword("db","valueType","db/valueType",1827971944)], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword("logseq.property.pdf","hl-color","logseq.property.pdf/hl-color",-674793887),new cljs.core.Keyword("block","schema","block/schema",-1756575216),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"default","default",-1987822328)], null)], null)], null),logseq.db.frontend.property.build.closed_values__GT_blocks(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(hl_color,new cljs.core.Keyword(null,"closed-values","closed-values",364658811),cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.built_in_properties,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.pdf","hl-color","logseq.property.pdf/hl-color",-674793887),new cljs.core.Keyword(null,"closed-values","closed-values",364658811)], null)))));
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2(G__186539_186725,G__186540_186726) : datascript.core.transact_BANG_.call(null,G__186539_186725,G__186540_186726));

return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(color_update_tx,page_update_tx);
} else {
return null;
}
});
frontend.worker.db.migrate.store_url_value_in_block_title = (function frontend$worker$db$migrate$store_url_value_in_block_title(conn,_search_db){
var db = cljs.core.deref(conn);
var url_properties = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (datom){
var property = (function (){var G__186541 = db;
var G__186542 = new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(datom);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186541,G__186542) : datascript.core.entity.call(null,G__186541,G__186542));
})();
var type = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(property,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","schema","block/schema",-1756575216),new cljs.core.Keyword(null,"type","type",1174270348)], null));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(type,new cljs.core.Keyword(null,"url","url",276297046))){
return property;
} else {
return null;
}
}),datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","type","block/type",1537584409),"property"));
var datoms = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (property){
return datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([url_properties], 0));
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (datom){
var temp__5802__auto__ = ((cljs.core.integer_QMARK_(new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(datom)))?(function (){var G__186543 = db;
var G__186544 = new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(datom);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186543,G__186544) : datascript.core.entity.call(null,G__186543,G__186544));
})():null);
if(cljs.core.truth_(temp__5802__auto__)){
var url_block = temp__5802__auto__;
var url_value = logseq.db.frontend.property.property_value_content(url_block);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(url_block),new cljs.core.Keyword("property.value","content","property.value/content",864202864)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(url_block),new cljs.core.Keyword("block","title","block/title",710445684),url_value], null)], null);
} else {
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(datom),new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(datom)], null)], null);
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([datoms], 0));
});
frontend.worker.db.migrate.replace_hidden_type_with_schema = (function frontend$worker$db$migrate$replace_hidden_type_with_schema(conn,_search_db){
var db = cljs.core.deref(conn);
var datoms = datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","type","block/type",1537584409),"hidden");
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (datom){
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(datom),new cljs.core.Keyword("block","type","block/type",1537584409),"page",new cljs.core.Keyword("block","schema","block/schema",-1756575216),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"public?","public?",786025269),false], null)], null);
}),datoms);
});
frontend.worker.db.migrate.update_block_type_many__GT_one = (function frontend$worker$db$migrate$update_block_type_many__GT_one(conn,_search_db){
var db = cljs.core.deref(conn);
var datoms = datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","type","block/type",1537584409));
var new_type_tx = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (id){
var types = new cljs.core.Keyword("block","type","block/type",1537584409).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,id) : datascript.core.entity.call(null,db,id)));
var type = ((cljs.core.set_QMARK_(types))?((cljs.core.contains_QMARK_(types,"class"))?"class":((cljs.core.contains_QMARK_(types,"property"))?"property":((cljs.core.contains_QMARK_(types,"whiteboard"))?"whiteboard":((cljs.core.contains_QMARK_(types,"journal"))?"journal":((cljs.core.contains_QMARK_(types,"hidden"))?"hidden":((cljs.core.contains_QMARK_(types,"page"))?"page":cljs.core.first(types)
)))))):types);
if(cljs.core.truth_(type)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),id,new cljs.core.Keyword("block","type","block/type",1537584409)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),id,new cljs.core.Keyword("block","type","block/type",1537584409),type], null)], null);
} else {
return null;
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"e","e",1381269198),datoms))], 0));
var schema = new cljs.core.Keyword(null,"schema","schema",-1582001791).cljs$core$IFn$_invoke$arity$1(db);
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,new_type_tx,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"db-migrate?","db-migrate?",-1274296762),true], null));

var G__186546_186727 = conn;
var G__186547_186728 = cljs.core.update.cljs$core$IFn$_invoke$arity$3(schema,new cljs.core.Keyword("block","type","block/type",1537584409),(function (p1__186545_SHARP_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__186545_SHARP_,new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659),new cljs.core.Keyword("db.cardinality","one","db.cardinality/one",1428352190));
}));
(datascript.core.reset_schema_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.reset_schema_BANG_.cljs$core$IFn$_invoke$arity$2(G__186546_186727,G__186547_186728) : datascript.core.reset_schema_BANG_.call(null,G__186546_186727,G__186547_186728));

return cljs.core.PersistentVector.EMPTY;
});
frontend.worker.db.migrate.deprecate_class_parent = (function frontend$worker$db$migrate$deprecate_class_parent(conn,_search_db){
var db = cljs.core.deref(conn);
if(cljs.core.truth_((logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(db) : logseq.db.db_based_graph_QMARK_.call(null,db)))){
var datoms = datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("class","parent","class/parent",-917401011));
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (id){
var value = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("class","parent","class/parent",-917401011).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,id) : datascript.core.entity.call(null,db,id))));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),id,new cljs.core.Keyword("class","parent","class/parent",-917401011)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),id,new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509),value], null)], null);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"e","e",1381269198),datoms))], 0));
} else {
return null;
}
});
frontend.worker.db.migrate.deprecate_class_schema_properties = (function frontend$worker$db$migrate$deprecate_class_schema_properties(conn,_search_db){
var db = cljs.core.deref(conn);
if(cljs.core.truth_((logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(db) : logseq.db.db_based_graph_QMARK_.call(null,db)))){
var datoms = datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("class","schema.properties","class/schema.properties",1629639302));
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (id){
var values = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("class","schema.properties","class/schema.properties",1629639302).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,id) : datascript.core.entity.call(null,db,id))));
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),id,new cljs.core.Keyword("class","schema.properties","class/schema.properties",1629639302)], null)], null),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (value){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),id,new cljs.core.Keyword("logseq.property.class","properties","logseq.property.class/properties",-2123712050),value], null);
}),values));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"e","e",1381269198),datoms))], 0));
} else {
return null;
}
});
frontend.worker.db.migrate.update_db_attrs_type = (function frontend$worker$db$migrate$update_db_attrs_type(conn,_search_db){
var db = cljs.core.deref(conn);
if(cljs.core.truth_((logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(db) : logseq.db.db_based_graph_QMARK_.call(null,db)))){
var alias = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword("block","alias","block/alias",-2112644699)) : datascript.core.entity.call(null,db,new cljs.core.Keyword("block","alias","block/alias",-2112644699)));
var tags = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword("block","tags","block/tags",1814948340)) : datascript.core.entity.call(null,db,new cljs.core.Keyword("block","tags","block/tags",1814948340)));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(alias),new cljs.core.Keyword("block","schema","block/schema",-1756575216),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.Keyword(null,"cardinality","cardinality",-104971109),new cljs.core.Keyword(null,"many","many",1092119164),new cljs.core.Keyword(null,"view-context","view-context",1657133268),new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.Keyword(null,"public?","public?",786025269),true], null)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(tags),new cljs.core.Keyword("block","schema","block/schema",-1756575216),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.Keyword(null,"cardinality","cardinality",-104971109),new cljs.core.Keyword(null,"many","many",1092119164),new cljs.core.Keyword(null,"public?","public?",786025269),true,new cljs.core.Keyword(null,"classes","classes",2037804510),new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.class","Root","logseq.class/Root",273783827),null], null), null)], null)], null)], null);
} else {
return null;
}
});
frontend.worker.db.migrate.fix_view_for = (function frontend$worker$db$migrate$fix_view_for(conn,_search_db){
var db = cljs.core.deref(conn);
if(cljs.core.truth_((logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(db) : logseq.db.db_based_graph_QMARK_.call(null,db)))){
var datoms = datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("logseq.property","view-for","logseq.property/view-for",-36274319));
var e = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword("logseq.property","view-for","logseq.property/view-for",-36274319)) : datascript.core.entity.call(null,db,new cljs.core.Keyword("logseq.property","view-for","logseq.property/view-for",-36274319)));
var fix_schema = new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(e),new cljs.core.Keyword("block","schema","block/schema",-1756575216),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"node","node",581201198),new cljs.core.Keyword(null,"hide?","hide?",-988635670),true,new cljs.core.Keyword(null,"public?","public?",786025269),false], null)], null);
var fix_data = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (d){
var temp__5802__auto__ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"all-pages","all-pages",1017563062),new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d)))?new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(logseq.db.get_case_page(db,logseq.common.config.views_page_name)):new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((function (){var G__186548 = db;
var G__186549 = new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186548,G__186549) : datascript.core.entity.call(null,G__186548,G__186549));
})()));
if(cljs.core.truth_(temp__5802__auto__)){
var id = temp__5802__auto__;
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("logseq.property","view-for","logseq.property/view-for",-36274319),id], null);
} else {
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("logseq.property","view-for","logseq.property/view-for",-36274319),new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d)], null);
}
}),datoms);
return cljs.core.cons(fix_schema,fix_data);
} else {
return null;
}
});
frontend.worker.db.migrate.add_card_properties = (function frontend$worker$db$migrate$add_card_properties(conn,_search_db){
var db = cljs.core.deref(conn);
if(cljs.core.truth_((logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(db) : logseq.db.db_based_graph_QMARK_.call(null,db)))){
var card = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword("logseq.class","Card","logseq.class/Card",-1358281109)) : datascript.core.entity.call(null,db,new cljs.core.Keyword("logseq.class","Card","logseq.class/Card",-1358281109)));
var card_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(card);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),card_id,new cljs.core.Keyword("logseq.property.class","properties","logseq.property.class/properties",-2123712050),new cljs.core.Keyword("logseq.property.fsrs","due","logseq.property.fsrs/due",-1089080549)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),card_id,new cljs.core.Keyword("logseq.property.class","properties","logseq.property.class/properties",-2123712050),new cljs.core.Keyword("logseq.property.fsrs","state","logseq.property.fsrs/state",-1165165087)], null)], null);
} else {
return null;
}
});
frontend.worker.db.migrate.add_query_property_to_query_tag = (function frontend$worker$db$migrate$add_query_property_to_query_tag(conn,_search_db){
var db = cljs.core.deref(conn);
if(cljs.core.truth_((logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(db) : logseq.db.db_based_graph_QMARK_.call(null,db)))){
var query = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword("logseq.class","Query","logseq.class/Query",-232480166)) : datascript.core.entity.call(null,db,new cljs.core.Keyword("logseq.class","Query","logseq.class/Query",-232480166)));
var query_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(query);
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),query_id,new cljs.core.Keyword("logseq.property.class","properties","logseq.property.class/properties",-2123712050),new cljs.core.Keyword("logseq.property","query","logseq.property/query",-97414126)], null)], null);
} else {
return null;
}
});
frontend.worker.db.migrate.add_card_view = (function frontend$worker$db$migrate$add_card_view(conn,_search_db){
var db = cljs.core.deref(conn);
if(cljs.core.truth_((logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(db) : logseq.db.db_based_graph_QMARK_.call(null,db)))){
var ident = new cljs.core.Keyword("logseq.property.view","type.card","logseq.property.view/type.card",-1473433148);
var uuid_SINGLEQUOTE_ = logseq.common.uuid.gen_uuid.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"db-ident-block-uuid","db-ident-block-uuid",-2020167291),ident);
var property = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword("logseq.property.view","type","logseq.property.view/type",218237607)) : datascript.core.entity.call(null,db,new cljs.core.Keyword("logseq.property.view","type","logseq.property.view/type",218237607)));
var m = (function (){var G__186550 = logseq.db.frontend.property.build.build_closed_value_block(uuid_SINGLEQUOTE_,null,"Card View",property,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"db-ident","db-ident",-992686073),new cljs.core.Keyword("logseq.property.view","type.card","logseq.property.view/type.card",-1473433148)], null));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__186550,new cljs.core.Keyword("block","order","block/order",-1429282437),logseq.db.common.order.gen_key.cljs$core$IFn$_invoke$arity$0());

})();
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [m], null);
} else {
return null;
}
});
frontend.worker.db.migrate.add_tags_for_typed_display_blocks = (function frontend$worker$db$migrate$add_tags_for_typed_display_blocks(conn,_search_db){
var db = cljs.core.deref(conn);
if(cljs.core.truth_((logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(db) : logseq.db.db_based_graph_QMARK_.call(null,db)))){
var property = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189)) : datascript.core.entity.call(null,db,new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189)));
var _ = (cljs.core.truth_((function (){var and__5000__auto__ = (logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1(property) : logseq.db.property_QMARK_.call(null,property));
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword("db","index","db/index",-1531680669).cljs$core$IFn$_invoke$arity$1(property) === true;
} else {
return and__5000__auto__;
}
})())?null:(function (){var fix_tx_data = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (m){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property));
}),logseq.db.sqlite.create_graph.build_properties(cljs.core.select_keys(logseq.db.frontend.property.built_in_properties,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189)], null))));
return (datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2(conn,fix_tx_data) : datascript.core.transact_BANG_.call(null,conn,fix_tx_data));
})());
var datoms = datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(conn),new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189));
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (d){
var temp__5804__auto__ = (function (){var G__186551 = new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d);
return (logseq.db.get_class_ident_by_display_type.cljs$core$IFn$_invoke$arity$1 ? logseq.db.get_class_ident_by_display_type.cljs$core$IFn$_invoke$arity$1(G__186551) : logseq.db.get_class_ident_by_display_type.call(null,G__186551));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var tag_id = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("block","tags","block/tags",1814948340),tag_id], null);
} else {
return null;
}
}),datoms);
} else {
return null;
}
});
frontend.worker.db.migrate.rename_card_view_to_gallery_view = (function frontend$worker$db$migrate$rename_card_view_to_gallery_view(conn,_search_db){
if(cljs.core.truth_((function (){var G__186552 = cljs.core.deref(conn);
return (logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(G__186552) : logseq.db.db_based_graph_QMARK_.call(null,G__186552));
})())){
var card = (function (){var G__186553 = cljs.core.deref(conn);
var G__186554 = new cljs.core.Keyword("logseq.property.view","type.card","logseq.property.view/type.card",-1473433148);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186553,G__186554) : datascript.core.entity.call(null,G__186553,G__186554));
})();
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(card),new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword("logseq.property.view","type.gallery","logseq.property.view/type.gallery",150605112),new cljs.core.Keyword("block","title","block/title",710445684),"Gallery View"], null)], null);
} else {
return null;
}
});
frontend.worker.db.migrate.add_pdf_annotation_class = (function frontend$worker$db$migrate$add_pdf_annotation_class(conn,_search_db){
var db = cljs.core.deref(conn);
if(cljs.core.truth_((logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(db) : logseq.db.db_based_graph_QMARK_.call(null,db)))){
var datoms = datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("logseq.property","ls-type","logseq.property/ls-type",326979345),new cljs.core.Keyword(null,"annotation","annotation",-344661666));
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (d){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","pdf-annotation","logseq.class/pdf-annotation",-324183757)], null);
}),datoms);
} else {
return null;
}
});
frontend.worker.db.migrate.replace_special_id_ref_with_id_ref = (function frontend$worker$db$migrate$replace_special_id_ref_with_id_ref(conn,_search_db){
var db = cljs.core.deref(conn);
var ref_special_chars = "~^";
var id_ref_pattern = cljs.core.re_pattern(["(?i)","~\\^","(",logseq.common.util.uuid_pattern,")"].join(''));
var datoms = datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","title","block/title",710445684));
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__186555){
var map__186556 = p__186555;
var map__186556__$1 = cljs.core.__destructure_map(map__186556);
var e = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186556__$1,new cljs.core.Keyword(null,"e","e",1381269198));
var v = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186556__$1,new cljs.core.Keyword(null,"v","v",21465059));
if(typeof v === 'string'){
if(clojure.string.includes_QMARK_(v,ref_special_chars)){
var entity = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,e) : datascript.core.entity.call(null,db,e));
if(cljs.core.truth_((function (){var and__5000__auto__ = (logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(entity) : logseq.db.page_QMARK_.call(null,entity));
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.re_find(logseq.db.frontend.content.id_ref_pattern,v);
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),e], null);
} else {
if(clojure.string.includes_QMARK_(v,[logseq.common.util.page_ref.left_brackets,ref_special_chars].join(''))){
var title_SINGLEQUOTE_ = clojure.string.replace(v,[logseq.common.util.page_ref.left_brackets,ref_special_chars].join(''),logseq.common.util.page_ref.left_brackets);
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"debug","debug",-1608172596),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"old-title","old-title",-85478212),v,new cljs.core.Keyword(null,"new-title","new-title",-2087375544),title_SINGLEQUOTE_], null)], 0));

return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),e,new cljs.core.Keyword("block","title","block/title",710445684),title_SINGLEQUOTE_], null);
} else {
if(cljs.core.truth_(cljs.core.re_find(id_ref_pattern,v))){
var title_SINGLEQUOTE_ = clojure.string.replace(v,id_ref_pattern,"$1");
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"debug","debug",-1608172596),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"old-title","old-title",-85478212),v,new cljs.core.Keyword(null,"new-title","new-title",-2087375544),title_SINGLEQUOTE_], null)], 0));

return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),e,new cljs.core.Keyword("block","title","block/title",710445684),title_SINGLEQUOTE_], null);
} else {
return null;
}
}
}
} else {
return null;
}
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),e], null);
}
}),datoms);
});
frontend.worker.db.migrate.replace_block_type_with_tags = (function frontend$worker$db$migrate$replace_block_type_with_tags(conn,_search_db){
var db = cljs.core.deref(conn);
var block_type_entity = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword("block","type","block/type",1537584409)) : datascript.core.entity.call(null,db,new cljs.core.Keyword("block","type","block/type",1537584409)));
var datoms = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (d){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","type","block/type",1537584409),new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(d));
}),datascript.core.datoms.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073)));
var tx_data = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__186557){
var map__186558 = p__186557;
var map__186558__$1 = cljs.core.__destructure_map(map__186558);
var e = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186558__$1,new cljs.core.Keyword(null,"e","e",1381269198));
var _a = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186558__$1,new cljs.core.Keyword(null,"_a","_a",1146191149));
var v = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186558__$1,new cljs.core.Keyword(null,"v","v",21465059));
var tag = (function (){var G__186559 = v;
switch (G__186559) {
case "page":
return new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329);

break;
case "class":
return new cljs.core.Keyword("logseq.class","Tag","logseq.class/Tag",-538902083);

break;
case "property":
return new cljs.core.Keyword("logseq.class","Property","logseq.class/Property",1038767048);

break;
case "journal":
return new cljs.core.Keyword("logseq.class","Journal","logseq.class/Journal",1979741081);

break;
case "whiteboard":
return new cljs.core.Keyword("logseq.class","Whiteboard","logseq.class/Whiteboard",1013698452);

break;
case "asset":
return new cljs.core.Keyword("logseq.class","Asset","logseq.class/Asset",-797502970);

break;
case "closed value":
return null;

break;
default:
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("unsupported block/type",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"type","type",1174270348),v], null));

}
})();
var G__186560 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),e,new cljs.core.Keyword("block","type","block/type",1537584409)], null)], null);
if((!((tag == null)))){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__186560,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),e,new cljs.core.Keyword("block","tags","block/tags",1814948340),tag], null));
} else {
return G__186560;
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([datoms], 0));
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(tx_data,(cljs.core.truth_(block_type_entity)?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block_type_entity)], null)], null):null));
});
frontend.worker.db.migrate.add_scheduled_to_task = (function frontend$worker$db$migrate$add_scheduled_to_task(conn,_search_db){
var db = cljs.core.deref(conn);
if(cljs.core.truth_((logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(db) : logseq.db.db_based_graph_QMARK_.call(null,db)))){
var e = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword("logseq.class","Task","logseq.class/Task",-1282181457)) : datascript.core.entity.call(null,db,new cljs.core.Keyword("logseq.class","Task","logseq.class/Task",-1282181457)));
var eid = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(e);
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),eid,new cljs.core.Keyword("logseq.property.class","properties","logseq.property.class/properties",-2123712050),new cljs.core.Keyword("logseq.task","scheduled","logseq.task/scheduled",-793735425)], null)], null);
} else {
return null;
}
});
frontend.worker.db.migrate.update_deadline_to_datetime = (function frontend$worker$db$migrate$update_deadline_to_datetime(conn,_search_db){
var db = cljs.core.deref(conn);
if(cljs.core.truth_((logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(db) : logseq.db.db_based_graph_QMARK_.call(null,db)))){
var e = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword("logseq.task","deadline","logseq.task/deadline",-214956044)) : datascript.core.entity.call(null,db,new cljs.core.Keyword("logseq.task","deadline","logseq.task/deadline",-214956044)));
var datoms = datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("logseq.task","deadline","logseq.task/deadline",-214956044));
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(e),new cljs.core.Keyword("db","valueType","db/valueType",1827971944)], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(e),new cljs.core.Keyword("block","schema","block/schema",-1756575216),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword("block","schema","block/schema",-1756575216).cljs$core$IFn$_invoke$arity$1(e),new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"datetime","datetime",494675702))], null)], null),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (d){
var temp__5802__auto__ = new cljs.core.Keyword("block","journal-day","block/journal-day",-145748366).cljs$core$IFn$_invoke$arity$1((function (){var G__186561 = db;
var G__186562 = new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186561,G__186562) : datascript.core.entity.call(null,G__186561,G__186562));
})());
if(cljs.core.truth_(temp__5802__auto__)){
var day = temp__5802__auto__;
var v_SINGLEQUOTE_ = cljs_time.coerce.to_long(logseq.common.util.date_time.int__GT_local_date(day));
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("logseq.task","deadline","logseq.task/deadline",-214956044),v_SINGLEQUOTE_], null);
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("logseq.task","deadline","logseq.task/deadline",-214956044)], null);
}
}),datoms));
} else {
return null;
}
});
frontend.worker.db.migrate.remove_block_format_from_db_BANG_ = (function frontend$worker$db$migrate$remove_block_format_from_db_BANG_(conn){
var db = cljs.core.deref(conn);
if(cljs.core.truth_((logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(db) : logseq.db.db_based_graph_QMARK_.call(null,db)))){
var datoms = datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
var tx_data = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (d){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("block","format","block/format",-1212045901)], null);
}),datoms);
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,tx_data,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"db-migrate?","db-migrate?",-1274296762),true], null));

var G__186563 = conn;
var G__186564 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"schema","schema",-1582001791).cljs$core$IFn$_invoke$arity$1(db),new cljs.core.Keyword("block","format","block/format",-1212045901));
return (datascript.core.reset_schema_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.reset_schema_BANG_.cljs$core$IFn$_invoke$arity$2(G__186563,G__186564) : datascript.core.reset_schema_BANG_.call(null,G__186563,G__186564));
} else {
return null;
}
});
frontend.worker.db.migrate.remove_duplicated_contents_page = (function frontend$worker$db$migrate$remove_duplicated_contents_page(conn,_search_db){
var db = cljs.core.deref(conn);
if(cljs.core.truth_((logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(db) : logseq.db.db_based_graph_QMARK_.call(null,db)))){
var duplicated_contents_pages = cljs.core.rest(cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(cljs.core.second,(function (){var G__186565 = new cljs.core.PersistentVector(null, 9, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Symbol(null,"?created-at","?created-at",902546172,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","title","block/title",710445684),"Contents"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Symbol(null,"?t","?t",1786819229,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?t","?t",1786819229,null),new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160),true], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","created-at","block/created-at",1440015),new cljs.core.Symbol(null,"?created-at","?created-at",902546172,null)], null)], null);
var G__186566 = db;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$2 ? datascript.core.q.cljs$core$IFn$_invoke$arity$2(G__186565,G__186566) : datascript.core.q.call(null,G__186565,G__186566));
})()));
if(cljs.core.seq(duplicated_contents_pages)){
var tx_data_186730 = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__186567){
var vec__186568 = p__186567;
var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186568,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186568,(1),null);
var p = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,e) : datascript.core.entity.call(null,db,e));
var blocks = new cljs.core.Keyword("block","_page","block/_page",1150043350).cljs$core$IFn$_invoke$arity$1(p);
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (b){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(b)], null);
}),blocks),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),e], null));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([duplicated_contents_pages], 0));
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,tx_data_186730,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"db-migrate?","db-migrate?",-1274296762),true], null));
} else {
}

return cljs.core.PersistentVector.EMPTY;
} else {
return null;
}
});
frontend.worker.db.migrate.deprecate_logseq_user_ns = (function frontend$worker$db$migrate$deprecate_logseq_user_ns(conn,_search_db){
var db = cljs.core.deref(conn);
if(cljs.core.truth_((logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(db) : logseq.db.db_based_graph_QMARK_.call(null,db)))){
var db_ids = (function (){var G__186571 = new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"where","where",-2044795965),cljs.core.list(new cljs.core.Symbol(null,"or","or",1876275696,null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("logseq.user","name","logseq.user/name",1027550059)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("logseq.user","email","logseq.user/email",-1546440124)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("logseq.user","avatar","logseq.user/avatar",1822711575)], null))], null);
var G__186572 = db;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$2 ? datascript.core.q.cljs$core$IFn$_invoke$arity$2(G__186571,G__186572) : datascript.core.q.call(null,G__186571,G__186572));
})();
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),new cljs.core.Keyword("logseq.user","name","logseq.user/name",1027550059)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),new cljs.core.Keyword("logseq.user","email","logseq.user/email",-1546440124)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),new cljs.core.Keyword("logseq.user","avatar","logseq.user/avatar",1822711575)], null)], null),cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (e){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),e,new cljs.core.Keyword("logseq.user","name","logseq.user/name",1027550059)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),e,new cljs.core.Keyword("logseq.user","email","logseq.user/email",-1546440124)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),e,new cljs.core.Keyword("logseq.user","avatar","logseq.user/avatar",1822711575)], null)], null);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([db_ids], 0)));
} else {
return null;
}
});
frontend.worker.db.migrate.update_view_filter = (function frontend$worker$db$migrate$update_view_filter(conn,_search_db){
var db = cljs.core.deref(conn);
if(cljs.core.truth_((logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(db) : logseq.db.db_based_graph_QMARK_.call(null,db)))){
var ident = new cljs.core.Keyword("logseq.property.table","filters","logseq.property.table/filters",-1702393633);
var property = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,ident) : datascript.core.entity.call(null,db,ident));
var property_tx = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404),new cljs.core.Keyword(null,"map","map",1371690461)], null);
var data_tx = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (d){
var v = new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(v,new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837))){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),ident], null)], null);
} else {
if(cljs.core.map_QMARK_(v)){
return null;
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),ident], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),ident,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"or?","or?",-1226532173),false,new cljs.core.Keyword(null,"filters","filters",974726919),new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d)], null)], null)], null);

}
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),ident)], 0));
return cljs.core.cons(property_tx,data_tx);
} else {
return null;
}
});
frontend.worker.db.migrate.schema__GT_qualified_property_keyword = (function frontend$worker$db$migrate$schema__GT_qualified_property_keyword(prop_schema){
return cljs.core.reduce_kv((function (r,k,v){
if(cljs.core.qualified_keyword_QMARK_(k)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(r,k,v);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k,new cljs.core.Keyword(null,"cardinality","cardinality",-104971109))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(r,new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659),v);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k,new cljs.core.Keyword(null,"classes","classes",2037804510))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(r,new cljs.core.Keyword("logseq.property","classes","logseq.property/classes",913750486),v);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k,new cljs.core.Keyword(null,"position","position",-2011731912))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(r,new cljs.core.Keyword("logseq.property","ui-position","logseq.property/ui-position",1869200864),v);
} else {
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(r,cljs.core.keyword.cljs$core$IFn$_invoke$arity$2("logseq.property",k),v);

}
}
}
}
}),cljs.core.PersistentArrayMap.EMPTY,prop_schema);
});
frontend.worker.db.migrate.remove_block_schema = (function frontend$worker$db$migrate$remove_block_schema(conn,_search_db){
var db = cljs.core.deref(conn);
var schema = new cljs.core.Keyword(null,"schema","schema",-1582001791).cljs$core$IFn$_invoke$arity$1(db);
if(cljs.core.truth_((logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(db) : logseq.db.db_based_graph_QMARK_.call(null,db)))){
var db_ids_186731 = (function (){var G__186573 = new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","schema","block/schema",-1756575216)], null)], null);
var G__186574 = db;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$2 ? datascript.core.q.cljs$core$IFn$_invoke$arity$2(G__186573,G__186574) : datascript.core.q.call(null,G__186573,G__186574));
})();
var tx_data_186732 = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (eid){
var entity = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,eid) : datascript.core.entity.call(null,db,eid));
var schema__$1 = new cljs.core.Keyword("block","schema","block/schema",-1756575216).cljs$core$IFn$_invoke$arity$1(entity);
var schema_properties = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(frontend.worker.db.migrate.schema__GT_qualified_property_keyword(schema__$1),new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659));
var hidden_page_QMARK_ = cljs.core.contains_QMARK_(cljs.core.PersistentHashSet.createAsIfByAssoc([logseq.common.config.favorites_page_name,logseq.common.config.views_page_name]),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(entity));
var m = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(schema_properties,new cljs.core.Keyword("db","id","db/id",-1388397098),eid);
var m_SINGLEQUOTE_ = ((hidden_page_QMARK_)?cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword("logseq.property","hide?","logseq.property/hide?",68365746),true),new cljs.core.Keyword("logseq.property","public?","logseq.property/public?",1843085149)):m);
return cljs.core.concat.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [m_SINGLEQUOTE_,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),eid,new cljs.core.Keyword("block","schema","block/schema",-1756575216)], null)], null));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([db_ids_186731], 0));
var tx_data_SINGLEQUOTE__186733 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(tx_data_186732,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),new cljs.core.Keyword("block","schema","block/schema",-1756575216)], null)], null));
var G__186575_186734 = conn;
var G__186576_186735 = tx_data_SINGLEQUOTE__186733;
var G__186577_186736 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"db-migrate?","db-migrate?",-1274296762),true], null);
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(G__186575_186734,G__186576_186735,G__186577_186736) : datascript.core.transact_BANG_.call(null,G__186575_186734,G__186576_186735,G__186577_186736));
} else {
}

var G__186578_186737 = conn;
var G__186579_186738 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(schema,new cljs.core.Keyword("block","schema","block/schema",-1756575216));
(datascript.core.reset_schema_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.reset_schema_BANG_.cljs$core$IFn$_invoke$arity$2(G__186578_186737,G__186579_186738) : datascript.core.reset_schema_BANG_.call(null,G__186578_186737,G__186579_186738));

return cljs.core.PersistentVector.EMPTY;
});
frontend.worker.db.migrate.add_view_icons = (function frontend$worker$db$migrate$add_view_icons(_conn,_search_db){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword("logseq.property.view","type.table","logseq.property.view/type.table",194254240),new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"tabler-icon","tabler-icon",945975358),new cljs.core.Keyword(null,"id","id",-1388402092),"table"], null)], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword("logseq.property.view","type.list","logseq.property.view/type.list",-1164828502),new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"tabler-icon","tabler-icon",945975358),new cljs.core.Keyword(null,"id","id",-1388402092),"list"], null)], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword("logseq.property.view","type.gallery","logseq.property.view/type.gallery",150605112),new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"tabler-icon","tabler-icon",945975358),new cljs.core.Keyword(null,"id","id",-1388402092),"layout-grid"], null)], null)], null);
});
frontend.worker.db.migrate.migrate_views = (function frontend$worker$db$migrate$migrate_views(conn,_search_db){
var db = cljs.core.deref(conn);
var tags = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (d){
var G__186580 = db;
var G__186581 = new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186580,G__186581) : datascript.core.entity.call(null,G__186580,G__186581));
}),datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Tag","logseq.class/Tag",-538902083)));
var properties = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (d){
var G__186582 = db;
var G__186583 = new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186582,G__186583) : datascript.core.entity.call(null,G__186582,G__186583));
}),datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Property","logseq.class/Property",1038767048)));
var tx_data = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (e){
var id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(e);
var ks = new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.table","sorting","logseq.property.table/sorting",208102594),new cljs.core.Keyword("logseq.property.table","filters","logseq.property.table/filters",-1702393633),new cljs.core.Keyword("logseq.property.view","group-by-property","logseq.property.view/group-by-property",809216236),new cljs.core.Keyword("logseq.property.table","hidden-columns","logseq.property.table/hidden-columns",975057192),new cljs.core.Keyword("logseq.property.table","ordered-columns","logseq.property.table/ordered-columns",1485587100),new cljs.core.Keyword("logseq.property.table","sized-columns","logseq.property.table/sized-columns",-1675510555),new cljs.core.Keyword("logseq.property.table","pinned-columns","logseq.property.table/pinned-columns",267375138),new cljs.core.Keyword("logseq.property.view","type","logseq.property.view/type",218237607)], null);
var view_properties = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (k){
var temp__5804__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2((function (){var G__186584 = db;
var G__186585 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [k], null);
var G__186586 = id;
return (datascript.core.pull.cljs$core$IFn$_invoke$arity$3 ? datascript.core.pull.cljs$core$IFn$_invoke$arity$3(G__186584,G__186585,G__186586) : datascript.core.pull.call(null,G__186584,G__186585,G__186586));
})(),k);
if(cljs.core.truth_(temp__5804__auto__)){
var v = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,v], null);
} else {
return null;
}
}),ks));
if(cljs.core.seq(view_properties)){
var view_page_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(logseq.db.get_page(db,logseq.common.config.views_page_name));
var _ = (((view_page_id == null))?(function(){throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("View page not exists",cljs.core.PersistentArrayMap.EMPTY)})():null);
var view = (function (){var G__186587 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([view_properties,new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword("logseq.property","view-for","logseq.property/view-for",-36274319),id,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),logseq.common.uuid.gen_uuid.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"migrate-new-block-uuid","migrate-new-block-uuid",-908887761),cljs.core.keyword.cljs$core$IFn$_invoke$arity$2("temp-view-for",clojure.string.replace(cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(e)),"-",""))),new cljs.core.Keyword("block","title","block/title",710445684),"All",new cljs.core.Keyword("block","parent","block/parent",-918309064),view_page_id,new cljs.core.Keyword("block","page","block/page",822314108),view_page_id,new cljs.core.Keyword("block","order","block/order",-1429282437),logseq.db.common.order.gen_key.cljs$core$IFn$_invoke$arity$1(null)], null)], 0));
return (logseq.db.sqlite.util.block_with_timestamps.cljs$core$IFn$_invoke$arity$1 ? logseq.db.sqlite.util.block_with_timestamps.cljs$core$IFn$_invoke$arity$1(G__186587) : logseq.db.sqlite.util.block_with_timestamps.call(null,G__186587));
})();
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (k){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),id,k], null);
}),cljs.core.keys(view_properties)),view);
} else {
return null;
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([logseq.common.util.distinct_by(new cljs.core.Keyword("db","id","db/id",-1388397098),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(tags,properties))], 0));
return tx_data;
});
frontend.worker.db.migrate.add_group_by_property_for_list_views = (function frontend$worker$db$migrate$add_group_by_property_for_list_views(conn,_search_db){
var db = cljs.core.deref(conn);
var list_type_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword("logseq.property.view","type.list","logseq.property.view/type.list",-1164828502)) : datascript.core.entity.call(null,db,new cljs.core.Keyword("logseq.property.view","type.list","logseq.property.view/type.list",-1164828502))));
var list_views = datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("logseq.property.view","type","logseq.property.view/type",218237607),list_type_id);
var block_page_prop_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword("block","page","block/page",822314108)) : datascript.core.entity.call(null,db,new cljs.core.Keyword("block","page","block/page",822314108))));
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (view_datom){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(view_datom),new cljs.core.Keyword("logseq.property.view","group-by-property","logseq.property.view/group-by-property",809216236),block_page_prop_id], null);
}),list_views);
});
frontend.worker.db.migrate.cardinality_one_multiple_values = (function frontend$worker$db$migrate$cardinality_one_multiple_values(conn,_search_db){
var db = cljs.core.deref(conn);
var attrs = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__186588){
var vec__186589 = p__186588;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186589,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186589,(1),null);
if(cljs.core.truth_((function (){var and__5000__auto__ = (k instanceof cljs.core.Keyword);
if(and__5000__auto__){
var and__5000__auto____$1 = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db.cardinality","many","db.cardinality/many",772806234),new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659).cljs$core$IFn$_invoke$arity$1(v));
if(and__5000__auto____$1){
var and__5000__auto____$2 = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db.cardinality","many","db.cardinality/many",772806234),new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,k) : datascript.core.entity.call(null,db,k))));
if(and__5000__auto____$2){
var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.schema.schema,k);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var G__186592 = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,k) : datascript.core.entity.call(null,db,k));
return (logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1(G__186592) : logseq.db.property_QMARK_.call(null,G__186592));
}
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return k;
} else {
return null;
}
}),new cljs.core.Keyword(null,"schema","schema",-1582001791).cljs$core$IFn$_invoke$arity$1(db));
var block_ids = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"e","e",1381269198),datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)));
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (id){
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (attr){
var datoms = datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073),id,attr);
if((cljs.core.count(datoms) > (1))){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (datom){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(datom),new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(datom),new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(datom)], null);
}),cljs.core.butlast(datoms));
} else {
return null;
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([attrs], 0));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([block_ids], 0)));
});
frontend.worker.db.migrate.rename_repeated_properties = (function frontend$worker$db$migrate$rename_repeated_properties(conn,search_db){
if(cljs.core.truth_((function (){var G__186593 = cljs.core.deref(conn);
return (logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(G__186593) : logseq.db.db_based_graph_QMARK_.call(null,G__186593));
})())){
var closed_values_tx_186739 = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p__186594){
var vec__186595 = p__186594;
var old = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186595,(0),null);
var new$ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186595,(1),null);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((function (){var G__186598 = cljs.core.deref(conn);
var G__186599 = old;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186598,G__186599) : datascript.core.entity.call(null,G__186598,G__186599));
})()),new cljs.core.Keyword("db","ident","db/ident",-737096),new$], null);
}),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword("logseq.task","recur-unit.minute","logseq.task/recur-unit.minute",818549322),new cljs.core.Keyword("logseq.property.repeat","recur-unit.minute","logseq.property.repeat/recur-unit.minute",-1513655085),new cljs.core.Keyword("logseq.task","recur-unit.hour","logseq.task/recur-unit.hour",-1226242413),new cljs.core.Keyword("logseq.property.repeat","recur-unit.hour","logseq.property.repeat/recur-unit.hour",1438884954),new cljs.core.Keyword("logseq.task","recur-unit.day","logseq.task/recur-unit.day",-1468582935),new cljs.core.Keyword("logseq.property.repeat","recur-unit.day","logseq.property.repeat/recur-unit.day",392417858),new cljs.core.Keyword("logseq.task","recur-unit.week","logseq.task/recur-unit.week",-334121672),new cljs.core.Keyword("logseq.property.repeat","recur-unit.week","logseq.property.repeat/recur-unit.week",2130924449),new cljs.core.Keyword("logseq.task","recur-unit.month","logseq.task/recur-unit.month",-379198670),new cljs.core.Keyword("logseq.property.repeat","recur-unit.month","logseq.property.repeat/recur-unit.month",-2073393797),new cljs.core.Keyword("logseq.task","recur-unit.year","logseq.task/recur-unit.year",947032747),new cljs.core.Keyword("logseq.property.repeat","recur-unit.year","logseq.property.repeat/recur-unit.year",-1520438524)], null));
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,closed_values_tx_186739,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"db-migrate?","db-migrate?",-1274296762),true], null));
} else {
}

return frontend.worker.db.migrate.rename_properties(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword("logseq.task","recur-frequency","logseq.task/recur-frequency",-1629344725),new cljs.core.Keyword("logseq.property.repeat","recur-frequency","logseq.property.repeat/recur-frequency",871615922),new cljs.core.Keyword("logseq.task","recur-unit","logseq.task/recur-unit",-1004921238),new cljs.core.Keyword("logseq.property.repeat","recur-unit","logseq.property.repeat/recur-unit",690306247),new cljs.core.Keyword("logseq.task","repeated?","logseq.task/repeated?",1261059908),new cljs.core.Keyword("logseq.property.repeat","repeated?","logseq.property.repeat/repeated?",1908121789),new cljs.core.Keyword("logseq.task","scheduled-on-property","logseq.task/scheduled-on-property",-1456836078),new cljs.core.Keyword("logseq.property.repeat","temporal-property","logseq.property.repeat/temporal-property",834610784),new cljs.core.Keyword("logseq.task","recur-status-property","logseq.task/recur-status-property",-1443904208),new cljs.core.Keyword("logseq.property.repeat","checked-property","logseq.property.repeat/checked-property",1866365553)], null))(conn,search_db);
});
frontend.worker.db.migrate.rename_task_properties = (function frontend$worker$db$migrate$rename_task_properties(conn,search_db){
if(cljs.core.truth_((function (){var G__186600 = cljs.core.deref(conn);
return (logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(G__186600) : logseq.db.db_based_graph_QMARK_.call(null,G__186600));
})())){
var db_186740 = cljs.core.deref(conn);
var new_idents_186741 = cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword("logseq.task","priority.low","logseq.task/priority.low",-889174524),new cljs.core.Keyword("logseq.task","priority.high","logseq.task/priority.high",-1281235100),new cljs.core.Keyword("logseq.task","priority.urgent","logseq.task/priority.urgent",445881381),new cljs.core.Keyword("logseq.task","priority.medium","logseq.task/priority.medium",-465072950),new cljs.core.Keyword("logseq.task","status.doing","logseq.task/status.doing",-552479476),new cljs.core.Keyword("logseq.task","status.in-review","logseq.task/status.in-review",35509421),new cljs.core.Keyword("logseq.task","status.done","logseq.task/status.done",143005774),new cljs.core.Keyword("logseq.task","status.canceled","logseq.task/status.canceled",-1217743890),new cljs.core.Keyword("logseq.task","status.todo","logseq.task/status.todo",-1776192049),new cljs.core.Keyword("logseq.task","status.backlog","logseq.task/status.backlog",1797517405)],[new cljs.core.Keyword("logseq.property","priority.low","logseq.property/priority.low",2107453748),new cljs.core.Keyword("logseq.property","priority.high","logseq.property/priority.high",567227668),new cljs.core.Keyword("logseq.property","priority.urgent","logseq.property/priority.urgent",-1996434667),new cljs.core.Keyword("logseq.property","priority.medium","logseq.property/priority.medium",-1829322278),new cljs.core.Keyword("logseq.property","status.doing","logseq.property/status.doing",1840122908),new cljs.core.Keyword("logseq.property","status.in-review","logseq.property/status.in-review",-1870001443),new cljs.core.Keyword("logseq.property","status.done","logseq.property/status.done",-1827582082),new cljs.core.Keyword("logseq.property","status.canceled","logseq.property/status.canceled",752643262),new cljs.core.Keyword("logseq.property","status.todo","logseq.property/status.todo",-1615585377),new cljs.core.Keyword("logseq.property","status.backlog","logseq.property/status.backlog",-72333491)]);
var closed_values_tx_186742 = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p__186601){
var vec__186602 = p__186601;
var old = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186602,(0),null);
var new$ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186602,(1),null);
var e_new = (function (){var G__186605 = cljs.core.deref(conn);
var G__186606 = new$;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186605,G__186606) : datascript.core.entity.call(null,G__186605,G__186606));
})();
var e_old = (function (){var G__186607 = cljs.core.deref(conn);
var G__186608 = old;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186607,G__186608) : datascript.core.entity.call(null,G__186607,G__186608));
})();
if(cljs.core.truth_(e_new)){
if(cljs.core.truth_(e_old)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(e_old)], null);
} else {
return null;
}
} else {
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((function (){var G__186609 = cljs.core.deref(conn);
var G__186610 = old;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186609,G__186610) : datascript.core.entity.call(null,G__186609,G__186610));
})()),new cljs.core.Keyword("db","ident","db/ident",-737096),new$], null);
}
}),new_idents_186741);
var filters_tx_186743 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (d){
var filters = new cljs.core.Keyword(null,"filters","filters",974726919).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d));
if(cljs.core.truth_(cljs.core.some((function (item){
return ((cljs.core.vector_QMARK_(item)) && (cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("logseq.task","priority","logseq.task/priority",1714785995),null,new cljs.core.Keyword("logseq.task","status","logseq.task/status",1399171803),null], null), null),cljs.core.first(item))));
}),filters))){
var value = cljs.core.update.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword(null,"filters","filters",974726919),(function (col){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (col__$1,property){
return cljs.core.vec(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (item){
if(((cljs.core.vector_QMARK_(item)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(property,cljs.core.first(item))))){
var vec__186611 = item;
var p = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186611,(0),null);
var o = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186611,(1),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186611,(2),null);
var f = (function (id){
var temp__5804__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(new_idents_186741,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1((function (){var G__186614 = db_186740;
var G__186615 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186614,G__186615) : datascript.core.entity.call(null,G__186614,G__186615));
})()));
if(cljs.core.truth_(temp__5804__auto__)){
var new_ident = temp__5804__auto__;
return logseq.common.uuid.gen_uuid.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"db-ident-block-uuid","db-ident-block-uuid",-2020167291),new_ident);
} else {
return null;
}
});
var v_SINGLEQUOTE_ = ((cljs.core.set_QMARK_(v))?(function (){var temp__5804__auto__ = cljs.core.seq(cljs.core.keep.cljs$core$IFn$_invoke$arity$2(f,v));
if(temp__5804__auto__){
var v_SINGLEQUOTE_ = temp__5804__auto__;
return cljs.core.set(v_SINGLEQUOTE_);
} else {
return null;
}
})():f(v));
if(cljs.core.truth_(v_SINGLEQUOTE_)){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [p,o,v_SINGLEQUOTE_], null);
} else {
return null;
}
} else {
return item;
}
}),col__$1));
}),col,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.task","status","logseq.task/status",1399171803),new cljs.core.Keyword("logseq.task","priority","logseq.task/priority",1714785995)], null));
}));
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("logseq.property.table","filters","logseq.property.table/filters",-1702393633),value], null);
} else {
return null;
}
}),datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db_186740,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("logseq.property.table","filters","logseq.property.table/filters",-1702393633)));
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(closed_values_tx_186742,filters_tx_186743),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"db-migrate?","db-migrate?",-1274296762),true], null));
} else {
}

return frontend.worker.db.migrate.rename_properties(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword("logseq.task","status","logseq.task/status",1399171803),new cljs.core.Keyword("logseq.property","status","logseq.property/status",-907216853),new cljs.core.Keyword("logseq.task","priority","logseq.task/priority",1714785995),new cljs.core.Keyword("logseq.property","priority","logseq.property/priority",239228411),new cljs.core.Keyword("logseq.task","deadline","logseq.task/deadline",-214956044),new cljs.core.Keyword("logseq.property","deadline","logseq.property/deadline",1685901604),new cljs.core.Keyword("logseq.task","scheduled","logseq.task/scheduled",-793735425),new cljs.core.Keyword("logseq.property","scheduled","logseq.property/scheduled",1644520943)], null))(conn,search_db);
});
frontend.worker.db.migrate.empty_placeholder_add_block_uuid = (function frontend$worker$db$migrate$empty_placeholder_add_block_uuid(_conn,_search_db){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),logseq.common.uuid.gen_uuid.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"builtin-block-uuid","builtin-block-uuid",-652923992),new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837))], null)], null);
});
/**
 * A vec of tuples defining datascript migrations. Each tuple consists of the
 * schema version integer and a migration map. A migration map can have keys of :properties, :classes
 * and :fix.
 */
frontend.worker.db.migrate.schema_version__GT_updates = cljs.core.PersistentVector.fromArray([new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(3),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","table-sorting","logseq.property/table-sorting",-1693683210),new cljs.core.Keyword("logseq.property","table-filters","logseq.property/table-filters",1056161803),new cljs.core.Keyword("logseq.property","table-hidden-columns","logseq.property/table-hidden-columns",-840389376),new cljs.core.Keyword("logseq.property","table-ordered-columns","logseq.property/table-ordered-columns",-726575583)], null),new cljs.core.Keyword(null,"classes","classes",2037804510),cljs.core.PersistentVector.EMPTY], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(4),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fix","fix",-1031773329),(function (conn,_search_db){
var pages = datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(conn),new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","name","block/name",1619760316));
var tx_data = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (d){
var entity = (function (){var G__186616 = cljs.core.deref(conn);
var G__186617 = new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186616,G__186617) : datascript.core.entity.call(null,G__186616,G__186617));
})();
if(cljs.core.truth_(new cljs.core.Keyword("block","type","block/type",1537584409).cljs$core$IFn$_invoke$arity$1(entity))){
return null;
} else {
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("block","type","block/type",1537584409),"page"], null);
}
}),pages);
return tx_data;
})], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(5),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","view-for","logseq.property/view-for",-36274319)], null),new cljs.core.Keyword(null,"classes","classes",2037804510),cljs.core.PersistentVector.EMPTY], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(6),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.asset","remote-metadata","logseq.property.asset/remote-metadata",-990750469)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(7),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.replace_original_name_content_with_title], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(8),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.replace_object_and_page_type_with_node], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(9),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.update_task_ident], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(10),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.update_table_properties], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(11),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.property_checkbox_type_non_ref], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(12),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.update_block_type_many__GT_one], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(13),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"classes","classes",2037804510),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.class","Journal","logseq.class/Journal",1979741081)], null),new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.journal","title-format","logseq.property.journal/title-format",-1536497954)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(14),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509)], null),new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.deprecate_class_parent], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(15),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.class","properties","logseq.property.class/properties",-2123712050)], null),new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.deprecate_class_schema_properties], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(16),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.class","hide-from-node","logseq.property.class/hide-from-node",-26103727)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(17),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.update_db_attrs_type], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(18),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.view","type","logseq.property.view/type",218237607)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(19),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"classes","classes",2037804510),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.class","Query","logseq.class/Query",-232480166)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(20),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.fix_view_for], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(21),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.table","sized-columns","logseq.property.table/sized-columns",-1675510555)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(22),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.fsrs","state","logseq.property.fsrs/state",-1165165087),new cljs.core.Keyword("logseq.property.fsrs","due","logseq.property.fsrs/due",-1089080549)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(23),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.add_card_properties], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(24),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"classes","classes",2037804510),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.class","Cards","logseq.class/Cards",-1284265167)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(25),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","query","logseq.property/query",-97414126)], null),new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.add_query_property_to_query_tag], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(26),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.node","type","logseq.property.node/type",208562436)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(27),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.code","mode","logseq.property.code/mode",-166412608)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(28),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.rename_properties(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.property.node","type","logseq.property.node/type",208562436),new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189)], null))], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(29),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.code","lang","logseq.property.code/lang",-857897165)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["29.1",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.add_card_view], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["29.2",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.rename_card_view_to_gallery_view], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(30),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"classes","classes",2037804510),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.class","Asset","logseq.class/Asset",-797502970)], null),new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.asset","type","logseq.property.asset/type",-1142083098),new cljs.core.Keyword("logseq.property.asset","size","logseq.property.asset/size",-116786219),new cljs.core.Keyword("logseq.property.asset","checksum","logseq.property.asset/checksum",-1011416979)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(31),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","asset","logseq.property/asset",876856790)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(32),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.asset","last-visit-page","logseq.property.asset/last-visit-page",2107803535)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(33),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.pdf","hl-image","logseq.property.pdf/hl-image",137767009)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(34),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.asset","resize-metadata","logseq.property.asset/resize-metadata",-1297523055)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(37),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"classes","classes",2037804510),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.class","Code-block","logseq.class/Code-block",1454986641),new cljs.core.Keyword("logseq.class","Quote-block","logseq.class/Quote-block",-1176166617),new cljs.core.Keyword("logseq.class","Math-block","logseq.class/Math-block",-2038963121)], null),new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189),new cljs.core.Keyword("logseq.property.code","lang","logseq.property.code/lang",-857897165)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(38),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.add_tags_for_typed_display_blocks], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(40),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"classes","classes",2037804510),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.class","pdf-annotation","logseq.class/pdf-annotation",-324183757)], null),new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","ls-type","logseq.property/ls-type",326979345),new cljs.core.Keyword("logseq.property","hl-color","logseq.property/hl-color",-2137269147),new cljs.core.Keyword("logseq.property","asset","logseq.property/asset",876856790),new cljs.core.Keyword("logseq.property.pdf","hl-page","logseq.property.pdf/hl-page",-753284596),new cljs.core.Keyword("logseq.property.pdf","hl-value","logseq.property.pdf/hl-value",545829402),new cljs.core.Keyword("logseq.property","hl-type","logseq.property/hl-type",2083022380),new cljs.core.Keyword("logseq.property.pdf","hl-image","logseq.property.pdf/hl-image",137767009)], null),new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.add_pdf_annotation_class], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(41),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.rename_classes(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.class","pdf-annotation","logseq.class/pdf-annotation",-324183757),new cljs.core.Keyword("logseq.class","Pdf-annotation","logseq.class/Pdf-annotation",-504959620)], null))], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(42),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.rename_properties(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("logseq.property","hl-color","logseq.property/hl-color",-2137269147),new cljs.core.Keyword("logseq.property.pdf","hl-color","logseq.property.pdf/hl-color",-674793887),new cljs.core.Keyword("logseq.property","hl-type","logseq.property/hl-type",2083022380),new cljs.core.Keyword("logseq.property.pdf","hl-type","logseq.property.pdf/hl-type",-998437832)], null))], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(43),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","hide-empty-value","logseq.property/hide-empty-value",2062325899)], null),new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.set_hide_empty_value], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(44),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.update_hl_color_and_page], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(45),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.store_url_value_in_block_title], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(46),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentVector(null, 16, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.attribute","kv-value","logseq.property.attribute/kv-value",-664182452),new cljs.core.Keyword("block","type","block/type",1537584409),new cljs.core.Keyword("block","schema","block/schema",-1756575216),new cljs.core.Keyword("block","parent","block/parent",-918309064),new cljs.core.Keyword("block","order","block/order",-1429282437),new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991),new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Keyword("block","refs","block/refs",-1214495349),new cljs.core.Keyword("block","path-refs","block/path-refs",-2109181352),new cljs.core.Keyword("block","link","block/link",-1872399993),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("block","closed-value-property","block/closed-value-property",1157792813),new cljs.core.Keyword("block","created-at","block/created-at",1440015),new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551),new cljs.core.Keyword("logseq.property.attribute","property-classes","logseq.property.attribute/property-classes",-1215949888),new cljs.core.Keyword("logseq.property.attribute","property-value-content","logseq.property.attribute/property-value-content",-41642589)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(47),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.replace_hidden_type_with_schema], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(48),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","default-value","logseq.property/default-value",-892079662),new cljs.core.Keyword("logseq.property","scalar-default-value","logseq.property/scalar-default-value",1595723014)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(49),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.replace_special_id_ref_with_id_ref], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(50),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.user","name","logseq.property.user/name",-1360026016),new cljs.core.Keyword("logseq.property.user","email","logseq.property.user/email",-1655206063),new cljs.core.Keyword("logseq.property.user","avatar","logseq.property.user/avatar",-416548858)], null),new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.deprecate_logseq_user_ns], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(51),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"classes","classes",2037804510),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.class","Property","logseq.class/Property",1038767048),new cljs.core.Keyword("logseq.class","Tag","logseq.class/Tag",-538902083),new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329),new cljs.core.Keyword("logseq.class","Whiteboard","logseq.class/Whiteboard",1013698452)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(52),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.replace_block_type_with_tags], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(53),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.task","scheduled","logseq.task/scheduled",-793735425),new cljs.core.Keyword("logseq.task","recur-frequency","logseq.task/recur-frequency",-1629344725),new cljs.core.Keyword("logseq.task","recur-unit","logseq.task/recur-unit",-1004921238),new cljs.core.Keyword("logseq.task","repeated?","logseq.task/repeated?",1261059908),new cljs.core.Keyword("logseq.task","scheduled-on-property","logseq.task/scheduled-on-property",-1456836078),new cljs.core.Keyword("logseq.task","recur-status-property","logseq.task/recur-status-property",-1443904208)], null),new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.add_scheduled_to_task], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(54),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","choice-checkbox-state","logseq.property/choice-checkbox-state",-1272422863),new cljs.core.Keyword("logseq.property","checkbox-display-properties","logseq.property/checkbox-display-properties",-321532569)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(55),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.update_deadline_to_datetime], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(56),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","enable-history?","logseq.property/enable-history?",-805859602),new cljs.core.Keyword("logseq.property.history","block","logseq.property.history/block",114255416),new cljs.core.Keyword("logseq.property.history","property","logseq.property.history/property",1600409082),new cljs.core.Keyword("logseq.property.history","ref-value","logseq.property.history/ref-value",-513136037),new cljs.core.Keyword("logseq.property.history","scalar-value","logseq.property.history/scalar-value",239337775)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(58),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.remove_duplicated_contents_page], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(59),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","created-by","logseq.property/created-by",1367295595)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(60),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.rename_properties(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.property","public","logseq.property/public",-1705332765),new cljs.core.Keyword("logseq.property","publishing-public?","logseq.property/publishing-public?",-1094657939)], null))], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(61),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404),new cljs.core.Keyword("logseq.property","hide?","logseq.property/hide?",68365746),new cljs.core.Keyword("logseq.property","public?","logseq.property/public?",1843085149),new cljs.core.Keyword("logseq.property","view-context","logseq.property/view-context",-1547395828),new cljs.core.Keyword("logseq.property","ui-position","logseq.property/ui-position",1869200864)], null),new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.rename_properties(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("property","schema.classes","property/schema.classes",1252790488),new cljs.core.Keyword("logseq.property","classes","logseq.property/classes",913750486),new cljs.core.Keyword("property.value","content","property.value/content",864202864),new cljs.core.Keyword("logseq.property","value","logseq.property/value",1396524865)], null))], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(62),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.remove_block_schema], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(63),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.table","pinned-columns","logseq.property.table/pinned-columns",267375138)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(64),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.update_view_filter], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["64.1",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.view","group-by-property","logseq.property.view/group-by-property",809216236)], null),new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.add_view_icons], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["64.2",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.view","feature-type","logseq.property.view/feature-type",-939141871)], null),new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.migrate_views], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["64.3",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","used-template","logseq.property/used-template",-980369906),new cljs.core.Keyword("logseq.property","template-applied-to","logseq.property/template-applied-to",-429124322)], null),new cljs.core.Keyword(null,"classes","classes",2037804510),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.class","Template","logseq.class/Template",1720854846)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["64.4",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","created-by-ref","logseq.property/created-by-ref",854433908)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["64.5",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.add_group_by_property_for_list_views], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["64.6",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.cardinality_one_multiple_values], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["64.7",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.rename_repeated_properties], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["64.8",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.rename_task_properties], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["64.9",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fix","fix",-1031773329),frontend.worker.db.migrate.empty_placeholder_add_block_uuid], null)], null)], true);
var vec__186618_186744 = cljs.core.last(cljs.core.sort.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.comp.cljs$core$IFn$_invoke$arity$3(cljs.core.juxt.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"major","major",-27376078),new cljs.core.Keyword(null,"minor","minor",-608536071)),logseq.db.frontend.schema.parse_schema_version,cljs.core.first),frontend.worker.db.migrate.schema_version__GT_updates)));
var major_186745 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186618_186744,(0),null);
var minor_186746 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186618_186744,(1),null);
var max_schema_version_186747 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"major","major",-27376078),major_186745,new cljs.core.Keyword(null,"minor","minor",-608536071),minor_186746], null);
var compare_result_186748 = logseq.db.frontend.schema.compare_schema_version(logseq.db.frontend.schema.version,max_schema_version_186747);
if(((0) >= compare_result_186748)){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [logseq.db.frontend.schema.version,max_schema_version_186747], null)),"\n","(>= 0 compare-result)"].join('')));
}

if((compare_result_186748 < (0))){
console.warn(["Current db schema-version is ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(logseq.db.frontend.schema.version),", max available schema-version is ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(max_schema_version_186747)].join(''));
} else {
}
frontend.worker.db.migrate.ensure_built_in_data_exists_BANG_ = (function frontend$worker$db$migrate$ensure_built_in_data_exists_BANG_(conn){
var _STAR_uuids = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var data = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (data){
if(cljs.core.map_QMARK_(data)){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("logseq.kv",(function (){var G__186621 = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(data);
if((G__186621 == null)){
return null;
} else {
return cljs.core.namespace(G__186621);
}
})())){
return null;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(data),"Contents")){
return null;
} else {
if(cljs.core.truth_(new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(data))){
var temp__5802__auto__ = (function (){var G__186622 = cljs.core.deref(conn);
var G__186623 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file","path","file/path",-191335748),new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(data)], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186622,G__186623) : datascript.core.entity.call(null,G__186622,G__186623));
})();
if(cljs.core.truth_(temp__5802__auto__)){
var block = temp__5802__auto__;
var existing_data = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,block),new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block));
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([data,existing_data], 0));
} else {
return data;
}
} else {
if(cljs.core.truth_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(data))){
var temp__5802__auto__ = (function (){var G__186624 = cljs.core.deref(conn);
var G__186625 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(data)], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186624,G__186625) : datascript.core.entity.call(null,G__186624,G__186625));
})();
if(cljs.core.truth_(temp__5802__auto__)){
var block = temp__5802__auto__;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(_STAR_uuids,cljs.core.assoc,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(data),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block));

var existing_data = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,block),new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block));
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (data__$1,p__186626){
var vec__186627 = p__186626;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186627,(0),null);
var existing_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186627,(1),null);
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(data__$1,k,(function (v){
if(((cljs.core.vector_QMARK_(v)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.first(v))))){
return v;
} else {
if(((cljs.core.coll_QMARK_(v)) && ((!(cljs.core.map_QMARK_(v)))))){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(v,((cljs.core.coll_QMARK_(existing_value))?existing_value:new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [existing_value], null)));
} else {
if((!((existing_value == null)))){
return existing_value;
} else {
return v;
}

}
}
}));
}),data,existing_data);
} else {
return data;
}
} else {
return data;

}
}
}
}
} else {
return data;
}
}),logseq.db.sqlite.create_graph.build_db_initial_data(""));
var data_SINGLEQUOTE_ = clojure.walk.prewalk((function (f){
if(cljs.core.truth_((function (){var and__5000__auto__ = datascript.impl.entity.entity_QMARK_(f);
if(and__5000__auto__){
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(f);
} else {
return and__5000__auto__;
}
})())){
var or__5002__auto__ = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(f);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(f)], null);
}
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.vector_QMARK_(f);
if(and__5000__auto__){
var and__5000__auto____$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.first(f));
if(and__5000__auto____$1){
var G__186631 = cljs.core.second(f);
var fexpr__186630 = cljs.core.deref(_STAR_uuids);
return (fexpr__186630.cljs$core$IFn$_invoke$arity$1 ? fexpr__186630.cljs$core$IFn$_invoke$arity$1(G__186631) : fexpr__186630.call(null,G__186631));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),(function (){var G__186633 = cljs.core.second(f);
var fexpr__186632 = cljs.core.deref(_STAR_uuids);
return (fexpr__186632.cljs$core$IFn$_invoke$arity$1 ? fexpr__186632.cljs$core$IFn$_invoke$arity$1(G__186633) : fexpr__186632.call(null,G__186633));
})()], null);
} else {
return f;

}
}
}),data);
var G__186634 = conn;
var G__186635 = data_SINGLEQUOTE_;
var G__186636 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"fix-db?","fix-db?",1698780521),true,new cljs.core.Keyword(null,"db-migrate?","db-migrate?",-1274296762),true], null);
return (datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(G__186634,G__186635,G__186636) : datascript.core.transact_BANG_.call(null,G__186634,G__186635,G__186636));
});
frontend.worker.db.migrate.upgrade_version_BANG_ = (function frontend$worker$db$migrate$upgrade_version_BANG_(conn,search_db,db_based_QMARK_,version,p__186638){
var map__186639 = p__186638;
var map__186639__$1 = cljs.core.__destructure_map(map__186639);
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186639__$1,new cljs.core.Keyword(null,"properties","properties",685819552));
var classes = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186639__$1,new cljs.core.Keyword(null,"classes","classes",2037804510));
var fix = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186639__$1,new cljs.core.Keyword(null,"fix","fix",-1031773329));
var version__$1 = logseq.db.frontend.schema.parse_schema_version(version);
var db = cljs.core.deref(conn);
var new_properties = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (b){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160),true);
}),logseq.db.sqlite.create_graph.build_properties(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p__186640){
var vec__186641 = p__186640;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186641,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186641,(1),null);
if(cljs.core.truth_((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,k) : datascript.core.entity.call(null,db,k)))){
if(cljs.core.truth_(["DB migration: property already exists ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(k)].join(''))){
return null;
} else {
throw (new Error("Assert failed: (str \"DB migration: property already exists \" k)"));
}
} else {
return null;
}
}),cljs.core.select_keys(logseq.db.frontend.property.built_in_properties,properties)))));
var classes_SINGLEQUOTE_ = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.class","Property","logseq.class/Property",1038767048),new cljs.core.Keyword("logseq.class","Tag","logseq.class/Tag",-538902083),new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329),new cljs.core.Keyword("logseq.class","Journal","logseq.class/Journal",1979741081),new cljs.core.Keyword("logseq.class","Whiteboard","logseq.class/Whiteboard",1013698452)], null),classes));
var new_classes = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (b){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160),true);
}),(function (p1__186637_SHARP_){
return logseq.db.sqlite.create_graph.build_initial_classes_STAR_(p1__186637_SHARP_,cljs.core.zipmap(properties,properties));
})(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p__186644){
var vec__186645 = p__186644;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186645,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186645,(1),null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,k) : datascript.core.entity.call(null,db,k));
}),cljs.core.select_keys(logseq.db.frontend.class$.built_in_classes,classes_SINGLEQUOTE_)))));
var new_class_idents = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (class$){
var temp__5804__auto__ = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(class$);
if(cljs.core.truth_(temp__5804__auto__)){
var db_ident = temp__5804__auto__;
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","ident","db/ident",-737096),db_ident], null);
} else {
return null;
}
}),new_classes);
var fixes = ((cljs.core.fn_QMARK_(fix))?(fix.cljs$core$IFn$_invoke$arity$2 ? fix.cljs$core$IFn$_invoke$arity$2(conn,search_db) : fix.call(null,conn,search_db)):null);
var tx_data = (cljs.core.truth_(db_based_QMARK_)?cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(new_class_idents,new_properties,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new_classes,fixes], 0)):fixes);
var tx_data_SINGLEQUOTE_ = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [logseq.db.sqlite.util.kv(new cljs.core.Keyword("logseq.kv","schema-version","logseq.kv/schema-version",-1467606676),version__$1)], null),tx_data);
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,tx_data_SINGLEQUOTE_,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"db-migrate?","db-migrate?",-1274296762),true], null));

return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["DB schema migrated to",version__$1], 0));
});
frontend.worker.db.migrate.fix_path_refs_BANG_ = (function frontend$worker$db$migrate$fix_path_refs_BANG_(conn){
var data = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (d){
if((!(datascript.impl.entity.entity_QMARK_((function (){var G__186648 = cljs.core.deref(conn);
var G__186649 = new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186648,G__186649) : datascript.core.entity.call(null,G__186648,G__186649));
})())))){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d)], null);
} else {
return null;
}
}),datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(conn),new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","path-refs","block/path-refs",-2109181352)));
if(cljs.core.seq(data)){
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,data,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"fix-db?","fix-db?",1698780521),true,new cljs.core.Keyword(null,"db-migrate?","db-migrate?",-1274296762),true], null));
} else {
return null;
}
});
frontend.worker.db.migrate.fix_missing_title_BANG_ = (function frontend$worker$db$migrate$fix_missing_title_BANG_(conn){
var data = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (d){
var entity = (function (){var G__186650 = cljs.core.deref(conn);
var G__186651 = new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186650,G__186651) : datascript.core.entity.call(null,G__186650,G__186651));
})();
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(cljs.core.truth_(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(entity))?null:new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("block","title","block/title",710445684),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d))], null)),(cljs.core.truth_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(entity))?null:new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),(datascript.core.squuid.cljs$core$IFn$_invoke$arity$0 ? datascript.core.squuid.cljs$core$IFn$_invoke$arity$0() : datascript.core.squuid.call(null))], null))], null);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(conn),new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","name","block/name",1619760316))], 0)));
if(cljs.core.seq(data)){
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,data,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"fix-db?","fix-db?",1698780521),true,new cljs.core.Keyword(null,"db-migrate?","db-migrate?",-1274296762),true], null));
} else {
return null;
}
});
frontend.worker.db.migrate.fix_block_timestamps_BANG_ = (function frontend$worker$db$migrate$fix_block_timestamps_BANG_(conn){
var data = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (d){
var entity = (function (){var G__186652 = cljs.core.deref(conn);
var G__186653 = new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186652,G__186653) : datascript.core.entity.call(null,G__186652,G__186653));
})();
if((((new cljs.core.Keyword("block","created-at","block/created-at",1440015).cljs$core$IFn$_invoke$arity$1(entity) == null)) || ((new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551).cljs$core$IFn$_invoke$arity$1(entity) == null)))){
var G__186654 = cljs.core.select_keys(entity,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","created-at","block/created-at",1440015),new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551)], null));
return (logseq.db.sqlite.util.block_with_timestamps.cljs$core$IFn$_invoke$arity$1 ? logseq.db.sqlite.util.block_with_timestamps.cljs$core$IFn$_invoke$arity$1(G__186654) : logseq.db.sqlite.util.block_with_timestamps.call(null,G__186654));
} else {
return null;
}
}),datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(conn),new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)));
if(cljs.core.seq(data)){
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,data,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"fix-db?","fix-db?",1698780521),true,new cljs.core.Keyword(null,"db-migrate?","db-migrate?",-1274296762),true], null));
} else {
return null;
}
});
frontend.worker.db.migrate.fix_properties_BANG_ = (function frontend$worker$db$migrate$fix_properties_BANG_(conn){
var schema = new cljs.core.Keyword(null,"schema","schema",-1582001791).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(conn));
var wrong_properties = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p__186655){
var vec__186656 = p__186655;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186656,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186656,(1),null);
return ((cljs.core.int_QMARK_(k)) && ((!(cljs.core.qualified_ident_QMARK_(v)))));
}),schema);
var data = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__186659){
var vec__186660 = p__186659;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186660,(0),null);
var _v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186660,(1),null);
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),k,new cljs.core.Keyword("db","valueType","db/valueType",1827971944)], null);
}),wrong_properties);
if(cljs.core.seq(data)){
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,data,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"fix-db?","fix-db?",1698780521),true,new cljs.core.Keyword(null,"db-migrate?","db-migrate?",-1274296762),true], null));

var G__186663 = conn;
var G__186664 = cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc,schema,cljs.core.keys(wrong_properties));
return (datascript.core.reset_schema_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.reset_schema_BANG_.cljs$core$IFn$_invoke$arity$2(G__186663,G__186664) : datascript.core.reset_schema_BANG_.call(null,G__186663,G__186664));
} else {
return null;
}
});
frontend.worker.db.migrate.fix_missing_page_tag_BANG_ = (function frontend$worker$db$migrate$fix_missing_page_tag_BANG_(conn){
var data = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (d){
var entity = (function (){var G__186665 = cljs.core.deref(conn);
var G__186666 = new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186665,G__186666) : datascript.core.entity.call(null,G__186665,G__186666));
})();
if(cljs.core.truth_(new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(entity))){
return null;
} else {
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329)], null);
}
}),datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(conn),new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","name","block/name",1619760316)));
if(cljs.core.seq(data)){
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,data,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"fix-db?","fix-db?",1698780521),true,new cljs.core.Keyword(null,"db-migrate?","db-migrate?",-1274296762),true], null));
} else {
return null;
}
});
/**
 * Migrate 'frontend' datascript schema and data. To add a new migration,
 *   add an entry to schema-version->updates and bump db-schema/version
 */
frontend.worker.db.migrate.migrate = (function frontend$worker$db$migrate$migrate(conn,search_db){
if(cljs.core.truth_((function (){var G__186667 = cljs.core.deref(conn);
return (logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(G__186667) : logseq.db.db_based_graph_QMARK_.call(null,G__186667));
})())){
var db = cljs.core.deref(conn);
var version_in_db = logseq.db.frontend.schema.parse_schema_version((function (){var or__5002__auto__ = new cljs.core.Keyword("kv","value","kv/value",305981670).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword("logseq.kv","schema-version","logseq.kv/schema-version",-1467606676)) : datascript.core.entity.call(null,db,new cljs.core.Keyword("logseq.kv","schema-version","logseq.kv/schema-version",-1467606676))));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})());
var compare_result = logseq.db.frontend.schema.compare_schema_version(logseq.db.frontend.schema.version,version_in_db);
if((compare_result === (0))){
return null;
} else {
if((compare_result < (0))){
var G__186668 = new cljs.core.Keyword(null,"notification","notification",-222338233);
var G__186669 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Your app is using an outdated version that is incompatible with your current graph. Please update your app before editing this graph.",new cljs.core.Keyword(null,"error","error",-978969032),false], null);
return (frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2 ? frontend.worker.util.post_message.cljs$core$IFn$_invoke$arity$2(G__186668,G__186669) : frontend.worker.util.post_message.call(null,G__186668,G__186669));
} else {
if((compare_result > (0))){
try{var db_based_QMARK_ = (function (){var G__186671 = cljs.core.deref(conn);
return (logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(G__186671) : logseq.db.db_based_graph_QMARK_.call(null,G__186671));
})();
var updates = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__186672){
var vec__186673 = p__186672;
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186673,(0),null);
var updates = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186673,(1),null);
var v_STAR_ = logseq.db.frontend.schema.parse_schema_version(v);
if((((logseq.db.frontend.schema.compare_schema_version(version_in_db,v_STAR_) < (0))) && ((!((logseq.db.frontend.schema.compare_schema_version(v_STAR_,logseq.db.frontend.schema.version) > (0))))))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [v,updates], null);
} else {
return null;
}
}),frontend.worker.db.migrate.schema_version__GT_updates);
frontend.worker.db.migrate.fix_path_refs_BANG_(conn);

frontend.worker.db.migrate.fix_missing_title_BANG_(conn);

frontend.worker.db.migrate.remove_block_format_from_db_BANG_(conn);

frontend.worker.db.migrate.fix_properties_BANG_(conn);

frontend.worker.db.migrate.fix_block_timestamps_BANG_(conn);

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["DB schema migrated from",version_in_db], 0));

var seq__186676_186749 = cljs.core.seq(updates);
var chunk__186677_186750 = null;
var count__186678_186751 = (0);
var i__186679_186752 = (0);
while(true){
if((i__186679_186752 < count__186678_186751)){
var vec__186686_186753 = chunk__186677_186750.cljs$core$IIndexed$_nth$arity$2(null,i__186679_186752);
var v_186754 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186686_186753,(0),null);
var m_186755 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186686_186753,(1),null);
frontend.worker.db.migrate.upgrade_version_BANG_(conn,search_db,db_based_QMARK_,v_186754,m_186755);


var G__186756 = seq__186676_186749;
var G__186757 = chunk__186677_186750;
var G__186758 = count__186678_186751;
var G__186759 = (i__186679_186752 + (1));
seq__186676_186749 = G__186756;
chunk__186677_186750 = G__186757;
count__186678_186751 = G__186758;
i__186679_186752 = G__186759;
continue;
} else {
var temp__5804__auto___186760 = cljs.core.seq(seq__186676_186749);
if(temp__5804__auto___186760){
var seq__186676_186761__$1 = temp__5804__auto___186760;
if(cljs.core.chunked_seq_QMARK_(seq__186676_186761__$1)){
var c__5525__auto___186762 = cljs.core.chunk_first(seq__186676_186761__$1);
var G__186763 = cljs.core.chunk_rest(seq__186676_186761__$1);
var G__186764 = c__5525__auto___186762;
var G__186765 = cljs.core.count(c__5525__auto___186762);
var G__186766 = (0);
seq__186676_186749 = G__186763;
chunk__186677_186750 = G__186764;
count__186678_186751 = G__186765;
i__186679_186752 = G__186766;
continue;
} else {
var vec__186689_186767 = cljs.core.first(seq__186676_186761__$1);
var v_186768 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186689_186767,(0),null);
var m_186769 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186689_186767,(1),null);
frontend.worker.db.migrate.upgrade_version_BANG_(conn,search_db,db_based_QMARK_,v_186768,m_186769);


var G__186770 = cljs.core.next(seq__186676_186761__$1);
var G__186771 = null;
var G__186772 = (0);
var G__186773 = (0);
seq__186676_186749 = G__186770;
chunk__186677_186750 = G__186771;
count__186678_186751 = G__186772;
i__186679_186752 = G__186773;
continue;
}
} else {
}
}
break;
}

frontend.worker.db.migrate.ensure_built_in_data_exists_BANG_(conn);

return frontend.worker.db.migrate.fix_missing_page_tag_BANG_(conn);
}catch (e186670){var e = e186670;
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"error","error",-978969032),["DB migration failed to migrate to ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(logseq.db.frontend.schema.version)," from ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(version_in_db),":"].join('')], 0));

console.error(e);

throw e;
}} else {
return null;
}
}
}
} else {
return null;
}
});
frontend.worker.db.migrate.build_invalid_tx = (function frontend$worker$db$migrate$build_invalid_tx(db,entity,eid){
if((logseq.db.frontend.malli_schema.entity_dispatch_key(db,entity) == null)){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),eid], null)], null);
} else {
if(cljs.core.truth_(new cljs.core.Keyword("block","schema","block/schema",-1756575216).cljs$core$IFn$_invoke$arity$1(entity))){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),eid,new cljs.core.Keyword("block","schema","block/schema",-1756575216)], null)], null);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = (new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(entity) == null);
if(and__5000__auto__){
var or__5002__auto__ = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(entity);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword("logseq.property.asset","size","logseq.property.asset/size",-116786219).cljs$core$IFn$_invoke$arity$1(entity);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = new cljs.core.Keyword("logseq.property.asset","type","logseq.property.asset/type",-1142083098).cljs$core$IFn$_invoke$arity$1(entity);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
return new cljs.core.Keyword("logseq.property.asset","checksum","logseq.property.asset/checksum",-1011416979).cljs$core$IFn$_invoke$arity$1(entity);
}
}
}
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),eid], null)], null);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(entity);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("logseq.property.attribute",cljs.core.namespace(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(entity)));
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity)], null)], null);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword("logseq.property.history","property","logseq.property.history/property",1600409082).cljs$core$IFn$_invoke$arity$1(entity);
if(cljs.core.truth_(and__5000__auto__)){
return (new cljs.core.Keyword("logseq.property.history","block","logseq.property.history/block",114255416).cljs$core$IFn$_invoke$arity$1(entity) == null);
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity)], null)], null);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword("db","valueType","db/valueType",1827971944).cljs$core$IFn$_invoke$arity$1(entity);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not((function (){var or__5002__auto__ = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(entity);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659).cljs$core$IFn$_invoke$arity$1(entity);
}
})());
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),eid,new cljs.core.Keyword("db","valueType","db/valueType",1827971944)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),eid,new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659)], null)], null);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","tx-id","block/tx-id",547556161),null], null), null),cljs.core.set(cljs.core.keys(entity)))){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity)], null)], null);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = (function (){var or__5002__auto__ = cljs.core.seq(new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1(entity));
if(or__5002__auto__){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("logseq.property.table","filters","logseq.property.table/filters",-1702393633).cljs$core$IFn$_invoke$arity$1(entity);
}
})();
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not((function (){var or__5002__auto__ = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(entity);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword("block","content","block/content",-161885195).cljs$core$IFn$_invoke$arity$1(entity);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return new cljs.core.Keyword("property.value","content","property.value/content",864202864).cljs$core$IFn$_invoke$arity$1(entity);
}
}
})());
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity)], null)], null);
} else {
if(cljs.core.truth_(new cljs.core.Keyword("logseq.property.node","type","logseq.property.node/type",208562436).cljs$core$IFn$_invoke$arity$1(entity))){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),eid,new cljs.core.Keyword("logseq.property.node","type","logseq.property.node/type",208562436)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),new cljs.core.Keyword("logseq.property.node","type","logseq.property.node/type",208562436)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),eid,new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189),new cljs.core.Keyword("logseq.property.node","type","logseq.property.node/type",208562436).cljs$core$IFn$_invoke$arity$1(entity)], null)], null);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659).cljs$core$IFn$_invoke$arity$1(entity);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not((logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1(entity) : logseq.db.property_QMARK_.call(null,entity)));
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),eid,new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Property","logseq.class/Property",1038767048)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),eid,new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329)], null)], null);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword("logseq.property.asset","type","logseq.property.asset/type",-1142083098).cljs$core$IFn$_invoke$arity$1(entity);
if(cljs.core.truth_(and__5000__auto__)){
return (((new cljs.core.Keyword("logseq.property.asset","checksum","logseq.property.asset/checksum",-1011416979).cljs$core$IFn$_invoke$arity$1(entity) == null)) || ((new cljs.core.Keyword("logseq.property.asset","size","logseq.property.asset/size",-116786219).cljs$core$IFn$_invoke$arity$1(entity) == null)));
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),eid], null)], null);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = (logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(entity) : logseq.db.class_QMARK_.call(null,entity));
if(cljs.core.truth_(and__5000__auto__)){
return (new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(entity) == null);
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity),new cljs.core.Keyword("db","ident","db/ident",-737096),logseq.db.frontend.class$.create_user_class_ident_from_name(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(entity))], null)], null);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(entity);
if(cljs.core.truth_(and__5000__auto__)){
return (new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(entity) == null);
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity),new cljs.core.Keyword("block","title","block/title",710445684),""], null)], null);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = (logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1(entity) : logseq.db.property_QMARK_.call(null,entity));
if(cljs.core.truth_(and__5000__auto__)){
return (new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(entity) == null);
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity),new cljs.core.Keyword("db","ident","db/ident",-737096),logseq.db.frontend.property.create_user_property_ident_from_name.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(entity))], null)], null);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = (logseq.db.internal_page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.internal_page_QMARK_.cljs$core$IFn$_invoke$arity$1(entity) : logseq.db.internal_page_QMARK_.call(null,entity));
if(cljs.core.truth_(and__5000__auto__)){
var or__5002__auto__ = (logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(entity) : logseq.db.class_QMARK_.call(null,entity));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = (logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1(entity) : logseq.db.property_QMARK_.call(null,entity));
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return (logseq.db.journal_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.journal_QMARK_.cljs$core$IFn$_invoke$arity$1(entity) : logseq.db.journal_QMARK_.call(null,entity));
}
}
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329)], null)], null);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(entity);
if(cljs.core.truth_(and__5000__auto__)){
return (!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, ["logseq/config.edn",null,"logseq/custom.css",null,"logseq/config.js",null], null), null),new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(entity))));
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity)], null)], null);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(entity);
if(cljs.core.truth_(and__5000__auto__)){
return (((new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(entity) == null)) && ((new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(entity) == null)));
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity)], null)], null);
} else {
if(cljs.core.truth_(new cljs.core.Keyword("block","properties-order","block/properties-order",-968493873).cljs$core$IFn$_invoke$arity$1(entity))){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity),new cljs.core.Keyword("block","properties-order","block/properties-order",-968493873)], null)], null);
} else {
if(cljs.core.truth_(new cljs.core.Keyword("block","macros","block/macros",650396438).cljs$core$IFn$_invoke$arity$1(entity))){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity),new cljs.core.Keyword("block","macros","block/macros",650396438)], null)], null);
} else {
if(((cljs.core.seq(new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(entity))) && ((!(cljs.core.every_QMARK_(logseq.db.class_QMARK_,new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(entity))))))){
var tags = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(logseq.db.class_QMARK_,new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(entity));
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (tag){
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(tag),new cljs.core.Keyword("db","ident","db/ident",-737096),(function (){var or__5002__auto__ = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(tag);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return logseq.db.frontend.class$.create_user_class_ident_from_name(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(entity));
}
})(),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Tag","logseq.class/Tag",-538902083)], null);
}),tags);
} else {
return null;

}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
});
frontend.worker.db.migrate.fix_invalid_data_BANG_ = (function frontend$worker$db$migrate$fix_invalid_data_BANG_(conn,invalid_entity_ids){
var db = cljs.core.deref(conn);
var tx_data = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (id){
var entity = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,id) : datascript.core.entity.call(null,db,id));
var wrong_choice = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__186692){
var vec__186693 = p__186692;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186693,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186693,(1),null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("block.temp",cljs.core.namespace(k))){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity),k], null);
} else {
var temp__5804__auto__ = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,k) : datascript.core.entity.call(null,db,k));
if(cljs.core.truth_(temp__5804__auto__)){
var property = temp__5804__auto__;
var closed_values = new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(property);
if(cljs.core.seq(closed_values)){
if(((datascript.impl.entity.entity_QMARK_(v)) && ((!(cljs.core.contains_QMARK_(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),closed_values)),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(v))))))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(v)], null);
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity),k], null);
}
} else {
return null;
}
} else {
return null;
}
}
}),cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,entity));
var eid = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity);
var fix = frontend.worker.db.migrate.build_invalid_tx(db,entity,eid);
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(fix,wrong_choice);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([invalid_entity_ids], 0)));
if(cljs.core.seq(tx_data)){
var G__186696 = conn;
var G__186697 = tx_data;
var G__186698 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fix-db?","fix-db?",1698780521),true], null);
return (datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(G__186696,G__186697,G__186698) : datascript.core.transact_BANG_.call(null,G__186696,G__186697,G__186698));
} else {
return null;
}
});
frontend.worker.db.migrate.fix_db_BANG_ = (function frontend$worker$db$migrate$fix_db_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___186774 = arguments.length;
var i__5727__auto___186775 = (0);
while(true){
if((i__5727__auto___186775 < len__5726__auto___186774)){
args__5732__auto__.push((arguments[i__5727__auto___186775]));

var G__186776 = (i__5727__auto___186775 + (1));
i__5727__auto___186775 = G__186776;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.worker.db.migrate.fix_db_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.worker.db.migrate.fix_db_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (conn,p__186701){
var map__186702 = p__186701;
var map__186702__$1 = cljs.core.__destructure_map(map__186702);
var invalid_entity_ids = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186702__$1,new cljs.core.Keyword(null,"invalid-entity-ids","invalid-entity-ids",432707245));
if(cljs.core.truth_((function (){var G__186703 = cljs.core.deref(conn);
return (logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(G__186703) : logseq.db.db_based_graph_QMARK_.call(null,G__186703));
})())){
try{frontend.worker.db.migrate.ensure_built_in_data_exists_BANG_(conn);

frontend.worker.db.migrate.remove_block_format_from_db_BANG_(conn);

frontend.worker.db.migrate.fix_path_refs_BANG_(conn);

frontend.worker.db.migrate.fix_missing_title_BANG_(conn);

frontend.worker.db.migrate.fix_properties_BANG_(conn);

frontend.worker.db.migrate.fix_block_timestamps_BANG_(conn);

frontend.worker.db.migrate.fix_missing_page_tag_BANG_(conn);

var data_186777 = frontend.worker.db.migrate.deprecate_logseq_user_ns(conn,null);
if(cljs.core.seq(data_186777)){
var G__186705_186778 = conn;
var G__186706_186779 = data_186777;
var G__186707_186780 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fix-db?","fix-db?",1698780521),true], null);
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(G__186705_186778,G__186706_186779,G__186707_186780) : datascript.core.transact_BANG_.call(null,G__186705_186778,G__186706_186779,G__186707_186780));
} else {
}

var data1_186781 = frontend.worker.db.migrate.rename_repeated_properties(conn,null);
var data2_186782 = frontend.worker.db.migrate.rename_task_properties(conn,null);
var data_186783 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(data1_186781,data2_186782);
if(cljs.core.seq(data_186783)){
var G__186708_186784 = conn;
var G__186709_186785 = data_186783;
var G__186710_186786 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fix-db?","fix-db?",1698780521),true], null);
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(G__186708_186784,G__186709_186785,G__186710_186786) : datascript.core.transact_BANG_.call(null,G__186708_186784,G__186709_186785,G__186710_186786));
} else {
}

if(cljs.core.seq(invalid_entity_ids)){
return frontend.worker.db.migrate.fix_invalid_data_BANG_(conn,invalid_entity_ids);
} else {
return null;
}
}catch (e186704){var e = e186704;
return console.error(e);
}} else {
return null;
}
}));

(frontend.worker.db.migrate.fix_db_BANG_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.worker.db.migrate.fix_db_BANG_.cljs$lang$applyTo = (function (seq186699){
var G__186700 = cljs.core.first(seq186699);
var seq186699__$1 = cljs.core.next(seq186699);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__186700,seq186699__$1);
}));

frontend.worker.db.migrate.add_addresses_in_kvs_table = (function frontend$worker$db$migrate$add_addresses_in_kvs_table(sqlite_db){
var columns = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,cljs_bean.core.__GT_clj(sqlite_db.exec(({"sql": "SELECT NAME FROM PRAGMA_TABLE_INFO('kvs')", "rowMode": "array"})))));
if(cljs.core.contains_QMARK_(columns,"addresses")){
return null;
} else {
var data = (function (){var G__186711 = sqlite_db.exec(({"sql": "select addr, content from kvs", "rowMode": "array"}));
var G__186711__$1 = (((G__186711 == null))?null:cljs_bean.core.__GT_clj(G__186711));
if((G__186711__$1 == null)){
return null;
} else {
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__186712){
var vec__186713 = p__186712;
var addr = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186713,(0),null);
var content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186713,(1),null);
var content_SINGLEQUOTE_ = logseq.db.sqlite.util.transit_read(content);
var vec__186716 = ((cljs.core.map_QMARK_(content_SINGLEQUOTE_))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(content_SINGLEQUOTE_,new cljs.core.Keyword(null,"addresses","addresses",-559529694)),(function (){var temp__5804__auto__ = new cljs.core.Keyword(null,"addresses","addresses",-559529694).cljs$core$IFn$_invoke$arity$1(content_SINGLEQUOTE_);
if(cljs.core.truth_(temp__5804__auto__)){
var addresses = temp__5804__auto__;
return JSON.stringify(cljs_bean.core.__GT_js(addresses));
} else {
return null;
}
})()], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [content_SINGLEQUOTE_,null], null));
var content_SINGLEQUOTE___$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186716,(0),null);
var addresses = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186716,(1),null);
var content_SINGLEQUOTE___$2 = logseq.db.sqlite.util.transit_write(content_SINGLEQUOTE___$1);
return ({"$addr": addr, "$content": content_SINGLEQUOTE___$2, "$addresses": addresses});
}),G__186711__$1);
}
})();
sqlite_db.exec(({"sql": "alter table kvs add column addresses JSON"}));

return sqlite_db.transaction((function (tx){
var seq__186719 = cljs.core.seq(data);
var chunk__186720 = null;
var count__186721 = (0);
var i__186722 = (0);
while(true){
if((i__186722 < count__186721)){
var item = chunk__186720.cljs$core$IIndexed$_nth$arity$2(null,i__186722);
tx.exec(({"sql": "INSERT INTO kvs (addr, content, addresses) values ($addr, $content, $addresses) on conflict(addr) do update set content = $content, addresses = $addresses", "bind": item}));


var G__186787 = seq__186719;
var G__186788 = chunk__186720;
var G__186789 = count__186721;
var G__186790 = (i__186722 + (1));
seq__186719 = G__186787;
chunk__186720 = G__186788;
count__186721 = G__186789;
i__186722 = G__186790;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__186719);
if(temp__5804__auto__){
var seq__186719__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__186719__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__186719__$1);
var G__186791 = cljs.core.chunk_rest(seq__186719__$1);
var G__186792 = c__5525__auto__;
var G__186793 = cljs.core.count(c__5525__auto__);
var G__186794 = (0);
seq__186719 = G__186791;
chunk__186720 = G__186792;
count__186721 = G__186793;
i__186722 = G__186794;
continue;
} else {
var item = cljs.core.first(seq__186719__$1);
tx.exec(({"sql": "INSERT INTO kvs (addr, content, addresses) values ($addr, $content, $addresses) on conflict(addr) do update set content = $content, addresses = $addresses", "bind": item}));


var G__186795 = cljs.core.next(seq__186719__$1);
var G__186796 = null;
var G__186797 = (0);
var G__186798 = (0);
seq__186719 = G__186795;
chunk__186720 = G__186796;
count__186721 = G__186797;
i__186722 = G__186798;
continue;
}
} else {
return null;
}
}
break;
}
}));
}
});
/**
 * Migrate sqlite db schema
 */
frontend.worker.db.migrate.migrate_sqlite_db = (function frontend$worker$db$migrate$migrate_sqlite_db(db){
return frontend.worker.db.migrate.add_addresses_in_kvs_table(db);
});

//# sourceMappingURL=frontend.worker.db.migrate.js.map
