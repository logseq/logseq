goog.provide('frontend.components.editor');
var module$node_modules$react_draggable$dist$react_draggable=shadow.js.require("module$node_modules$react_draggable$dist$react_draggable", {});
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.editor !== 'undefined') && (typeof frontend.components.editor.no_matched_commands !== 'undefined')){
} else {
frontend.components.editor.no_matched_commands = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["No matched commands",new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","move-cursor-to-end","editor/move-cursor-to-end",-95512412)], null)], null)], null)], null);
}
frontend.components.editor.filter_commands = (function frontend$components$editor$filter_commands(page_QMARK_,commands){
if(cljs.core.truth_(page_QMARK_)){
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (item){
var or__5002__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Add new property",cljs.core.first(item));
if(or__5002__auto__){
return or__5002__auto__;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(item),(5))){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, ["TASK DATE",null,"TASK STATUS",null,"PRIORITY",null], null), null),cljs.core.last(item));
} else {
return null;
}
}
}),commands);
} else {
return commands;
}
});
frontend.components.editor.commands = rum.core.lazy_build(rum.core.build_defcs,(function (s,id,format){
var matched_SINGLEQUOTE_ = frontend.util.react(frontend.commands._STAR_matched_commands);
var _STAR_matched = new cljs.core.Keyword("frontend.components.editor","matched-commands","frontend.components.editor/matched-commands",-1184406806).cljs$core$IFn$_invoke$arity$1(s);
var _ = (cljs.core.truth_(frontend.state.get_editor_action())?cljs.core.reset_BANG_(_STAR_matched,matched_SINGLEQUOTE_):null);
var page_QMARK_ = (function (){var G__124162 = (function (){var G__124163 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(frontend.state.get_edit_block());
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__124163) : frontend.db.entity.call(null,G__124163));
})();
return (frontend.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(G__124162) : frontend.db.page_QMARK_.call(null,G__124162));
})();
var matched = (function (){var or__5002__auto__ = frontend.components.editor.filter_commands(page_QMARK_,cljs.core.deref(_STAR_matched));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.components.editor.no_matched_commands;
}
})();
var filtered_QMARK_ = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(matched,cljs.core.deref(frontend.commands._STAR_initial_commands));
return frontend.ui.auto_complete(matched,(function (){var G__124171 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"item-render","item-render",253627868),(function (item){
var command_name = cljs.core.first(item);
var command_doc = cljs.core.get.cljs$core$IFn$_invoke$arity$2(item,(2));
var plugin_id = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(item,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [(1),(1),(1),new cljs.core.Keyword(null,"pid","pid",1018387698)], null));
var doc = (cljs.core.truth_(frontend.state.show_command_doc_QMARK_())?command_doc:null);
var options = (function (){var G__124172 = item;
if((G__124172 == null)){
return null;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(G__124172,(3));
}
})();
var icon_name = (function (){var G__124175 = ((cljs.core.map_QMARK_(options))?new cljs.core.Keyword(null,"icon","icon",1679606541).cljs$core$IFn$_invoke$arity$1(options):options);
if((G__124175 == null)){
return null;
} else {
return cljs.core.name(G__124175);
}
})();
var command_name__$1 = (cljs.core.truth_(icon_name)?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.gap-1","span.flex.items-center.gap-1",-111995724),logseq.shui.ui.tabler_icon(icon_name),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong.font-normal","strong.font-normal",521441352),command_name], null)], null):command_name);
if(cljs.core.truth_((function (){var or__5002__auto__ = plugin_id;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.vector_QMARK_(doc);
}
})())){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.has-help","div.has-help",152274947),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title","title",636505583),plugin_id], null),command_name__$1,(cljs.core.truth_(doc)?frontend.ui.tooltip(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"small","small",2133478704),frontend.components.svg.help_circle.cljs$core$IFn$_invoke$arity$0()], null),doc):null)], null);
} else {
if(typeof doc === 'string'){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title","title",636505583),doc], null),command_name__$1], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),command_name__$1], null);

}
}
}),new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),(function (chosen_item){
var command = cljs.core.first(chosen_item);
cljs.core.reset_BANG_(frontend.commands._STAR_current_command,command);

var command_steps = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,matched),command);
var restore_slash_QMARK_ = ((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 4, ["Yesterday",null,"Tomorrow",null,"Today",null,"Current time",null], null), null),command)) || ((((!(cljs.core.fn_QMARK_(command_steps)))) && ((((!(cljs.core.contains_QMARK_(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,command_steps)),new cljs.core.Keyword("editor","input","editor/input",-288966104))))) && ((!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 5, ["Deadline",null,"Template",null,"Scheduled",null,"Date picker",null,"Upload an image",null], null), null),command)))))))));
var G__124180 = id;
var G__124181 = command_steps;
var G__124182 = format;
var G__124183 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"restore?","restore?",1172240305),restore_slash_QMARK_,new cljs.core.Keyword(null,"command","command",-894540724),command], null);
return (frontend.handler.editor.insert_command_BANG_.cljs$core$IFn$_invoke$arity$4 ? frontend.handler.editor.insert_command_BANG_.cljs$core$IFn$_invoke$arity$4(G__124180,G__124181,G__124182,G__124183) : frontend.handler.editor.insert_command_BANG_.call(null,G__124180,G__124181,G__124182,G__124183));
}),new cljs.core.Keyword(null,"class","class",-2030961996),"cp__commands-slash"], null);
if((!(filtered_QMARK_))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__124171,new cljs.core.Keyword(null,"get-group-name","get-group-name",-160379696),(function (item){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(item),(5))){
return cljs.core.last(item);
} else {
return null;
}
}));
} else {
return G__124171;
}
})());
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,rum.core.local.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,new cljs.core.Keyword("frontend.components.editor","matched-commands","frontend.components.editor/matched-commands",-1184406806))], null),"frontend.components.editor/commands");
frontend.components.editor.page_on_chosen_handler = (function frontend$components$editor$page_on_chosen_handler(embed_QMARK_,input,id,q,pos,format){
if(cljs.core.truth_(embed_QMARK_)){
return (function (chosen_item,_e){
var value = input.value;
var value_SINGLEQUOTE_ = [logseq.common.util.safe_subs.cljs$core$IFn$_invoke$arity$3(value,(0),q),cljs.core.str.cljs$core$IFn$_invoke$arity$1(logseq.common.util.safe_subs.cljs$core$IFn$_invoke$arity$2(value,((cljs.core.count(q) + (4)) + pos)))].join('');
frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$2(input.id,value_SINGLEQUOTE_);

frontend.state.clear_editor_action_BANG_();

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(chosen_item) : frontend.db.get_page.call(null,chosen_item))),(function (page){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(page)?null:(function (){var G__124191 = chosen_item;
var G__124192 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"redirect?","redirect?",-1229259098),false], null);
return (frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2(G__124191,G__124192) : frontend.handler.page._LT_create_BANG_.call(null,G__124191,G__124192));
})())),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(chosen_item) : frontend.db.get_page.call(null,chosen_item))),(function (page_SINGLEQUOTE_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.get_edit_block()),(function (current_block){
return promesa.protocols._promise(frontend.handler.editor.api_insert_new_block_BANG_(chosen_item,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(current_block),new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),true,new cljs.core.Keyword(null,"replace-empty-target?","replace-empty-target?",-923732440),true,new cljs.core.Keyword(null,"other-attrs","other-attrs",-951608726),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","link","block/link",-1872399993),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page_SINGLEQUOTE_)], null)], null)));
}));
}));
}));
}));
}));
});
} else {
return frontend.handler.page.on_chosen_handler(input,id,pos,format);
}
});
frontend.components.editor.matched_pages_with_new_page = (function frontend$components$editor$matched_pages_with_new_page(partial_matched_pages,db_tag_QMARK_,q){
if(cljs.core.truth_((function (){var or__5002__auto__ = (function (){var G__124194 = q;
var G__124195 = (cljs.core.truth_(db_tag_QMARK_)?new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.class","Tag","logseq.class/Tag",-538902083),null], null), null):logseq.db.frontend.class$.page_classes);
return (frontend.db.page_exists_QMARK_.cljs$core$IFn$_invoke$arity$2 ? frontend.db.page_exists_QMARK_.cljs$core$IFn$_invoke$arity$2(G__124194,G__124195) : frontend.db.page_exists_QMARK_.call(null,G__124194,G__124195));
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var and__5000__auto__ = db_tag_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.some(logseq.db.class_QMARK_,new cljs.core.Keyword("block","_alias","block/_alias",444442061).cljs$core$IFn$_invoke$arity$1((frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(q) : frontend.db.get_page.call(null,q))));
} else {
return and__5000__auto__;
}
}
})())){
return partial_matched_pages;
} else {
if(cljs.core.truth_(db_tag_QMARK_)){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","title","block/title",710445684),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"new-tag","new-tag",2029496964)], 0)))," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(q)].join('')], null)], null),partial_matched_pages);
} else {
return cljs.core.cons(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","title","block/title",710445684),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"new-page","new-page",1691458376)], 0)))," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(q)].join('')], null),partial_matched_pages);
}
}
});
frontend.components.editor.page_search_aux = rum.core.lazy_build(rum.core.build_defc,(function (id,format,embed_QMARK_,db_tag_QMARK_,q,current_pos,input,pos){
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo());
var q__$1 = clojure.string.trim(q);
var vec__124224 = rum.core.use_state(null);
var matched_pages = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__124224,(0),null);
var set_matched_pages_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__124224,(1),null);
var search_f = (function (){
if(clojure.string.blank_QMARK_(q__$1)){
return null;
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(db_tag_QMARK_)?frontend.handler.editor.get_matched_classes(q__$1):frontend.handler.editor._LT_get_matched_blocks.cljs$core$IFn$_invoke$arity$variadic(q__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"nlp-pages?","nlp-pages?",-1155813873),true,new cljs.core.Keyword(null,"page-only?","page-only?",654695800),(!(db_based_QMARK_))], null)], 0)))),(function (result){
return promesa.protocols._promise((set_matched_pages_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_matched_pages_BANG_.cljs$core$IFn$_invoke$arity$1(result) : set_matched_pages_BANG_.call(null,result)));
}));
}));
}
});
logseq.shui.hooks.use_effect_BANG_(search_f,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [logseq.shui.hooks.use_debounced_value(q__$1,(150))], null));

