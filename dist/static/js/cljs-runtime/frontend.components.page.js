goog.provide('frontend.components.page');
goog.scope(function(){
  frontend.components.page.goog$module$goog$object = goog.module.get('goog.object');
});
frontend.components.page.get_page_name = (function frontend$components$page$get_page_name(state){
var route_match = cljs.core.first(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state));
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(route_match,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"parameters","parameters",-1229919748),new cljs.core.Keyword(null,"path","path",-188191168),new cljs.core.Keyword(null,"name","name",1843675177)], null));
});
if(frontend.util.web_platform_QMARK_){
/**
 * Return string block uuid for matching :name and :block-route-name params or
 *  nil if not found
 */
frontend.components.page.get_block_uuid_by_block_route_name = (function frontend$components$page$get_block_uuid_by_block_route_name(state){
var temp__5804__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.first(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state)),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"parameters","parameters",-1229919748),new cljs.core.Keyword(null,"path","path",-188191168),new cljs.core.Keyword(null,"block-route-name","block-route-name",1558267328)], null));
if(cljs.core.truth_(temp__5804__auto__)){
var route_name = temp__5804__auto__;
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(frontend.db.model.get_block_by_page_name_and_block_route_name(frontend.state.get_current_repo(),frontend.components.page.get_page_name(state),route_name)));
} else {
return null;
}
});
} else {
frontend.components.page.get_block_uuid_by_block_route_name = cljs.core.constantly(null);
}
frontend.components.page.open_root_block_BANG_ = (function frontend$components$page$open_root_block_BANG_(state){
var vec__133577 = new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133577,(0),null);
var block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133577,(1),null);
var ___$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133577,(2),null);
var sidebar_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133577,(3),null);
var preview_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133577,(4),null);
if(cljs.core.truth_((function (){var and__5000__auto__ = (function (){var or__5002__auto__ = preview_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"home","home",-74557309),null,new cljs.core.Keyword(null,"all-journals","all-journals",-347015095),null], null), null),frontend.state.get_current_route())));
}
})();
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(sidebar_QMARK_);
} else {
return and__5000__auto__;
}
})())){
if(((clojure.string.blank_QMARK_(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block))) && (cljs.core.not(preview_QMARK_)))){
return (frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$2(block,new cljs.core.Keyword(null,"max","max",61366548)) : frontend.handler.editor.edit_block_BANG_.call(null,block,new cljs.core.Keyword(null,"max","max",61366548)));
} else {
return null;
}
} else {
return null;
}
});
frontend.components.page.page_blocks_inner = rum.core.lazy_build(rum.core.build_defc,(function (page_e,blocks,config,sidebar_QMARK_,_preview_QMARK_,_block_uuid){
if(cljs.core.truth_(page_e)){
var hiccup = frontend.components.block.__GT_hiccup(blocks,config,cljs.core.PersistentArrayMap.EMPTY);
return daiquiri.core.create_element("div",{'style':{'minHeight':(29)},'className':"page-blocks-inner"},[rum.core.with_key(frontend.components.content.content(cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page_e)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"hiccup","hiccup",1218876238),hiccup,new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672),sidebar_QMARK_], null)),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page_e)),"-hiccup"].join(''))]);
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"did-mount","did-mount",918232960),(function (state){
frontend.components.page.open_root_block_BANG_(state);

return state;
})], null)], null),"frontend.components.page/page-blocks-inner");
frontend.components.page.add_button = rum.core.lazy_build(rum.core.build_defc,(function (block,container_id){
var _STAR_ref = rum.core.use_ref(null);
var has_children_QMARK_ = new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(block);
return daiquiri.core.create_element("div",{'data-blockId':new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),'ref':_STAR_ref,'onClick':(function (e){
frontend.util.stop(e);

frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","container-id","editor/container-id",1915616583),container_id);

return frontend.handler.editor.api_insert_new_block_BANG_("",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)], null));
}),'onMouseOver':(function (){
var ref = rum.core.deref(_STAR_ref);
var prev_block = frontend.util.get_prev_block_non_collapsed.cljs$core$IFn$_invoke$arity$2(rum.core.deref(_STAR_ref),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"up-down?","up-down?",1084256379),true], null));
if(cljs.core.truth_((function (){var and__5000__auto__ = prev_block;
if(cljs.core.truth_(and__5000__auto__)){
return dommy.core.has_class_QMARK_(prev_block,"is-blank");
} else {
return and__5000__auto__;
}
})())){
return dommy.core.add_class_BANG_.cljs$core$IFn$_invoke$arity$2(ref,"opacity-0");
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = prev_block;
if(cljs.core.truth_(and__5000__auto__)){
return has_children_QMARK_;
} else {
return and__5000__auto__;
}
})())){
return dommy.core.add_class_BANG_.cljs$core$IFn$_invoke$arity$2(ref,"opacity-50");
} else {
return dommy.core.add_class_BANG_.cljs$core$IFn$_invoke$arity$2(ref,"opacity-100");

}
}
}),'onMouseLeave':(function (){
dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$2(rum.core.deref(_STAR_ref),"opacity-50");

return dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$2(rum.core.deref(_STAR_ref),"opacity-100");
}),'onKeyDown':(function (e){
frontend.util.stop(e);

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Enter",frontend.util.ekey(e))){
frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","container-id","editor/container-id",1915616583),container_id);

return frontend.handler.editor.api_insert_new_block_BANG_("",block);
} else {
return null;
}
}),'tabIndex':(0),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 11, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ls-block","block-add-button","flex-1","flex-col","rounded-sm","cursor-text","transition-opacity","ease-in","duration-100","!py-0",(cljs.core.truth_(has_children_QMARK_)?"opacity-0":"opacity-50")], null))},[daiquiri.core.create_element("div",{'className':"flex flex-row"},[daiquiri.core.create_element("div",{'style':{'height':(28),'marginLeft':(22)},'className':"flex items-center"},[daiquiri.core.create_element("span",{'className':"bullet-container"},[daiquiri.core.create_element("span",{'className':"bullet"},null)])])])]);
}),null,"frontend.components.page/add-button");
frontend.components.page.page_blocks_cp = rum.core.lazy_build(rum.core.build_defcs,(function (state,block_STAR_,p__133615){
var map__133617 = p__133615;
var map__133617__$1 = cljs.core.__destructure_map(map__133617);
var config = map__133617__$1;
var sidebar_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133617__$1,new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672));
var whiteboard_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133617__$1,new cljs.core.Keyword(null,"whiteboard?","whiteboard?",-1968190788));
return daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block_STAR_);
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
var block = (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(id) : frontend.db.sub_block.call(null,id));
var block_id = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
var block_QMARK_ = cljs.core.not((frontend.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(block) : frontend.db.page_QMARK_.call(null,block)));
var children = new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(block);
var children__$1 = (cljs.core.truth_((logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(block) : logseq.db.class_QMARK_.call(null,block)))?cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (b){
return cljs.core.contains_QMARK_(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(b))),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block));
}),children):(cljs.core.truth_((logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1(block) : logseq.db.property_QMARK_.call(null,block)))?cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (b){
return (!((cljs.core.get.cljs$core$IFn$_invoke$arity$2(b,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(block)) == null)));
}),children):children
));
if(cljs.core.truth_((function (){var and__5000__auto__ = (!(block_QMARK_));
if(and__5000__auto__){
var and__5000__auto____$1 = (!(frontend.config.publishing_QMARK_));
if(and__5000__auto____$1){
var and__5000__auto____$2 = cljs.core.empty_QMARK_(children__$1);
if(and__5000__auto____$2){
return block;
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
return frontend.components.page.add_button(block,new cljs.core.Keyword(null,"container-id","container-id",1274665684).cljs$core$IFn$_invoke$arity$1(config));
} else {
var document_mode_QMARK_ = frontend.state.sub(new cljs.core.Keyword("document","mode?","document/mode?",-994203479));
var hiccup_config = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)),new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword(null,"block?","block?",1102479923),block_QMARK_,new cljs.core.Keyword(null,"editor-box","editor-box",708759870),frontend.components.editor.box,new cljs.core.Keyword("document","mode?","document/mode?",-994203479),document_mode_QMARK_], null),config], 0));
var config__$1 = frontend.handler.common.config_with_document_mode(hiccup_config);
var blocks = ((block_QMARK_)?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block], null):(frontend.db.sort_by_order.cljs$core$IFn$_invoke$arity$2 ? frontend.db.sort_by_order.cljs$core$IFn$_invoke$arity$2(children__$1,block) : frontend.db.sort_by_order.call(null,children__$1,block)));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.relative","div.relative",430334058),frontend.components.page.page_blocks_inner(block,blocks,config__$1,sidebar_QMARK_,whiteboard_QMARK_,block_id),frontend.components.page.add_button(block,new cljs.core.Keyword(null,"container-id","container-id",1274665684).cljs$core$IFn$_invoke$arity$1(config__$1))], null);

}
} else {
return null;
}
})());
}),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"will-mount","will-mount",-434633071),(function (state){
if(cljs.core.truth_(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0())){
} else {
var page_e_134476 = cljs.core.first(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state));
var page_name_134477 = new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(page_e_134476);
if(cljs.core.truth_((function (){var and__5000__auto__ = page_name_134477;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = (frontend.db.journal_page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.db.journal_page_QMARK_.cljs$core$IFn$_invoke$arity$1(page_name_134477) : frontend.db.journal_page_QMARK_.call(null,page_name_134477));
if(cljs.core.truth_(and__5000__auto____$1)){
return (frontend.date.journal_title__GT_int(page_name_134477) >= frontend.date.journal_title__GT_int(frontend.date.today()));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("journal","insert-template","journal/insert-template",-1273735332),page_name_134477], null));
} else {
}
}

return state;
})], null)], null),"frontend.components.page/page-blocks-cp");
frontend.components.page.today_queries = rum.core.lazy_build(rum.core.build_defc,(function (repo,today_QMARK_,sidebar_QMARK_){
if(cljs.core.truth_((function (){var and__5000__auto__ = today_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(sidebar_QMARK_);
} else {
return and__5000__auto__;
}
})())){
var queries = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.state.sub_config.cljs$core$IFn$_invoke$arity$1(repo),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"default-queries","default-queries",1508774260),new cljs.core.Keyword(null,"journals","journals",-1915761091)], null));
if(cljs.core.seq(queries)){
return daiquiri.core.create_element("div",{'id':"today-queries"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$page$iter__133636(s__133637){
return (new cljs.core.LazySeq(null,(function (){
var s__133637__$1 = s__133637;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__133637__$1);
if(temp__5804__auto__){
var s__133637__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__133637__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__133637__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__133639 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__133638 = (0);
while(true){
if((i__133638 < size__5479__auto__)){
var query = cljs.core._nth(c__5478__auto__,i__133638);
cljs.core.chunk_append(b__133639,(function (){var query_SINGLEQUOTE_ = (cljs.core.truth_(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0())?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(query,new cljs.core.Keyword(null,"collapsed?","collapsed?",-1661420674),true):query);
return rum.core.with_key(frontend.ui.catch_error(frontend.ui.component_error("Failed default query:",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"content","content",15833224),cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([query_SINGLEQUOTE_], 0))], null)),frontend.components.query.custom_query(frontend.components.block.wrap_query_components(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"attr","attr",-604132353),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"mt-10"], null),new cljs.core.Keyword(null,"editor-box","editor-box",708759870),frontend.components.editor.box,new cljs.core.Keyword(null,"page","page",849072397),frontend.components.page.page_cp], null)),query_SINGLEQUOTE_)),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(repo),"-custom-query-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"query","query",-1288509510).cljs$core$IFn$_invoke$arity$1(query_SINGLEQUOTE_))].join(''));
})());

var G__134478 = (i__133638 + (1));
i__133638 = G__134478;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__133639),frontend$components$page$iter__133636(cljs.core.chunk_rest(s__133637__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__133639),null);
}
} else {
var query = cljs.core.first(s__133637__$2);
return cljs.core.cons((function (){var query_SINGLEQUOTE_ = (cljs.core.truth_(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0())?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(query,new cljs.core.Keyword(null,"collapsed?","collapsed?",-1661420674),true):query);
return rum.core.with_key(frontend.ui.catch_error(frontend.ui.component_error("Failed default query:",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"content","content",15833224),cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([query_SINGLEQUOTE_], 0))], null)),frontend.components.query.custom_query(frontend.components.block.wrap_query_components(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"attr","attr",-604132353),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"mt-10"], null),new cljs.core.Keyword(null,"editor-box","editor-box",708759870),frontend.components.editor.box,new cljs.core.Keyword(null,"page","page",849072397),frontend.components.page.page_cp], null)),query_SINGLEQUOTE_)),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(repo),"-custom-query-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"query","query",-1288509510).cljs$core$IFn$_invoke$arity$1(query_SINGLEQUOTE_))].join(''));
})(),frontend$components$page$iter__133636(cljs.core.rest(s__133637__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(queries);
})())]);
} else {
return null;
}
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.page/today-queries");
frontend.components.page.tagged_pages = rum.core.lazy_build(rum.core.build_defc,(function (repo,tag,tag_title){
var vec__133643 = rum.core.use_state(null);
var pages = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133643,(0),null);
var set_pages_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133643,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_tag_pages(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(tag))),(function (result){
return promesa.protocols._promise((set_pages_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_pages_BANG_.cljs$core$IFn$_invoke$arity$1(result) : set_pages_BANG_.call(null,result)));
}));
}));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [tag], null));

