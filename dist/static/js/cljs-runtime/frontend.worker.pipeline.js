goog.provide('frontend.worker.pipeline');
frontend.worker.pipeline.refs_need_recalculated_QMARK_ = (function frontend$worker$pipeline$refs_need_recalculated_QMARK_(tx_meta){
var outliner_op = new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450).cljs$core$IFn$_invoke$arity$1(tx_meta);
return cljs.core.not((function (){var or__5002__auto__ = cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"collapse-expand-blocks","collapse-expand-blocks",-868833367),null,new cljs.core.Keyword(null,"delete-blocks","delete-blocks",-1868631596),null], null), null),outliner_op);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword(null,"undo?","undo?",85877626).cljs$core$IFn$_invoke$arity$1(tx_meta);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return new cljs.core.Keyword(null,"redo?","redo?",-1798545479).cljs$core$IFn$_invoke$arity$1(tx_meta);
}
}
})());
});
frontend.worker.pipeline.compute_block_path_refs_tx = (function frontend$worker$pipeline$compute_block_path_refs_tx(p__186338,blocks){
var map__186339 = p__186338;
var map__186339__$1 = cljs.core.__destructure_map(map__186339);
var tx_report = map__186339__$1;
var tx_meta = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186339__$1,new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194));
if(cljs.core.truth_((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"rtc-tx?","rtc-tx?",-82304745).cljs$core$IFn$_invoke$arity$1(tx_meta);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = (function (){var and__5000__auto__ = new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450).cljs$core$IFn$_invoke$arity$1(tx_meta);
if(cljs.core.truth_(and__5000__auto__)){
return frontend.worker.pipeline.refs_need_recalculated_QMARK_(tx_meta);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = new cljs.core.Keyword(null,"from-disk?","from-disk?",-1991074161).cljs$core$IFn$_invoke$arity$1(tx_meta);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
return new cljs.core.Keyword(null,"new-graph?","new-graph?",-843567695).cljs$core$IFn$_invoke$arity$1(tx_meta);
}
}
}
})())){
return logseq.outliner.pipeline.compute_block_path_refs_tx(tx_report,blocks);
} else {
return null;
}
});
frontend.worker.pipeline.rebuild_block_refs = (function frontend$worker$pipeline$rebuild_block_refs(repo,p__186340,blocks){
var map__186341 = p__186340;
var map__186341__$1 = cljs.core.__destructure_map(map__186341);
var tx_meta = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186341__$1,new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194));
var db_after = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186341__$1,new cljs.core.Keyword(null,"db-after","db-after",-571884666));
if(cljs.core.truth_((function (){var or__5002__auto__ = (function (){var and__5000__auto__ = new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450).cljs$core$IFn$_invoke$arity$1(tx_meta);
if(cljs.core.truth_(and__5000__auto__)){
return frontend.worker.pipeline.refs_need_recalculated_QMARK_(tx_meta);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"rtc-tx?","rtc-tx?",-82304745).cljs$core$IFn$_invoke$arity$1(tx_meta);
}
})())){
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (block){
if(cljs.core.truth_((function (){var G__186342 = db_after;
var G__186343 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186342,G__186343) : datascript.core.entity.call(null,G__186342,G__186343));
})())){
var date_formatter = frontend.worker.state.get_date_formatter(repo);
var refs = logseq.outliner.core.rebuild_block_refs(repo,db_after,date_formatter,block);
var G__186344 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("block","refs","block/refs",-1214495349)], null)], null);
if(cljs.core.seq(refs)){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__186344,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("block","refs","block/refs",-1214495349),refs], null));
} else {
return G__186344;
}
} else {
return null;
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([blocks], 0));
} else {
return null;
}
});
frontend.worker.pipeline.insert_tag_templates = (function frontend$worker$pipeline$insert_tag_templates(repo,tx_report){
var db = new cljs.core.Keyword(null,"db-after","db-after",-571884666).cljs$core$IFn$_invoke$arity$1(tx_report);
var journal_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword("logseq.class","Journal","logseq.class/Journal",1979741081)) : datascript.core.entity.call(null,db,new cljs.core.Keyword("logseq.class","Journal","logseq.class/Journal",1979741081))));
var journal_template_QMARK_ = cljs.core.some((function (d){
var and__5000__auto__ = new cljs.core.Keyword(null,"added","added",2057651688).cljs$core$IFn$_invoke$arity$1(d);
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("block","tags","block/tags",1814948340))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d),journal_id)));
} else {
return and__5000__auto__;
}
}),new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(tx_report));
var tx_data = (function (){var G__186345 = new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(tx_report);
var G__186345__$1 = (((G__186345 == null))?null:cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (d){
var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("block","tags","block/tags",1814948340));
if(and__5000__auto__){
return new cljs.core.Keyword(null,"added","added",2057651688).cljs$core$IFn$_invoke$arity$1(d);
} else {
return and__5000__auto__;
}
}),G__186345));
var G__186345__$2 = (((G__186345__$1 == null))?null:cljs.core.group_by(new cljs.core.Keyword(null,"e","e",1381269198),G__186345__$1));
if((G__186345__$2 == null)){
return null;
} else {
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__186346){
var vec__186347 = p__186346;
var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186347,(0),null);
var datoms = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__186347,(1),null);
var object = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,e) : datascript.core.entity.call(null,db,e));
var template_blocks = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (template){
var template_blocks = cljs.core.rest(logseq.db.get_block_and_children.cljs$core$IFn$_invoke$arity$variadic(db,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(template),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"include-property-block?","include-property-block?",-211563499),true], null)], 0)));
var blocks = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (e__$1){
var G__186350 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,e__$1),new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(e__$1));
if(cljs.core.truth_(new cljs.core.Keyword(null,"journal","journal",1585898830).cljs$core$IFn$_invoke$arity$1(template))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__186350,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),logseq.common.uuid.gen_journal_template_block(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"journal","journal",1585898830).cljs$core$IFn$_invoke$arity$1(template)),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(e__$1)));
} else {
return G__186350;
}
}),cljs.core.cons(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.first(template_blocks),new cljs.core.Keyword("logseq.property","used-template","logseq.property/used-template",-980369906),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(template)),cljs.core.rest(template_blocks)));
return blocks;
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","created-at","block/created-at",1440015),cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (id){
var tag = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,id) : datascript.core.entity.call(null,db,id));
var journal_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(journal_id,id);
var parents = (function (){var G__186351 = tag;
var G__186352 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"node-class?","node-class?",-430242441),true], null);
return (logseq.db.get_page_parents.cljs$core$IFn$_invoke$arity$2 ? logseq.db.get_page_parents.cljs$core$IFn$_invoke$arity$2(G__186351,G__186352) : logseq.db.get_page_parents.call(null,G__186351,G__186352));
})();
var templates = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("logseq.property","_template-applied-to","logseq.property/_template-applied-to",-1614564205),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.conj.cljs$core$IFn$_invoke$arity$2(parents,tag)], 0));
var G__186353 = templates;
if(journal_QMARK_){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (t){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(t,new cljs.core.Keyword(null,"journal","journal",1585898830),tag);
}),G__186353);
} else {
return G__186353;
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"v","v",21465059),datoms))], 0))))], 0));
if(cljs.core.seq(template_blocks)){
var result = logseq.outliner.core.insert_blocks(repo,db,template_blocks,object,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),false,new cljs.core.Keyword(null,"keep-uuid?","keep-uuid?",528472028),journal_template_QMARK_], null));
return new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(result);
} else {
return null;
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__186345__$2], 0));
}
})();
return tx_data;
});
(new cljs.core.PersistentVector(null,4,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword("frontend.worker.pipeline","skip-validate-db?","frontend.worker.pipeline/skip-validate-db?",-107248246),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"doc","doc",1913296891),"tx-meta option, default = false"], null),new cljs.core.Keyword("frontend.worker.pipeline","skip-store-conn","frontend.worker.pipeline/skip-store-conn",-1426692178),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"doc","doc",1913296891),"tx-meta option, skip `d/store` on conn. default = false"], null)],null));
/**
 * Validate db is slow, we probably don't want to enable it for production.
 */