var matched_pages_SINGLEQUOTE_ = ((clojure.string.blank_QMARK_(q__$1))?((db_based_QMARK_)?(cljs.core.truth_(db_tag_QMARK_)?frontend.db.model.get_all_classes.cljs$core$IFn$_invoke$arity$variadic(frontend.state.get_current_repo(),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"except-root-class?","except-root-class?",-345353595),true], null)], 0)):cljs.core.take.cljs$core$IFn$_invoke$arity$2((10),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (title){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","title","block/title",710445684),title,new cljs.core.Keyword(null,"nlp-date?","nlp-date?",1961584384),true], null);
}),frontend.date.nlp_pages))):null):(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.seq(matched_pages);
if(and__5000__auto__){
return goog.string.caseInsensitiveStartsWith(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(cljs.core.first(matched_pages)),q__$1);
} else {
return and__5000__auto__;
}
})())?cljs.core.cons(cljs.core.first(matched_pages),frontend.components.editor.matched_pages_with_new_page(cljs.core.rest(matched_pages),db_tag_QMARK_,q__$1)):frontend.components.editor.matched_pages_with_new_page(matched_pages,db_tag_QMARK_,q__$1)));
return daiquiri.core.create_element(daiquiri.core.fragment,null,[frontend.ui.auto_complete(matched_pages_SINGLEQUOTE_,new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),frontend.components.editor.page_on_chosen_handler(embed_QMARK_,input,id,q__$1,pos,format),new cljs.core.Keyword(null,"on-enter","on-enter",-928988216),(function (){
return frontend.handler.page.page_not_exists_handler(input,id,q__$1,current_pos);
}),new cljs.core.Keyword(null,"item-render","item-render",253627868),(function (block,_chosen_QMARK_){
var block_SINGLEQUOTE_ = (function (){var temp__5802__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(temp__5802__auto__)){
var id__$1 = temp__5802__auto__;
var temp__5802__auto____$1 = (function (){var G__124240 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id__$1], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__124240) : frontend.db.entity.call(null,G__124240));
})();
if(cljs.core.truth_(temp__5802__auto____$1)){
var e = temp__5802__auto____$1;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(e,new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block));
} else {
return block;
}
} else {
return block;
}
})();
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-col","div.flex.flex-col",255067761),(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not((function (){var or__5002__auto__ = db_tag_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword(null,"page?","page?",644039860).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return (logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(block) : logseq.db.page_QMARK_.call(null,block));
}
}
})());
if(and__5000__auto__){
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block_SINGLEQUOTE_);
} else {
return and__5000__auto__;
}
})())?(function (){var temp__5804__auto__ = frontend.state.get_component(new cljs.core.Keyword("block","breadcrumb","block/breadcrumb",1725167425));
if(cljs.core.truth_(temp__5804__auto__)){
var breadcrumb = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-xs.opacity-70.mb-1","div.text-xs.opacity-70.mb-1",-2012304238),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"margin-left","margin-left",2015598377),(3)], null)], null),(function (){var G__124241 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"search?","search?",785472524),true], null);
var G__124242 = frontend.state.get_current_repo();
var G__124243 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block_SINGLEQUOTE_);
var G__124244 = cljs.core.PersistentArrayMap.EMPTY;
return (breadcrumb.cljs$core$IFn$_invoke$arity$4 ? breadcrumb.cljs$core$IFn$_invoke$arity$4(G__124241,G__124242,G__124243,G__124244) : breadcrumb.call(null,G__124241,G__124242,G__124243,G__124244));
})()], null);
} else {
return null;
}
})():null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.items-center.gap-1","div.flex.flex-row.items-center.gap-1",-1023433319),(cljs.core.truth_((function (){var or__5002__auto__ = db_tag_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (!(db_based_QMARK_));
}
})())?null:new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center","div.flex.items-center",-1537844053),(cljs.core.truth_(new cljs.core.Keyword(null,"nlp-date?","nlp-date?",1961584384).cljs$core$IFn$_invoke$arity$1(block_SINGLEQUOTE_))?frontend.ui.icon("calendar",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(14)], null)):(cljs.core.truth_((logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(block_SINGLEQUOTE_) : logseq.db.class_QMARK_.call(null,block_SINGLEQUOTE_)))?frontend.ui.icon("hash",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(14)], null)):(cljs.core.truth_((logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1(block_SINGLEQUOTE_) : logseq.db.property_QMARK_.call(null,block_SINGLEQUOTE_)))?frontend.ui.icon("letter-p",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(14)], null)):(cljs.core.truth_(frontend.db.model.whiteboard_page_QMARK_(block_SINGLEQUOTE_))?frontend.ui.icon("writing"):(cljs.core.truth_(new cljs.core.Keyword(null,"page?","page?",644039860).cljs$core$IFn$_invoke$arity$1(block_SINGLEQUOTE_))?frontend.ui.icon("file"):((((clojure.string.starts_with_QMARK_(cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block_SINGLEQUOTE_)),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"new-tag","new-tag",2029496964)], 0)))) || (clojure.string.starts_with_QMARK_(cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block_SINGLEQUOTE_)),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"new-page","new-page",1691458376)], 0))))))?frontend.ui.icon("plus",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(14)], null)):frontend.ui.icon("letter-n",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(14)], null))
))))))], null)),(function (){var title = (cljs.core.truth_(db_tag_QMARK_)?(function (){var target = cljs.core.first(new cljs.core.Keyword("block","_alias","block/_alias",444442061).cljs$core$IFn$_invoke$arity$1(block_SINGLEQUOTE_));
var title = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_((logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(target) : logseq.db.class_QMARK_.call(null,target)))){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(title)," -> alias: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(target))].join('');
} else {
return title;
}
})():frontend.handler.block.block_unique_title(block_SINGLEQUOTE_));
return frontend.handler.search.highlight_exact_query(title,q__$1);
})()], null)], null);
}),new cljs.core.Keyword(null,"empty-placeholder","empty-placeholder",-68202085),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-gray-500.text-sm.px-4.py-2","div.text-gray-500.text-sm.px-4.py-2",1407624634),(cljs.core.truth_(db_tag_QMARK_)?"Search for a tag":"Search for a node")], null),new cljs.core.Keyword(null,"class","class",-2030961996),"black"], null)),(cljs.core.truth_((function (){var and__5000__auto__ = db_based_QMARK_;
if(and__5000__auto__){
var and__5000__auto____$1 = db_tag_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return (!(clojure.string.blank_QMARK_(q__$1)));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?daiquiri.core.create_element("p",{'className':"px-1 opacity-50 text-sm"},[daiquiri.core.create_element("code",null,[(cljs.core.truth_(frontend.util.mac_QMARK_)?"Cmd+Enter":"Ctrl+Enter")]),daiquiri.core.create_element("span",null,[" to display this tag inline instead of at the end of this node."])]):null)]);
}),null,"frontend.components.editor/page-search-aux");
/**
 * Page or tag searching popup
 */