if(cljs.core.seq(pages)){
return daiquiri.core.create_element("div",{'className':"references page-tags flex-1 flex-row"},[daiquiri.core.create_element("div",{'className':"content"},[frontend.ui.foldable(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h2.font-bold.opacity-50","h2.font-bold.opacity-50",1276193375),(frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("Pages tagged with \"%s\"",tag_title) : frontend.util.format.call(null,"Pages tagged with \"%s\"",tag_title))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ul.mt-2","ul.mt-2",-237871742),(function (){var iter__5480__auto__ = (function frontend$components$page$iter__133691(s__133692){
return (new cljs.core.LazySeq(null,(function (){
var s__133692__$1 = s__133692;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__133692__$1);
if(temp__5804__auto__){
var s__133692__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__133692__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__133692__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__133694 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__133693 = (0);
while(true){
if((i__133693 < size__5479__auto__)){
var page = cljs.core._nth(c__5478__auto__,i__133693);
cljs.core.chunk_append(b__133694,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),["tagged-page-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page))].join('')], null),frontend.components.block.page_cp(cljs.core.PersistentArrayMap.EMPTY,page)], null));

var G__134479 = (i__133693 + (1));
i__133693 = G__134479;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__133694),frontend$components$page$iter__133691(cljs.core.chunk_rest(s__133692__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__133694),null);
}
} else {
var page = cljs.core.first(s__133692__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),["tagged-page-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page))].join('')], null),frontend.components.block.page_cp(cljs.core.PersistentArrayMap.EMPTY,page)], null),frontend$components$page$iter__133691(cljs.core.rest(s__133692__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","title","block/title",710445684),pages));
})()], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"default-collapsed?","default-collapsed?",-1350393823),false], null))])]);
} else {
return null;
}
}),null,"frontend.components.page/tagged-pages");
frontend.components.page.page_title_editor = rum.core.lazy_build(rum.core.build_defc,(function (page,p__133701){
var map__133702 = p__133701;
var map__133702__$1 = cljs.core.__destructure_map(map__133702);
var _STAR_input_value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133702__$1,new cljs.core.Keyword(null,"*input-value","*input-value",1906486090));
var _STAR_title_value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133702__$1,new cljs.core.Keyword(null,"*title-value","*title-value",1930859070));
var _STAR_edit_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133702__$1,new cljs.core.Keyword(null,"*edit?","*edit?",1879943992));
var untitled_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133702__$1,new cljs.core.Keyword(null,"untitled?","untitled?",1662295877));
var page_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133702__$1,new cljs.core.Keyword(null,"page-name","page-name",974981762));
var old_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133702__$1,new cljs.core.Keyword(null,"old-name","old-name",1289683869));
var whiteboard_page_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133702__$1,new cljs.core.Keyword(null,"whiteboard-page?","whiteboard-page?",1626270426));
var input_ref = rum.core.create_ref();
var tag_idents = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(page));
var collide_QMARK_ = (function (){
var and__5000__auto__ = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2((frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1 ? frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1(page_name) : frontend.util.page_name_sanity_lc.call(null,page_name)),(function (){var G__133704 = cljs.core.deref(_STAR_title_value);
return (frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1 ? frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1(G__133704) : frontend.util.page_name_sanity_lc.call(null,G__133704));
})());
if(and__5000__auto__){
var and__5000__auto____$1 = (frontend.db.page_exists_QMARK_.cljs$core$IFn$_invoke$arity$2 ? frontend.db.page_exists_QMARK_.cljs$core$IFn$_invoke$arity$2(page_name,tag_idents) : frontend.db.page_exists_QMARK_.call(null,page_name,tag_idents));
if(cljs.core.truth_(and__5000__auto____$1)){
var G__133705 = cljs.core.deref(_STAR_title_value);
var G__133706 = tag_idents;
return (frontend.db.page_exists_QMARK_.cljs$core$IFn$_invoke$arity$2 ? frontend.db.page_exists_QMARK_.cljs$core$IFn$_invoke$arity$2(G__133705,G__133706) : frontend.db.page_exists_QMARK_.call(null,G__133705,G__133706));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
});
var rollback_fn = (function (){
var old_name__$1 = (cljs.core.truth_(untitled_QMARK_)?"":old_name);
cljs.core.reset_BANG_(_STAR_title_value,old_name__$1);

frontend.components.page.goog$module$goog$object.set(rum.core.deref(input_ref),"value",old_name__$1);

cljs.core.reset_BANG_(_STAR_edit_QMARK_,true);

return rum.core.deref(input_ref).focus();
});
var blur_fn = (function (e){
if(logseq.common.util.wrapped_by_quotes_QMARK_(cljs.core.deref(_STAR_title_value))){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_title_value,logseq.common.util.unquote_string);

frontend.components.page.goog$module$goog$object.set(rum.core.deref(input_ref),"value",cljs.core.deref(_STAR_title_value));
} else {
}

if(cljs.core.truth_((function (){var or__5002__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(old_name,cljs.core.deref(_STAR_title_value));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = whiteboard_page_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return clojure.string.blank_QMARK_(cljs.core.deref(_STAR_title_value));
} else {
return and__5000__auto__;
}
}
})())){
cljs.core.reset_BANG_(_STAR_edit_QMARK_,false);
} else {
if(clojure.string.blank_QMARK_(cljs.core.deref(_STAR_title_value))){
if(cljs.core.truth_(untitled_QMARK_)){
} else {
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("page","illegal-page-name","page/illegal-page-name",249938697)], 0)),new cljs.core.Keyword(null,"warning","warning",-1685650671));
}

rollback_fn();
} else {
if(cljs.core.truth_(collide_QMARK_())){
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("page","page-already-exists","page/page-already-exists",953137327),cljs.core.deref(_STAR_title_value)], 0)),new cljs.core.Keyword(null,"error","error",-978969032));

rollback_fn();
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = frontend.date.valid_journal_title_QMARK_(cljs.core.deref(_STAR_title_value));
if(and__5000__auto__){
return whiteboard_page_QMARK_;
} else {
return and__5000__auto__;
}
})())){
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("page","whiteboard-to-journal-error","page/whiteboard-to-journal-error",-639341379)], 0)),new cljs.core.Keyword(null,"error","error",-978969032));

rollback_fn();
} else {
promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.page.rename_BANG_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page),cljs.core.deref(_STAR_title_value))),(function (___41611__auto__){
return promesa.protocols._promise(setTimeout((function (){
return cljs.core.reset_BANG_(_STAR_edit_QMARK_,false);
}),(100)));
}));
}));

}
}
}
}