frontend.worker.pipeline.validate_db_BANG_ = (function frontend$worker$pipeline$validate_db_BANG_(repo,conn,tx_report,tx_meta,context){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not(new cljs.core.Keyword("frontend.worker.pipeline","skip-validate-db?","frontend.worker.pipeline/skip-validate-db?",-107248246).cljs$core$IFn$_invoke$arity$2(tx_meta,false));
if(and__5000__auto__){
var and__5000__auto____$1 = new cljs.core.Keyword(null,"dev?","dev?",-613971064).cljs$core$IFn$_invoke$arity$1(context);
if(cljs.core.truth_(and__5000__auto____$1)){
var and__5000__auto____$2 = cljs.core.not(new cljs.core.Keyword(null,"importing?","importing?",-656840367).cljs$core$IFn$_invoke$arity$1(context));
if(and__5000__auto____$2){
return logseq.db.sqlite.util.db_based_graph_QMARK_(repo);
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
var valid_QMARK__186408 = (cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(tx_report,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194),new cljs.core.Keyword(null,"reset-conn!","reset-conn!",-325354379)], null)))?true:logseq.db.frontend.validate.validate_tx_report_BANG_(tx_report,new cljs.core.Keyword(null,"validate-db-options","validate-db-options",89965176).cljs$core$IFn$_invoke$arity$1(context)));
if(cljs.core.truth_(valid_QMARK__186408)){
} else {
if(cljs.core.truth_((function (){var or__5002__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(context,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"validate-db-options","validate-db-options",89965176),new cljs.core.Keyword(null,"fail-invalid?","fail-invalid?",2067343710)], null));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.worker.util.dev_QMARK_;
}
})())){
frontend.worker.shared_service.broadcast_to_clients_BANG_(new cljs.core.Keyword(null,"notification","notification",-222338233),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Invalid DB!"], null),new cljs.core.Keyword(null,"error","error",-978969032)], null));
} else {
}

throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Invalid data",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"graph","graph",1558099509),repo], null));
}
} else {
}

