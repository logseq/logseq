goog.provide('frontend.handler.db_based.page');
/**
 * Returns a boolean indicating whether the new tag passes all valid checks.
 * When returning false, this fn also displays appropriate notifications to the user
 */
frontend.handler.db_based.page.valid_tag_QMARK_ = (function frontend$handler$db_based$page$valid_tag_QMARK_(repo,block,tag_entity){
try{logseq.outliner.validate.validate_unique_by_name_tag_and_block_type((frontend.db.get_db.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$1(repo) : frontend.db.get_db.call(null,repo)),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block),cljs.core.update.cljs$core$IFn$_invoke$arity$4(block,new cljs.core.Keyword("block","tags","block/tags",1814948340),cljs.core.fnil.cljs$core$IFn$_invoke$arity$2(cljs.core.conj,cljs.core.PersistentHashSet.EMPTY),tag_entity));

return true;
}catch (e65985){var e = e65985;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"notification","notification",-222338233),new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(cljs.core.ex_data(e)))){
var payload = new cljs.core.Keyword(null,"payload","payload",-383036092).cljs$core$IFn$_invoke$arity$1(cljs.core.ex_data(e));
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"message","message",-406056002).cljs$core$IFn$_invoke$arity$1(payload),new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(payload));

return false;
} else {
throw e;
}
}});
frontend.handler.db_based.page.add_tag = (function frontend$handler$db_based$page$add_tag(repo,block_id,tag_entity){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0()),(function (___40947__auto__){
return promesa.protocols._promise((cljs.core.truth_(frontend.handler.db_based.page.valid_tag_QMARK_(repo,(function (){var G__65986 = repo;
var G__65987 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$2 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$2(G__65986,G__65987) : frontend.db.entity.call(null,G__65986,G__65987));
})(),tag_entity))?frontend.handler.db_based.property.set_block_property_BANG_(block_id,new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(tag_entity)):null));
}));
}));
});
/**
 * Converts a Page to a Tag
 */
frontend.handler.db_based.page.convert_to_tag_BANG_ = (function frontend$handler$db_based$page$convert_to_tag_BANG_(page_entity){
if(cljs.core.truth_((function (){var G__65988 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page_entity);
var G__65989 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.class","Tag","logseq.class/Tag",-538902083),null], null), null);
return (frontend.db.page_exists_QMARK_.cljs$core$IFn$_invoke$arity$2 ? frontend.db.page_exists_QMARK_.cljs$core$IFn$_invoke$arity$2(G__65988,G__65989) : frontend.db.page_exists_QMARK_.call(null,G__65988,G__65989));
})())){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(["A tag with the name \"",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page_entity)),"\" already exists."].join(''),new cljs.core.Keyword(null,"warning","warning",-1685650671),false);
} else {
var txs = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [logseq.db.frontend.class$.build_new_class((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page_entity),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page_entity),new cljs.core.Keyword("block","created-at","block/created-at",1440015),new cljs.core.Keyword("block","created-at","block/created-at",1440015).cljs$core$IFn$_invoke$arity$1(page_entity)], null)),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page_entity),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329)], null)], null);
return frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.state.get_current_repo(),txs,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null));
}
});
frontend.handler.db_based.page.convert_tag_to_page_BANG_ = (function frontend$handler$db_based$page$convert_tag_to_page_BANG_(page_entity){
if(cljs.core.truth_((function (){var G__65991 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page_entity);
var G__65992 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329),null], null), null);
return (frontend.db.page_exists_QMARK_.cljs$core$IFn$_invoke$arity$2 ? frontend.db.page_exists_QMARK_.cljs$core$IFn$_invoke$arity$2(G__65991,G__65992) : frontend.db.page_exists_QMARK_.call(null,G__65991,G__65992));
})())){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(["A page with the name \"",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page_entity)),"\" already exists."].join(''),new cljs.core.Keyword(null,"warning","warning",-1685650671),false);
} else {
if(cljs.core.truth_(new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160).cljs$core$IFn$_invoke$arity$1(page_entity))){
return null;
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_tag_objects(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page_entity))),(function (objects){
return promesa.protocols._promise((function (){var convert_fn = (function frontend$handler$db_based$page$convert_tag_to_page_BANG__$_convert_fn(){
var page_txs = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page_entity),new cljs.core.Keyword("db","ident","db/ident",-737096)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page_entity),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Tag","logseq.class/Tag",-538902083)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page_entity),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329)], null)], null);
var obj_txs = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (obj){
var tags = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__65990_SHARP_){
var G__65993 = frontend.state.get_current_repo();
var G__65994 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(p1__65990_SHARP_);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$2 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$2(G__65993,G__65994) : frontend.db.entity.call(null,G__65993,G__65994));
}),new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(obj));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(obj),new cljs.core.Keyword("block","title","block/title",710445684),logseq.db.frontend.content.replace_tag_refs_with_page_refs(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(obj),tags)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(obj),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page_entity)], null)], null);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([objects], 0));
var txs = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(page_txs,obj_txs);
return frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.state.get_current_repo(),txs,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null));
});
return promesa.core.then.cljs$core$IFn$_invoke$arity$2((function (){var G__65995 = "Converting a tag to page also removes tags from any nodes that have that tag. Are you ok with that?";
var G__65996 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"convert-tag-to-page","convert-tag-to-page",-1819851675),new cljs.core.Keyword(null,"data-reminder","data-reminder",1296338874),new cljs.core.Keyword(null,"ok","ok",967785236)], null);
return (logseq.shui.ui.dialog_confirm_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_confirm_BANG_.cljs$core$IFn$_invoke$arity$2(G__65995,G__65996) : logseq.shui.ui.dialog_confirm_BANG_.call(null,G__65995,G__65996));
})(),convert_fn);
})());
}));
}));
}
}
});
/**
 * Creates a class page and provides class-specific error handling
 */