return frontend.util.stop(e);
});
return daiquiri.core.create_element("input",{'placeholder':(cljs.core.truth_(untitled_QMARK_)?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"untitled","untitled",301293696)], 0)):null),'ref':input_ref,'autoFocus':true,'autoComplete':((frontend.util.chrome_QMARK_())?"chrome-off":"off"),'value':rum.core.react(_STAR_input_value),'type':"text",'onBlur':blur_fn,'className':"edit-input p-0 outline-none focus:outline-none no-ring",'style':{'width':"100%",'fontWeight':"inherit"},'onKeyUp':(function (e){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((27),e.keyCode)){
cljs.core.reset_BANG_(_STAR_title_value,old_name);

return cljs.core.reset_BANG_(_STAR_edit_QMARK_,false);
} else {
return null;
}
}),'onKeyDown':(function (e){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.components.page.goog$module$goog$object.get(e,"key"),"Enter")){
return blur_fn(e);
} else {
return null;
}
}),'onChange':rum.core.mark_sync_update((function (e){
var value = frontend.util.evalue(e);
cljs.core.reset_BANG_(_STAR_title_value,clojure.string.trim(value));

return cljs.core.reset_BANG_(_STAR_input_value,value);
})),'onFocus':(function (){
if(cljs.core.truth_(untitled_QMARK_)){
return cljs.core.reset_BANG_(_STAR_title_value,"");
} else {
return null;
}
})},[]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.page/page-title-editor");
frontend.components.page.page_title_cp = rum.core.lazy_build(rum.core.build_defcs,(function (state,page,p__133715){
var map__133716 = p__133715;
var map__133716__$1 = cljs.core.__destructure_map(map__133716);
var fmt_journal_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133716__$1,new cljs.core.Keyword(null,"fmt-journal?","fmt-journal?",-134242319));
var preview_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133716__$1,new cljs.core.Keyword(null,"preview?","preview?",590561578));
if(cljs.core.truth_(page)){
var page__$1 = (function (){var G__133717 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page);
return (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(G__133717) : frontend.db.sub_block.call(null,G__133717));
})();
var title = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page__$1);
if(cljs.core.truth_(title)){
var repo = frontend.state.get_current_repo();
var journal_QMARK_ = (logseq.db.journal_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.journal_QMARK_.cljs$core$IFn$_invoke$arity$1(page__$1) : logseq.db.journal_QMARK_.call(null,page__$1));
var _STAR_title_value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.components.page","title-value","frontend.components.page/title-value",2110227395));
var _STAR_edit_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.components.page","edit?","frontend.components.page/edit?",258127371));
var _STAR_input_value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.components.page","input-value","frontend.components.page/input-value",-1426574410));
var hls_page_QMARK_ = frontend.extensions.pdf.utils.hls_file_QMARK_(title);
var whiteboard_page_QMARK_ = frontend.db.model.whiteboard_page_QMARK_(page__$1);
var untitled_QMARK_ = (function (){var and__5000__auto__ = whiteboard_page_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.parse_uuid(title);
} else {
return and__5000__auto__;
}
})();
var title__$1 = (cljs.core.truth_(hls_page_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.asset-ref","a.asset-ref",-1346816545),frontend.extensions.pdf.utils.fix_local_asset_pagename(title)], null):(cljs.core.truth_(fmt_journal_QMARK_)?frontend.date.journal_title__GT_custom_format(title):title));
var old_name = title__$1;
return daiquiri.core.create_element("div",{'className':"ls-page-title flex flex-1 flex-row flex-wrap w-full relative items-center gap-2"},[daiquiri.core.create_element("h1",{'onPointerDown':(function (e){
if(frontend.util.right_click_QMARK_(e)){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("page-title","context","page-title/context",1788836745),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page__$1),new cljs.core.Keyword(null,"page-entity","page-entity",1168837897),page__$1], null));
} else {
return null;
}
}),'onClick':(function (e){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(e.target.nodeName,"INPUT")){
return null;
} else {
e.preventDefault();

if(cljs.core.truth_(frontend.components.page.goog$module$goog$object.get(e,"shiftKey"))){
return frontend.state.sidebar_add_block_BANG_(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page__$1),new cljs.core.Keyword(null,"page","page",849072397));
} else {
if(((cljs.core.not(hls_page_QMARK_)) && (((cljs.core.not(journal_QMARK_)) && ((((!(frontend.config.publishing_QMARK_))) && (cljs.core.not((logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1(page__$1) : logseq.db.built_in_QMARK_.call(null,page__$1)))))))))){
cljs.core.reset_BANG_(_STAR_input_value,(cljs.core.truth_(untitled_QMARK_)?"":old_name));

return cljs.core.reset_BANG_(_STAR_edit_QMARK_,true);
} else {
return null;
}
}
}
}),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["page-title","flex-1","cursor-pointer","gap-1",(cljs.core.truth_(whiteboard_page_QMARK_)?null:"title")], null))},[(cljs.core.truth_(cljs.core.deref(_STAR_edit_QMARK_))?frontend.components.page.page_title_editor(page__$1,new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"*title-value","*title-value",1930859070),_STAR_title_value,new cljs.core.Keyword(null,"*edit?","*edit?",1879943992),_STAR_edit_QMARK_,new cljs.core.Keyword(null,"*input-value","*input-value",1906486090),_STAR_input_value,new cljs.core.Keyword(null,"page-name","page-name",974981762),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page__$1),new cljs.core.Keyword(null,"old-name","old-name",1289683869),old_name,new cljs.core.Keyword(null,"untitled?","untitled?",1662295877),untitled_QMARK_,new cljs.core.Keyword(null,"whiteboard-page?","whiteboard-page?",1626270426),whiteboard_page_QMARK_,new cljs.core.Keyword(null,"preview?","preview?",590561578),preview_QMARK_], null)):daiquiri.core.create_element("span",{'onClick':(function (){
if(((cljs.core.not(preview_QMARK_)) && (cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"home","home",-74557309),null,new cljs.core.Keyword(null,"all-journals","all-journals",-347015095),null], null), null),cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.state.get_route_match(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"data","data",-232669377),new cljs.core.Keyword(null,"name","name",1843675177)], null)))))){
return frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page__$1));
} else {
return null;
}
}),'data-value':cljs.core.deref(_STAR_input_value),'data-ref':new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page__$1),'style':{'opacity':(cljs.core.truth_(cljs.core.deref(_STAR_edit_QMARK_))?(0):null)},'className':"title block"},[(function (){var nested_QMARK_ = ((clojure.string.includes_QMARK_(title__$1,logseq.common.util.page_ref.left_brackets)) && (clojure.string.includes_QMARK_(title__$1,logseq.common.util.page_ref.right_brackets)));
if(cljs.core.truth_(untitled_QMARK_)){
var attrs133741 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"untitled","untitled",301293696)], 0));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs133741))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["opacity-50"], null)], null),attrs133741], 0))):{'className':"opacity-50"}),((cljs.core.map_QMARK_(attrs133741))?null:[daiquiri.interpreter.interpret(attrs133741)]));
} else {
if(nested_QMARK_){
return daiquiri.interpreter.interpret(frontend.components.block.map_inline(cljs.core.PersistentArrayMap.EMPTY,logseq.graph_parser.mldoc.inline__GT_edn(title__$1,frontend.format.mldoc.get_default_config(cljs.core.get.cljs$core$IFn$_invoke$arity$3(page__$1,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089))))));
} else {
return daiquiri.interpreter.interpret(title__$1);

}
}
})()]))])]);
} else {
return null;
}
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query,rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.components.page","edit?","frontend.components.page/edit?",258127371)),rum.core.local.cljs$core$IFn$_invoke$arity$2("",new cljs.core.Keyword("frontend.components.page","input-value","frontend.components.page/input-value",-1426574410)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
var page = cljs.core.first(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state));
var title = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page);
var _STAR_title_value = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(title);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(state,new cljs.core.Keyword("frontend.components.page","title-value","frontend.components.page/title-value",2110227395),_STAR_title_value);
})], null)], null),"frontend.components.page/page-title-cp");
frontend.components.page.db_page_title_actions = rum.core.lazy_build(rum.core.build_defc,(function (page){
return daiquiri.core.create_element("div",{'className':"ls-page-title-actions"},[(function (){var attrs133761 = (cljs.core.truth_(new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285).cljs$core$IFn$_invoke$arity$1((function (){var G__133762 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__133762) : frontend.db.entity.call(null,G__133762));
})()))?null:(function (){var G__133763 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"class","class",-2030961996),"px-2 py-0 h-6 text-xs text-muted-foreground",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","new-property","editor/new-property",-1370252491),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"property-key","property-key",972402246),"Icon",new cljs.core.Keyword(null,"block","block",664686210),page,new cljs.core.Keyword(null,"target","target",253001721),e.target], null)], null));
})], null);
var G__133764 = "Add icon";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__133763,G__133764) : logseq.shui.ui.button.call(null,G__133763,G__133764));
})());
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs133761))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","items-center","gap-2"], null)], null),attrs133761], 0))):{'className':"flex flex-row items-center gap-2"}),((cljs.core.map_QMARK_(attrs133761))?[daiquiri.interpreter.interpret((function (){var G__133778 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"class","class",-2030961996),"px-2 py-0 h-6 text-xs text-muted-foreground",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
if(cljs.core.truth_((logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.property_QMARK_.call(null,page)))){
var G__133780 = e.target;
var G__133781 = (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.ls-property-dropdown","div.ls-property-dropdown",-263769697),frontend.components.property.config.property_dropdown(page,null,cljs.core.PersistentArrayMap.EMPTY)], null);
});
var G__133782 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"center","center",-748944368)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__133780,G__133781,G__133782) : logseq.shui.ui.popup_show_BANG_.call(null,G__133780,G__133781,G__133782));
} else {
var opts = (function (){var G__133783 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"block","block",664686210),page,new cljs.core.Keyword(null,"target","target",253001721),e.target], null);
if(cljs.core.truth_((logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.class_QMARK_.call(null,page)))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__133783,new cljs.core.Keyword(null,"class-schema?","class-schema?",508813900),true);
} else {
return G__133783;
}
})();
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","new-property","editor/new-property",-1370252491),opts], null));
}
})], null);
var G__133779 = (cljs.core.truth_((logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.class_QMARK_.call(null,page)))?"Add tag property":(cljs.core.truth_((logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.property_QMARK_.call(null,page)))?"Configure":"Set property"
));
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__133778,G__133779) : logseq.shui.ui.button.call(null,G__133778,G__133779));
})())]:[daiquiri.interpreter.interpret(attrs133761),daiquiri.interpreter.interpret((function (){var G__133793 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"class","class",-2030961996),"px-2 py-0 h-6 text-xs text-muted-foreground",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
if(cljs.core.truth_((logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.property_QMARK_.call(null,page)))){
var G__133796 = e.target;
var G__133797 = (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.ls-property-dropdown","div.ls-property-dropdown",-263769697),frontend.components.property.config.property_dropdown(page,null,cljs.core.PersistentArrayMap.EMPTY)], null);
});
var G__133798 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"center","center",-748944368)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__133796,G__133797,G__133798) : logseq.shui.ui.popup_show_BANG_.call(null,G__133796,G__133797,G__133798));
} else {
var opts = (function (){var G__133799 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"block","block",664686210),page,new cljs.core.Keyword(null,"target","target",253001721),e.target], null);
if(cljs.core.truth_((logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.class_QMARK_.call(null,page)))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__133799,new cljs.core.Keyword(null,"class-schema?","class-schema?",508813900),true);
} else {
return G__133799;
}
})();
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","new-property","editor/new-property",-1370252491),opts], null));
}
})], null);
var G__133794 = (cljs.core.truth_((logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.class_QMARK_.call(null,page)))?"Add tag property":(cljs.core.truth_((logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.property_QMARK_.call(null,page)))?"Configure":"Set property"
));
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__133793,G__133794) : logseq.shui.ui.button.call(null,G__133793,G__133794));
})())]));
})()]);
}),null,"frontend.components.page/db-page-title-actions");
frontend.components.page.db_page_title = rum.core.lazy_build(rum.core.build_defc,(function (page,whiteboard_page_QMARK_,sidebar_QMARK_,container_id){
var with_actions_QMARK_ = (!(frontend.config.publishing_QMARK_));
return daiquiri.core.create_element("div",{'data-testid':"page title",'onPointerDown':(function (e){
if(frontend.util.right_click_QMARK_(e)){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("page-title","context","page-title/context",1788836745),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page),new cljs.core.Keyword(null,"page-entity","page-entity",1168837897),page], null));
} else {
return null;
}
}),'onClick':(function (e){
if(cljs.core.truth_((function (){var G__133807 = e;
var G__133807__$1 = (((G__133807 == null))?null:G__133807.target);
if((G__133807__$1 == null)){
return null;
} else {
return G__133807__$1.closest(".ls-properties-area");
}
})())){
return null;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(e.target.nodeName,"INPUT")){
return null;
} else {
e.preventDefault();

if(cljs.core.truth_(frontend.components.page.goog$module$goog$object.get(e,"shiftKey"))){
return frontend.state.sidebar_add_block_BANG_(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page),new cljs.core.Keyword(null,"page","page",849072397));
} else {
return null;
}
}
}
}),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ls-page-title","flex","flex-1","w-full","content","items-start","title",(cljs.core.truth_(whiteboard_page_QMARK_)?null:"title")], null))},[daiquiri.core.create_element("div",{'className':"w-full relative"},[frontend.components.block.block_container(new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"page-title?","page-title?",534381078),true,new cljs.core.Keyword(null,"page-title-actions-cp","page-title-actions-cp",-1825610797),((((with_actions_QMARK_) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(frontend.state.get_edit_block()),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page)))))?frontend.components.page.db_page_title_actions:null),new cljs.core.Keyword(null,"hide-title?","hide-title?",1631018350),sidebar_QMARK_,new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672),sidebar_QMARK_,new cljs.core.Keyword(null,"hide-children?","hide-children?",-2104598603),true,new cljs.core.Keyword(null,"container-id","container-id",1274665684),container_id,new cljs.core.Keyword(null,"show-tag-and-property-classes?","show-tag-and-property-classes?",-152227272),true,new cljs.core.Keyword(null,"from-journals?","from-journals?",-483357615),cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"home","home",-74557309),null,new cljs.core.Keyword(null,"all-journals","all-journals",-347015095),null], null), null),cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.state.get_route_match(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"data","data",-232669377),new cljs.core.Keyword(null,"name","name",1843675177)], null)))], null),page)])]);
}),null,"frontend.components.page/db-page-title");
frontend.components.page.page_mouse_over = (function frontend$components$page$page_mouse_over(e,_STAR_control_show_QMARK_,_STAR_all_collapsed_QMARK_){
frontend.util.stop(e);

cljs.core.reset_BANG_(_STAR_control_show_QMARK_,true);

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor._LT_all_blocks_with_level(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"collapse?","collapse?",720716709),true], null))),(function (blocks){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.empty_QMARK_(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (b){
return frontend.handler.editor.collapsable_QMARK_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(b));
}),blocks))),(function (all_collapsed_QMARK_){
return promesa.protocols._promise(cljs.core.reset_BANG_(_STAR_all_collapsed_QMARK_,all_collapsed_QMARK_));
}));
}));
}));
});
frontend.components.page.page_mouse_leave = (function frontend$components$page$page_mouse_leave(e,_STAR_control_show_QMARK_){
frontend.util.stop(e);

return cljs.core.reset_BANG_(_STAR_control_show_QMARK_,false);
});
frontend.components.page.page_blocks_collapse_control = rum.core.lazy_build(rum.core.build_defcs,(function (state,title,_STAR_control_show_QMARK_,_STAR_all_collapsed_QMARK_){
return daiquiri.core.create_element("a",{'id':["control-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(title)].join(''),'onClick':(function (event){
frontend.util.stop(event);

if(cljs.core.truth_(cljs.core.deref(_STAR_all_collapsed_QMARK_))){
frontend.handler.editor.expand_all_BANG_.cljs$core$IFn$_invoke$arity$0();
} else {
frontend.handler.editor.collapse_all_BANG_.cljs$core$IFn$_invoke$arity$0();
}

return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_all_collapsed_QMARK_,cljs.core.not);
}),'className':"page-blocks-collapse-control"},[daiquiri.core.create_element("span",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["mt-6",(cljs.core.truth_(cljs.core.deref(_STAR_control_show_QMARK_))?"control-show cursor-pointer":"control-hide")], null))},[frontend.ui.rotating_arrow(cljs.core.deref(_STAR_all_collapsed_QMARK_))])]);
}),null,"frontend.components.page/page-blocks-collapse-control");
frontend.components.page.get_path_page_name = (function frontend$components$page$get_path_page_name(state,page_name){
var or__5002__auto__ = page_name;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = frontend.components.page.get_block_uuid_by_block_route_name(state);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = frontend.components.page.get_page_name(state);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
return frontend.state.get_current_page();
}
}
}
});
frontend.components.page.get_page_entity = (function frontend$components$page$get_page_entity(page_name){
if(cljs.core.uuid_QMARK_(page_name)){
var G__133876 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),page_name], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__133876) : frontend.db.entity.call(null,G__133876));
} else {
if(logseq.common.util.uuid_string_QMARK_(page_name)){
var G__133877 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.uuid(page_name)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__133877) : frontend.db.entity.call(null,G__133877));
} else {
return (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page_name) : frontend.db.get_page.call(null,page_name));

}
}
});
frontend.components.page.get_sanity_page_name = (function frontend$components$page$get_sanity_page_name(state,page_name){
var temp__5804__auto__ = frontend.components.page.get_path_page_name(state,page_name);
if(cljs.core.truth_(temp__5804__auto__)){
var path_page_name = temp__5804__auto__;
return (frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1 ? frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1(path_page_name) : frontend.util.page_name_sanity_lc.call(null,path_page_name));
} else {
return null;
}
});
frontend.components.page.lsp_pagebar_slot = rum.core.lazy_build(rum.core.build_defc,(function (){
if((!(frontend.config.publishing_QMARK_))){
if(cljs.core.truth_(frontend.config.lsp_enabled_QMARK_)){
return daiquiri.core.create_element("div",{'className':"flex flex-row"},[frontend.components.plugins.hook_ui_slot(new cljs.core.Keyword(null,"page-head-actions-slotted","page-head-actions-slotted",1227457137),null),frontend.components.plugins.hook_ui_items(new cljs.core.Keyword(null,"pagebar","pagebar",-1992158385))]);
} else {
return null;
}
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.page/lsp-pagebar-slot");
frontend.components.page.tabs = rum.core.lazy_build(rum.core.build_defc,(function (page,opts){
var class_QMARK_ = (logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.class_QMARK_.call(null,page));
var property_QMARK_ = (logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.property_QMARK_.call(null,page));
var both_QMARK_ = (function (){var and__5000__auto__ = class_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return property_QMARK_;
} else {
return and__5000__auto__;
}
})();
var default_tab = (cljs.core.truth_(both_QMARK_)?"tag":(cljs.core.truth_(class_QMARK_)?"tag":"property"
));
var attrs133934 = (function (){var G__133936 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"defaultValue","defaultValue",-586131910),default_tab,new cljs.core.Keyword(null,"class","class",-2030961996),"w-full"], null);
var G__133937 = (cljs.core.truth_(both_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.gap-1.items-center","div.flex.flex-row.gap-1.items-center",1211135204),(function (){var G__133941 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"h-8"], null);
var G__133942 = (cljs.core.truth_(class_QMARK_)?(function (){var G__133946 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),"tag",new cljs.core.Keyword(null,"class","class",-2030961996),"py-1 text-xs"], null);
var G__133947 = "Tagged nodes";
return (logseq.shui.ui.tabs_trigger.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.tabs_trigger.cljs$core$IFn$_invoke$arity$2(G__133946,G__133947) : logseq.shui.ui.tabs_trigger.call(null,G__133946,G__133947));
})():null);
var G__133943 = (cljs.core.truth_(property_QMARK_)?(function (){var G__133948 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),"property",new cljs.core.Keyword(null,"class","class",-2030961996),"py-1 text-xs"], null);
var G__133949 = "Nodes with property";
return (logseq.shui.ui.tabs_trigger.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.tabs_trigger.cljs$core$IFn$_invoke$arity$2(G__133948,G__133949) : logseq.shui.ui.tabs_trigger.call(null,G__133948,G__133949));
})():null);
var G__133944 = (cljs.core.truth_(property_QMARK_)?frontend.components.db_based.page.configure_property(page):null);
return (logseq.shui.ui.tabs_list.cljs$core$IFn$_invoke$arity$4 ? logseq.shui.ui.tabs_list.cljs$core$IFn$_invoke$arity$4(G__133941,G__133942,G__133943,G__133944) : logseq.shui.ui.tabs_list.call(null,G__133941,G__133942,G__133943,G__133944));
})()], null):null);
var G__133938 = (cljs.core.truth_(class_QMARK_)?(function (){var G__133950 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"value","value",305978217),"tag"], null);
var G__133951 = frontend.components.objects.class_objects(page,opts);
return (logseq.shui.ui.tabs_content.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.tabs_content.cljs$core$IFn$_invoke$arity$2(G__133950,G__133951) : logseq.shui.ui.tabs_content.call(null,G__133950,G__133951));
})():null);
var G__133939 = (cljs.core.truth_(property_QMARK_)?(function (){var G__133953 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"value","value",305978217),"property"], null);
var G__133954 = frontend.components.objects.property_related_objects(page,new cljs.core.Keyword(null,"current-page?","current-page?",-1491305079).cljs$core$IFn$_invoke$arity$1(opts));
return (logseq.shui.ui.tabs_content.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.tabs_content.cljs$core$IFn$_invoke$arity$2(G__133953,G__133954) : logseq.shui.ui.tabs_content.call(null,G__133953,G__133954));
})():null);
return (logseq.shui.ui.tabs.cljs$core$IFn$_invoke$arity$4 ? logseq.shui.ui.tabs.cljs$core$IFn$_invoke$arity$4(G__133936,G__133937,G__133938,G__133939) : logseq.shui.ui.tabs.call(null,G__133936,G__133937,G__133938,G__133939));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs133934))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["page-tabs"], null)], null),attrs133934], 0))):{'className':"page-tabs"}),((cljs.core.map_QMARK_(attrs133934))?null:[daiquiri.interpreter.interpret(attrs133934)]));
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"did-mount","did-mount",918232960),(function (state){
var _STAR_tabs_rendered_QMARK_ = new cljs.core.Keyword(null,"*tabs-rendered?","*tabs-rendered?",-1247535340).cljs$core$IFn$_invoke$arity$1(cljs.core.last(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state)));
cljs.core.reset_BANG_(_STAR_tabs_rendered_QMARK_,true);

return state;
})], null)], null),"frontend.components.page/tabs");
frontend.components.page.sidebar_page_properties = rum.core.lazy_build(rum.core.build_defc,(function (config,page){
var vec__133968 = rum.core.use_state(cljs.core.not((logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.class_QMARK_.call(null,page))));
var collapsed_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133968,(0),null);
var set_collapsed_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133968,(1),null);
return daiquiri.core.create_element("div",{'className':"ls-sidebar-page-properties flex flex-col gap-2 mt-2"},[(function (){var attrs134005 = (function (){var G__134011 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"class","class",-2030961996),"px-1 text-muted-foreground",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var G__134013 = cljs.core.not(collapsed_QMARK_);
return (set_collapsed_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_collapsed_BANG_.cljs$core$IFn$_invoke$arity$1(G__134013) : set_collapsed_BANG_.call(null,G__134013));
})], null);
var G__134012 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-xs","span.text-xs",63518557),(cljs.core.truth_(collapsed_QMARK_)?"Open":"Hide")," properties"], null);
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__134011,G__134012) : logseq.shui.ui.button.call(null,G__134011,G__134012));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs134005))?daiquiri.interpreter.element_attributes(attrs134005):null),((cljs.core.map_QMARK_(attrs134005))?null:[daiquiri.interpreter.interpret(attrs134005)]));
})(),(cljs.core.truth_(collapsed_QMARK_)?null:daiquiri.core.create_element(daiquiri.core.fragment,null,[frontend.components.block.db_properties_cp(config,page,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"sidebar-properties?","sidebar-properties?",606274147),true], null)),daiquiri.core.create_element("hr",{'className':"my-4"},null)]))]);
}),null,"frontend.components.page/sidebar-page-properties");
frontend.components.page.page_inner = rum.core.lazy_build(rum.core.build_defcs,(function (state,p__134023){
var map__134024 = p__134023;
var map__134024__$1 = cljs.core.__destructure_map(map__134024);
var option = map__134024__$1;
var repo = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134024__$1,new cljs.core.Keyword(null,"repo","repo",-1999060679));
var page = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134024__$1,new cljs.core.Keyword(null,"page","page",849072397));
var preview_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134024__$1,new cljs.core.Keyword(null,"preview?","preview?",590561578));
var sidebar_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134024__$1,new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672));
var linked_refs_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134024__$1,new cljs.core.Keyword(null,"linked-refs?","linked-refs?",-119740497));
var unlinked_refs_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134024__$1,new cljs.core.Keyword(null,"unlinked-refs?","unlinked-refs?",-1047663389));
var config = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134024__$1,new cljs.core.Keyword(null,"config","config",994861415));
var current_repo = frontend.state.sub(new cljs.core.Keyword("git","current-repo","git/current-repo",107438825));
var _STAR_tabs_rendered_QMARK_ = new cljs.core.Keyword("frontend.components.page","tabs-rendered?","frontend.components.page/tabs-rendered?",952966250).cljs$core$IFn$_invoke$arity$1(state);
var repo__$1 = (function (){var or__5002__auto__ = repo;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return current_repo;
}
})();
var block_id = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page);
var block_QMARK_ = (!((new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(page) == null)));
var class_page_QMARK_ = (logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.class_QMARK_.call(null,page));
var property_page_QMARK_ = (logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.property_QMARK_.call(null,page));
var title = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page);
var journal_QMARK_ = (frontend.db.journal_page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.db.journal_page_QMARK_.cljs$core$IFn$_invoke$arity$1(title) : frontend.db.journal_page_QMARK_.call(null,title));
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo__$1);
var fmt_journal_QMARK_ = cljs.core.boolean$(frontend.date.journal_title__GT_int(title));
var whiteboard_QMARK_ = new cljs.core.Keyword(null,"whiteboard?","whiteboard?",-1968190788).cljs$core$IFn$_invoke$arity$1(option);
var whiteboard_page_QMARK_ = frontend.db.model.whiteboard_page_QMARK_(page);
var today_QMARK_ = (function (){var and__5000__auto__ = journal_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(title,frontend.date.journal_name.cljs$core$IFn$_invoke$arity$0());
} else {
return and__5000__auto__;
}
})();
var _STAR_control_show_QMARK_ = new cljs.core.Keyword("frontend.components.page","control-show?","frontend.components.page/control-show?",-964317787).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_all_collapsed_QMARK_ = new cljs.core.Keyword("frontend.components.page","all-collapsed?","frontend.components.page/all-collapsed?",-1574936479).cljs$core$IFn$_invoke$arity$1(state);
var block_or_whiteboard_QMARK_ = (function (){var or__5002__auto__ = block_QMARK_;
if(or__5002__auto__){
return or__5002__auto__;
} else {
return whiteboard_QMARK_;
}
})();
var home_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"home","home",-74557309),frontend.state.get_current_route());
var show_tabs_QMARK_ = (function (){var and__5000__auto__ = db_based_QMARK_;
if(and__5000__auto__){
var or__5002__auto__ = class_page_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.property_QMARK_.call(null,page));
}
} else {
return and__5000__auto__;
}
})();
var tabs_rendered_QMARK_ = rum.core.react(_STAR_tabs_rendered_QMARK_);
if(cljs.core.truth_(page)){
if(cljs.core.truth_((function (){var or__5002__auto__ = title;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return block_or_whiteboard_QMARK_;
}
})())){
var attrs134061 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([((cljs.core.seq(new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(page)))?(function (){var page_names = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(page));
if(cljs.core.seq(page_names)){
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data-page-tags","data-page-tags",347588105),frontend.util.text.build_data_value(page_names)], null);
} else {
return null;
}
})():cljs.core.PersistentArrayMap.EMPTY),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),title,new cljs.core.Keyword(null,"class","class",-2030961996),frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"is-journals","is-journals",-1555155588),(function (){var or__5002__auto__ = journal_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return fmt_journal_QMARK_;
}
})(),new cljs.core.Keyword(null,"is-node-page","is-node-page",193741470),(function (){var or__5002__auto__ = class_page_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return property_page_QMARK_;
}
})()], null)], null))], null)], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs134061))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex-1","page","relative","cp__page-inner-wrap"], null)], null),attrs134061], 0))):{'className':"flex-1 page relative cp__page-inner-wrap"}),((cljs.core.map_QMARK_(attrs134061))?[(cljs.core.truth_((function (){var and__5000__auto__ = whiteboard_page_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(sidebar_QMARK_);
} else {
return and__5000__auto__;
}
})())?(function (){var attrs134110 = (function (){var G__134224 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page);
var fexpr__134223 = frontend.state.get_component(new cljs.core.Keyword("whiteboard","tldraw-preview","whiteboard/tldraw-preview",663400157));
return (fexpr__134223.cljs$core$IFn$_invoke$arity$1 ? fexpr__134223.cljs$core$IFn$_invoke$arity$1(G__134224) : fexpr__134223.call(null,G__134224));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs134110))?daiquiri.interpreter.element_attributes(attrs134110):null),((cljs.core.map_QMARK_(attrs134110))?null:[daiquiri.interpreter.interpret(attrs134110)]));
})():(function (){var attrs134161 = (cljs.core.truth_((function (){var or__5002__auto__ = block_QMARK_;
if(or__5002__auto__){
return or__5002__auto__;
} else {
return sidebar_QMARK_;
}
})())?null:new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.space-between","div.flex.flex-row.space-between",1433228948),(cljs.core.truth_((function (){var and__5000__auto__ = (function (){var or__5002__auto__ = frontend.mobile.util.native_platform_QMARK_();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.util.mobile_QMARK_();
}
})();
if(cljs.core.truth_(and__5000__auto__)){
return (!(db_based_QMARK_));
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.pr-2","div.flex.flex-row.pr-2",1648161181),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"margin-left","margin-left",2015598377),(-15)], null),new cljs.core.Keyword(null,"on-mouse-over","on-mouse-over",-858472552),(function (e){
return frontend.components.page.page_mouse_over(e,_STAR_control_show_QMARK_,_STAR_all_collapsed_QMARK_);
}),new cljs.core.Keyword(null,"on-mouse-leave","on-mouse-leave",-1864319528),(function (e){
return frontend.components.page.page_mouse_leave(e,_STAR_control_show_QMARK_);
})], null),frontend.components.page.page_blocks_collapse_control(title,_STAR_control_show_QMARK_,_STAR_all_collapsed_QMARK_)], null):null),(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not(whiteboard_QMARK_);
if(and__5000__auto__){
return (logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.page_QMARK_.call(null,page));
} else {
return and__5000__auto__;
}
})())?((db_based_QMARK_)?frontend.components.page.db_page_title(page,whiteboard_page_QMARK_,sidebar_QMARK_,new cljs.core.Keyword(null,"container-id","container-id",1274665684).cljs$core$IFn$_invoke$arity$1(state)):frontend.components.page.page_title_cp(page,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"journal?","journal?",-897756522),journal_QMARK_,new cljs.core.Keyword(null,"fmt-journal?","fmt-journal?",-134242319),fmt_journal_QMARK_,new cljs.core.Keyword(null,"preview?","preview?",590561578),preview_QMARK_], null))):null),frontend.components.page.lsp_pagebar_slot()], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs134161))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["relative","grid","gap-8","page-inner"], null)], null),attrs134161], 0))):{'className':"relative grid gap-8 page-inner"}),((cljs.core.map_QMARK_(attrs134161))?[(cljs.core.truth_((function (){var and__5000__auto__ = db_based_QMARK_;
if(and__5000__auto__){
var and__5000__auto____$1 = sidebar_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return (logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.page_QMARK_.call(null,page));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?daiquiri.core.create_element("div",{'className':"-mb-8"},[frontend.components.page.sidebar_page_properties(config,page)]):null),((((block_QMARK_) && (((cljs.core.not(sidebar_QMARK_)) && (cljs.core.not(whiteboard_QMARK_))))))?(function (){var config__$1 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([config,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),"block-parent",new cljs.core.Keyword(null,"block?","block?",1102479923),true], null)], 0));
return daiquiri.core.create_element("div",{'className':"mb-4"},[frontend.components.block.breadcrumb(config__$1,repo__$1,block_id,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"level-limit","level-limit",-1660435238),(3)], null))]);
})():null),(cljs.core.truth_(show_tabs_QMARK_)?frontend.components.page.tabs(page,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"current-page?","current-page?",-1491305079),option,new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672),sidebar_QMARK_,new cljs.core.Keyword(null,"*tabs-rendered?","*tabs-rendered?",-1247535340),_STAR_tabs_rendered_QMARK_], null)):null),(cljs.core.truth_((function (){var or__5002__auto__ = cljs.core.not(show_tabs_QMARK_);
if(or__5002__auto__){
return or__5002__auto__;
} else {
return tabs_rendered_QMARK_;
}
})())?daiquiri.core.create_element("div",{'style':{'marginLeft':(cljs.core.truth_(whiteboard_QMARK_)?(0):(-20))},'className':"ls-page-blocks"},[frontend.components.page.page_blocks_cp(page,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([option,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672),sidebar_QMARK_,new cljs.core.Keyword(null,"container-id","container-id",1274665684),new cljs.core.Keyword(null,"container-id","container-id",1274665684).cljs$core$IFn$_invoke$arity$1(state),new cljs.core.Keyword(null,"whiteboard?","whiteboard?",-1968190788),whiteboard_QMARK_], null)], 0)))]):null)]:[daiquiri.interpreter.interpret(attrs134161),(cljs.core.truth_((function (){var and__5000__auto__ = db_based_QMARK_;
if(and__5000__auto__){
var and__5000__auto____$1 = sidebar_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return (logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.page_QMARK_.call(null,page));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?daiquiri.core.create_element("div",{'className':"-mb-8"},[frontend.components.page.sidebar_page_properties(config,page)]):null),((((block_QMARK_) && (((cljs.core.not(sidebar_QMARK_)) && (cljs.core.not(whiteboard_QMARK_))))))?(function (){var config__$1 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([config,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),"block-parent",new cljs.core.Keyword(null,"block?","block?",1102479923),true], null)], 0));
return daiquiri.core.create_element("div",{'className':"mb-4"},[frontend.components.block.breadcrumb(config__$1,repo__$1,block_id,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"level-limit","level-limit",-1660435238),(3)], null))]);
})():null),(cljs.core.truth_(show_tabs_QMARK_)?frontend.components.page.tabs(page,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"current-page?","current-page?",-1491305079),option,new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672),sidebar_QMARK_,new cljs.core.Keyword(null,"*tabs-rendered?","*tabs-rendered?",-1247535340),_STAR_tabs_rendered_QMARK_], null)):null),(cljs.core.truth_((function (){var or__5002__auto__ = cljs.core.not(show_tabs_QMARK_);
if(or__5002__auto__){
return or__5002__auto__;
} else {
return tabs_rendered_QMARK_;
}
})())?daiquiri.core.create_element("div",{'style':{'marginLeft':(cljs.core.truth_(whiteboard_QMARK_)?(0):(-20))},'className':"ls-page-blocks"},[frontend.components.page.page_blocks_cp(page,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([option,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672),sidebar_QMARK_,new cljs.core.Keyword(null,"container-id","container-id",1274665684),new cljs.core.Keyword(null,"container-id","container-id",1274665684).cljs$core$IFn$_invoke$arity$1(state),new cljs.core.Keyword(null,"whiteboard?","whiteboard?",-1968190788),whiteboard_QMARK_], null)], 0)))]):null)]));
})()),(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not(preview_QMARK_);
if(and__5000__auto__){
var or__5002__auto__ = cljs.core.not(show_tabs_QMARK_);
if(or__5002__auto__){
return or__5002__auto__;
} else {
return tabs_rendered_QMARK_;
}
} else {
return and__5000__auto__;
}
})())?(function (){var attrs134073 = (cljs.core.truth_(today_QMARK_)?frontend.components.page.today_queries(repo__$1,today_QMARK_,sidebar_QMARK_):null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs134073))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ml-1","flex","flex-col","gap-4"], null)], null),attrs134073], 0))):{'className':"ml-1 flex flex-col gap-4"}),((cljs.core.map_QMARK_(attrs134073))?[(cljs.core.truth_(today_QMARK_)?frontend.components.scheduled_deadlines.scheduled_and_deadlines(title):null),(((((!(block_QMARK_))) && ((!(db_based_QMARK_)))))?frontend.components.page.tagged_pages(repo__$1,page,title):null),(cljs.core.truth_((function (){var and__5000__auto__ = (logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.page_QMARK_.call(null,page));
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword("logseq.property","_parent","logseq.property/_parent",444328035).cljs$core$IFn$_invoke$arity$1(page);
} else {
return and__5000__auto__;
}
})())?frontend.components.class$.class_children(page):null),(cljs.core.truth_((function (){var or__5002__auto__ = whiteboard_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = linked_refs_QMARK_;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return ((block_QMARK_) && ((!(db_based_QMARK_))));
}
}
})())?null:daiquiri.core.create_element("div",{'key':"page-references"},[rum.core.with_key(frontend.components.reference.references(page,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672),sidebar_QMARK_], null)),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(title),"-refs"].join(''))])),(cljs.core.truth_(block_or_whiteboard_QMARK_)?null:((((cljs.core.not(journal_QMARK_)) && ((!(db_based_QMARK_)))))?frontend.components.file_based.hierarchy.structures(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page)):null)),(cljs.core.truth_((function (){var or__5002__auto__ = whiteboard_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = unlinked_refs_QMARK_;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = sidebar_QMARK_;
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = home_QMARK_;
if(or__5002__auto____$3){
return or__5002__auto____$3;
} else {
var or__5002__auto____$4 = (function (){var or__5002__auto____$4 = class_page_QMARK_;
if(cljs.core.truth_(or__5002__auto____$4)){
return or__5002__auto____$4;
} else {
return property_page_QMARK_;
}
})();
if(cljs.core.truth_(or__5002__auto____$4)){
return or__5002__auto____$4;
} else {
return ((block_QMARK_) && ((!(db_based_QMARK_))));
}
}
}
}
}
})())?null:daiquiri.core.create_element("div",{'key':"page-unlinked-references"},[frontend.components.reference.unlinked_references(page,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672),sidebar_QMARK_], null))]))]:[daiquiri.interpreter.interpret(attrs134073),(cljs.core.truth_(today_QMARK_)?frontend.components.scheduled_deadlines.scheduled_and_deadlines(title):null),(((((!(block_QMARK_))) && ((!(db_based_QMARK_)))))?frontend.components.page.tagged_pages(repo__$1,page,title):null),(cljs.core.truth_((function (){var and__5000__auto__ = (logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.page_QMARK_.call(null,page));
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword("logseq.property","_parent","logseq.property/_parent",444328035).cljs$core$IFn$_invoke$arity$1(page);
} else {
return and__5000__auto__;
}
})())?frontend.components.class$.class_children(page):null),(cljs.core.truth_((function (){var or__5002__auto__ = whiteboard_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = linked_refs_QMARK_;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return ((block_QMARK_) && ((!(db_based_QMARK_))));
}
}
})())?null:daiquiri.core.create_element("div",{'key':"page-references"},[rum.core.with_key(frontend.components.reference.references(page,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672),sidebar_QMARK_], null)),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(title),"-refs"].join(''))])),(cljs.core.truth_(block_or_whiteboard_QMARK_)?null:((((cljs.core.not(journal_QMARK_)) && ((!(db_based_QMARK_)))))?frontend.components.file_based.hierarchy.structures(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page)):null)),(cljs.core.truth_((function (){var or__5002__auto__ = whiteboard_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = unlinked_refs_QMARK_;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = sidebar_QMARK_;
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = home_QMARK_;
if(or__5002__auto____$3){
return or__5002__auto____$3;
} else {
var or__5002__auto____$4 = (function (){var or__5002__auto____$4 = class_page_QMARK_;
if(cljs.core.truth_(or__5002__auto____$4)){
return or__5002__auto____$4;
} else {
return property_page_QMARK_;
}
})();
if(cljs.core.truth_(or__5002__auto____$4)){
return or__5002__auto____$4;
} else {
return ((block_QMARK_) && ((!(db_based_QMARK_))));
}
}
}
}
}
})())?null:daiquiri.core.create_element("div",{'key':"page-unlinked-references"},[frontend.components.reference.unlinked_references(page,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672),sidebar_QMARK_], null))]))]));
})():null)]:[daiquiri.interpreter.interpret(attrs134061),(cljs.core.truth_((function (){var and__5000__auto__ = whiteboard_page_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(sidebar_QMARK_);
} else {
return and__5000__auto__;
}
})())?(function (){var attrs134268 = (function (){var G__134314 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page);
var fexpr__134313 = frontend.state.get_component(new cljs.core.Keyword("whiteboard","tldraw-preview","whiteboard/tldraw-preview",663400157));
return (fexpr__134313.cljs$core$IFn$_invoke$arity$1 ? fexpr__134313.cljs$core$IFn$_invoke$arity$1(G__134314) : fexpr__134313.call(null,G__134314));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs134268))?daiquiri.interpreter.element_attributes(attrs134268):null),((cljs.core.map_QMARK_(attrs134268))?null:[daiquiri.interpreter.interpret(attrs134268)]));
})():(function (){var attrs134292 = (cljs.core.truth_((function (){var or__5002__auto__ = block_QMARK_;
if(or__5002__auto__){
return or__5002__auto__;
} else {
return sidebar_QMARK_;
}
})())?null:new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.space-between","div.flex.flex-row.space-between",1433228948),(cljs.core.truth_((function (){var and__5000__auto__ = (function (){var or__5002__auto__ = frontend.mobile.util.native_platform_QMARK_();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.util.mobile_QMARK_();
}
})();
if(cljs.core.truth_(and__5000__auto__)){
return (!(db_based_QMARK_));
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.pr-2","div.flex.flex-row.pr-2",1648161181),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"margin-left","margin-left",2015598377),(-15)], null),new cljs.core.Keyword(null,"on-mouse-over","on-mouse-over",-858472552),(function (e){
return frontend.components.page.page_mouse_over(e,_STAR_control_show_QMARK_,_STAR_all_collapsed_QMARK_);
}),new cljs.core.Keyword(null,"on-mouse-leave","on-mouse-leave",-1864319528),(function (e){
return frontend.components.page.page_mouse_leave(e,_STAR_control_show_QMARK_);
})], null),frontend.components.page.page_blocks_collapse_control(title,_STAR_control_show_QMARK_,_STAR_all_collapsed_QMARK_)], null):null),(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not(whiteboard_QMARK_);
if(and__5000__auto__){
return (logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.page_QMARK_.call(null,page));
} else {
return and__5000__auto__;
}
})())?((db_based_QMARK_)?frontend.components.page.db_page_title(page,whiteboard_page_QMARK_,sidebar_QMARK_,new cljs.core.Keyword(null,"container-id","container-id",1274665684).cljs$core$IFn$_invoke$arity$1(state)):frontend.components.page.page_title_cp(page,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"journal?","journal?",-897756522),journal_QMARK_,new cljs.core.Keyword(null,"fmt-journal?","fmt-journal?",-134242319),fmt_journal_QMARK_,new cljs.core.Keyword(null,"preview?","preview?",590561578),preview_QMARK_], null))):null),frontend.components.page.lsp_pagebar_slot()], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs134292))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["relative","grid","gap-8","page-inner"], null)], null),attrs134292], 0))):{'className':"relative grid gap-8 page-inner"}),((cljs.core.map_QMARK_(attrs134292))?[(cljs.core.truth_((function (){var and__5000__auto__ = db_based_QMARK_;
if(and__5000__auto__){
var and__5000__auto____$1 = sidebar_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return (logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.page_QMARK_.call(null,page));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?daiquiri.core.create_element("div",{'className':"-mb-8"},[frontend.components.page.sidebar_page_properties(config,page)]):null),((((block_QMARK_) && (((cljs.core.not(sidebar_QMARK_)) && (cljs.core.not(whiteboard_QMARK_))))))?(function (){var config__$1 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([config,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),"block-parent",new cljs.core.Keyword(null,"block?","block?",1102479923),true], null)], 0));
return daiquiri.core.create_element("div",{'className':"mb-4"},[frontend.components.block.breadcrumb(config__$1,repo__$1,block_id,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"level-limit","level-limit",-1660435238),(3)], null))]);
})():null),(cljs.core.truth_(show_tabs_QMARK_)?frontend.components.page.tabs(page,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"current-page?","current-page?",-1491305079),option,new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672),sidebar_QMARK_,new cljs.core.Keyword(null,"*tabs-rendered?","*tabs-rendered?",-1247535340),_STAR_tabs_rendered_QMARK_], null)):null),(cljs.core.truth_((function (){var or__5002__auto__ = cljs.core.not(show_tabs_QMARK_);
if(or__5002__auto__){
return or__5002__auto__;
} else {
return tabs_rendered_QMARK_;
}
})())?daiquiri.core.create_element("div",{'style':{'marginLeft':(cljs.core.truth_(whiteboard_QMARK_)?(0):(-20))},'className':"ls-page-blocks"},[frontend.components.page.page_blocks_cp(page,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([option,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672),sidebar_QMARK_,new cljs.core.Keyword(null,"container-id","container-id",1274665684),new cljs.core.Keyword(null,"container-id","container-id",1274665684).cljs$core$IFn$_invoke$arity$1(state),new cljs.core.Keyword(null,"whiteboard?","whiteboard?",-1968190788),whiteboard_QMARK_], null)], 0)))]):null)]:[daiquiri.interpreter.interpret(attrs134292),(cljs.core.truth_((function (){var and__5000__auto__ = db_based_QMARK_;
if(and__5000__auto__){
var and__5000__auto____$1 = sidebar_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return (logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.page_QMARK_.call(null,page));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?daiquiri.core.create_element("div",{'className':"-mb-8"},[frontend.components.page.sidebar_page_properties(config,page)]):null),((((block_QMARK_) && (((cljs.core.not(sidebar_QMARK_)) && (cljs.core.not(whiteboard_QMARK_))))))?(function (){var config__$1 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([config,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),"block-parent",new cljs.core.Keyword(null,"block?","block?",1102479923),true], null)], 0));
return daiquiri.core.create_element("div",{'className':"mb-4"},[frontend.components.block.breadcrumb(config__$1,repo__$1,block_id,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"level-limit","level-limit",-1660435238),(3)], null))]);
})():null),(cljs.core.truth_(show_tabs_QMARK_)?frontend.components.page.tabs(page,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"current-page?","current-page?",-1491305079),option,new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672),sidebar_QMARK_,new cljs.core.Keyword(null,"*tabs-rendered?","*tabs-rendered?",-1247535340),_STAR_tabs_rendered_QMARK_], null)):null),(cljs.core.truth_((function (){var or__5002__auto__ = cljs.core.not(show_tabs_QMARK_);
if(or__5002__auto__){
return or__5002__auto__;
} else {
return tabs_rendered_QMARK_;
}
})())?daiquiri.core.create_element("div",{'style':{'marginLeft':(cljs.core.truth_(whiteboard_QMARK_)?(0):(-20))},'className':"ls-page-blocks"},[frontend.components.page.page_blocks_cp(page,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([option,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672),sidebar_QMARK_,new cljs.core.Keyword(null,"container-id","container-id",1274665684),new cljs.core.Keyword(null,"container-id","container-id",1274665684).cljs$core$IFn$_invoke$arity$1(state),new cljs.core.Keyword(null,"whiteboard?","whiteboard?",-1968190788),whiteboard_QMARK_], null)], 0)))]):null)]));
})()),(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not(preview_QMARK_);
if(and__5000__auto__){
var or__5002__auto__ = cljs.core.not(show_tabs_QMARK_);
if(or__5002__auto__){
return or__5002__auto__;
} else {
return tabs_rendered_QMARK_;
}
} else {
return and__5000__auto__;
}
})())?(function (){var attrs134090 = (cljs.core.truth_(today_QMARK_)?frontend.components.page.today_queries(repo__$1,today_QMARK_,sidebar_QMARK_):null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs134090))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ml-1","flex","flex-col","gap-4"], null)], null),attrs134090], 0))):{'className':"ml-1 flex flex-col gap-4"}),((cljs.core.map_QMARK_(attrs134090))?[(cljs.core.truth_(today_QMARK_)?frontend.components.scheduled_deadlines.scheduled_and_deadlines(title):null),(((((!(block_QMARK_))) && ((!(db_based_QMARK_)))))?frontend.components.page.tagged_pages(repo__$1,page,title):null),(cljs.core.truth_((function (){var and__5000__auto__ = (logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.page_QMARK_.call(null,page));
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword("logseq.property","_parent","logseq.property/_parent",444328035).cljs$core$IFn$_invoke$arity$1(page);
} else {
return and__5000__auto__;
}
})())?frontend.components.class$.class_children(page):null),(cljs.core.truth_((function (){var or__5002__auto__ = whiteboard_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = linked_refs_QMARK_;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return ((block_QMARK_) && ((!(db_based_QMARK_))));
}
}
})())?null:daiquiri.core.create_element("div",{'key':"page-references"},[rum.core.with_key(frontend.components.reference.references(page,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672),sidebar_QMARK_], null)),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(title),"-refs"].join(''))])),(cljs.core.truth_(block_or_whiteboard_QMARK_)?null:((((cljs.core.not(journal_QMARK_)) && ((!(db_based_QMARK_)))))?frontend.components.file_based.hierarchy.structures(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page)):null)),(cljs.core.truth_((function (){var or__5002__auto__ = whiteboard_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = unlinked_refs_QMARK_;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = sidebar_QMARK_;
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = home_QMARK_;
if(or__5002__auto____$3){
return or__5002__auto____$3;
} else {
var or__5002__auto____$4 = (function (){var or__5002__auto____$4 = class_page_QMARK_;
if(cljs.core.truth_(or__5002__auto____$4)){
return or__5002__auto____$4;
} else {
return property_page_QMARK_;
}
})();
if(cljs.core.truth_(or__5002__auto____$4)){
return or__5002__auto____$4;
} else {
return ((block_QMARK_) && ((!(db_based_QMARK_))));
}
}
}
}
}
})())?null:daiquiri.core.create_element("div",{'key':"page-unlinked-references"},[frontend.components.reference.unlinked_references(page,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672),sidebar_QMARK_], null))]))]:[daiquiri.interpreter.interpret(attrs134090),(cljs.core.truth_(today_QMARK_)?frontend.components.scheduled_deadlines.scheduled_and_deadlines(title):null),(((((!(block_QMARK_))) && ((!(db_based_QMARK_)))))?frontend.components.page.tagged_pages(repo__$1,page,title):null),(cljs.core.truth_((function (){var and__5000__auto__ = (logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.page_QMARK_.call(null,page));
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword("logseq.property","_parent","logseq.property/_parent",444328035).cljs$core$IFn$_invoke$arity$1(page);
} else {
return and__5000__auto__;
}
})())?frontend.components.class$.class_children(page):null),(cljs.core.truth_((function (){var or__5002__auto__ = whiteboard_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = linked_refs_QMARK_;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return ((block_QMARK_) && ((!(db_based_QMARK_))));
}
}
})())?null:daiquiri.core.create_element("div",{'key':"page-references"},[rum.core.with_key(frontend.components.reference.references(page,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672),sidebar_QMARK_], null)),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(title),"-refs"].join(''))])),(cljs.core.truth_(block_or_whiteboard_QMARK_)?null:((((cljs.core.not(journal_QMARK_)) && ((!(db_based_QMARK_)))))?frontend.components.file_based.hierarchy.structures(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page)):null)),(cljs.core.truth_((function (){var or__5002__auto__ = whiteboard_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = unlinked_refs_QMARK_;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = sidebar_QMARK_;
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = home_QMARK_;
if(or__5002__auto____$3){
return or__5002__auto____$3;
} else {
var or__5002__auto____$4 = (function (){var or__5002__auto____$4 = class_page_QMARK_;
if(cljs.core.truth_(or__5002__auto____$4)){
return or__5002__auto____$4;
} else {
return property_page_QMARK_;
}
})();
if(cljs.core.truth_(or__5002__auto____$4)){
return or__5002__auto____$4;
} else {
return ((block_QMARK_) && ((!(db_based_QMARK_))));
}
}
}
}
}
})())?null:daiquiri.core.create_element("div",{'key':"page-unlinked-references"},[frontend.components.reference.unlinked_references(page,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672),sidebar_QMARK_], null))]))]));
})():null)]));
} else {
return null;
}
} else {
return daiquiri.core.create_element("div",{'className':"opacity-75"},["Page not found"]);
}
}),new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query,frontend.mixins.container_id,rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.components.page","all-collapsed?","frontend.components.page/all-collapsed?",-1574936479)),rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.components.page","control-show?","frontend.components.page/control-show?",-964317787)),rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.page","current-page","frontend.components.page/current-page",1280998925)),rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.components.page","tabs-rendered?","frontend.components.page/tabs-rendered?",952966250))], null),"frontend.components.page/page-inner");
frontend.components.page.page_aux = rum.core.lazy_build(rum.core.build_defcs,(function (state,option){
var loading_QMARK_ = rum.core.react(new cljs.core.Keyword("frontend.components.page","loading?","frontend.components.page/loading?",-1156897120).cljs$core$IFn$_invoke$arity$1(state));
var page = rum.core.react(new cljs.core.Keyword("frontend.components.page","*page","frontend.components.page/*page",-576653052).cljs$core$IFn$_invoke$arity$1(state));
if(cljs.core.truth_((function (){var and__5000__auto__ = page;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(loading_QMARK_);
} else {
return and__5000__auto__;
}
})())){
return frontend.components.page.page_inner(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(option,new cljs.core.Keyword(null,"page","page",849072397),page));
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
var page_STAR_ = cljs.core.first(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state));
var page_name = new cljs.core.Keyword(null,"page-name","page-name",974981762).cljs$core$IFn$_invoke$arity$1(page_STAR_);
var page_id_uuid_or_name = (function (){var or__5002__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page_STAR_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page_STAR_);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return frontend.components.page.get_sanity_page_name(state,page_name);
}
}
})();
var option = cljs.core.last(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state));
var preview_or_sidebar_QMARK_ = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"preview?","preview?",590561578).cljs$core$IFn$_invoke$arity$1(option);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672).cljs$core$IFn$_invoke$arity$1(option);
}
})();
var page_uuid_QMARK_ = (cljs.core.truth_(page_name)?(frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1(page_name) : frontend.util.uuid_string_QMARK_.call(null,page_name)):null);
var _STAR_loading_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(true);
var page = (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page_id_uuid_or_name) : frontend.db.get_page.call(null,page_id_uuid_or_name));
var _STAR_page = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(page);
if(cljs.core.truth_(new cljs.core.Keyword("block.temp","fully-loaded?","block.temp/fully-loaded?",-116637365).cljs$core$IFn$_invoke$arity$1(page))){
cljs.core.reset_BANG_(_STAR_loading_QMARK_,false);
} else {
}

promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_block(frontend.state.get_current_repo(),page_id_uuid_or_name)),(function (page_block){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.reset_BANG_(_STAR_loading_QMARK_,false)),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.reset_BANG_(_STAR_page,(function (){var G__134349 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page_block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__134349) : frontend.db.entity.call(null,G__134349));
})())),(function (___41611__auto____$1){
return promesa.protocols._promise((cljs.core.truth_(page_block)?(cljs.core.truth_(preview_or_sidebar_QMARK_)?null:(function (){var temp__5802__auto__ = (function (){var and__5000__auto__ = cljs.core.not(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page_STAR_));
if(and__5000__auto__){
var and__5000__auto____$1 = cljs.core.not(page_uuid_QMARK_);
if(and__5000__auto____$1){
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page_block);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var page_uuid = temp__5802__auto__;
return frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(page_uuid),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"push","push",799791267),false], null));
} else {
return frontend.handler.route.update_page_title_and_label_BANG_(frontend.state.get_route_match());
}
})()):null));
}));
}));
}));
}));

return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(state,new cljs.core.Keyword("frontend.components.page","loading?","frontend.components.page/loading?",-1156897120),_STAR_loading_QMARK_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("frontend.components.page","*page","frontend.components.page/*page",-576653052),_STAR_page], 0));
}),new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","virtualized-scroll-fn","editor/virtualized-scroll-fn",-343790237),null);