if(cljs.core.truth_((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"dev?","dev?",-613971064).cljs$core$IFn$_invoke$arity$1(context);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (typeof process !== 'undefined');
}
})())){
var order_datoms = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (d){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","order","block/order",-1429282437),new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(d));
}),new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(tx_report));
var seq__186354 = cljs.core.seq(order_datoms);
var chunk__186355 = null;
var count__186356 = (0);
var i__186357 = (0);
while(true){
if((i__186357 < count__186356)){
var datom = chunk__186355.cljs$core$IIndexed$_nth$arity$2(null,i__186357);
var entity_186409 = (function (){var G__186362 = cljs.core.deref(conn);
var G__186363 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(datom);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186362,G__186363) : datascript.core.entity.call(null,G__186362,G__186363));
})();
var parent_186410 = new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(entity_186409);
if(cljs.core.truth_(parent_186410)){
var children_186411 = new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(parent_186410);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","order","block/order",-1429282437),children_186411))),cljs.core.count(children_186411))){
} else {
throw (new Error(["Assert failed: ",[":block/order is not unique for children blocks, parent id: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(parent_186410))].join(''),"\n","(= (count (distinct (map :block/order children))) (count children))"].join('')));
}
} else {
}


var G__186412 = seq__186354;
var G__186413 = chunk__186355;
var G__186414 = count__186356;
var G__186415 = (i__186357 + (1));
seq__186354 = G__186412;
chunk__186355 = G__186413;
count__186356 = G__186414;
i__186357 = G__186415;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__186354);
if(temp__5804__auto__){
var seq__186354__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__186354__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__186354__$1);
var G__186416 = cljs.core.chunk_rest(seq__186354__$1);
var G__186417 = c__5525__auto__;
var G__186418 = cljs.core.count(c__5525__auto__);
var G__186419 = (0);
seq__186354 = G__186416;
chunk__186355 = G__186417;
count__186356 = G__186418;
i__186357 = G__186419;
continue;
} else {
var datom = cljs.core.first(seq__186354__$1);
var entity_186420 = (function (){var G__186364 = cljs.core.deref(conn);
var G__186365 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(datom);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186364,G__186365) : datascript.core.entity.call(null,G__186364,G__186365));
})();
var parent_186421 = new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(entity_186420);
if(cljs.core.truth_(parent_186421)){
var children_186422 = new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(parent_186421);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","order","block/order",-1429282437),children_186422))),cljs.core.count(children_186422))){
} else {
throw (new Error(["Assert failed: ",[":block/order is not unique for children blocks, parent id: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(parent_186421))].join(''),"\n","(= (count (distinct (map :block/order children))) (count children))"].join('')));
}
} else {
}


var G__186423 = cljs.core.next(seq__186354__$1);
var G__186424 = null;
var G__186425 = (0);
var G__186426 = (0);
seq__186354 = G__186423;
chunk__186355 = G__186424;
count__186356 = G__186425;
i__186357 = G__186426;
continue;
}
} else {
return null;
}
}
break;
}
} else {
return null;
}
});
/**
 * Add missing properties for these cases:
 *   1. Add corresponding tag when invoking commands like /code block.
 *   2. Add properties when tagging a block.
 *   3. Add properties when removing a tag from a block
 */
