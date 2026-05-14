goog.provide('frontend.extensions.slide');
frontend.extensions.slide.loaded_QMARK_ = (function frontend$extensions$slide$loaded_QMARK_(){
return window.Reveal;
});
frontend.extensions.slide.with_properties = (function frontend$extensions$slide$with_properties(m,block){
var repo = frontend.state.get_current_repo();
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo);
var properties = ((db_based_QMARK_)?(function (){var properties = logseq.db.frontend.property.properties(block);
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__73497){
var vec__73498 = p__73497;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73498,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73498,(1),null);
if(cljs.core.truth_(new cljs.core.Keyword("logseq.property","hide?","logseq.property/hide?",68365746).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$2 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$2(repo,k) : frontend.db.entity.call(null,repo,k))))){
return null;
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,(cljs.core.truth_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(v))?logseq.db.frontend.property.ref__GT_property_value_contents(frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$0(),v):v)], null);
}
}),properties));
})():new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block));
if(cljs.core.seq(properties)){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([m,cljs.core.update_keys(properties,(function (k){
return clojure.string.replace(["data-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(((db_based_QMARK_)?frontend.handler.db_based.property.util.get_property_name(k):cljs.core.name(k)))].join(''),"data-data-","data-");
}))], 0));
} else {
return m;
}
});
if((typeof frontend !== 'undefined') && (typeof frontend.extensions !== 'undefined') && (typeof frontend.extensions.slide !== 'undefined') && (typeof frontend.extensions.slide._STAR_loading_QMARK_ !== 'undefined')){
} else {
frontend.extensions.slide._STAR_loading_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
}
frontend.extensions.slide.render_BANG_ = (function frontend$extensions$slide$render_BANG_(){
var deck = (new window.Reveal(document.querySelector(".reveal"),cljs_bean.core.__GT_js(new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"embedded","embedded",-115486248),true,new cljs.core.Keyword(null,"controls","controls",1340701452),true,new cljs.core.Keyword(null,"history","history",-247395220),false,new cljs.core.Keyword(null,"center","center",-748944368),true,new cljs.core.Keyword(null,"transition","transition",765692007),"slide",new cljs.core.Keyword(null,"keyboardCondition","keyboardCondition",-1910114035),"focused"], null))));
return deck.initialize();
});
frontend.extensions.slide.block_container = rum.core.lazy_build(rum.core.build_defc,(function (config,block,level){
var children = new cljs.core.Keyword("block","children","block/children",-1040716209).cljs$core$IFn$_invoke$arity$1(block);
var has_children_QMARK_ = cljs.core.seq(children);
var children__$1 = ((has_children_QMARK_)?cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block__$1){
var G__73508 = config;
var G__73509 = block__$1;
var G__73510 = (level + (1));
return (frontend.extensions.slide.block_container.cljs$core$IFn$_invoke$arity$3 ? frontend.extensions.slide.block_container.cljs$core$IFn$_invoke$arity$3(G__73508,G__73509,G__73510) : frontend.extensions.slide.block_container.call(null,G__73508,G__73509,G__73510));
}),children):null);
var block_el = frontend.components.block.block_container(config,cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(block,new cljs.core.Keyword("block","children","block/children",-1040716209)));
var dom_attrs = frontend.extensions.slide.with_properties(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),["slide-block-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block))].join('')], null),block);
if(has_children_QMARK_){
var attrs73515 = dom_attrs;
return daiquiri.core.create_element("section",((cljs.core.map_QMARK_(attrs73515))?daiquiri.interpreter.element_attributes(attrs73515):null),((cljs.core.map_QMARK_(attrs73515))?[(function (){var attrs73516 = block_el;
return daiquiri.core.create_element("section",((cljs.core.map_QMARK_(attrs73516))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["relative"], null)], null),attrs73516], 0))):{'className':"relative"}),((cljs.core.map_QMARK_(attrs73516))?null:[daiquiri.interpreter.interpret(attrs73516)]));
})(),daiquiri.interpreter.interpret(children__$1)]:[daiquiri.interpreter.interpret(attrs73515),(function (){var attrs73517 = block_el;
return daiquiri.core.create_element("section",((cljs.core.map_QMARK_(attrs73517))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["relative"], null)], null),attrs73517], 0))):{'className':"relative"}),((cljs.core.map_QMARK_(attrs73517))?null:[daiquiri.interpreter.interpret(attrs73517)]));
})(),daiquiri.interpreter.interpret(children__$1)]));
} else {
var attrs73518 = dom_attrs;
return daiquiri.core.create_element("section",((cljs.core.map_QMARK_(attrs73518))?daiquiri.interpreter.element_attributes(attrs73518):null),((cljs.core.map_QMARK_(attrs73518))?[daiquiri.interpreter.interpret(block_el)]:[daiquiri.interpreter.interpret(attrs73518),daiquiri.interpreter.interpret(block_el)]));
}
}),null,"frontend.extensions.slide/block-container");
frontend.extensions.slide.slide_content = (function frontend$extensions$slide$slide_content(loading_QMARK_,style,config,blocks){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-sm","p.text-sm",-1988028746),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("page","slide-view-tip-go-fullscreen","page/slide-view-tip-go-fullscreen",-960873303)], 0))], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.reveal","div.reveal",-318716100),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),style], null),(cljs.core.truth_(loading_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.ls-center","div.ls-center",501392471),frontend.ui.loading.cljs$core$IFn$_invoke$arity$1("")], null):null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.slides","div.slides",1806431712),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__73525_SHARP_){
return frontend.extensions.slide.block_container(config,p1__73525_SHARP_,(1));
}),blocks)], null)], null)], null);
});
frontend.extensions.slide.slide = rum.core.lazy_build(rum.core.build_defc,(function (page){
var page_name = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page);
var loading_QMARK_ = rum.core.react(frontend.extensions.slide._STAR_loading_QMARK_);
var journal_QMARK_ = (logseq.db.journal_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.journal_QMARK_.cljs$core$IFn$_invoke$arity$1(page) : logseq.db.journal_QMARK_.call(null,page));
var repo = frontend.state.get_current_repo();
var blocks = frontend.modules.outliner.tree.blocks__GT_vec_tree.cljs$core$IFn$_invoke$arity$2((function (){var G__73532 = repo;
var G__73533 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page);
return (frontend.db.get_page_blocks_no_cache.cljs$core$IFn$_invoke$arity$2 ? frontend.db.get_page_blocks_no_cache.cljs$core$IFn$_invoke$arity$2(G__73532,G__73533) : frontend.db.get_page_blocks_no_cache.call(null,G__73532,G__73533));
})(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page));
var blocks__$1 = (cljs.core.truth_((function (){var and__5000__auto__ = journal_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (!(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)));
} else {
return and__5000__auto__;
}
})())?cljs.core.rest(blocks):blocks);
var blocks__$2 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","children","block/children",-1040716209),(function (children){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__73531_SHARP_){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(p1__73531_SHARP_,new cljs.core.Keyword("block","children","block/children",-1040716209));
}),cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (x){
return cljs.core.tree_seq(cljs.core.map_QMARK_,new cljs.core.Keyword("block","children","block/children",-1040716209),x);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([children], 0)));
}));
}),blocks__$1);
var config = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"id","id",-1388402092),"slide-reveal-js",new cljs.core.Keyword(null,"slide?","slide?",1648217264),true,new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672),true,new cljs.core.Keyword(null,"page-name","page-name",974981762),page_name], null);
return daiquiri.interpreter.interpret(frontend.extensions.slide.slide_content(loading_QMARK_,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"height","height",1025178622),(400)], null),config,blocks__$2));
}),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"did-mount","did-mount",918232960),(function (state){
if(cljs.core.truth_(frontend.extensions.slide.loaded_QMARK_())){
cljs.core.reset_BANG_(frontend.extensions.slide._STAR_loading_QMARK_,false);

frontend.extensions.slide.render_BANG_();
} else {
cljs.core.reset_BANG_(frontend.extensions.slide._STAR_loading_QMARK_,true);

frontend.loader.load.cljs$core$IFn$_invoke$arity$2(frontend.config.asset_uri(((frontend.config.publishing_QMARK_)?"static/js/reveal.js":"/static/js/reveal.js")),(function (){
cljs.core.reset_BANG_(frontend.extensions.slide._STAR_loading_QMARK_,false);

return frontend.extensions.slide.render_BANG_();
}));
}

return state;
})], null)], null),"frontend.extensions.slide/slide");

//# sourceMappingURL=frontend.extensions.slide.js.map