frontend.components.editor.page_search = rum.core.lazy_build(rum.core.build_defc,(function (id,format){
var action = frontend.state.sub(new cljs.core.Keyword("editor","action","editor/action",449993861));
var db_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo());
var embed_QMARK_ = ((db_QMARK_) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.commands._STAR_current_command),"Page embed")));
var tag_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(action,new cljs.core.Keyword(null,"page-search-hashtag","page-search-hashtag",1121040573));
var db_tag_QMARK_ = ((db_QMARK_) && (tag_QMARK_));
var pos = frontend.state.get_editor_last_pos();
var input = goog.dom.getElement(id);
if(cljs.core.truth_(input)){
var current_pos = frontend.util.cursor.pos(input);
var edit_content = frontend.state.sub_edit_content.cljs$core$IFn$_invoke$arity$0();
var q = (function (){var or__5002__auto__ = frontend.handler.editor.get_selected_text();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(action,new cljs.core.Keyword(null,"page-search-hashtag","page-search-hashtag",1121040573)))?logseq.common.util.safe_subs.cljs$core$IFn$_invoke$arity$3(edit_content,pos,current_pos):null);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = (((cljs.core.count(edit_content) > current_pos))?logseq.common.util.safe_subs.cljs$core$IFn$_invoke$arity$3(edit_content,pos,current_pos):null);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
return "";
}
}
}
})();
return frontend.components.editor.page_search_aux(id,format,embed_QMARK_,db_tag_QMARK_,q,current_pos,input,pos);
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
cljs.core.reset_BANG_(frontend.commands._STAR_current_command,null);

return state;
})], null)], null),"frontend.components.editor/page-search");
frontend.components.editor.search_blocks_BANG_ = (function frontend$components$editor$search_blocks_BANG_(state,result){
var vec__124257 = new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state);
var _edit_block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__124257,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__124257,(1),null);
var ___$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__124257,(2),null);
var q = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__124257,(3),null);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((clojure.string.blank_QMARK_(q))?null:frontend.handler.editor._LT_get_matched_blocks(q))),(function (matched_blocks){
return promesa.protocols._promise(cljs.core.reset_BANG_(result,matched_blocks));
}));
}));
});
frontend.components.editor.block_on_chosen_handler = (function frontend$components$editor$block_on_chosen_handler(embed_QMARK_,input,id,q,format,selected_text){
if(cljs.core.truth_(embed_QMARK_)){
return (function (chosen_item){
var pos = frontend.state.get_editor_last_pos();
var value = input.value;
var value_SINGLEQUOTE_ = [logseq.common.util.safe_subs.cljs$core$IFn$_invoke$arity$3(value,(0),q),cljs.core.str.cljs$core$IFn$_invoke$arity$1(logseq.common.util.safe_subs.cljs$core$IFn$_invoke$arity$2(value,((cljs.core.count(q) + (4)) + pos)))].join('');
frontend.state.set_edit_content_BANG_.cljs$core$IFn$_invoke$arity$2(input.id,value_SINGLEQUOTE_);

frontend.state.clear_editor_action_BANG_();

var current_block = frontend.state.get_edit_block();
var id__$1 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(chosen_item);
var id__$2 = ((typeof id__$1 === 'string')?cljs.core.uuid(id__$1):id__$1);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.api_insert_new_block_BANG_("",new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(current_block),new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),true,new cljs.core.Keyword(null,"replace-empty-target?","replace-empty-target?",-923732440),true,new cljs.core.Keyword(null,"other-attrs","other-attrs",-951608726),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","link","block/link",-1872399993),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((function (){var G__124272 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id__$2], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__124272) : frontend.db.entity.call(null,G__124272));
})())], null)], null))),(function (___41611__auto__){
return promesa.protocols._promise(frontend.state.clear_edit_BANG_());
}));
}));
});
} else {
return frontend.handler.editor.block_on_chosen_handler(id,q,format,selected_text);
}
});
frontend.components.editor.block_search_auto_complete = rum.core.lazy_build(rum.core.build_defcs,(function (state,_edit_block,input,id,q,format,selected_text){
var result = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (b){
return (((new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(b) == null)) || (clojure.string.blank_QMARK_(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(frontend.db.model.query_block_by_uuid(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(b))))));
}),rum.core.react(cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.components.editor","result","frontend.components.editor/result",-1063532914))));
var db_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo());
var embed_QMARK_ = ((db_QMARK_) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.commands._STAR_current_command),"Block embed")));
var chosen_handler = frontend.components.editor.block_on_chosen_handler(embed_QMARK_,input,id,q,format,selected_text);
var non_exist_block_handler = frontend.handler.editor.block_non_exist_handler(input);
return frontend.ui.auto_complete(result,new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),chosen_handler,new cljs.core.Keyword(null,"on-enter","on-enter",-928988216),non_exist_block_handler,new cljs.core.Keyword(null,"empty-placeholder","empty-placeholder",-68202085),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-gray-500.text-sm.px-4.py-2","div.text-gray-500.text-sm.px-4.py-2",1407624634),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("editor","block-search","editor/block-search",-2131454160)], 0))], null),new cljs.core.Keyword(null,"item-render","item-render",253627868),(function (p__124292){
var map__124293 = p__124292;
var map__124293__$1 = cljs.core.__destructure_map(map__124293);
var page = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__124293__$1,new cljs.core.Keyword("block","page","block/page",822314108));
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__124293__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
var page_entity = (function (){var G__124294 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),page], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__124294) : frontend.db.entity.call(null,G__124294));
})();
var repo = frontend.state.sub(new cljs.core.Keyword("git","current-repo","git/current-repo",107438825));
var format__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(page_entity,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
var block = frontend.db.model.query_block_by_uuid(uuid);
var content = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block);
if(clojure.string.blank_QMARK_(content)){
return null;
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,".py-2",".py-2",-1026433155),frontend.components.search.block_search_result_item(repo,uuid,format__$1,content,q,new cljs.core.Keyword(null,"block","block",664686210))], null);
}
}),new cljs.core.Keyword(null,"class","class",-2030961996),"ac-block-search"], null));
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
var result = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
frontend.components.editor.search_blocks_BANG_(state,result);

return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(state,new cljs.core.Keyword("frontend.components.editor","result","frontend.components.editor/result",-1063532914),result);
}),new cljs.core.Keyword(null,"did-update","did-update",-2143702256),(function (state){
frontend.components.editor.search_blocks_BANG_(state,new cljs.core.Keyword("frontend.components.editor","result","frontend.components.editor/result",-1063532914).cljs$core$IFn$_invoke$arity$1(state));

return state;
})], null)], null),"frontend.components.editor/block-search-auto-complete");
frontend.components.editor.block_search = rum.core.lazy_build(rum.core.build_defcs,(function (state,id,_format){
var pos = frontend.state.get_editor_last_pos();
var input = goog.dom.getElement(id);
var vec__124303 = new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state);
var id__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__124303,(0),null);
var format = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__124303,(1),null);
var current_pos = frontend.util.cursor.pos(input);
var edit_content = frontend.state.sub_edit_content.cljs$core$IFn$_invoke$arity$0();
var edit_block = frontend.state.get_edit_block();
var selected_text = frontend.handler.editor.get_selected_text();
var q = (function (){var or__5002__auto__ = selected_text;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
if((cljs.core.count(edit_content) >= current_pos)){
return cljs.core.subs.cljs$core$IFn$_invoke$arity$3(edit_content,pos,current_pos);
} else {
return null;
}
}
})();
if(cljs.core.truth_(input)){
var db_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo());
var embed_QMARK_ = ((db_QMARK_) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.commands._STAR_current_command),"Block embed")));
var page = ((embed_QMARK_)?logseq.common.util.page_ref.get_page_name(edit_content):null);
var embed_block_id = (cljs.core.truth_((function (){var and__5000__auto__ = embed_QMARK_;
if(and__5000__auto__){
var and__5000__auto____$1 = page;
if(cljs.core.truth_(and__5000__auto____$1)){
return logseq.common.util.uuid_string_QMARK_(page);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?cljs.core.uuid(page):null);
if(cljs.core.truth_(embed_block_id)){
var f = frontend.components.editor.block_on_chosen_handler(true,input,id__$1,q,format,null);
var block = (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(embed_block_id) : frontend.db.entity.call(null,embed_block_id));
if(cljs.core.truth_(block)){
f(block);
} else {
}

return null;
} else {
return frontend.components.editor.block_search_auto_complete(edit_block,input,id__$1,q,format,selected_text);
}
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
cljs.core.reset_BANG_(frontend.commands._STAR_current_command,null);

frontend.state.clear_search_result_BANG_();

return state;
})], null)], null),"frontend.components.editor/block-search");
frontend.components.editor.template_search_aux = rum.core.lazy_build(rum.core.build_defc,(function (id,q){
var vec__124317 = rum.core.use_state(null);
var matched_templates = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__124317,(0),null);
var set_matched_templates_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__124317,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor._LT_get_matched_templates(q)),(function (result){
return promesa.protocols._promise((function (){var G__124321 = cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","title","block/title",710445684),result);
return (set_matched_templates_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_matched_templates_BANG_.cljs$core$IFn$_invoke$arity$1(G__124321) : set_matched_templates_BANG_.call(null,G__124321));
})());
}));
}));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [q], null));