return state;
})], null)], null),"frontend.components.page/page-aux");
frontend.components.page.page_cp = rum.core.lazy_build(rum.core.build_defcs,(function (state,option){
var page_name = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"page-name","page-name",974981762).cljs$core$IFn$_invoke$arity$1(option);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.components.page.get_page_name(state);
}
})();
return rum.core.with_key(frontend.components.page.page_aux(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(option,new cljs.core.Keyword(null,"page-name","page-name",974981762),page_name)),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo()),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(option);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return page_name;
}
})())].join(''));
}),null,"frontend.components.page/page-cp");
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.page !== 'undefined') && (typeof frontend.components.page.layout !== 'undefined')){
} else {
frontend.components.page.layout = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [window.innerWidth,window.innerHeight], null));
}
frontend.components.page.graph_filter_section = rum.core.lazy_build(rum.core.build_defcs,(function (state,title,content,p__134370){
var map__134371 = p__134370;
var map__134371__$1 = cljs.core.__destructure_map(map__134371);
var search_filters = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134371__$1,new cljs.core.Keyword(null,"search-filters","search-filters",-2121899355));
var open_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.components.page","open?","frontend.components.page/open?",1985200624));
if(((cljs.core.seq(search_filters)) && (cljs.core.not(cljs.core.deref(open_QMARK_))))){
cljs.core.reset_BANG_(open_QMARK_,true);
} else {
}

return daiquiri.core.create_element("li",{'className':"relative"},[daiquiri.core.create_element("div",null,[daiquiri.core.create_element("button",{'onClick':(function (){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(open_QMARK_,cljs.core.not);
}),'className':"w-full px-4 py-2 text-left focus:outline-none"},[(function (){var attrs134377 = title;
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs134377))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","justify-between"], null)], null),attrs134377], 0))):{'className':"flex items-center justify-between"}),((cljs.core.map_QMARK_(attrs134377))?[(cljs.core.truth_(cljs.core.deref(open_QMARK_))?frontend.components.svg.caret_down():frontend.components.svg.caret_right())]:[daiquiri.interpreter.interpret(attrs134377),(cljs.core.truth_(cljs.core.deref(open_QMARK_))?frontend.components.svg.caret_down():frontend.components.svg.caret_right())]));
})()]),daiquiri.interpreter.interpret((content.cljs$core$IFn$_invoke$arity$1 ? content.cljs$core$IFn$_invoke$arity$1(open_QMARK_) : content.call(null,open_QMARK_)))])]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.components.page","open?","frontend.components.page/open?",1985200624))], null),"frontend.components.page/graph-filter-section");
frontend.components.page.filter_expand_area = rum.core.lazy_build(rum.core.build_defc,(function (open_QMARK_,content){
return daiquiri.core.create_element("div",{'style':{'maxHeight':(cljs.core.truth_(cljs.core.deref(open_QMARK_))?(400):(0))},'className':"relative overflow-hidden transition-all max-h-0 duration-700"},[daiquiri.interpreter.interpret(content)]);
}),null,"frontend.components.page/filter-expand-area");
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.page !== 'undefined') && (typeof frontend.components.page._STAR_n_hops !== 'undefined')){
} else {
frontend.components.page._STAR_n_hops = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.page !== 'undefined') && (typeof frontend.components.page._STAR_focus_nodes !== 'undefined')){
} else {
frontend.components.page._STAR_focus_nodes = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentVector.EMPTY);
}
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.page !== 'undefined') && (typeof frontend.components.page._STAR_graph_reset_QMARK_ !== 'undefined')){
} else {
frontend.components.page._STAR_graph_reset_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
}
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.page !== 'undefined') && (typeof frontend.components.page._STAR_graph_forcereset_QMARK_ !== 'undefined')){
} else {
frontend.components.page._STAR_graph_forcereset_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
}
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.page !== 'undefined') && (typeof frontend.components.page._STAR_journal_QMARK_ !== 'undefined')){
} else {
frontend.components.page._STAR_journal_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.page !== 'undefined') && (typeof frontend.components.page._STAR_orphan_pages_QMARK_ !== 'undefined')){
} else {
frontend.components.page._STAR_orphan_pages_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(true);
}
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.page !== 'undefined') && (typeof frontend.components.page._STAR_builtin_pages_QMARK_ !== 'undefined')){
} else {
frontend.components.page._STAR_builtin_pages_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.page !== 'undefined') && (typeof frontend.components.page._STAR_excluded_pages_QMARK_ !== 'undefined')){
} else {
frontend.components.page._STAR_excluded_pages_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(true);
}
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.page !== 'undefined') && (typeof frontend.components.page._STAR_show_journals_in_page_graph_QMARK_ !== 'undefined')){
} else {
frontend.components.page._STAR_show_journals_in_page_graph_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.page !== 'undefined') && (typeof frontend.components.page._STAR_created_at_filter !== 'undefined')){
} else {
frontend.components.page._STAR_created_at_filter = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.page !== 'undefined') && (typeof frontend.components.page._STAR_link_dist !== 'undefined')){
} else {
frontend.components.page._STAR_link_dist = cljs.core.atom.cljs$core$IFn$_invoke$arity$1((70));
}
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.page !== 'undefined') && (typeof frontend.components.page._STAR_charge_strength !== 'undefined')){
} else {
frontend.components.page._STAR_charge_strength = cljs.core.atom.cljs$core$IFn$_invoke$arity$1((-600));
}
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.page !== 'undefined') && (typeof frontend.components.page._STAR_charge_range !== 'undefined')){
} else {
frontend.components.page._STAR_charge_range = cljs.core.atom.cljs$core$IFn$_invoke$arity$1((600));
}
frontend.components.page.simulation_switch = rum.core.lazy_build(rum.core.build_defcs,(function (state){
var _STAR_simulation_paused_QMARK_ = frontend.extensions.graph.pixi._STAR_simulation_paused_QMARK_;
return daiquiri.core.create_element("div",{'className':"flex flex-col mb-2"},[daiquiri.core.create_element("p",{'title':"Pause simulation"},["Pause simulation"]),daiquiri.interpreter.interpret(frontend.ui.toggle.cljs$core$IFn$_invoke$arity$3(rum.core.react(_STAR_simulation_paused_QMARK_),(function (){
var paused_QMARK_ = cljs.core.deref(_STAR_simulation_paused_QMARK_);
if(cljs.core.truth_(paused_QMARK_)){
return frontend.extensions.graph.pixi.resume_simulation_BANG_();
} else {
return frontend.extensions.graph.pixi.stop_simulation_BANG_();
}
}),true))]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.page/simulation-switch");
frontend.components.page.graph_filters = rum.core.lazy_build(rum.core.build_defc,(function (graph,settings,forcesettings,n_hops){
var map__134394 = settings;
var map__134394__$1 = cljs.core.__destructure_map(map__134394);
var journal_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134394__$1,new cljs.core.Keyword(null,"journal?","journal?",-897756522));
var orphan_pages_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__134394__$1,new cljs.core.Keyword(null,"orphan-pages?","orphan-pages?",-824819206),true);
var builtin_pages_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134394__$1,new cljs.core.Keyword(null,"builtin-pages?","builtin-pages?",1299611390));
var excluded_pages_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134394__$1,new cljs.core.Keyword(null,"excluded-pages?","excluded-pages?",1527958391));
var map__134395 = forcesettings;
var map__134395__$1 = cljs.core.__destructure_map(map__134395);
var link_dist = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134395__$1,new cljs.core.Keyword(null,"link-dist","link-dist",48179915));
var charge_strength = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134395__$1,new cljs.core.Keyword(null,"charge-strength","charge-strength",1642158883));
var charge_range = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134395__$1,new cljs.core.Keyword(null,"charge-range","charge-range",509183775));
var journal_QMARK__SINGLEQUOTE_ = rum.core.react(frontend.components.page._STAR_journal_QMARK_);
var orphan_pages_QMARK__SINGLEQUOTE_ = rum.core.react(frontend.components.page._STAR_orphan_pages_QMARK_);
var builtin_pages_QMARK__SINGLEQUOTE_ = rum.core.react(frontend.components.page._STAR_builtin_pages_QMARK_);
var excluded_pages_QMARK__SINGLEQUOTE_ = rum.core.react(frontend.components.page._STAR_excluded_pages_QMARK_);
var link_dist_SINGLEQUOTE_ = rum.core.react(frontend.components.page._STAR_link_dist);
var charge_strength_SINGLEQUOTE_ = rum.core.react(frontend.components.page._STAR_charge_strength);
var charge_range_SINGLEQUOTE_ = rum.core.react(frontend.components.page._STAR_charge_range);
var journal_QMARK___$1 = (((journal_QMARK__SINGLEQUOTE_ == null))?journal_QMARK_:journal_QMARK__SINGLEQUOTE_);
var orphan_pages_QMARK___$1 = (((orphan_pages_QMARK__SINGLEQUOTE_ == null))?orphan_pages_QMARK_:orphan_pages_QMARK__SINGLEQUOTE_);
var builtin_pages_QMARK___$1 = (((builtin_pages_QMARK__SINGLEQUOTE_ == null))?builtin_pages_QMARK_:builtin_pages_QMARK__SINGLEQUOTE_);
var excluded_pages_QMARK___$1 = (((excluded_pages_QMARK__SINGLEQUOTE_ == null))?excluded_pages_QMARK_:excluded_pages_QMARK__SINGLEQUOTE_);
var created_at_filter = (function (){var or__5002__auto__ = rum.core.react(frontend.components.page._STAR_created_at_filter);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"created-at-filter","created-at-filter",708262492).cljs$core$IFn$_invoke$arity$1(settings);
}
})();
var link_dist__$1 = (((link_dist_SINGLEQUOTE_ == null))?link_dist:link_dist_SINGLEQUOTE_);
var charge_strength__$1 = (((charge_strength_SINGLEQUOTE_ == null))?charge_strength:charge_strength_SINGLEQUOTE_);
var charge_range__$1 = (((charge_range_SINGLEQUOTE_ == null))?charge_range:charge_range_SINGLEQUOTE_);
var set_setting_BANG_ = (function (key,value){
var new_settings = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(settings,key,value);
return frontend.handler.config.set_config_BANG_(new cljs.core.Keyword("graph","settings","graph/settings",1067459097),new_settings);
});
var set_forcesetting_BANG_ = (function (key,value){
var new_forcesettings = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(forcesettings,key,value);
return frontend.handler.config.set_config_BANG_(new cljs.core.Keyword("graph","forcesettings","graph/forcesettings",-17461404),new_forcesettings);
});
var search_graph_filters = frontend.state.sub(new cljs.core.Keyword("search","graph-filters","search/graph-filters",1646966152));
var focus_nodes = rum.core.react(frontend.components.page._STAR_focus_nodes);
return daiquiri.core.create_element("div",{'className':"absolute top-4 right-4 graph-filters"},[daiquiri.core.create_element("div",{'className':"flex flex-col"},[daiquiri.core.create_element("div",{'className':"shadow-xl rounded-sm"},[daiquiri.core.create_element("ul",null,[frontend.components.page.graph_filter_section(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.font-medium","span.font-medium",1169799421),"Nodes"], null),(function (open_QMARK_){
return frontend.components.page.filter_expand_area(open_QMARK_,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-sm.opacity-70.px-4","p.text-sm.opacity-70.px-4",-1579335593),(function (){var c1 = cljs.core.count(new cljs.core.Keyword(null,"nodes","nodes",-2099585805).cljs$core$IFn$_invoke$arity$1(graph));
var s1 = (((c1 > (1)))?"s":"");
return (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3("%d page%s",c1,s1) : frontend.util.format.call(null,"%d page%s",c1,s1));
})()], null),new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.p-6","div.p-6",1412057822),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.justify-between.mb-2","div.flex.items-center.justify-between.mb-2",1514079906),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("settings-page","enable-journals","settings-page/enable-journals",-1792981415)], 0))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mt-1","div.mt-1",-36845891),frontend.ui.toggle.cljs$core$IFn$_invoke$arity$3(journal_QMARK___$1,(function (){
var value = cljs.core.not(journal_QMARK___$1);
cljs.core.reset_BANG_(frontend.components.page._STAR_journal_QMARK_,value);

return set_setting_BANG_(new cljs.core.Keyword(null,"journal?","journal?",-897756522),value);
}),true)], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.justify-between.mb-2","div.flex.items-center.justify-between.mb-2",1514079906),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),"Orphan pages"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mt-1","div.mt-1",-36845891),frontend.ui.toggle.cljs$core$IFn$_invoke$arity$3(orphan_pages_QMARK___$1,(function (){
var value = cljs.core.not(orphan_pages_QMARK___$1);
cljs.core.reset_BANG_(frontend.components.page._STAR_orphan_pages_QMARK_,value);

return set_setting_BANG_(new cljs.core.Keyword(null,"orphan-pages?","orphan-pages?",-824819206),value);
}),true)], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.justify-between.mb-2","div.flex.items-center.justify-between.mb-2",1514079906),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),"Built-in pages"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mt-1","div.mt-1",-36845891),frontend.ui.toggle.cljs$core$IFn$_invoke$arity$3(builtin_pages_QMARK___$1,(function (){
var value = cljs.core.not(builtin_pages_QMARK___$1);
cljs.core.reset_BANG_(frontend.components.page._STAR_builtin_pages_QMARK_,value);

return set_setting_BANG_(new cljs.core.Keyword(null,"builtin-pages?","builtin-pages?",1299611390),value);
}),true)], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.justify-between.mb-2","div.flex.items-center.justify-between.mb-2",1514079906),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),"Excluded pages"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mt-1","div.mt-1",-36845891),frontend.ui.toggle.cljs$core$IFn$_invoke$arity$3(excluded_pages_QMARK___$1,(function (){
var value = cljs.core.not(excluded_pages_QMARK___$1);
cljs.core.reset_BANG_(frontend.components.page._STAR_excluded_pages_QMARK_,value);

return set_setting_BANG_(new cljs.core.Keyword(null,"excluded-pages?","excluded-pages?",1527958391),value);
}),true)], null)], null),((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo()))?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-col.mb-2","div.flex.flex-col.mb-2",760540690),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),"Created before"], null),(cljs.core.truth_(created_at_filter)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),(new Date((created_at_filter + cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(graph,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"all-pages","all-pages",1017563062),new cljs.core.Keyword(null,"created-at-min","created-at-min",355144021)], null))))).toDateString()], null):null),frontend.ui.tooltip(frontend.ui.slider(created_at_filter,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"min","min",444991522),(0),new cljs.core.Keyword(null,"max","max",61366548),(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(graph,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"all-pages","all-pages",1017563062),new cljs.core.Keyword(null,"created-at-max","created-at-max",259911175)], null)) - cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(graph,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"all-pages","all-pages",1017563062),new cljs.core.Keyword(null,"created-at-min","created-at-min",355144021)], null))),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (p1__134387_SHARP_){
cljs.core.reset_BANG_(frontend.components.page._STAR_created_at_filter,(p1__134387_SHARP_ | (0)));