frontend.handler.db_based.page._LT_create_class_BANG_ = (function frontend$handler$db_based$page$_LT_create_class_BANG_(title,options){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(frontend.handler.common.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2(title,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(options,new cljs.core.Keyword(null,"class?","class?",385834571),true)),(function (e){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"notification","notification",-222338233),new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(cljs.core.ex_data(e)))){
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.ex_data(e),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.Keyword(null,"message","message",-406056002)], null)),cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.ex_data(e),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.Keyword(null,"type","type",1174270348)], null)));
} else {
}

throw e;
}));
});
frontend.handler.db_based.page.tag_on_chosen_handler = (function frontend$handler$db_based$page$tag_on_chosen_handler(chosen,chosen_result,class_QMARK_,edit_content,current_pos,last_pattern){
var tag = clojure.string.trim(chosen);
var edit_block = frontend.state.get_edit_block();
var create_opts = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"redirect?","redirect?",-1229259098),false], null);
if(cljs.core.truth_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(edit_block))){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((datascript.impl.entity.entity_QMARK_(chosen_result))?null:(cljs.core.truth_(class_QMARK_)?frontend.handler.db_based.page._LT_create_class_BANG_(tag,create_opts):frontend.handler.common.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2(tag,create_opts)))),(function (result){
return promesa.protocols._promise((cljs.core.truth_(class_QMARK_)?(function (){var tag_entity = (function (){var or__5002__auto__ = ((datascript.impl.entity.entity_QMARK_(chosen_result))?chosen_result:null);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return result;
}
})();
var hash_idx = clojure.string.last_index_of.cljs$core$IFn$_invoke$arity$2(cljs.core.subs.cljs$core$IFn$_invoke$arity$3(edit_content,(0),current_pos),last_pattern);
var add_tag_to_nearest_node_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(logseq.common.util.page_ref.right_brackets,logseq.common.util.safe_subs.cljs$core$IFn$_invoke$arity$3(edit_content,(hash_idx - (2)),hash_idx));
var nearest_node = (function (){var G__66004 = frontend.handler.editor.get_nearest_page();
if((G__66004 == null)){
return null;
} else {
return clojure.string.trim(G__66004);
}
})();
if(((add_tag_to_nearest_node_QMARK_) && ((!(clojure.string.blank_QMARK_(nearest_node)))))){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.db.get_case_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_case_page.cljs$core$IFn$_invoke$arity$1(nearest_node) : frontend.db.get_case_page.call(null,nearest_node))),(function (node_ent){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(node_ent)?null:frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0())),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var or__5002__auto__ = node_ent;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (frontend.db.get_case_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_case_page.cljs$core$IFn$_invoke$arity$1(nearest_node) : frontend.db.get_case_page.call(null,nearest_node));
}
})()),(function (node_ent_SINGLEQUOTE_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.db_based.page.add_tag(frontend.state.get_current_repo(),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(node_ent_SINGLEQUOTE_),tag_entity)),(function (___$1){
return promesa.protocols._promise(frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$1(["Added tag ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(tag_entity)], 0))," to ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(node_ent_SINGLEQUOTE_)], 0))].join('')));
}));
}));
}));
}));
}));
} else {
return frontend.handler.db_based.page.add_tag(frontend.state.get_current_repo(),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(edit_block),tag_entity);
}
})():null));
}));
}));
} else {
return null;
}
});

//# sourceMappingURL=frontend.handler.db_based.page.js.map