return frontend.ui.auto_complete(matched_templates,new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),frontend.handler.editor.template_on_chosen_handler(id),new cljs.core.Keyword(null,"on-enter","on-enter",-928988216),(function (_state){
return frontend.state.clear_editor_action_BANG_();
}),new cljs.core.Keyword(null,"empty-placeholder","empty-placeholder",-68202085),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-gray-500.px-4.py-2.text-sm","div.text-gray-500.px-4.py-2.text-sm",1030522825),"Search for a template"], null),new cljs.core.Keyword(null,"item-render","item-render",253627868),(function (template){
return new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(template);
}),new cljs.core.Keyword(null,"class","class",-2030961996),"black"], null));
}),null,"frontend.components.editor/template-search-aux");
frontend.components.editor.template_search = rum.core.lazy_build(rum.core.build_defc,(function (id,_format){
var pos = frontend.state.get_editor_last_pos();
var input = goog.dom.getElement(id);
if(cljs.core.truth_(input)){
var current_pos = frontend.util.cursor.pos(input);
var edit_content = frontend.state.sub_edit_content.cljs$core$IFn$_invoke$arity$0();
var q = (function (){var or__5002__auto__ = (((cljs.core.count(edit_content) >= current_pos))?cljs.core.subs.cljs$core$IFn$_invoke$arity$3(edit_content,pos,current_pos):null);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})();
return frontend.components.editor.template_search_aux(id,q);
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.editor/template-search");
frontend.components.editor.property_search = rum.core.lazy_build(rum.core.build_defc,(function (id){
var input = goog.dom.getElement(id);
var vec__124331 = rum.core.use_state(null);
var matched_properties = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__124331,(0),null);
var set_matched_properties_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__124331,(1),null);
var vec__124334 = rum.core.use_state("");
var q = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__124334,(0),null);
var set_q_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__124334,(1),null);
if(cljs.core.truth_(input)){
logseq.shui.hooks.use_effect_BANG_((function (){
return input.addEventListener("input",(function (_e){
var G__124342 = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"searching-property","searching-property",495243376).cljs$core$IFn$_invoke$arity$1(frontend.handler.editor.get_searching_property(input));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})();
return (set_q_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_q_BANG_.cljs$core$IFn$_invoke$arity$1(G__124342) : set_q_BANG_.call(null,G__124342));
}));
}),cljs.core.PersistentVector.EMPTY);

logseq.shui.hooks.use_effect_BANG_((function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor._LT_get_matched_properties(q)),(function (matched_properties__$1){
return promesa.protocols._promise((set_matched_properties_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_matched_properties_BANG_.cljs$core$IFn$_invoke$arity$1(matched_properties__$1) : set_matched_properties_BANG_.call(null,matched_properties__$1)));
}));
}));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [q], null));

var q_property = clojure.string.replace(clojure.string.lower_case(q),/\s+/,"-");
var non_exist_handler = (function (_state){
return frontend.handler.editor.property_on_chosen_handler(id,q_property)(null);
});
return frontend.ui.auto_complete(matched_properties,new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),frontend.handler.editor.property_on_chosen_handler(id,q_property),new cljs.core.Keyword(null,"on-enter","on-enter",-928988216),non_exist_handler,new cljs.core.Keyword(null,"empty-placeholder","empty-placeholder",-68202085),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.px-4.py-2.text-sm","div.px-4.py-2.text-sm",-1330417158),["Create a new property: ",q_property].join('')], null),new cljs.core.Keyword(null,"header","header",119441134),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.px-4.py-2.text-sm.font-medium","div.px-4.py-2.text-sm.font-medium",1453537315),"Matched properties: "], null),new cljs.core.Keyword(null,"item-render","item-render",253627868),(function (property){
return property;
}),new cljs.core.Keyword(null,"class","class",-2030961996),"black"], null));
} else {
return null;
}
}),null,"frontend.components.editor/property-search");
frontend.components.editor.property_value_search_aux = rum.core.lazy_build(rum.core.build_defc,(function (id,property,q){
var vec__124346 = rum.core.use_state(null);
var values = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__124346,(0),null);
var set_values_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__124346,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.get_matched_property_values(property,q)),(function (result){
return promesa.protocols._promise((set_values_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_values_BANG_.cljs$core$IFn$_invoke$arity$1(result) : set_values_BANG_.call(null,result)));
}));
}));
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [property,q], null));