return set_setting_BANG_(new cljs.core.Keyword(null,"created-at-filter","created-at-filter",708262492),(p1__134387_SHARP_ | (0)));
})], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.px-1","div.px-1",1865452376),cljs.core.str.cljs$core$IFn$_invoke$arity$1((new Date((created_at_filter + cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(graph,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"all-pages","all-pages",1017563062),new cljs.core.Keyword(null,"created-at-min","created-at-min",355144021)], null))))))], null))], null):null),((cljs.core.seq(focus_nodes))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-col.mb-2","div.flex.flex-col.mb-2",760540690),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title","title",636505583),"N hops from selected nodes"], null),"N hops from selected nodes"], null),frontend.ui.tooltip(frontend.ui.slider((function (){var or__5002__auto__ = n_hops;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (10);
}
})(),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"min","min",444991522),(1),new cljs.core.Keyword(null,"max","max",61366548),(10),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (p1__134388_SHARP_){
return cljs.core.reset_BANG_(frontend.components.page._STAR_n_hops,(p1__134388_SHARP_ | (0)));
})], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),n_hops], null))], null):null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.opacity-70.opacity-100","a.opacity-70.opacity-100",1562554182),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.components.page._STAR_graph_reset_QMARK_,cljs.core.not);

cljs.core.reset_BANG_(frontend.components.page._STAR_focus_nodes,cljs.core.PersistentVector.EMPTY);

