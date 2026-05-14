goog.provide('frontend.components.objects');
frontend.components.objects.add_new_class_object_BANG_ = (function frontend$components$objects$add_new_class_object_BANG_(class$,properties){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.api_insert_new_block_BANG_("",new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(class$),new cljs.core.Keyword(null,"properties","properties",685819552),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([properties,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(class$)], null)], 0)),new cljs.core.Keyword(null,"edit-block?","edit-block?",-310383789),false], null))),(function (block){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__124408 = (function (){var G__124415 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__124415) : frontend.db.entity.call(null,G__124415));
})();
var G__124409 = (0);
var G__124410 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"container-id","container-id",1274665684),new cljs.core.Keyword(null,"unknown-container","unknown-container",1739831473)], null);
return (frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3(G__124408,G__124409,G__124410) : frontend.handler.editor.edit_block_BANG_.call(null,G__124408,G__124409,G__124410));
})()),(function (___41611__auto__){
return promesa.protocols._promise(block);
}));
}));
}));
});
frontend.components.objects.build_asset_file_column = (function frontend$components$objects$build_asset_file_column(config){
return new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"file","file",-1269645878),new cljs.core.Keyword(null,"name","name",1843675177),"File",new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"string","string",-1989541586),new cljs.core.Keyword(null,"header","header",119441134),frontend.components.views.header_cp,new cljs.core.Keyword(null,"cell","cell",764245084),(function (_table,row,_column){
var temp__5804__auto__ = frontend.state.get_component(new cljs.core.Keyword("block","asset-cp","block/asset-cp",1438941908));
if(cljs.core.truth_(temp__5804__auto__)){
var asset_cp = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.block-content","div.block-content",-2073822457),(function (){var G__124424 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"disable-resize?","disable-resize?",-1998248527),true);
var G__124425 = row;
return (asset_cp.cljs$core$IFn$_invoke$arity$2 ? asset_cp.cljs$core$IFn$_invoke$arity$2(G__124424,G__124425) : asset_cp.call(null,G__124424,G__124425));
})()], null);
} else {
return null;
}
}),new cljs.core.Keyword(null,"disable-hide?","disable-hide?",-1203602151),true], null);
});
frontend.components.objects.class_objects_inner = rum.core.lazy_build(rum.core.build_defc,(function (config,class$,properties){
var _STAR_ref = (logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_ref.call(null,null));
var properties_SINGLEQUOTE_ = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,properties);
var columns_STAR_ = frontend.components.views.build_columns.cljs$core$IFn$_invoke$arity$variadic(config,properties_SINGLEQUOTE_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"add-tags-column?","add-tags-column?",708044916),true], null)], 0));
var columns = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(class$),new cljs.core.Keyword("logseq.class","Pdf-annotation","logseq.class/Pdf-annotation",-504959620)))?cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__124426_SHARP_){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.property","ls-type","logseq.property/ls-type",326979345),null], null), null),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(p1__124426_SHARP_));
}),columns_STAR_):((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(class$),new cljs.core.Keyword("logseq.class","Asset","logseq.class/Asset",-797502970)))?cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__124427_SHARP_){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.property.asset","checksum","logseq.property.asset/checksum",-1011416979),null], null), null),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(p1__124427_SHARP_));
}),columns_STAR_):columns_STAR_
));
var db_ident = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(class$);
var asset_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(db_ident,new cljs.core.Keyword("logseq.class","Asset","logseq.class/Asset",-797502970));
var columns__$1 = ((asset_QMARK_)?(function (){var vec__124453 = cljs.core.split_with((function (p1__124432_SHARP_){
return (!(logseq.db.frontend.property.logseq_property_QMARK_(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(p1__124432_SHARP_))));
}),columns);
var before_cols = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__124453,(0),null);
var after_cols = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__124453,(1),null);
return cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(before_cols,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.components.objects.build_asset_file_column(config)], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([after_cols], 0));
})():columns);
var add_new_object_BANG_ = ((((asset_QMARK_) || (cljs.core.not((function (){var G__124457 = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(class$);
return (logseq.db.private_tags.cljs$core$IFn$_invoke$arity$1 ? logseq.db.private_tags.cljs$core$IFn$_invoke$arity$1(G__124457) : logseq.db.private_tags.call(null,G__124457));
})()))))?(function (_view,table,p__124458){
var map__124459 = p__124458;
var map__124459__$1 = cljs.core.__destructure_map(map__124459);
var properties__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__124459__$1,new cljs.core.Keyword(null,"properties","properties",685819552));
var set_data_BANG_ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(table,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"data-fns","data-fns",-1065218324),new cljs.core.Keyword(null,"set-data!","set-data!",150955183)], null));
var full_data = new cljs.core.Keyword(null,"full-data","full-data",-1430830367).cljs$core$IFn$_invoke$arity$1(table);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.class","Asset","logseq.class/Asset",-797502970),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(class$))){
var G__124460 = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-col.gap-2","div.flex.flex-col.gap-2",1564729900),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.font-medium","div.font-medium",-70133240),"Add assets"], null),frontend.components.filepicker.picker(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (_e,files){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.upload_asset_BANG_(null,files,new cljs.core.Keyword(null,"markdown","markdown",1227225089),frontend.handler.editor._STAR_asset_uploading_QMARK_,true)),(function (entities){
return promesa.protocols._mcat(promesa.protocols._promise((logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null))),(function (___41611__auto__){
return promesa.protocols._promise(((cljs.core.seq(entities))?(function (){var G__124462 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(full_data,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),entities));
return (set_data_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_data_BANG_.cljs$core$IFn$_invoke$arity$1(G__124462) : set_data_BANG_.call(null,G__124462));
})():null));
}));
}));
}));
})], null))], null);
});
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1(G__124460) : logseq.shui.ui.dialog_open_BANG_.call(null,G__124460));
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.components.objects.add_new_class_object_BANG_(class$,properties__$1)),(function (block){
return promesa.protocols._promise((cljs.core.truth_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block))?(function (){
var G__124464_124551 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.vec(full_data),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block));
(set_data_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_data_BANG_.cljs$core$IFn$_invoke$arity$1(G__124464_124551) : set_data_BANG_.call(null,G__124464_124551));

return frontend.state.sidebar_add_block_BANG_(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword(null,"block","block",664686210));
})()
:null));
}));
}));
}
}):null);
return daiquiri.core.create_element("div",{'ref':_STAR_ref},[frontend.components.views.view(new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"config","config",994861415),config,new cljs.core.Keyword(null,"view-parent","view-parent",675596601),class$,new cljs.core.Keyword(null,"view-feature-type","view-feature-type",-945869610),new cljs.core.Keyword(null,"class-objects","class-objects",1489112646),new cljs.core.Keyword(null,"columns","columns",1998437288),columns__$1,new cljs.core.Keyword(null,"add-new-object!","add-new-object!",622560106),add_new_object_BANG_,new cljs.core.Keyword(null,"show-add-property?","show-add-property?",2062685338),true,new cljs.core.Keyword(null,"show-items-count?","show-items-count?",-1022363900),true,new cljs.core.Keyword(null,"add-property!","add-property!",1318392926),(function (e){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","new-property","editor/new-property",-1370252491),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"block","block",664686210),class$,new cljs.core.Keyword(null,"class-schema?","class-schema?",508813900),true,new cljs.core.Keyword(null,"target","target",253001721),e.target], null)], null));
})], null))]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.objects/class-objects-inner");
frontend.components.objects.class_objects = rum.core.lazy_build(rum.core.build_defcs,(function (state,class$,p__124468){
var map__124470 = p__124468;
var map__124470__$1 = cljs.core.__destructure_map(map__124470);
var current_page_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__124470__$1,new cljs.core.Keyword(null,"current-page?","current-page?",-1491305079));
var sidebar_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__124470__$1,new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672));
if(cljs.core.truth_(class$)){
var class$__$1 = (function (){var G__124471 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(class$);
return (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(G__124471) : frontend.db.sub_block.call(null,G__124471));
})();
var config = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"container-id","container-id",1274665684),new cljs.core.Keyword(null,"container-id","container-id",1274665684).cljs$core$IFn$_invoke$arity$1(state),new cljs.core.Keyword(null,"current-page?","current-page?",-1491305079),current_page_QMARK_,new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672),sidebar_QMARK_], null);
var properties = logseq.outliner.property.get_class_properties(class$__$1);
return daiquiri.core.create_element("div",{'className':"ml-1"},[frontend.components.objects.class_objects_inner(config,class$__$1,properties)]);
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query,frontend.mixins.container_id], null),"frontend.components.objects/class-objects");
frontend.components.objects.add_new_property_object_BANG_ = (function frontend$components$objects$add_new_property_object_BANG_(property,properties){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"checkbox","checkbox",1612615655),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property)))?false:new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837)) : frontend.db.entity.call(null,new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837)))))),(function (default_value){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.api_insert_new_block_BANG_("",new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword(null,"properties","properties",685819552),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.PersistentArrayMap.createAsIfByAssoc([new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),default_value]),properties], 0)),new cljs.core.Keyword(null,"edit-block?","edit-block?",-310383789),false], null))),(function (block){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__124472 = (function (){var G__124475 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__124475) : frontend.db.entity.call(null,G__124475));
})();
var G__124473 = (0);
var G__124474 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"container-id","container-id",1274665684),new cljs.core.Keyword(null,"unknown-container","unknown-container",1739831473)], null);
return (frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3(G__124472,G__124473,G__124474) : frontend.handler.editor.edit_block_BANG_.call(null,G__124472,G__124473,G__124474));
})()),(function (___41611__auto__){
return promesa.protocols._promise(block);
}));
}));
}));
}));
});
frontend.components.objects.property_related_objects_inner = rum.core.lazy_build(rum.core.build_defc,(function (config,property,properties){
var columns = frontend.components.views.build_columns(config,properties);
return frontend.components.views.view(new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"config","config",994861415),config,new cljs.core.Keyword(null,"view-parent","view-parent",675596601),property,new cljs.core.Keyword(null,"view-feature-type","view-feature-type",-945869610),new cljs.core.Keyword(null,"property-objects","property-objects",-1410914822),new cljs.core.Keyword(null,"columns","columns",1998437288),columns,new cljs.core.Keyword(null,"add-new-object!","add-new-object!",622560106),(function (_view,table,p__124499){
var map__124500 = p__124499;
var map__124500__$1 = cljs.core.__destructure_map(map__124500);
var properties__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__124500__$1,new cljs.core.Keyword(null,"properties","properties",685819552));
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(table,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"data-fns","data-fns",-1065218324),new cljs.core.Keyword(null,"set-data!","set-data!",150955183)], null))),(function (set_data_BANG_){
return promesa.protocols._mcat(promesa.protocols._promise(new cljs.core.Keyword(null,"full-data","full-data",-1430830367).cljs$core$IFn$_invoke$arity$1(table)),(function (full_data){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.components.objects.add_new_property_object_BANG_(property,properties__$1)),(function (block){
return promesa.protocols._promise((cljs.core.truth_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block))?(function (){
frontend.state.sidebar_add_block_BANG_(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword(null,"block","block",664686210));

var G__124516 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.vec(full_data),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block));
return (set_data_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_data_BANG_.cljs$core$IFn$_invoke$arity$1(G__124516) : set_data_BANG_.call(null,G__124516));
})()
:null));
}));
}));
}));
}));
}),new cljs.core.Keyword(null,"show-add-property?","show-add-property?",2062685338),false], null));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.objects/property-related-objects-inner");
frontend.components.objects.property_related_objects = rum.core.lazy_build(rum.core.build_defcs,(function (state,property,current_page_QMARK_){
if(cljs.core.truth_(property)){
var property_SINGLEQUOTE_ = (function (){var G__124522 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property);
return (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(G__124522) : frontend.db.sub_block.call(null,G__124522));
})();
var config = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"container-id","container-id",1274665684),new cljs.core.Keyword(null,"container-id","container-id",1274665684).cljs$core$IFn$_invoke$arity$1(state),new cljs.core.Keyword(null,"current-page?","current-page?",-1491305079),current_page_QMARK_], null);
var properties = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [property_SINGLEQUOTE_,(frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","tags","block/tags",1814948340)) : frontend.db.entity.call(null,new cljs.core.Keyword("block","tags","block/tags",1814948340)))], null);
return daiquiri.core.create_element("div",{'className':"ml-1"},[frontend.components.objects.property_related_objects_inner(config,property_SINGLEQUOTE_,properties)]);
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query,frontend.mixins.container_id], null),"frontend.components.objects/property-related-objects");

//# sourceMappingURL=frontend.components.objects.js.map