return frontend.ui.auto_complete(values,new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),frontend.handler.editor.property_value_on_chosen_handler(id,q),new cljs.core.Keyword(null,"on-enter","on-enter",-928988216),(function (_state){
return frontend.handler.editor.property_value_on_chosen_handler(id,q)(null);
}),new cljs.core.Keyword(null,"empty-placeholder","empty-placeholder",-68202085),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.px-4.py-2.text-sm","div.px-4.py-2.text-sm",-1330417158),["Create a new property value: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(q)].join('')], null),new cljs.core.Keyword(null,"header","header",119441134),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.px-4.py-2.text-sm.font-medium","div.px-4.py-2.text-sm.font-medium",1453537315),"Matched property values: "], null),new cljs.core.Keyword(null,"item-render","item-render",253627868),(function (property_value){
return property_value;
}),new cljs.core.Keyword(null,"class","class",-2030961996),"black"], null));
}),null,"frontend.components.editor/property-value-search-aux");
frontend.components.editor.property_value_search = rum.core.lazy_build(rum.core.build_defc,(function (id){
var property = new cljs.core.Keyword(null,"property","property",-1114278232).cljs$core$IFn$_invoke$arity$1(frontend.state.get_editor_action_data());
var input = goog.dom.getElement(id);
if(cljs.core.truth_((function (){var and__5000__auto__ = input;
if(cljs.core.truth_(and__5000__auto__)){
return (!(clojure.string.blank_QMARK_(property)));
} else {
return and__5000__auto__;
}
})())){
var current_pos = frontend.util.cursor.pos(input);
var edit_content = frontend.state.sub_edit_content.cljs$core$IFn$_invoke$arity$0();
var start_idx = clojure.string.last_index_of.cljs$core$IFn$_invoke$arity$2(cljs.core.subs.cljs$core$IFn$_invoke$arity$3(edit_content,(0),current_pos),logseq.graph_parser.property.colons);
var q = (function (){var or__5002__auto__ = (((current_pos >= (start_idx + (2))))?cljs.core.subs.cljs$core$IFn$_invoke$arity$3(edit_content,(start_idx + (2)),current_pos):null);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})();
var q__$1 = clojure.string.triml(q);
return frontend.components.editor.property_value_search_aux(id,property,q__$1);
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.editor/property-value-search");
frontend.components.editor.code_block_mode_keyup_listener = rum.core.lazy_build(rum.core.build_defc,(function (_q,_edit_content,last_pos,current_pos){
logseq.shui.hooks.use_effect_BANG_((function (){
if((current_pos < last_pos)){
return frontend.state.clear_editor_action_BANG_();
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [last_pos,current_pos], null));

return daiquiri.core.create_element(daiquiri.core.fragment,null,null);
}),null,"frontend.components.editor/code-block-mode-keyup-listener");
frontend.components.editor.code_block_mode_picker = rum.core.lazy_build(rum.core.build_defc,(function (id,format){
return daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = (function (){var G__124368 = window.CodeMirror;
var G__124368__$1 = (((G__124368 == null))?null:G__124368.modes);
var G__124368__$2 = (((G__124368__$1 == null))?null:Object.keys(G__124368__$1));
var G__124368__$3 = (((G__124368__$2 == null))?null:cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$1(G__124368__$2));
if((G__124368__$3 == null)){
return null;
} else {
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__124357_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("null",p1__124357_SHARP_);
}),G__124368__$3);
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var modes = temp__5804__auto__;
var temp__5804__auto____$1 = goog.dom.getElement(id);
if(cljs.core.truth_(temp__5804__auto____$1)){
var input = temp__5804__auto____$1;
var pos = frontend.state.get_editor_last_pos();
var current_pos = frontend.util.cursor.pos(input);
var edit_content = (function (){var or__5002__auto__ = frontend.state.sub_edit_content.cljs$core$IFn$_invoke$arity$0();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})();
var q = (function (){var or__5002__auto__ = frontend.handler.editor.get_selected_text();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = logseq.common.util.safe_subs.cljs$core$IFn$_invoke$arity$3(edit_content,pos,current_pos);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return "";
}
}
})();
var matched = cljs.core.seq((frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$2 ? frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$2(modes,q) : frontend.search.fuzzy_search.call(null,modes,q)));
var matched__$1 = (function (){var or__5002__auto__ = matched;
if(or__5002__auto__){
return or__5002__auto__;
} else {
if(clojure.string.blank_QMARK_(q)){
return modes;
} else {
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [q], null);
}
}
})();
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),frontend.components.editor.code_block_mode_keyup_listener(q,edit_content,pos,current_pos),frontend.ui.auto_complete(matched__$1,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),(function (chosen,_click_QMARK_){
frontend.state.clear_editor_action_BANG_();

var prefix = ["```",cljs.core.str.cljs$core$IFn$_invoke$arity$1(chosen)].join('');
var last_pattern = ["```",cljs.core.str.cljs$core$IFn$_invoke$arity$1(q)].join('');
var G__124369_124592 = id;
var G__124370_124593 = prefix;
var G__124371_124594 = format;
var G__124372_124595 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"last-pattern","last-pattern",-104197189),last_pattern], null);
(frontend.handler.editor.insert_command_BANG_.cljs$core$IFn$_invoke$arity$4 ? frontend.handler.editor.insert_command_BANG_.cljs$core$IFn$_invoke$arity$4(G__124369_124592,G__124370_124593,G__124371_124594,G__124372_124595) : frontend.handler.editor.insert_command_BANG_.call(null,G__124369_124592,G__124370_124593,G__124371_124594,G__124372_124595));

return promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.state.get_current_repo(),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(frontend.state.get_edit_block()),input.value),(function (){
return frontend.commands.handle_step.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("codemirror","focus","codemirror/focus",-19393885)], null));
}));
}),new cljs.core.Keyword(null,"on-enter","on-enter",-928988216),(function (){
frontend.state.clear_editor_action_BANG_();

return frontend.commands.handle_step.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("codemirror","focus","codemirror/focus",-19393885)], null));
}),new cljs.core.Keyword(null,"item-render","item-render",253627868),(function (mode,_chosen_QMARK_){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong","strong",269529000),mode], null);
}),new cljs.core.Keyword(null,"class","class",-2030961996),"code-block-mode-picker"], null))], null);
} else {
return null;
}
} else {
return null;
}
})());
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.editor/code-block-mode-picker");
frontend.components.editor.editor_input = rum.core.lazy_build(rum.core.build_defcs,(function (state,_id,on_submit,_on_cancel){
return daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = frontend.state.get_editor_action_data();
if(cljs.core.truth_(temp__5804__auto__)){
var action_data = temp__5804__auto__;
var map__124404 = action_data;
var map__124404__$1 = cljs.core.__destructure_map(map__124404);
var pos = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__124404__$1,new cljs.core.Keyword(null,"pos","pos",-864607220));
var options = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__124404__$1,new cljs.core.Keyword(null,"options","options",99638489));
var input_value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.components.editor","input-value","frontend.components.editor/input-value",231817688));
if(cljs.core.seq(options)){
var command = new cljs.core.Keyword(null,"command","command",-894540724).cljs$core$IFn$_invoke$arity$1(cljs.core.first(options));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.p-2.rounded-md.flex.flex-col.gap-2","div.p-2.rounded-md.flex.flex-col.gap-2",877557921),(function (){var iter__5480__auto__ = (function frontend$components$editor$iter__124411(s__124412){
return (new cljs.core.LazySeq(null,(function (){
var s__124412__$1 = s__124412;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__124412__$1);
if(temp__5804__auto____$1){
var s__124412__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__124412__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__124412__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__124414 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__124413 = (0);
while(true){
if((i__124413 < size__5479__auto__)){
var map__124417 = cljs.core._nth(c__5478__auto__,i__124413);
var map__124417__$1 = cljs.core.__destructure_map(map__124417);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__124417__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var placeholder = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__124417__$1,new cljs.core.Keyword(null,"placeholder","placeholder",-104873083));
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__124417__$1,new cljs.core.Keyword(null,"type","type",1174270348));
cljs.core.chunk_append(b__124414,(function (){var G__124418 = (function (){var G__124423 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"key","key",-1516042587),["modal-input-",cljs.core.name(id)].join(''),new cljs.core.Keyword(null,"type","type",1174270348),(function (){var or__5002__auto__ = type;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "text";
}
})(),new cljs.core.Keyword(null,"auto-complete","auto-complete",244958848),((frontend.util.chrome_QMARK_())?"chrome-off":"off"),new cljs.core.Keyword(null,"on-change","on-change",-732046149),((function (i__124413,map__124417,map__124417__$1,id,placeholder,type,c__5478__auto__,size__5479__auto__,b__124414,s__124412__$2,temp__5804__auto____$1,command,map__124404,map__124404__$1,pos,options,input_value,action_data,temp__5804__auto__){
return (function (e){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(input_value,cljs.core.assoc,id,frontend.util.evalue(e));
});})(i__124413,map__124417,map__124417__$1,id,placeholder,type,c__5478__auto__,size__5479__auto__,b__124414,s__124412__$2,temp__5804__auto____$1,command,map__124404,map__124404__$1,pos,options,input_value,action_data,temp__5804__auto__))
], null);
if(cljs.core.truth_(placeholder)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__124423,new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),placeholder);
} else {
return G__124423;
}
})();
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__124418) : logseq.shui.ui.input.call(null,G__124418));
})());

var G__124607 = (i__124413 + (1));
i__124413 = G__124607;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__124414),frontend$components$editor$iter__124411(cljs.core.chunk_rest(s__124412__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__124414),null);
}
} else {
var map__124431 = cljs.core.first(s__124412__$2);
var map__124431__$1 = cljs.core.__destructure_map(map__124431);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__124431__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var placeholder = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__124431__$1,new cljs.core.Keyword(null,"placeholder","placeholder",-104873083));
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__124431__$1,new cljs.core.Keyword(null,"type","type",1174270348));
return cljs.core.cons((function (){var G__124433 = (function (){var G__124434 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"key","key",-1516042587),["modal-input-",cljs.core.name(id)].join(''),new cljs.core.Keyword(null,"type","type",1174270348),(function (){var or__5002__auto__ = type;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "text";
}
})(),new cljs.core.Keyword(null,"auto-complete","auto-complete",244958848),((frontend.util.chrome_QMARK_())?"chrome-off":"off"),new cljs.core.Keyword(null,"on-change","on-change",-732046149),((function (map__124431,map__124431__$1,id,placeholder,type,s__124412__$2,temp__5804__auto____$1,command,map__124404,map__124404__$1,pos,options,input_value,action_data,temp__5804__auto__){
return (function (e){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(input_value,cljs.core.assoc,id,frontend.util.evalue(e));
});})(map__124431,map__124431__$1,id,placeholder,type,s__124412__$2,temp__5804__auto____$1,command,map__124404,map__124404__$1,pos,options,input_value,action_data,temp__5804__auto__))
], null);
if(cljs.core.truth_(placeholder)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__124434,new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),placeholder);
} else {
return G__124434;
}
})();
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__124433) : logseq.shui.ui.input.call(null,G__124433));
})(),frontend$components$editor$iter__124411(cljs.core.rest(s__124412__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(options);
})(),frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Submit",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
frontend.util.stop(e);