cljs.core.reset_BANG_(frontend.components.page._STAR_n_hops,null);

cljs.core.reset_BANG_(frontend.components.page._STAR_created_at_filter,null);

set_setting_BANG_(new cljs.core.Keyword(null,"created-at-filter","created-at-filter",708262492),null);

return frontend.state.clear_search_filters_BANG_();
})], null),"Reset Graph"], null)], null)], null));
}),cljs.core.PersistentArrayMap.EMPTY),frontend.components.page.graph_filter_section(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.font-medium","span.font-medium",1169799421),"Search"], null),(function (open_QMARK_){
return frontend.components.page.filter_expand_area(open_QMARK_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.p-6","div.p-6",1412057822),((cljs.core.seq(search_graph_filters))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),(function (){var iter__5480__auto__ = (function frontend$components$page$iter__134436(s__134437){
return (new cljs.core.LazySeq(null,(function (){
var s__134437__$1 = s__134437;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__134437__$1);
if(temp__5804__auto__){
var s__134437__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__134437__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__134437__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__134439 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__134438 = (0);
while(true){
if((i__134438 < size__5479__auto__)){
var q = cljs.core._nth(c__5478__auto__,i__134438);
cljs.core.chunk_append(b__134439,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.justify-between.items-center.mb-2","div.flex.flex-row.justify-between.items-center.mb-2",14359473),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.font-medium","span.font-medium",1169799421),q], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.search-filter-close.opacity-70.opacity-100","a.search-filter-close.opacity-70.opacity-100",820760152),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__134438,q,c__5478__auto__,size__5479__auto__,b__134439,s__134437__$2,temp__5804__auto__,map__134394,map__134394__$1,journal_QMARK_,orphan_pages_QMARK_,builtin_pages_QMARK_,excluded_pages_QMARK_,map__134395,map__134395__$1,link_dist,charge_strength,charge_range,journal_QMARK__SINGLEQUOTE_,orphan_pages_QMARK__SINGLEQUOTE_,builtin_pages_QMARK__SINGLEQUOTE_,excluded_pages_QMARK__SINGLEQUOTE_,link_dist_SINGLEQUOTE_,charge_strength_SINGLEQUOTE_,charge_range_SINGLEQUOTE_,journal_QMARK___$1,orphan_pages_QMARK___$1,builtin_pages_QMARK___$1,excluded_pages_QMARK___$1,created_at_filter,link_dist__$1,charge_strength__$1,charge_range__$1,set_setting_BANG_,set_forcesetting_BANG_,search_graph_filters,focus_nodes){
return (function (){
return frontend.state.remove_search_filter_BANG_(q);
});})(i__134438,q,c__5478__auto__,size__5479__auto__,b__134439,s__134437__$2,temp__5804__auto__,map__134394,map__134394__$1,journal_QMARK_,orphan_pages_QMARK_,builtin_pages_QMARK_,excluded_pages_QMARK_,map__134395,map__134395__$1,link_dist,charge_strength,charge_range,journal_QMARK__SINGLEQUOTE_,orphan_pages_QMARK__SINGLEQUOTE_,builtin_pages_QMARK__SINGLEQUOTE_,excluded_pages_QMARK__SINGLEQUOTE_,link_dist_SINGLEQUOTE_,charge_strength_SINGLEQUOTE_,charge_range_SINGLEQUOTE_,journal_QMARK___$1,orphan_pages_QMARK___$1,builtin_pages_QMARK___$1,excluded_pages_QMARK___$1,created_at_filter,link_dist__$1,charge_strength__$1,charge_range__$1,set_setting_BANG_,set_forcesetting_BANG_,search_graph_filters,focus_nodes))
], null),frontend.components.svg.close], null)], null));

var G__134609 = (i__134438 + (1));
i__134438 = G__134609;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__134439),frontend$components$page$iter__134436(cljs.core.chunk_rest(s__134437__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__134439),null);
}
} else {
var q = cljs.core.first(s__134437__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.justify-between.items-center.mb-2","div.flex.flex-row.justify-between.items-center.mb-2",14359473),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.font-medium","span.font-medium",1169799421),q], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.search-filter-close.opacity-70.opacity-100","a.search-filter-close.opacity-70.opacity-100",820760152),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (q,s__134437__$2,temp__5804__auto__,map__134394,map__134394__$1,journal_QMARK_,orphan_pages_QMARK_,builtin_pages_QMARK_,excluded_pages_QMARK_,map__134395,map__134395__$1,link_dist,charge_strength,charge_range,journal_QMARK__SINGLEQUOTE_,orphan_pages_QMARK__SINGLEQUOTE_,builtin_pages_QMARK__SINGLEQUOTE_,excluded_pages_QMARK__SINGLEQUOTE_,link_dist_SINGLEQUOTE_,charge_strength_SINGLEQUOTE_,charge_range_SINGLEQUOTE_,journal_QMARK___$1,orphan_pages_QMARK___$1,builtin_pages_QMARK___$1,excluded_pages_QMARK___$1,created_at_filter,link_dist__$1,charge_strength__$1,charge_range__$1,set_setting_BANG_,set_forcesetting_BANG_,search_graph_filters,focus_nodes){
return (function (){
return frontend.state.remove_search_filter_BANG_(q);
});})(q,s__134437__$2,temp__5804__auto__,map__134394,map__134394__$1,journal_QMARK_,orphan_pages_QMARK_,builtin_pages_QMARK_,excluded_pages_QMARK_,map__134395,map__134395__$1,link_dist,charge_strength,charge_range,journal_QMARK__SINGLEQUOTE_,orphan_pages_QMARK__SINGLEQUOTE_,builtin_pages_QMARK__SINGLEQUOTE_,excluded_pages_QMARK__SINGLEQUOTE_,link_dist_SINGLEQUOTE_,charge_strength_SINGLEQUOTE_,charge_range_SINGLEQUOTE_,journal_QMARK___$1,orphan_pages_QMARK___$1,builtin_pages_QMARK___$1,excluded_pages_QMARK___$1,created_at_filter,link_dist__$1,charge_strength__$1,charge_range__$1,set_setting_BANG_,set_forcesetting_BANG_,search_graph_filters,focus_nodes))
], null),frontend.components.svg.close], null)], null),frontend$components$page$iter__134436(cljs.core.rest(s__134437__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(search_graph_filters);
})(),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.opacity-70.opacity-100","a.opacity-70.opacity-100",1562554182),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.state.clear_search_filters_BANG_], null),"Clear All"], null)], null):new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.opacity-70.opacity-100","a.opacity-70.opacity-100",1562554182),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.route.go_to_search_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"graph","graph",1558099509));
})], null),"Click to search"], null))], null));
}),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"search-filters","search-filters",-2121899355),search_graph_filters], null)),frontend.components.page.graph_filter_section(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.font-medium","span.font-medium",1169799421),"Forces"], null),(function (open_QMARK_){
return frontend.components.page.filter_expand_area(open_QMARK_,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-sm.opacity-70.px-4","p.text-sm.opacity-70.px-4",-1579335593),(function (){var c2 = cljs.core.count(new cljs.core.Keyword(null,"links","links",-654507394).cljs$core$IFn$_invoke$arity$1(graph));
var s2 = (((c2 > (1)))?"s":"");
return (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3("%d link%s",c2,s2) : frontend.util.format.call(null,"%d link%s",c2,s2));
})()], null),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.p-6","div.p-6",1412057822),frontend.components.page.simulation_switch(),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-col.mb-2","div.flex.flex-col.mb-2",760540690),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title","title",636505583),"Link Distance"], null),"Link Distance"], null),frontend.ui.tooltip(frontend.ui.slider((link_dist__$1 / (10)),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"min","min",444991522),(1),new cljs.core.Keyword(null,"max","max",61366548),(18),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (p1__134390_SHARP_){
var value = (p1__134390_SHARP_ | (0));
cljs.core.reset_BANG_(frontend.components.page._STAR_link_dist,(value * (10)));

return set_forcesetting_BANG_(new cljs.core.Keyword(null,"link-dist","link-dist",48179915),(value * (10)));
})], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),link_dist__$1], null))], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-col.mb-2","div.flex.flex-col.mb-2",760540690),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title","title",636505583),"Charge Strength"], null),"Charge Strength"], null),frontend.ui.tooltip(frontend.ui.slider((charge_strength__$1 / (100)),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"min","min",444991522),(-10),new cljs.core.Keyword(null,"max","max",61366548),(10),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (p1__134391_SHARP_){
var value = (p1__134391_SHARP_ | (0));
cljs.core.reset_BANG_(frontend.components.page._STAR_charge_strength,(value * (100)));

return set_forcesetting_BANG_(new cljs.core.Keyword(null,"charge-strength","charge-strength",1642158883),(value * (100)));
})], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),charge_strength__$1], null))], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-col.mb-2","div.flex.flex-col.mb-2",760540690),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title","title",636505583),"Charge Range"], null),"Charge Range"], null),frontend.ui.tooltip(frontend.ui.slider((charge_range__$1 / (100)),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"min","min",444991522),(5),new cljs.core.Keyword(null,"max","max",61366548),(40),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (p1__134392_SHARP_){
var value = (p1__134392_SHARP_ | (0));
cljs.core.reset_BANG_(frontend.components.page._STAR_charge_range,(value * (100)));

return set_forcesetting_BANG_(new cljs.core.Keyword(null,"charge-range","charge-range",509183775),(value * (100)));
})], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),charge_range__$1], null))], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a","a",-2123407586),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.components.page._STAR_graph_forcereset_QMARK_,cljs.core.not);

cljs.core.reset_BANG_(frontend.components.page._STAR_link_dist,(70));

cljs.core.reset_BANG_(frontend.components.page._STAR_charge_strength,(-600));

return cljs.core.reset_BANG_(frontend.components.page._STAR_charge_range,(600));
})], null),"Reset Forces"], null)], null)], null));
}),cljs.core.PersistentArrayMap.EMPTY),frontend.components.page.graph_filter_section(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.font-medium","span.font-medium",1169799421),"Export"], null),(function (open_QMARK_){
return frontend.components.page.filter_expand_area(open_QMARK_,(function (){var temp__5804__auto__ = document.querySelector("#global-graph canvas");
if(cljs.core.truth_(temp__5804__auto__)){
var canvas = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.p-6","div.p-6",1412057822),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a","a",-2123407586),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return window.requestAnimationFrame((function (){
return module$frontend$utils.canvasToImage(canvas,"graph","png");
}));
})], null),"as PNG"], null)], null)], null);
} else {
return null;
}
})());
}),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"search-filters","search-filters",-2121899355),search_graph_filters], null))])])])]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.page/graph-filters");
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.page !== 'undefined') && (typeof frontend.components.page.last_node_position !== 'undefined')){
} else {
frontend.components.page.last_node_position = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
frontend.components.page.graph_register_handlers = (function frontend$components$page$graph_register_handlers(graph,focus_nodes,n_hops,dark_QMARK_){
graph.on("nodeClick",(function (event,node){
var x = event.x;
var y = event.y;
var drag_QMARK_ = (!((function (){var vec__134442 = cljs.core.deref(frontend.components.page.last_node_position);
var last_node = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134442,(0),null);
var last_x = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134442,(1),null);
var last_y = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134442,(2),null);
var threshold = (5);
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(node,last_node)) && ((((cljs.core.abs((x - last_x)) <= threshold)) && ((cljs.core.abs((y - last_y)) <= threshold)))));
})()));
return frontend.extensions.graph.on_click_handler(graph,node,event,focus_nodes,n_hops,drag_QMARK_,dark_QMARK_);
}));