frontend.worker.pipeline.add_missing_properties_to_typed_display_blocks = (function frontend$worker$pipeline$add_missing_properties_to_typed_display_blocks(db,datoms){
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (d){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189));
if(and__5000__auto__){
var and__5000__auto____$1 = (new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d) instanceof cljs.core.Keyword);
if(and__5000__auto____$1){
return new cljs.core.Keyword(null,"added","added",2057651688).cljs$core$IFn$_invoke$arity$1(d);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
var temp__5804__auto__ = (function (){var G__186366 = new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d);
return (logseq.db.get_class_ident_by_display_type.cljs$core$IFn$_invoke$arity$1 ? logseq.db.get_class_ident_by_display_type.cljs$core$IFn$_invoke$arity$1(G__186366) : logseq.db.get_class_ident_by_display_type.call(null,G__186366));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var tag = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("block","tags","block/tags",1814948340),tag], null)], null);
} else {
return null;
}
} else {
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("block","tags","block/tags",1814948340))) && (((cljs.core.contains_QMARK_(logseq.db.node_display_type_classes,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1((function (){var G__186367 = db;
var G__186368 = new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186367,G__186368) : datascript.core.entity.call(null,G__186367,G__186368));
})()))) && (new cljs.core.Keyword(null,"added","added",2057651688).cljs$core$IFn$_invoke$arity$1(d) === false))))){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189)], null)], null);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("block","tags","block/tags",1814948340));
if(and__5000__auto__){
var and__5000__auto____$1 = cljs.core.contains_QMARK_(logseq.db.node_display_type_classes,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1((function (){var G__186369 = db;
var G__186370 = new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186369,G__186370) : datascript.core.entity.call(null,G__186369,G__186370));
})()));
if(and__5000__auto____$1){
return new cljs.core.Keyword(null,"added","added",2057651688).cljs$core$IFn$_invoke$arity$1(d);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
var temp__5804__auto__ = (function (){var G__186371 = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1((function (){var G__186372 = db;
var G__186373 = new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186372,G__186373) : datascript.core.entity.call(null,G__186372,G__186373));
})());
return (logseq.db.get_display_type_by_class_ident.cljs$core$IFn$_invoke$arity$1 ? logseq.db.get_display_type_by_class_ident.cljs$core$IFn$_invoke$arity$1(G__186371) : logseq.db.get_display_type_by_class_ident.call(null,G__186371));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var display_type = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var G__186374 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189),display_type], null);
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(display_type,new cljs.core.Keyword(null,"code","code",1586293142));
if(and__5000__auto__){
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword("logseq.kv","latest-code-lang","logseq.kv/latest-code-lang",-73570328)) : datascript.core.entity.call(null,db,new cljs.core.Keyword("logseq.kv","latest-code-lang","logseq.kv/latest-code-lang",-73570328)));
} else {
return and__5000__auto__;
}
})())){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__186374,new cljs.core.Keyword("logseq.property.code","lang","logseq.property.code/lang",-857897165),new cljs.core.Keyword("kv","value","kv/value",305981670).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword("logseq.kv","latest-code-lang","logseq.kv/latest-code-lang",-73570328)) : datascript.core.entity.call(null,db,new cljs.core.Keyword("logseq.kv","latest-code-lang","logseq.kv/latest-code-lang",-73570328)))));
} else {
return G__186374;
}
})()], null);
} else {
return null;
}
} else {
return null;
}
}
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([datoms], 0));
});
frontend.worker.pipeline.invoke_hooks_for_imported_graph = (function frontend$worker$pipeline$invoke_hooks_for_imported_graph(conn,p__186375){
var map__186376 = p__186375;
var map__186376__$1 = cljs.core.__destructure_map(map__186376);
var tx_report = map__186376__$1;
var tx_meta = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186376__$1,new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194));
var map__186377 = logseq.outliner.pipeline.transact_new_db_graph_refs(conn,tx_report);
var map__186377__$1 = cljs.core.__destructure_map(map__186377);
var refs_tx_report = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186377__$1,new cljs.core.Keyword(null,"refs-tx-report","refs-tx-report",-1862519970));
var path_refs_tx_report = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186377__$1,new cljs.core.Keyword(null,"path-refs-tx-report","path-refs-tx-report",1195202574));
var full_tx_data = cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(tx_report),new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(refs_tx_report),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(path_refs_tx_report)], 0));
var final_tx_report = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic((function (){var or__5002__auto__ = path_refs_tx_report;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = refs_tx_report;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return tx_report;
}
}
})(),new cljs.core.Keyword(null,"tx-data","tx-data",934159761),full_tx_data,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194),tx_meta,new cljs.core.Keyword(null,"db-before","db-before",-553691536),new cljs.core.Keyword(null,"db-before","db-before",-553691536).cljs$core$IFn$_invoke$arity$1(tx_report)], 0));
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tx-report","tx-report",1910895391),final_tx_report], null);
});
frontend.worker.pipeline.gen_created_by_block = (function frontend$worker$pipeline$gen_created_by_block(decoded_id_token){
var user_uuid = new cljs.core.Keyword(null,"sub","sub",-2093760025).cljs$core$IFn$_invoke$arity$1(decoded_id_token);
var user_name = new cljs.core.Keyword(null,"cognito:username","cognito:username",-2023950904).cljs$core$IFn$_invoke$arity$1(decoded_id_token);
var email = new cljs.core.Keyword(null,"email","email",1415816706).cljs$core$IFn$_invoke$arity$1(decoded_id_token);
var now = logseq.common.util.time_ms();
return new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.uuid(user_uuid),new cljs.core.Keyword("block","name","block/name",1619760316),user_name,new cljs.core.Keyword("block","title","block/title",710445684),user_name,new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329),new cljs.core.Keyword("block","created-at","block/created-at",1440015),now,new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551),now,new cljs.core.Keyword("logseq.property.user","name","logseq.property.user/name",-1360026016),user_name,new cljs.core.Keyword("logseq.property.user","email","logseq.property.user/email",-1655206063),email], null);
});
frontend.worker.pipeline.add_created_by_ref_hook = (function frontend$worker$pipeline$add_created_by_ref_hook(db_before,db_after,tx_data,tx_meta){
if(((cljs.core.not((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"undo?","undo?",85877626).cljs$core$IFn$_invoke$arity$1(tx_meta);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword(null,"redo?","redo?",-1798545479).cljs$core$IFn$_invoke$arity$1(tx_meta);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return new cljs.core.Keyword(null,"rtc-tx?","rtc-tx?",-82304745).cljs$core$IFn$_invoke$arity$1(tx_meta);
}
}
})())) && (cljs.core.seq(tx_data)))){
var temp__5804__auto__ = (function (){var G__186378 = frontend.worker.state.get_id_token();
if((G__186378 == null)){
return null;
} else {
return frontend.worker.util.parse_jwt(G__186378);
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var decoded_id_token = temp__5804__auto__;
var created_by_ent = (function (){var G__186379 = db_after;
var G__186380 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.uuid(new cljs.core.Keyword(null,"sub","sub",-2093760025).cljs$core$IFn$_invoke$arity$1(decoded_id_token))], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186379,G__186380) : datascript.core.entity.call(null,G__186379,G__186380));
})();
var created_by_block = (((created_by_ent == null))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.worker.pipeline.gen_created_by_block(decoded_id_token),new cljs.core.Keyword("db","id","db/id",-1388397098),"created-by-id"):null);
var created_by_id = (function (){var or__5002__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(created_by_ent);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "created-by-id";
}
})();
var add_created_by_tx_data = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (datom){
var attr = new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(datom);
var value = new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(datom);
var e = new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(datom);
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),attr);
if(and__5000__auto__){
return new cljs.core.Keyword(null,"added","added",2057651688).cljs$core$IFn$_invoke$arity$1(datom);
} else {
return and__5000__auto__;
}
})())){
var ent = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db_after,e) : datascript.core.entity.call(null,db_after,e));
if(cljs.core.truth_(new cljs.core.Keyword("logseq.property","created-by-ref","logseq.property/created-by-ref",854433908).cljs$core$IFn$_invoke$arity$1(ent))){
return null;
} else {
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),e,new cljs.core.Keyword("logseq.property","created-by-ref","logseq.property/created-by-ref",854433908),created_by_id], null);
}
} else {
if(((cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("block","title","block/title",710445684),attr)) && ((((!(clojure.string.blank_QMARK_(value)))) && (clojure.string.blank_QMARK_(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db_before,e) : datascript.core.entity.call(null,db_before,e))))))))){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),e,new cljs.core.Keyword("logseq.property","created-by-ref","logseq.property/created-by-ref",854433908),created_by_id], null);
} else {
return null;
}
}
}),tx_data);
var G__186381 = add_created_by_tx_data;
if((created_by_ent == null)){
return cljs.core.cons(created_by_block,G__186381);
} else {
return G__186381;
}
} else {
return null;
}
} else {
return null;
}
});
frontend.worker.pipeline.compute_extra_tx_data = (function frontend$worker$pipeline$compute_extra_tx_data(repo,tx_report){
var map__186382 = tx_report;
var map__186382__$1 = cljs.core.__destructure_map(map__186382);
var db_before = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186382__$1,new cljs.core.Keyword(null,"db-before","db-before",-553691536));
var db_after = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186382__$1,new cljs.core.Keyword(null,"db-after","db-after",-571884666));
var tx_data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186382__$1,new cljs.core.Keyword(null,"tx-data","tx-data",934159761));
var tx_meta = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186382__$1,new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194));
var display_blocks_tx_data = frontend.worker.pipeline.add_missing_properties_to_typed_display_blocks(db_after,tx_data);
var commands_tx = (cljs.core.truth_((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"undo?","undo?",85877626).cljs$core$IFn$_invoke$arity$1(tx_meta);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword(null,"redo?","redo?",-1798545479).cljs$core$IFn$_invoke$arity$1(tx_meta);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return new cljs.core.Keyword(null,"rtc-tx?","rtc-tx?",-82304745).cljs$core$IFn$_invoke$arity$1(tx_meta);
}
}
})())?null:frontend.worker.commands.run_commands(tx_report));
var insert_templates_tx = frontend.worker.pipeline.insert_tag_templates(repo,tx_report);
var created_by_tx = frontend.worker.pipeline.add_created_by_ref_hook(db_before,db_after,tx_data,tx_meta);
return cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(display_blocks_tx_data,commands_tx,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([insert_templates_tx,created_by_tx], 0));
});
frontend.worker.pipeline.invoke_hooks_default = (function frontend$worker$pipeline$invoke_hooks_default(repo,conn,p__186383,context){
var map__186384 = p__186383;
var map__186384__$1 = cljs.core.__destructure_map(map__186384);
var tx_report = map__186384__$1;
var tx_meta = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186384__$1,new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194));
try{var tx_before_refs = (cljs.core.truth_(logseq.db.sqlite.util.db_based_graph_QMARK_(repo))?frontend.worker.pipeline.compute_extra_tx_data(repo,tx_report):null);
var tx_report_STAR_ = ((cljs.core.seq(tx_before_refs))?(function (){var result = logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,tx_before_refs,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"pipeline-replace?","pipeline-replace?",-758892518),true,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"pre-hook-invoke","pre-hook-invoke",-1434282939),new cljs.core.Keyword(null,"skip-store?","skip-store?",-484019625),true], null));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(tx_report,new cljs.core.Keyword(null,"tx-data","tx-data",934159761),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(tx_report),new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(result)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"db-after","db-after",-571884666),new cljs.core.Keyword(null,"db-after","db-after",-571884666).cljs$core$IFn$_invoke$arity$1(result)], 0));
})():tx_report);
var map__186386 = logseq.outliner.datascript_report.get_blocks_and_pages(tx_report_STAR_);
var map__186386__$1 = cljs.core.__destructure_map(map__186386);
var pages = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186386__$1,new cljs.core.Keyword(null,"pages","pages",-285406513));
var blocks = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186386__$1,new cljs.core.Keyword(null,"blocks","blocks",-610462153));
var _ = ((logseq.db.common.sqlite.local_file_based_graph_QMARK_(repo))?(function (){var page_ids = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),pages));
var seq__186387 = cljs.core.seq(page_ids);
var chunk__186388 = null;
var count__186389 = (0);
var i__186390 = (0);
while(true){
if((i__186390 < count__186389)){
var page_id = chunk__186388.cljs$core$IIndexed$_nth$arity$2(null,i__186390);
if(cljs.core.truth_((function (){var G__186395 = cljs.core.deref(conn);
var G__186396 = page_id;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186395,G__186396) : datascript.core.entity.call(null,G__186395,G__186396));
})())){
frontend.worker.file.sync_to_file(repo,page_id,tx_meta);
} else {
}


