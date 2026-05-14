goog.provide('frontend.components.property');
/**
 * Adds an existing or new property from dropdown. Used from a block or page context.
 */
frontend.components.property._LT_add_property_from_dropdown = (function frontend$components$property$_LT_add_property_from_dropdown(entity,property_uuid_or_name,schema,p__114707){
var map__114708 = p__114707;
var map__114708__$1 = cljs.core.__destructure_map(map__114708);
var class_schema_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__114708__$1,new cljs.core.Keyword(null,"class-schema?","class-schema?",508813900));
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.get_current_repo()),(function (repo){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var and__5000__auto__ = (logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(entity) : logseq.db.class_QMARK_.call(null,entity));
if(cljs.core.truth_(and__5000__auto__)){
return class_schema_QMARK_;
} else {
return and__5000__auto__;
}
})()),(function (add_class_property_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core.uuid_QMARK_(property_uuid_or_name))?frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(repo,property_uuid_or_name,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"children?","children?",-1199594108),false], null)], 0)):null)),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__114717 = (cljs.core.truth_(new cljs.core.Keyword(null,"block","block",664686210).cljs$core$IFn$_invoke$arity$1(result))?new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"block","block",664686210).cljs$core$IFn$_invoke$arity$1(result)):new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(result));
if((G__114717 == null)){
return null;
} else {
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__114717) : frontend.db.entity.call(null,G__114717));
}
})()),(function (property){
return promesa.protocols._promise((cljs.core.truth_(property)?(function (){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not((logseq.db.public_built_in_property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.public_built_in_property_QMARK_.cljs$core$IFn$_invoke$arity$1(property) : logseq.db.public_built_in_property_QMARK_.call(null,property)));
if(and__5000__auto__){
return (logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1(property) : logseq.db.built_in_QMARK_.call(null,property));
} else {
return and__5000__auto__;
}
})())){
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("This is a private built-in property that can't be used.",new cljs.core.Keyword(null,"error","error",-978969032));
} else {
}

return property;
})()
:((logseq.db.frontend.property.valid_property_name_QMARK_(property_uuid_or_name))?(cljs.core.truth_(add_class_property_QMARK_)?promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.db_based.property.upsert_property_BANG_(null,schema,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"property-name","property-name",-1399851434),property_uuid_or_name], null))),(function (result__$1){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__114723 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(result__$1);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__114723) : frontend.db.entity.call(null,G__114723));
})()),(function (property__$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.components.property.value._LT_add_property_BANG_.cljs$core$IFn$_invoke$arity$4(entity,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property__$1),"",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class-schema?","class-schema?",508813900),class_schema_QMARK_,new cljs.core.Keyword(null,"exit-edit?","exit-edit?",1607853059),false], null))),(function (_){
return promesa.protocols._promise(property__$1);
}));
}));
}));
})):promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.db_based.property.upsert_property_BANG_(null,schema,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"property-name","property-name",-1399851434),property_uuid_or_name], null))),(function (result__$1){
return promesa.protocols._promise((function (){var G__114726 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(result__$1);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__114726) : frontend.db.entity.call(null,G__114726));
})());
}));
}))):frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("This is an invalid property name. A property name cannot start with page reference characters '#' or '[['.",new cljs.core.Keyword(null,"error","error",-978969032)))));
}));
}));
}));
}));
}));
});
frontend.components.property.property_type_select = rum.core.lazy_build(rum.core.build_defcs,(function (state,property,p__114741){
var map__114742 = p__114741;
var map__114742__$1 = cljs.core.__destructure_map(map__114742);
var opts = map__114742__$1;
var _STAR_show_class_select_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__114742__$1,new cljs.core.Keyword(null,"*show-class-select?","*show-class-select?",-546938727));
var disabled_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__114742__$1,new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181));
var _STAR_show_new_property_config_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__114742__$1,new cljs.core.Keyword(null,"*show-new-property-config?","*show-new-property-config?",-1054571618));
var show_type_change_hints_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__114742__$1,new cljs.core.Keyword(null,"show-type-change-hints?","show-type-change-hints?",317068223));
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__114742__$1,new cljs.core.Keyword(null,"block","block",664686210));
var _STAR_property_schema = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__114742__$1,new cljs.core.Keyword(null,"*property-schema","*property-schema",-393273980));
var built_in_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__114742__$1,new cljs.core.Keyword(null,"built-in?","built-in?",2078421512));
var class_schema_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__114742__$1,new cljs.core.Keyword(null,"class-schema?","class-schema?",508813900));
var _STAR_property_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__114742__$1,new cljs.core.Keyword(null,"*property-name","*property-name",1273599183));
var _STAR_property = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__114742__$1,new cljs.core.Keyword(null,"*property","*property",1796678517));
var default_open_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__114742__$1,new cljs.core.Keyword(null,"default-open?","default-open?",-2082763144));
var property_name = (function (){var or__5002__auto__ = (function (){var and__5000__auto__ = _STAR_property_name;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.deref(_STAR_property_name);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(property);
}
})();
var property_schema = (function (){var or__5002__auto__ = (function (){var and__5000__auto__ = _STAR_property_schema;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.deref(_STAR_property_schema);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.select_keys(property,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404)], null));
}
})();
var schema_types = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (type){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"label","label",1718410804),frontend.components.property.config.property_type_label(type),new cljs.core.Keyword(null,"value","value",305978217),type], null);
}),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.type.user_built_in_property_types,(cljs.core.truth_(built_in_QMARK_)?logseq.db.frontend.property.type.internal_built_in_property_types:null)));
return daiquiri.core.create_element("div",{'className':"flex items-center"},[daiquiri.interpreter.interpret((function (){var G__114772 = (function (){var G__114775 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"default-open","default-open",936459665),cljs.core.boolean$(default_open_QMARK_),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),disabled_QMARK_,new cljs.core.Keyword(null,"on-value-change","on-value-change",-621835289),(function (v){
var type = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(clojure.string.lower_case(v));
var update_schema_fn = (function (p1__114731_SHARP_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__114731_SHARP_,new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404),type);
});
if(cljs.core.truth_(_STAR_property_schema)){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_property_schema,update_schema_fn);
} else {
}

var schema = (function (){var or__5002__auto__ = (function (){var and__5000__auto__ = _STAR_property_schema;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.deref(_STAR_property_schema);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return update_schema_fn(property_schema);
}
})();
if(cljs.core.truth_(_STAR_show_new_property_config_QMARK_)){
cljs.core.reset_BANG_(_STAR_show_new_property_config_QMARK_,new cljs.core.Keyword(null,"adding-property","adding-property",724640812));
} else {
}

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(block)?frontend.components.property._LT_add_property_from_dropdown(block,property_name,schema,opts):null)),(function (property_SINGLEQUOTE_){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var or__5002__auto__ = property_SINGLEQUOTE_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return property;
}
})()),(function (property__$1){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var and__5000__auto__ = (logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(block) : logseq.db.class_QMARK_.call(null,block));
if(cljs.core.truth_(and__5000__auto__)){
return class_schema_QMARK_;
} else {
return and__5000__auto__;
}
})()),(function (add_class_property_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(_STAR_property)?cljs.core.reset_BANG_(_STAR_property,property__$1):null)),(function (___41611__auto__){
return promesa.protocols._promise(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(_STAR_show_new_property_config_QMARK_)?cljs.core.reset_BANG_(_STAR_show_new_property_config_QMARK_,false):null)),(function (___41611__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(schema),new cljs.core.Keyword(null,"node","node",581201198)))?cljs.core.reset_BANG_(_STAR_show_class_select_QMARK_,true):null)),(function (___41611__auto____$2){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.db_based.property.upsert_property_BANG_(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property__$1),schema,cljs.core.PersistentArrayMap.EMPTY)),(function (___41611__auto____$3){
return promesa.protocols._promise((cljs.core.truth_((function (){var and__5000__auto__ = _STAR_show_class_select_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.deref(_STAR_show_class_select_QMARK_);
} else {
return and__5000__auto__;
}
})())?null:(cljs.core.truth_(add_class_property_QMARK_)?(function (){
(logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));

return (logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null));
})()
:((frontend.components.property.value.batch_operation_QMARK_())?null:(cljs.core.truth_((function (){var and__5000__auto__ = block;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(type,new cljs.core.Keyword(null,"checkbox","checkbox",1612615655));
} else {
return and__5000__auto__;
}
})())?promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.ui.hide_popups_until_preview_popup_BANG_()),(function (___41611__auto____$4){
return promesa.protocols._promise((function (){var value = (function (){var temp__5806__auto__ = new cljs.core.Keyword("logseq.property","scalar-default-value","logseq.property/scalar-default-value",1595723014).cljs$core$IFn$_invoke$arity$1(property__$1);
if((temp__5806__auto__ == null)){
return false;
} else {
var value = temp__5806__auto__;
return value;
}
})();
return frontend.components.property.value._LT_add_property_BANG_.cljs$core$IFn$_invoke$arity$4(block,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property__$1),value,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"exit-edit?","exit-edit?",1607853059),true], null));
})());
}));
})):(cljs.core.truth_((function (){var and__5000__auto__ = block;
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"default","default",-1987822328),null,new cljs.core.Keyword(null,"url","url",276297046),null], null), null),type)) && (cljs.core.not(cljs.core.seq(new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(property__$1)))));
} else {
return and__5000__auto__;
}
})())?frontend.components.property.value._LT_create_new_block_BANG_.cljs$core$IFn$_invoke$arity$variadic(block,property__$1,"",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"batch-op?","batch-op?",-2122405648),true], null)], 0)):null))))));
}));
}));
}));
})));
}));
}));
}));
}));
}));
})], null);
if(cljs.core.truth_((function (){var and__5000__auto__ = _STAR_property_name;
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property_schema);
} else {
return and__5000__auto__;
}
})())){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__114775,new cljs.core.Keyword(null,"default-value","default-value",232220170),cljs.core.name(new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property_schema)));
} else {
return G__114775;
}
})();
var G__114773 = (function (){var G__114812 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"!px-2 !py-0 !h-8"], null);
var G__114813 = (function (){var G__114816 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"Select a property type"], null);
return (logseq.shui.ui.select_value.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_value.cljs$core$IFn$_invoke$arity$1(G__114816) : logseq.shui.ui.select_value.call(null,G__114816));
})();
return (logseq.shui.ui.select_trigger.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_trigger.cljs$core$IFn$_invoke$arity$2(G__114812,G__114813) : logseq.shui.ui.select_trigger.call(null,G__114812,G__114813));
})();
var G__114774 = (function (){var G__114817 = (function (){var G__114821 = (function (){var iter__5480__auto__ = (function frontend$components$property$iter__114822(s__114824){
return (new cljs.core.LazySeq(null,(function (){
var s__114824__$1 = s__114824;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__114824__$1);
if(temp__5804__auto__){
var s__114824__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__114824__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__114824__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__114826 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__114825 = (0);
while(true){
if((i__114825 < size__5479__auto__)){
var map__114839 = cljs.core._nth(c__5478__auto__,i__114825);
var map__114839__$1 = cljs.core.__destructure_map(map__114839);
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__114839__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__114839__$1,new cljs.core.Keyword(null,"value","value",305978217));
var disabled = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__114839__$1,new cljs.core.Keyword(null,"disabled","disabled",-1529784218));
cljs.core.chunk_append(b__114826,(function (){var G__114848 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"key","key",-1516042587),label,new cljs.core.Keyword(null,"value","value",305978217),value,new cljs.core.Keyword(null,"disabled","disabled",-1529784218),disabled,new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),((function (i__114825,map__114839,map__114839__$1,label,value,disabled,c__5478__auto__,size__5479__auto__,b__114826,s__114824__$2,temp__5804__auto__,G__114772,G__114773,property_name,property_schema,schema_types,map__114742,map__114742__$1,opts,_STAR_show_class_select_QMARK_,disabled_QMARK_,_STAR_show_new_property_config_QMARK_,show_type_change_hints_QMARK_,block,_STAR_property_schema,built_in_QMARK_,class_schema_QMARK_,_STAR_property_name,_STAR_property,default_open_QMARK_){
return (function (e){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Enter",e.key)){
return frontend.util.stop_propagation(e);
} else {
return null;
}
});})(i__114825,map__114839,map__114839__$1,label,value,disabled,c__5478__auto__,size__5479__auto__,b__114826,s__114824__$2,temp__5804__auto__,G__114772,G__114773,property_name,property_schema,schema_types,map__114742,map__114742__$1,opts,_STAR_show_class_select_QMARK_,disabled_QMARK_,_STAR_show_new_property_config_QMARK_,show_type_change_hints_QMARK_,block,_STAR_property_schema,built_in_QMARK_,class_schema_QMARK_,_STAR_property_name,_STAR_property,default_open_QMARK_))
], null);
var G__114849 = label;
return (logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2(G__114848,G__114849) : logseq.shui.ui.select_item.call(null,G__114848,G__114849));
})());

var G__116461 = (i__114825 + (1));
i__114825 = G__116461;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__114826),frontend$components$property$iter__114822(cljs.core.chunk_rest(s__114824__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__114826),null);
}
} else {
var map__114893 = cljs.core.first(s__114824__$2);
var map__114893__$1 = cljs.core.__destructure_map(map__114893);
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__114893__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__114893__$1,new cljs.core.Keyword(null,"value","value",305978217));
var disabled = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__114893__$1,new cljs.core.Keyword(null,"disabled","disabled",-1529784218));
return cljs.core.cons((function (){var G__114902 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"key","key",-1516042587),label,new cljs.core.Keyword(null,"value","value",305978217),value,new cljs.core.Keyword(null,"disabled","disabled",-1529784218),disabled,new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),((function (map__114893,map__114893__$1,label,value,disabled,s__114824__$2,temp__5804__auto__,G__114772,G__114773,property_name,property_schema,schema_types,map__114742,map__114742__$1,opts,_STAR_show_class_select_QMARK_,disabled_QMARK_,_STAR_show_new_property_config_QMARK_,show_type_change_hints_QMARK_,block,_STAR_property_schema,built_in_QMARK_,class_schema_QMARK_,_STAR_property_name,_STAR_property,default_open_QMARK_){
return (function (e){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Enter",e.key)){
return frontend.util.stop_propagation(e);
} else {
return null;
}
});})(map__114893,map__114893__$1,label,value,disabled,s__114824__$2,temp__5804__auto__,G__114772,G__114773,property_name,property_schema,schema_types,map__114742,map__114742__$1,opts,_STAR_show_class_select_QMARK_,disabled_QMARK_,_STAR_show_new_property_config_QMARK_,show_type_change_hints_QMARK_,block,_STAR_property_schema,built_in_QMARK_,class_schema_QMARK_,_STAR_property_name,_STAR_property,default_open_QMARK_))
], null);
var G__114903 = label;
return (logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2(G__114902,G__114903) : logseq.shui.ui.select_item.call(null,G__114902,G__114903));
})(),frontend$components$property$iter__114822(cljs.core.rest(s__114824__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(schema_types);
})();
return (logseq.shui.ui.select_group.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_group.cljs$core$IFn$_invoke$arity$1(G__114821) : logseq.shui.ui.select_group.call(null,G__114821));
})();
return (logseq.shui.ui.select_content.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_content.cljs$core$IFn$_invoke$arity$1(G__114817) : logseq.shui.ui.select_content.call(null,G__114817));
})();
return (logseq.shui.ui.select.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.select.cljs$core$IFn$_invoke$arity$3(G__114772,G__114773,G__114774) : logseq.shui.ui.select.call(null,G__114772,G__114773,G__114774));
})()),(cljs.core.truth_(show_type_change_hints_QMARK_)?frontend.ui.tooltip(frontend.components.svg.info(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),"Changing the property type clears some property configurations."], null)):null)]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.modules.shortcut.core.disable_all_shortcuts], null),"frontend.components.property/property-type-select");
frontend.components.property.property_select = rum.core.lazy_build(rum.core.build_defc,(function (select_opts){
var vec__115226 = rum.core.use_state(null);
var properties = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__115226,(0),null);
var set_properties_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__115226,(1),null);
var vec__115229 = rum.core.use_state(null);
var classes = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__115229,(0),null);
var set_classes_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__115229,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.get_current_repo()),(function (repo){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(new cljs.core.Keyword(null,"class-schema?","class-schema?",508813900).cljs$core$IFn$_invoke$arity$1(select_opts))?frontend.handler.property.get_class_property_choices():frontend.db.model.get_all_properties.cljs$core$IFn$_invoke$arity$variadic(repo,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"remove-ui-non-suitable-properties?","remove-ui-non-suitable-properties?",603866281),true], null)], 0)))),(function (properties__$1){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(logseq.db.built_in_QMARK_,frontend.db.model.get_all_classes(repo))),(function (classes__$1){
return promesa.protocols._mcat(promesa.protocols._promise((set_classes_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_classes_BANG_.cljs$core$IFn$_invoke$arity$1(classes__$1) : set_classes_BANG_.call(null,classes__$1))),(function (___41611__auto__){
return promesa.protocols._promise((set_properties_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_properties_BANG_.cljs$core$IFn$_invoke$arity$1(properties__$1) : set_properties_BANG_.call(null,properties__$1)));
}));
}));
}));
}));
}));
}),cljs.core.PersistentVector.EMPTY);