var G__124440 = command;
var G__124441 = cljs.core.deref(input_value);
var G__124442 = pos;
return (on_submit.cljs$core$IFn$_invoke$arity$3 ? on_submit.cljs$core$IFn$_invoke$arity$3(G__124440,G__124441,G__124442) : on_submit.call(null,G__124440,G__124441,G__124442));
})], 0))], null);
} else {
return null;
}
} else {
return null;
}
})());
}),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,rum.core.local.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword("frontend.components.editor","input-value","frontend.components.editor/input-value",231817688)),frontend.mixins.event_mixin.cljs$core$IFn$_invoke$arity$1((function (state){
return frontend.mixins.on_key_down.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.PersistentArrayMap(null, 2, [(13),(function (state__$1,e){
var input_value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state__$1,new cljs.core.Keyword("frontend.components.editor","input-value","frontend.components.editor/input-value",231817688));
var input_option = new cljs.core.Keyword(null,"options","options",99638489).cljs$core$IFn$_invoke$arity$1(frontend.state.get_editor_show_input());
if(cljs.core.seq(cljs.core.deref(input_value))){
frontend.util.stop(e);

var vec__124445_124611 = new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state__$1);
var _id_124612 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__124445_124611,(0),null);
var on_submit_124613 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__124445_124611,(1),null);
var command_124614 = new cljs.core.Keyword(null,"command","command",-894540724).cljs$core$IFn$_invoke$arity$1(cljs.core.first(input_option));
var G__124448_124615 = command_124614;
var G__124449_124616 = cljs.core.deref(input_value);
(on_submit_124613.cljs$core$IFn$_invoke$arity$2 ? on_submit_124613.cljs$core$IFn$_invoke$arity$2(G__124448_124615,G__124449_124616) : on_submit_124613.call(null,G__124448_124615,G__124449_124616));

return cljs.core.reset_BANG_(input_value,null);
} else {
return null;
}
}),(27),(function (_state,_e){
var vec__124450 = new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__124450,(0),null);
var _on_submit = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__124450,(1),null);
var on_cancel = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__124450,(2),null);
return (on_cancel.cljs$core$IFn$_invoke$arity$1 ? on_cancel.cljs$core$IFn$_invoke$arity$1(id) : on_cancel.call(null,id));
})], null));
}))], null),"frontend.components.editor/editor-input");
frontend.components.editor.image_uploader = rum.core.lazy_build(rum.core.build_defc,(function (id,format){
return daiquiri.core.create_element("div",{'className':"image-uploader"},[daiquiri.core.create_element("input",{'id':"upload-file",'type':"file",'onChange':rum.core.mark_sync_update((function (e){
var files = e.target.files;
return frontend.handler.editor.upload_asset_BANG_(id,files,format,frontend.handler.editor._STAR_asset_uploading_QMARK_,false);
})),'hidden':true},[])]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.editor/image-uploader");
frontend.components.editor.set_up_key_down_BANG_ = (function frontend$components$editor$set_up_key_down_BANG_(state,format){
return frontend.mixins.on_key_down.cljs$core$IFn$_invoke$arity$3(state,cljs.core.PersistentArrayMap.EMPTY,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"not-matched-handler","not-matched-handler",1162926887),frontend.handler.editor.keydown_not_matched_handler(format)], null));
});
frontend.components.editor.set_up_key_up_BANG_ = (function frontend$components$editor$set_up_key_up_BANG_(state,input_SINGLEQUOTE_){
return frontend.mixins.on_key_up(state,cljs.core.PersistentArrayMap.EMPTY,frontend.handler.editor.keyup_handler(state,input_SINGLEQUOTE_));
});
frontend.components.editor.search_timeout = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
frontend.components.editor.setup_key_listener_BANG_ = (function frontend$components$editor$setup_key_listener_BANG_(state){
var map__124456 = frontend.handler.editor.get_state();
var map__124456__$1 = cljs.core.__destructure_map(map__124456);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__124456__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__124456__$1,new cljs.core.Keyword(null,"format","format",-1306924766));
var input_id = id;
var input_SINGLEQUOTE_ = goog.dom.getElement(input_id);
frontend.components.editor.set_up_key_down_BANG_(state,format);

return frontend.components.editor.set_up_key_up_BANG_(state,input_SINGLEQUOTE_);
});
/**
 * Get textarea css class according to it's content
 */
frontend.components.editor.get_editor_style_class = (function frontend$components$editor$get_editor_style_class(block,content,format){
var content__$1 = (cljs.core.truth_(content)?cljs.core.str.cljs$core$IFn$_invoke$arity$1(content):"");
var heading = frontend.handler.property.util.get_block_property_value(block,new cljs.core.Keyword("logseq.property","heading","logseq.property/heading",1858749415));
var heading__$1 = ((heading === true)?(function (){var x__5090__auto__ = (new cljs.core.Keyword("block","level","block/level",1182509971).cljs$core$IFn$_invoke$arity$1(block) + (1));
var y__5091__auto__ = (6);
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})():heading);
return [(((((content__$1.length > (1000))) || (clojure.string.includes_QMARK_(content__$1,"\n"))))?"multiline-block":"uniline-block")," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var G__124469 = format;
var G__124469__$1 = (((G__124469 instanceof cljs.core.Keyword))?G__124469.fqn:null);
switch (G__124469__$1) {
case "markdown":
if(cljs.core.truth_(heading__$1)){
return ["h",cljs.core.str.cljs$core$IFn$_invoke$arity$1(heading__$1)].join('');
} else {
if(clojure.string.starts_with_QMARK_(content__$1,"# ")){
return "h1";
} else {
if(clojure.string.starts_with_QMARK_(content__$1,"## ")){
return "h2";
} else {
if(clojure.string.starts_with_QMARK_(content__$1,"### ")){
return "h3";
} else {
if(clojure.string.starts_with_QMARK_(content__$1,"#### ")){
return "h4";
} else {
if(clojure.string.starts_with_QMARK_(content__$1,"##### ")){
return "h5";
} else {
if(clojure.string.starts_with_QMARK_(content__$1,"###### ")){
return "h6";
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = clojure.string.starts_with_QMARK_(content__$1,"---\n");
if(and__5000__auto__){
return content__$1.endsWith("\n---");
} else {
return and__5000__auto__;
}
})())){
return "page-properties";
} else {
return "normal-block";

}
}
}
}
}
}
}
}

break;
default:
if(cljs.core.truth_(heading__$1)){
return ["h",cljs.core.str.cljs$core$IFn$_invoke$arity$1(heading__$1)].join('');
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = clojure.string.starts_with_QMARK_(content__$1,"---\n");
if(and__5000__auto__){
return content__$1.endsWith("\n---");
} else {
return and__5000__auto__;
}
})())){
return "page-properties";
} else {
return "normal-block";

}
}

}
})())].join('');
});
/**
 * Check if the row height of editor textarea is changed, which happens when font-size changed
 */
