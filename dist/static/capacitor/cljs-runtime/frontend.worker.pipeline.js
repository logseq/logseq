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
frontend.worker.pipeline.compute_block_path_refs_tx = (function frontend$worker$pipeline$compute_block_path_refs_tx(p__132319,blocks){
var map__132320 = p__132319;
var map__132320__$1 = cljs.core.__destructure_map(map__132320);
var tx_report = map__132320__$1;
var tx_meta = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__132320__$1,new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194));
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
frontend.worker.pipeline.rebuild_block_refs = (function frontend$worker$pipeline$rebuild_block_refs(repo,p__132322,blocks){
var map__132323 = p__132322;
var map__132323__$1 = cljs.core.__destructure_map(map__132323);
var tx_meta = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__132323__$1,new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194));
var db_after = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__132323__$1,new cljs.core.Keyword(null,"db-after","db-after",-571884666));
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
if(cljs.core.truth_((function (){var G__132324 = db_after;
var G__132325 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__132324,G__132325) : datascript.core.entity.call(null,G__132324,G__132325));
})())){
var date_formatter = frontend.worker.state.get_date_formatter(repo);
var refs = logseq.outliner.core.rebuild_block_refs(repo,db_after,date_formatter,block);
var G__132326 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("block","refs","block/refs",-1214495349)], null)], null);
if(cljs.core.seq(refs)){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__132326,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("block","refs","block/refs",-1214495349),refs], null));
} else {
return G__132326;
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
var tx_data = (function (){var G__132334 = new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(tx_report);
var G__132334__$1 = (((G__132334 == null))?null:cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (d){
var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("block","tags","block/tags",1814948340));
if(and__5000__auto__){
return new cljs.core.Keyword(null,"added","added",2057651688).cljs$core$IFn$_invoke$arity$1(d);
} else {
return and__5000__auto__;
}
}),G__132334));
var G__132334__$2 = (((G__132334__$1 == null))?null:cljs.core.group_by(new cljs.core.Keyword(null,"e","e",1381269198),G__132334__$1));
if((G__132334__$2 == null)){
return null;
} else {
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__132337){
var vec__132338 = p__132337;
var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132338,(0),null);
var datoms = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132338,(1),null);
var object = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,e) : datascript.core.entity.call(null,db,e));
var template_blocks = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (template){
var template_blocks = cljs.core.rest(logseq.db.get_block_and_children.cljs$core$IFn$_invoke$arity$variadic(db,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(template),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"include-property-block?","include-property-block?",-211563499),true], null)], 0)));
var blocks = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (e__$1){
var G__132341 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,e__$1),new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(e__$1));
if(cljs.core.truth_(new cljs.core.Keyword(null,"journal","journal",1585898830).cljs$core$IFn$_invoke$arity$1(template))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__132341,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),logseq.common.uuid.gen_journal_template_block(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"journal","journal",1585898830).cljs$core$IFn$_invoke$arity$1(template)),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(e__$1)));
} else {
return G__132341;
}
}),cljs.core.cons(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.first(template_blocks),new cljs.core.Keyword("logseq.property","used-template","logseq.property/used-template",-980369906),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(template)),cljs.core.rest(template_blocks)));
return blocks;
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","created-at","block/created-at",1440015),cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (id){
var tag = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,id) : datascript.core.entity.call(null,db,id));
var journal_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(journal_id,id);
var parents = (function (){var G__132342 = tag;
var G__132343 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"node-class?","node-class?",-430242441),true], null);
return (logseq.db.get_page_parents.cljs$core$IFn$_invoke$arity$2 ? logseq.db.get_page_parents.cljs$core$IFn$_invoke$arity$2(G__132342,G__132343) : logseq.db.get_page_parents.call(null,G__132342,G__132343));
})();
var templates = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("logseq.property","_template-applied-to","logseq.property/_template-applied-to",-1614564205),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.conj.cljs$core$IFn$_invoke$arity$2(parents,tag)], 0));
var G__132344 = templates;
if(journal_QMARK_){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (t){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(t,new cljs.core.Keyword(null,"journal","journal",1585898830),tag);
}),G__132344);
} else {
return G__132344;
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"v","v",21465059),datoms))], 0))))], 0));
if(cljs.core.seq(template_blocks)){
var result = logseq.outliner.core.insert_blocks(repo,db,template_blocks,object,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),false,new cljs.core.Keyword(null,"keep-uuid?","keep-uuid?",528472028),journal_template_QMARK_], null));
return new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(result);
} else {
return null;
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__132334__$2], 0));
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
var valid_QMARK__132597 = (cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(tx_report,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194),new cljs.core.Keyword(null,"reset-conn!","reset-conn!",-325354379)], null)))?true:logseq.db.frontend.validate.validate_tx_report_BANG_(tx_report,new cljs.core.Keyword(null,"validate-db-options","validate-db-options",89965176).cljs$core$IFn$_invoke$arity$1(context)));
if(cljs.core.truth_(valid_QMARK__132597)){
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
var seq__132363 = cljs.core.seq(order_datoms);
var chunk__132364 = null;
var count__132365 = (0);
var i__132366 = (0);
while(true){
if((i__132366 < count__132365)){
var datom = chunk__132364.cljs$core$IIndexed$_nth$arity$2(null,i__132366);
var entity_132601 = (function (){var G__132373 = cljs.core.deref(conn);
var G__132374 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(datom);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__132373,G__132374) : datascript.core.entity.call(null,G__132373,G__132374));
})();
var parent_132602 = new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(entity_132601);
if(cljs.core.truth_(parent_132602)){
var children_132606 = new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(parent_132602);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","order","block/order",-1429282437),children_132606))),cljs.core.count(children_132606))){
} else {
throw (new Error(["Assert failed: ",[":block/order is not unique for children blocks, parent id: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(parent_132602))].join(''),"\n","(= (count (distinct (map :block/order children))) (count children))"].join('')));
}
} else {
}


var G__132607 = seq__132363;
var G__132608 = chunk__132364;
var G__132609 = count__132365;
var G__132610 = (i__132366 + (1));
seq__132363 = G__132607;
chunk__132364 = G__132608;
count__132365 = G__132609;
i__132366 = G__132610;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__132363);
if(temp__5804__auto__){
var seq__132363__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__132363__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__132363__$1);
var G__132612 = cljs.core.chunk_rest(seq__132363__$1);
var G__132613 = c__5525__auto__;
var G__132614 = cljs.core.count(c__5525__auto__);
var G__132615 = (0);
seq__132363 = G__132612;
chunk__132364 = G__132613;
count__132365 = G__132614;
i__132366 = G__132615;
continue;
} else {
var datom = cljs.core.first(seq__132363__$1);
var entity_132618 = (function (){var G__132384 = cljs.core.deref(conn);
var G__132385 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(datom);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__132384,G__132385) : datascript.core.entity.call(null,G__132384,G__132385));
})();
var parent_132619 = new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(entity_132618);
if(cljs.core.truth_(parent_132619)){
var children_132620 = new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(parent_132619);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","order","block/order",-1429282437),children_132620))),cljs.core.count(children_132620))){
} else {
throw (new Error(["Assert failed: ",[":block/order is not unique for children blocks, parent id: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(parent_132619))].join(''),"\n","(= (count (distinct (map :block/order children))) (count children))"].join('')));
}
} else {
}


var G__132622 = cljs.core.next(seq__132363__$1);
var G__132623 = null;
var G__132624 = (0);
var G__132625 = (0);
seq__132363 = G__132622;
chunk__132364 = G__132623;
count__132365 = G__132624;
i__132366 = G__132625;
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
var temp__5804__auto__ = (function (){var G__132393 = new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d);
return (logseq.db.get_class_ident_by_display_type.cljs$core$IFn$_invoke$arity$1 ? logseq.db.get_class_ident_by_display_type.cljs$core$IFn$_invoke$arity$1(G__132393) : logseq.db.get_class_ident_by_display_type.call(null,G__132393));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var tag = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("block","tags","block/tags",1814948340),tag], null)], null);
} else {
return null;
}
} else {
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("block","tags","block/tags",1814948340))) && (((cljs.core.contains_QMARK_(logseq.db.node_display_type_classes,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1((function (){var G__132398 = db;
var G__132399 = new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__132398,G__132399) : datascript.core.entity.call(null,G__132398,G__132399));
})()))) && (new cljs.core.Keyword(null,"added","added",2057651688).cljs$core$IFn$_invoke$arity$1(d) === false))))){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189)], null)], null);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("block","tags","block/tags",1814948340));
if(and__5000__auto__){
var and__5000__auto____$1 = cljs.core.contains_QMARK_(logseq.db.node_display_type_classes,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1((function (){var G__132409 = db;
var G__132410 = new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__132409,G__132410) : datascript.core.entity.call(null,G__132409,G__132410));
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
var temp__5804__auto__ = (function (){var G__132412 = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1((function (){var G__132413 = db;
var G__132414 = new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__132413,G__132414) : datascript.core.entity.call(null,G__132413,G__132414));
})());
return (logseq.db.get_display_type_by_class_ident.cljs$core$IFn$_invoke$arity$1 ? logseq.db.get_display_type_by_class_ident.cljs$core$IFn$_invoke$arity$1(G__132412) : logseq.db.get_display_type_by_class_ident.call(null,G__132412));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var display_type = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var G__132415 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189),display_type], null);
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(display_type,new cljs.core.Keyword(null,"code","code",1586293142));
if(and__5000__auto__){
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword("logseq.kv","latest-code-lang","logseq.kv/latest-code-lang",-73570328)) : datascript.core.entity.call(null,db,new cljs.core.Keyword("logseq.kv","latest-code-lang","logseq.kv/latest-code-lang",-73570328)));
} else {
return and__5000__auto__;
}
})())){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__132415,new cljs.core.Keyword("logseq.property.code","lang","logseq.property.code/lang",-857897165),new cljs.core.Keyword("kv","value","kv/value",305981670).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword("logseq.kv","latest-code-lang","logseq.kv/latest-code-lang",-73570328)) : datascript.core.entity.call(null,db,new cljs.core.Keyword("logseq.kv","latest-code-lang","logseq.kv/latest-code-lang",-73570328)))));
} else {
return G__132415;
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
frontend.worker.pipeline.invoke_hooks_for_imported_graph = (function frontend$worker$pipeline$invoke_hooks_for_imported_graph(conn,p__132425){
var map__132429 = p__132425;
var map__132429__$1 = cljs.core.__destructure_map(map__132429);
var tx_report = map__132429__$1;
var tx_meta = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__132429__$1,new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194));
var map__132435 = logseq.outliner.pipeline.transact_new_db_graph_refs(conn,tx_report);
var map__132435__$1 = cljs.core.__destructure_map(map__132435);
var refs_tx_report = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__132435__$1,new cljs.core.Keyword(null,"refs-tx-report","refs-tx-report",-1862519970));
var path_refs_tx_report = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__132435__$1,new cljs.core.Keyword(null,"path-refs-tx-report","path-refs-tx-report",1195202574));
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
var temp__5804__auto__ = (function (){var G__132466 = frontend.worker.state.get_id_token();
if((G__132466 == null)){
return null;
} else {
return frontend.worker.util.parse_jwt(G__132466);
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var decoded_id_token = temp__5804__auto__;
var created_by_ent = (function (){var G__132467 = db_after;
var G__132468 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.uuid(new cljs.core.Keyword(null,"sub","sub",-2093760025).cljs$core$IFn$_invoke$arity$1(decoded_id_token))], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__132467,G__132468) : datascript.core.entity.call(null,G__132467,G__132468));
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
var G__132474 = add_created_by_tx_data;
if((created_by_ent == null)){
return cljs.core.cons(created_by_block,G__132474);
} else {
return G__132474;
}
} else {
return null;
}
} else {
return null;
}
});
frontend.worker.pipeline.compute_extra_tx_data = (function frontend$worker$pipeline$compute_extra_tx_data(repo,tx_report){
var map__132478 = tx_report;
var map__132478__$1 = cljs.core.__destructure_map(map__132478);
var db_before = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__132478__$1,new cljs.core.Keyword(null,"db-before","db-before",-553691536));
var db_after = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__132478__$1,new cljs.core.Keyword(null,"db-after","db-after",-571884666));
var tx_data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__132478__$1,new cljs.core.Keyword(null,"tx-data","tx-data",934159761));
var tx_meta = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__132478__$1,new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194));
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
frontend.worker.pipeline.invoke_hooks_default = (function frontend$worker$pipeline$invoke_hooks_default(repo,conn,p__132501,context){
var map__132502 = p__132501;
var map__132502__$1 = cljs.core.__destructure_map(map__132502);
var tx_report = map__132502__$1;
var tx_meta = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__132502__$1,new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194));
try{var tx_before_refs = (cljs.core.truth_(logseq.db.sqlite.util.db_based_graph_QMARK_(repo))?frontend.worker.pipeline.compute_extra_tx_data(repo,tx_report):null);
var tx_report_STAR_ = ((cljs.core.seq(tx_before_refs))?(function (){var result = logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,tx_before_refs,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"pipeline-replace?","pipeline-replace?",-758892518),true,new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"pre-hook-invoke","pre-hook-invoke",-1434282939),new cljs.core.Keyword(null,"skip-store?","skip-store?",-484019625),true], null));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(tx_report,new cljs.core.Keyword(null,"tx-data","tx-data",934159761),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(tx_report),new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(result)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"db-after","db-after",-571884666),new cljs.core.Keyword(null,"db-after","db-after",-571884666).cljs$core$IFn$_invoke$arity$1(result)], 0));
})():tx_report);
var map__132505 = logseq.outliner.datascript_report.get_blocks_and_pages(tx_report_STAR_);
var map__132505__$1 = cljs.core.__destructure_map(map__132505);
var pages = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__132505__$1,new cljs.core.Keyword(null,"pages","pages",-285406513));
var blocks = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__132505__$1,new cljs.core.Keyword(null,"blocks","blocks",-610462153));
var _ = ((logseq.db.common.sqlite.local_file_based_graph_QMARK_(repo))?(function (){var page_ids = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),pages));
var seq__132508 = cljs.core.seq(page_ids);
var chunk__132509 = null;
var count__132510 = (0);
var i__132511 = (0);
while(true){
if((i__132511 < count__132510)){
var page_id = chunk__132509.cljs$core$IIndexed$_nth$arity$2(null,i__132511);
if(cljs.core.truth_((function (){var G__132532 = cljs.core.deref(conn);
var G__132533 = page_id;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__132532,G__132533) : datascript.core.entity.call(null,G__132532,G__132533));
})())){
frontend.worker.file.sync_to_file(repo,page_id,tx_meta);
} else {
}