var items = (function (){var G__115255 = new cljs.core.Keyword(null,"value","value",305978217);
var G__115256 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (x){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"label","label",1718410804),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(x),new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(x)], null);
}),properties),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (x){
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"label","label",1718410804),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(x),new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(x),new cljs.core.Keyword(null,"group","group",582596132),"Tags"], null);
}),classes));
return (frontend.util.distinct_by_last_wins.cljs$core$IFn$_invoke$arity$2 ? frontend.util.distinct_by_last_wins.cljs$core$IFn$_invoke$arity$2(G__115255,G__115256) : frontend.util.distinct_by_last_wins.call(null,G__115255,G__115256));
})();
return daiquiri.core.create_element("div",{'data-keep-selection':true,'className':"ls-property-add flex flex-row items-center property-key"},[daiquiri.core.create_element("div",{'className':"ls-property-key"},[frontend.components.select.select(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"items","items",1031954938),items,new cljs.core.Keyword(null,"grouped?","grouped?",531080948),true,new cljs.core.Keyword(null,"extract-fn","extract-fn",-339752723),new cljs.core.Keyword(null,"label","label",1718410804),new cljs.core.Keyword(null,"dropdown?","dropdown?",-1027769147),false,new cljs.core.Keyword(null,"close-modal?","close-modal?",-207518383),false,new cljs.core.Keyword(null,"new-case-sensitive?","new-case-sensitive?",-581012500),true,new cljs.core.Keyword(null,"show-new-when-not-exact-match?","show-new-when-not-exact-match?",1510536201),true,new cljs.core.Keyword(null,"input-default-placeholder","input-default-placeholder",-1040139250),"Add or change property"], null),select_opts], 0)))])]);
}),null,"frontend.components.property/property-select");
frontend.components.property.property_icon = rum.core.lazy_build(rum.core.build_defc,(function (property,property_type){
var type = (function (){var or__5002__auto__ = new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = property_type;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return new cljs.core.Keyword(null,"default","default",-1987822328);
}
}
})();
var ident = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property);
var icon = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(ident,new cljs.core.Keyword("block","tags","block/tags",1814948340)))?"hash":((clojure.string.starts_with_QMARK_(cljs.core.str.cljs$core$IFn$_invoke$arity$1(ident),":plugin."))?"puzzle":(function (){var G__115562 = type;
var G__115562__$1 = (((G__115562 instanceof cljs.core.Keyword))?G__115562.fqn:null);
switch (G__115562__$1) {
case "number":
return "number";

break;
case "date":
return "calendar";

break;
case "datetime":
return "calendar";

break;
case "checkbox":
return "checkbox";

break;
case "url":
return "link";

break;
case "property":
return "letter-p";

break;
case "page":
return "page";

break;
case "node":
return "letter-n";

break;
default:
return "letter-t";

}
})()
));
return daiquiri.interpreter.interpret(frontend.ui.icon(icon,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"opacity-50",new cljs.core.Keyword(null,"size","size",1098693007),(15)], null)));
}),null,"frontend.components.property/property-icon");
frontend.components.property.property_input_on_chosen = (function frontend$components$property$property_input_on_chosen(block,_STAR_property,_STAR_property_key,_STAR_show_new_property_config_QMARK_,p__115582){
var map__115585 = p__115582;
var map__115585__$1 = cljs.core.__destructure_map(map__115585);
var class_schema_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__115585__$1,new cljs.core.Keyword(null,"class-schema?","class-schema?",508813900));
var remove_property_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__115585__$1,new cljs.core.Keyword(null,"remove-property?","remove-property?",-521702287));
return (function (p__115588){
var map__115589 = p__115588;
var map__115589__$1 = cljs.core.__destructure_map(map__115589);
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__115589__$1,new cljs.core.Keyword(null,"value","value",305978217));
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__115589__$1,new cljs.core.Keyword(null,"label","label",1718410804));
cljs.core.reset_BANG_(_STAR_property_key,((cljs.core.uuid_QMARK_(value))?label:value));