frontend.components.editor.editor_row_height_unchanged_QMARK_ = (function frontend$components$editor$editor_row_height_unchanged_QMARK_(){
var last_key = frontend.state.get_last_key_code();
return ((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(frontend.util.keycode.enter,new cljs.core.Keyword(null,"key-code","key-code",-1732114304).cljs$core$IFn$_invoke$arity$1(last_key))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(frontend.util.keycode.enter_code,new cljs.core.Keyword(null,"code","code",1586293142).cljs$core$IFn$_invoke$arity$1(last_key))));
});
frontend.components.editor.mock_textarea = rum.core.lazy_build(rum.core.build_defc,(function (content){
return daiquiri.core.create_element("div",{'id':"mock-text",'style':{'width':"100%",'height':"100%",'position':"absolute",'visibility':"hidden",'top':(0),'left':(0)}},[(function (){var content__$1 = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(content),"0"].join('');
var graphemes = frontend.util.split_graphemes(content__$1);
var graphemes_char_index = cljs.core.reductions.cljs$core$IFn$_invoke$arity$3((function (p1__124476_SHARP_,p2__124477_SHARP_){
return (p1__124476_SHARP_ + cljs.core.count(p2__124477_SHARP_));
}),(0),graphemes);
return cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$editor$iter__124480(s__124481){
return (new cljs.core.LazySeq(null,(function (){
var s__124481__$1 = s__124481;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__124481__$1);
if(temp__5804__auto__){
var s__124481__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__124481__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__124481__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__124483 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__124482 = (0);
while(true){
if((i__124482 < size__5479__auto__)){
var vec__124488 = cljs.core._nth(c__5478__auto__,i__124482);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__124488,(0),null);
var c = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__124488,(1),null);
cljs.core.chunk_append(b__124483,((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(c,"\n"))?daiquiri.core.create_element("span",{'id':["mock-text_",cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx)].join(''),'key':idx},["0",daiquiri.core.create_element("br",null,null)]):daiquiri.core.create_element("span",{'id':["mock-text_",cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx)].join(''),'key':idx},[daiquiri.interpreter.interpret(c)])));

var G__124622 = (i__124482 + (1));
i__124482 = G__124622;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__124483),frontend$components$editor$iter__124480(cljs.core.chunk_rest(s__124481__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__124483),null);
}
} else {
var vec__124496 = cljs.core.first(s__124481__$2);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__124496,(0),null);
var c = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__124496,(1),null);
return cljs.core.cons(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(c,"\n"))?daiquiri.core.create_element("span",{'id':["mock-text_",cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx)].join(''),'key':idx},["0",daiquiri.core.create_element("br",null,null)]):daiquiri.core.create_element("span",{'id':["mock-text_",cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx)].join(''),'key':idx},[daiquiri.interpreter.interpret(c)])),frontend$components$editor$iter__124480(cljs.core.rest(s__124481__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.sorted_map(),cljs.core.zipmap(graphemes_char_index,graphemes)));
})());
})()]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"did-update","did-update",-2143702256),(function (state){
if(cljs.core.truth_(cljs.core.deref(new cljs.core.Keyword("editor","on-paste?","editor/on-paste?",1852983579).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))))){
} else {
try{frontend.handler.editor.handle_last_input();
}catch (e124501){var _e_124623 = e124501;
}}

frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","on-paste?","editor/on-paste?",1852983579),false);

return state;
})], null)], null),"frontend.components.editor/mock-textarea");
frontend.components.editor.open_editor_popup_BANG_ = (function frontend$components$editor$open_editor_popup_BANG_(id,content,opts){
var input = frontend.state.get_input();
var line_height = (function (){var or__5002__auto__ = (cljs.core.truth_(input)?(function (){var G__124510 = window.getComputedStyle(input).lineHeight;
var G__124510__$1 = (((G__124510 == null))?null:parseFloat(G__124510));
if((G__124510__$1 == null)){
return null;
} else {
return (G__124510__$1 - (4));
}
})():null);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (20);
}
})();
var map__124508 = frontend.util.cursor.get_caret_pos.cljs$core$IFn$_invoke$arity$1(input);
var map__124508__$1 = cljs.core.__destructure_map(map__124508);
var left = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__124508__$1,new cljs.core.Keyword(null,"left","left",-399115937));
var top = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__124508__$1,new cljs.core.Keyword(null,"top","top",-1856271961));
var rect = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__124508__$1,new cljs.core.Keyword(null,"rect","rect",-108902628));
var pos = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [((left + new cljs.core.Keyword(null,"left","left",-399115937).cljs$core$IFn$_invoke$arity$1(rect)) + (-20)),((top + new cljs.core.Keyword(null,"top","top",-1856271961).cljs$core$IFn$_invoke$arity$1(rect)) + line_height)], null);
var map__124509 = opts;
var map__124509__$1 = cljs.core.__destructure_map(map__124509);
var root_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__124509__$1,new cljs.core.Keyword(null,"root-props","root-props",-1015460595));
var content_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__124509__$1,new cljs.core.Keyword(null,"content-props","content-props",687449284));
var G__124513 = pos;
var G__124514 = content;
var G__124515 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.keyword.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"editor.commands","editor.commands",-1806363459),id),new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"start","start",-355208981),new cljs.core.Keyword(null,"root-props","root-props",-1015460595),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"onOpenChange","onOpenChange",-675762944),(function (p1__124502_SHARP_){
if(cljs.core.truth_(p1__124502_SHARP_)){
return null;
} else {
return frontend.state.clear_editor_action_BANG_();
}
})], null),root_props], 0)),new cljs.core.Keyword(null,"content-props","content-props",687449284),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"onOpenAutoFocus","onOpenAutoFocus",-99363202),(function (p1__124503_SHARP_){
return p1__124503_SHARP_.preventDefault();
}),new cljs.core.Keyword(null,"onCloseAutoFocus","onCloseAutoFocus",-349969117),(function (p1__124504_SHARP_){
return p1__124504_SHARP_.preventDefault();
}),new cljs.core.Keyword(null,"data-editor-popup-ref","data-editor-popup-ref",2109070097),cljs.core.name(id)], null),content_props], 0)),new cljs.core.Keyword(null,"force-popover?","force-popover?",237318839),true], null),cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(opts,new cljs.core.Keyword(null,"root-props","root-props",-1015460595),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"content-props","content-props",687449284)], 0))], 0));
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__124513,G__124514,G__124515) : logseq.shui.ui.popup_show_BANG_.call(null,G__124513,G__124514,G__124515));
});
frontend.components.editor.shui_editor_popups = rum.core.lazy_build(rum.core.build_defc,(function (id,format,action,_data){
logseq.shui.hooks.use_effect_BANG_((function (){
var pid = (function (){var G__124520 = action;
var G__124520__$1 = (((G__124520 instanceof cljs.core.Keyword))?G__124520.fqn:null);
switch (G__124520__$1) {
case "commands":
return frontend.components.editor.open_editor_popup_BANG_(new cljs.core.Keyword(null,"commands","commands",161008658),frontend.components.editor.commands(id,format),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"withoutAnimation","withoutAnimation",-1934166132),false], null)], null));

break;
case "block-search":
case "page-search":
case "page-search-hashtag":
return frontend.components.editor.open_editor_popup_BANG_(action,((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"block-search","block-search",-897517253),action))?frontend.components.editor.block_search(id,format):frontend.components.editor.page_search(id,format)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"root-props","root-props",-1015460595),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"onOpenChange","onOpenChange",-675762944),(function (p1__124517_SHARP_){
if(cljs.core.truth_(p1__124517_SHARP_)){
return null;
} else {
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"page-search","page-search",1842925280),null,new cljs.core.Keyword(null,"block-search","block-search",-897517253),null,new cljs.core.Keyword(null,"page-search-hashtag","page-search-hashtag",1121040573),null], null), null),frontend.state.get_editor_action())){
return frontend.state.clear_editor_action_BANG_();
} else {
return null;
}
}
})], null)], null));

break;
case "datepicker":
return frontend.components.editor.open_editor_popup_BANG_(new cljs.core.Keyword(null,"datepicker","datepicker",821741450),frontend.components.file_based.datetime.date_picker(id,format,null),cljs.core.PersistentArrayMap.EMPTY);

break;
case "input":
return frontend.components.editor.open_editor_popup_BANG_(new cljs.core.Keyword(null,"input","input",556931961),frontend.components.editor.editor_input(id,(function (command,m){
return frontend.handler.editor.handle_command_input(command,id,format,m);
}),(function (){
return frontend.handler.editor.handle_command_input_close(id);
})),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"onOpenAutoFocus","onOpenAutoFocus",-99363202),(function (){
return cljs.core.List.EMPTY;
})], null)], null));

break;
case "select-code-block-mode":
return frontend.components.editor.open_editor_popup_BANG_(new cljs.core.Keyword(null,"code-block-mode-picker","code-block-mode-picker",-1753498579),frontend.components.editor.code_block_mode_picker(id,format),cljs.core.PersistentArrayMap.EMPTY);

break;
case "template-search":
return frontend.components.editor.open_editor_popup_BANG_(new cljs.core.Keyword(null,"template-search","template-search",-1861932888),frontend.components.editor.template_search(id,format),cljs.core.PersistentArrayMap.EMPTY);

break;
case "property-search":
case "property-value-search":
return frontend.components.editor.open_editor_popup_BANG_(action,((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"property-search","property-search",1730602043),action))?frontend.components.editor.property_search(id):frontend.components.editor.property_value_search(id)),cljs.core.PersistentArrayMap.EMPTY);