return graph.on("nodeMousedown",(function (event,node){
return cljs.core.reset_BANG_(frontend.components.page.last_node_position,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [node,event.x,event.y], null));
}));
});
frontend.components.page.global_graph_inner = rum.core.lazy_build(rum.core.build_defc,(function (graph,settings,forcesettings,theme){
var vec__134446 = rum.core.react(frontend.components.page.layout);
var width = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134446,(0),null);
var height = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134446,(1),null);
var dark_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(theme,"dark");
var n_hops = rum.core.react(frontend.components.page._STAR_n_hops);
var link_dist = rum.core.react(frontend.components.page._STAR_link_dist);
var charge_strength = rum.core.react(frontend.components.page._STAR_charge_strength);
var charge_range = rum.core.react(frontend.components.page._STAR_charge_range);
var reset_QMARK_ = rum.core.react(frontend.components.page._STAR_graph_reset_QMARK_);
var forcereset_QMARK_ = rum.core.react(frontend.components.page._STAR_graph_forcereset_QMARK_);
var focus_nodes = (cljs.core.truth_(n_hops)?rum.core.react(frontend.components.page._STAR_focus_nodes):null);
var graph__$1 = ((((cljs.core.integer_QMARK_(n_hops)) && (((cljs.core.seq(focus_nodes)) && (cljs.core.not(new cljs.core.Keyword(null,"orphan-pages?","orphan-pages?",-824819206).cljs$core$IFn$_invoke$arity$1(settings)))))))?frontend.handler.graph.n_hops(graph,focus_nodes,n_hops):graph);
return daiquiri.core.create_element("div",{'id':"global-graph",'className':"relative"},[frontend.extensions.graph.graph_2d(cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"charge-strength","charge-strength",1642158883),new cljs.core.Keyword(null,"forcereset?","forcereset?",-326825913),new cljs.core.Keyword(null,"reset?","reset?",-1051875415),new cljs.core.Keyword(null,"width","width",-384071477),new cljs.core.Keyword(null,"link-dist","link-dist",48179915),new cljs.core.Keyword(null,"register-handlers-fn","register-handlers-fn",2000178094),new cljs.core.Keyword(null,"dark?","dark?",622933231),new cljs.core.Keyword(null,"nodes","nodes",-2099585805),new cljs.core.Keyword(null,"links","links",-654507394),new cljs.core.Keyword(null,"height","height",1025178622),new cljs.core.Keyword(null,"charge-range","charge-range",509183775)],[charge_strength,forcereset_QMARK_,reset_QMARK_,(width - (24)),link_dist,(function (graph__$2){
return frontend.components.page.graph_register_handlers(graph__$2,frontend.components.page._STAR_focus_nodes,frontend.components.page._STAR_n_hops,dark_QMARK_);
}),dark_QMARK_,new cljs.core.Keyword(null,"nodes","nodes",-2099585805).cljs$core$IFn$_invoke$arity$1(graph__$1),new cljs.core.Keyword(null,"links","links",-654507394).cljs$core$IFn$_invoke$arity$1(graph__$1),(height - (48)),charge_range])),frontend.components.page.graph_filters(graph__$1,settings,forcesettings,n_hops)]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.page/global-graph-inner");
frontend.components.page.filter_graph_nodes = (function frontend$components$page$filter_graph_nodes(nodes,filters){
if(cljs.core.seq(filters)){
var filter_patterns = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__134449_SHARP_){
return cljs.core.re_pattern(["(?i)",frontend.util.regex_escape(p1__134449_SHARP_)].join(''));
}),filters);
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (node){
return cljs.core.some((function (p1__134450_SHARP_){
return cljs.core.re_find(p1__134450_SHARP_,new cljs.core.Keyword(null,"label","label",1718410804).cljs$core$IFn$_invoke$arity$1(node));
}),filter_patterns);
}),nodes);
} else {
return nodes;
}
});
frontend.components.page.graph_aux = rum.core.lazy_build(rum.core.build_defc,(function (settings,forcesettings,theme,search_graph_filters){
var vec__134452 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_state.call(null,null));
var graph = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134452,(0),null);
var set_graph_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134452,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","build-graph","thread-api/build-graph",729373393),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(settings,new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"global","global",93595047),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"theme","theme",-1247880880),theme], 0))], 0))),(function (result){
return promesa.protocols._promise((set_graph_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_graph_BANG_.cljs$core$IFn$_invoke$arity$1(result) : set_graph_BANG_.call(null,result)));
}));
}));
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [theme,settings], null));

if(cljs.core.truth_(graph)){
var graph_SINGLEQUOTE_ = cljs.core.update.cljs$core$IFn$_invoke$arity$3(graph,new cljs.core.Keyword(null,"nodes","nodes",-2099585805),(function (p1__134451_SHARP_){
return frontend.components.page.filter_graph_nodes(p1__134451_SHARP_,search_graph_filters);
}));
return frontend.components.page.global_graph_inner(graph_SINGLEQUOTE_,settings,forcesettings,theme);
} else {
return null;
}
}),null,"frontend.components.page/graph-aux");
frontend.components.page.global_graph = rum.core.lazy_build(rum.core.build_defcs,(function (state){
var settings = frontend.state.graph_settings();
var forcesettings = frontend.state.graph_forcesettings();
var theme = frontend.state.sub(new cljs.core.Keyword("ui","theme","ui/theme",-1247877132));
var _reset_QMARK_ = rum.core.react(frontend.components.page._STAR_graph_reset_QMARK_);
var search_graph_filters = frontend.state.sub(new cljs.core.Keyword("search","graph-filters","search/graph-filters",1646966152));
return frontend.components.page.graph_aux(settings,forcesettings,theme,search_graph_filters);
}),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.mixins.event_mixin.cljs$core$IFn$_invoke$arity$1((function (state){
return frontend.mixins.listen(state,window,"resize",(function (_e){
return cljs.core.reset_BANG_(frontend.components.page.layout,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [window.innerWidth,window.innerHeight], null));
}));
})),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
cljs.core.reset_BANG_(frontend.components.page._STAR_n_hops,null);

cljs.core.reset_BANG_(frontend.components.page._STAR_focus_nodes,cljs.core.PersistentVector.EMPTY);

frontend.state.set_search_mode_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"global","global",93595047));

return state;
})], null)], null),"frontend.components.page/global-graph");
frontend.components.page.page_graph_inner = rum.core.lazy_build(rum.core.build_defc,(function (_page,graph,dark_QMARK_){
var show_journals_in_page_graph_QMARK_ = rum.core.react(frontend.components.page._STAR_show_journals_in_page_graph_QMARK_);
return daiquiri.core.create_element("div",{'className':"sidebar-item flex-col"},[daiquiri.core.create_element("div",{'className':"flex items-center justify-between mb-0"},[(function (){var attrs134456 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("right-side-bar","show-journals","right-side-bar/show-journals",-1717841874)], 0));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs134456))?daiquiri.interpreter.element_attributes(attrs134456):null),((cljs.core.map_QMARK_(attrs134456))?null:[daiquiri.interpreter.interpret(attrs134456)]));
})(),(function (){var attrs134457 = frontend.ui.toggle.cljs$core$IFn$_invoke$arity$3(show_journals_in_page_graph_QMARK_,(function (){
var value = cljs.core.not(show_journals_in_page_graph_QMARK_);
return cljs.core.reset_BANG_(frontend.components.page._STAR_show_journals_in_page_graph_QMARK_,value);
}),true);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs134457))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["mt-1"], null)], null),attrs134457], 0))):{'className':"mt-1"}),((cljs.core.map_QMARK_(attrs134457))?null:[daiquiri.interpreter.interpret(attrs134457)]));
})()]),frontend.extensions.graph.graph_2d(new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"nodes","nodes",-2099585805),new cljs.core.Keyword(null,"nodes","nodes",-2099585805).cljs$core$IFn$_invoke$arity$1(graph),new cljs.core.Keyword(null,"links","links",-654507394),new cljs.core.Keyword(null,"links","links",-654507394).cljs$core$IFn$_invoke$arity$1(graph),new cljs.core.Keyword(null,"width","width",-384071477),(600),new cljs.core.Keyword(null,"height","height",1025178622),(600),new cljs.core.Keyword(null,"dark?","dark?",622933231),dark_QMARK_,new cljs.core.Keyword(null,"register-handlers-fn","register-handlers-fn",2000178094),(function (graph__$1){
return frontend.components.page.graph_register_handlers(graph__$1,cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null),dark_QMARK_);
})], null))]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.page/page-graph-inner");
frontend.components.page.page_graph_aux = rum.core.lazy_build(rum.core.build_defc,(function (page,opts){
var vec__134459 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_state.call(null,null));
var graph = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134459,(0),null);
var set_graph_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134459,(1),null);
var dark_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"theme","theme",-1247880880).cljs$core$IFn$_invoke$arity$1(opts),"dark");
logseq.shui.hooks.use_effect_BANG_((function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","build-graph","thread-api/build-graph",729373393),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),opts], 0))),(function (result){
return promesa.protocols._promise((set_graph_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_graph_BANG_.cljs$core$IFn$_invoke$arity$1(result) : set_graph_BANG_.call(null,result)));
}));
}));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opts], null));

if(cljs.core.seq(new cljs.core.Keyword(null,"nodes","nodes",-2099585805).cljs$core$IFn$_invoke$arity$1(graph))){
return frontend.components.page.page_graph_inner(page,graph,dark_QMARK_);
} else {
return null;
}
}),null,"frontend.components.page/page-graph-aux");
frontend.components.page.page_graph = rum.core.lazy_build(rum.core.build_defc,(function (){
var page = (function (){var or__5002__auto__ = (function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"page","page",849072397),frontend.state.sub(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"route-match","route-match",-1450985937),new cljs.core.Keyword(null,"data","data",-232669377),new cljs.core.Keyword(null,"name","name",1843675177)], null)));
if(and__5000__auto__){
return frontend.state.sub(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"route-match","route-match",-1450985937),new cljs.core.Keyword(null,"path-params","path-params",-48130597),new cljs.core.Keyword(null,"name","name",1843675177)], null));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.date.today();
}
})();
var theme = new cljs.core.Keyword("ui","theme","ui/theme",-1247877132).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
var show_journals_in_page_graph = rum.core.react(frontend.components.page._STAR_show_journals_in_page_graph_QMARK_);
var page_entity = (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(page) : frontend.db.get_page.call(null,page));
return frontend.components.page.page_graph_aux(page,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"type","type",1174270348),(cljs.core.truth_((logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(page_entity) : logseq.db.page_QMARK_.call(null,page_entity)))?new cljs.core.Keyword(null,"page","page",849072397):new cljs.core.Keyword(null,"block","block",664686210)),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page_entity),new cljs.core.Keyword(null,"theme","theme",-1247880880),theme,new cljs.core.Keyword(null,"show-journals?","show-journals?",-206531986),show_journals_in_page_graph], null));
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.db_mixins.query,rum.core.reactive], null),"frontend.components.page/page-graph");
frontend.components.page.batch_delete_dialog = (function frontend$components$page$batch_delete_dialog(pages,refresh_fn){
return (function (p__134462){
var map__134463 = p__134462;
var map__134463__$1 = cljs.core.__destructure_map(map__134463);
var close = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134463__$1,new cljs.core.Keyword(null,"close","close",1835149582));
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.sm:flex.items-center","div.sm:flex.items-center",1228718030),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mx-auto.flex-shrink-0.flex.items-center.justify-center.h-12.w-12.rounded-full.bg-error.sm:mx-0.sm:h-10.sm:w-10","div.mx-auto.flex-shrink-0.flex.items-center.justify-center.h-12.w-12.rounded-full.bg-error.sm:mx-0.sm:h-10.sm:w-10",434929029),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-error.text-xl","span.text-error.text-xl",-1341009425),frontend.ui.icon("alert-triangle")], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mt-3.text-center.sm:mt-0.sm:ml-4.sm:text-left","div.mt-3.text-center.sm:mt-0.sm:ml-4.sm:text-left",-1344715931),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h3#modal-headline.text-lg.leading-6.font-medium","h3#modal-headline.text-lg.leading-6.font-medium",365314317),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("page","delete-confirmation","page/delete-confirmation",-1967752819)], 0))], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ol.p-2.pt-4","ol.p-2.pt-4",542145605),(function (){var iter__5480__auto__ = (function frontend$components$page$batch_delete_dialog_$_iter__134464(s__134465){
return (new cljs.core.LazySeq(null,(function (){
var s__134465__$1 = s__134465;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__134465__$1);
if(temp__5804__auto__){
var s__134465__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__134465__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__134465__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__134467 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__134466 = (0);
while(true){
if((i__134466 < size__5479__auto__)){
var page = cljs.core._nth(c__5478__auto__,i__134466);
cljs.core.chunk_append(b__134467,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a","a",-2123407586),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"href","href",-793805698),reitit.frontend.easy.href.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page)], null))], null),frontend.components.block.page_cp(cljs.core.PersistentArrayMap.EMPTY,page)], null)], null));

var G__134649 = (i__134466 + (1));
i__134466 = G__134649;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__134467),frontend$components$page$batch_delete_dialog_$_iter__134464(cljs.core.chunk_rest(s__134465__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__134467),null);
}
} else {
var page = cljs.core.first(s__134465__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a","a",-2123407586),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"href","href",-793805698),reitit.frontend.easy.href.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page)], null))], null),frontend.components.block.page_cp(cljs.core.PersistentArrayMap.EMPTY,page)], null)], null),frontend$components$page$batch_delete_dialog_$_iter__134464(cljs.core.rest(s__134465__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(pages);
})()], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.px-2.opacity-50","p.px-2.opacity-50",-888155029),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"small","small",2133478704),["Total: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.count(pages))].join('')], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.pt-6.flex.justify-end.gap-4","div.pt-6.flex.justify-end.gap-4",-1914024520),frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"cancel","cancel",-1964088360)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"outline","outline",793464534),new cljs.core.Keyword(null,"on-click","on-click",1632826543),close], 0)),frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"yes","yes",182838819)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
(close.cljs$core$IFn$_invoke$arity$0 ? close.cljs$core$IFn$_invoke$arity$0() : close.call(null));

var failed_pages_134651 = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentVector.EMPTY);
promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.core.all(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (page){
var G__134470 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page);
var G__134471 = null;
var G__134472 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"error-handler","error-handler",-484945776),(function (){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(failed_pages_134651,cljs.core.conj,new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(page));
})], null);
return (frontend.handler.page._LT_delete_BANG_.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.page._LT_delete_BANG_.cljs$core$IFn$_invoke$arity$3(G__134470,G__134471,G__134472) : frontend.handler.page._LT_delete_BANG_.call(null,G__134470,G__134471,G__134472));
}),pages))),(function (_){
return promesa.protocols._promise(((cljs.core.seq(cljs.core.deref(failed_pages_134651)))?frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("all-pages","failed-to-delete-pages","all-pages/failed-to-delete-pages",-1349728505),clojure.string.join.cljs$core$IFn$_invoke$arity$2(", ",cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.pr_str,cljs.core.deref(failed_pages_134651)))], 0)),new cljs.core.Keyword(null,"warning","warning",-1685650671),false):frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("tips","all-done","tips/all-done",-433291957)], 0)),new cljs.core.Keyword(null,"success","success",1890645906))));
}));
}));

return setTimeout((function (){
return (refresh_fn.cljs$core$IFn$_invoke$arity$0 ? refresh_fn.cljs$core$IFn$_invoke$arity$0() : refresh_fn.call(null));
}),(200));
})], 0))], null)], null);
});
});

//# sourceMappingURL=frontend.components.page.js.map