var property = ((cljs.core.uuid_QMARK_(value))?(function (){var G__115593 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),value], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__115593) : frontend.db.entity.call(null,G__115593));
})():null);
var batch_QMARK_ = frontend.components.property.value.batch_operation_QMARK_();
var repo = frontend.state.get_current_repo();
if(cljs.core.truth_((function (){var and__5000__auto__ = property;
if(cljs.core.truth_(and__5000__auto__)){
return remove_property_QMARK_;
} else {
return and__5000__auto__;
}
})())){
var block_ids = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),frontend.components.property.value.get_operating_blocks(block));
frontend.handler.property.batch_remove_block_property_BANG_(repo,block_ids,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property));

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = _STAR_show_new_property_config_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not((logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1(property) : logseq.db.property_QMARK_.call(null,property)));
} else {
return and__5000__auto__;
}
})())){
cljs.core.reset_BANG_(_STAR_show_new_property_config_QMARK_,true);
} else {
}

cljs.core.reset_BANG_(_STAR_property,property);

if(cljs.core.truth_(property)){
var add_class_property_QMARK_ = (function (){var and__5000__auto__ = (logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(block) : logseq.db.class_QMARK_.call(null,block));
if(cljs.core.truth_(and__5000__auto__)){
return class_schema_QMARK_;
} else {
return and__5000__auto__;
}
})();
var type = new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property);
var default_or_url_QMARK_ = ((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"default","default",-1987822328),null,new cljs.core.Keyword(null,"url","url",276297046),null], null), null),type)) && (cljs.core.not(cljs.core.seq(new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(property)))));
if(cljs.core.truth_(add_class_property_QMARK_)){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.components.property.value._LT_add_property_BANG_.cljs$core$IFn$_invoke$arity$4(block,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),"",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class-schema?","class-schema?",508813900),class_schema_QMARK_], null))),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null))),(function (___41611__auto____$1){
return promesa.protocols._promise((logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null)));
}));
}));
}));
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = property;
if(cljs.core.truth_(and__5000__auto__)){
return (logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(property) : logseq.db.class_QMARK_.call(null,property));
} else {
return and__5000__auto__;
}
})())){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.components.property.value._LT_set_class_as_property_BANG_(frontend.state.get_current_repo(),property)),(function (___41611__auto__){
return promesa.protocols._promise(cljs.core.reset_BANG_(_STAR_show_new_property_config_QMARK_,false));
}));
}));
} else {
if(((batch_QMARK_) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"checkbox","checkbox",1612615655),type)) || (((batch_QMARK_) && (default_or_url_QMARK_))))))){
return null;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"checkbox","checkbox",1612615655),type)){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.ui.hide_popups_until_preview_popup_BANG_()),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null))),(function (___41611__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise((logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null))),(function (___41611__auto____$2){
return promesa.protocols._promise((function (){var value__$1 = (function (){var temp__5806__auto__ = new cljs.core.Keyword("logseq.property","scalar-default-value","logseq.property/scalar-default-value",1595723014).cljs$core$IFn$_invoke$arity$1(property);
if((temp__5806__auto__ == null)){
return false;
} else {
var value__$1 = temp__5806__auto__;
return value__$1;
}
})();
return frontend.components.property.value._LT_add_property_BANG_.cljs$core$IFn$_invoke$arity$4(block,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),value__$1,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"exit-edit?","exit-edit?",1607853059),true], null));
})());
}));
}));
}));
}));
} else {
if(default_or_url_QMARK_){
return frontend.components.property.value._LT_create_new_block_BANG_.cljs$core$IFn$_invoke$arity$variadic(block,property,"",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"batch-op?","batch-op?",-2122405648),true], null)], 0));
} else {
if(((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"default","default",-1987822328),type)) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"default","default",-1987822328),type)) && (cljs.core.seq(new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(property))))))){
return cljs.core.reset_BANG_(_STAR_show_new_property_config_QMARK_,false);
} else {
return null;
}
}
}
}
}
}
} else {
return null;
}
}
});
});
frontend.components.property.property_key_title = rum.core.lazy_build(rum.core.build_defc,(function (block,property,class_schema_QMARK_){
return daiquiri.interpreter.interpret((function (){var G__115693 = new cljs.core.Keyword(null,"a","a",-2123407586);
var G__115694 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"tabIndex","tabIndex",-169286716),(0),new cljs.core.Keyword(null,"title","title",636505583),(function (){var or__5002__auto__ = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property","description","logseq.property/description",-336236200).cljs$core$IFn$_invoke$arity$1(property));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(property);
}
})(),new cljs.core.Keyword(null,"class","class",-2030961996),"property-k flex select-none jtrigger w-full",new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),(function (e){
if(cljs.core.truth_(frontend.util.meta_key_QMARK_(e))){
frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(property));

return e.preventDefault();
} else {
return null;
}
}),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
var G__115699 = e.target;
var G__115700 = (function (){
return frontend.components.property.config.property_dropdown(property,block,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"debug?","debug?",-1831756173),e.altKey,new cljs.core.Keyword(null,"class-schema?","class-schema?",508813900),class_schema_QMARK_], null));
});
var G__115701 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"ls-property-dropdown as-root",new cljs.core.Keyword(null,"onEscapeKeyDown","onEscapeKeyDown",1908839912),(function (e__$1){
frontend.util.stop(e__$1);

(logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));

var temp__5804__auto__ = frontend.state.get_input();
if(cljs.core.truth_(temp__5804__auto__)){
var input = temp__5804__auto__;
return input.focus();
} else {
return null;
}
})], null),new cljs.core.Keyword(null,"align","align",1964212802),"start",new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558),true], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__115699,G__115700,G__115701) : logseq.shui.ui.popup_show_BANG_.call(null,G__115699,G__115700,G__115701));
})], null);
var G__115695 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(property);
return (logseq.shui.ui.trigger_as.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.trigger_as.cljs$core$IFn$_invoke$arity$3(G__115693,G__115694,G__115695) : logseq.shui.ui.trigger_as.call(null,G__115693,G__115694,G__115695));
})());
}),null,"frontend.components.property/property-key-title");
frontend.components.property.property_key_cp = rum.core.lazy_build(rum.core.build_defc,(function (block,property,p__115853){
var map__115855 = p__115853;
var map__115855__$1 = cljs.core.__destructure_map(map__115855);
var other_position_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__115855__$1,new cljs.core.Keyword(null,"other-position?","other-position?",-1396628322));
var class_schema_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__115855__$1,new cljs.core.Keyword(null,"class-schema?","class-schema?",508813900));
var icon = new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285).cljs$core$IFn$_invoke$arity$1(property);
var attrs115835 = (cljs.core.truth_(other_position_QMARK_)?null:(function (){var content_fn = (function (p__115857){
var map__115858 = p__115857;
var map__115858__$1 = cljs.core.__destructure_map(map__115858);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__115858__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
return frontend.components.icon.icon_search(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),(function (_e,icon__$1){
if(cljs.core.truth_(icon__$1)){
frontend.handler.db_based.property.set_block_property_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285),icon__$1);
} else {
frontend.handler.db_based.property.remove_block_property_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285));
}

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1(id) : logseq.shui.ui.popup_hide_BANG_.call(null,id));
}),new cljs.core.Keyword(null,"icon-value","icon-value",-510636889),icon,new cljs.core.Keyword(null,"del-btn?","del-btn?",-1094924362),cljs.core.boolean$(icon)], null));
});
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.property-icon","div.property-icon",1069463696),(function (){var G__115861 = new cljs.core.Keyword(null,"button.property-m","button.property-m",-373431520);
var G__115862 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(((frontend.config.publishing_QMARK_)?null:new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
var G__115866 = e.target;
var G__115867 = content_fn;
var G__115869 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558),true,new cljs.core.Keyword(null,"auto-focus?","auto-focus?",1021654593),true,new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"onEscapeKeyDown","onEscapeKeyDown",1908839912),(function (p1__115707_SHARP_){
return p1__115707_SHARP_.preventDefault();
})], null)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__115866,G__115867,G__115869) : logseq.shui.ui.popup_show_BANG_.call(null,G__115866,G__115867,G__115869));
})], null)),new cljs.core.Keyword(null,"class","class",-2030961996),"flex items-center");
var G__115863 = (cljs.core.truth_(icon)?frontend.components.icon.icon.cljs$core$IFn$_invoke$arity$variadic(icon,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),(15),new cljs.core.Keyword(null,"color?","color?",-1891974356),true], null)], 0)):frontend.components.property.property_icon(property,null));
return (logseq.shui.ui.trigger_as.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.trigger_as.cljs$core$IFn$_invoke$arity$3(G__115861,G__115862,G__115863) : logseq.shui.ui.trigger_as.call(null,G__115861,G__115862,G__115863));
})()], null);
})());
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs115835))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["property-key-inner","jtrigger-view"], null)], null),attrs115835], 0))):{'className':"property-key-inner jtrigger-view"}),((cljs.core.map_QMARK_(attrs115835))?[((frontend.config.publishing_QMARK_)?daiquiri.core.create_element("a",{'onClick':(function (){
return frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(property));
}),'className':"property-k flex select-none jtrigger"},[daiquiri.interpreter.interpret(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(property))]):frontend.components.property.property_key_title(block,property,class_schema_QMARK_))]:[daiquiri.interpreter.interpret(attrs115835),((frontend.config.publishing_QMARK_)?daiquiri.core.create_element("a",{'onClick':(function (){
return frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(property));
}),'className':"property-k flex select-none jtrigger"},[daiquiri.interpreter.interpret(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(property))]):frontend.components.property.property_key_title(block,property,class_schema_QMARK_))]));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.property/property-key-cp");
frontend.components.property.property_input = rum.core.lazy_build(rum.core.build_defcs,(function (state,block,_STAR_property_key,p__116108){
var map__116110 = p__116108;
var map__116110__$1 = cljs.core.__destructure_map(map__116110);
var opts = map__116110__$1;
var class_schema_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__116110__$1,new cljs.core.Keyword(null,"class-schema?","class-schema?",508813900));
var _STAR_property = new cljs.core.Keyword("frontend.components.property","property","frontend.components.property/property",-167988585).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_show_new_property_config_QMARK_ = new cljs.core.Keyword("frontend.components.property","show-new-property-config?","frontend.components.property/show-new-property-config?",-607391490).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_show_class_select_QMARK_ = new cljs.core.Keyword("frontend.components.property","show-class-select?","frontend.components.property/show-class-select?",1303298263).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_property_schema = new cljs.core.Keyword("frontend.components.property","property-schema","frontend.components.property/property-schema",-1470214509).cljs$core$IFn$_invoke$arity$1(state);
var property = rum.core.react(_STAR_property);
var property_key = rum.core.react(_STAR_property_key);
var batch_QMARK_ = frontend.components.property.value.batch_operation_QMARK_();
var hide_property_key_QMARK_ = (function (){var or__5002__auto__ = cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"date","date",-1463434462),null,new cljs.core.Keyword(null,"datetime","datetime",494675702),null], null), null),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = frontend.components.property.value.select_type_QMARK_(block,property);
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = ((batch_QMARK_) && (((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"default","default",-1987822328),null,new cljs.core.Keyword(null,"url","url",276297046),null], null), null),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property))) && (cljs.core.not(cljs.core.seq(new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(property)))))));
if(or__5002__auto____$2){
return or__5002__auto____$2;
} else {
var and__5000__auto__ = property;
if(cljs.core.truth_(and__5000__auto__)){
return (logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(property) : logseq.db.class_QMARK_.call(null,property));
} else {
return and__5000__auto__;
}
}
}
}
})();
var attrs116107 = (cljs.core.truth_(property_key)?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.ls-property-add.gap-1.flex.flex-1.flex-row.items-center","div.ls-property-add.gap-1.flex.flex-1.flex-row.items-center",94343345),(cljs.core.truth_(hide_property_key_QMARK_)?null:new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.items-center.property-key.gap-1","div.flex.flex-row.items-center.property-key.gap-1",-1757034910),(cljs.core.truth_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property))?null:frontend.components.property.property_icon(property,new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(_STAR_property_schema)))),(cljs.core.truth_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property))?frontend.components.property.property_key_cp(block,property,opts):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),property_key], null))], null)),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row","div.flex.flex-row",209103675),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),(function (e){
return frontend.util.stop_propagation(e);
})], null),((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(_STAR_show_new_property_config_QMARK_),new cljs.core.Keyword(null,"adding-property","adding-property",724640812)))?(cljs.core.truth_((function (){var or__5002__auto__ = (property == null);
if(or__5002__auto__){
return or__5002__auto__;
} else {
return cljs.core.deref(_STAR_show_new_property_config_QMARK_);
}
})())?frontend.components.property.property_type_select(property,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts,new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"*property","*property",1796678517),_STAR_property,new cljs.core.Keyword(null,"*property-name","*property-name",1273599183),_STAR_property_key,new cljs.core.Keyword(null,"*property-schema","*property-schema",-393273980),_STAR_property_schema,new cljs.core.Keyword(null,"default-open?","default-open?",-2082763144),true,new cljs.core.Keyword(null,"block","block",664686210),block,new cljs.core.Keyword(null,"*show-new-property-config?","*show-new-property-config?",-1054571618),_STAR_show_new_property_config_QMARK_,new cljs.core.Keyword(null,"*show-class-select?","*show-class-select?",-546938727),_STAR_show_class_select_QMARK_], null)], 0))):(cljs.core.truth_((function (){var and__5000__auto__ = property;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.deref(_STAR_show_class_select_QMARK_);
} else {
return and__5000__auto__;
}
})())?frontend.components.property.config.class_select(property,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(opts,new cljs.core.Keyword(null,"on-hide","on-hide",1263105709),(function (){
return cljs.core.reset_BANG_(_STAR_show_class_select_QMARK_,false);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"multiple-choices?","multiple-choices?",-1858892490),false,new cljs.core.Keyword(null,"default-open?","default-open?",-2082763144),true,new cljs.core.Keyword(null,"no-class?","no-class?",-42395826),true], 0))):(cljs.core.truth_((function (){var and__5000__auto__ = property;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(class_schema_QMARK_);
} else {
return and__5000__auto__;
}
})())?frontend.components.property.value.property_value(block,property,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"editing?","editing?",1646440800),true)):null)
)):null)], null)], null):(function (){var on_chosen = frontend.components.property.property_input_on_chosen(block,_STAR_property,_STAR_property_key,_STAR_show_new_property_config_QMARK_,opts);
var input_opts = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (e){
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.util.ekey(e),"Backspace")) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("",e.target.value)))){
frontend.util.stop(e);

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
} else {
return null;
}
})], null);
return frontend.components.property.property_select(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"select-opts","select-opts",855704004).cljs$core$IFn$_invoke$arity$1(opts),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),on_chosen,new cljs.core.Keyword(null,"input-opts","input-opts",1688681135),input_opts,new cljs.core.Keyword(null,"class-schema?","class-schema?",508813900),class_schema_QMARK_], null)], 0)));
})());
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs116107))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ls-property-input","flex","flex-1","flex-row","items-center","flex-wrap","gap-1"], null)], null),attrs116107], 0))):{'className':"ls-property-input flex flex-1 flex-row items-center flex-wrap gap-1"}),((cljs.core.map_QMARK_(attrs116107))?null:[daiquiri.interpreter.interpret(attrs116107)]));
}),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.components.property","show-new-property-config?","frontend.components.property/show-new-property-config?",-607391490)),rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.components.property","show-class-select?","frontend.components.property/show-class-select?",1303298263)),rum.core.local.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword("frontend.components.property","property-schema","frontend.components.property/property-schema",-1470214509)),frontend.mixins.event_mixin.cljs$core$IFn$_invoke$arity$1((function (state){
return frontend.mixins.hide_when_esc_or_outside.cljs$core$IFn$_invoke$arity$variadic(state,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-hide","on-hide",1263105709),(function (_state,_e,type){
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"esc","esc",-1671924121),null], null), null),type)){
(logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));

(logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));

(logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null));

var temp__5804__auto__ = frontend.state.get_input();
if(cljs.core.truth_(temp__5804__auto__)){
var input = temp__5804__auto__;
return input.focus();
} else {
return null;
}
} else {
return null;
}
})], 0));
})),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
frontend.state.set_editor_action_BANG_(new cljs.core.Keyword(null,"property-input","property-input",1989427557));

return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(state,new cljs.core.Keyword("frontend.components.property","property","frontend.components.property/property",-167988585),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"*property","*property",1796678517).cljs$core$IFn$_invoke$arity$1(cljs.core.last(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state)));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
})());
}),new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
var args_116524 = new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_property_key_116525 = cljs.core.second(args_116524);
var map__116130_116526 = cljs.core.last(args_116524);
var map__116130_116527__$1 = cljs.core.__destructure_map(map__116130_116526);
var original_block_116528 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__116130_116527__$1,new cljs.core.Keyword(null,"original-block","original-block",1808045862));
var edit_original_block_116529 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__116130_116527__$1,new cljs.core.Keyword(null,"edit-original-block","edit-original-block",179766995));
var editing_default_property_QMARK__116530 = (function (){var and__5000__auto__ = original_block_116528;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = frontend.state.get_edit_block();
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(original_block_116528),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(frontend.state.get_edit_block()));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(_STAR_property_key_116525)){
cljs.core.reset_BANG_(_STAR_property_key_116525,null);
} else {
}