break;
case "zotero":
return frontend.components.editor.open_editor_popup_BANG_(new cljs.core.Keyword(null,"zotero","zotero",878834781),frontend.extensions.zotero.zotero_search(id),cljs.core.PersistentArrayMap.EMPTY);

break;
default:
return false;

}
})();
return (function (){
if(cljs.core.truth_(pid)){
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1(pid) : logseq.shui.ui.popup_hide_BANG_.call(null,pid));
} else {
return null;
}
});
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [action], null));

return daiquiri.core.create_element(daiquiri.core.fragment,null,null);
}),null,"frontend.components.editor/shui-editor-popups");
/**
 * React to atom changes, find and render the correct popup
 */
frontend.components.editor.command_popups = rum.core.lazy_build(rum.core.build_defc,(function (id,format){
var action = frontend.state.sub(new cljs.core.Keyword("editor","action","editor/action",449993861));
return frontend.components.editor.shui_editor_popups(id,format,action,null);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.editor/command-popups");
frontend.components.editor.editor_on_hide = (function frontend$components$editor$editor_on_hide(state,type,e){
var action = frontend.state.get_editor_action();
var vec__124531 = new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state);
var _id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__124531,(0),null);
var config = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__124531,(1),null);
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(type,new cljs.core.Keyword(null,"esc","esc",-1671924121));
if(and__5000__auto__){
return frontend.handler.editor.editor_commands_popup_exists_QMARK_();
} else {
return and__5000__auto__;
}
})())){
return null;
} else {
if(((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"page-search","page-search",1842925280),null,new cljs.core.Keyword(null,"template-search","template-search",-1861932888),null,new cljs.core.Keyword(null,"datepicker","datepicker",821741450),null,new cljs.core.Keyword(null,"commands","commands",161008658),null,new cljs.core.Keyword(null,"property-value-search","property-value-search",1985137335),null,new cljs.core.Keyword(null,"property-search","property-search",1730602043),null,new cljs.core.Keyword(null,"block-search","block-search",-897517253),null,new cljs.core.Keyword(null,"page-search-hashtag","page-search-hashtag",1121040573),null], null), null),action)) || ((((action instanceof cljs.core.Keyword)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.namespace(action),"editor.action")))))){
if(cljs.core.truth_(e)){
return frontend.util.stop(e);
} else {
return null;
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"input","input",556931961),action)){
return null;
} else {
var select_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(type,new cljs.core.Keyword(null,"esc","esc",-1671924121));
var temp__5804__auto___124650 = goog.dom.getElement("app-container");
if(cljs.core.truth_(temp__5804__auto___124650)){
var container_124652 = temp__5804__auto___124650;
dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$2(container_124652,"blocks-selection-mode");
} else {
}

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.escape_editing.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"select?","select?",-1012224063),select_QMARK_], null)], 0))),(function (___41611__auto__){
return promesa.protocols._promise((function (){var G__124540 = config;
var G__124540__$1 = (((G__124540 == null))?null:new cljs.core.Keyword(null,"on-escape-editing","on-escape-editing",531842882).cljs$core$IFn$_invoke$arity$1(G__124540));
if((G__124540__$1 == null)){
return null;
} else {
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(G__124540__$1,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.uuid),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(type,new cljs.core.Keyword(null,"esc","esc",-1671924121))], null));
}
})());
}));
}));

}
}
}
});
frontend.components.editor.box = rum.core.lazy_build(rum.core.build_defcs,(function (state,p__124552,id,config){
var map__124553 = p__124552;
var map__124553__$1 = cljs.core.__destructure_map(map__124553);
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__124553__$1,new cljs.core.Keyword(null,"format","format",-1306924766));
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__124553__$1,new cljs.core.Keyword(null,"block","block",664686210));
var parent_block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__124553__$1,new cljs.core.Keyword(null,"parent-block","parent-block",-1919487774));
var _STAR_ref = new cljs.core.Keyword("frontend.components.editor","ref","frontend.components.editor/ref",-1583377936).cljs$core$IFn$_invoke$arity$1(state);
var content = frontend.state.sub_edit_content.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block));
var heading_class = frontend.components.editor.get_editor_style_class(block,content,format);
var opts = (function (){var G__124554 = cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"cacheMeasurements","cacheMeasurements",-1280071997),new cljs.core.Keyword(null,"ref","ref",1289896967),new cljs.core.Keyword(null,"autocapitalize","autocapitalize",1015077767),new cljs.core.Keyword(null,"default-value","default-value",232220170),new cljs.core.Keyword(null,"autocorrect","autocorrect",531427757),new cljs.core.Keyword(null,"on-click","on-click",1632826543),new cljs.core.Keyword(null,"on-paste","on-paste",-50859856),new cljs.core.Keyword(null,"minRows","minRows",-1979722096),new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.Keyword(null,"auto-focus","auto-focus",1250006231),new cljs.core.Keyword(null,"on-change","on-change",-732046149),new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765)],[frontend.components.editor.editor_row_height_unchanged_QMARK_(),(function (p1__124549_SHARP_){
return cljs.core.reset_BANG_(_STAR_ref,p1__124549_SHARP_);
}),"off",(function (){var or__5002__auto__ = content;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})(),"off",frontend.handler.editor.editor_on_click_BANG_(id),frontend.handler.paste.editor_on_paste_BANG_(id),((frontend.state.enable_grammarly_QMARK_())?(2):(1)),id,heading_class,true,frontend.handler.editor.editor_on_change_BANG_(block,id,frontend.components.editor.search_timeout),(function (e){
var temp__5802__auto__ = new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765).cljs$core$IFn$_invoke$arity$1(config);
if(cljs.core.truth_(temp__5802__auto__)){
var on_key_down = temp__5802__auto__;
return (on_key_down.cljs$core$IFn$_invoke$arity$1 ? on_key_down.cljs$core$IFn$_invoke$arity$1(e) : on_key_down.call(null,e));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.util.ekey(e),"Escape")){
return frontend.components.editor.editor_on_hide(state,new cljs.core.Keyword(null,"esc","esc",-1671924121),e);
} else {
return null;
}
}
})]);
var G__124554__$1 = (((!((parent_block == null))))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__124554,new cljs.core.Keyword(null,"parentblockid","parentblockid",1382468055),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(parent_block))):G__124554);
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__124554__$1,new cljs.core.Keyword(null,"editor-opts","editor-opts",-1306154715).cljs$core$IFn$_invoke$arity$1(config)], 0));

})();
return daiquiri.core.create_element("div",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["editor-inner","flex","flex-1",(cljs.core.truth_(block)?"block-editor":"non-block-editor")], null))},[frontend.ui.ls_textarea(opts),frontend.components.editor.mock_textarea(content),frontend.components.editor.command_popups(id,format),(cljs.core.truth_(format)?frontend.components.editor.image_uploader(id,format):null)]);
}),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(state,new cljs.core.Keyword("frontend.components.editor","id","frontend.components.editor/id",1375337451),cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.random_uuid()),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("frontend.components.editor","ref","frontend.components.editor/ref",-1583377936),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null)], 0));
}),new cljs.core.Keyword(null,"did-mount","did-mount",918232960),(function (state){
frontend.state.set_editor_args_BANG_(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state));

return state;
}),new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","raw-mode-block","editor/raw-mode-block",-1788505944),null);

return state;
})], null),frontend.mixins.event_mixin.cljs$core$IFn$_invoke$arity$1((function (state){
return frontend.mixins.hide_when_esc_or_outside.cljs$core$IFn$_invoke$arity$variadic(state,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"node","node",581201198),cljs.core.deref(new cljs.core.Keyword("frontend.components.editor","ref","frontend.components.editor/ref",-1583377936).cljs$core$IFn$_invoke$arity$1(state)),new cljs.core.Keyword(null,"on-hide","on-hide",1263105709),(function (_state,e,type){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(type,new cljs.core.Keyword(null,"esc","esc",-1671924121))){
return null;
} else {
return frontend.components.editor.editor_on_hide(state,type,e);
}
})], null)], 0));
})),frontend.mixins.event_mixin.cljs$core$IFn$_invoke$arity$1(frontend.components.editor.setup_key_listener_BANG_),frontend.handler.editor.lifecycle.lifecycle], null),"frontend.components.editor/box");

//# sourceMappingURL=frontend.components.editor.js.map