var G__186427 = seq__186387;
var G__186428 = chunk__186388;
var G__186429 = count__186389;
var G__186430 = (i__186390 + (1));
seq__186387 = G__186427;
chunk__186388 = G__186428;
count__186389 = G__186429;
i__186390 = G__186430;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__186387);
if(temp__5804__auto__){
var seq__186387__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__186387__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__186387__$1);
var G__186431 = cljs.core.chunk_rest(seq__186387__$1);
var G__186432 = c__5525__auto__;
var G__186433 = cljs.core.count(c__5525__auto__);
var G__186434 = (0);
seq__186387 = G__186431;
chunk__186388 = G__186432;
count__186389 = G__186433;
i__186390 = G__186434;
continue;
} else {
var page_id = cljs.core.first(seq__186387__$1);
if(cljs.core.truth_((function (){var G__186397 = cljs.core.deref(conn);
var G__186398 = page_id;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186397,G__186398) : datascript.core.entity.call(null,G__186397,G__186398));
})())){
frontend.worker.file.sync_to_file(repo,page_id,tx_meta);
} else {
}


var G__186437 = cljs.core.next(seq__186387__$1);
var G__186438 = null;
var G__186439 = (0);
var G__186440 = (0);
seq__186387 = G__186437;
chunk__186388 = G__186438;
count__186389 = G__186439;
i__186390 = G__186440;
continue;
}
} else {
return null;
}
}
break;
}
})():null);
var deleted_blocks = logseq.outliner.pipeline.filter_deleted_blocks(new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(tx_report_STAR_));
var deleted_block_ids = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),deleted_blocks));
var deleted_block_uuids = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),deleted_blocks));
var deleted_assets = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (id){
var e = (function (){var G__186399 = new cljs.core.Keyword(null,"db-before","db-before",-553691536).cljs$core$IFn$_invoke$arity$1(tx_report_STAR_);
var G__186400 = id;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186399,G__186400) : datascript.core.entity.call(null,G__186399,G__186400));
})();
if(cljs.core.truth_((logseq.db.asset_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.asset_QMARK_.cljs$core$IFn$_invoke$arity$1(e) : logseq.db.asset_QMARK_.call(null,e)))){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(e),new cljs.core.Keyword(null,"ext","ext",-996964541),new cljs.core.Keyword("logseq.property.asset","type","logseq.property.asset/type",-1142083098).cljs$core$IFn$_invoke$arity$1(e)], null);
} else {
return null;
}
}),deleted_block_ids);
var blocks_SINGLEQUOTE_ = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (b){
var G__186401 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(b);
return (deleted_block_ids.cljs$core$IFn$_invoke$arity$1 ? deleted_block_ids.cljs$core$IFn$_invoke$arity$1(G__186401) : deleted_block_ids.call(null,G__186401));
}),blocks);
var block_refs = ((cljs.core.seq(blocks_SINGLEQUOTE_))?frontend.worker.pipeline.rebuild_block_refs(repo,tx_report_STAR_,blocks_SINGLEQUOTE_):null);
var refs_tx_report = ((cljs.core.seq(block_refs))?logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,block_refs,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"pipeline-replace?","pipeline-replace?",-758892518),true,new cljs.core.Keyword(null,"skip-store?","skip-store?",-484019625),true], null)):null);
var replace_tx = (function (){var db_after = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"db-after","db-after",-571884666).cljs$core$IFn$_invoke$arity$1(refs_tx_report);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"db-after","db-after",-571884666).cljs$core$IFn$_invoke$arity$1(tx_report_STAR_);
}
})();
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(((cljs.core.seq(blocks_SINGLEQUOTE_))?(function (){var blocks_SINGLEQUOTE___$1 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (b){
var G__186402 = db_after;
var G__186403 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(b);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__186402,G__186403) : datascript.core.entity.call(null,G__186402,G__186403));
}),blocks_SINGLEQUOTE_);
return frontend.worker.pipeline.compute_block_path_refs_tx(tx_report_STAR_,blocks_SINGLEQUOTE___$1);
})():null),(function (){var updated_blocks = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (b){
return cljs.core.contains_QMARK_(deleted_block_ids,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(b));
}),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(pages,blocks));
var tx_id = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2((function (){var or__5002__auto__ = refs_tx_report;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return tx_report_STAR_;
}
})(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tempids","tempids",1767509089),new cljs.core.Keyword("db","current-tx","db/current-tx",1600722132)], null));
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (b){
var temp__5804__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(b);
if(cljs.core.truth_(temp__5804__auto__)){
var db_id = temp__5804__auto__;
if(cljs.core.truth_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db_after,db_id) : datascript.core.entity.call(null,db_after,db_id))))){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),db_id,new cljs.core.Keyword("block","tx-id","block/tx-id",547556161),tx_id], null);
} else {
return null;
}
} else {
return null;
}
}),updated_blocks);
})());
})();
var tx_report_SINGLEQUOTE_ = logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,replace_tx,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"pipeline-replace?","pipeline-replace?",-758892518),true,new cljs.core.Keyword(null,"db-persist?","db-persist?",-380897508),true], null));
var ___$1 = frontend.worker.pipeline.validate_db_BANG_(repo,conn,tx_report_STAR_,tx_meta,context);
var full_tx_data = cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(tx_report_STAR_),new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(refs_tx_report),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(tx_report_SINGLEQUOTE_)], 0));
var final_tx_report = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(tx_report_SINGLEQUOTE_,new cljs.core.Keyword(null,"tx-data","tx-data",934159761),full_tx_data,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194),tx_meta,new cljs.core.Keyword(null,"db-before","db-before",-553691536),new cljs.core.Keyword(null,"db-before","db-before",-553691536).cljs$core$IFn$_invoke$arity$1(tx_report),new cljs.core.Keyword(null,"db-after","db-after",-571884666),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"db-after","db-after",-571884666).cljs$core$IFn$_invoke$arity$1(tx_report_SINGLEQUOTE_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"db-after","db-after",-571884666).cljs$core$IFn$_invoke$arity$1(tx_report);
}
})()], 0));
var affected_query_keys = (cljs.core.truth_(new cljs.core.Keyword(null,"importing?","importing?",-656840367).cljs$core$IFn$_invoke$arity$1(context))?null:frontend.worker.react.get_affected_queries_keys(final_tx_report));
return new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"tx-report","tx-report",1910895391),final_tx_report,new cljs.core.Keyword(null,"affected-keys","affected-keys",-2138165094),affected_query_keys,new cljs.core.Keyword(null,"deleted-block-uuids","deleted-block-uuids",-1589082500),deleted_block_uuids,new cljs.core.Keyword(null,"deleted-assets","deleted-assets",888060039),deleted_assets,new cljs.core.Keyword(null,"pages","pages",-285406513),pages,new cljs.core.Keyword(null,"blocks","blocks",-610462153),blocks], null);
}catch (e186385){var e = e186385;
return console.error(e);
}});
frontend.worker.pipeline.invoke_hooks = (function frontend$worker$pipeline$invoke_hooks(repo,conn,p__186404,context){
var map__186405 = p__186404;
var map__186405__$1 = cljs.core.__destructure_map(map__186405);
var tx_report = map__186405__$1;
var tx_meta = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186405__$1,new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194));
if(cljs.core.truth_(new cljs.core.Keyword(null,"pipeline-replace?","pipeline-replace?",-758892518).cljs$core$IFn$_invoke$arity$1(tx_meta))){
return null;
} else {
var map__186406 = tx_meta;
var map__186406__$1 = cljs.core.__destructure_map(map__186406);
var from_disk_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186406__$1,new cljs.core.Keyword(null,"from-disk?","from-disk?",-1991074161));
var new_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186406__$1,new cljs.core.Keyword(null,"new-graph?","new-graph?",-843567695));
if(cljs.core.truth_((function (){var or__5002__auto__ = from_disk_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new_graph_QMARK_;
}
})())){
var map__186407 = logseq.outliner.datascript_report.get_blocks_and_pages(tx_report);
var map__186407__$1 = cljs.core.__destructure_map(map__186407);
var blocks = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186407__$1,new cljs.core.Keyword(null,"blocks","blocks",-610462153));
var path_refs = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(frontend.worker.pipeline.compute_block_path_refs_tx(tx_report,blocks));
var tx_report_SINGLEQUOTE_ = ((cljs.core.seq(path_refs))?logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,path_refs,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"pipeline-replace?","pipeline-replace?",-758892518),true], null)):tx_report);
var full_tx_data = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(tx_report),new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(tx_report_SINGLEQUOTE_));
var final_tx_report = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(tx_report_SINGLEQUOTE_,new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194),new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194).cljs$core$IFn$_invoke$arity$1(tx_report),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"tx-data","tx-data",934159761),full_tx_data,new cljs.core.Keyword(null,"db-before","db-before",-553691536),new cljs.core.Keyword(null,"db-before","db-before",-553691536).cljs$core$IFn$_invoke$arity$1(tx_report)], 0));
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tx-report","tx-report",1910895391),final_tx_report], null);
} else {
if(cljs.core.truth_((function (){var or__5002__auto__ = new cljs.core.Keyword("logseq.graph-parser.exporter","new-graph?","logseq.graph-parser.exporter/new-graph?",-2038807565).cljs$core$IFn$_invoke$arity$1(tx_meta);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("logseq.db.sqlite.export","imported-data?","logseq.db.sqlite.export/imported-data?",51416120).cljs$core$IFn$_invoke$arity$1(tx_meta);
}
})())){
return frontend.worker.pipeline.invoke_hooks_for_imported_graph(conn,tx_report);
} else {
return frontend.worker.pipeline.invoke_hooks_default(repo,conn,tx_report,context);

}
}
}
});

//# sourceMappingURL=frontend.worker.pipeline.js.map