if(cljs.core.truth_((function (){var and__5000__auto__ = original_block_116528;
if(cljs.core.truth_(and__5000__auto__)){
return edit_original_block_116529;
} else {
return and__5000__auto__;
}
})())){
var G__116135_116531 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"editing-default-property?","editing-default-property?",1361962686),editing_default_property_QMARK__116530], null);
(edit_original_block_116529.cljs$core$IFn$_invoke$arity$1 ? edit_original_block_116529.cljs$core$IFn$_invoke$arity$1(G__116135_116531) : edit_original_block_116529.call(null,G__116135_116531));
} else {
}

frontend.state.set_editor_action_BANG_(null);

return state;
})], null)], null),"frontend.components.property/property-input");
frontend.components.property.new_property = rum.core.lazy_build(rum.core.build_defcs,(function (state,block,opts){
if(frontend.config.publishing_QMARK_){
return null;
} else {
return daiquiri.core.create_element("div",{'style':{'marginLeft':(7),'marginTop':(1),'fontSize':(15)},'className':"ls-new-property"},[daiquiri.core.create_element("a",{'tabIndex':(0),'onClick':(function (e){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","new-property","editor/new-property",-1370252491),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"block","block",664686210),block,new cljs.core.Keyword(null,"target","target",253001721),e.target], null)], 0))], null));
}),'className':"flex jtrigger text-muted-foreground"},[(function (){var attrs116143 = frontend.ui.icon("plus",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(15)], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs116143))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","items-center","shrink-0"], null)], null),attrs116143], 0))):{'className':"flex flex-row items-center shrink-0"}),((cljs.core.map_QMARK_(attrs116143))?[daiquiri.core.create_element("div",{'style':{'marginTop':(1)},'className':"ml-1"},["Add property"])]:[daiquiri.interpreter.interpret(attrs116143),daiquiri.core.create_element("div",{'style':{'marginTop':(1)},'className':"ml-1"},["Add property"])]));
})()])]);
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.property/new-property");
/**
 * Properties will be updated for the linked page instead of the refed block.
 *   For example, the block below has a reference to the page "How to solve it",
 *   we'd like the properties of the class "book" (e.g. Authors, Published year)
 *   to be assigned for the page `How to solve it` instead of the referenced block.
 * 
 *   Block:
 *   - [[How to solve it]] #book
 *   
 */
frontend.components.property.resolve_linked_block_if_exists = (function frontend$components$property$resolve_linked_block_if_exists(block){
var temp__5802__auto__ = new cljs.core.Keyword("block","link","block/link",-1872399993).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(temp__5802__auto__)){
var linked_block = temp__5802__auto__;
var G__116229 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(linked_block);
return (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(G__116229) : frontend.db.sub_block.call(null,G__116229));
} else {
var G__116230 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(G__116230) : frontend.db.sub_block.call(null,G__116230));
}
});
frontend.components.property.property_cp = rum.core.lazy_build(rum.core.build_defc,(function (block,k,v,p__116233){
var map__116234 = p__116233;
var map__116234__$1 = cljs.core.__destructure_map(map__116234);
var opts = map__116234__$1;
var inline_text = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__116234__$1,new cljs.core.Keyword(null,"inline-text","inline-text",910915394));
var page_cp = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__116234__$1,new cljs.core.Keyword(null,"page-cp","page-cp",1066562595));
var sortable_opts = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__116234__$1,new cljs.core.Keyword(null,"sortable-opts","sortable-opts",-21832640));
if((k instanceof cljs.core.Keyword)){
return daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = (function (){var G__116243 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(k) : frontend.db.entity.call(null,k)));
return (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(G__116243) : frontend.db.sub_block.call(null,G__116243));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var property = temp__5804__auto__;
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$3(property,new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404),new cljs.core.Keyword(null,"default","default",-1987822328));
var closed_values_QMARK_ = cljs.core.seq(new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(property));
var block_QMARK_ = (function (){var and__5000__auto__ = v;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = cljs.core.not(closed_values_QMARK_);
if(and__5000__auto____$1){
var and__5000__auto____$2 = (function (){var or__5002__auto__ = (function (){var and__5000__auto____$2 = cljs.core.map_QMARK_(v);
if(and__5000__auto____$2){
return new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(v);
} else {
return and__5000__auto____$2;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var and__5000__auto____$2 = cljs.core.coll_QMARK_(v);
if(and__5000__auto____$2){
var and__5000__auto____$3 = cljs.core.map_QMARK_(cljs.core.first(v));
if(and__5000__auto____$3){
var or__5002__auto____$1 = new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(cljs.core.first(v));
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(cljs.core.first(v)));
}
} else {
return and__5000__auto____$3;
}
} else {
return and__5000__auto____$2;
}
}
})();
if(cljs.core.truth_(and__5000__auto____$2)){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"default","default",-1987822328),null,new cljs.core.Keyword(null,"url","url",276297046),null], null), null),type);
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
var date_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(type,new cljs.core.Keyword(null,"date","date",-1463434462));
var datetime_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(type,new cljs.core.Keyword(null,"datetime","datetime",494675702));
var checkbox_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(type,new cljs.core.Keyword(null,"checkbox","checkbox",1612615655));
var property_key_cp_SINGLEQUOTE_ = frontend.components.property.property_key_cp(block,property,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.select_keys(opts,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"class-schema?","class-schema?",508813900)], null)),new cljs.core.Keyword(null,"block?","block?",1102479923),block_QMARK_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"inline-text","inline-text",910915394),inline_text,new cljs.core.Keyword(null,"page-cp","page-cp",1066562595),page_cp], 0)));
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),["property-pair-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block)),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property))].join(''),new cljs.core.Keyword(null,"class","class",-2030961996),((((date_QMARK_) || (((datetime_QMARK_) || (checkbox_QMARK_)))))?"property-pair items-center":"property-pair items-start"
)], null),((cljs.core.seq(sortable_opts))?frontend.components.dnd.sortable_item(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(sortable_opts,new cljs.core.Keyword(null,"class","class",-2030961996),"property-key"),property_key_cp_SINGLEQUOTE_):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.property-key","div.property-key",-222827292),property_key_cp_SINGLEQUOTE_], null)),(function (){var property_desc = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("logseq.property","description","logseq.property/description",-336236200)))?null:new cljs.core.Keyword("logseq.property","description","logseq.property/description",-336236200).cljs$core$IFn$_invoke$arity$1(property));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.ls-block.property-value-container.flex.flex-row.gap-1.items-center","div.ls-block.property-value-container.flex.flex-row.gap-1.items-center",1580320957),(cljs.core.truth_((function (){var or__5002__auto__ = block_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var and__5000__auto__ = property_desc;
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword(null,"class-schema?","class-schema?",508813900).cljs$core$IFn$_invoke$arity$1(opts);
} else {
return and__5000__auto__;
}
}
})())?null:new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"pl-1.5 -mr-[3px] opacity-60"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.bullet-container","span.bullet-container",-1847146553),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.bullet","span.bullet",1911638461)], null)], null)], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-1","div.flex.flex-1",-1659764687),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.property-value.flex.flex-1","div.property-value.flex.flex-1",1424237803),(cljs.core.truth_(new cljs.core.Keyword(null,"class-schema?","class-schema?",508813900).cljs$core$IFn$_invoke$arity$1(opts))?frontend.components.property.value.property_value(property,(frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property","description","logseq.property/description",-336236200)) : frontend.db.entity.call(null,new cljs.core.Keyword("logseq.property","description","logseq.property/description",-336236200))),opts):frontend.components.property.value.property_value(block,property,opts))], null)], null)], null);
})()], null);
} else {
return null;
}
})());
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query], null),"frontend.components.property/property-cp");
frontend.components.property.ordered_properties = rum.core.lazy_build(rum.core.build_defcs,(function (state,block,properties,opts){
var _STAR_properties_order = new cljs.core.Keyword("frontend.components.property","properties-order","frontend.components.property/properties-order",412478091).cljs$core$IFn$_invoke$arity$1(state);
var properties_order = rum.core.react(_STAR_properties_order);
var m = cljs.core.zipmap(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,properties),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,properties));
var properties__$1 = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (k){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,cljs.core.get.cljs$core$IFn$_invoke$arity$2(m,k)], null);
}),properties_order);
var choices = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__116252){
var vec__116253 = p__116252;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__116253,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__116253,(1),null);
var id = cljs.core.subs.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(k),(1));
var opts__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"sortable-opts","sortable-opts",-21832640),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"id","id",-1388402092),id], null));
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),id,new cljs.core.Keyword(null,"value","value",305978217),k,new cljs.core.Keyword(null,"content","content",15833224),frontend.components.property.property_cp(block,k,v,opts__$1)], null);
}),properties__$1);
return frontend.components.dnd.items(choices,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"sort-by-inner-element?","sort-by-inner-element?",235482267),true,new cljs.core.Keyword(null,"on-drag-end","on-drag-end",520272671),(function (properties_order__$1,p__116260){
var map__116261 = p__116260;
var map__116261__$1 = cljs.core.__destructure_map(map__116261);
var active_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__116261__$1,new cljs.core.Keyword(null,"active-id","active-id",-59238656));
var over_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__116261__$1,new cljs.core.Keyword(null,"over-id","over-id",257293900));
var direction = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__116261__$1,new cljs.core.Keyword(null,"direction","direction",-633359395));
var move_down_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(direction,new cljs.core.Keyword(null,"down","down",1565245570));
var over = (function (){var G__116262 = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(over_id);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__116262) : frontend.db.entity.call(null,G__116262));
})();
var active = (function (){var G__116263 = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(active_id);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__116263) : frontend.db.entity.call(null,G__116263));
})();
var over_order = new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(over);
var new_order = ((move_down_QMARK_)?(function (){var next_order = logseq.db.common.order.get_next_order((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),null,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(over));
return logseq.db.common.order.gen_key(over_order,next_order);
})():(function (){var prev_order = logseq.db.common.order.get_prev_order((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),null,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(over));
return logseq.db.common.order.gen_key(prev_order,over_order);
})());
cljs.core.reset_BANG_(_STAR_properties_order,properties_order__$1);

return frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.state.get_current_repo(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(active),new cljs.core.Keyword("block","order","block/order",-1429282437),new_order], null),logseq.outliner.core.block_with_updated_at(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block)], null))], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null));
})], null));
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(state,new cljs.core.Keyword("frontend.components.property","properties-order","frontend.components.property/properties-order",412478091),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(cljs.core.first,cljs.core.second(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state)))));
}),new cljs.core.Keyword(null,"should-update","should-update",-1292781795),(function (old_state,new_state){
var vec__116270 = new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(old_state);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__116270,(0),null);
var p1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__116270,(1),null);
var opts1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__116270,(2),null);
var vec__116273 = new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(new_state);
var ___$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__116273,(0),null);
var p2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__116273,(1),null);
var opts2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__116273,(2),null);
var p1_keys = cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,p1);
var p1_set = cljs.core.set(p1_keys);
var p1_m = cljs.core.zipmap(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,p1),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,p1));
var p2_m = cljs.core.zipmap(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,p2),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,p2));
var p2_set = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,p2));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(p1_set,p2_set)){
} else {
cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.components.property","properties-order","frontend.components.property/properties-order",412478091).cljs$core$IFn$_invoke$arity$1(new_state),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(cljs.core.first,p2));
}

return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [p1_set,cljs.core.map.cljs$core$IFn$_invoke$arity$2(p1_m,p1_keys),opts1], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [p2_set,cljs.core.map.cljs$core$IFn$_invoke$arity$2(p2_m,p1_keys),opts2], null));
})], null)], null),"frontend.components.property/ordered-properties");
frontend.components.property.properties_section = rum.core.lazy_build(rum.core.build_defc,(function (block,properties,opts){
if(cljs.core.seq(properties)){
var properties_SINGLEQUOTE_ = cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2((function (p__116281){
var vec__116283 = p__116281;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__116283,(0),null);
var _v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__116283,(1),null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k,new cljs.core.Keyword("logseq.property.class","properties","logseq.property.class/properties",-2123712050))){
return "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz";
} else {
return new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(k) : frontend.db.entity.call(null,k)));
}
}),properties);
return frontend.components.property.ordered_properties(block,properties_SINGLEQUOTE_,opts);
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.property/properties-section");
frontend.components.property.properties_area = rum.core.lazy_build(rum.core.build_defcs,(function (state,_target_block,p__116299){
var map__116301 = p__116299;
var map__116301__$1 = cljs.core.__destructure_map(map__116301);
var opts = map__116301__$1;
var sidebar_properties_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__116301__$1,new cljs.core.Keyword(null,"sidebar-properties?","sidebar-properties?",606274147));
var id = new cljs.core.Keyword("frontend.components.property","id","frontend.components.property/id",-483365277).cljs$core$IFn$_invoke$arity$1(state);
var db_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("frontend.components.property","block","frontend.components.property/block",1630833233).cljs$core$IFn$_invoke$arity$1(state));
var block = (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(db_id) : frontend.db.sub_block.call(null,db_id));
var show_empty_and_hidden_properties_QMARK_ = (function (){var map__116315 = frontend.state.sub(new cljs.core.Keyword("ui","show-empty-and-hidden-properties?","ui/show-empty-and-hidden-properties?",1338368380));
var map__116315__$1 = cljs.core.__destructure_map(map__116315);
var mode = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__116315__$1,new cljs.core.Keyword(null,"mode","mode",654403691));
var show_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__116315__$1,new cljs.core.Keyword(null,"show?","show?",1543842127));
var ids = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__116315__$1,new cljs.core.Keyword(null,"ids","ids",-998535796));
var and__5000__auto__ = show_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(mode,new cljs.core.Keyword(null,"global","global",93595047))) || (((cljs.core.set_QMARK_(ids)) && (cljs.core.contains_QMARK_(ids,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block))))));
} else {
return and__5000__auto__;
}
})();
var properties = new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block);
var remove_built_in_or_other_position_properties = (function (properties__$1){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (property){
var id__$1 = ((cljs.core.vector_QMARK_(property))?cljs.core.first(property):property);
var or__5002__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(id__$1,new cljs.core.Keyword("block","tags","block/tags",1814948340));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var temp__5804__auto__ = (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(id__$1) : frontend.db.entity.call(null,id__$1));
if(cljs.core.truth_(temp__5804__auto__)){
var ent = temp__5804__auto__;
var or__5002__auto____$1 = (function (){var and__5000__auto__ = cljs.core.not((logseq.db.public_built_in_property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.public_built_in_property_QMARK_.cljs$core$IFn$_invoke$arity$1(ent) : logseq.db.public_built_in_property_QMARK_.call(null,ent)));
if(and__5000__auto__){
return (logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1(ent) : logseq.db.built_in_QMARK_.call(null,ent));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = (cljs.core.truth_((function (){var or__5002__auto____$2 = sidebar_properties_QMARK_;
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = (function (){var and__5000__auto__ = new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672).cljs$core$IFn$_invoke$arity$1(opts);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(opts),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto____$3)){
return or__5002__auto____$3;
} else {
return show_empty_and_hidden_properties_QMARK_;
}
}
})())?null:logseq.outliner.property.property_with_other_position_QMARK_(ent));
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var and__5000__auto__ = new cljs.core.Keyword(null,"gallery-view?","gallery-view?",1298131224).cljs$core$IFn$_invoke$arity$1(opts);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.property.class","properties","logseq.property.class/properties",-2123712050),null], null), null),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(ent));
} else {
return and__5000__auto__;
}
}
}
} else {
return null;
}
}
}),properties__$1);
});
var map__116311 = logseq.outliner.property.get_block_classes_properties((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block));
var map__116311__$1 = cljs.core.__destructure_map(map__116311);
var all_classes = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__116311__$1,new cljs.core.Keyword(null,"all-classes","all-classes",-2040626813));
var classes_properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__116311__$1,new cljs.core.Keyword(null,"classes-properties","classes-properties",1920679577));
var classes_properties_set = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096),classes_properties));
var block_own_properties = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p__116393){
var vec__116394 = p__116393;
var id__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__116394,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__116394,(1),null);
return (classes_properties_set.cljs$core$IFn$_invoke$arity$1 ? classes_properties_set.cljs$core$IFn$_invoke$arity$1(id__$1) : classes_properties_set.call(null,id__$1));
}),properties);
var root_block_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(opts),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)));
var state_hide_empty_properties_QMARK_ = new cljs.core.Keyword("ui","hide-empty-properties?","ui/hide-empty-properties?",-2048102776).cljs$core$IFn$_invoke$arity$1(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0());
var hide_with_property_id = (function (property_id){
var property = (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(property_id) : frontend.db.entity.call(null,property_id));
return cljs.core.boolean$((cljs.core.truth_(show_empty_and_hidden_properties_QMARK_)?false:(cljs.core.truth_(state_hide_empty_properties_QMARK_)?(cljs.core.get.cljs$core$IFn$_invoke$arity$2(block,property_id) == null):(cljs.core.truth_(sidebar_properties_QMARK_)?null:((root_block_QMARK_)?false:(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword("logseq.property","hide-empty-value","logseq.property/hide-empty-value",2062325899).cljs$core$IFn$_invoke$arity$1(property);
if(cljs.core.truth_(and__5000__auto__)){
return (cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties,property_id) == null);
} else {
return and__5000__auto__;
}
})())?true:cljs.core.boolean$(new cljs.core.Keyword("logseq.property","hide?","logseq.property/hide?",68365746).cljs$core$IFn$_invoke$arity$1(property))
)))
)));
});
var property_hide_f = ((frontend.config.publishing_QMARK_)?(function (p__116402){
var vec__116403 = p__116402;
var property_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__116403,(0),null);
var property_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__116403,(1),null);
return (((property_value == null)) || (hide_with_property_id(property_id)));
}):(cljs.core.truth_(state_hide_empty_properties_QMARK_)?(function (p__116409){
var vec__116410 = p__116409;
var property_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__116410,(0),null);
var property_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__116410,(1),null);
if(cljs.core.truth_(new cljs.core.Keyword("logseq.property","hide?","logseq.property/hide?",68365746).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(property_id) : frontend.db.entity.call(null,property_id))))){
return hide_with_property_id(property_id);
} else {
return (property_value == null);
}
}):cljs.core.comp.cljs$core$IFn$_invoke$arity$2(hide_with_property_id,cljs.core.first)
));
var map__116312 = cljs.core.group_by(property_hide_f,block_own_properties);
var map__116312__$1 = cljs.core.__destructure_map(map__116312);
var _block_hidden_properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__116312__$1,true);
var block_own_properties_SINGLEQUOTE_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__116312__$1,false);
var class_properties = (function (){var classes = all_classes;
var properties__$1 = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,block_own_properties_SINGLEQUOTE_));
var result = cljs.core.PersistentVector.EMPTY;
while(true){
var temp__5802__auto__ = cljs.core.first(classes);
if(cljs.core.truth_(temp__5802__auto__)){
var class$ = temp__5802__auto__;
var cur_properties = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(hide_with_property_id,cljs.core.remove.cljs$core$IFn$_invoke$arity$2(properties__$1,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096),logseq.db.frontend.property.get_class_ordered_properties(class$))));
var G__116579 = cljs.core.rest(classes);
var G__116580 = clojure.set.union.cljs$core$IFn$_invoke$arity$2(properties__$1,cljs.core.set(cur_properties));
var G__116581 = ((cljs.core.seq(cur_properties))?cljs.core.into.cljs$core$IFn$_invoke$arity$2(result,cur_properties):result);
classes = G__116579;
properties__$1 = G__116580;
result = G__116581;
continue;
} else {
return result;
}
break;
}
})();
var full_properties = (function (){var G__116419 = remove_built_in_or_other_position_properties(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(block_own_properties_SINGLEQUOTE_,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [p,cljs.core.get.cljs$core$IFn$_invoke$arity$2(block,p)], null);
}),class_properties)));
if(cljs.core.truth_((function (){var and__5000__auto__ = (logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(block) : logseq.db.class_QMARK_.call(null,block));
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.empty_QMARK_(new cljs.core.Keyword("logseq.property.class","properties","logseq.property.class/properties",-2123712050).cljs$core$IFn$_invoke$arity$1(block));
} else {
return and__5000__auto__;
}
})())){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(G__116419,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.class","properties","logseq.property.class/properties",-2123712050),null], null)], null));
} else {
return G__116419;
}
})();
if(cljs.core.empty_QMARK_(full_properties)){
if(cljs.core.truth_(sidebar_properties_QMARK_)){
return rum.core.with_key(frontend.components.property.new_property(block,opts),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),"-add-property"].join(''));
} else {
return null;
}
} else {
var remove_properties = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("logseq.property","query","logseq.property/query",-97414126),null,new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285),null], null), null);
var properties_SINGLEQUOTE_ = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p__116423){
var vec__116425 = p__116423;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__116425,(0),null);
var _v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__116425,(1),null);
return cljs.core.contains_QMARK_(remove_properties,k);
}),full_properties);
var page_QMARK_ = logseq.db.frontend.entity_util.page_QMARK_(block);
return daiquiri.core.create_element("div",{'id':id,'tabIndex':(0),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ls-properties-area",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"ls-page-properties","ls-page-properties",1028732986),page_QMARK_], null)], null))], null))},[daiquiri.core.create_element(daiquiri.core.fragment,null,[frontend.components.property.properties_section(block,properties_SINGLEQUOTE_,opts),(cljs.core.truth_(page_QMARK_)?rum.core.with_key(frontend.components.property.new_property(block,opts),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),"-add-property"].join('')):null)])]);

}
}),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
var target_block = cljs.core.first(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state));
var block = frontend.components.property.resolve_linked_block_if_exists(target_block);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(state,new cljs.core.Keyword("frontend.components.property","id","frontend.components.property/id",-483365277),cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.random_uuid()),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("frontend.components.property","block","frontend.components.property/block",1630833233),block], 0));
})], null)], null),"frontend.components.property/properties-area");

//# sourceMappingURL=frontend.components.property.js.map