var G__132676 = seq__132508;
var G__132677 = chunk__132509;
var G__132678 = count__132510;
var G__132679 = (i__132511 + (1));
seq__132508 = G__132676;
chunk__132509 = G__132677;
count__132510 = G__132678;
i__132511 = G__132679;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__132508);
if(temp__5804__auto__){
var seq__132508__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__132508__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__132508__$1);
var G__132680 = cljs.core.chunk_rest(seq__132508__$1);
var G__132681 = c__5525__auto__;
var G__132682 = cljs.core.count(c__5525__auto__);
var G__132683 = (0);
seq__132508 = G__132680;
chunk__132509 = G__132681;
count__132510 = G__132682;
i__132511 = G__132683;
continue;
} else {
var page_id = cljs.core.first(seq__132508__$1);
if(cljs.core.truth_((function (){var G__132535 = cljs.core.deref(conn);
var G__132536 = page_id;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__132535,G__132536) : datascript.core.entity.call(null,G__132535,G__132536));
})())){
frontend.worker.file.sync_to_file(repo,page_id,tx_meta);
} else {
}


var G__132685 = cljs.core.next(seq__132508__$1);
var G__132686 = null;
var G__132687 = (0);
var G__132688 = (0);
seq__132508 = G__132685;
chunk__132509 = G__132686;
count__132510 = G__132687;
i__132511 = G__132688;
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
var e = (function (){var G__132542 = new cljs.core.Keyword(null,"db-before","db-before",-553691536).cljs$core$IFn$_invoke$arity$1(tx_report_STAR_);
var G__132543 = id;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__132542,G__132543) : datascript.core.entity.call(null,G__132542,G__132543));
})();
if(cljs.core.truth_((logseq.db.asset_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.asset_QMARK_.cljs$core$IFn$_invoke$arity$1(e) : logseq.db.asset_QMARK_.call(null,e)))){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(e),new cljs.core.Keyword(null,"ext","ext",-996964541),new cljs.core.Keyword("logseq.property.asset","type","logseq.property.asset/type",-1142083098).cljs$core$IFn$_invoke$arity$1(e)], null);
} else {
return null;
}
}),deleted_block_ids);
var blocks_SINGLEQUOTE_ = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (b){
var G__132544 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(b);
return (deleted_block_ids.cljs$core$IFn$_invoke$arity$1 ? deleted_block_ids.cljs$core$IFn$_invoke$arity$1(G__132544) : deleted_block_ids.call(null,G__132544));
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
var G__132546 = db_after;
var G__132547 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(b);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__132546,G__132547) : datascript.core.entity.call(null,G__132546,G__132547));
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
}catch (e132503){var e = e132503;
return console.error(e);
}});
frontend.worker.pipeline.invoke_hooks = (function frontend$worker$pipeline$invoke_hooks(repo,conn,p__132558,context){
var map__132559 = p__132558;
var map__132559__$1 = cljs.core.__destructure_map(map__132559);
var tx_report = map__132559__$1;
var tx_meta = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__132559__$1,new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194));
if(cljs.core.truth_(new cljs.core.Keyword(null,"pipeline-replace?","pipeline-replace?",-758892518).cljs$core$IFn$_invoke$arity$1(tx_meta))){
return null;
} else {
var map__132561 = tx_meta;
var map__132561__$1 = cljs.core.__destructure_map(map__132561);
var from_disk_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__132561__$1,new cljs.core.Keyword(null,"from-disk?","from-disk?",-1991074161));
var new_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__132561__$1,new cljs.core.Keyword(null,"new-graph?","new-graph?",-843567695));
if(cljs.core.truth_((function (){var or__5002__auto__ = from_disk_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new_graph_QMARK_;
}
})())){
var map__132562 = logseq.outliner.datascript_report.get_blocks_and_pages(tx_report);
var map__132562__$1 = cljs.core.__destructure_map(map__132562);
var blocks = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__132562__$1,new cljs.core.Keyword(null,"blocks","blocks",-610462153));
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
