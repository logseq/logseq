goog.provide('frontend.components.views');
frontend.components.views.get_scroll_parent = (function frontend$components$views$get_scroll_parent(config){
if(cljs.core.truth_(new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672).cljs$core$IFn$_invoke$arity$1(config))){
return (dommy.utils.__GT_Array(document.getElementsByClassName("sidebar-item-list"))[(0)]);
} else {
return goog.dom.getElement("main-content-container");
}
});
frontend.components.views.header_checkbox = rum.core.lazy_build(rum.core.build_defc,(function (p__70832){
var map__70842 = p__70832;
var map__70842__$1 = cljs.core.__destructure_map(map__70842);
var table = map__70842__$1;
var selected_all_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70842__$1,new cljs.core.Keyword(null,"selected-all?","selected-all?",1723040507));
var selected_some_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70842__$1,new cljs.core.Keyword(null,"selected-some?","selected-some?",-1877870503));
var toggle_selected_all_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70842__$1,new cljs.core.Keyword(null,"toggle-selected-all!","toggle-selected-all!",-649409852));
var vec__70850 = rum.core.use_state(false);
var show_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70850,(0),null);
var set_show_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70850,(1),null);
return daiquiri.core.create_element("label",{'htmlFor':"header-checkbox",'onMouseOver':(function (){
return (set_show_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_show_BANG_.cljs$core$IFn$_invoke$arity$1(true) : set_show_BANG_.call(null,true));
}),'onMouseOut':(function (){
return (set_show_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_show_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_show_BANG_.call(null,false));
}),'className':"h-8 w-8 flex items-center justify-center cursor-pointer"},[daiquiri.interpreter.interpret((function (){var G__70870 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"id","id",-1388402092),"header-checkbox",new cljs.core.Keyword(null,"checked","checked",-50955819),(function (){var or__5002__auto__ = selected_all_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var and__5000__auto__ = selected_some_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return "indeterminate";
} else {
return and__5000__auto__;
}
}
})(),new cljs.core.Keyword(null,"on-checked-change","on-checked-change",-482086819),(function (value){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(value)?frontend.db.async._LT_get_blocks.cljs$core$IFn$_invoke$arity$variadic(frontend.state.get_current_repo(),new cljs.core.Keyword(null,"rows","rows",850049680).cljs$core$IFn$_invoke$arity$1(table),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.PersistentArrayMap.EMPTY], 0)):null)),(function (___40947__auto__){
return promesa.protocols._promise((toggle_selected_all_BANG_.cljs$core$IFn$_invoke$arity$2 ? toggle_selected_all_BANG_.cljs$core$IFn$_invoke$arity$2(table,value) : toggle_selected_all_BANG_.call(null,table,value)));
}));
}));
}),new cljs.core.Keyword(null,"aria-label","aria-label",455891514),"Select all",new cljs.core.Keyword(null,"class","class",-2030961996),["flex transition-opacity ",(cljs.core.truth_((function (){var or__5002__auto__ = show_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = selected_all_QMARK_;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return selected_some_QMARK_;
}
}
})())?"opacity-100":"opacity-0")].join('')], null);
return (logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1(G__70870) : logseq.shui.ui.checkbox.call(null,G__70870));
})())]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.views/header-checkbox");
frontend.components.views.header_index = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.core.create_element("label",{'htmlFor':"header-index",'title':"Row number",'className':"h-8 w-6 flex items-center justify-center"},["ID"]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.views/header-index");
frontend.components.views.row_checkbox = rum.core.lazy_build(rum.core.build_defc,(function (p__70947,row,_column){
var map__70949 = p__70947;
var map__70949__$1 = cljs.core.__destructure_map(map__70949);
var row_selected_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70949__$1,new cljs.core.Keyword(null,"row-selected?","row-selected?",165215850));
var row_toggle_selected_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70949__$1,new cljs.core.Keyword(null,"row-toggle-selected!","row-toggle-selected!",1549823697));
var data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70949__$1,new cljs.core.Keyword(null,"data","data",-232669377));
var state = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70949__$1,new cljs.core.Keyword(null,"state","state",-1988618099));
var data_fns = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70949__$1,new cljs.core.Keyword(null,"data-fns","data-fns",-1065218324));
var idx = data.indexOf(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(row));
var id = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(row)),"-","checkbox"].join('');
var vec__70952 = rum.core.use_state(false);
var show_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70952,(0),null);
var set_show_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70952,(1),null);
var checked_QMARK_ = (row_selected_QMARK_.cljs$core$IFn$_invoke$arity$1 ? row_selected_QMARK_.cljs$core$IFn$_invoke$arity$1(row) : row_selected_QMARK_.call(null,row));
var map__70955 = state;
var map__70955__$1 = cljs.core.__destructure_map(map__70955);
var last_selected_idx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70955__$1,new cljs.core.Keyword(null,"last-selected-idx","last-selected-idx",2024080238));
var row_selection = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70955__$1,new cljs.core.Keyword(null,"row-selection","row-selection",1964656498));
var map__70956 = data_fns;
var map__70956__$1 = cljs.core.__destructure_map(map__70956);
var set_last_selected_idx_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70956__$1,new cljs.core.Keyword(null,"set-last-selected-idx!","set-last-selected-idx!",1750927071));
var set_row_selection_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70956__$1,new cljs.core.Keyword(null,"set-row-selection!","set-row-selection!",1872995139));
return daiquiri.core.create_element("label",{'htmlFor':[cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(row)),"-","checkbox"].join(''),'onMouseOver':(function (){
return (set_show_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_show_BANG_.cljs$core$IFn$_invoke$arity$1(true) : set_show_BANG_.call(null,true));
}),'onMouseOut':(function (){
return (set_show_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_show_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_show_BANG_.call(null,false));
}),'className':"h-8 w-8 flex items-center justify-center cursor-pointer"},[daiquiri.interpreter.interpret((function (){var G__70986 = new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"id","id",-1388402092),id,new cljs.core.Keyword(null,"checked","checked",-50955819),checked_QMARK_,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
if(cljs.core.truth_((function (){var and__5000__auto__ = e.shiftKey;
if(cljs.core.truth_(and__5000__auto__)){
return last_selected_idx;
} else {
return and__5000__auto__;
}
})())){
frontend.util.stop(e);

if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(last_selected_idx,idx)){
var new_ids = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (idx__$1){
return frontend.util.nth_safe(data,idx__$1);
}),cljs.core.range.cljs$core$IFn$_invoke$arity$2((function (){var x__5090__auto__ = last_selected_idx;
var y__5091__auto__ = idx;
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})(),((function (){var x__5087__auto__ = last_selected_idx;
var y__5088__auto__ = idx;
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})() + (1))));
if(cljs.core.seq(new_ids)){
var row_selection_SINGLEQUOTE_ = cljs.core.update.cljs$core$IFn$_invoke$arity$4(row_selection,new cljs.core.Keyword(null,"selected-ids","selected-ids",-1154760141),clojure.set.union,cljs.core.set(new_ids));
return (set_row_selection_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_row_selection_BANG_.cljs$core$IFn$_invoke$arity$1(row_selection_SINGLEQUOTE_) : set_row_selection_BANG_.call(null,row_selection_SINGLEQUOTE_));
} else {
return null;
}
} else {
return null;
}
} else {
return null;
}
}),new cljs.core.Keyword(null,"on-checked-change","on-checked-change",-482086819),(function (v){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(v)?frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(row),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"skip-refresh?","skip-refresh?",878432095),true,new cljs.core.Keyword(null,"children?","children?",-1199594108),false], null)], 0)):null)),(function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(v)?(set_last_selected_idx_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_last_selected_idx_BANG_.cljs$core$IFn$_invoke$arity$1(idx) : set_last_selected_idx_BANG_.call(null,idx)):((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(row),last_selected_idx))?(set_last_selected_idx_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_last_selected_idx_BANG_.cljs$core$IFn$_invoke$arity$1(null) : set_last_selected_idx_BANG_.call(null,null)):null))),(function (___40947__auto____$1){
return promesa.protocols._promise((row_toggle_selected_BANG_.cljs$core$IFn$_invoke$arity$3 ? row_toggle_selected_BANG_.cljs$core$IFn$_invoke$arity$3(row_selection,row,v) : row_toggle_selected_BANG_.call(null,row_selection,row,v)));
}));
}));
}));
}),new cljs.core.Keyword(null,"aria-label","aria-label",455891514),"Select row",new cljs.core.Keyword(null,"class","class",-2030961996),["flex transition-opacity ",(cljs.core.truth_((function (){var or__5002__auto__ = show_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return checked_QMARK_;
}
})())?"opacity-100":"opacity-0")].join('')], null);
return (logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1(G__70986) : logseq.shui.ui.checkbox.call(null,G__70986));
})())]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.views/row-checkbox");
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.views !== 'undefined') && (typeof frontend.components.views._STAR_last_header_action_target !== 'undefined')){
} else {
frontend.components.views._STAR_last_header_action_target = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
frontend.components.views.header_cp = (function frontend$components$views$header_cp(p__70990,column){
var map__70991 = p__70990;
var map__70991__$1 = cljs.core.__destructure_map(map__70991);
var view_entity = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70991__$1,new cljs.core.Keyword(null,"view-entity","view-entity",-1084117808));
var column_set_sorting_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70991__$1,new cljs.core.Keyword(null,"column-set-sorting!","column-set-sorting!",892954674));
var state = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70991__$1,new cljs.core.Keyword(null,"state","state",-1988618099));
var sorting = new cljs.core.Keyword(null,"sorting","sorting",622249690).cljs$core$IFn$_invoke$arity$1(state);
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0();
var vec__70992 = cljs.core.some((function (item){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column))){
var temp__5808__auto__ = new cljs.core.Keyword(null,"asc?","asc?",891093427).cljs$core$IFn$_invoke$arity$1(item);
if((temp__5808__auto__ == null)){
return null;
} else {
var asc_QMARK_ = temp__5808__auto__;
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [asc_QMARK_], null);
}
} else {
return null;
}
}),sorting);
var asc_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70992,(0),null);
var property = (function (){var G__70995 = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__70995) : frontend.db.entity.call(null,G__70995));
})();
var pinned_QMARK_ = (cljs.core.truth_(property)?cljs.core.contains_QMARK_(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("logseq.property.table","pinned-columns","logseq.property.table/pinned-columns",267375138).cljs$core$IFn$_invoke$arity$1(view_entity))),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property)):null);
var sub_content = (function (p__70996){
var map__70997 = p__70996;
var map__70997__$1 = cljs.core.__destructure_map(map__70997);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70997__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var table_options = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var G__70998 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"asc",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (column_set_sorting_BANG_.cljs$core$IFn$_invoke$arity$3 ? column_set_sorting_BANG_.cljs$core$IFn$_invoke$arity$3(sorting,column,true) : column_set_sorting_BANG_.call(null,sorting,column,true));
})], null);
var G__70999 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.items-center.gap-1","div.flex.flex-row.items-center.gap-1",-1023433319),frontend.ui.icon("arrow-up",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(15)], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"Sort ascending"], null)], null);
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__70998,G__70999) : logseq.shui.ui.dropdown_menu_item.call(null,G__70998,G__70999));
})(),(function (){var G__71031 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"desc",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (column_set_sorting_BANG_.cljs$core$IFn$_invoke$arity$3 ? column_set_sorting_BANG_.cljs$core$IFn$_invoke$arity$3(sorting,column,false) : column_set_sorting_BANG_.call(null,sorting,column,false));
})], null);
var G__71032 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.items-center.gap-1","div.flex.flex-row.items-center.gap-1",-1023433319),frontend.ui.icon("arrow-down",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(15)], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"Sort descending"], null)], null);
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__71031,G__71032) : logseq.shui.ui.dropdown_menu_item.call(null,G__71031,G__71032));
})(),(cljs.core.truth_((function (){var and__5000__auto__ = db_based_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return property;
} else {
return and__5000__auto__;
}
})())?(function (){var G__71038 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_e){
if(cljs.core.truth_(pinned_QMARK_)){
frontend.handler.db_based.property.delete_property_value_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_entity),new cljs.core.Keyword("logseq.property.table","pinned-columns","logseq.property.table/pinned-columns",267375138),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property));
} else {
frontend.handler.property.set_block_property_BANG_(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_entity),new cljs.core.Keyword("logseq.property.table","pinned-columns","logseq.property.table/pinned-columns",267375138),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property));
}

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1(id) : logseq.shui.ui.popup_hide_BANG_.call(null,id));
})], null);
var G__71039 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.items-center.gap-1","div.flex.flex-row.items-center.gap-1",-1023433319),frontend.ui.icon("pin",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(15)], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),(cljs.core.truth_(pinned_QMARK_)?"Unpin":"Pin")], null)], null);
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__71038,G__71039) : logseq.shui.ui.dropdown_menu_item.call(null,G__71038,G__71039));
})():null)], null);
var tag = (function (){var temp__5804__auto__ = new cljs.core.Keyword("logseq.property","view-for","logseq.property/view-for",-36274319).cljs$core$IFn$_invoke$arity$1(view_entity);
if(cljs.core.truth_(temp__5804__auto__)){
var entity = temp__5804__auto__;
if(cljs.core.truth_((logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(entity) : logseq.db.class_QMARK_.call(null,entity)))){
return entity;
} else {
return null;
}
} else {
return null;
}
})();
var option = (function (){var G__71043 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"with-title?","with-title?",-1110963321),false,new cljs.core.Keyword(null,"more-options","more-options",1399478268),table_options], null);
if((!((tag == null)))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__71043,new cljs.core.Keyword(null,"class-schema?","class-schema?",508813900),true);
} else {
return G__71043;
}
})();
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.ls-property-dropdown","div.ls-property-dropdown",-263769697),frontend.components.property.config.property_dropdown(property,tag,option)], null);
});
var G__71046 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"variant","variant",-424354234),"text",new cljs.core.Keyword(null,"class","class",-2030961996),"h-8 !pl-4 !px-2 !py-0 hover:text-foreground w-full justify-start",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
var popup_id = ["table-column-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column))].join('');
var temp__5804__auto__ = (function (){var G__71049 = e.target;
if((G__71049 == null)){
return null;
} else {
return G__71049.closest("[aria-roledescription=sortable]");
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var el = temp__5804__auto__;
if((((((cljs.core.deref(frontend.components.views._STAR_last_header_action_target) == null)) || (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(el,cljs.core.deref(frontend.components.views._STAR_last_header_action_target))))) && (clojure.string.blank_QMARK_((function (){var G__71056 = el;
var G__71056__$1 = (((G__71056 == null))?null:G__71056.style);
if((G__71056__$1 == null)){
return null;
} else {
return G__71056__$1.transform;
}
})())))){
var G__71058 = el;
var G__71059 = sub_content;
var G__71060 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"id","id",-1388402092),popup_id,new cljs.core.Keyword(null,"align","align",1964212802),"start",new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558),true,new cljs.core.Keyword(null,"on-before-hide","on-before-hide",782449747),(function (){
cljs.core.reset_BANG_(frontend.components.views._STAR_last_header_action_target,el);

return setTimeout((function (){
return cljs.core.reset_BANG_(frontend.components.views._STAR_last_header_action_target,null);
}),(128));
})], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__71058,G__71059,G__71060) : logseq.shui.ui.popup_show_BANG_.call(null,G__71058,G__71059,G__71060));
} else {
return null;
}
} else {
return null;
}
})], null);
var G__71047 = (function (){var title = cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(column));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),title,new cljs.core.Keyword(null,"class","class",-2030961996),"max-w-full overflow-hidden text-ellipsis"], null),title], null);
})();
var G__71048 = (function (){var G__71066 = asc_QMARK_;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(true,G__71066)){
return frontend.ui.icon("arrow-up");
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(false,G__71066)){
return frontend.ui.icon("arrow-down");
} else {
return null;

}
}
})();
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3(G__71046,G__71047,G__71048) : logseq.shui.ui.button.call(null,G__71046,G__71047,G__71048));
});
frontend.components.views.timestamp_cell_cp = (function frontend$components$views$timestamp_cell_cp(_table,row,column){
var G__71073 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(row,new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column));
if((G__71073 == null)){
return null;
} else {
return frontend.date.int__GT_local_time_2(G__71073);
}
});
frontend.components.views.get_property_value_content = (function frontend$components$views$get_property_value_content(entity){
return logseq.db.common.view.get_property_value_content((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),entity);
});
frontend.components.views.block_container = rum.core.lazy_build(rum.core.build_defc,(function (config,row){
var container = frontend.state.get_component(new cljs.core.Keyword("block","container","block/container",510671002));
var config_SINGLEQUOTE_ = (function (){var G__71076 = config;
if(cljs.core.not(new cljs.core.Keyword(null,"popup?","popup?",-266197002).cljs$core$IFn$_invoke$arity$1(config))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__71076,new cljs.core.Keyword(null,"view?","view?",655244230),true);
} else {
return G__71076;
}
})();
return daiquiri.core.create_element("div",{'style':{'minHeight':(24)},'className':"relative w-full"},[(cljs.core.truth_(row)?daiquiri.interpreter.interpret((container.cljs$core$IFn$_invoke$arity$2 ? container.cljs$core$IFn$_invoke$arity$2(config_SINGLEQUOTE_,row) : container.call(null,config_SINGLEQUOTE_,row))):daiquiri.core.create_element("div",null,null))]);
}),null,"frontend.components.views/block-container");
frontend.components.views.save_block_and_focus = (function frontend$components$views$save_block_and_focus(_STAR_ref,set_focus_timeout_BANG_,hide_popup_QMARK_){
var node = rum.core.deref(_STAR_ref);
var cell = frontend.util.rec_get_node(node,"ls-table-cell");
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0()),(function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(hide_popup_QMARK_)?(logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null)):null)),(function (___40947__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.exit_editing_and_set_selected_blocks_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cell], null))),(function (___40947__auto____$2){
return promesa.protocols._promise((function (){var G__71086 = setTimeout((function (){
return cell.focus();
}),(100));
return (set_focus_timeout_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_focus_timeout_BANG_.cljs$core$IFn$_invoke$arity$1(G__71086) : set_focus_timeout_BANG_.call(null,G__71086));
})());
}));
}));
}));
}));
});
/**
 * Used on table view
 */
frontend.components.views.block_title = rum.core.lazy_build(rum.core.build_defc,(function (block_STAR_,p__71087){
var map__71088 = p__71087;
var map__71088__$1 = cljs.core.__destructure_map(map__71088);
var create_new_block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71088__$1,new cljs.core.Keyword(null,"create-new-block","create-new-block",1377747253));
var width = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71088__$1,new cljs.core.Keyword(null,"width","width",-384071477));
var row = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71088__$1,new cljs.core.Keyword(null,"row","row",-570139521));
var property = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71088__$1,new cljs.core.Keyword(null,"property","property",-1114278232));
var _STAR_ref = (logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_ref.call(null,null));
var vec__71090 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1((0)) : logseq.shui.hooks.use_state.call(null,(0)));
var opacity = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71090,(0),null);
var set_opacity_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71090,(1),null);
var vec__71093 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_state.call(null,null));
var focus_timeout = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71093,(0),null);
var set_focus_timeout_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71093,(1),null);
var inline_title = frontend.state.get_component(new cljs.core.Keyword("block","inline-title","block/inline-title",984777401));
var many_QMARK_ = logseq.db.frontend.property.many_QMARK_(property);
var block = ((many_QMARK_)?cljs.core.first(block_STAR_):block_STAR_);
var add_to_sidebar_BANG_ = (function (){
return frontend.state.sidebar_add_block_BANG_(frontend.state.get_current_repo(),(function (){var or__5002__auto__ = (function (){var and__5000__auto__ = many_QMARK_;
if(and__5000__auto__){
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(row);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
}
})(),new cljs.core.Keyword(null,"block","block",664686210));
});
var redirect_BANG_ = (function (){
var G__71096 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
if((G__71096 == null)){
return null;
} else {
return frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$1(G__71096);
}
});
logseq.shui.hooks.use_effect_BANG_((function (){
return (function (){
var G__71098 = focus_timeout;
if((G__71098 == null)){
return null;
} else {
return clearTimeout(G__71098);
}
});
}),cljs.core.PersistentVector.EMPTY);

return daiquiri.core.create_element("div",{'ref':_STAR_ref,'onMouseOver':(function (){
return (set_opacity_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_opacity_BANG_.cljs$core$IFn$_invoke$arity$1((100)) : set_opacity_BANG_.call(null,(100)));
}),'onMouseOut':(function (){
return (set_opacity_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_opacity_BANG_.cljs$core$IFn$_invoke$arity$1((0)) : set_opacity_BANG_.call(null,(0)));
}),'onClick':(function (e){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var or__5002__auto__ = block;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var and__5000__auto__ = cljs.core.fn_QMARK_(create_new_block);
if(and__5000__auto__){
return (create_new_block.cljs$core$IFn$_invoke$arity$0 ? create_new_block.cljs$core$IFn$_invoke$arity$0() : create_new_block.call(null));
} else {
return and__5000__auto__;
}
}
})()),(function (block__$1){
return promesa.protocols._promise((cljs.core.truth_(block__$1)?(cljs.core.truth_(frontend.util.meta_key_QMARK_(e))?redirect_BANG_():(cljs.core.truth_(e.shiftKey)?add_to_sidebar_BANG_():(function (){var popup = (function (){
var width__$1 = ((function (){var x__5087__auto__ = (160);
var y__5088__auto__ = width;
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})() - (18));
if(many_QMARK_){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.ls-table-block","div.ls-table-block",1510860318),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"width","width",-384071477),width__$1,new cljs.core.Keyword(null,"max-width","max-width",-1939924051),width__$1], null),new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.util.stop_propagation], null),frontend.components.property.value.property_value(row,property,cljs.core.PersistentArrayMap.EMPTY)], null);
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.ls-table-block","div.ls-table-block",1510860318),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"width","width",-384071477),width__$1,new cljs.core.Keyword(null,"max-width","max-width",-1939924051),width__$1], null),new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.util.stop_propagation], null),frontend.components.views.block_container(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"popup?","popup?",-266197002),true,new cljs.core.Keyword(null,"view?","view?",655244230),true,new cljs.core.Keyword(null,"table-block-title?","table-block-title?",-1188462014),true,new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (e__$1){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.util.ekey(e__$1),"Enter")){
frontend.util.stop(e__$1);

return frontend.components.views.save_block_and_focus(_STAR_ref,set_focus_timeout_BANG_,true);
} else {
return null;
}
})], null),block__$1)], null);
}
});
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__71103 = e.target.closest(".ls-table-cell");
var G__71104 = popup;
var G__71105 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"ls-table-block-editor","ls-table-block-editor",-2091588140),new cljs.core.Keyword(null,"as-mask?","as-mask?",1898009773),true,new cljs.core.Keyword(null,"on-after-hide","on-after-hide",-1040754229),(function (){
return frontend.components.views.save_block_and_focus(_STAR_ref,set_focus_timeout_BANG_,false);
})], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__71103,G__71104,G__71105) : logseq.shui.ui.popup_show_BANG_.call(null,G__71103,G__71104,G__71105));
})()),(function (___40947__auto__){
return promesa.protocols._promise((function (){var G__71107 = block__$1;
var G__71108 = new cljs.core.Keyword(null,"max","max",61366548);
var G__71109 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"container-id","container-id",1274665684),new cljs.core.Keyword(null,"unknown-container","unknown-container",1739831473)], null);
return (frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3(G__71107,G__71108,G__71109) : frontend.handler.editor.edit_block_BANG_.call(null,G__71107,G__71108,G__71109));
})());
}));
}));
})()
)):null));
}));
}));
}),'className':"table-block-title relative flex items-center w-full h-full cursor-pointer items-center"},[(cljs.core.truth_(block)?(function (){var attrs71115 = (function (){var render = (function (block__$1){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),(function (){var G__71120 = (function (){var G__71121 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block__$1);
var G__71121__$1 = (((G__71121 == null))?null:clojure.string.trim(G__71121));
var G__71121__$2 = (((G__71121__$1 == null))?null:clojure.string.split_lines(G__71121__$1));
if((G__71121__$2 == null)){
return null;
} else {
return cljs.core.first(G__71121__$2);
}
})();
return (inline_title.cljs$core$IFn$_invoke$arity$1 ? inline_title.cljs$core$IFn$_invoke$arity$1(G__71120) : inline_title.call(null,G__71120));
})()], null);
});
if(many_QMARK_){
return cljs.core.interpose.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mr-1","div.mr-1",470602940),","], null),cljs.core.map.cljs$core$IFn$_invoke$arity$2(render,block_STAR_));
} else {
return render(block_STAR_);
}
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs71115))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row"], null)], null),attrs71115], 0))):{'className':"flex flex-row"}),((cljs.core.map_QMARK_(attrs71115))?null:[daiquiri.interpreter.interpret(attrs71115)]));
})():daiquiri.core.create_element("div",null,null)),(function (){var class$ = ["h-6 w-6 !p-1 text-muted-foreground transition-opacity duration-100 ease-in bg-gray-01 ","opacity-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(opacity)].join('');
return daiquiri.core.create_element("div",{'className':"absolute -right-1"},[(function (){var attrs71132 = (function (){var G__71134 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"title","title",636505583),"Open",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
frontend.util.stop_propagation(e);

return redirect_BANG_();
}),new cljs.core.Keyword(null,"class","class",-2030961996),class$], null);
var G__71135 = frontend.ui.icon("arrow-right");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__71134,G__71135) : logseq.shui.ui.button.call(null,G__71134,G__71135));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs71132))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","items-center"], null)], null),attrs71132], 0))):{'className':"flex flex-row items-center"}),((cljs.core.map_QMARK_(attrs71132))?[daiquiri.interpreter.interpret((function (){var G__71138 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"title","title",636505583),"Open in sidebar",new cljs.core.Keyword(null,"class","class",-2030961996),class$,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
frontend.util.stop_propagation(e);

return add_to_sidebar_BANG_();
})], null);
var G__71139 = frontend.ui.icon("layout-sidebar-right");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__71138,G__71139) : logseq.shui.ui.button.call(null,G__71138,G__71139));
})())]:[daiquiri.interpreter.interpret(attrs71132),daiquiri.interpreter.interpret((function (){var G__71142 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"title","title",636505583),"Open in sidebar",new cljs.core.Keyword(null,"class","class",-2030961996),class$,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
frontend.util.stop_propagation(e);

return add_to_sidebar_BANG_();
})], null);
var G__71143 = frontend.ui.icon("layout-sidebar-right");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__71142,G__71143) : logseq.shui.ui.button.call(null,G__71142,G__71143));
})())]));
})()]);
})()]);
}),null,"frontend.components.views/block-title");
frontend.components.views.build_columns = (function frontend$components$views$build_columns(var_args){
var args__5732__auto__ = [];
var len__5726__auto___73092 = arguments.length;
var i__5727__auto___73093 = (0);
while(true){
if((i__5727__auto___73093 < len__5726__auto___73092)){
args__5732__auto__.push((arguments[i__5727__auto___73093]));

var G__73094 = (i__5727__auto___73093 + (1));
i__5727__auto___73093 = G__73094;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.components.views.build_columns.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.components.views.build_columns.cljs$core$IFn$_invoke$arity$variadic = (function (config,properties,p__71152){
var map__71153 = p__71152;
var map__71153__$1 = cljs.core.__destructure_map(map__71153);
var with_object_name_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__71153__$1,new cljs.core.Keyword(null,"with-object-name?","with-object-name?",1288972903),true);
var with_id_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__71153__$1,new cljs.core.Keyword(null,"with-id?","with-id?",1405069912),true);
var add_tags_column_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__71153__$1,new cljs.core.Keyword(null,"add-tags-column?","add-tags-column?",708044916),true);
var add_tags_column_QMARK__SINGLEQUOTE_ = (function (){var and__5000__auto__ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo());
if(and__5000__auto__){
return add_tags_column_QMARK_;
} else {
return and__5000__auto__;
}
})();
var properties_SINGLEQUOTE_ = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,(cljs.core.truth_((function (){var or__5002__auto__ = cljs.core.some((function (p1__71144_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(p1__71144_SHARP_),new cljs.core.Keyword("block","tags","block/tags",1814948340));
}),properties);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.not(add_tags_column_QMARK__SINGLEQUOTE_);
}
})())?properties:cljs.core.conj.cljs$core$IFn$_invoke$arity$2(properties,(frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","tags","block/tags",1814948340)) : frontend.db.entity.call(null,new cljs.core.Keyword("block","tags","block/tags",1814948340))))));
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"select","select",1147833503),new cljs.core.Keyword(null,"name","name",1843675177),"Select",new cljs.core.Keyword(null,"header","header",119441134),(function (table,_column){
return frontend.components.views.header_checkbox(table);
}),new cljs.core.Keyword(null,"cell","cell",764245084),(function (table,row,column){
return frontend.components.views.row_checkbox(table,row,column);
}),new cljs.core.Keyword(null,"column-list?","column-list?",-538229318),false,new cljs.core.Keyword(null,"resizable?","resizable?",20635134),false], null),(cljs.core.truth_(with_id_QMARK_)?new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"name","name",1843675177),"ID",new cljs.core.Keyword(null,"header","header",119441134),(function (_table,_column){
return frontend.components.views.header_index();
}),new cljs.core.Keyword(null,"cell","cell",764245084),(function (table,row,_column){
return (new cljs.core.Keyword(null,"rows","rows",850049680).cljs$core$IFn$_invoke$arity$1(table).indexOf(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(row)) + (1));
}),new cljs.core.Keyword(null,"resizable?","resizable?",20635134),false], null):null),(cljs.core.truth_(with_object_name_QMARK_)?new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword(null,"name","name",1843675177),"Name",new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"string","string",-1989541586),new cljs.core.Keyword(null,"header","header",119441134),frontend.components.views.header_cp,new cljs.core.Keyword(null,"cell","cell",764245084),(function (_table,row,_column,style){
return frontend.components.views.block_title(row,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"property-ident","property-ident",697145839),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672),new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672).cljs$core$IFn$_invoke$arity$1(config),new cljs.core.Keyword(null,"width","width",-384071477),new cljs.core.Keyword(null,"width","width",-384071477).cljs$core$IFn$_invoke$arity$1(style)], null));
}),new cljs.core.Keyword(null,"disable-hide?","disable-hide?",-1203602151),true], null):null)], null),cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (property){
var temp__5804__auto__ = (function (){var or__5002__auto__ = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(property);
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var ident = temp__5804__auto__;
if(cljs.core.truth_((function (){var or__5002__auto__ = cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551),null,new cljs.core.Keyword("logseq.property.asset","checksum","logseq.property.asset/checksum",-1011416979),null,new cljs.core.Keyword("logseq.property.class","properties","logseq.property.class/properties",-2123712050),null,new cljs.core.Keyword("block","created-at","block/created-at",1440015),null,new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991),null,new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160),null,new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267),null,new cljs.core.Keyword("block","order","block/order",-1429282437),null], null), null),ident);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = (function (){var and__5000__auto__ = with_object_name_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","title","block/title",710445684),ident);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"entity","entity",-450970276),null,new cljs.core.Keyword(null,"map","map",1371690461),null], null), null),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property));
}
}
})())){
return null;
} else {
var property__$1 = ((datascript.impl.entity.entity_QMARK_(property))?property:(function (){var or__5002__auto__ = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(ident) : frontend.db.entity.call(null,ident)),property], 0));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return property;
}
})());
var get_value = ((datascript.impl.entity.entity_QMARK_(property__$1))?(function (row){
return logseq.db.common.view.get_property_value_for_search(row,property__$1);
}):null);
return new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"id","id",-1388402092),ident,new cljs.core.Keyword(null,"name","name",1843675177),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(property__$1);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(property__$1);
}
})(),new cljs.core.Keyword(null,"header","header",119441134),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"header","header",119441134).cljs$core$IFn$_invoke$arity$1(property__$1);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.components.views.header_cp;
}
})(),new cljs.core.Keyword(null,"cell","cell",764245084),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"cell","cell",764245084).cljs$core$IFn$_invoke$arity$1(property__$1);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
if(datascript.impl.entity.entity_QMARK_(property__$1)){
return (function (_table,row,_column,style){
return frontend.components.property.value.property_value(row,property__$1,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"view?","view?",655244230),true,new cljs.core.Keyword(null,"table-view?","table-view?",2073887505),true,new cljs.core.Keyword(null,"table-text-property-render","table-text-property-render",-261105507),(function (block,opts){
return frontend.components.views.block_title(block,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(opts,new cljs.core.Keyword(null,"row","row",-570139521),row,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"property","property",-1114278232),property__$1,new cljs.core.Keyword(null,"width","width",-384071477),new cljs.core.Keyword(null,"width","width",-384071477).cljs$core$IFn$_invoke$arity$1(style),new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672),new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672).cljs$core$IFn$_invoke$arity$1(config)], 0)));
})], null));
});
} else {
return null;
}
}
})(),new cljs.core.Keyword(null,"get-value","get-value",2108514284),get_value,new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(property__$1)], null);
}
} else {
return null;
}
}),properties_SINGLEQUOTE_),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword("block","created-at","block/created-at",1440015),new cljs.core.Keyword(null,"name","name",1843675177),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("page","created-at","page/created-at",-84781299)], 0)),new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"datetime","datetime",494675702),new cljs.core.Keyword(null,"header","header",119441134),frontend.components.views.header_cp,new cljs.core.Keyword(null,"cell","cell",764245084),frontend.components.views.timestamp_cell_cp], null),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551),new cljs.core.Keyword(null,"name","name",1843675177),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("page","updated-at","page/updated-at",-1598282641)], 0)),new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"datetime","datetime",494675702),new cljs.core.Keyword(null,"header","header",119441134),frontend.components.views.header_cp,new cljs.core.Keyword(null,"cell","cell",764245084),frontend.components.views.timestamp_cell_cp], null)], null)], 0)));
}));

(frontend.components.views.build_columns.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.components.views.build_columns.cljs$lang$applyTo = (function (seq71149){
var G__71150 = cljs.core.first(seq71149);
var seq71149__$1 = cljs.core.next(seq71149);
var G__71151 = cljs.core.first(seq71149__$1);
var seq71149__$2 = cljs.core.next(seq71149__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__71150,G__71151,seq71149__$2);
}));

frontend.components.views.sort_columns = (function frontend$components$views$sort_columns(columns,ordered_column_ids){
if(cljs.core.seq(ordered_column_ids)){
var id__GT_columns = cljs.core.zipmap(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092),columns),columns);
var ordered_id_set = cljs.core.set(ordered_column_ids);
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (id){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(id__GT_columns,id);
}),ordered_column_ids),cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (column){
var G__71182 = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column);
return (ordered_id_set.cljs$core$IFn$_invoke$arity$1 ? ordered_id_set.cljs$core$IFn$_invoke$arity$1(G__71182) : ordered_id_set.call(null,G__71182));
}),columns));
} else {
return columns;
}
});
frontend.components.views.more_actions = rum.core.lazy_build(rum.core.build_defc,(function (view_entity,columns,p__71187,p__71188){
var map__71189 = p__71187;
var map__71189__$1 = cljs.core.__destructure_map(map__71189);
var column_visible_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71189__$1,new cljs.core.Keyword(null,"column-visible?","column-visible?",-864117722));
var rows = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71189__$1,new cljs.core.Keyword(null,"rows","rows",850049680));
var column_toggle_visibility = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71189__$1,new cljs.core.Keyword(null,"column-toggle-visibility","column-toggle-visibility",481480390));
var map__71190 = p__71188;
var map__71190__$1 = cljs.core.__destructure_map(map__71190);
var group_by_property_ident = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71190__$1,new cljs.core.Keyword(null,"group-by-property-ident","group-by-property-ident",1221613316));
var display_type = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property.view","type","logseq.property.view/type",218237607).cljs$core$IFn$_invoke$arity$1(view_entity));
var table_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(display_type,new cljs.core.Keyword("logseq.property.view","type.table","logseq.property.view/type.table",194254240));
var group_by_columns = cljs.core.concat.cljs$core$IFn$_invoke$arity$2((cljs.core.truth_((function (){var or__5002__auto__ = cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"linked-references","linked-references",-2117592379),null,new cljs.core.Keyword(null,"unlinked-references","unlinked-references",1918870007),null], null), null),new cljs.core.Keyword("logseq.property.view","feature-type","logseq.property.view/feature-type",-939141871).cljs$core$IFn$_invoke$arity$1(view_entity));
if(or__5002__auto__){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("logseq.property","query","logseq.property/query",-97414126).cljs$core$IFn$_invoke$arity$1(view_entity);
}
})())?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Keyword(null,"name","name",1843675177),"Block Page"], null)], null):null),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (column){
if(cljs.core.truth_(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column))){
var temp__5804__auto__ = (function (){var G__71193 = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__71193) : frontend.db.entity.call(null,G__71193));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var p = temp__5804__auto__;
return (((!(logseq.db.frontend.property.many_QMARK_(p)))) && (cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"date","date",-1463434462),null,new cljs.core.Keyword(null,"number","number",1570378438),null,new cljs.core.Keyword(null,"checkbox","checkbox",1612615655),null,new cljs.core.Keyword(null,"default","default",-1987822328),null,new cljs.core.Keyword(null,"node","node",581201198),null,new cljs.core.Keyword(null,"url","url",276297046),null], null), null),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(p))));
} else {
return null;
}
} else {
return null;
}
}),columns));
return daiquiri.interpreter.interpret((function (){var G__71233 = (function (){var G__71235 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"asChild","asChild",682531623),true], null);
var G__71236 = (function (){var G__71237 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"variant","variant",-424354234),"ghost",new cljs.core.Keyword(null,"class","class",-2030961996),"text-muted-foreground !px-1",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065)], null);
var G__71238 = frontend.ui.icon("dots",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(15)], null));
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__71237,G__71238) : logseq.shui.ui.button.call(null,G__71237,G__71238));
})();
return (logseq.shui.ui.dropdown_menu_trigger.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_trigger.cljs$core$IFn$_invoke$arity$2(G__71235,G__71236) : logseq.shui.ui.dropdown_menu_trigger.call(null,G__71235,G__71236));
})();
var G__71234 = (function (){var G__71239 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"align","align",1964212802),"end"], null);
var G__71240 = (function (){var G__71241 = ((table_QMARK_)?(function (){var G__71244 = (logseq.shui.ui.dropdown_menu_sub_trigger.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_sub_trigger.cljs$core$IFn$_invoke$arity$1("Columns visibility") : logseq.shui.ui.dropdown_menu_sub_trigger.call(null,"Columns visibility"));
var G__71245 = (function (){var G__71246 = (function (){var iter__5480__auto__ = (function frontend$components$views$iter__71247(s__71248){
return (new cljs.core.LazySeq(null,(function (){
var s__71248__$1 = s__71248;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__71248__$1);
if(temp__5804__auto__){
var s__71248__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__71248__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__71248__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__71250 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__71249 = (0);
while(true){
if((i__71249 < size__5479__auto__)){
var column = cljs.core._nth(c__5478__auto__,i__71249);
cljs.core.chunk_append(b__71250,(function (){var G__71251 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"key","key",-1516042587),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column)),new cljs.core.Keyword(null,"className","className",-1983287057),"capitalize",new cljs.core.Keyword(null,"checked","checked",-50955819),(column_visible_QMARK_.cljs$core$IFn$_invoke$arity$1 ? column_visible_QMARK_.cljs$core$IFn$_invoke$arity$1(column) : column_visible_QMARK_.call(null,column)),new cljs.core.Keyword(null,"onCheckedChange","onCheckedChange",842153815),((function (i__71249,column,c__5478__auto__,size__5479__auto__,b__71250,s__71248__$2,temp__5804__auto__,G__71244,G__71239,G__71233,display_type,table_QMARK_,group_by_columns,map__71189,map__71189__$1,column_visible_QMARK_,rows,column_toggle_visibility,map__71190,map__71190__$1,group_by_property_ident){
return (function (p1__71186_SHARP_){
return (column_toggle_visibility.cljs$core$IFn$_invoke$arity$2 ? column_toggle_visibility.cljs$core$IFn$_invoke$arity$2(column,p1__71186_SHARP_) : column_toggle_visibility.call(null,column,p1__71186_SHARP_));
});})(i__71249,column,c__5478__auto__,size__5479__auto__,b__71250,s__71248__$2,temp__5804__auto__,G__71244,G__71239,G__71233,display_type,table_QMARK_,group_by_columns,map__71189,map__71189__$1,column_visible_QMARK_,rows,column_toggle_visibility,map__71190,map__71190__$1,group_by_property_ident))
,new cljs.core.Keyword(null,"onSelect","onSelect",251862405),((function (i__71249,column,c__5478__auto__,size__5479__auto__,b__71250,s__71248__$2,temp__5804__auto__,G__71244,G__71239,G__71233,display_type,table_QMARK_,group_by_columns,map__71189,map__71189__$1,column_visible_QMARK_,rows,column_toggle_visibility,map__71190,map__71190__$1,group_by_property_ident){
return (function (e){
return e.preventDefault();
});})(i__71249,column,c__5478__auto__,size__5479__auto__,b__71250,s__71248__$2,temp__5804__auto__,G__71244,G__71239,G__71233,display_type,table_QMARK_,group_by_columns,map__71189,map__71189__$1,column_visible_QMARK_,rows,column_toggle_visibility,map__71190,map__71190__$1,group_by_property_ident))
], null);
var G__71252 = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(column);
return (logseq.shui.ui.dropdown_menu_checkbox_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_checkbox_item.cljs$core$IFn$_invoke$arity$2(G__71251,G__71252) : logseq.shui.ui.dropdown_menu_checkbox_item.call(null,G__71251,G__71252));
})());

var G__73095 = (i__71249 + (1));
i__71249 = G__73095;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__71250),frontend$components$views$iter__71247(cljs.core.chunk_rest(s__71248__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__71250),null);
}
} else {
var column = cljs.core.first(s__71248__$2);
return cljs.core.cons((function (){var G__71253 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"key","key",-1516042587),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column)),new cljs.core.Keyword(null,"className","className",-1983287057),"capitalize",new cljs.core.Keyword(null,"checked","checked",-50955819),(column_visible_QMARK_.cljs$core$IFn$_invoke$arity$1 ? column_visible_QMARK_.cljs$core$IFn$_invoke$arity$1(column) : column_visible_QMARK_.call(null,column)),new cljs.core.Keyword(null,"onCheckedChange","onCheckedChange",842153815),((function (column,s__71248__$2,temp__5804__auto__,G__71244,G__71239,G__71233,display_type,table_QMARK_,group_by_columns,map__71189,map__71189__$1,column_visible_QMARK_,rows,column_toggle_visibility,map__71190,map__71190__$1,group_by_property_ident){
return (function (p1__71186_SHARP_){
return (column_toggle_visibility.cljs$core$IFn$_invoke$arity$2 ? column_toggle_visibility.cljs$core$IFn$_invoke$arity$2(column,p1__71186_SHARP_) : column_toggle_visibility.call(null,column,p1__71186_SHARP_));
});})(column,s__71248__$2,temp__5804__auto__,G__71244,G__71239,G__71233,display_type,table_QMARK_,group_by_columns,map__71189,map__71189__$1,column_visible_QMARK_,rows,column_toggle_visibility,map__71190,map__71190__$1,group_by_property_ident))
,new cljs.core.Keyword(null,"onSelect","onSelect",251862405),((function (column,s__71248__$2,temp__5804__auto__,G__71244,G__71239,G__71233,display_type,table_QMARK_,group_by_columns,map__71189,map__71189__$1,column_visible_QMARK_,rows,column_toggle_visibility,map__71190,map__71190__$1,group_by_property_ident){
return (function (e){
return e.preventDefault();
});})(column,s__71248__$2,temp__5804__auto__,G__71244,G__71239,G__71233,display_type,table_QMARK_,group_by_columns,map__71189,map__71189__$1,column_visible_QMARK_,rows,column_toggle_visibility,map__71190,map__71190__$1,group_by_property_ident))
], null);
var G__71254 = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(column);
return (logseq.shui.ui.dropdown_menu_checkbox_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_checkbox_item.cljs$core$IFn$_invoke$arity$2(G__71253,G__71254) : logseq.shui.ui.dropdown_menu_checkbox_item.call(null,G__71253,G__71254));
})(),frontend$components$views$iter__71247(cljs.core.rest(s__71248__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__71185_SHARP_){
var or__5002__auto__ = new cljs.core.Keyword(null,"column-list?","column-list?",-538229318).cljs$core$IFn$_invoke$arity$1(p1__71185_SHARP_) === false;
if(or__5002__auto__){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"disable-hide?","disable-hide?",-1203602151).cljs$core$IFn$_invoke$arity$1(p1__71185_SHARP_);
}
}),columns));
})();
return (logseq.shui.ui.dropdown_menu_sub_content.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_sub_content.cljs$core$IFn$_invoke$arity$1(G__71246) : logseq.shui.ui.dropdown_menu_sub_content.call(null,G__71246));
})();
return (logseq.shui.ui.dropdown_menu_sub.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_sub.cljs$core$IFn$_invoke$arity$2(G__71244,G__71245) : logseq.shui.ui.dropdown_menu_sub.call(null,G__71244,G__71245));
})():null);
var G__71242 = ((cljs.core.seq(group_by_columns))?(function (){var G__71255 = (logseq.shui.ui.dropdown_menu_sub_trigger.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_sub_trigger.cljs$core$IFn$_invoke$arity$1("Group by") : logseq.shui.ui.dropdown_menu_sub_trigger.call(null,"Group by"));
var G__71256 = (function (){var G__71257 = (function (){var iter__5480__auto__ = (function frontend$components$views$iter__71258(s__71259){
return (new cljs.core.LazySeq(null,(function (){
var s__71259__$1 = s__71259;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__71259__$1);
if(temp__5804__auto__){
var s__71259__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__71259__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__71259__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__71261 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__71260 = (0);
while(true){
if((i__71260 < size__5479__auto__)){
var column = cljs.core._nth(c__5478__auto__,i__71260);
cljs.core.chunk_append(b__71261,(function (){var G__71262 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"key","key",-1516042587),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column)),new cljs.core.Keyword(null,"className","className",-1983287057),"capitalize",new cljs.core.Keyword(null,"checked","checked",-50955819),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column),group_by_property_ident),new cljs.core.Keyword(null,"onCheckedChange","onCheckedChange",842153815),((function (i__71260,column,c__5478__auto__,size__5479__auto__,b__71261,s__71259__$2,temp__5804__auto__,G__71255,G__71241,G__71239,G__71233,display_type,table_QMARK_,group_by_columns,map__71189,map__71189__$1,column_visible_QMARK_,rows,column_toggle_visibility,map__71190,map__71190__$1,group_by_property_ident){
return (function (result){
if(cljs.core.truth_(result)){
return frontend.handler.db_based.property.set_block_property_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_entity),new cljs.core.Keyword("logseq.property.view","group-by-property","logseq.property.view/group-by-property",809216236),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((function (){var G__71268 = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__71268) : frontend.db.entity.call(null,G__71268));
})()));
} else {
return frontend.handler.db_based.property.remove_block_property_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_entity),new cljs.core.Keyword("logseq.property.view","group-by-property","logseq.property.view/group-by-property",809216236));
}
});})(i__71260,column,c__5478__auto__,size__5479__auto__,b__71261,s__71259__$2,temp__5804__auto__,G__71255,G__71241,G__71239,G__71233,display_type,table_QMARK_,group_by_columns,map__71189,map__71189__$1,column_visible_QMARK_,rows,column_toggle_visibility,map__71190,map__71190__$1,group_by_property_ident))
,new cljs.core.Keyword(null,"onSelect","onSelect",251862405),((function (i__71260,column,c__5478__auto__,size__5479__auto__,b__71261,s__71259__$2,temp__5804__auto__,G__71255,G__71241,G__71239,G__71233,display_type,table_QMARK_,group_by_columns,map__71189,map__71189__$1,column_visible_QMARK_,rows,column_toggle_visibility,map__71190,map__71190__$1,group_by_property_ident){
return (function (e){
return e.preventDefault();
});})(i__71260,column,c__5478__auto__,size__5479__auto__,b__71261,s__71259__$2,temp__5804__auto__,G__71255,G__71241,G__71239,G__71233,display_type,table_QMARK_,group_by_columns,map__71189,map__71189__$1,column_visible_QMARK_,rows,column_toggle_visibility,map__71190,map__71190__$1,group_by_property_ident))
], null);
var G__71263 = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(column);
return (logseq.shui.ui.dropdown_menu_checkbox_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_checkbox_item.cljs$core$IFn$_invoke$arity$2(G__71262,G__71263) : logseq.shui.ui.dropdown_menu_checkbox_item.call(null,G__71262,G__71263));
})());

var G__73096 = (i__71260 + (1));
i__71260 = G__73096;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__71261),frontend$components$views$iter__71258(cljs.core.chunk_rest(s__71259__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__71261),null);
}
} else {
var column = cljs.core.first(s__71259__$2);
return cljs.core.cons((function (){var G__71271 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"key","key",-1516042587),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column)),new cljs.core.Keyword(null,"className","className",-1983287057),"capitalize",new cljs.core.Keyword(null,"checked","checked",-50955819),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column),group_by_property_ident),new cljs.core.Keyword(null,"onCheckedChange","onCheckedChange",842153815),((function (column,s__71259__$2,temp__5804__auto__,G__71255,G__71241,G__71239,G__71233,display_type,table_QMARK_,group_by_columns,map__71189,map__71189__$1,column_visible_QMARK_,rows,column_toggle_visibility,map__71190,map__71190__$1,group_by_property_ident){
return (function (result){
if(cljs.core.truth_(result)){
return frontend.handler.db_based.property.set_block_property_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_entity),new cljs.core.Keyword("logseq.property.view","group-by-property","logseq.property.view/group-by-property",809216236),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((function (){var G__71274 = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__71274) : frontend.db.entity.call(null,G__71274));
})()));
} else {
return frontend.handler.db_based.property.remove_block_property_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_entity),new cljs.core.Keyword("logseq.property.view","group-by-property","logseq.property.view/group-by-property",809216236));
}
});})(column,s__71259__$2,temp__5804__auto__,G__71255,G__71241,G__71239,G__71233,display_type,table_QMARK_,group_by_columns,map__71189,map__71189__$1,column_visible_QMARK_,rows,column_toggle_visibility,map__71190,map__71190__$1,group_by_property_ident))
,new cljs.core.Keyword(null,"onSelect","onSelect",251862405),((function (column,s__71259__$2,temp__5804__auto__,G__71255,G__71241,G__71239,G__71233,display_type,table_QMARK_,group_by_columns,map__71189,map__71189__$1,column_visible_QMARK_,rows,column_toggle_visibility,map__71190,map__71190__$1,group_by_property_ident){
return (function (e){
return e.preventDefault();
});})(column,s__71259__$2,temp__5804__auto__,G__71255,G__71241,G__71239,G__71233,display_type,table_QMARK_,group_by_columns,map__71189,map__71189__$1,column_visible_QMARK_,rows,column_toggle_visibility,map__71190,map__71190__$1,group_by_property_ident))
], null);
var G__71272 = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(column);
return (logseq.shui.ui.dropdown_menu_checkbox_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_checkbox_item.cljs$core$IFn$_invoke$arity$2(G__71271,G__71272) : logseq.shui.ui.dropdown_menu_checkbox_item.call(null,G__71271,G__71272));
})(),frontend$components$views$iter__71258(cljs.core.rest(s__71259__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(group_by_columns);
})();
return (logseq.shui.ui.dropdown_menu_sub_content.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_sub_content.cljs$core$IFn$_invoke$arity$1(G__71257) : logseq.shui.ui.dropdown_menu_sub_content.call(null,G__71257));
})();
return (logseq.shui.ui.dropdown_menu_sub.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_sub.cljs$core$IFn$_invoke$arity$2(G__71255,G__71256) : logseq.shui.ui.dropdown_menu_sub.call(null,G__71255,G__71256));
})():null);
var G__71243 = (function (){var G__71276 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"export-edn",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.db_based.export$.export_view_nodes_data(rows);
})], null);
var G__71277 = "Export EDN";
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__71276,G__71277) : logseq.shui.ui.dropdown_menu_item.call(null,G__71276,G__71277));
})();
return (logseq.shui.ui.dropdown_menu_group.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_group.cljs$core$IFn$_invoke$arity$3(G__71241,G__71242,G__71243) : logseq.shui.ui.dropdown_menu_group.call(null,G__71241,G__71242,G__71243));
})();
return (logseq.shui.ui.dropdown_menu_content.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_content.cljs$core$IFn$_invoke$arity$2(G__71239,G__71240) : logseq.shui.ui.dropdown_menu_content.call(null,G__71239,G__71240));
})();
return (logseq.shui.ui.dropdown_menu.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu.cljs$core$IFn$_invoke$arity$2(G__71233,G__71234) : logseq.shui.ui.dropdown_menu.call(null,G__71233,G__71234));
})());
}),null,"frontend.components.views/more-actions");
frontend.components.views.get_column_size = (function frontend$components$views$get_column_size(column,sized_columns){
var id = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column);
var size = cljs.core.get.cljs$core$IFn$_invoke$arity$2(sized_columns,id);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(id,new cljs.core.Keyword(null,"id","id",-1388402092))){
return (48);
} else {
if(typeof size === 'number'){
return size;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(id,new cljs.core.Keyword("logseq.property","query","logseq.property/query",-97414126))){
return (400);
} else {
var G__71282 = id;
var G__71282__$1 = (((G__71282 instanceof cljs.core.Keyword))?G__71282.fqn:null);
switch (G__71282__$1) {
case "select":
return (32);

break;
case "add-property":
return (160);

break;
case "block/title":
case "block/name":
return (360);

break;
case "block/created-at":
case "block/updated-at":
return (160);

break;
default:
return (180);

}

}
}
}
});
frontend.components.views.add_property_button = rum.core.lazy_build(rum.core.build_defc,(function (){
var attrs71295 = (function (){var G__71296 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"variant","variant",-424354234),"text",new cljs.core.Keyword(null,"class","class",-2030961996),"h-8 !pl-4 !px-2 !py-0 hover:text-foreground w-full justify-start"], null);
var G__71297 = frontend.ui.icon("plus");
var G__71298 = "New property";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3(G__71296,G__71297,G__71298) : logseq.shui.ui.button.call(null,G__71296,G__71297,G__71298));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs71295))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ls-table-header-cell","!border-0"], null)], null),attrs71295], 0))):{'className':"ls-table-header-cell !border-0"}),((cljs.core.map_QMARK_(attrs71295))?null:[daiquiri.interpreter.interpret(attrs71295)]));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.views/add-property-button");
frontend.components.views.action_bar = rum.core.lazy_build(rum.core.build_defc,(function (table,selected_rows,p__71299){
var map__71300 = p__71299;
var map__71300__$1 = cljs.core.__destructure_map(map__71300);
var on_delete_rows = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71300__$1,new cljs.core.Keyword(null,"on-delete-rows","on-delete-rows",464374868));
return daiquiri.interpreter.interpret(logseq.shui.ui.table_actions(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.count(selected_rows))," selected"].join('')], null),frontend.components.selection.action_bar(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"on-cut","on-cut",-1019124687),(function (){
return (on_delete_rows.cljs$core$IFn$_invoke$arity$2 ? on_delete_rows.cljs$core$IFn$_invoke$arity$2(table,selected_rows) : on_delete_rows.call(null,table,selected_rows));
}),new cljs.core.Keyword(null,"selected-blocks","selected-blocks",-96882948),selected_rows,new cljs.core.Keyword(null,"hide-dots?","hide-dots?",-901521952),true,new cljs.core.Keyword(null,"button-border?","button-border?",-2028710343),true], null))));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.views/action-bar");
frontend.components.views.column_resizer = rum.core.lazy_build(rum.core.build_defc,(function (_column,on_sized_BANG_){
var _STAR_el = rum.core.use_ref(null);
var vec__71305 = rum.core.use_state(null);
var dx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71305,(0),null);
var set_dx_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71305,(1),null);
var vec__71308 = rum.core.use_state(null);
var width = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71308,(0),null);
var set_width_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71308,(1),null);
var add_resizing_class = (function (){
return dommy.core.add_class_BANG_.cljs$core$IFn$_invoke$arity$2(document.documentElement,"is-resizing-buf");
});
var remove_resizing_class = (function (){
return dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$2(document.documentElement,"is-resizing-buf");
});
logseq.shui.hooks.use_effect_BANG_((function (){
if(typeof dx === 'number'){
var G__71313 = rum.core.deref(_STAR_el);
if((G__71313 == null)){
return null;
} else {
return dommy.core.set_style_BANG_.cljs$core$IFn$_invoke$arity$variadic(G__71313,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"transform","transform",1381301764),["translate3D(",cljs.core.str.cljs$core$IFn$_invoke$arity$1(dx),"px , 0, 0)"].join('')], 0));
}
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [dx], null));

logseq.shui.hooks.use_effect_BANG_((function (){
var temp__5804__auto__ = (function (){var and__5000__auto__ = cljs.core.fn_QMARK_(window.interact);
if(and__5000__auto__){
return rum.core.deref(_STAR_el);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var el = temp__5804__auto__;
var _STAR_field_rect = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
var min_width = (40);
var max_width = (500);
return interact(el).draggable(cljs_bean.core.__GT_js(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"listeners","listeners",394544445),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"start","start",-355208981),(function (){
var map__71317 = cljs_bean.core.__GT_clj(el.closest(".ls-table-header-cell").getBoundingClientRect().toJSON());
var map__71317__$1 = cljs.core.__destructure_map(map__71317);
var rect = map__71317__$1;
var width__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71317__$1,new cljs.core.Keyword(null,"width","width",-384071477));
var right = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71317__$1,new cljs.core.Keyword(null,"right","right",-452581833));
var left_dx = (((width__$1 >= min_width))?(min_width - width__$1):(0));
var right_dx = (((width__$1 <= max_width))?(max_width - width__$1):(0));
cljs.core.reset_BANG_(_STAR_field_rect,rect);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(_STAR_field_rect,cljs.core.assoc,new cljs.core.Keyword(null,"left-dx","left-dx",-1775595870),left_dx,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"right-dx","right-dx",531815659),right_dx,new cljs.core.Keyword(null,"left-b","left-b",-1716414262),((left_dx + right) + (1)),new cljs.core.Keyword(null,"right-b","right-b",33784407),((right_dx + right) + (1))], 0));

return dommy.core.add_class_BANG_.cljs$core$IFn$_invoke$arity$2(el,"is-active");
}),new cljs.core.Keyword(null,"move","move",-2110884309),(function (e){
var dx__$1 = e.dx;
var pointer_x = Math.floor(e.clientX);
var map__71318 = cljs.core.deref(_STAR_field_rect);
var map__71318__$1 = cljs.core.__destructure_map(map__71318);
var left_b = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71318__$1,new cljs.core.Keyword(null,"left-b","left-b",-1716414262));
var right_b = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71318__$1,new cljs.core.Keyword(null,"right-b","right-b",33784407));
var left_b__$1 = Math.floor(left_b);
var right_b__$1 = Math.floor(right_b);
if((((pointer_x > left_b__$1)) && ((pointer_x < right_b__$1)))){
var G__71319 = (function (dx_SINGLEQUOTE_){
if(cljs.core.contains_QMARK_(cljs.core.PersistentHashSet.createAsIfByAssoc([min_width,max_width]),cljs.core.abs(dx_SINGLEQUOTE_))){
return dx_SINGLEQUOTE_;
} else {
var to_dx = ((function (){var or__5002__auto__ = dx_SINGLEQUOTE_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})() + dx__$1);
var map__71320 = cljs.core.deref(_STAR_field_rect);
var map__71320__$1 = cljs.core.__destructure_map(map__71320);
var left_dx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71320__$1,new cljs.core.Keyword(null,"left-dx","left-dx",-1775595870));
var right_dx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71320__$1,new cljs.core.Keyword(null,"right-dx","right-dx",531815659));
if((to_dx < (0))){
if((cljs.core.abs(left_dx) > cljs.core.abs(to_dx))){
return to_dx;
} else {
return left_dx;
}
} else {
if((to_dx > (0))){
if((right_dx > to_dx)){
return to_dx;
} else {
return right_dx;
}
} else {
return null;
}
}
}
});
return (set_dx_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_dx_BANG_.cljs$core$IFn$_invoke$arity$1(G__71319) : set_dx_BANG_.call(null,G__71319));
} else {
return null;
}
}),new cljs.core.Keyword(null,"end","end",-268185958),(function (){
var G__71325 = (function (dx__$1){
var w_73098 = Math.round((dx__$1 + new cljs.core.Keyword(null,"width","width",-384071477).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(_STAR_field_rect))));
var G__71326_73099 = (((w_73098 < min_width))?min_width:(((w_73098 > max_width))?max_width:w_73098
));
(set_width_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_width_BANG_.cljs$core$IFn$_invoke$arity$1(G__71326_73099) : set_width_BANG_.call(null,G__71326_73099));

cljs.core.reset_BANG_(_STAR_field_rect,null);

dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$2(el,"is-active");

return (0);
});
return (set_dx_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_dx_BANG_.cljs$core$IFn$_invoke$arity$1(G__71325) : set_dx_BANG_.call(null,G__71325));
})], null)], null))).styleCursor(false).on("dragstart",add_resizing_class).on("dragend",remove_resizing_class).on("mousedown",frontend.util.stop_propagation);
} else {
return null;
}
}),cljs.core.PersistentVector.EMPTY);

logseq.shui.hooks.use_effect_BANG_((function (){
if(typeof width === 'number'){
return (on_sized_BANG_.cljs$core$IFn$_invoke$arity$1 ? on_sized_BANG_.cljs$core$IFn$_invoke$arity$1(width) : on_sized_BANG_.call(null,width));
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [width], null));

return daiquiri.core.create_element("a",{'data-no-dnd':true,'ref':_STAR_el,'className':"ls-table-resize-handle"},[]);
}),null,"frontend.components.views/column-resizer");
frontend.components.views.table_header_cell = (function frontend$components$views$table_header_cell(table,column){
var header_fn = new cljs.core.Keyword(null,"header","header",119441134).cljs$core$IFn$_invoke$arity$1(column);
var sized_columns = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(table,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"state","state",-1988618099),new cljs.core.Keyword(null,"sized-columns","sized-columns",-224617731)], null));
var set_sized_columns_BANG_ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(table,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"data-fns","data-fns",-1065218324),new cljs.core.Keyword(null,"set-sized-columns!","set-sized-columns!",899502581)], null));
var width = frontend.components.views.get_column_size(column,sized_columns);
var select_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"select","select",1147833503),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column));
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.ls-table-header-cell","div.ls-table-header-cell",-452577868),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"width","width",-384071477),width,new cljs.core.Keyword(null,"min-width","min-width",1926193728),width], null),new cljs.core.Keyword(null,"class","class",-2030961996),((select_QMARK_)?"!border-0":null)], null),((cljs.core.fn_QMARK_(header_fn))?(header_fn.cljs$core$IFn$_invoke$arity$2 ? header_fn.cljs$core$IFn$_invoke$arity$2(table,column) : header_fn.call(null,table,column)):header_fn),((new cljs.core.Keyword(null,"resizable?","resizable?",20635134).cljs$core$IFn$_invoke$arity$1(column) === false)?null:frontend.components.views.column_resizer(column,(function (size){
var G__71335 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(sized_columns,new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column),size);
return (set_sized_columns_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_sized_columns_BANG_.cljs$core$IFn$_invoke$arity$1(G__71335) : set_sized_columns_BANG_.call(null,G__71335));
})))], null);
});
frontend.components.views.on_delete_rows = (function frontend$components$views$on_delete_rows(view_parent,view_feature_type,table,selected_ids){
var selected_rows = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160),cljs.core.map.cljs$core$IFn$_invoke$arity$2(frontend.db.entity,selected_ids));
var pages = cljs.core.filter.cljs$core$IFn$_invoke$arity$2(logseq.db.page_QMARK_,selected_rows);
var blocks = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(logseq.db.page_QMARK_,selected_rows);
var page_ids = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),pages);
var map__71337 = new cljs.core.Keyword(null,"data-fns","data-fns",-1065218324).cljs$core$IFn$_invoke$arity$1(table);
var map__71337__$1 = cljs.core.__destructure_map(map__71337);
var set_data_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71337__$1,new cljs.core.Keyword(null,"set-data!","set-data!",150955183));
var set_row_selection_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71337__$1,new cljs.core.Keyword(null,"set-row-selection!","set-row-selection!",1872995139));
var update_table_state_BANG_ = (function (){
var data = new cljs.core.Keyword(null,"full-data","full-data",-1430830367).cljs$core$IFn$_invoke$arity$1(table);
var selected_ids__$1 = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),selected_rows));
var new_data = ((cljs.core.every_QMARK_(cljs.core.number_QMARK_,data))?cljs.core.remove.cljs$core$IFn$_invoke$arity$2(selected_ids__$1,data):cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__71342){
var vec__71343 = p__71342;
var by_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71343,(0),null);
var col = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71343,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [by_value,cljs.core.remove.cljs$core$IFn$_invoke$arity$2(selected_ids__$1,col)], null);
}),data));
(set_data_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_data_BANG_.cljs$core$IFn$_invoke$arity$1(new_data) : set_data_BANG_.call(null,new_data));

var G__71346 = cljs.core.PersistentArrayMap.EMPTY;
return (set_row_selection_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_row_selection_BANG_.cljs$core$IFn$_invoke$arity$1(G__71346) : set_row_selection_BANG_.call(null,G__71346));
});
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var test_QMARK___60293__auto__ = frontend.util.node_test_QMARK_;
var ops__60294__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__60295__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__60295__auto__);

if(cljs.core.truth_(ops__60294__auto__)){
if(cljs.core.seq(blocks)){
frontend.modules.outliner.op.delete_blocks_BANG_(blocks,null);
} else {
}

var G__71347 = view_feature_type;
var G__71347__$1 = (((G__71347 instanceof cljs.core.Keyword))?G__71347.fqn:null);
switch (G__71347__$1) {
case "class-objects":
if(cljs.core.seq(page_ids)){
var tx_data = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (pid){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),pid,new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_parent)], null);
}),page_ids);
if(cljs.core.seq(tx_data)){
return frontend.modules.outliner.op.transact_BANG_(tx_data,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null));
} else {
return null;
}
} else {
return null;
}

break;
case "property-objects":
if(cljs.core.truth_(new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160).cljs$core$IFn$_invoke$arity$1(view_parent))){
return null;
} else {
var tx_data = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (pid){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),pid,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(view_parent)], null);
}),page_ids);
if(cljs.core.seq(tx_data)){
return frontend.modules.outliner.op.transact_BANG_(tx_data,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null));
} else {
return null;
}
}

break;
case "query-result":
var seq__71348 = cljs.core.seq(pages);
var chunk__71349 = null;
var count__71350 = (0);
var i__71351 = (0);
while(true){
if((i__71351 < count__71350)){
var page = chunk__71349.cljs$core$IIndexed$_nth$arity$2(null,i__71351);
var temp__5804__auto___73112 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page);
if(cljs.core.truth_(temp__5804__auto___73112)){
var id_73113 = temp__5804__auto___73112;
frontend.modules.outliner.op.delete_page_BANG_(id_73113);
} else {
}


var G__73114 = seq__71348;
var G__73115 = chunk__71349;
var G__73116 = count__71350;
var G__73117 = (i__71351 + (1));
seq__71348 = G__73114;
chunk__71349 = G__73115;
count__71350 = G__73116;
i__71351 = G__73117;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__71348);
if(temp__5804__auto__){
var seq__71348__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__71348__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__71348__$1);
var G__73118 = cljs.core.chunk_rest(seq__71348__$1);
var G__73119 = c__5525__auto__;
var G__73120 = cljs.core.count(c__5525__auto__);
var G__73121 = (0);
seq__71348 = G__73118;
chunk__71349 = G__73119;
count__71350 = G__73120;
i__71351 = G__73121;
continue;
} else {
var page = cljs.core.first(seq__71348__$1);
var temp__5804__auto___73122__$1 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page);
if(cljs.core.truth_(temp__5804__auto___73122__$1)){
var id_73123 = temp__5804__auto___73122__$1;
frontend.modules.outliner.op.delete_page_BANG_(id_73123);
} else {
}


var G__73124 = cljs.core.next(seq__71348__$1);
var G__73125 = null;
var G__73126 = (0);
var G__73127 = (0);
seq__71348 = G__73124;
chunk__71349 = G__73125;
count__71350 = G__73126;
i__71351 = G__73127;
continue;
}
} else {
return null;
}
}
break;
}

break;
case "all-pages":
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("page","show-delete-dialog","page/show-delete-dialog",1559514803),selected_rows,update_table_state_BANG_], null));

break;
default:
return null;

}
} else {
var _STAR_outliner_ops_STAR__orig_val__71352 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__71353 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__71353);

try{if(cljs.core.seq(blocks)){
frontend.modules.outliner.op.delete_blocks_BANG_(blocks,null);
} else {
}

var G__71354_73128 = view_feature_type;
var G__71354_73129__$1 = (((G__71354_73128 instanceof cljs.core.Keyword))?G__71354_73128.fqn:null);
switch (G__71354_73129__$1) {
case "class-objects":
if(cljs.core.seq(page_ids)){
var tx_data_73131 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (pid){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),pid,new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_parent)], null);
}),page_ids);
if(cljs.core.seq(tx_data_73131)){
frontend.modules.outliner.op.transact_BANG_(tx_data_73131,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null));
} else {
}
} else {
}

break;
case "property-objects":
if(cljs.core.truth_(new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160).cljs$core$IFn$_invoke$arity$1(view_parent))){
} else {
var tx_data_73132 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (pid){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),pid,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(view_parent)], null);
}),page_ids);
if(cljs.core.seq(tx_data_73132)){
frontend.modules.outliner.op.transact_BANG_(tx_data_73132,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null));
} else {
}
}

break;
case "query-result":
var seq__71355_73133 = cljs.core.seq(pages);
var chunk__71356_73134 = null;
var count__71357_73135 = (0);
var i__71358_73136 = (0);
while(true){
if((i__71358_73136 < count__71357_73135)){
var page_73137 = chunk__71356_73134.cljs$core$IIndexed$_nth$arity$2(null,i__71358_73136);
var temp__5804__auto___73138 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page_73137);
if(cljs.core.truth_(temp__5804__auto___73138)){
var id_73139 = temp__5804__auto___73138;
frontend.modules.outliner.op.delete_page_BANG_(id_73139);
} else {
}


var G__73140 = seq__71355_73133;
var G__73141 = chunk__71356_73134;
var G__73142 = count__71357_73135;
var G__73143 = (i__71358_73136 + (1));
seq__71355_73133 = G__73140;
chunk__71356_73134 = G__73141;
count__71357_73135 = G__73142;
i__71358_73136 = G__73143;
continue;
} else {
var temp__5804__auto___73144 = cljs.core.seq(seq__71355_73133);
if(temp__5804__auto___73144){
var seq__71355_73145__$1 = temp__5804__auto___73144;
if(cljs.core.chunked_seq_QMARK_(seq__71355_73145__$1)){
var c__5525__auto___73146 = cljs.core.chunk_first(seq__71355_73145__$1);
var G__73147 = cljs.core.chunk_rest(seq__71355_73145__$1);
var G__73148 = c__5525__auto___73146;
var G__73149 = cljs.core.count(c__5525__auto___73146);
var G__73150 = (0);
seq__71355_73133 = G__73147;
chunk__71356_73134 = G__73148;
count__71357_73135 = G__73149;
i__71358_73136 = G__73150;
continue;
} else {
var page_73151 = cljs.core.first(seq__71355_73145__$1);
var temp__5804__auto___73152__$1 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page_73151);
if(cljs.core.truth_(temp__5804__auto___73152__$1)){
var id_73153 = temp__5804__auto___73152__$1;
frontend.modules.outliner.op.delete_page_BANG_(id_73153);
} else {
}


var G__73154 = cljs.core.next(seq__71355_73145__$1);
var G__73155 = null;
var G__73156 = (0);
var G__73157 = (0);
seq__71355_73133 = G__73154;
chunk__71356_73134 = G__73155;
count__71357_73135 = G__73156;
i__71358_73136 = G__73157;
continue;
}
} else {
}
}
break;
}

break;
case "all-pages":
frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("page","show-delete-dialog","page/show-delete-dialog",1559514803),selected_rows,update_table_state_BANG_], null));

break;
default:

}

var r__60296__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___60293__auto__){
if(cljs.core.seq(r__60296__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__60296__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"delete-blocks","delete-blocks",-1868631596)], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__60296__auto__)){
var request_id__60297__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__60298__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__60296__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"delete-blocks","delete-blocks",-1868631596)], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__60297__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__60299__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__60297__auto__,request__60298__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__60297__auto__,request__60298__auto__));
return response__60299__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__71352);
}}
})()),(function (___40947__auto__){
return promesa.protocols._promise((cljs.core.truth_((function (){var or__5002__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(view_feature_type,new cljs.core.Keyword(null,"all-pages","all-pages",1017563062));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(view_feature_type,new cljs.core.Keyword(null,"property-objects","property-objects",-1410914822));
if(and__5000__auto__){
return new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160).cljs$core$IFn$_invoke$arity$1(view_parent);
} else {
return and__5000__auto__;
}
}
})())?null:update_table_state_BANG_()));
}));
}));
});
frontend.components.views.table_header = (function frontend$components$views$table_header(table,p__71359,selected_rows){
var map__71360 = p__71359;
var map__71360__$1 = cljs.core.__destructure_map(map__71360);
var option = map__71360__$1;
var show_add_property_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71360__$1,new cljs.core.Keyword(null,"show-add-property?","show-add-property?",2062685338));
var add_property_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71360__$1,new cljs.core.Keyword(null,"add-property!","add-property!",1318392926));
var view_parent = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71360__$1,new cljs.core.Keyword(null,"view-parent","view-parent",675596601));
var view_feature_type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71360__$1,new cljs.core.Keyword(null,"view-feature-type","view-feature-type",-945869610));
var set_ordered_columns_BANG_ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(table,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"data-fns","data-fns",-1065218324),new cljs.core.Keyword(null,"set-ordered-columns!","set-ordered-columns!",-315299263)], null));
var pinned = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(table,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"state","state",-1988618099),new cljs.core.Keyword(null,"pinned-columns","pinned-columns",-1218428870)], null));
var unpinned = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(table,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"state","state",-1988618099),new cljs.core.Keyword(null,"unpinned-columns","unpinned-columns",1124489041)], null));
var build_item = (function (column){
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(column),new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column),new cljs.core.Keyword(null,"content","content",15833224),frontend.components.views.table_header_cell(table,column),new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column),new cljs.core.Keyword(null,"select","select",1147833503))], null);
});
var pinned_items = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(build_item,pinned);
var unpinned_items = (cljs.core.truth_(show_add_property_QMARK_)?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(build_item,unpinned),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"id","id",-1388402092),"add property",new cljs.core.Keyword(null,"prop","prop",-515168332),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"width","width",-384071477),"-webkit-fill-available",new cljs.core.Keyword(null,"min-width","min-width",1926193728),(160)], null),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
if(cljs.core.fn_QMARK_(add_property_BANG_)){
return (add_property_BANG_.cljs$core$IFn$_invoke$arity$1 ? add_property_BANG_.cljs$core$IFn$_invoke$arity$1(e) : add_property_BANG_.call(null,e));
} else {
return null;
}
})], null),new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword(null,"add-new-property","add-new-property",1119839373),new cljs.core.Keyword(null,"content","content",15833224),frontend.components.views.add_property_button(),new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181),true], null)):cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(build_item,unpinned));
var selection_rows_count = cljs.core.count(selected_rows);
return logseq.shui.ui.table_header(((cljs.core.seq(pinned_items))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.sticky-columns.flex.flex-row","div.sticky-columns.flex.flex-row",-2049518578),frontend.components.dnd.items(pinned_items,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"vertical?","vertical?",-1522630444),false,new cljs.core.Keyword(null,"on-drag-end","on-drag-end",520272671),(function (ordered_columns,_m){
return (set_ordered_columns_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_ordered_columns_BANG_.cljs$core$IFn$_invoke$arity$1(ordered_columns) : set_ordered_columns_BANG_.call(null,ordered_columns));
})], null))], null):null),((cljs.core.seq(unpinned_items))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row","div.flex.flex-row",209103675),frontend.components.dnd.items(unpinned_items,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"vertical?","vertical?",-1522630444),false,new cljs.core.Keyword(null,"on-drag-end","on-drag-end",520272671),(function (ordered_columns,_m){
return (set_ordered_columns_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_ordered_columns_BANG_.cljs$core$IFn$_invoke$arity$1(ordered_columns) : set_ordered_columns_BANG_.call(null,ordered_columns));
})], null))], null):null),(((selection_rows_count > (0)))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.table-action-bar.absolute.top-0.left-8","div.table-action-bar.absolute.top-0.left-8",966161012),frontend.components.views.action_bar(table,selected_rows,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(option,new cljs.core.Keyword(null,"on-delete-rows","on-delete-rows",464374868),(function (table__$1,selected_ids){
return frontend.components.views.on_delete_rows(view_parent,view_feature_type,table__$1,selected_ids);
})))], null):null));
});
frontend.components.views.lazy_table_cell = rum.core.lazy_build(rum.core.build_defc,(function (cell_render_f,cell_placeholder){
var state = (function (){var G__71361 = ({"rootMargin": "0px"});
return (frontend.ui.useInView.cljs$core$IFn$_invoke$arity$1 ? frontend.ui.useInView.cljs$core$IFn$_invoke$arity$1(G__71361) : frontend.ui.useInView.call(null,G__71361));
})();
var in_view_QMARK_ = state.inView;
return daiquiri.core.create_element("div",{'ref':state.ref,'className':"h-full"},[(cljs.core.truth_(in_view_QMARK_)?daiquiri.interpreter.interpret((cell_render_f.cljs$core$IFn$_invoke$arity$0 ? cell_render_f.cljs$core$IFn$_invoke$arity$0() : cell_render_f.call(null))):daiquiri.interpreter.interpret(cell_placeholder))]);
}),null,"frontend.components.views/lazy-table-cell");
frontend.components.views.click_cell = (function frontend$components$views$click_cell(node){
var temp__5804__auto__ = (function (){var or__5002__auto__ = (dommy.utils.__GT_Array(node.getElementsByClassName("jtrigger"))[(0)]);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (dommy.utils.__GT_Array(node.getElementsByClassName("table-block-title"))[(0)]);
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var trigger = temp__5804__auto__;
return trigger.click();
} else {
return null;
}
});
frontend.components.views.navigate_to_cell = (function frontend$components$views$navigate_to_cell(e,cell,direction){
frontend.util.stop(e);

var row = frontend.util.rec_get_node(cell,"ls-table-row");
var cells = dommy.utils.__GT_Array(row.getElementsByClassName("ls-table-cell"));
var idx = cells.indexOf(cell);
var rows_container = frontend.util.rec_get_node(row,"ls-table-rows");
var rows = dommy.utils.__GT_Array(rows_container.getElementsByClassName("ls-table-row"));
var row_idx = rows.indexOf(row);
var container_left = rows_container.getBoundingClientRect().left;
var next_cell = (function (){var G__71363 = direction;
var G__71363__$1 = (((G__71363 instanceof cljs.core.Keyword))?G__71363.fqn:null);
switch (G__71363__$1) {
case "left":
if((idx > (1))){
return cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cells,(idx - (1)));
} else {
var prev_row = (((row_idx > (0)))?cljs.core.nth.cljs$core$IFn$_invoke$arity$2(rows,(row_idx - (1))):null);
if(cljs.core.truth_(prev_row)){
var cells__$1 = dommy.utils.__GT_Array(prev_row.getElementsByClassName("ls-table-cell"));
return cljs.core.last(cells__$1);
} else {
return null;
}
}

break;
case "right":
if((idx < (cljs.core.count(cells) - (1)))){
return cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cells,(idx + (1)));
} else {
var next_row = (((row_idx < (cljs.core.count(rows) - (1))))?cljs.core.nth.cljs$core$IFn$_invoke$arity$2(rows,(row_idx + (1))):null);
if(cljs.core.truth_(next_row)){
var cells__$1 = dommy.utils.__GT_Array(next_row.getElementsByClassName("ls-table-cell"));
return cljs.core.second(cells__$1);
} else {
return null;
}
}

break;
case "up":
var prev_row = (((row_idx > (0)))?cljs.core.nth.cljs$core$IFn$_invoke$arity$2(rows,(row_idx - (1))):null);
if(cljs.core.truth_(prev_row)){
var cells__$1 = dommy.utils.__GT_Array(prev_row.getElementsByClassName("ls-table-cell"));
return cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cells__$1,idx);
} else {
return null;
}

break;
case "down":
var next_row = (((row_idx < (cljs.core.count(rows) - (1))))?cljs.core.nth.cljs$core$IFn$_invoke$arity$2(rows,(row_idx + (1))):null);
if(cljs.core.truth_(next_row)){
var cells__$1 = dommy.utils.__GT_Array(next_row.getElementsByClassName("ls-table-cell"));
return cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cells__$1,idx);
} else {
return null;
}

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__71363__$1)].join('')));

}
})();
if(cljs.core.truth_(next_cell)){
var next_cell_left = next_cell.getBoundingClientRect().left;
frontend.state.clear_selection_BANG_();

dommy.core.add_class_BANG_.cljs$core$IFn$_invoke$arity$2(next_cell,"selected");

next_cell.focus();

if((next_cell_left < container_left)){
return next_cell.scrollIntoView(({"inline": "center", "block": "nearest"}));
} else {
return null;
}
} else {
return null;
}
});
frontend.components.views.table_cell_container = rum.core.lazy_build(rum.core.build_defc,(function (cell_opts,body){
var _STAR_ref = (logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_ref.call(null,null));
return daiquiri.interpreter.interpret(logseq.shui.ui.table_cell(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(cell_opts,new cljs.core.Keyword(null,"tabIndex","tabIndex",-169286716),(0),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_ref,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
if(dommy.core.has_class_QMARK_(e.target,"jtrigger")){
return null;
} else {
return frontend.components.views.click_cell(rum.core.deref(_STAR_ref));
}
}),new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (e){
var container = rum.core.deref(_STAR_ref);
var G__71366 = frontend.util.ekey(e);
switch (G__71366) {
case "Escape":
if(cljs.core.truth_(frontend.util.input_QMARK_(e.target))){
frontend.state.exit_editing_and_set_selected_blocks_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [container], null));

container.focus();
} else {
dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$2(container,"selected");

var row_73161 = frontend.util.rec_get_node(container,"ls-table-row");
frontend.state.exit_editing_and_set_selected_blocks_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [row_73161], null));
}

return frontend.util.stop(e);

break;
case "Enter":
if(cljs.core.truth_(frontend.util.input_QMARK_(e.target))){
frontend.state.exit_editing_and_set_selected_blocks_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [container], null));

container.focus();
} else {
frontend.components.views.click_cell(container);
}

return frontend.util.stop(e);

break;
case "ArrowUp":
return frontend.components.views.navigate_to_cell(e,container,new cljs.core.Keyword(null,"up","up",-269712113));

break;
case "ArrowDown":
return frontend.components.views.navigate_to_cell(e,container,new cljs.core.Keyword(null,"down","down",1565245570));

break;
case "ArrowLeft":
return frontend.components.views.navigate_to_cell(e,container,new cljs.core.Keyword(null,"left","left",-399115937));

break;
case "ArrowRight":
return frontend.components.views.navigate_to_cell(e,container,new cljs.core.Keyword(null,"right","right",-452581833));

break;
default:
return null;

}
})], 0)),body));
}),null,"frontend.components.views/table-cell-container");
frontend.components.views.table_row_inner = rum.core.lazy_build(rum.core.build_defc,(function (p__71369,row,props,p__71370){
var map__71371 = p__71369;
var map__71371__$1 = cljs.core.__destructure_map(map__71371);
var table = map__71371__$1;
var row_selected_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71371__$1,new cljs.core.Keyword(null,"row-selected?","row-selected?",165215850));
var map__71372 = p__71370;
var map__71372__$1 = cljs.core.__destructure_map(map__71372);
var show_add_property_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71372__$1,new cljs.core.Keyword(null,"show-add-property?","show-add-property?",2062685338));
var scrolling_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71372__$1,new cljs.core.Keyword(null,"scrolling?","scrolling?",-365022499));
var _STAR_ref = (logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_ref.call(null,null));
var pinned_columns = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(table,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"state","state",-1988618099),new cljs.core.Keyword(null,"pinned-columns","pinned-columns",-1218428870)], null));
var unpinned = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(table,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"state","state",-1988618099),new cljs.core.Keyword(null,"unpinned-columns","unpinned-columns",1124489041)], null));
var unpinned_columns = (cljs.core.truth_(show_add_property_QMARK_)?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.vec(unpinned),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"add-property","add-property",-714058455),new cljs.core.Keyword(null,"cell","cell",764245084),(function (_table,_row,_column){
return null;
})], null)):unpinned);
var sized_columns = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(table,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"state","state",-1988618099),new cljs.core.Keyword(null,"sized-columns","sized-columns",-224617731)], null));
var row_cell_f = (function (column,p__71373){
var map__71374 = p__71373;
var map__71374__$1 = cljs.core.__destructure_map(map__71374);
var _lazy_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71374__$1,new cljs.core.Keyword(null,"_lazy?","_lazy?",1898869592));
var id = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(row)),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column))].join('');
var width = frontend.components.views.get_column_size(column,sized_columns);
var select_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column),new cljs.core.Keyword(null,"select","select",1147833503));
var add_property_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column),new cljs.core.Keyword(null,"add-property","add-property",-714058455));
var style = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"width","width",-384071477),width,new cljs.core.Keyword(null,"min-width","min-width",1926193728),width], null);
var cell_opts = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"key","key",-1516042587),id,new cljs.core.Keyword(null,"select?","select?",-1012224063),select_QMARK_,new cljs.core.Keyword(null,"add-property?","add-property?",1697808154),add_property_QMARK_,new cljs.core.Keyword(null,"style","style",-496642736),style], null);
var cell_placeholder = frontend.components.views.table_cell_container(cell_opts,null);
if(cljs.core.truth_((function (){var and__5000__auto__ = scrolling_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(row));
} else {
return and__5000__auto__;
}
})())){
return cell_placeholder;
} else {
var temp__5804__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(column,new cljs.core.Keyword(null,"cell","cell",764245084));
if(cljs.core.truth_(temp__5804__auto__)){
var render = temp__5804__auto__;
return frontend.components.views.lazy_table_cell((function (){
return frontend.components.views.table_cell_container(cell_opts,(render.cljs$core$IFn$_invoke$arity$4 ? render.cljs$core$IFn$_invoke$arity$4(table,row,column,style) : render.call(null,table,row,column,style)));
}),cell_placeholder);
} else {
return null;
}
}
});
return daiquiri.interpreter.interpret(logseq.shui.ui.table_row(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([props,new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"key","key",-1516042587),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(row)),new cljs.core.Keyword(null,"tabIndex","tabIndex",-169286716),(0),new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_ref,new cljs.core.Keyword(null,"data-state","data-state",1518559596),(cljs.core.truth_((row_selected_QMARK_.cljs$core$IFn$_invoke$arity$1 ? row_selected_QMARK_.cljs$core$IFn$_invoke$arity$1(row) : row_selected_QMARK_.call(null,row)))?"selected":null),new cljs.core.Keyword(null,"data-id","data-id",1023855591),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(row),new cljs.core.Keyword(null,"blockid","blockid",-664467760),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(row)),new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),(function (_e){
return frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(row),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"children?","children?",-1199594108),false], null)], 0));
}),new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (e){
var container = rum.core.deref(_STAR_ref);
if(dommy.core.has_class_QMARK_(container,"selected")){
var G__71384 = frontend.util.ekey(e);
switch (G__71384) {
case "Enter":
frontend.state.sidebar_add_block_BANG_(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(row),new cljs.core.Keyword(null,"block","block",664686210));

frontend.state.clear_selection_BANG_();

return frontend.util.stop(e);

break;
case "ArrowLeft":
var temp__5804__auto___73164 = cljs.core.first(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (node){
return (!(((dommy.utils.__GT_Array(node.getElementsByClassName("ui__checkbox"))[(0)]) == null)));
}),dommy.utils.__GT_Array(container.getElementsByClassName("ls-table-cell"))));
if(cljs.core.truth_(temp__5804__auto___73164)){
var cell_73165 = temp__5804__auto___73164;
frontend.state.clear_selection_BANG_();

dommy.core.add_class_BANG_.cljs$core$IFn$_invoke$arity$2(cell_73165,"selected");

cell_73165.focus();
} else {
}

return frontend.util.stop(e);

break;
case "ArrowRight":
var temp__5804__auto___73166 = cljs.core.last(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (node){
return (!(((dommy.utils.__GT_Array(node.getElementsByClassName("ui__checkbox"))[(0)]) == null)));
}),dommy.utils.__GT_Array(container.getElementsByClassName("ls-table-cell"))));
if(cljs.core.truth_(temp__5804__auto___73166)){
var cell_73167 = temp__5804__auto___73166;
frontend.state.clear_selection_BANG_();

dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$2(container,"selected");

dommy.core.add_class_BANG_.cljs$core$IFn$_invoke$arity$2(cell_73167,"selected");

cell_73167.focus();
} else {
}

return frontend.util.stop(e);

break;
case "Escape":
frontend.state.clear_selection_BANG_();

return frontend.util.stop(e);

break;
default:
return null;

}
} else {
return null;
}
})], null)], 0)),((cljs.core.seq(pinned_columns))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.sticky-columns.flex.flex-row","div.sticky-columns.flex.flex-row",-2049518578),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__71367_SHARP_){
return row_cell_f(p1__71367_SHARP_,cljs.core.PersistentArrayMap.EMPTY);
}),pinned_columns)], null):null),((cljs.core.seq(unpinned_columns))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row","div.flex.flex-row",209103675),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__71368_SHARP_){
return row_cell_f(p1__71368_SHARP_,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"lazy?","lazy?",2035907855),true], null));
}),unpinned_columns)], null):null)));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.views/table-row-inner");
frontend.components.views.table_row = rum.core.lazy_build(rum.core.build_defc,(function (table,row,props,option){
var block = (function (){var G__71385 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(row);
return (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(G__71385) : frontend.db.sub_block.call(null,G__71385));
})();
var row_SINGLEQUOTE_ = (cljs.core.truth_(new cljs.core.Keyword("block.temp","fully-loaded?","block.temp/fully-loaded?",-116637365).cljs$core$IFn$_invoke$arity$1(block))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block.temp","refs-count","block.temp/refs-count",-598132499),new cljs.core.Keyword("block.temp","refs-count","block.temp/refs-count",-598132499).cljs$core$IFn$_invoke$arity$1(row)):row);
return frontend.components.views.table_row_inner(table,row_SINGLEQUOTE_,props,option);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query], null),"frontend.components.views/table-row");
frontend.components.views.search = rum.core.lazy_build(rum.core.build_defc,(function (input,p__71386){
var map__71387 = p__71386;
var map__71387__$1 = cljs.core.__destructure_map(map__71387);
var on_change = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71387__$1,new cljs.core.Keyword(null,"on-change","on-change",-732046149));
var set_input_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71387__$1,new cljs.core.Keyword(null,"set-input!","set-input!",-615513292));
var vec__71388 = rum.core.use_state(false);
var show_input_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71388,(0),null);
var set_show_input_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71388,(1),null);
if(cljs.core.truth_(show_input_QMARK_)){
var attrs71393 = (function (){var G__71394 = new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"Type to search",new cljs.core.Keyword(null,"auto-focus","auto-focus",1250006231),true,new cljs.core.Keyword(null,"value","value",305978217),input,new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
var value = frontend.util.evalue(e);
return (on_change.cljs$core$IFn$_invoke$arity$1 ? on_change.cljs$core$IFn$_invoke$arity$1(value) : on_change.call(null,value));
}),new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (e){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Escape",frontend.util.ekey(e))){
(set_show_input_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_show_input_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_show_input_BANG_.call(null,false));

return (set_input_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_input_BANG_.cljs$core$IFn$_invoke$arity$1("") : set_input_BANG_.call(null,""));
} else {
return null;
}
}),new cljs.core.Keyword(null,"class","class",-2030961996),"max-w-sm !h-7 !py-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0"], null);
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__71394) : logseq.shui.ui.input.call(null,G__71394));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs71393))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","items-center"], null)], null),attrs71393], 0))):{'className':"flex flex-row items-center"}),((cljs.core.map_QMARK_(attrs71393))?[daiquiri.interpreter.interpret((function (){var G__71397 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),"ghost",new cljs.core.Keyword(null,"class","class",-2030961996),"text-muted-foreground !px-1",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
(set_show_input_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_show_input_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_show_input_BANG_.call(null,false));

return (set_input_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_input_BANG_.cljs$core$IFn$_invoke$arity$1("") : set_input_BANG_.call(null,""));
})], null);
var G__71398 = frontend.ui.icon("x");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__71397,G__71398) : logseq.shui.ui.button.call(null,G__71397,G__71398));
})())]:[daiquiri.interpreter.interpret(attrs71393),daiquiri.interpreter.interpret((function (){var G__71401 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),"ghost",new cljs.core.Keyword(null,"class","class",-2030961996),"text-muted-foreground !px-1",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
(set_show_input_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_show_input_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_show_input_BANG_.call(null,false));

return (set_input_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_input_BANG_.cljs$core$IFn$_invoke$arity$1("") : set_input_BANG_.call(null,""));
})], null);
var G__71402 = frontend.ui.icon("x");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__71401,G__71402) : logseq.shui.ui.button.call(null,G__71401,G__71402));
})())]));
} else {
return daiquiri.interpreter.interpret((function (){var G__71405 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),"ghost",new cljs.core.Keyword(null,"class","class",-2030961996),"text-muted-foreground !px-1",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (set_show_input_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_show_input_BANG_.cljs$core$IFn$_invoke$arity$1(true) : set_show_input_BANG_.call(null,true));
})], null);
var G__71406 = frontend.ui.icon("search",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(15)], null));
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__71405,G__71406) : logseq.shui.ui.button.call(null,G__71405,G__71406));
})());
}
}),null,"frontend.components.views/search");
frontend.components.views.datetime_property_QMARK_ = (function frontend$components$views$datetime_property_QMARK_(property){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"datetime","datetime",494675702),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property))) || (cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551),null,new cljs.core.Keyword("block","created-at","block/created-at",1440015),null], null), null),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property))));
});
frontend.components.views.timestamp_options = new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),"1 day ago",new cljs.core.Keyword(null,"label","label",1718410804),"1 day ago"], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),"3 days ago",new cljs.core.Keyword(null,"label","label",1718410804),"3 days ago"], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),"1 week ago",new cljs.core.Keyword(null,"label","label",1718410804),"1 week ago"], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),"1 month ago",new cljs.core.Keyword(null,"label","label",1718410804),"1 month ago"], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),"3 months ago",new cljs.core.Keyword(null,"label","label",1718410804),"3 months ago"], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),"1 year ago",new cljs.core.Keyword(null,"label","label",1718410804),"1 year ago"], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),"Custom date",new cljs.core.Keyword(null,"label","label",1718410804),"Custom date"], null)], null);
frontend.components.views.filter_property = rum.core.lazy_build(rum.core.build_defc,(function (view_entity,columns,p__71408,opts){
var map__71409 = p__71408;
var map__71409__$1 = cljs.core.__destructure_map(map__71409);
var table = map__71409__$1;
var data_fns = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71409__$1,new cljs.core.Keyword(null,"data-fns","data-fns",-1065218324));
var vec__71410 = rum.core.use_state(null);
var property = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71410,(0),null);
var set_property_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71410,(1),null);
var vec__71413 = rum.core.use_state(null);
var values = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71413,(0),null);
var set_values_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71413,(1),null);
var schema = new cljs.core.Keyword(null,"schema","schema",-1582001791).cljs$core$IFn$_invoke$arity$1((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)));
var timestamp_QMARK_ = frontend.components.views.datetime_property_QMARK_(property);
var set_filters_BANG_ = new cljs.core.Keyword(null,"set-filters!","set-filters!",385623142).cljs$core$IFn$_invoke$arity$1(data_fns);
var filters = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(table,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"state","state",-1988618099),new cljs.core.Keyword(null,"filters","filters",974726919)], null));
var columns__$1 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__71407_SHARP_){
return ((new cljs.core.Keyword(null,"column-list?","column-list?",-538229318).cljs$core$IFn$_invoke$arity$1(p1__71407_SHARP_) === false) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(p1__71407_SHARP_))));
}),columns);
var items = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (column){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"label","label",1718410804),new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(column),new cljs.core.Keyword(null,"value","value",305978217),column], null);
}),columns__$1);
var option = new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"input-default-placeholder","input-default-placeholder",-1040139250),"Filter",new cljs.core.Keyword(null,"input-opts","input-opts",1688681135),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"!px-2 !py-1"], null),new cljs.core.Keyword(null,"items","items",1031954938),items,new cljs.core.Keyword(null,"extract-fn","extract-fn",-339752723),new cljs.core.Keyword(null,"label","label",1718410804),new cljs.core.Keyword(null,"extract-chosen-fn","extract-chosen-fn",1058364622),new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),(function (column){
var id = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column);
var property__$1 = (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(id) : frontend.db.entity.call(null,id));
var internal_property = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(column),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404),new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(column)], null);
if(cljs.core.truth_((function (){var or__5002__auto__ = property__$1;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db.cardinality","many","db.cardinality/many",772806234),new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659).cljs$core$IFn$_invoke$arity$1(cljs.core.get.cljs$core$IFn$_invoke$arity$2(schema,id)))) || (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(column),new cljs.core.Keyword(null,"string","string",-1989541586))));
}
})())){
var G__71419 = (function (){var or__5002__auto__ = property__$1;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return internal_property;
}
})();
return (set_property_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_property_BANG_.cljs$core$IFn$_invoke$arity$1(G__71419) : set_property_BANG_.call(null,G__71419));
} else {
(logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));

var property__$2 = internal_property;
var new_filter = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property__$2),new cljs.core.Keyword(null,"text-contains","text-contains",-1761634668)], null);
var filters_SINGLEQUOTE_ = ((cljs.core.seq(new cljs.core.Keyword(null,"filters","filters",974726919).cljs$core$IFn$_invoke$arity$1(filters)))?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"filters","filters",974726919).cljs$core$IFn$_invoke$arity$1(filters),new_filter):new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new_filter], null));
var G__71420 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"or?","or?",-1226532173),new cljs.core.Keyword(null,"or?","or?",-1226532173).cljs$core$IFn$_invoke$arity$1(filters),new cljs.core.Keyword(null,"filters","filters",974726919),filters_SINGLEQUOTE_], null);
return (set_filters_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_filters_BANG_.cljs$core$IFn$_invoke$arity$1(G__71420) : set_filters_BANG_.call(null,G__71420));
}
})], null);
var checkbox_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"checkbox","checkbox",1612615655),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property));
var property_ident = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property);
logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core.truth_((function (){var and__5000__auto__ = view_entity;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = property_ident;
if(cljs.core.truth_(and__5000__auto____$1)){
return (!(((timestamp_QMARK_) || (checkbox_QMARK_))));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_property_values.cljs$core$IFn$_invoke$arity$variadic(property_ident,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"view-id","view-id",1118263032),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_entity),new cljs.core.Keyword(null,"query-entity-ids","query-entity-ids",2135324416),new cljs.core.Keyword(null,"query-entity-ids","query-entity-ids",2135324416).cljs$core$IFn$_invoke$arity$1(opts)], null)], 0))),(function (data){
return promesa.protocols._promise((set_values_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_values_BANG_.cljs$core$IFn$_invoke$arity$1(data) : set_values_BANG_.call(null,data)));
}));
}));
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [property_ident], null));

var option__$1 = ((timestamp_QMARK_)?cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([option,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"items","items",1031954938),frontend.components.views.timestamp_options,new cljs.core.Keyword(null,"input-default-placeholder","input-default-placeholder",-1040139250),(cljs.core.truth_(property)?new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(property):"Select"),new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),(function (value,_,___$1,e){
(logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));

var set_filter_fn = (function (value__$1){
var filters_SINGLEQUOTE_ = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"filters","filters",974726919).cljs$core$IFn$_invoke$arity$1(filters),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword(null,"after","after",594996914),value__$1], null));
var G__71421 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"or?","or?",-1226532173),new cljs.core.Keyword(null,"or?","or?",-1226532173).cljs$core$IFn$_invoke$arity$1(filters),new cljs.core.Keyword(null,"filters","filters",974726919),filters_SINGLEQUOTE_], null);
return (set_filters_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_filters_BANG_.cljs$core$IFn$_invoke$arity$1(G__71421) : set_filters_BANG_.call(null,G__71421));
});
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(value,"Custom date")){
var G__71422 = e.target;
var G__71423 = frontend.ui.nlp_calendar(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"initial-focus","initial-focus",1154999719),true,new cljs.core.Keyword(null,"datetime?","datetime?",-1173480100),false,new cljs.core.Keyword(null,"on-day-click","on-day-click",1918658076),(function (value__$1){
set_filter_fn(value__$1);

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
})], null));
var G__71424 = cljs.core.PersistentArrayMap.EMPTY;
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__71422,G__71423,G__71424) : logseq.shui.ui.popup_show_BANG_.call(null,G__71422,G__71423,G__71424));
} else {
return set_filter_fn(value);
}
})], null)], 0)):(cljs.core.truth_(property)?((checkbox_QMARK_)?(function (){var items__$1 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),true,new cljs.core.Keyword(null,"label","label",1718410804),"true"], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),false,new cljs.core.Keyword(null,"label","label",1718410804),"false"], null)], null);
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([option,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"items","items",1031954938),items__$1,new cljs.core.Keyword(null,"input-default-placeholder","input-default-placeholder",-1040139250),(cljs.core.truth_(property)?new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(property):"Select"),new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),(function (value){
var filters_SINGLEQUOTE_ = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"filters","filters",974726919).cljs$core$IFn$_invoke$arity$1(filters),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword(null,"is","is",369128998),value], null));
var G__71425 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"or?","or?",-1226532173),new cljs.core.Keyword(null,"or?","or?",-1226532173).cljs$core$IFn$_invoke$arity$1(filters),new cljs.core.Keyword(null,"filters","filters",974726919),filters_SINGLEQUOTE_], null);
return (set_filters_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_filters_BANG_.cljs$core$IFn$_invoke$arity$1(G__71425) : set_filters_BANG_.call(null,G__71425));
})], null)], 0));
})():(function (){var items__$1 = values;
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([option,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"items","items",1031954938),items__$1,new cljs.core.Keyword(null,"input-default-placeholder","input-default-placeholder",-1040139250),(cljs.core.truth_(property)?new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(property):"Select"),new cljs.core.Keyword(null,"multiple-choices?","multiple-choices?",-1858892490),true,new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),(function (_value,_selected_QMARK_,selected){
var selected_value = (cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.map_QMARK_(cljs.core.first(selected));
if(and__5000__auto__){
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(cljs.core.first(selected));
} else {
return and__5000__auto__;
}
})())?cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),selected)):selected);
var filters_SINGLEQUOTE_ = ((cljs.core.seq(selected))?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"filters","filters",974726919).cljs$core$IFn$_invoke$arity$1(filters),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword(null,"is","is",369128998),selected_value], null)):new cljs.core.Keyword(null,"filters","filters",974726919).cljs$core$IFn$_invoke$arity$1(filters));
var G__71426 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"or?","or?",-1226532173),new cljs.core.Keyword(null,"or?","or?",-1226532173).cljs$core$IFn$_invoke$arity$1(filters),new cljs.core.Keyword(null,"filters","filters",974726919),filters_SINGLEQUOTE_], null);
return (set_filters_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_filters_BANG_.cljs$core$IFn$_invoke$arity$1(G__71426) : set_filters_BANG_.call(null,G__71426));
})], null)], 0));
})()):option
));
return frontend.components.select.select(option__$1);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.views/filter-property");
frontend.components.views.filter_properties = rum.core.lazy_build(rum.core.build_defc,(function (view_entity,columns,table,opts){
return daiquiri.interpreter.interpret((function (){var G__71441 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),"ghost",new cljs.core.Keyword(null,"class","class",-2030961996),"text-muted-foreground !px-1",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
var G__71443 = e.target;
var G__71444 = (function (){
return frontend.components.views.filter_property(view_entity,columns,table,opts);
});
var G__71445 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"end","end",-268185958),new cljs.core.Keyword(null,"auto-focus?","auto-focus?",1021654593),true], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__71443,G__71444,G__71445) : logseq.shui.ui.popup_show_BANG_.call(null,G__71443,G__71444,G__71445));
})], null);
var G__71442 = frontend.ui.icon("filter");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__71441,G__71442) : logseq.shui.ui.button.call(null,G__71441,G__71442));
})());
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.views/filter-properties");
frontend.components.views.operator__GT_text = (function frontend$components$views$operator__GT_text(operator){
var G__71446 = operator;
var G__71446__$1 = (((G__71446 instanceof cljs.core.Keyword))?G__71446.fqn:null);
switch (G__71446__$1) {
case "is":
return "is";

break;
case "is-not":
return "is not";

break;
case "text-contains":
return "text contains";

break;
case "text-not-contains":
return "text not contains";

break;
case "date-before":
return "date before";

break;
case "date-after":
return "date after";

break;
case "before":
return "before";

break;
case "after":
return "after";

break;
case "number-gt":
return ">";

break;
case "number-lt":
return "<";

break;
case "number-gte":
return ">=";

break;
case "number-lte":
return "<=";

break;
case "between":
return "between";

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__71446__$1)].join('')));

}
});
frontend.components.views.get_property_operators = (function frontend$components$views$get_property_operators(property){
if(frontend.components.views.datetime_property_QMARK_(property)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"before","before",-1633692388),new cljs.core.Keyword(null,"after","after",594996914)], null);
} else {
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"is","is",369128998),new cljs.core.Keyword(null,"is-not","is-not",-677962855)], null),(function (){var G__71449 = new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property);
var G__71449__$1 = (((G__71449 instanceof cljs.core.Keyword))?G__71449.fqn:null);
switch (G__71449__$1) {
case "default":
case "url":
case "node":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"text-contains","text-contains",-1761634668),new cljs.core.Keyword(null,"text-not-contains","text-not-contains",-1055497598)], null);

break;
case "date":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"date-before","date-before",302148478),new cljs.core.Keyword(null,"date-after","date-after",-901666462)], null);

break;
case "number":
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"number-gt","number-gt",1226768068),new cljs.core.Keyword(null,"number-lt","number-lt",-237484786),new cljs.core.Keyword(null,"number-gte","number-gte",1273061573),new cljs.core.Keyword(null,"number-lte","number-lte",1647090940),new cljs.core.Keyword(null,"between","between",1131099276)], null);

break;
default:
return null;

}
})());
}
});
frontend.components.views.get_filter_with_changed_operator = (function frontend$components$views$get_filter_with_changed_operator(_property,operator,value){
var G__71452 = operator;
var G__71452__$1 = (((G__71452 instanceof cljs.core.Keyword))?G__71452.fqn:null);
switch (G__71452__$1) {
case "is":
case "is-not":
if(cljs.core.set_QMARK_(value)){
return value;
} else {
return null;
}

break;
case "text-contains":
case "text-not-contains":
if(typeof value === 'string'){
return value;
} else {
return null;
}

break;
case "number-gt":
case "number-lt":
case "number-gte":
case "number-lte":
if(typeof value === 'number'){
return value;
} else {
return null;
}

break;
case "between":
if(((cljs.core.vector_QMARK_(value)) && (cljs.core.every_QMARK_(cljs.core.number_QMARK_,value)))){
return value;
} else {
return null;
}

break;
case "date-before":
case "date-after":
case "before":
case "after":
if(typeof value === 'number'){
return value;
} else {
return null;
}

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__71452__$1)].join('')));

}
});
frontend.components.views.filter_operator = rum.core.lazy_build(rum.core.build_defc,(function (property,operator,filters,set_filters_BANG_,idx){
return daiquiri.interpreter.interpret((function (){var G__71484 = (function (){var G__71486 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"asChild","asChild",682531623),true], null);
var G__71487 = (function (){var G__71488 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"class","class",-2030961996),"!px-2 rounded-none border-r",new cljs.core.Keyword(null,"variant","variant",-424354234),"ghost",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065)], null);
var G__71489 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-xs","span.text-xs",63518557),frontend.components.views.operator__GT_text(operator)], null);
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__71488,G__71489) : logseq.shui.ui.button.call(null,G__71488,G__71489));
})();
return (logseq.shui.ui.dropdown_menu_trigger.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_trigger.cljs$core$IFn$_invoke$arity$2(G__71486,G__71487) : logseq.shui.ui.dropdown_menu_trigger.call(null,G__71486,G__71487));
})();
var G__71485 = (function (){var G__71490 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"align","align",1964212802),"start"], null);
var G__71491 = (function (){var operators = frontend.components.views.get_property_operators(property);
var iter__5480__auto__ = (function frontend$components$views$iter__71492(s__71493){
return (new cljs.core.LazySeq(null,(function (){
var s__71493__$1 = s__71493;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__71493__$1);
if(temp__5804__auto__){
var s__71493__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__71493__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__71493__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__71495 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__71494 = (0);
while(true){
if((i__71494 < size__5479__auto__)){
var operator__$1 = cljs.core._nth(c__5478__auto__,i__71494);
cljs.core.chunk_append(b__71495,(function (){var G__71497 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__71494,operator__$1,c__5478__auto__,size__5479__auto__,b__71495,s__71493__$2,temp__5804__auto__,operators,G__71490,G__71484){
return (function (){
var new_filters = cljs.core.update.cljs$core$IFn$_invoke$arity$3(filters,new cljs.core.Keyword(null,"filters","filters",974726919),((function (i__71494,operator__$1,c__5478__auto__,size__5479__auto__,b__71495,s__71493__$2,temp__5804__auto__,operators,G__71490,G__71484){
return (function (col){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(col,idx,((function (i__71494,operator__$1,c__5478__auto__,size__5479__auto__,b__71495,s__71493__$2,temp__5804__auto__,operators,G__71490,G__71484){
return (function (p__71499){
var vec__71500 = p__71499;
var property__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71500,(0),null);
var _old_operator = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71500,(1),null);
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71500,(2),null);
var value_SINGLEQUOTE_ = frontend.components.views.get_filter_with_changed_operator(property__$1,operator__$1,value);
if(cljs.core.truth_(value_SINGLEQUOTE_)){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [property__$1,operator__$1,value_SINGLEQUOTE_], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [property__$1,operator__$1], null);
}
});})(i__71494,operator__$1,c__5478__auto__,size__5479__auto__,b__71495,s__71493__$2,temp__5804__auto__,operators,G__71490,G__71484))
);
});})(i__71494,operator__$1,c__5478__auto__,size__5479__auto__,b__71495,s__71493__$2,temp__5804__auto__,operators,G__71490,G__71484))
);
return (set_filters_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_filters_BANG_.cljs$core$IFn$_invoke$arity$1(new_filters) : set_filters_BANG_.call(null,new_filters));
});})(i__71494,operator__$1,c__5478__auto__,size__5479__auto__,b__71495,s__71493__$2,temp__5804__auto__,operators,G__71490,G__71484))
], null);
var G__71498 = frontend.components.views.operator__GT_text(operator__$1);
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__71497,G__71498) : logseq.shui.ui.dropdown_menu_item.call(null,G__71497,G__71498));
})());

var G__73204 = (i__71494 + (1));
i__71494 = G__73204;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__71495),frontend$components$views$iter__71492(cljs.core.chunk_rest(s__71493__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__71495),null);
}
} else {
var operator__$1 = cljs.core.first(s__71493__$2);
return cljs.core.cons((function (){var G__71505 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (operator__$1,s__71493__$2,temp__5804__auto__,operators,G__71490,G__71484){
return (function (){
var new_filters = cljs.core.update.cljs$core$IFn$_invoke$arity$3(filters,new cljs.core.Keyword(null,"filters","filters",974726919),(function (col){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(col,idx,(function (p__71507){
var vec__71509 = p__71507;
var property__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71509,(0),null);
var _old_operator = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71509,(1),null);
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71509,(2),null);
var value_SINGLEQUOTE_ = frontend.components.views.get_filter_with_changed_operator(property__$1,operator__$1,value);
if(cljs.core.truth_(value_SINGLEQUOTE_)){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [property__$1,operator__$1,value_SINGLEQUOTE_], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [property__$1,operator__$1], null);
}
}));
}));
return (set_filters_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_filters_BANG_.cljs$core$IFn$_invoke$arity$1(new_filters) : set_filters_BANG_.call(null,new_filters));
});})(operator__$1,s__71493__$2,temp__5804__auto__,operators,G__71490,G__71484))
], null);
var G__71506 = frontend.components.views.operator__GT_text(operator__$1);
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__71505,G__71506) : logseq.shui.ui.dropdown_menu_item.call(null,G__71505,G__71506));
})(),frontend$components$views$iter__71492(cljs.core.rest(s__71493__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(operators);
})();
return (logseq.shui.ui.dropdown_menu_content.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_content.cljs$core$IFn$_invoke$arity$2(G__71490,G__71491) : logseq.shui.ui.dropdown_menu_content.call(null,G__71490,G__71491));
})();
return (logseq.shui.ui.dropdown_menu.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu.cljs$core$IFn$_invoke$arity$2(G__71484,G__71485) : logseq.shui.ui.dropdown_menu.call(null,G__71484,G__71485));
})());
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.views/filter-operator");
frontend.components.views.between = rum.core.lazy_build(rum.core.build_defc,(function (_property,p__71527,filters,set_filters_BANG_,idx){
var vec__71528 = p__71527;
var start = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71528,(0),null);
var end = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71528,(1),null);
var attrs71525 = (function (){var G__71533 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"auto-focus","auto-focus",1250006231),true,new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"from",new cljs.core.Keyword(null,"value","value",305978217),cljs.core.str.cljs$core$IFn$_invoke$arity$1(start),new cljs.core.Keyword(null,"onChange","onChange",-312891301),(function (e){
var input_value = frontend.util.evalue(e);
var number_value = ((clojure.string.blank_QMARK_(input_value))?null:frontend.util.safe_parse_float(input_value));
var value = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [number_value,end], null);
var value__$1 = ((cljs.core.every_QMARK_(cljs.core.nil_QMARK_,value))?null:value);
var new_filters = cljs.core.update.cljs$core$IFn$_invoke$arity$3(filters,new cljs.core.Keyword(null,"filters","filters",974726919),(function (col){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(col,idx,(function (p__71536){
var vec__71537 = p__71536;
var property = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71537,(0),null);
var operator = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71537,(1),null);
var _old_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71537,(2),null);
if((value__$1 == null)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [property,operator], null);
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [property,operator,value__$1], null);
}
}));
}));
return (set_filters_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_filters_BANG_.cljs$core$IFn$_invoke$arity$1(new_filters) : set_filters_BANG_.call(null,new_filters));
}),new cljs.core.Keyword(null,"class","class",-2030961996),"w-24 !h-6 !py-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0"], null);
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__71533) : logseq.shui.ui.input.call(null,G__71533));
})();
return daiquiri.core.create_element(daiquiri.core.fragment,((cljs.core.map_QMARK_(attrs71525))?daiquiri.interpreter.element_attributes(attrs71525):null),((cljs.core.map_QMARK_(attrs71525))?[daiquiri.interpreter.interpret((function (){var G__71545 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"value","value",305978217),cljs.core.str.cljs$core$IFn$_invoke$arity$1(end),new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"to",new cljs.core.Keyword(null,"onChange","onChange",-312891301),(function (e){
var input_value = frontend.util.evalue(e);
var number_value = ((clojure.string.blank_QMARK_(input_value))?null:frontend.util.safe_parse_float(input_value));
var value = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [start,number_value], null);
var value__$1 = ((cljs.core.every_QMARK_(cljs.core.nil_QMARK_,value))?null:value);
var new_filters = cljs.core.update.cljs$core$IFn$_invoke$arity$3(filters,new cljs.core.Keyword(null,"filters","filters",974726919),(function (col){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(col,idx,(function (p__71546){
var vec__71547 = p__71546;
var property = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71547,(0),null);
var operator = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71547,(1),null);
var _old_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71547,(2),null);
if((value__$1 == null)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [property,operator], null);
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [property,operator,value__$1], null);
}
}));
}));
return (set_filters_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_filters_BANG_.cljs$core$IFn$_invoke$arity$1(new_filters) : set_filters_BANG_.call(null,new_filters));
}),new cljs.core.Keyword(null,"class","class",-2030961996),"w-24 !h-6 !py-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0"], null);
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__71545) : logseq.shui.ui.input.call(null,G__71545));
})())]:[daiquiri.interpreter.interpret(attrs71525),daiquiri.interpreter.interpret((function (){var G__71555 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"value","value",305978217),cljs.core.str.cljs$core$IFn$_invoke$arity$1(end),new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"to",new cljs.core.Keyword(null,"onChange","onChange",-312891301),(function (e){
var input_value = frontend.util.evalue(e);
var number_value = ((clojure.string.blank_QMARK_(input_value))?null:frontend.util.safe_parse_float(input_value));
var value = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [start,number_value], null);
var value__$1 = ((cljs.core.every_QMARK_(cljs.core.nil_QMARK_,value))?null:value);
var new_filters = cljs.core.update.cljs$core$IFn$_invoke$arity$3(filters,new cljs.core.Keyword(null,"filters","filters",974726919),(function (col){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(col,idx,(function (p__71556){
var vec__71557 = p__71556;
var property = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71557,(0),null);
var operator = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71557,(1),null);
var _old_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71557,(2),null);
if((value__$1 == null)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [property,operator], null);
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [property,operator,value__$1], null);
}
}));
}));
return (set_filters_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_filters_BANG_.cljs$core$IFn$_invoke$arity$1(new_filters) : set_filters_BANG_.call(null,new_filters));
}),new cljs.core.Keyword(null,"class","class",-2030961996),"w-24 !h-6 !py-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0"], null);
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__71555) : logseq.shui.ui.input.call(null,G__71555));
})())]));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.views/between");
frontend.components.views.filter_value_select = rum.core.lazy_build(rum.core.build_defc,(function (view_entity,p__71564,property,value,operator,idx,opts){
var map__71565 = p__71564;
var map__71565__$1 = cljs.core.__destructure_map(map__71565);
var table = map__71565__$1;
var data_fns = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71565__$1,new cljs.core.Keyword(null,"data-fns","data-fns",-1065218324));
var type = new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property);
var property_ident = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property);
logseq.shui.hooks.use_effect_BANG_((function (){
var values = ((cljs.core.coll_QMARK_(value))?value:new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [value], null));
var ids = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__71560_SHARP_){
return ((cljs.core.uuid_QMARK_(p1__71560_SHARP_)) && (((function (){var G__71566 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),p1__71560_SHARP_], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__71566) : frontend.db.entity.call(null,G__71566));
})() == null)));
}),values);
if(cljs.core.seq(ids)){
return frontend.db.async._LT_get_blocks(frontend.state.get_current_repo(),ids);
} else {
return null;
}
}),cljs.core.PersistentVector.EMPTY);

var filters = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(table,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"state","state",-1988618099),new cljs.core.Keyword(null,"filters","filters",974726919)], null));
var set_filters_BANG_ = new cljs.core.Keyword(null,"set-filters!","set-filters!",385623142).cljs$core$IFn$_invoke$arity$1(data_fns);
var many_QMARK_ = ((((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"date-after","date-after",-901666462),null,new cljs.core.Keyword(null,"after","after",594996914),null,new cljs.core.Keyword(null,"before","before",-1633692388),null,new cljs.core.Keyword(null,"date-before","date-before",302148478),null], null), null),operator)) || (cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"checkbox","checkbox",1612615655),null], null), null),type))))?false:true);
return daiquiri.interpreter.interpret((function (){var G__71583 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"class","class",-2030961996),"!px-2 rounded-none border-r",new cljs.core.Keyword(null,"variant","variant",-424354234),"ghost",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_((function (){var and__5000__auto__ = property_ident;
if(cljs.core.truth_(and__5000__auto__)){
return (!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"checkbox","checkbox",1612615655),null,new cljs.core.Keyword(null,"datetime","datetime",494675702),null,new cljs.core.Keyword(null,"data","data",-232669377),null], null), null),type)));
} else {
return and__5000__auto__;
}
})())?promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_property_values.cljs$core$IFn$_invoke$arity$variadic(property_ident,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"view-id","view-id",1118263032),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_entity),new cljs.core.Keyword(null,"query-entity-ids","query-entity-ids",2135324416),new cljs.core.Keyword(null,"query-entity-ids","query-entity-ids",2135324416).cljs$core$IFn$_invoke$arity$1(opts)], null)], 0))),(function (data){
return promesa.protocols._promise(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (v){
if(cljs.core.map_QMARK_(new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(v))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(v,new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(v)));
} else {
return v;
}
}),data));
}));
})):null)),(function (values){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"after","after",594996914),null,new cljs.core.Keyword(null,"before","before",-1633692388),null], null), null),operator))?frontend.components.views.timestamp_options:((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(type,new cljs.core.Keyword(null,"checkbox","checkbox",1612615655)))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),true,new cljs.core.Keyword(null,"label","label",1718410804),"true"], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),false,new cljs.core.Keyword(null,"label","label",1718410804),"false"], null)], null):values
))),(function (items){
return promesa.protocols._promise((function (){var G__71585 = e.target;
var G__71586 = (function (){
var option = (function (){var G__71588 = new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"input-default-placeholder","input-default-placeholder",-1040139250),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword(null,"input-opts","input-opts",1688681135),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"!px-3 !py-1"], null),new cljs.core.Keyword(null,"items","items",1031954938),items,new cljs.core.Keyword(null,"extract-fn","extract-fn",-339752723),new cljs.core.Keyword(null,"label","label",1718410804),new cljs.core.Keyword(null,"extract-chosen-fn","extract-chosen-fn",1058364622),new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),(function (value__$1,_selected_QMARK_,selected,e__$1){
if(many_QMARK_){
} else {
(logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
}

var value_SINGLEQUOTE_ = ((many_QMARK_)?selected:value__$1);
var set_filters_fn = (function (value_SINGLEQUOTE___$1){
var new_filters = cljs.core.update.cljs$core$IFn$_invoke$arity$3(filters,new cljs.core.Keyword(null,"filters","filters",974726919),(function (col){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(col,idx,(function (p__71589){
var vec__71590 = p__71589;
var property__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71590,(0),null);
var operator__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71590,(1),null);
var _value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71590,(2),null);
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [property__$1,operator__$1,value_SINGLEQUOTE___$1], null);
}));
}));
return (set_filters_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_filters_BANG_.cljs$core$IFn$_invoke$arity$1(new_filters) : set_filters_BANG_.call(null,new_filters));
});
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(value__$1,"Custom date")){
var G__71593 = e__$1.target;
var G__71594 = frontend.ui.nlp_calendar(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"initial-focus","initial-focus",1154999719),true,new cljs.core.Keyword(null,"datetime?","datetime?",-1173480100),false,new cljs.core.Keyword(null,"on-day-click","on-day-click",1918658076),(function (value__$2){
set_filters_fn(value__$2);

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
})], null));
var G__71595 = cljs.core.PersistentArrayMap.EMPTY;
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__71593,G__71594,G__71595) : logseq.shui.ui.popup_show_BANG_.call(null,G__71593,G__71594,G__71595));
} else {
return set_filters_fn(value_SINGLEQUOTE_);
}
})], null);
if(many_QMARK_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(G__71588,new cljs.core.Keyword(null,"multiple-choices?","multiple-choices?",-1858892490),true,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"selected-choices","selected-choices",1913324317),value], 0));
} else {
return G__71588;
}
})();
return frontend.components.select.select(option);
});
var G__71587 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"start","start",-355208981)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__71585,G__71586,G__71587) : logseq.shui.ui.popup_show_BANG_.call(null,G__71585,G__71586,G__71587));
})());
}));
}));
}));
})], null);
var G__71584 = (function (){var value__$1 = ((cljs.core.uuid_QMARK_(value))?(function (){var G__71596 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),value], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__71596) : frontend.db.entity.call(null,G__71596));
})():(((value instanceof Date))?(function (){var G__71597 = cljs_time.coerce.to_date(value);
var G__71597__$1 = (((G__71597 == null))?null:cljs_time.core.to_default_time_zone(G__71597));
if((G__71597__$1 == null)){
return null;
} else {
return cljs_time.format.unparse(cljs_time.format.formatter.cljs$core$IFn$_invoke$arity$1("yyyy-MM-dd"),G__71597__$1);
}
})():((((cljs.core.coll_QMARK_(value)) && (cljs.core.every_QMARK_(cljs.core.uuid_QMARK_,value))))?cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p1__71562_SHARP_){
var G__71598 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),p1__71562_SHARP_], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__71598) : frontend.db.entity.call(null,G__71598));
}),value):value
)));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.items-center.gap-1.text-xs","div.flex.flex-row.items-center.gap-1.text-xs",1157558383),((datascript.impl.entity.entity_QMARK_(value__$1))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),frontend.components.views.get_property_value_content(value__$1)], null):((typeof value__$1 === 'string')?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),value__$1], null):((cljs.core.boolean_QMARK_(value__$1))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),cljs.core.str.cljs$core$IFn$_invoke$arity$1(value__$1)], null):((cljs.core.seq(value__$1))?cljs.core.interpose.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"or"], null),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (v){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),frontend.components.views.get_property_value_content(v)], null);
}),value__$1)):"All"
))))], null);
})();
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__71583,G__71584) : logseq.shui.ui.button.call(null,G__71583,G__71584));
})());
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.views/filter-value-select");
frontend.components.views.filter_value = rum.core.lazy_build(rum.core.build_defc,(function (view_entity,table,property,operator,value,filters,set_filters_BANG_,idx,opts){
var number_operator_QMARK_ = clojure.string.starts_with_QMARK_(cljs.core.name(operator),"number-");
var G__71599 = operator;
var G__71599__$1 = (((G__71599 instanceof cljs.core.Keyword))?G__71599.fqn:null);
switch (G__71599__$1) {
case "between":
return frontend.components.views.between(property,value,filters,set_filters_BANG_,idx);

break;
case "text-contains":
case "text-not-contains":
case "number-gt":
case "number-lt":
case "number-gte":
case "number-lte":
return daiquiri.interpreter.interpret((function (){var G__71605 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"auto-focus","auto-focus",1250006231),false,new cljs.core.Keyword(null,"value","value",305978217),(function (){var or__5002__auto__ = value;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})(),new cljs.core.Keyword(null,"onChange","onChange",-312891301),(function (e){
var value__$1 = frontend.util.evalue(e);
var number_value = (function (){var and__5000__auto__ = number_operator_QMARK_;
if(and__5000__auto__){
if(clojure.string.blank_QMARK_(value__$1)){
return null;
} else {
return frontend.util.safe_parse_float(value__$1);
}
} else {
return and__5000__auto__;
}
})();
var new_filters = cljs.core.update.cljs$core$IFn$_invoke$arity$3(filters,new cljs.core.Keyword(null,"filters","filters",974726919),(function (col){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(col,idx,(function (p__71606){
var vec__71607 = p__71606;
var property__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71607,(0),null);
var operator__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71607,(1),null);
var _value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71607,(2),null);
if(((number_operator_QMARK_) && ((number_value == null)))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [property__$1,operator__$1], null);
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [property__$1,operator__$1,(function (){var or__5002__auto__ = number_value;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return value__$1;
}
})()], null);
}
}));
}));
return (set_filters_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_filters_BANG_.cljs$core$IFn$_invoke$arity$1(new_filters) : set_filters_BANG_.call(null,new_filters));
}),new cljs.core.Keyword(null,"class","class",-2030961996),"w-24 !h-6 !py-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0"], null);
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__71605) : logseq.shui.ui.input.call(null,G__71605));
})());

break;
default:
return frontend.components.views.filter_value_select(view_entity,table,property,value,operator,idx,opts);

}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.views/filter-value");
frontend.components.views.filters_row = rum.core.lazy_build(rum.core.build_defc,(function (view_entity,p__71612,opts){
var map__71613 = p__71612;
var map__71613__$1 = cljs.core.__destructure_map(map__71613);
var table = map__71613__$1;
var data_fns = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71613__$1,new cljs.core.Keyword(null,"data-fns","data-fns",-1065218324));
var columns = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71613__$1,new cljs.core.Keyword(null,"columns","columns",1998437288));
var filters = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(table,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"state","state",-1988618099),new cljs.core.Keyword(null,"filters","filters",974726919)], null));
var map__71615 = data_fns;
var map__71615__$1 = cljs.core.__destructure_map(map__71615);
var set_filters_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71615__$1,new cljs.core.Keyword(null,"set-filters!","set-filters!",385623142));
if(cljs.core.seq(new cljs.core.Keyword(null,"filters","filters",974726919).cljs$core$IFn$_invoke$arity$1(filters))){
return daiquiri.core.create_element("div",{'className':"filters-row flex flex-row items-center gap-4 justify-between flex-wrap py-2"},[(function (){var attrs71637 = cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2((function (idx,filter_SINGLEQUOTE_){
var vec__71671 = filter_SINGLEQUOTE_;
var property_ident = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71671,(0),null);
var operator = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71671,(1),null);
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71671,(2),null);
var property = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(property_ident,new cljs.core.Keyword("block","title","block/title",710445684)))?new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","ident","db/ident",-737096),property_ident,new cljs.core.Keyword("block","title","block/title",710445684),"Name"], null):(function (){var or__5002__auto__ = (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(property_ident) : frontend.db.entity.call(null,property_ident));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.some((function (column){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column),property_ident)){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(column)], null);
} else {
return null;
}
}),columns);
}
})());
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.items-center.border.rounded","div.flex.flex-row.items-center.border.rounded",-1595973469),(function (){var G__71674 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"class","class",-2030961996),"!px-2 rounded-none border-r",new cljs.core.Keyword(null,"variant","variant",-424354234),"ghost",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),true], null);
var G__71675 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-xs","span.text-xs",63518557),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(property)], null);
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__71674,G__71675) : logseq.shui.ui.button.call(null,G__71674,G__71675));
})(),frontend.components.views.filter_operator(property,operator,filters,set_filters_BANG_,idx),frontend.components.views.filter_value(view_entity,table,property,operator,value,filters,set_filters_BANG_,idx,opts),(function (){var G__71676 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"class","class",-2030961996),"!px-1 rounded-none text-muted-foreground",new cljs.core.Keyword(null,"variant","variant",-424354234),"ghost",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_e){
var new_filters = cljs.core.update.cljs$core$IFn$_invoke$arity$3(filters,new cljs.core.Keyword(null,"filters","filters",974726919),(function (col){
return cljs.core.vec(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentHashSet.createAsIfByAssoc([filter_SINGLEQUOTE_]),col));
}));
return (set_filters_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_filters_BANG_.cljs$core$IFn$_invoke$arity$1(new_filters) : set_filters_BANG_.call(null,new_filters));
})], null);
var G__71677 = frontend.ui.icon("x");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__71676,G__71677) : logseq.shui.ui.button.call(null,G__71676,G__71677));
})()], null);
}),new cljs.core.Keyword(null,"filters","filters",974726919).cljs$core$IFn$_invoke$arity$1(filters));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs71637))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","items-center","gap-2"], null)], null),attrs71637], 0))):{'className':"flex flex-row items-center gap-2"}),((cljs.core.map_QMARK_(attrs71637))?null:[daiquiri.interpreter.interpret(attrs71637)]));
})(),(((cljs.core.count(new cljs.core.Keyword(null,"filters","filters",974726919).cljs$core$IFn$_invoke$arity$1(filters)) > (1)))?(function (){var attrs71669 = (function (){var G__71680 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"default-value","default-value",232220170),(cljs.core.truth_(new cljs.core.Keyword(null,"or?","or?",-1226532173).cljs$core$IFn$_invoke$arity$1(filters))?"or":"and"),new cljs.core.Keyword(null,"on-value-change","on-value-change",-621835289),(function (v){
var G__71684 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(filters,new cljs.core.Keyword(null,"or?","or?",-1226532173),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(v,"or"));
return (set_filters_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_filters_BANG_.cljs$core$IFn$_invoke$arity$1(G__71684) : set_filters_BANG_.call(null,G__71684));
})], null);
var G__71681 = (function (){var G__71685 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"opacity-75 hover:opacity-100 !px-2 !py-0 !h-6"], null);
var G__71686 = (function (){var G__71687 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"Match"], null);
return (logseq.shui.ui.select_value.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_value.cljs$core$IFn$_invoke$arity$1(G__71687) : logseq.shui.ui.select_value.call(null,G__71687));
})();
return (logseq.shui.ui.select_trigger.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_trigger.cljs$core$IFn$_invoke$arity$2(G__71685,G__71686) : logseq.shui.ui.select_trigger.call(null,G__71685,G__71686));
})();
var G__71682 = (function (){var G__71688 = (function (){var G__71689 = (function (){var G__71691 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"value","value",305978217),"and"], null);
var G__71692 = "Match all filters";
return (logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2(G__71691,G__71692) : logseq.shui.ui.select_item.call(null,G__71691,G__71692));
})();
var G__71690 = (function (){var G__71693 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"value","value",305978217),"or"], null);
var G__71694 = "Match any filter";
return (logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2(G__71693,G__71694) : logseq.shui.ui.select_item.call(null,G__71693,G__71694));
})();
return (logseq.shui.ui.select_group.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_group.cljs$core$IFn$_invoke$arity$2(G__71689,G__71690) : logseq.shui.ui.select_group.call(null,G__71689,G__71690));
})();
return (logseq.shui.ui.select_content.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_content.cljs$core$IFn$_invoke$arity$1(G__71688) : logseq.shui.ui.select_content.call(null,G__71688));
})();
return (logseq.shui.ui.select.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.select.cljs$core$IFn$_invoke$arity$3(G__71680,G__71681,G__71682) : logseq.shui.ui.select.call(null,G__71680,G__71681,G__71682));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs71669))?daiquiri.interpreter.element_attributes(attrs71669):null),((cljs.core.map_QMARK_(attrs71669))?null:[daiquiri.interpreter.interpret(attrs71669)]));
})():null)]);
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.views/filters-row");
frontend.components.views.new_record_button = rum.core.lazy_build(rum.core.build_defc,(function (table,view_entity){
var asset_QMARK_ = (function (){var and__5000__auto__ = new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160).cljs$core$IFn$_invoke$arity$1(view_entity);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(view_entity),"asset");
} else {
return and__5000__auto__;
}
})();
return frontend.ui.tooltip((function (){var G__71701 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),"ghost",new cljs.core.Keyword(null,"class","class",-2030961996),"!px-1 text-muted-foreground",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_){
var f = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(table,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"data-fns","data-fns",-1065218324),new cljs.core.Keyword(null,"add-new-object!","add-new-object!",622560106)], null));
return (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(view_entity,table) : f.call(null,view_entity,table));
})], null);
var G__71702 = frontend.ui.icon((cljs.core.truth_(asset_QMARK_)?"upload":"plus"));
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__71701,G__71702) : logseq.shui.ui.button.call(null,G__71701,G__71702));
})(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"New node"], null));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.views/new-record-button");
frontend.components.views.add_new_row = rum.core.lazy_build(rum.core.build_defc,(function (view_entity,table){
return daiquiri.core.create_element("div",{'onClick':(function (_){
var f = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(table,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"data-fns","data-fns",-1065218324),new cljs.core.Keyword(null,"add-new-object!","add-new-object!",622560106)], null));
return (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(view_entity,table) : f.call(null,view_entity,table));
}),'className':"py-1 px-2 cursor-pointer flex flex-row items-center gap-1 text-muted-foreground hover:text-foreground w-full text-sm border-b"},[daiquiri.interpreter.interpret(frontend.ui.icon("plus",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(14)], null))),daiquiri.core.create_element("div",null,["New"])]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.views/add-new-row");
frontend.components.views.table_filters__GT_persist_state = (function frontend$components$views$table_filters__GT_persist_state(filters){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p__71711){
var vec__71712 = p__71711;
var property = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71712,(0),null);
var operator = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71712,(1),null);
var matches = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71712,(2),null);
var matches_SINGLEQUOTE_ = ((datascript.impl.entity.entity_QMARK_(matches))?new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(matches):((((cljs.core.coll_QMARK_(matches)) && (cljs.core.every_QMARK_(datascript.impl.entity.entity_QMARK_,matches))))?cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),matches)):matches
));
if((!((matches_SINGLEQUOTE_ == null)))){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [property,operator,matches_SINGLEQUOTE_], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [property,operator], null);
}
}),filters);
});
frontend.components.views.db_set_table_state_BANG_ = (function frontend$components$views$db_set_table_state_BANG_(entity,p__71715){
var map__71716 = p__71715;
var map__71716__$1 = cljs.core.__destructure_map(map__71716);
var set_sorting_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71716__$1,new cljs.core.Keyword(null,"set-sorting!","set-sorting!",543042376));
var set_filters_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71716__$1,new cljs.core.Keyword(null,"set-filters!","set-filters!",385623142));
var set_visible_columns_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71716__$1,new cljs.core.Keyword(null,"set-visible-columns!","set-visible-columns!",729806223));
var set_ordered_columns_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71716__$1,new cljs.core.Keyword(null,"set-ordered-columns!","set-ordered-columns!",-315299263));
var set_sized_columns_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71716__$1,new cljs.core.Keyword(null,"set-sized-columns!","set-sized-columns!",899502581));
var repo = frontend.state.get_current_repo();
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0();
return new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"set-sorting!","set-sorting!",543042376),(function (sorting){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(db_based_QMARK_)?frontend.handler.property.set_block_property_BANG_(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity),new cljs.core.Keyword("logseq.property.table","sorting","logseq.property.table/sorting",208102594),sorting):null)),(function (___40947__auto__){
return promesa.protocols._promise((set_sorting_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_sorting_BANG_.cljs$core$IFn$_invoke$arity$1(sorting) : set_sorting_BANG_.call(null,sorting)));
}));
}));
}),new cljs.core.Keyword(null,"set-filters!","set-filters!",385623142),(function (filters){
var filters__$1 = cljs.core.update.cljs$core$IFn$_invoke$arity$3(cljs.core.update.cljs$core$IFn$_invoke$arity$3(filters,new cljs.core.Keyword(null,"filters","filters",974726919),frontend.components.views.table_filters__GT_persist_state),new cljs.core.Keyword(null,"or?","or?",-1226532173),cljs.core.boolean$);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(db_based_QMARK_)?frontend.handler.property.set_block_property_BANG_(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity),new cljs.core.Keyword("logseq.property.table","filters","logseq.property.table/filters",-1702393633),filters__$1):null)),(function (___40947__auto__){
return promesa.protocols._promise((set_filters_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_filters_BANG_.cljs$core$IFn$_invoke$arity$1(filters__$1) : set_filters_BANG_.call(null,filters__$1)));
}));
}));
}),new cljs.core.Keyword(null,"set-visible-columns!","set-visible-columns!",729806223),(function (columns){
var hidden_columns = cljs.core.vec(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__71720){
var vec__71721 = p__71720;
var column = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71721,(0),null);
var visible_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71721,(1),null);
if(visible_QMARK_ === false){
return column;
} else {
return null;
}
}),columns));
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(db_based_QMARK_)?frontend.handler.property.set_block_property_BANG_(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity),new cljs.core.Keyword("logseq.property.table","hidden-columns","logseq.property.table/hidden-columns",975057192),hidden_columns):null)),(function (___40947__auto__){
return promesa.protocols._promise((set_visible_columns_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_visible_columns_BANG_.cljs$core$IFn$_invoke$arity$1(columns) : set_visible_columns_BANG_.call(null,columns)));
}));
}));
}),new cljs.core.Keyword(null,"set-ordered-columns!","set-ordered-columns!",-315299263),(function (ordered_columns){
var ids = cljs.core.vec(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"select","select",1147833503),null], null), null),ordered_columns));
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(db_based_QMARK_)?frontend.handler.property.set_block_property_BANG_(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity),new cljs.core.Keyword("logseq.property.table","ordered-columns","logseq.property.table/ordered-columns",1485587100),ids):null)),(function (___40947__auto__){
return promesa.protocols._promise((set_ordered_columns_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_ordered_columns_BANG_.cljs$core$IFn$_invoke$arity$1(ordered_columns) : set_ordered_columns_BANG_.call(null,ordered_columns)));
}));
}));
}),new cljs.core.Keyword(null,"set-sized-columns!","set-sized-columns!",899502581),(function (sized_columns){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(db_based_QMARK_)?frontend.handler.property.set_block_property_BANG_(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity),new cljs.core.Keyword("logseq.property.table","sized-columns","logseq.property.table/sized-columns",-1675510555),sized_columns):null)),(function (___40947__auto__){
return promesa.protocols._promise((set_sized_columns_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_sized_columns_BANG_.cljs$core$IFn$_invoke$arity$1(sized_columns) : set_sized_columns_BANG_.call(null,sized_columns)));
}));
}));
})], null);
});
frontend.components.views.lazy_item = rum.core.lazy_build(rum.core.build_defc,(function (data,idx,p__71724,item_render){
var map__71725 = p__71724;
var map__71725__$1 = cljs.core.__destructure_map(map__71725);
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71725__$1,new cljs.core.Keyword(null,"properties","properties",685819552));
var list_view_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71725__$1,new cljs.core.Keyword(null,"list-view?","list-view?",499477951));
var scrolling_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71725__$1,new cljs.core.Keyword(null,"scrolling?","scrolling?",-365022499));
var item = frontend.util.nth_safe(data,idx);
var db_id = ((cljs.core.map_QMARK_(item))?new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(item):((typeof item === 'number')?item:null
));
var vec__71727 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_state.call(null,null));
var item__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71727,(0),null);
var set_item_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71727,(1),null);
var opts = (cljs.core.truth_(list_view_QMARK_)?new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"skip-refresh?","skip-refresh?",878432095),true,new cljs.core.Keyword(null,"children?","children?",-1199594108),false], null):new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"children?","children?",-1199594108),false,new cljs.core.Keyword(null,"properties","properties",685819552),properties,new cljs.core.Keyword(null,"skip-transact?","skip-transact?",-1820887310),true,new cljs.core.Keyword(null,"skip-refresh?","skip-refresh?",878432095),true], null));
logseq.shui.hooks.use_effect_BANG_((function (){
return frontend.common.missionary.run_task_STAR_(cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr71730_block_4 = (function frontend$components$views$cr71730_block_4(cr71730_state){
try{var cr71730_place_12 = null;
(cr71730_state[(0)] = cr71730_block_10);

(cr71730_state[(1)] = cr71730_place_12);

return cr71730_state;
}catch (e71764){var cr71730_exception = e71764;
(cr71730_state[(0)] = null);

(cr71730_state[(1)] = null);

throw cr71730_exception;
}});
var cr71730_block_5 = (function frontend$components$views$cr71730_block_5(cr71730_state){
try{var cr71730_place_13 = frontend.common.missionary._LT__BANG_;
var cr71730_place_14 = frontend.db.async._LT_get_block;
var cr71730_place_15 = frontend.state.get_current_repo;
var cr71730_place_16 = (function (){var fexpr__71766 = cr71730_place_15;
return (fexpr__71766.cljs$core$IFn$_invoke$arity$0 ? fexpr__71766.cljs$core$IFn$_invoke$arity$0() : fexpr__71766.call(null));
})();
var cr71730_place_17 = db_id;
var cr71730_place_18 = opts;
var cr71730_place_19 = (function (){var G__71768 = cr71730_place_16;
var G__71769 = cr71730_place_17;
var G__71770 = cr71730_place_18;
var fexpr__71767 = cr71730_place_14;
return (fexpr__71767.cljs$core$IFn$_invoke$arity$3 ? fexpr__71767.cljs$core$IFn$_invoke$arity$3(G__71768,G__71769,G__71770) : fexpr__71767.call(null,G__71768,G__71769,G__71770));
})();
var cr71730_place_20 = (function (){var G__71772 = cr71730_place_19;
var fexpr__71771 = cr71730_place_13;
return (fexpr__71771.cljs$core$IFn$_invoke$arity$1 ? fexpr__71771.cljs$core$IFn$_invoke$arity$1(G__71772) : fexpr__71771.call(null,G__71772));
})();
(cr71730_state[(0)] = cr71730_block_6);

return missionary.core.park(cr71730_place_20);
}catch (e71765){var cr71730_exception = e71765;
(cr71730_state[(0)] = null);

(cr71730_state[(1)] = null);

throw cr71730_exception;
}});
var cr71730_block_2 = (function frontend$components$views$cr71730_block_2(cr71730_state){
try{var cr71730_place_4 = cljs.core.not;
var cr71730_place_5 = item__$1;
var cr71730_place_6 = (function (){var G__71775 = cr71730_place_5;
var fexpr__71774 = cr71730_place_4;
return (fexpr__71774.cljs$core$IFn$_invoke$arity$1 ? fexpr__71774.cljs$core$IFn$_invoke$arity$1(G__71775) : fexpr__71774.call(null,G__71775));
})();
var cr71730_place_7 = cljs.core.not;
var cr71730_place_8 = scrolling_QMARK_;
var cr71730_place_9 = (function (){var G__71777 = cr71730_place_8;
var fexpr__71776 = cr71730_place_7;
return (fexpr__71776.cljs$core$IFn$_invoke$arity$1 ? fexpr__71776.cljs$core$IFn$_invoke$arity$1(G__71777) : fexpr__71776.call(null,G__71777));
})();
var cr71730_place_10 = ((cr71730_place_6) && (cr71730_place_9));
(cr71730_state[(0)] = cr71730_block_3);

(cr71730_state[(2)] = cr71730_place_10);

return cr71730_state;
}catch (e71773){var cr71730_exception = e71773;
(cr71730_state[(0)] = null);

(cr71730_state[(2)] = null);

throw cr71730_exception;
}});
var cr71730_block_3 = (function frontend$components$views$cr71730_block_3(cr71730_state){
try{var cr71730_place_2 = (cr71730_state[(2)]);
var cr71730_place_11 = null;
if(cljs.core.truth_(cr71730_place_2)){
(cr71730_state[(0)] = cr71730_block_5);

(cr71730_state[(2)] = null);

(cr71730_state[(1)] = cr71730_place_11);

return cr71730_state;
} else {
(cr71730_state[(0)] = cr71730_block_4);

(cr71730_state[(2)] = null);

(cr71730_state[(1)] = cr71730_place_11);

return cr71730_state;
}
}catch (e71778){var cr71730_exception = e71778;
(cr71730_state[(0)] = null);

(cr71730_state[(2)] = null);

throw cr71730_exception;
}});
var cr71730_block_7 = (function frontend$components$views$cr71730_block_7(cr71730_state){
try{var cr71730_place_21 = (cr71730_state[(3)]);
var cr71730_place_24 = cr71730_place_21;
(cr71730_state[(0)] = cr71730_block_9);

(cr71730_state[(3)] = null);

(cr71730_state[(2)] = cr71730_place_24);

return cr71730_state;
}catch (e71779){var cr71730_exception = e71779;
(cr71730_state[(0)] = null);

(cr71730_state[(1)] = null);

(cr71730_state[(2)] = null);

(cr71730_state[(3)] = null);

throw cr71730_exception;
}});
var cr71730_block_10 = (function frontend$components$views$cr71730_block_10(cr71730_state){
try{var cr71730_place_11 = (cr71730_state[(1)]);
(cr71730_state[(0)] = null);

(cr71730_state[(1)] = null);

return cr71730_place_11;
}catch (e71780){var cr71730_exception = e71780;
(cr71730_state[(0)] = null);

(cr71730_state[(1)] = null);

throw cr71730_exception;
}});
var cr71730_block_8 = (function frontend$components$views$cr71730_block_8(cr71730_state){
try{var cr71730_place_25 = frontend.db.entity;
var cr71730_place_26 = db_id;
var cr71730_place_27 = (function (){var G__71783 = cr71730_place_26;
var fexpr__71782 = cr71730_place_25;
return (fexpr__71782.cljs$core$IFn$_invoke$arity$1 ? fexpr__71782.cljs$core$IFn$_invoke$arity$1(G__71783) : fexpr__71782.call(null,G__71783));
})();
(cr71730_state[(0)] = cr71730_block_9);

(cr71730_state[(2)] = cr71730_place_27);

return cr71730_state;
}catch (e71781){var cr71730_exception = e71781;
(cr71730_state[(0)] = null);

(cr71730_state[(1)] = null);

(cr71730_state[(2)] = null);

throw cr71730_exception;
}});
var cr71730_block_1 = (function frontend$components$views$cr71730_block_1(cr71730_state){
try{var cr71730_place_0 = (cr71730_state[(1)]);
var cr71730_place_3 = cr71730_place_0;
(cr71730_state[(0)] = cr71730_block_3);

(cr71730_state[(1)] = null);

(cr71730_state[(2)] = cr71730_place_3);

return cr71730_state;
}catch (e71784){var cr71730_exception = e71784;
(cr71730_state[(0)] = null);

(cr71730_state[(1)] = null);

(cr71730_state[(2)] = null);

throw cr71730_exception;
}});
var cr71730_block_9 = (function frontend$components$views$cr71730_block_9(cr71730_state){
try{var cr71730_place_23 = (cr71730_state[(2)]);
var cr71730_place_28 = set_item_BANG_;
var cr71730_place_29 = cr71730_place_23;
var cr71730_place_30 = (function (){var G__71787 = cr71730_place_29;
var fexpr__71786 = cr71730_place_28;
return (fexpr__71786.cljs$core$IFn$_invoke$arity$1 ? fexpr__71786.cljs$core$IFn$_invoke$arity$1(G__71787) : fexpr__71786.call(null,G__71787));
})();
(cr71730_state[(0)] = cr71730_block_10);

(cr71730_state[(2)] = null);

(cr71730_state[(1)] = cr71730_place_30);

return cr71730_state;
}catch (e71785){var cr71730_exception = e71785;
(cr71730_state[(0)] = null);

(cr71730_state[(1)] = null);

(cr71730_state[(2)] = null);

throw cr71730_exception;
}});
var cr71730_block_0 = (function frontend$components$views$cr71730_block_0(cr71730_state){
try{var cr71730_place_0 = db_id;
var cr71730_place_1 = cr71730_place_0;
var cr71730_place_2 = null;
if(cljs.core.truth_(cr71730_place_1)){
(cr71730_state[(0)] = cr71730_block_2);

(cr71730_state[(2)] = cr71730_place_2);

return cr71730_state;
} else {
(cr71730_state[(0)] = cr71730_block_1);

(cr71730_state[(1)] = cr71730_place_0);

(cr71730_state[(2)] = cr71730_place_2);

return cr71730_state;
}
}catch (e71788){var cr71730_exception = e71788;
(cr71730_state[(0)] = null);

throw cr71730_exception;
}});
var cr71730_block_6 = (function frontend$components$views$cr71730_block_6(cr71730_state){
try{var cr71730_place_21 = missionary.core.unpark();
var cr71730_place_22 = list_view_QMARK_;
var cr71730_place_23 = null;
if(cljs.core.truth_(cr71730_place_22)){
(cr71730_state[(0)] = cr71730_block_8);

(cr71730_state[(2)] = cr71730_place_23);

return cr71730_state;
} else {
(cr71730_state[(0)] = cr71730_block_7);

(cr71730_state[(3)] = cr71730_place_21);

(cr71730_state[(2)] = cr71730_place_23);

return cr71730_state;
}
}catch (e71789){var cr71730_exception = e71789;
(cr71730_state[(0)] = null);

(cr71730_state[(1)] = null);

throw cr71730_exception;
}});
return cloroutine.impl.coroutine((function (){var G__71790 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((4));
(G__71790[(0)] = cr71730_block_0);

return G__71790;
})());
})(),missionary.core.sp_run));
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [db_id,scrolling_QMARK_], null));

var item_SINGLEQUOTE_ = ((cljs.core.map_QMARK_(item__$1))?item__$1:((typeof item__$1 === 'number')?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","id","db/id",-1388397098),item__$1], null):null));
return daiquiri.interpreter.interpret((item_render.cljs$core$IFn$_invoke$arity$1 ? item_render.cljs$core$IFn$_invoke$arity$1(item_SINGLEQUOTE_) : item_render.call(null,item_SINGLEQUOTE_)));
}),null,"frontend.components.views/lazy-item");
frontend.components.views.table_body = rum.core.lazy_build(rum.core.build_defc,(function (table,option,rows,_STAR_scroller_ref,set_items_rendered_BANG_){
var vec__71792 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(false) : logseq.shui.hooks.use_state.call(null,false));
var scrolling_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71792,(0),null);
var set_scrolling_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71792,(1),null);
if(cljs.core.seq(rows)){
return daiquiri.interpreter.interpret((function (){var G__71796 = cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"skipAnimationFrameInResizeObserver","skipAnimationFrameInResizeObserver",1677982016),new cljs.core.Keyword(null,"ref","ref",1289896967),new cljs.core.Keyword(null,"is-scrolling","is-scrolling",982444296),new cljs.core.Keyword(null,"increase-viewport-by","increase-viewport-by",1517073864),new cljs.core.Keyword(null,"item-content","item-content",1656730280),new cljs.core.Keyword(null,"compute-item-key","compute-item-key",-621146487),new cljs.core.Keyword(null,"custom-scroll-parent","custom-scroll-parent",1031485618),new cljs.core.Keyword(null,"total-count","total-count",-1999441386),new cljs.core.Keyword(null,"context","context",-830191113),new cljs.core.Keyword(null,"items-rendered","items-rendered",1483099102)],[true,(function (p1__71791_SHARP_){
return cljs.core.reset_BANG_(_STAR_scroller_ref,p1__71791_SHARP_);
}),set_scrolling_BANG_,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"top","top",-1856271961),(300),new cljs.core.Keyword(null,"bottom","bottom",-1550509018),(300)], null),(function (idx,_user,context){
var option__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(option,new cljs.core.Keyword(null,"scrolling?","scrolling?",-365022499),context.scrolling,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"table-view?","table-view?",2073887505),true], 0));
return frontend.components.views.lazy_item(new cljs.core.Keyword(null,"data","data",-232669377).cljs$core$IFn$_invoke$arity$1(table),idx,option__$1,(function (row){
return frontend.components.views.table_row(table,row,cljs.core.PersistentArrayMap.EMPTY,option__$1);
}));
}),(function (idx){
var block_id = frontend.util.nth_safe(rows,idx);
return ["table-row-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(block_id)].join('');
}),frontend.components.views.get_scroll_parent(new cljs.core.Keyword(null,"config","config",994861415).cljs$core$IFn$_invoke$arity$1(option)),cljs.core.count(rows),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"scrolling","scrolling",349011090),scrolling_QMARK_], null),(function (props){
if(cljs.core.seq(props)){
return (set_items_rendered_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_items_rendered_BANG_.cljs$core$IFn$_invoke$arity$1(true) : set_items_rendered_BANG_.call(null,true));
} else {
return null;
}
})]);
return (frontend.ui.virtualized_list.cljs$core$IFn$_invoke$arity$1 ? frontend.ui.virtualized_list.cljs$core$IFn$_invoke$arity$1(G__71796) : frontend.ui.virtualized_list.call(null,G__71796));
})());
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.views/table-body");
frontend.components.views.table_view = rum.core.lazy_build(rum.core.build_defc,(function (table,option,row_selection,_STAR_scroller_ref){
var selected_rows = (function (){var G__71800 = row_selection;
var G__71801 = new cljs.core.Keyword(null,"rows","rows",850049680).cljs$core$IFn$_invoke$arity$1(table);
return (logseq.shui.ui.table_get_selection_rows.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.table_get_selection_rows.cljs$core$IFn$_invoke$arity$2(G__71800,G__71801) : logseq.shui.ui.table_get_selection_rows.call(null,G__71800,G__71801));
})();
var vec__71797 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(false) : logseq.shui.hooks.use_state.call(null,false));
var items_rendered_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71797,(0),null);
var set_items_rendered_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71797,(1),null);
return daiquiri.interpreter.interpret(logseq.shui.ui.table((function (){var rows = new cljs.core.Keyword(null,"rows","rows",850049680).cljs$core$IFn$_invoke$arity$1(table);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.ls-table-rows.content.overflow-x-auto.force-visible-scrollbar","div.ls-table-rows.content.overflow-x-auto.force-visible-scrollbar",-221099795),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.relative","div.relative",430334058),frontend.components.views.table_header(table,option,selected_rows),frontend.components.views.table_body(table,option,rows,_STAR_scroller_ref,set_items_rendered_BANG_),(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(table,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"data-fns","data-fns",-1065218324),new cljs.core.Keyword(null,"add-new-object!","add-new-object!",622560106)], null));
if(cljs.core.truth_(and__5000__auto__)){
var or__5002__auto__ = cljs.core.empty_QMARK_(rows);
if(or__5002__auto__){
return or__5002__auto__;
} else {
return items_rendered_QMARK_;
}
} else {
return and__5000__auto__;
}
})())?logseq.shui.ui.table_footer(frontend.components.views.add_new_row(new cljs.core.Keyword(null,"view-entity","view-entity",-1084117808).cljs$core$IFn$_invoke$arity$1(option),table)):null)], null)], null);
})()));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.views/table-view");
frontend.components.views.list_view = rum.core.lazy_build(rum.core.build_defc,(function (p__71803,_view_entity,p__71804,_STAR_scroller_ref){
var map__71805 = p__71803;
var map__71805__$1 = cljs.core.__destructure_map(map__71805);
var option = map__71805__$1;
var config = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71805__$1,new cljs.core.Keyword(null,"config","config",994861415));
var map__71806 = p__71804;
var map__71806__$1 = cljs.core.__destructure_map(map__71806);
var rows = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71806__$1,new cljs.core.Keyword(null,"rows","rows",850049680));
var lazy_item_render = (function (rows__$1,idx){
return frontend.components.views.lazy_item(rows__$1,idx,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(option,new cljs.core.Keyword(null,"list-view?","list-view?",499477951),true),(function (block){
return frontend.components.views.block_container(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(config,new cljs.core.Keyword(null,"list-view?","list-view?",499477951),true,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"block-level","block-level",390971879),(1)], 0)),block);
}));
});
var list_cp = (function (rows__$1){
if(cljs.core.seq(rows__$1)){
var G__71807 = new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"ref","ref",1289896967),(function (p1__71802_SHARP_){
return cljs.core.reset_BANG_(_STAR_scroller_ref,p1__71802_SHARP_);
}),new cljs.core.Keyword(null,"class","class",-2030961996),"content",new cljs.core.Keyword(null,"custom-scroll-parent","custom-scroll-parent",1031485618),frontend.components.views.get_scroll_parent(config),new cljs.core.Keyword(null,"increase-viewport-by","increase-viewport-by",1517073864),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"top","top",-1856271961),(64),new cljs.core.Keyword(null,"bottom","bottom",-1550509018),(64)], null),new cljs.core.Keyword(null,"compute-item-key","compute-item-key",-621146487),(function (idx){
var block_id = frontend.util.nth_safe(rows__$1,idx);
return ["list-row-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(block_id)].join('');
}),new cljs.core.Keyword(null,"total-count","total-count",-1999441386),cljs.core.count(rows__$1),new cljs.core.Keyword(null,"skipAnimationFrameInResizeObserver","skipAnimationFrameInResizeObserver",1677982016),true,new cljs.core.Keyword(null,"item-content","item-content",1656730280),(function (idx){
return lazy_item_render(rows__$1,idx);
})], null);
return (frontend.ui.virtualized_list.cljs$core$IFn$_invoke$arity$1 ? frontend.ui.virtualized_list.cljs$core$IFn$_invoke$arity$1(G__71807) : frontend.ui.virtualized_list.call(null,G__71807));
} else {
return null;
}
});
var breadcrumb = frontend.state.get_component(new cljs.core.Keyword("block","breadcrumb","block/breadcrumb",1725167425));
var all_numbers_QMARK_ = cljs.core.every_QMARK_(cljs.core.number_QMARK_,rows);
if(all_numbers_QMARK_){
return daiquiri.interpreter.interpret(list_cp(rows));
} else {
return cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$views$iter__71808(s__71809){
return (new cljs.core.LazySeq(null,(function (){
var s__71809__$1 = s__71809;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__71809__$1);
if(temp__5804__auto__){
var s__71809__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__71809__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__71809__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__71811 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__71810 = (0);
while(true){
if((i__71810 < size__5479__auto__)){
var vec__71812 = cljs.core._nth(c__5478__auto__,i__71810);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71812,(0),null);
var row = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71812,(1),null);
cljs.core.chunk_append(b__71811,((((cljs.core.vector_QMARK_(row)) && (cljs.core.uuid_QMARK_(cljs.core.first(row)))))?(function (){var vec__71815 = row;
var first_block_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71815,(0),null);
var blocks = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71815,(1),null);
return daiquiri.core.create_element("div",{'key':["partition-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(first_block_id)].join('')},[(function (){var attrs71826 = (function (){var G__71827 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"list-view?","list-view?",499477951),true);
var G__71828 = frontend.state.get_current_repo();
var G__71829 = first_block_id;
var G__71830 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"show-page?","show-page?",792494155),false], null);
return (breadcrumb.cljs$core$IFn$_invoke$arity$4 ? breadcrumb.cljs$core$IFn$_invoke$arity$4(G__71827,G__71828,G__71829,G__71830) : breadcrumb.call(null,G__71827,G__71828,G__71829,G__71830));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs71826))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ml-6","text-sm","opacity-70","hover:opacity-100","mt-1"], null)], null),attrs71826], 0))):{'className':"ml-6 text-sm opacity-70 hover:opacity-100 mt-1"}),((cljs.core.map_QMARK_(attrs71826))?null:[daiquiri.interpreter.interpret(attrs71826)]));
})(),daiquiri.interpreter.interpret(list_cp(blocks))]);
})():rum.core.with_key(lazy_item_render(rows,idx),["partition-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx)].join(''))));

var G__73239 = (i__71810 + (1));
i__71810 = G__73239;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__71811),frontend$components$views$iter__71808(cljs.core.chunk_rest(s__71809__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__71811),null);
}
} else {
var vec__71831 = cljs.core.first(s__71809__$2);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71831,(0),null);
var row = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71831,(1),null);
return cljs.core.cons(((((cljs.core.vector_QMARK_(row)) && (cljs.core.uuid_QMARK_(cljs.core.first(row)))))?(function (){var vec__71834 = row;
var first_block_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71834,(0),null);
var blocks = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71834,(1),null);
return daiquiri.core.create_element("div",{'key':["partition-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(first_block_id)].join('')},[(function (){var attrs71826 = (function (){var G__71837 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"list-view?","list-view?",499477951),true);
var G__71838 = frontend.state.get_current_repo();
var G__71839 = first_block_id;
var G__71840 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"show-page?","show-page?",792494155),false], null);
return (breadcrumb.cljs$core$IFn$_invoke$arity$4 ? breadcrumb.cljs$core$IFn$_invoke$arity$4(G__71837,G__71838,G__71839,G__71840) : breadcrumb.call(null,G__71837,G__71838,G__71839,G__71840));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs71826))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ml-6","text-sm","opacity-70","hover:opacity-100","mt-1"], null)], null),attrs71826], 0))):{'className':"ml-6 text-sm opacity-70 hover:opacity-100 mt-1"}),((cljs.core.map_QMARK_(attrs71826))?null:[daiquiri.interpreter.interpret(attrs71826)]));
})(),daiquiri.interpreter.interpret(list_cp(blocks))]);
})():rum.core.with_key(lazy_item_render(rows,idx),["partition-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx)].join(''))),frontend$components$views$iter__71808(cljs.core.rest(s__71809__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(medley.core.indexed.cljs$core$IFn$_invoke$arity$1(rows));
})());
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.views/list-view");
frontend.components.views.gallery_card_item = rum.core.lazy_build(rum.core.build_defc,(function (view_entity,block,config){
return daiquiri.core.create_element("div",{'key':["view-card-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_entity)),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block))].join(''),'className':"ls-card-item content"},[daiquiri.core.create_element("div",{'className':"-ml-4"},[frontend.components.views.block_container(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(config,new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"gallery-view?","gallery-view?",1298131224),true,new cljs.core.Keyword(null,"view?","view?",655244230),true], 0)),block)])]);
}),null,"frontend.components.views/gallery-card-item");
frontend.components.views.gallery_view = rum.core.lazy_build(rum.core.build_defcs,(function (state,p__71845,table,view_entity,blocks,_STAR_scroller_ref){
var map__71846 = p__71845;
var map__71846__$1 = cljs.core.__destructure_map(map__71846);
var config = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71846__$1,new cljs.core.Keyword(null,"config","config",994861415));
var config_SINGLEQUOTE_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"container-id","container-id",1274665684),new cljs.core.Keyword(null,"container-id","container-id",1274665684).cljs$core$IFn$_invoke$arity$1(state));
var attrs71844 = ((cljs.core.seq(blocks))?(function (){var G__71847 = new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"ref","ref",1289896967),(function (p1__71841_SHARP_){
return cljs.core.reset_BANG_(_STAR_scroller_ref,p1__71841_SHARP_);
}),new cljs.core.Keyword(null,"total-count","total-count",-1999441386),cljs.core.count(blocks),new cljs.core.Keyword(null,"custom-scroll-parent","custom-scroll-parent",1031485618),frontend.components.views.get_scroll_parent(config),new cljs.core.Keyword(null,"skipAnimationFrameInResizeObserver","skipAnimationFrameInResizeObserver",1677982016),true,new cljs.core.Keyword(null,"compute-item-key","compute-item-key",-621146487),(function (idx){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_entity)),"-card-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx)].join('');
}),new cljs.core.Keyword(null,"item-content","item-content",1656730280),(function (idx){
return frontend.components.views.lazy_item(new cljs.core.Keyword(null,"data","data",-232669377).cljs$core$IFn$_invoke$arity$1(table),idx,cljs.core.PersistentArrayMap.EMPTY,(function (block){
return frontend.components.views.gallery_card_item(view_entity,block,config_SINGLEQUOTE_);
}));
})], null);
return (frontend.ui.virtualized_grid.cljs$core$IFn$_invoke$arity$1 ? frontend.ui.virtualized_grid.cljs$core$IFn$_invoke$arity$1(G__71847) : frontend.ui.virtualized_grid.call(null,G__71847));
})():null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs71844))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ls-cards"], null)], null),attrs71844], 0))):{'className':"ls-cards"}),((cljs.core.map_QMARK_(attrs71844))?null:[daiquiri.interpreter.interpret(attrs71844)]));
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$,frontend.mixins.container_id], null),"frontend.components.views/gallery-view");
frontend.components.views.run_effects_BANG_ = (function frontend$components$views$run_effects_BANG_(option,p__71848,_STAR_scroller_ref,gallery_QMARK_){
var map__71849 = p__71848;
var map__71849__$1 = cljs.core.__destructure_map(map__71849);
var data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71849__$1,new cljs.core.Keyword(null,"data","data",-232669377));
return logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword(null,"current-page?","current-page?",-1491305079).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"config","config",994861415).cljs$core$IFn$_invoke$arity$1(option));
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = cljs.core.seq(data);
if(and__5000__auto____$1){
var and__5000__auto____$2 = cljs.core.map_QMARK_(cljs.core.first(data));
if(and__5000__auto____$2){
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(cljs.core.first(data));
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
frontend.handler.ui.scroll_to_anchor_block(cljs.core.deref(_STAR_scroller_ref),data,gallery_QMARK_);

return frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","virtualized-scroll-fn","editor/virtualized-scroll-fn",-343790237),(function (){
return frontend.handler.ui.scroll_to_anchor_block(cljs.core.deref(_STAR_scroller_ref),data,gallery_QMARK_);
}));
} else {
return null;
}
}),cljs.core.PersistentVector.EMPTY);
});
frontend.components.views.view_sorting_item = rum.core.lazy_build(rum.core.build_defc,(function (table,sorting,id,name,asc_QMARK_,set_sorting_BANG_){
return daiquiri.core.create_element("div",{'className':"flex flex-row gap-2 items-center justify-between px-2"},[(function (){var attrs71854 = (function (){var G__71888 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"class","class",-2030961996),"!px-1",new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"title","title",636505583),"Drag && Drop to reorder"], null);
var G__71889 = logseq.shui.ui.tabler_icon("grip-vertical",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(14)], null));
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__71888,G__71889) : logseq.shui.ui.button.call(null,G__71888,G__71889));
})();
return daiquiri.core.create_element("div:div",((cljs.core.map_QMARK_(attrs71854))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","gap-1","items-center"], null)], null),attrs71854], 0))):{'className':"flex flex-row gap-1 items-center"}),((cljs.core.map_QMARK_(attrs71854))?[daiquiri.core.create_element("div",{'className':"text-muted-foreground whitespace-nowrap"},[[cljs.core.str.cljs$core$IFn$_invoke$arity$1(name),":"].join('')])]:[daiquiri.interpreter.interpret(attrs71854),daiquiri.core.create_element("div",{'className':"text-muted-foreground whitespace-nowrap"},[[cljs.core.str.cljs$core$IFn$_invoke$arity$1(name),":"].join('')])]));
})(),(function (){var attrs71887 = (function (){var G__71890 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"default-value","default-value",232220170),(cljs.core.truth_(asc_QMARK_)?"asc":"desc"),new cljs.core.Keyword(null,"on-value-change","on-value-change",-621835289),(function (v){
var asc_QMARK___$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(v,"asc");
var f = new cljs.core.Keyword(null,"column-set-sorting!","column-set-sorting!",892954674).cljs$core$IFn$_invoke$arity$1(table);
if(cljs.core.truth_(f)){
var G__71893 = sorting;
var G__71894 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"id","id",-1388402092),id], null);
var G__71895 = asc_QMARK___$1;
return (f.cljs$core$IFn$_invoke$arity$3 ? f.cljs$core$IFn$_invoke$arity$3(G__71893,G__71894,G__71895) : f.call(null,G__71893,G__71894,G__71895));
} else {
return null;
}
})], null);
var G__71891 = (function (){var G__71896 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"order-button !px-2 !py-0 !h-8"], null);
var G__71897 = (function (){var G__71898 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"Select order"], null);
return (logseq.shui.ui.select_value.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_value.cljs$core$IFn$_invoke$arity$1(G__71898) : logseq.shui.ui.select_value.call(null,G__71898));
})();
return (logseq.shui.ui.select_trigger.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_trigger.cljs$core$IFn$_invoke$arity$2(G__71896,G__71897) : logseq.shui.ui.select_trigger.call(null,G__71896,G__71897));
})();
var G__71892 = (function (){var G__71899 = (function (){var G__71900 = (function (){var G__71902 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"value","value",305978217),"asc"], null);
var G__71903 = "Ascending";
return (logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2(G__71902,G__71903) : logseq.shui.ui.select_item.call(null,G__71902,G__71903));
})();
var G__71901 = (function (){var G__71904 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"value","value",305978217),"desc"], null);
var G__71905 = "Descending";
return (logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2(G__71904,G__71905) : logseq.shui.ui.select_item.call(null,G__71904,G__71905));
})();
return (logseq.shui.ui.select_group.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_group.cljs$core$IFn$_invoke$arity$2(G__71900,G__71901) : logseq.shui.ui.select_group.call(null,G__71900,G__71901));
})();
return (logseq.shui.ui.select_content.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_content.cljs$core$IFn$_invoke$arity$1(G__71899) : logseq.shui.ui.select_content.call(null,G__71899));
})();
return (logseq.shui.ui.select.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.select.cljs$core$IFn$_invoke$arity$3(G__71890,G__71891,G__71892) : logseq.shui.ui.select.call(null,G__71890,G__71891,G__71892));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs71887))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","gap-2","items-center"], null)], null),attrs71887], 0))):{'className':"flex flex-row gap-2 items-center"}),((cljs.core.map_QMARK_(attrs71887))?[daiquiri.interpreter.interpret((function (){var G__71911 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),"ghost",new cljs.core.Keyword(null,"class","class",-2030961996),"text-muted-foreground !px-1",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var f = new cljs.core.Keyword(null,"column-set-sorting!","column-set-sorting!",892954674).cljs$core$IFn$_invoke$arity$1(table);
var new_sorting = (function (){var G__71913 = sorting;
var G__71914 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"id","id",-1388402092),id], null);
var G__71915 = null;
return (f.cljs$core$IFn$_invoke$arity$3 ? f.cljs$core$IFn$_invoke$arity$3(G__71913,G__71914,G__71915) : f.call(null,G__71913,G__71914,G__71915));
})();
var f__$1 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(table,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"data-fns","data-fns",-1065218324),new cljs.core.Keyword(null,"set-sorting!","set-sorting!",543042376)], null));
(set_sorting_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_sorting_BANG_.cljs$core$IFn$_invoke$arity$1(new_sorting) : set_sorting_BANG_.call(null,new_sorting));

(f__$1.cljs$core$IFn$_invoke$arity$1 ? f__$1.cljs$core$IFn$_invoke$arity$1(new_sorting) : f__$1.call(null,new_sorting));

if(cljs.core.empty_QMARK_(new_sorting)){
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
} else {
return null;
}
})], null);
var G__71912 = frontend.ui.icon("x");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__71911,G__71912) : logseq.shui.ui.button.call(null,G__71911,G__71912));
})())]:[daiquiri.interpreter.interpret(attrs71887),daiquiri.interpreter.interpret((function (){var G__71921 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),"ghost",new cljs.core.Keyword(null,"class","class",-2030961996),"text-muted-foreground !px-1",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var f = new cljs.core.Keyword(null,"column-set-sorting!","column-set-sorting!",892954674).cljs$core$IFn$_invoke$arity$1(table);
var new_sorting = (function (){var G__71923 = sorting;
var G__71924 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"id","id",-1388402092),id], null);
var G__71925 = null;
return (f.cljs$core$IFn$_invoke$arity$3 ? f.cljs$core$IFn$_invoke$arity$3(G__71923,G__71924,G__71925) : f.call(null,G__71923,G__71924,G__71925));
})();
var f__$1 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(table,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"data-fns","data-fns",-1065218324),new cljs.core.Keyword(null,"set-sorting!","set-sorting!",543042376)], null));
(set_sorting_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_sorting_BANG_.cljs$core$IFn$_invoke$arity$1(new_sorting) : set_sorting_BANG_.call(null,new_sorting));

(f__$1.cljs$core$IFn$_invoke$arity$1 ? f__$1.cljs$core$IFn$_invoke$arity$1(new_sorting) : f__$1.call(null,new_sorting));

if(cljs.core.empty_QMARK_(new_sorting)){
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
} else {
return null;
}
})], null);
var G__71922 = frontend.ui.icon("x");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__71921,G__71922) : logseq.shui.ui.button.call(null,G__71921,G__71922));
})())]));
})()]);
}),null,"frontend.components.views/view-sorting-item");
frontend.components.views.view_sorting_config = rum.core.lazy_build(rum.core.build_defc,(function (table,sorting,columns){
var vec__71940 = rum.core.use_state(sorting);
var sorting__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71940,(0),null);
var set_sorting_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71940,(1),null);
var attrs71939 = (function (){var items = (function (){var iter__5480__auto__ = (function frontend$components$views$iter__71943(s__71944){
return (new cljs.core.LazySeq(null,(function (){
var s__71944__$1 = s__71944;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__71944__$1);
if(temp__5804__auto__){
var s__71944__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__71944__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__71944__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__71946 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__71945 = (0);
while(true){
if((i__71945 < size__5479__auto__)){
var map__71947 = cljs.core._nth(c__5478__auto__,i__71945);
var map__71947__$1 = cljs.core.__destructure_map(map__71947);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71947__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var asc_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71947__$1,new cljs.core.Keyword(null,"asc?","asc?",891093427));
cljs.core.chunk_append(b__71946,(function (){var temp__5804__auto____$1 = cljs.core.some(((function (i__71945,map__71947,map__71947__$1,id,asc_QMARK_,c__5478__auto__,size__5479__auto__,b__71946,s__71944__$2,temp__5804__auto__,vec__71940,sorting__$1,set_sorting_BANG_){
return (function (column){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(id,new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column))){
return new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(column);
} else {
return null;
}
});})(i__71945,map__71947,map__71947__$1,id,asc_QMARK_,c__5478__auto__,size__5479__auto__,b__71946,s__71944__$2,temp__5804__auto__,vec__71940,sorting__$1,set_sorting_BANG_))
,columns);
if(cljs.core.truth_(temp__5804__auto____$1)){
var name = temp__5804__auto____$1;
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),new cljs.core.Keyword(null,"value","value",305978217),id,new cljs.core.Keyword(null,"content","content",15833224),frontend.components.views.view_sorting_item(table,sorting__$1,id,name,asc_QMARK_,set_sorting_BANG_)], null);
} else {
return null;
}
})());

var G__73264 = (i__71945 + (1));
i__71945 = G__73264;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__71946),frontend$components$views$iter__71943(cljs.core.chunk_rest(s__71944__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__71946),null);
}
} else {
var map__71948 = cljs.core.first(s__71944__$2);
var map__71948__$1 = cljs.core.__destructure_map(map__71948);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71948__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var asc_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71948__$1,new cljs.core.Keyword(null,"asc?","asc?",891093427));
return cljs.core.cons((function (){var temp__5804__auto____$1 = cljs.core.some(((function (map__71948,map__71948__$1,id,asc_QMARK_,s__71944__$2,temp__5804__auto__,vec__71940,sorting__$1,set_sorting_BANG_){
return (function (column){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(id,new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column))){
return new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(column);
} else {
return null;
}
});})(map__71948,map__71948__$1,id,asc_QMARK_,s__71944__$2,temp__5804__auto__,vec__71940,sorting__$1,set_sorting_BANG_))
,columns);
if(cljs.core.truth_(temp__5804__auto____$1)){
var name = temp__5804__auto____$1;
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),new cljs.core.Keyword(null,"value","value",305978217),id,new cljs.core.Keyword(null,"content","content",15833224),frontend.components.views.view_sorting_item(table,sorting__$1,id,name,asc_QMARK_,set_sorting_BANG_)], null);
} else {
return null;
}
})(),frontend$components$views$iter__71943(cljs.core.rest(s__71944__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(sorting__$1);
})();
return frontend.components.dnd.items(items,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-drag-end","on-drag-end",520272671),(function (ordered_columns){
var f = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(table,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"data-fns","data-fns",-1065218324),new cljs.core.Keyword(null,"set-sorting!","set-sorting!",543042376)], null));
var new_sorting = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (column){
return cljs.core.some((function (p1__71926_SHARP_){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(column,new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(p1__71926_SHARP_))){
return p1__71926_SHARP_;
} else {
return null;
}
}),sorting__$1);
}),ordered_columns);
(set_sorting_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_sorting_BANG_.cljs$core$IFn$_invoke$arity$1(new_sorting) : set_sorting_BANG_.call(null,new_sorting));

return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(new_sorting) : f.call(null,new_sorting));
})], null));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs71939))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ls-view-order-setting","flex","flex-col","gap-2","py-2","text-sm"], null)], null),attrs71939], 0))):{'className':"ls-view-order-setting flex flex-col gap-2 py-2 text-sm"}),((cljs.core.map_QMARK_(attrs71939))?[daiquiri.interpreter.interpret((function (){var G__71952 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-muted-foreground pl-3",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var f = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(table,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"data-fns","data-fns",-1065218324),new cljs.core.Keyword(null,"set-sorting!","set-sorting!",543042376)], null));
(set_sorting_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_sorting_BANG_.cljs$core$IFn$_invoke$arity$1(null) : set_sorting_BANG_.call(null,null));

(f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(null) : f.call(null,null));

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
})], null);
var G__71953 = frontend.ui.icon("trash",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(15)], null));
var G__71954 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.ml-1","span.ml-1",-436032201),"Delete sort"], null);
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__71952,G__71953,G__71954) : logseq.shui.ui.dropdown_menu_item.call(null,G__71952,G__71953,G__71954));
})())]:[daiquiri.interpreter.interpret(attrs71939),daiquiri.interpreter.interpret((function (){var G__71958 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-muted-foreground pl-3",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var f = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(table,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"data-fns","data-fns",-1065218324),new cljs.core.Keyword(null,"set-sorting!","set-sorting!",543042376)], null));
(set_sorting_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_sorting_BANG_.cljs$core$IFn$_invoke$arity$1(null) : set_sorting_BANG_.call(null,null));

(f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(null) : f.call(null,null));

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
})], null);
var G__71959 = frontend.ui.icon("trash",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(15)], null));
var G__71960 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.ml-1","span.ml-1",-436032201),"Delete sort"], null);
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__71958,G__71959,G__71960) : logseq.shui.ui.dropdown_menu_item.call(null,G__71958,G__71959,G__71960));
})())]));
}),null,"frontend.components.views/view-sorting-config");
frontend.components.views.view_sorting = rum.core.lazy_build(rum.core.build_defc,(function (table,columns,sorting){
return daiquiri.interpreter.interpret((function (){var G__71966 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),"ghost",new cljs.core.Keyword(null,"class","class",-2030961996),"text-muted-foreground !px-1",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
var G__71968 = e.target;
var G__71969 = (function (){
return frontend.components.views.view_sorting_config(table,sorting,columns);
});
var G__71970 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"end","end",-268185958)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__71968,G__71969,G__71970) : logseq.shui.ui.popup_show_BANG_.call(null,G__71968,G__71969,G__71970));
})], null);
var G__71967 = frontend.ui.icon("arrows-up-down");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__71966,G__71967) : logseq.shui.ui.button.call(null,G__71966,G__71967));
})());
}),null,"frontend.components.views/view-sorting");
frontend.components.views.view_cp = (function frontend$components$views$view_cp(view_entity,table,option_STAR_,p__71971){
var map__71972 = p__71971;
var map__71972__$1 = cljs.core.__destructure_map(map__71972);
var _STAR_scroller_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71972__$1,new cljs.core.Keyword(null,"*scroller-ref","*scroller-ref",-635636256));
var display_type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71972__$1,new cljs.core.Keyword(null,"display-type","display-type",-749971179));
var row_selection = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71972__$1,new cljs.core.Keyword(null,"row-selection","row-selection",1964656498));
var option = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(option_STAR_,new cljs.core.Keyword(null,"view-entity","view-entity",-1084117808),view_entity);
var G__71973 = display_type;
var G__71973__$1 = (((G__71973 instanceof cljs.core.Keyword))?G__71973.fqn:null);
switch (G__71973__$1) {
case "logseq.property.view/type.list":
return frontend.components.views.list_view(option,view_entity,table,_STAR_scroller_ref);

break;
case "logseq.property.view/type.gallery":
return frontend.components.views.gallery_view(option,table,view_entity,new cljs.core.Keyword(null,"rows","rows",850049680).cljs$core$IFn$_invoke$arity$1(table),_STAR_scroller_ref);

break;
default:
return frontend.components.views.table_view(table,option,row_selection,_STAR_scroller_ref);

}
});
frontend.components.views.get_views = (function frontend$components$views$get_views(ent,view_feature_type){
var entity = (function (){var G__71974 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(ent);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__71974) : frontend.db.entity.call(null,G__71974));
})();
var views = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (view){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(view_feature_type,new cljs.core.Keyword("logseq.property.view","feature-type","logseq.property.view/feature-type",-939141871).cljs$core$IFn$_invoke$arity$1(view));
}),new cljs.core.Keyword("logseq.property","_view-for","logseq.property/_view-for",427007845).cljs$core$IFn$_invoke$arity$1(entity));
return logseq.db.sort_by_order(views);
});
frontend.components.views.create_view_BANG_ = (function frontend$components$views$create_view_BANG_(view_parent,view_feature_type,p__71975){
var map__71976 = p__71975;
var map__71976__$1 = cljs.core.__destructure_map(map__71976);
var auto_triggered_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71976__$1,new cljs.core.Keyword(null,"auto-triggered?","auto-triggered?",1255221895));
var temp__5804__auto__ = (frontend.db.get_case_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_case_page.cljs$core$IFn$_invoke$arity$1(logseq.common.config.views_page_name) : frontend.db.get_case_page.call(null,logseq.common.config.views_page_name));
if(cljs.core.truth_(temp__5804__auto__)){
var page = temp__5804__auto__;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__71977 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("logseq.property","view-for","logseq.property/view-for",-36274319),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_parent),new cljs.core.Keyword("logseq.property.view","feature-type","logseq.property.view/feature-type",-939141871),view_feature_type], null);
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"linked-references","linked-references",-2117592379),null,new cljs.core.Keyword(null,"unlinked-references","unlinked-references",1918870007),null], null), null),view_feature_type)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(G__71977,new cljs.core.Keyword("logseq.property.view","type","logseq.property.view/type",218237607),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property.view","type.list","logseq.property.view/type.list",-1164828502)) : frontend.db.entity.call(null,new cljs.core.Keyword("logseq.property.view","type.list","logseq.property.view/type.list",-1164828502)))),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("logseq.property.view","group-by-property","logseq.property.view/group-by-property",809216236),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108)) : frontend.db.entity.call(null,new cljs.core.Keyword("block","page","block/page",822314108))))], 0));
} else {
return G__71977;
}
})()),(function (properties){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.seq(frontend.components.views.get_views(view_parent,view_feature_type))),(function (view_exists_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(view_exists_QMARK_)?"":(function (){var G__71978 = view_feature_type;
var G__71978__$1 = (((G__71978 instanceof cljs.core.Keyword))?G__71978.fqn:null);
switch (G__71978__$1) {
case "linked-references":
return "Linked references";

break;
case "unlinked-references":
return "Unlinked references";

break;
case "class-objects":
return "All";

break;
case "property-objects":
return "All";

break;
case "all-pages":
return "All pages";

break;
default:
return "";

}
})())),(function (view_title){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.common.uuid.gen_uuid.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"view-block-uuid","view-block-uuid",1288276895),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(view_parent)),cljs.core.str.cljs$core$IFn$_invoke$arity$1(view_feature_type)].join(''))),(function (view_block_id){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.api_insert_new_block_BANG_(view_title,(function (){var G__71979 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page),new cljs.core.Keyword(null,"properties","properties",685819552),properties,new cljs.core.Keyword(null,"edit-block?","edit-block?",-310383789),false], null);
if(cljs.core.truth_(auto_triggered_QMARK_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__71979,new cljs.core.Keyword(null,"custom-uuid","custom-uuid",-1095135430),view_block_id);
} else {
return G__71979;
}
})())),(function (result){
return promesa.protocols._promise((function (){var G__71980 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(result)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__71980) : frontend.db.entity.call(null,G__71980));
})());
}));
}));
}));
}));
}));
}));
} else {
return null;
}
});
frontend.components.views.views_tab = rum.core.lazy_build(rum.core.build_defc,(function (view_parent,current_view,p__71981){
var map__71982 = p__71981;
var map__71982__$1 = cljs.core.__destructure_map(map__71982);
var views = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71982__$1,new cljs.core.Keyword(null,"views","views",1450155487));
var data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71982__$1,new cljs.core.Keyword(null,"data","data",-232669377));
var show_items_count_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71982__$1,new cljs.core.Keyword(null,"show-items-count?","show-items-count?",-1022363900));
var set_views_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71982__$1,new cljs.core.Keyword(null,"set-views!","set-views!",-185817176));
var set_view_entity_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71982__$1,new cljs.core.Keyword(null,"set-view-entity!","set-view-entity!",-69891185));
var set_data_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71982__$1,new cljs.core.Keyword(null,"set-data!","set-data!",150955183));
var opacity = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71982__$1,new cljs.core.Keyword(null,"opacity","opacity",397153780));
var view_feature_type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71982__$1,new cljs.core.Keyword(null,"view-feature-type","view-feature-type",-945869610));
var items_count = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71982__$1,new cljs.core.Keyword(null,"items-count","items-count",-135458025));
var references_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__71982__$1,new cljs.core.Keyword(null,"references?","references?",-487254152));
return daiquiri.core.create_element("div",{'className':"views"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$views$iter__71983(s__71984){
return (new cljs.core.LazySeq(null,(function (){
var s__71984__$1 = s__71984;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__71984__$1);
if(temp__5804__auto__){
var s__71984__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__71984__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__71984__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__71986 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__71985 = (0);
while(true){
if((i__71985 < size__5479__auto__)){
var view_STAR_ = cljs.core._nth(c__5478__auto__,i__71985);
cljs.core.chunk_append(b__71986,(function (){var view = (function (){var G__71987 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_STAR_);
return (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(G__71987) : frontend.db.sub_block.call(null,G__71987));
})();
var current_view_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(current_view),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view));
return daiquiri.interpreter.interpret((function (){var G__72003 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"text","text",-1790561697),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"class","class",-2030961996),["text-sm px-0 py-0 h-6 ",((current_view_QMARK_)?null:"text-muted-foreground")].join(''),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__71985,view,current_view_QMARK_,view_STAR_,c__5478__auto__,size__5479__auto__,b__71986,s__71984__$2,temp__5804__auto__,map__71982,map__71982__$1,views,data,show_items_count_QMARK_,set_views_BANG_,set_view_entity_BANG_,set_data_BANG_,opacity,view_feature_type,items_count,references_QMARK_){
return (function (e){
if(((current_view_QMARK_) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_parent))))){
var G__72007 = e.target;
var G__72008 = ((function (i__71985,G__72007,view,current_view_QMARK_,view_STAR_,c__5478__auto__,size__5479__auto__,b__71986,s__71984__$2,temp__5804__auto__,map__71982,map__71982__$1,views,data,show_items_count_QMARK_,set_views_BANG_,set_view_entity_BANG_,set_data_BANG_,opacity,view_feature_type,items_count,references_QMARK_){
return (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),(function (){var G__72010 = (logseq.shui.ui.dropdown_menu_sub_trigger.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_sub_trigger.cljs$core$IFn$_invoke$arity$1("Rename") : logseq.shui.ui.dropdown_menu_sub_trigger.call(null,"Rename"));
var G__72011 = (function (){var G__72012 = (function (){var temp__5804__auto____$1 = frontend.state.get_component(new cljs.core.Keyword("block","container","block/container",510671002));
if(cljs.core.truth_(temp__5804__auto____$1)){
var block_container_cp = temp__5804__auto____$1;
var G__72013 = cljs.core.PersistentArrayMap.EMPTY;
var G__72014 = view;
return (block_container_cp.cljs$core$IFn$_invoke$arity$2 ? block_container_cp.cljs$core$IFn$_invoke$arity$2(G__72013,G__72014) : block_container_cp.call(null,G__72013,G__72014));
} else {
return null;
}
})();
return (logseq.shui.ui.dropdown_menu_sub_content.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_sub_content.cljs$core$IFn$_invoke$arity$1(G__72012) : logseq.shui.ui.dropdown_menu_sub_content.call(null,G__72012));
})();
return (logseq.shui.ui.dropdown_menu_sub.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_sub.cljs$core$IFn$_invoke$arity$2(G__72010,G__72011) : logseq.shui.ui.dropdown_menu_sub.call(null,G__72010,G__72011));
})(),(function (){var G__72015 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Delete",new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__71985,G__72007,view,current_view_QMARK_,view_STAR_,c__5478__auto__,size__5479__auto__,b__71986,s__71984__$2,temp__5804__auto__,map__71982,map__71982__$1,views,data,show_items_count_QMARK_,set_views_BANG_,set_view_entity_BANG_,set_data_BANG_,opacity,view_feature_type,items_count,references_QMARK_){
return (function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),((function (i__71985,G__72007,view,current_view_QMARK_,view_STAR_,c__5478__auto__,size__5479__auto__,b__71986,s__71984__$2,temp__5804__auto__,map__71982,map__71982__$1,views,data,show_items_count_QMARK_,set_views_BANG_,set_view_entity_BANG_,set_data_BANG_,opacity,view_feature_type,items_count,references_QMARK_){
return (function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.delete_block_aux_BANG_(view)),((function (i__71985,G__72007,view,current_view_QMARK_,view_STAR_,c__5478__auto__,size__5479__auto__,b__71986,s__71984__$2,temp__5804__auto__,map__71982,map__71982__$1,views,data,show_items_count_QMARK_,set_views_BANG_,set_view_entity_BANG_,set_data_BANG_,opacity,view_feature_type,items_count,references_QMARK_){
return (function (___40947__auto__){
return promesa.protocols._promise((function (){var views_SINGLEQUOTE_ = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(((function (i__71985,G__72007,view,current_view_QMARK_,view_STAR_,c__5478__auto__,size__5479__auto__,b__71986,s__71984__$2,temp__5804__auto__,map__71982,map__71982__$1,views,data,show_items_count_QMARK_,set_views_BANG_,set_view_entity_BANG_,set_data_BANG_,opacity,view_feature_type,items_count,references_QMARK_){
return (function (v){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(v),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view));
});})(i__71985,G__72007,view,current_view_QMARK_,view_STAR_,c__5478__auto__,size__5479__auto__,b__71986,s__71984__$2,temp__5804__auto__,map__71982,map__71982__$1,views,data,show_items_count_QMARK_,set_views_BANG_,set_view_entity_BANG_,set_data_BANG_,opacity,view_feature_type,items_count,references_QMARK_))
,views);
(set_views_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_views_BANG_.cljs$core$IFn$_invoke$arity$1(views_SINGLEQUOTE_) : set_views_BANG_.call(null,views_SINGLEQUOTE_));

var G__72017_73267 = cljs.core.first(views_SINGLEQUOTE_);
(set_view_entity_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_view_entity_BANG_.cljs$core$IFn$_invoke$arity$1(G__72017_73267) : set_view_entity_BANG_.call(null,G__72017_73267));

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
})());
});})(i__71985,G__72007,view,current_view_QMARK_,view_STAR_,c__5478__auto__,size__5479__auto__,b__71986,s__71984__$2,temp__5804__auto__,map__71982,map__71982__$1,views,data,show_items_count_QMARK_,set_views_BANG_,set_view_entity_BANG_,set_data_BANG_,opacity,view_feature_type,items_count,references_QMARK_))
);
});})(i__71985,G__72007,view,current_view_QMARK_,view_STAR_,c__5478__auto__,size__5479__auto__,b__71986,s__71984__$2,temp__5804__auto__,map__71982,map__71982__$1,views,data,show_items_count_QMARK_,set_views_BANG_,set_view_entity_BANG_,set_data_BANG_,opacity,view_feature_type,items_count,references_QMARK_))
);
});})(i__71985,G__72007,view,current_view_QMARK_,view_STAR_,c__5478__auto__,size__5479__auto__,b__71986,s__71984__$2,temp__5804__auto__,map__71982,map__71982__$1,views,data,show_items_count_QMARK_,set_views_BANG_,set_view_entity_BANG_,set_data_BANG_,opacity,view_feature_type,items_count,references_QMARK_))
], null);
var G__72016 = "Delete";
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__72015,G__72016) : logseq.shui.ui.dropdown_menu_item.call(null,G__72015,G__72016));
})()], null);
});})(i__71985,G__72007,view,current_view_QMARK_,view_STAR_,c__5478__auto__,size__5479__auto__,b__71986,s__71984__$2,temp__5804__auto__,map__71982,map__71982__$1,views,data,show_items_count_QMARK_,set_views_BANG_,set_view_entity_BANG_,set_data_BANG_,opacity,view_feature_type,items_count,references_QMARK_))
;
var G__72009 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558),true,new cljs.core.Keyword(null,"align","align",1964212802),"start",new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"onClick","onClick",-1991238530),logseq.shui.ui.popup_hide_BANG_], null)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__72007,G__72008,G__72009) : logseq.shui.ui.popup_show_BANG_.call(null,G__72007,G__72008,G__72009));
} else {
(set_view_entity_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_view_entity_BANG_.cljs$core$IFn$_invoke$arity$1(view) : set_view_entity_BANG_.call(null,view));

return (set_data_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_data_BANG_.cljs$core$IFn$_invoke$arity$1(null) : set_data_BANG_.call(null,null));
}
});})(i__71985,view,current_view_QMARK_,view_STAR_,c__5478__auto__,size__5479__auto__,b__71986,s__71984__$2,temp__5804__auto__,map__71982,map__71982__$1,views,data,show_items_count_QMARK_,set_views_BANG_,set_view_entity_BANG_,set_data_BANG_,opacity,view_feature_type,items_count,references_QMARK_))
], null);
var G__72004 = (cljs.core.truth_(references_QMARK_)?null:(function (){var display_type = (function (){var or__5002__auto__ = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(cljs.core.get.cljs$core$IFn$_invoke$arity$2(view,new cljs.core.Keyword("logseq.property.view","type","logseq.property.view/type",218237607)));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("logseq.property.view","type.table","logseq.property.view/type.table",194254240);
}
})();
var temp__5804__auto____$1 = new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(display_type) : frontend.db.entity.call(null,display_type)));
if(cljs.core.truth_(temp__5804__auto____$1)){
var icon = temp__5804__auto____$1;
return frontend.components.icon.icon.cljs$core$IFn$_invoke$arity$variadic(icon,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"color?","color?",-1891974356),true,new cljs.core.Keyword(null,"size","size",1098693007),(15)], null)], 0));
} else {
return null;
}
})());
var G__72005 = (function (){var title = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(view);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(title,"")){
return "New view";
} else {
return title;
}
})();
var G__72006 = (cljs.core.truth_((function (){var and__5000__auto__ = current_view_QMARK_;
if(and__5000__auto__){
var and__5000__auto____$1 = show_items_count_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return (((items_count > (0))) && (cljs.core.seq(data)));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-muted-foreground.text-xs","span.text-muted-foreground.text-xs",597438834),items_count], null):null);
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$4 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$4(G__72003,G__72004,G__72005,G__72006) : logseq.shui.ui.button.call(null,G__72003,G__72004,G__72005,G__72006));
})());
})());

var G__73268 = (i__71985 + (1));
i__71985 = G__73268;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__71986),frontend$components$views$iter__71983(cljs.core.chunk_rest(s__71984__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__71986),null);
}
} else {
var view_STAR_ = cljs.core.first(s__71984__$2);
return cljs.core.cons((function (){var view = (function (){var G__72032 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_STAR_);
return (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(G__72032) : frontend.db.sub_block.call(null,G__72032));
})();
var current_view_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(current_view),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view));
return daiquiri.interpreter.interpret((function (){var G__72100 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"text","text",-1790561697),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"class","class",-2030961996),["text-sm px-0 py-0 h-6 ",((current_view_QMARK_)?null:"text-muted-foreground")].join(''),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (view,current_view_QMARK_,view_STAR_,s__71984__$2,temp__5804__auto__,map__71982,map__71982__$1,views,data,show_items_count_QMARK_,set_views_BANG_,set_view_entity_BANG_,set_data_BANG_,opacity,view_feature_type,items_count,references_QMARK_){
return (function (e){
if(((current_view_QMARK_) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_parent))))){
var G__72104 = e.target;
var G__72105 = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),(function (){var G__72108 = (logseq.shui.ui.dropdown_menu_sub_trigger.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_sub_trigger.cljs$core$IFn$_invoke$arity$1("Rename") : logseq.shui.ui.dropdown_menu_sub_trigger.call(null,"Rename"));
var G__72109 = (function (){var G__72110 = (function (){var temp__5804__auto____$1 = frontend.state.get_component(new cljs.core.Keyword("block","container","block/container",510671002));
if(cljs.core.truth_(temp__5804__auto____$1)){
var block_container_cp = temp__5804__auto____$1;
var G__72112 = cljs.core.PersistentArrayMap.EMPTY;
var G__72113 = view;
return (block_container_cp.cljs$core$IFn$_invoke$arity$2 ? block_container_cp.cljs$core$IFn$_invoke$arity$2(G__72112,G__72113) : block_container_cp.call(null,G__72112,G__72113));
} else {
return null;
}
})();
return (logseq.shui.ui.dropdown_menu_sub_content.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_sub_content.cljs$core$IFn$_invoke$arity$1(G__72110) : logseq.shui.ui.dropdown_menu_sub_content.call(null,G__72110));
})();
return (logseq.shui.ui.dropdown_menu_sub.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_sub.cljs$core$IFn$_invoke$arity$2(G__72108,G__72109) : logseq.shui.ui.dropdown_menu_sub.call(null,G__72108,G__72109));
})(),(function (){var G__72115 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Delete",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.delete_block_aux_BANG_(view)),(function (___40947__auto__){
return promesa.protocols._promise((function (){var views_SINGLEQUOTE_ = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (v){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(v),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view));
}),views);
(set_views_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_views_BANG_.cljs$core$IFn$_invoke$arity$1(views_SINGLEQUOTE_) : set_views_BANG_.call(null,views_SINGLEQUOTE_));

var G__72118_73269 = cljs.core.first(views_SINGLEQUOTE_);
(set_view_entity_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_view_entity_BANG_.cljs$core$IFn$_invoke$arity$1(G__72118_73269) : set_view_entity_BANG_.call(null,G__72118_73269));

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
})());
}));
}));
})], null);
var G__72116 = "Delete";
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__72115,G__72116) : logseq.shui.ui.dropdown_menu_item.call(null,G__72115,G__72116));
})()], null);
});
var G__72106 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558),true,new cljs.core.Keyword(null,"align","align",1964212802),"start",new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"onClick","onClick",-1991238530),logseq.shui.ui.popup_hide_BANG_], null)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__72104,G__72105,G__72106) : logseq.shui.ui.popup_show_BANG_.call(null,G__72104,G__72105,G__72106));
} else {
(set_view_entity_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_view_entity_BANG_.cljs$core$IFn$_invoke$arity$1(view) : set_view_entity_BANG_.call(null,view));

return (set_data_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_data_BANG_.cljs$core$IFn$_invoke$arity$1(null) : set_data_BANG_.call(null,null));
}
});})(view,current_view_QMARK_,view_STAR_,s__71984__$2,temp__5804__auto__,map__71982,map__71982__$1,views,data,show_items_count_QMARK_,set_views_BANG_,set_view_entity_BANG_,set_data_BANG_,opacity,view_feature_type,items_count,references_QMARK_))
], null);
var G__72101 = (cljs.core.truth_(references_QMARK_)?null:(function (){var display_type = (function (){var or__5002__auto__ = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(cljs.core.get.cljs$core$IFn$_invoke$arity$2(view,new cljs.core.Keyword("logseq.property.view","type","logseq.property.view/type",218237607)));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("logseq.property.view","type.table","logseq.property.view/type.table",194254240);
}
})();
var temp__5804__auto____$1 = new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(display_type) : frontend.db.entity.call(null,display_type)));
if(cljs.core.truth_(temp__5804__auto____$1)){
var icon = temp__5804__auto____$1;
return frontend.components.icon.icon.cljs$core$IFn$_invoke$arity$variadic(icon,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"color?","color?",-1891974356),true,new cljs.core.Keyword(null,"size","size",1098693007),(15)], null)], 0));
} else {
return null;
}
})());
var G__72102 = (function (){var title = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(view);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(title,"")){
return "New view";
} else {
return title;
}
})();
var G__72103 = (cljs.core.truth_((function (){var and__5000__auto__ = current_view_QMARK_;
if(and__5000__auto__){
var and__5000__auto____$1 = show_items_count_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return (((items_count > (0))) && (cljs.core.seq(data)));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-muted-foreground.text-xs","span.text-muted-foreground.text-xs",597438834),items_count], null):null);
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$4 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$4(G__72100,G__72101,G__72102,G__72103) : logseq.shui.ui.button.call(null,G__72100,G__72101,G__72102,G__72103));
})());
})(),frontend$components$views$iter__71983(cljs.core.rest(s__71984__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(views);
})()),daiquiri.interpreter.interpret((function (){var G__72147 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"text","text",-1790561697),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"title","title",636505583),"Add new view",new cljs.core.Keyword(null,"class","class",-2030961996),["!px-1 -ml-1 text-muted-foreground hover:text-foreground transition-opacity ease-in duration-300 ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(opacity)].join(''),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.components.views.create_view_BANG_(view_parent,view_feature_type,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"auto-triggered?","auto-triggered?",1255221895),false], null))),(function (view){
return promesa.protocols._promise((function (){var G__72149 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(views,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [view], null));
return (set_views_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_views_BANG_.cljs$core$IFn$_invoke$arity$1(G__72149) : set_views_BANG_.call(null,G__72149));
})());
}));
}));
})], null);
var G__72148 = frontend.ui.icon("plus",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(15)], null));
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__72147,G__72148) : logseq.shui.ui.button.call(null,G__72147,G__72148));
})())]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query], null),"frontend.components.views/views-tab");
frontend.components.views.view_head = rum.core.lazy_build(rum.core.build_defc,(function (view_parent,view_entity,table,columns,input,sorting,set_input_BANG_,add_new_object_BANG_,p__72152){
var map__72153 = p__72152;
var map__72153__$1 = cljs.core.__destructure_map(map__72153);
var option = map__72153__$1;
var view_feature_type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__72153__$1,new cljs.core.Keyword(null,"view-feature-type","view-feature-type",-945869610));
var title_key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__72153__$1,new cljs.core.Keyword(null,"title-key","title-key",830482796));
var additional_actions = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__72153__$1,new cljs.core.Keyword(null,"additional-actions","additional-actions",1699457595));
var vec__72154 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_state.call(null,null));
var hover_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72154,(0),null);
var set_hover_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72154,(1),null);
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo());
var references_QMARK_ = cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"linked-references","linked-references",-2117592379),null,new cljs.core.Keyword(null,"unlinked-references","unlinked-references",1918870007),null], null), null),view_feature_type);
var opacity = ((((references_QMARK_) && (cljs.core.not(hover_QMARK_))))?"opacity-0":(cljs.core.truth_(hover_QMARK_)?"opacity-100":"opacity-75"
));
return daiquiri.core.create_element("div",{'onMouseOver':(function (){
return (set_hover_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_hover_QMARK_.cljs$core$IFn$_invoke$arity$1(true) : set_hover_QMARK_.call(null,true));
}),'onMouseOut':(function (){
return (set_hover_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_hover_QMARK_.cljs$core$IFn$_invoke$arity$1(false) : set_hover_QMARK_.call(null,false));
}),'className':"flex flex-1 flex-nowrap items-center justify-between gap-1 overflow-hidden"},[(function (){var attrs72163 = ((db_based_QMARK_)?((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(view_feature_type,new cljs.core.Keyword(null,"query-result","query-result",-833644142)))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.font-medium.opacity-50.text-sm","div.font-medium.opacity-50.text-sm",-355795656),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(function (){var or__5002__auto__ = title_key;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("views.table","default-title","views.table/default-title",577959565);
}
})(),cljs.core.count(new cljs.core.Keyword(null,"rows","rows",850049680).cljs$core$IFn$_invoke$arity$1(table))], 0))], null):frontend.components.views.views_tab(view_parent,view_entity,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(option,new cljs.core.Keyword(null,"hover?","hover?",-1201331489),hover_QMARK_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"opacity","opacity",397153780),opacity,new cljs.core.Keyword(null,"references?","references?",-487254152),references_QMARK_], 0)))):new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.font-medium.text-sm","div.font-medium.text-sm",619848115),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),(function (){var G__72165 = view_feature_type;
var G__72165__$1 = (((G__72165 instanceof cljs.core.Keyword))?G__72165.fqn:null);
switch (G__72165__$1) {
case "all-pages":
return "All pages";

break;
case "linked-references":
return "Linked references";

break;
case "unlinked-references":
return "Unlinked references";

break;
default:
return "Nodes";

}
})()], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.ml-1","span.ml-1",-436032201),cljs.core.count(new cljs.core.Keyword(null,"rows","rows",850049680).cljs$core$IFn$_invoke$arity$1(table))], null)], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs72163))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","items-center","gap-2"], null)], null),attrs72163], 0))):{'className':"flex flex-row items-center gap-2"}),((cljs.core.map_QMARK_(attrs72163))?null:[daiquiri.interpreter.interpret(attrs72163)]));
})(),daiquiri.core.create_element("div",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, ["view-actions","flex","items-center","gap-1","transition-opacity","ease-in","duration-300",opacity], null))},[((cljs.core.seq(additional_actions))?daiquiri.core.create_element(daiquiri.core.fragment,null,[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$views$iter__72173(s__72174){
return (new cljs.core.LazySeq(null,(function (){
var s__72174__$1 = s__72174;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__72174__$1);
if(temp__5804__auto__){
var s__72174__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__72174__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__72174__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__72176 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__72175 = (0);
while(true){
if((i__72175 < size__5479__auto__)){
var action = cljs.core._nth(c__5478__auto__,i__72175);
cljs.core.chunk_append(b__72176,((cljs.core.fn_QMARK_(action))?daiquiri.interpreter.interpret((action.cljs$core$IFn$_invoke$arity$1 ? action.cljs$core$IFn$_invoke$arity$1(option) : action.call(null,option))):daiquiri.interpreter.interpret(action)));

var G__73273 = (i__72175 + (1));
i__72175 = G__73273;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__72176),frontend$components$views$iter__72173(cljs.core.chunk_rest(s__72174__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__72176),null);
}
} else {
var action = cljs.core.first(s__72174__$2);
return cljs.core.cons(((cljs.core.fn_QMARK_(action))?daiquiri.interpreter.interpret((action.cljs$core$IFn$_invoke$arity$1 ? action.cljs$core$IFn$_invoke$arity$1(option) : action.call(null,option))):daiquiri.interpreter.interpret(action)),frontend$components$views$iter__72173(cljs.core.rest(s__72174__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(additional_actions);
})())]):null),((((db_based_QMARK_) && (cljs.core.seq(sorting))))?frontend.components.views.view_sorting(table,columns,sorting):null),((db_based_QMARK_)?frontend.components.views.filter_properties(view_entity,columns,table,option):null),frontend.components.views.search(input,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-change","on-change",-732046149),set_input_BANG_,new cljs.core.Keyword(null,"set-input!","set-input!",-615513292),set_input_BANG_], null)),((db_based_QMARK_)?daiquiri.core.create_element("div",{'className':"text-muted-foreground text-sm"},[frontend.components.property.value.property_value(view_entity,(frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property.view","type","logseq.property.view/type",218237607)) : frontend.db.entity.call(null,new cljs.core.Keyword("logseq.property.view","type","logseq.property.view/type",218237607))),cljs.core.PersistentArrayMap.EMPTY)]):null),((db_based_QMARK_)?frontend.components.views.more_actions(view_entity,columns,table,option):null),(cljs.core.truth_((function (){var and__5000__auto__ = db_based_QMARK_;
if(and__5000__auto__){
return add_new_object_BANG_;
} else {
return and__5000__auto__;
}
})())?frontend.components.views.new_record_button(table,view_entity):null)])]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.views/view-head");
frontend.components.views.view_inner = rum.core.lazy_build(rum.core.build_defc,(function (view_entity,p__72246,_STAR_scroller_ref){
var map__72248 = p__72246;
var map__72248__$1 = cljs.core.__destructure_map(map__72248);
var option_STAR_ = map__72248__$1;
var input = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__72248__$1,new cljs.core.Keyword(null,"input","input",556931961));
var view_parent = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__72248__$1,new cljs.core.Keyword(null,"view-parent","view-parent",675596601));
var sorting = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__72248__$1,new cljs.core.Keyword(null,"sorting","sorting",622249690));
var data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__72248__$1,new cljs.core.Keyword(null,"data","data",-232669377));
var full_data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__72248__$1,new cljs.core.Keyword(null,"full-data","full-data",-1430830367));
var group_by_property_ident = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__72248__$1,new cljs.core.Keyword(null,"group-by-property-ident","group-by-property-ident",1221613316));
var set_filters_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__72248__$1,new cljs.core.Keyword(null,"set-filters!","set-filters!",385623142));
var filters = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__72248__$1,new cljs.core.Keyword(null,"filters","filters",974726919));
var set_sorting_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__72248__$1,new cljs.core.Keyword(null,"set-sorting!","set-sorting!",543042376));
var columns = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__72248__$1,new cljs.core.Keyword(null,"columns","columns",1998437288));
var add_new_object_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__72248__$1,new cljs.core.Keyword(null,"add-new-object!","add-new-object!",622560106));
var set_data_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__72248__$1,new cljs.core.Keyword(null,"set-data!","set-data!",150955183));
var foldable_options = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__72248__$1,new cljs.core.Keyword(null,"foldable-options","foldable-options",1611436976));
var set_input_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__72248__$1,new cljs.core.Keyword(null,"set-input!","set-input!",-615513292));
var display_type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__72248__$1,new cljs.core.Keyword(null,"display-type","display-type",-749971179));
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0();
var option = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(option_STAR_,new cljs.core.Keyword(null,"properties","properties",685819552),cljs.core.vec(cljs.core.conj.cljs$core$IFn$_invoke$arity$variadic(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),null,new cljs.core.Keyword(null,"select","select",1147833503),null], null), null),cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092),columns)),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","name","block/name",1619760316)], 0))));
var default_visible_columns = (function (){var temp__5802__auto__ = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property.table","hidden-columns","logseq.property.table/hidden-columns",975057192).cljs$core$IFn$_invoke$arity$1(view_entity),new cljs.core.Keyword(null,"id","id",-1388402092));
if(cljs.core.truth_(temp__5802__auto__)){
var hidden_columns = temp__5802__auto__;
return cljs.core.zipmap(hidden_columns,cljs.core.repeat.cljs$core$IFn$_invoke$arity$1(false));
} else {
if(cljs.core.seq(new cljs.core.Keyword("logseq.property.table","ordered-columns","logseq.property.table/ordered-columns",1485587100).cljs$core$IFn$_invoke$arity$1(view_entity))){
return cljs.core.zipmap(clojure.set.difference.cljs$core$IFn$_invoke$arity$variadic(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092),columns)),cljs.core.set(new cljs.core.Keyword("logseq.property.table","ordered-columns","logseq.property.table/ordered-columns",1485587100).cljs$core$IFn$_invoke$arity$1(view_entity)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551),null,new cljs.core.Keyword("block","created-at","block/created-at",1440015),null,new cljs.core.Keyword(null,"select","select",1147833503),null], null), null)], 0)),cljs.core.repeat.cljs$core$IFn$_invoke$arity$1(false));
} else {
return cljs.core.PersistentArrayMap.EMPTY;
}
}
})();
var vec__72257 = rum.core.use_state(default_visible_columns);
var visible_columns = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72257,(0),null);
var set_visible_columns_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72257,(1),null);
var ordered_columns = cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"select","select",1147833503)], null),new cljs.core.Keyword("logseq.property.table","ordered-columns","logseq.property.table/ordered-columns",1485587100).cljs$core$IFn$_invoke$arity$1(view_entity)));
var sized_columns = new cljs.core.Keyword("logseq.property.table","sized-columns","logseq.property.table/sized-columns",-1675510555).cljs$core$IFn$_invoke$arity$1(view_entity);
var vec__72260 = rum.core.use_state(ordered_columns);
var ordered_columns__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72260,(0),null);
var set_ordered_columns_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72260,(1),null);
var vec__72263 = rum.core.use_state(sized_columns);
var sized_columns__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72263,(0),null);
var set_sized_columns_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72263,(1),null);
var map__72266 = frontend.components.views.db_set_table_state_BANG_(view_entity,new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"set-sorting!","set-sorting!",543042376),set_sorting_BANG_,new cljs.core.Keyword(null,"set-filters!","set-filters!",385623142),set_filters_BANG_,new cljs.core.Keyword(null,"set-visible-columns!","set-visible-columns!",729806223),set_visible_columns_BANG_,new cljs.core.Keyword(null,"set-sized-columns!","set-sized-columns!",899502581),set_sized_columns_BANG_,new cljs.core.Keyword(null,"set-ordered-columns!","set-ordered-columns!",-315299263),set_ordered_columns_BANG_], null));
var map__72266__$1 = cljs.core.__destructure_map(map__72266);
var set_sorting_BANG___$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__72266__$1,new cljs.core.Keyword(null,"set-sorting!","set-sorting!",543042376));
var set_filters_BANG___$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__72266__$1,new cljs.core.Keyword(null,"set-filters!","set-filters!",385623142));
var set_visible_columns_BANG___$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__72266__$1,new cljs.core.Keyword(null,"set-visible-columns!","set-visible-columns!",729806223));
var set_ordered_columns_BANG___$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__72266__$1,new cljs.core.Keyword(null,"set-ordered-columns!","set-ordered-columns!",-315299263));
var set_sized_columns_BANG___$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__72266__$1,new cljs.core.Keyword(null,"set-sized-columns!","set-sized-columns!",899502581));
var vec__72267 = rum.core.use_state(cljs.core.PersistentArrayMap.EMPTY);
var row_selection = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72267,(0),null);
var set_row_selection_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72267,(1),null);
var vec__72270 = rum.core.use_state(null);
var last_selected_idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72270,(0),null);
var set_last_selected_idx_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72270,(1),null);
var columns__$1 = frontend.components.views.sort_columns(columns,ordered_columns__$1);
var select_QMARK_ = cljs.core.first(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (item){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item),new cljs.core.Keyword(null,"select","select",1147833503));
}),columns__$1));
var id_QMARK_ = cljs.core.first(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (item){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item),new cljs.core.Keyword(null,"id","id",-1388402092));
}),columns__$1));
var pinned_properties = cljs.core.set((function (){var G__72287 = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword("logseq.property.table","pinned-columns","logseq.property.table/pinned-columns",267375138).cljs$core$IFn$_invoke$arity$1(view_entity));
var G__72287__$1 = (cljs.core.truth_(id_QMARK_)?cljs.core.cons(new cljs.core.Keyword(null,"id","id",-1388402092),G__72287):G__72287);
if(cljs.core.truth_(select_QMARK_)){
return cljs.core.cons(new cljs.core.Keyword(null,"select","select",1147833503),G__72287__$1);
} else {
return G__72287__$1;
}
})());
var map__72273 = cljs.core.group_by((function (item){
return cljs.core.contains_QMARK_(pinned_properties,new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item));
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (column){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(visible_columns,new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column)) === false;
}),columns__$1));
var map__72273__$1 = cljs.core.__destructure_map(map__72273);
var pinned = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__72273__$1,true);
var unpinned = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__72273__$1,false);
var group_by_property = (function (){var or__5002__auto__ = new cljs.core.Keyword("logseq.property.view","group-by-property","logseq.property.view/group-by-property",809216236).cljs$core$IFn$_invoke$arity$1(view_entity);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(group_by_property_ident) : frontend.db.entity.call(null,group_by_property_ident));
}
})();
var table_map = new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"view-entity","view-entity",-1084117808),view_entity,new cljs.core.Keyword(null,"data","data",-232669377),data,new cljs.core.Keyword(null,"full-data","full-data",-1430830367),full_data,new cljs.core.Keyword(null,"columns","columns",1998437288),columns__$1,new cljs.core.Keyword(null,"state","state",-1988618099),cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"ordered-columns","ordered-columns",-1323374524),new cljs.core.Keyword(null,"visible-columns","visible-columns",1134718660),new cljs.core.Keyword(null,"group-by-property","group-by-property",1732754405),new cljs.core.Keyword(null,"filters","filters",974726919),new cljs.core.Keyword(null,"last-selected-idx","last-selected-idx",2024080238),new cljs.core.Keyword(null,"unpinned-columns","unpinned-columns",1124489041),new cljs.core.Keyword(null,"row-selection","row-selection",1964656498),new cljs.core.Keyword(null,"pinned-columns","pinned-columns",-1218428870),new cljs.core.Keyword(null,"sorting","sorting",622249690),new cljs.core.Keyword(null,"sized-columns","sized-columns",-224617731)],[ordered_columns__$1,visible_columns,group_by_property,filters,last_selected_idx,unpinned,row_selection,pinned,sorting,sized_columns__$1]),new cljs.core.Keyword(null,"data-fns","data-fns",-1065218324),cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"set-ordered-columns!","set-ordered-columns!",-315299263),new cljs.core.Keyword(null,"set-row-selection!","set-row-selection!",1872995139),new cljs.core.Keyword(null,"set-filters!","set-filters!",385623142),new cljs.core.Keyword(null,"set-sorting!","set-sorting!",543042376),new cljs.core.Keyword(null,"add-new-object!","add-new-object!",622560106),new cljs.core.Keyword(null,"set-data!","set-data!",150955183),new cljs.core.Keyword(null,"set-visible-columns!","set-visible-columns!",729806223),new cljs.core.Keyword(null,"set-sized-columns!","set-sized-columns!",899502581),new cljs.core.Keyword(null,"set-last-selected-idx!","set-last-selected-idx!",1750927071)],[set_ordered_columns_BANG___$1,set_row_selection_BANG_,set_filters_BANG___$1,set_sorting_BANG___$1,add_new_object_BANG_,set_data_BANG_,set_visible_columns_BANG___$1,set_sized_columns_BANG___$1,set_last_selected_idx_BANG_])], null);
var table = (logseq.shui.ui.table_option.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.table_option.cljs$core$IFn$_invoke$arity$1(table_map) : logseq.shui.ui.table_option.call(null,table_map));
var _STAR_view_ref = rum.core.use_ref(null);
var gallery_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(display_type,new cljs.core.Keyword("logseq.property.view","type.gallery","logseq.property.view/type.gallery",150605112));
var list_view_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(display_type,new cljs.core.Keyword("logseq.property.view","type.list","logseq.property.view/type.list",-1164828502));
frontend.components.views.run_effects_BANG_(option,table_map,_STAR_scroller_ref,gallery_QMARK_);

return daiquiri.core.create_element("div",{'ref':_STAR_view_ref,'className':"flex flex-col gap-2 grid"},[frontend.ui.foldable(frontend.components.views.view_head(view_parent,view_entity,table,columns__$1,input,sorting,set_input_BANG_,add_new_object_BANG_,option),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.ls-view-body.flex.flex-col.gap-2.grid.mt-1","div.ls-view-body.flex.flex-col.gap-2.grid.mt-1",-1314659314),frontend.components.views.filters_row(view_entity,table,option),(function (){var view_opts = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"*scroller-ref","*scroller-ref",-635636256),_STAR_scroller_ref,new cljs.core.Keyword(null,"display-type","display-type",-749971179),display_type,new cljs.core.Keyword(null,"row-selection","row-selection",1964656498),row_selection,new cljs.core.Keyword(null,"add-new-object!","add-new-object!",622560106),add_new_object_BANG_], null);
if(cljs.core.truth_((function (){var and__5000__auto__ = group_by_property_ident;
if(cljs.core.truth_(and__5000__auto__)){
return (!(typeof cljs.core.first(new cljs.core.Keyword(null,"rows","rows",850049680).cljs$core$IFn$_invoke$arity$1(table)) === 'number'));
} else {
return and__5000__auto__;
}
})())){
if(cljs.core.seq(new cljs.core.Keyword(null,"rows","rows",850049680).cljs$core$IFn$_invoke$arity$1(table))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-col.border-t.pt-2.gap-2","div.flex.flex-col.border-t.pt-2.gap-2",-1423751738),cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2((function (idx,p__72305){
var vec__72306 = p__72305;
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72306,(0),null);
var group = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72306,(1),null);
var add_new_object_BANG___$1 = ((cljs.core.fn_QMARK_(add_new_object_BANG_))?(function (_){
var G__72309 = view_entity;
var G__72310 = table;
var G__72311 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"properties","properties",685819552),cljs.core.PersistentArrayMap.createAsIfByAssoc([new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(group_by_property),(function (){var or__5002__auto__ = (function (){var and__5000__auto__ = cljs.core.map_QMARK_(value);
if(and__5000__auto__){
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(value);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return value;
}
})()])], null);
return (add_new_object_BANG_.cljs$core$IFn$_invoke$arity$3 ? add_new_object_BANG_.cljs$core$IFn$_invoke$arity$3(G__72309,G__72310,G__72311) : add_new_object_BANG_.call(null,G__72309,G__72310,G__72311));
}):null);
var table_SINGLEQUOTE_ = (function (){var G__72312 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc_in(table_map,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"data-fns","data-fns",-1065218324),new cljs.core.Keyword(null,"add-new-object!","add-new-object!",622560106)], null),add_new_object_BANG___$1),new cljs.core.Keyword(null,"data","data",-232669377),group);
return (logseq.shui.ui.table_option.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.table_option.cljs$core$IFn$_invoke$arity$1(G__72312) : logseq.shui.ui.table_option.call(null,G__72312));
})();
var readable_property_value = (function (p1__72241_SHARP_){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.map_QMARK_(p1__72241_SHARP_);
if(and__5000__auto__){
var or__5002__auto__ = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(p1__72241_SHARP_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("logseq.property","value","logseq.property/value",1396524865).cljs$core$IFn$_invoke$arity$1(p1__72241_SHARP_);
}
} else {
return and__5000__auto__;
}
})())){
return logseq.db.frontend.property.property_value_content(p1__72241_SHARP_);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(p1__72241_SHARP_),new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837))){
return "Empty";
} else {
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__72241_SHARP_);

}
}
});
var group_by_page_QMARK_ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","page","block/page",822314108),group_by_property_ident)) || (((cljs.core.not(db_based_QMARK_)) && (cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"linked-references","linked-references",-2117592379),null,new cljs.core.Keyword(null,"unlinked-references","unlinked-references",1918870007),null], null), null),display_type)))));
return rum.core.with_key(frontend.ui.foldable(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),((list_view_QMARK_)?null:"my-4")], null),((group_by_page_QMARK_)?(cljs.core.truth_(value)?(function (){var c = frontend.state.get_component(new cljs.core.Keyword("block","page-cp","block/page-cp",975876274));
var G__72315 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"disable-preview?","disable-preview?",1485814365),true], null);
var G__72316 = value;
return (c.cljs$core$IFn$_invoke$arity$2 ? c.cljs$core$IFn$_invoke$arity$2(G__72315,G__72316) : c.call(null,G__72315,G__72316));
})():new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-muted-foreground.text-sm","div.text-muted-foreground.text-sm",189157817),"Pages"], null)):(((!((value == null))))?(function (){var icon = frontend.handler.property.util.get_block_property_value(value,new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.gap-1.items-center","div.flex.flex-row.gap-1.items-center",1211135204),(cljs.core.truth_(icon)?frontend.components.icon.icon.cljs$core$IFn$_invoke$arity$variadic(icon,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color?","color?",-1891974356),true], null)], 0)):null),readable_property_value(value)], null);
})():["No ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(group_by_property))].join('')
))], null),(function (){var render = frontend.components.views.view_cp(view_entity,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(table_SINGLEQUOTE_,new cljs.core.Keyword(null,"rows","rows",850049680),group),option,view_opts);
if(list_view_QMARK_){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.-ml-2","div.-ml-2",-1022402661),render], null);
} else {
return render;
}
})(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title-trigger?","title-trigger?",-613599873),false], null)),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_entity)),"-group-idx-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx)].join(''));
}),new cljs.core.Keyword(null,"rows","rows",850049680).cljs$core$IFn$_invoke$arity$1(table))], null);
} else {
return null;
}
} else {
return frontend.components.views.view_cp(view_entity,table,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(option,new cljs.core.Keyword(null,"group-by-property-ident","group-by-property-ident",1221613316),group_by_property_ident),view_opts);
}
})()], null),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title-trigger?","title-trigger?",-613599873),false], null),foldable_options], 0)))]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.views/view-inner");
/**
 * Provides a view for data like query results and tagged objects, multiple
 * layouts such as table and list are supported. Args:
 * * view-entity: a db Entity
 * * option:
 *   * title-key: dict key defaults to `:views.table/default-title`
 *   * data: a collections of entities
 *   * set-data!: `fn` to update `data`
 *   * columns: view columns including properties and db attributes, which could be built by `build-columns`
 *   * add-new-object!: `fn` to create a new object (or row)
 *   * show-add-property?: whether to show `Add property`
 *   * add-property!: `fn` to add a new property (or column)
 */
frontend.components.views.view_container = rum.core.lazy_build(rum.core.build_defcs,(function (state,view_entity,option){
return rum.core.with_key(frontend.components.views.view_inner(view_entity,(function (){var G__72319 = option;
if(cljs.core.truth_((function (){var or__5002__auto__ = frontend.config.publishing_QMARK_;
if(or__5002__auto__){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("logseq.property.view","group-by-property","logseq.property.view/group-by-property",809216236).cljs$core$IFn$_invoke$arity$1(view_entity);
}
})())){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(G__72319,new cljs.core.Keyword(null,"add-new-object!","add-new-object!",622560106));
} else {
return G__72319;
}
})(),new cljs.core.Keyword("frontend.components.views","scroller-ref","frontend.components.views/scroller-ref",-1179817487).cljs$core$IFn$_invoke$arity$1(state)),["view-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_entity))].join(''));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.views","scroller-ref","frontend.components.views/scroller-ref",-1179817487))], null),"frontend.components.views/view-container");
frontend.components.views._LT_load_view_data = (function frontend$components$views$_LT_load_view_data(view,opts){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","get-view-data","thread-api/get-view-data",1976013429),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view),opts], 0));
});
frontend.components.views.view_aux = rum.core.lazy_build(rum.core.build_defc,(function (view_entity,p__72321){
var map__72322 = p__72321;
var map__72322__$1 = cljs.core.__destructure_map(map__72322);
var option = map__72322__$1;
var view_parent = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__72322__$1,new cljs.core.Keyword(null,"view-parent","view-parent",675596601));
var view_feature_type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__72322__$1,new cljs.core.Keyword(null,"view-feature-type","view-feature-type",-945869610));
var data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__72322__$1,new cljs.core.Keyword(null,"data","data",-232669377));
var query_entity_ids = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__72322__$1,new cljs.core.Keyword(null,"query-entity-ids","query-entity-ids",2135324416));
var set_view_entity_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__72322__$1,new cljs.core.Keyword(null,"set-view-entity!","set-view-entity!",-69891185));
var vec__72324 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1("") : logseq.shui.hooks.use_state.call(null,""));
var input = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72324,(0),null);
var set_input_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72324,(1),null);
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0();
var group_by_property = new cljs.core.Keyword("logseq.property.view","group-by-property","logseq.property.view/group-by-property",809216236).cljs$core$IFn$_invoke$arity$1(view_entity);
var display_type = (cljs.core.truth_(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0())?(function (){var or__5002__auto__ = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(cljs.core.get.cljs$core$IFn$_invoke$arity$2(view_entity,new cljs.core.Keyword("logseq.property.view","type","logseq.property.view/type",218237607)));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"view-type","view-type",-1848894559).cljs$core$IFn$_invoke$arity$1(option),new cljs.core.Keyword(null,"linked-references","linked-references",-2117592379)))?new cljs.core.Keyword("logseq.property.view","type.list","logseq.property.view/type.list",-1164828502):null);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return new cljs.core.Keyword("logseq.property.view","type.table","logseq.property.view/type.table",194254240);
}
}
})():((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(view_feature_type,new cljs.core.Keyword(null,"all-pages","all-pages",1017563062)))?new cljs.core.Keyword("logseq.property.view","type.table","logseq.property.view/type.table",194254240):new cljs.core.Keyword("logseq.property.view","type.list","logseq.property.view/type.list",-1164828502)));
var list_view_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(display_type,new cljs.core.Keyword("logseq.property.view","type.list","logseq.property.view/type.list",-1164828502));
var group_by_property_ident = (function (){var or__5002__auto__ = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(group_by_property);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = ((((list_view_QMARK_) && ((group_by_property == null))))?new cljs.core.Keyword("block","page","block/page",822314108):null);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
if(((cljs.core.not(db_based_QMARK_)) && (cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"linked-references","linked-references",-2117592379),null,new cljs.core.Keyword(null,"unlinked-references","unlinked-references",1918870007),null], null), null),view_feature_type)))){
return new cljs.core.Keyword("block","page","block/page",822314108);
} else {
return null;
}
}
}
})();
var sorting_STAR_ = new cljs.core.Keyword("logseq.property.table","sorting","logseq.property.table/sorting",208102594).cljs$core$IFn$_invoke$arity$1(view_entity);
var sorting = ((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(sorting_STAR_,new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837))) || (cljs.core.empty_QMARK_(sorting_STAR_))))?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551),new cljs.core.Keyword(null,"asc?","asc?",891093427),false], null)], null):sorting_STAR_);
var vec__72327 = rum.core.use_state(sorting);
var sorting__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72327,(0),null);
var set_sorting_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72327,(1),null);
var view_filters = new cljs.core.Keyword("logseq.property.table","filters","logseq.property.table/filters",-1702393633).cljs$core$IFn$_invoke$arity$1(view_entity);
var vec__72330 = rum.core.use_state((function (){var or__5002__auto__ = view_filters;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentArrayMap.EMPTY;
}
})());
var filters = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72330,(0),null);
var set_filters_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72330,(1),null);
var query_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(view_feature_type,new cljs.core.Keyword(null,"query-result","query-result",-833644142));
var vec__72333 = (function (){var G__72345 = (!(query_QMARK_));
return (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(G__72345) : logseq.shui.hooks.use_state.call(null,G__72345));
})();
var loading_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72333,(0),null);
var set_loading_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72333,(1),null);
var vec__72336 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(data) : logseq.shui.hooks.use_state.call(null,data));
var data__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72336,(0),null);
var set_data_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72336,(1),null);
var vec__72339 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_state.call(null,null));
var ref_pages_count = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72339,(0),null);
var set_ref_pages_count_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72339,(1),null);
var load_view_data = (function frontend$components$views$load_view_data(){
return frontend.common.missionary.run_task_STAR_(cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr72346_block_1 = (function frontend$components$views$load_view_data_$_cr72346_block_1(cr72346_state){
try{var cr72346_place_0 = (cr72346_state[(1)]);
var cr72346_place_3 = cr72346_place_0;
(cr72346_state[(0)] = cr72346_block_12);

(cr72346_state[(1)] = null);

(cr72346_state[(2)] = cr72346_place_3);

return cr72346_state;
}catch (e72668){var cr72346_exception = e72668;
(cr72346_state[(0)] = null);

(cr72346_state[(1)] = null);

(cr72346_state[(2)] = null);

throw cr72346_exception;
}});
var cr72346_block_11 = (function frontend$components$views$load_view_data_$_cr72346_block_11(cr72346_state){
try{var cr72346_place_8 = (cr72346_state[(1)]);
(cr72346_state[(0)] = cr72346_block_12);

(cr72346_state[(1)] = null);

(cr72346_state[(2)] = cr72346_place_8);

return cr72346_state;
}catch (e72669){var cr72346_exception = e72669;
(cr72346_state[(0)] = null);

(cr72346_state[(1)] = null);

(cr72346_state[(2)] = null);

throw cr72346_exception;
}});
var cr72346_block_3 = (function frontend$components$views$load_view_data_$_cr72346_block_3(cr72346_state){
try{var cr72346_place_6 = (cr72346_state[(3)]);
var cr72346_place_9 = cr72346_place_6;
(cr72346_state[(0)] = cr72346_block_11);

(cr72346_state[(3)] = null);

(cr72346_state[(1)] = cr72346_place_9);

return cr72346_state;
}catch (e72670){var cr72346_exception = e72670;
(cr72346_state[(0)] = null);

(cr72346_state[(1)] = null);

(cr72346_state[(2)] = null);

(cr72346_state[(3)] = null);

throw cr72346_exception;
}});
var cr72346_block_6 = (function frontend$components$views$load_view_data_$_cr72346_block_6(cr72346_state){
try{var cr72346_place_16 = cljs.core.not;
var cr72346_place_17 = clojure.string.blank_QMARK_;
var cr72346_place_18 = input;
var cr72346_place_19 = (function (){var G__72673 = cr72346_place_18;
var fexpr__72672 = cr72346_place_17;
return (fexpr__72672.cljs$core$IFn$_invoke$arity$1 ? fexpr__72672.cljs$core$IFn$_invoke$arity$1(G__72673) : fexpr__72672.call(null,G__72673));
})();
var cr72346_place_20 = (function (){var G__72675 = cr72346_place_19;
var fexpr__72674 = cr72346_place_16;
return (fexpr__72674.cljs$core$IFn$_invoke$arity$1 ? fexpr__72674.cljs$core$IFn$_invoke$arity$1(G__72675) : fexpr__72674.call(null,G__72675));
})();
(cr72346_state[(0)] = cr72346_block_8);

(cr72346_state[(4)] = cr72346_place_20);

return cr72346_state;
}catch (e72671){var cr72346_exception = e72671;
(cr72346_state[(0)] = null);

(cr72346_state[(1)] = null);

(cr72346_state[(4)] = null);

(cr72346_state[(2)] = null);

(cr72346_state[(3)] = null);

throw cr72346_exception;
}});
var cr72346_block_16 = (function frontend$components$views$load_view_data_$_cr72346_block_16(cr72346_state){
try{var cr72346_place_29 = (cr72346_state[(3)]);
var cr72346_place_33 = (cr72346_state[(4)]);
var cr72346_place_30 = (cr72346_state[(5)]);
var cr72346_place_36 = (function (){var G__72678 = cr72346_place_33;
var fexpr__72677 = cr72346_place_30;
return (fexpr__72677.cljs$core$IFn$_invoke$arity$1 ? fexpr__72677.cljs$core$IFn$_invoke$arity$1(G__72678) : fexpr__72677.call(null,G__72678));
})();
var cr72346_place_37 = clojure.string.blank_QMARK_;
var cr72346_place_38 = input;
var cr72346_place_39 = (function (){var G__72680 = cr72346_place_38;
var fexpr__72679 = cr72346_place_37;
return (fexpr__72679.cljs$core$IFn$_invoke$arity$1 ? fexpr__72679.cljs$core$IFn$_invoke$arity$1(G__72680) : fexpr__72679.call(null,G__72680));
})();
var cr72346_place_40 = ((cr72346_place_36) && (cr72346_place_39));
var cr72346_place_41 = ((cr72346_place_29) && (cr72346_place_40));
var cr72346_place_42 = null;
if(cr72346_place_41){
(cr72346_state[(0)] = cr72346_block_40);

(cr72346_state[(3)] = null);

(cr72346_state[(2)] = null);

(cr72346_state[(4)] = null);

(cr72346_state[(5)] = null);

(cr72346_state[(3)] = cr72346_place_42);

return cr72346_state;
} else {
(cr72346_state[(0)] = cr72346_block_17);

(cr72346_state[(3)] = null);

(cr72346_state[(4)] = null);

(cr72346_state[(5)] = null);

(cr72346_state[(3)] = cr72346_place_42);

return cr72346_state;
}
}catch (e72676){var cr72346_exception = e72676;
(cr72346_state[(0)] = null);

(cr72346_state[(3)] = null);

(cr72346_state[(2)] = null);

(cr72346_state[(4)] = null);

(cr72346_state[(1)] = null);

(cr72346_state[(5)] = null);

throw cr72346_exception;
}});
var cr72346_block_24 = (function frontend$components$views$load_view_data_$_cr72346_block_24(cr72346_state){
try{var cr72346_place_55 = null;
var cr72346_place_56 = false;
(cr72346_state[(0)] = cr72346_block_25);

(cr72346_state[(5)] = cr72346_place_55);

(cr72346_state[(6)] = cr72346_place_56);

return cr72346_state;
}catch (e72681){var cr72346_exception = e72681;
(cr72346_state[(0)] = null);

(cr72346_state[(3)] = null);

(cr72346_state[(4)] = null);

(cr72346_state[(2)] = null);

(cr72346_state[(1)] = null);

throw cr72346_exception;
}});
var cr72346_block_9 = (function frontend$components$views$load_view_data_$_cr72346_block_9(cr72346_state){
try{var cr72346_place_10 = (cr72346_state[(4)]);
var cr72346_place_22 = cr72346_place_10;
(cr72346_state[(0)] = cr72346_block_10);

(cr72346_state[(4)] = null);

(cr72346_state[(3)] = cr72346_place_22);

return cr72346_state;
}catch (e72682){var cr72346_exception = e72682;
(cr72346_state[(0)] = null);

(cr72346_state[(1)] = null);

(cr72346_state[(2)] = null);

(cr72346_state[(4)] = null);

(cr72346_state[(3)] = null);

throw cr72346_exception;
}});
var cr72346_block_39 = (function frontend$components$views$load_view_data_$_cr72346_block_39(cr72346_state){
try{var cr72346_place_44 = (cr72346_state[(4)]);
(cr72346_state[(0)] = cr72346_block_41);

(cr72346_state[(4)] = null);

(cr72346_state[(3)] = cr72346_place_44);

return cr72346_state;
}catch (e72683){var cr72346_exception = e72683;
(cr72346_state[(0)] = null);

(cr72346_state[(3)] = null);

(cr72346_state[(4)] = null);

(cr72346_state[(1)] = null);

throw cr72346_exception;
}});
var cr72346_block_43 = (function frontend$components$views$load_view_data_$_cr72346_block_43(cr72346_state){
try{var cr72346_place_28 = (cr72346_state[(1)]);
(cr72346_state[(0)] = null);

(cr72346_state[(1)] = null);

return cr72346_place_28;
}catch (e72684){var cr72346_exception = e72684;
(cr72346_state[(0)] = null);

(cr72346_state[(1)] = null);

throw cr72346_exception;
}});
var cr72346_block_27 = (function frontend$components$views$load_view_data_$_cr72346_block_27(cr72346_state){
try{var cr72346_place_65 = (cr72346_state[(12)]);
var cr72346_place_71 = cr72346_place_65;
(cr72346_state[(0)] = cr72346_block_28);

(cr72346_state[(12)] = null);

(cr72346_state[(7)] = cr72346_place_71);

return cr72346_state;
}catch (e72685){var cr72346_exception = e72685;
(cr72346_state[(0)] = cr72346_block_36);

(cr72346_state[(12)] = null);

(cr72346_state[(7)] = null);

(cr72346_state[(8)] = null);

(cr72346_state[(9)] = null);

(cr72346_state[(10)] = null);

(cr72346_state[(11)] = null);

(cr72346_state[(5)] = cr72346_exception);

return cr72346_state;
}});
var cr72346_block_15 = (function frontend$components$views$load_view_data_$_cr72346_block_15(cr72346_state){
try{var cr72346_place_31 = (cr72346_state[(6)]);
var cr72346_place_35 = cr72346_place_31;
(cr72346_state[(0)] = cr72346_block_16);

(cr72346_state[(6)] = null);

(cr72346_state[(4)] = cr72346_place_35);

return cr72346_state;
}catch (e72686){var cr72346_exception = e72686;
(cr72346_state[(0)] = null);

(cr72346_state[(6)] = null);

(cr72346_state[(3)] = null);

(cr72346_state[(2)] = null);

(cr72346_state[(4)] = null);

(cr72346_state[(1)] = null);

(cr72346_state[(5)] = null);

throw cr72346_exception;
}});
var cr72346_block_29 = (function frontend$components$views$load_view_data_$_cr72346_block_29(cr72346_state){
try{var cr72346_place_82 = (cr72346_state[(9)]);
var cr72346_place_85 = cr72346_place_82;
(cr72346_state[(0)] = cr72346_block_31);

(cr72346_state[(9)] = null);

(cr72346_state[(7)] = cr72346_place_85);

return cr72346_state;
}catch (e72687){var cr72346_exception = e72687;
(cr72346_state[(0)] = cr72346_block_36);

(cr72346_state[(8)] = null);

(cr72346_state[(7)] = null);

(cr72346_state[(10)] = null);

(cr72346_state[(11)] = null);

(cr72346_state[(9)] = null);

(cr72346_state[(5)] = cr72346_exception);

return cr72346_state;
}});
var cr72346_block_28 = (function frontend$components$views$load_view_data_$_cr72346_block_28(cr72346_state){
try{var cr72346_place_67 = (cr72346_state[(7)]);
var cr72346_place_60 = (cr72346_state[(9)]);
var cr72346_place_72 = new cljs.core.Keyword(null,"view-feature-type","view-feature-type",-945869610);
var cr72346_place_73 = view_feature_type;
var cr72346_place_74 = new cljs.core.Keyword(null,"group-by-property-ident","group-by-property-ident",1221613316);
var cr72346_place_75 = group_by_property_ident;
var cr72346_place_76 = new cljs.core.Keyword(null,"input","input",556931961);
var cr72346_place_77 = input;
var cr72346_place_78 = new cljs.core.Keyword(null,"filters","filters",974726919);
var cr72346_place_79 = filters;
var cr72346_place_80 = new cljs.core.Keyword(null,"sorting","sorting",622249690);
var cr72346_place_81 = sorting__$1;
var cr72346_place_82 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr72346_place_74,cr72346_place_75,cr72346_place_60,cr72346_place_67,cr72346_place_76,cr72346_place_77,cr72346_place_78,cr72346_place_79,cr72346_place_72,cr72346_place_73,cr72346_place_80,cr72346_place_81]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr72346_place_83 = query_QMARK_;
var cr72346_place_84 = null;
if(cr72346_place_83){
(cr72346_state[(0)] = cr72346_block_30);

(cr72346_state[(7)] = null);

(cr72346_state[(9)] = null);

(cr72346_state[(7)] = cr72346_place_84);

(cr72346_state[(9)] = cr72346_place_82);

return cr72346_state;
} else {
(cr72346_state[(0)] = cr72346_block_29);

(cr72346_state[(7)] = null);

(cr72346_state[(9)] = null);

(cr72346_state[(7)] = cr72346_place_84);

(cr72346_state[(9)] = cr72346_place_82);

return cr72346_state;
}
}catch (e72688){var cr72346_exception = e72688;
(cr72346_state[(0)] = cr72346_block_36);

(cr72346_state[(7)] = null);

(cr72346_state[(8)] = null);

(cr72346_state[(9)] = null);

(cr72346_state[(10)] = null);

(cr72346_state[(11)] = null);

(cr72346_state[(5)] = cr72346_exception);

return cr72346_state;
}});
var cr72346_block_12 = (function frontend$components$views$load_view_data_$_cr72346_block_12(cr72346_state){
try{var cr72346_place_2 = (cr72346_state[(2)]);
var cr72346_place_23 = query_QMARK_;
var cr72346_place_24 = cljs.core.empty_QMARK_;
var cr72346_place_25 = query_entity_ids;
var cr72346_place_26 = (function (){var G__72691 = cr72346_place_25;
var fexpr__72690 = cr72346_place_24;
return (fexpr__72690.cljs$core$IFn$_invoke$arity$1 ? fexpr__72690.cljs$core$IFn$_invoke$arity$1(G__72691) : fexpr__72690.call(null,G__72691));
})();
var cr72346_place_27 = ((cr72346_place_23) && (cr72346_place_26));
var cr72346_place_28 = null;
if(cr72346_place_27){
(cr72346_state[(0)] = cr72346_block_42);

(cr72346_state[(2)] = null);

(cr72346_state[(1)] = cr72346_place_28);

return cr72346_state;
} else {
(cr72346_state[(0)] = cr72346_block_13);

(cr72346_state[(1)] = cr72346_place_28);

return cr72346_state;
}
}catch (e72689){var cr72346_exception = e72689;
(cr72346_state[(0)] = null);

(cr72346_state[(2)] = null);

throw cr72346_exception;
}});
var cr72346_block_2 = (function frontend$components$views$load_view_data_$_cr72346_block_2(cr72346_state){
try{var cr72346_place_4 = cljs.core.seq;
var cr72346_place_5 = query_entity_ids;
var cr72346_place_6 = (function (){var G__72694 = cr72346_place_5;
var fexpr__72693 = cr72346_place_4;
return (fexpr__72693.cljs$core$IFn$_invoke$arity$1 ? fexpr__72693.cljs$core$IFn$_invoke$arity$1(G__72694) : fexpr__72693.call(null,G__72694));
})();
var cr72346_place_7 = cr72346_place_6;
var cr72346_place_8 = null;
if(cr72346_place_7){
(cr72346_state[(0)] = cr72346_block_4);

(cr72346_state[(1)] = cr72346_place_8);

return cr72346_state;
} else {
(cr72346_state[(0)] = cr72346_block_3);

(cr72346_state[(3)] = cr72346_place_6);

(cr72346_state[(1)] = cr72346_place_8);

return cr72346_state;
}
}catch (e72692){var cr72346_exception = e72692;
(cr72346_state[(0)] = null);

(cr72346_state[(2)] = null);

throw cr72346_exception;
}});
var cr72346_block_41 = (function frontend$components$views$load_view_data_$_cr72346_block_41(cr72346_state){
try{var cr72346_place_42 = (cr72346_state[(3)]);
(cr72346_state[(0)] = cr72346_block_43);

(cr72346_state[(3)] = null);

(cr72346_state[(1)] = cr72346_place_42);

return cr72346_state;
}catch (e72695){var cr72346_exception = e72695;
(cr72346_state[(0)] = null);

(cr72346_state[(3)] = null);

(cr72346_state[(1)] = null);

throw cr72346_exception;
}});
var cr72346_block_40 = (function frontend$components$views$load_view_data_$_cr72346_block_40(cr72346_state){
try{var cr72346_place_120 = set_data_BANG_;
var cr72346_place_121 = query_entity_ids;
var cr72346_place_122 = (function (){var G__72698 = cr72346_place_121;
var fexpr__72697 = cr72346_place_120;
return (fexpr__72697.cljs$core$IFn$_invoke$arity$1 ? fexpr__72697.cljs$core$IFn$_invoke$arity$1(G__72698) : fexpr__72697.call(null,G__72698));
})();
(cr72346_state[(0)] = cr72346_block_41);

(cr72346_state[(3)] = cr72346_place_122);

return cr72346_state;
}catch (e72696){var cr72346_exception = e72696;
(cr72346_state[(0)] = null);

(cr72346_state[(3)] = null);

(cr72346_state[(1)] = null);

throw cr72346_exception;
}});
var cr72346_block_37 = (function frontend$components$views$load_view_data_$_cr72346_block_37(cr72346_state){
try{var cr72346_place_55 = (cr72346_state[(5)]);
var cr72346_place_56 = (cr72346_state[(6)]);
var cr72346_place_116 = set_loading_BANG_;
var cr72346_place_117 = false;
var cr72346_place_118 = (function (){var G__72701 = cr72346_place_117;
var fexpr__72700 = cr72346_place_116;
return (fexpr__72700.cljs$core$IFn$_invoke$arity$1 ? fexpr__72700.cljs$core$IFn$_invoke$arity$1(G__72701) : fexpr__72700.call(null,G__72701));
})();
var cr72346_place_119 = (cljs.core.truth_(cr72346_place_56)?(function(){throw cr72346_place_55})():cr72346_place_55);
(cr72346_state[(0)] = cr72346_block_38);

(cr72346_state[(5)] = null);

(cr72346_state[(6)] = null);

(cr72346_state[(2)] = cr72346_place_119);

return cr72346_state;
}catch (e72699){var cr72346_exception = e72699;
(cr72346_state[(0)] = null);

(cr72346_state[(3)] = null);

(cr72346_state[(5)] = null);

(cr72346_state[(4)] = null);

(cr72346_state[(6)] = null);

(cr72346_state[(2)] = null);

(cr72346_state[(1)] = null);

throw cr72346_exception;
}});
var cr72346_block_36 = (function frontend$components$views$load_view_data_$_cr72346_block_36(cr72346_state){
try{var cr72346_place_55 = (cr72346_state[(5)]);
var cr72346_place_114 = cr72346_place_55;
var cr72346_place_115 = (function(){throw cr72346_place_114})();
(cr72346_state[(0)] = null);

(cr72346_state[(3)] = null);

(cr72346_state[(5)] = null);

(cr72346_state[(4)] = null);

(cr72346_state[(6)] = null);

(cr72346_state[(2)] = null);

(cr72346_state[(1)] = null);

return null;
}catch (e72702){var cr72346_exception = e72702;
(cr72346_state[(0)] = cr72346_block_37);

(cr72346_state[(6)] = true);

(cr72346_state[(5)] = cr72346_exception);

return cr72346_state;
}});
var cr72346_block_17 = (function frontend$components$views$load_view_data_$_cr72346_block_17(cr72346_state){
try{var cr72346_place_43 = new cljs.core.Keyword(null,"else","else",-1508377146);
var cr72346_place_44 = null;
if(cljs.core.truth_(cr72346_place_43)){
(cr72346_state[(0)] = cr72346_block_19);

(cr72346_state[(4)] = cr72346_place_44);

return cr72346_state;
} else {
(cr72346_state[(0)] = cr72346_block_18);

(cr72346_state[(2)] = null);

(cr72346_state[(4)] = cr72346_place_44);

return cr72346_state;
}
}catch (e72703){var cr72346_exception = e72703;
(cr72346_state[(0)] = null);

(cr72346_state[(3)] = null);

(cr72346_state[(2)] = null);

(cr72346_state[(1)] = null);

throw cr72346_exception;
}});
var cr72346_block_30 = (function frontend$components$views$load_view_data_$_cr72346_block_30(cr72346_state){
try{var cr72346_place_82 = (cr72346_state[(9)]);
var cr72346_place_86 = cljs.core.assoc;
var cr72346_place_87 = cr72346_place_82;
var cr72346_place_88 = new cljs.core.Keyword(null,"query-entity-ids","query-entity-ids",2135324416);
var cr72346_place_89 = query_entity_ids;
var cr72346_place_90 = (function (){var G__72706 = cr72346_place_87;
var G__72707 = cr72346_place_88;
var G__72708 = cr72346_place_89;
var fexpr__72705 = cr72346_place_86;
return (fexpr__72705.cljs$core$IFn$_invoke$arity$3 ? fexpr__72705.cljs$core$IFn$_invoke$arity$3(G__72706,G__72707,G__72708) : fexpr__72705.call(null,G__72706,G__72707,G__72708));
})();
(cr72346_state[(0)] = cr72346_block_31);

(cr72346_state[(9)] = null);

(cr72346_state[(7)] = cr72346_place_90);

return cr72346_state;
}catch (e72704){var cr72346_exception = e72704;
(cr72346_state[(0)] = cr72346_block_36);

(cr72346_state[(8)] = null);

(cr72346_state[(7)] = null);

(cr72346_state[(10)] = null);

(cr72346_state[(11)] = null);

(cr72346_state[(9)] = null);

(cr72346_state[(5)] = cr72346_exception);

return cr72346_state;
}});
var cr72346_block_26 = (function frontend$components$views$load_view_data_$_cr72346_block_26(cr72346_state){
try{var cr72346_place_68 = new cljs.core.Keyword("db","id","db/id",-1388397098);
var cr72346_place_69 = view_parent;
var cr72346_place_70 = cr72346_place_68.cljs$core$IFn$_invoke$arity$1(cr72346_place_69);
(cr72346_state[(0)] = cr72346_block_28);

(cr72346_state[(7)] = cr72346_place_70);

return cr72346_state;
}catch (e72709){var cr72346_exception = e72709;
(cr72346_state[(0)] = cr72346_block_36);

(cr72346_state[(7)] = null);

(cr72346_state[(8)] = null);

(cr72346_state[(9)] = null);

(cr72346_state[(10)] = null);

(cr72346_state[(11)] = null);

(cr72346_state[(5)] = cr72346_exception);

return cr72346_state;
}});
var cr72346_block_13 = (function frontend$components$views$load_view_data_$_cr72346_block_13(cr72346_state){
try{var cr72346_place_29 = query_QMARK_;
var cr72346_place_30 = cljs.core.not;
var cr72346_place_31 = sorting__$1;
var cr72346_place_32 = cr72346_place_31;
var cr72346_place_33 = null;
if(cljs.core.truth_(cr72346_place_32)){
(cr72346_state[(0)] = cr72346_block_15);

(cr72346_state[(3)] = cr72346_place_29);

(cr72346_state[(5)] = cr72346_place_30);

(cr72346_state[(6)] = cr72346_place_31);

(cr72346_state[(4)] = cr72346_place_33);

return cr72346_state;
} else {
(cr72346_state[(0)] = cr72346_block_14);

(cr72346_state[(3)] = cr72346_place_29);

(cr72346_state[(5)] = cr72346_place_30);

(cr72346_state[(4)] = cr72346_place_33);

return cr72346_state;
}
}catch (e72710){var cr72346_exception = e72710;
(cr72346_state[(0)] = null);

(cr72346_state[(2)] = null);

(cr72346_state[(1)] = null);

throw cr72346_exception;
}});
var cr72346_block_8 = (function frontend$components$views$load_view_data_$_cr72346_block_8(cr72346_state){
try{var cr72346_place_15 = (cr72346_state[(4)]);
(cr72346_state[(0)] = cr72346_block_10);

(cr72346_state[(4)] = null);

(cr72346_state[(3)] = cr72346_place_15);

return cr72346_state;
}catch (e72711){var cr72346_exception = e72711;
(cr72346_state[(0)] = null);

(cr72346_state[(1)] = null);

(cr72346_state[(4)] = null);

(cr72346_state[(2)] = null);

(cr72346_state[(3)] = null);

throw cr72346_exception;
}});
var cr72346_block_34 = (function frontend$components$views$load_view_data_$_cr72346_block_34(cr72346_state){
try{var cr72346_place_104 = (cr72346_state[(8)]);
var cr72346_place_111 = set_ref_pages_count_BANG_;
var cr72346_place_112 = cr72346_place_104;
var cr72346_place_113 = (function (){var G__72714 = cr72346_place_112;
var fexpr__72713 = cr72346_place_111;
return (fexpr__72713.cljs$core$IFn$_invoke$arity$1 ? fexpr__72713.cljs$core$IFn$_invoke$arity$1(G__72714) : fexpr__72713.call(null,G__72714));
})();
(cr72346_state[(0)] = cr72346_block_35);

(cr72346_state[(8)] = null);

(cr72346_state[(7)] = cr72346_place_113);

return cr72346_state;
}catch (e72712){var cr72346_exception = e72712;
(cr72346_state[(0)] = cr72346_block_36);

(cr72346_state[(7)] = null);

(cr72346_state[(8)] = null);

(cr72346_state[(5)] = cr72346_exception);

return cr72346_state;
}});
var cr72346_block_21 = (function frontend$components$views$load_view_data_$_cr72346_block_21(cr72346_state){
try{var cr72346_place_48 = (cr72346_state[(2)]);
var cr72346_place_52 = cr72346_place_48;
(cr72346_state[(0)] = cr72346_block_22);

(cr72346_state[(2)] = null);

(cr72346_state[(5)] = cr72346_place_52);

return cr72346_state;
}catch (e72715){var cr72346_exception = e72715;
(cr72346_state[(0)] = null);

(cr72346_state[(5)] = null);

(cr72346_state[(3)] = null);

(cr72346_state[(2)] = null);

(cr72346_state[(4)] = null);

(cr72346_state[(1)] = null);

throw cr72346_exception;
}});
var cr72346_block_23 = (function frontend$components$views$load_view_data_$_cr72346_block_23(cr72346_state){
try{var cr72346_place_54 = null;
(cr72346_state[(0)] = cr72346_block_38);

(cr72346_state[(2)] = cr72346_place_54);

return cr72346_state;
}catch (e72716){var cr72346_exception = e72716;
(cr72346_state[(0)] = null);

(cr72346_state[(3)] = null);

(cr72346_state[(4)] = null);

(cr72346_state[(2)] = null);

(cr72346_state[(1)] = null);

throw cr72346_exception;
}});
var cr72346_block_42 = (function frontend$components$views$load_view_data_$_cr72346_block_42(cr72346_state){
try{var cr72346_place_123 = set_data_BANG_;
var cr72346_place_124 = null;
var cr72346_place_125 = (function (){var G__72719 = cr72346_place_124;
var fexpr__72718 = cr72346_place_123;
return (fexpr__72718.cljs$core$IFn$_invoke$arity$1 ? fexpr__72718.cljs$core$IFn$_invoke$arity$1(G__72719) : fexpr__72718.call(null,G__72719));
})();
(cr72346_state[(0)] = cr72346_block_43);

(cr72346_state[(1)] = cr72346_place_125);

return cr72346_state;
}catch (e72717){var cr72346_exception = e72717;
(cr72346_state[(0)] = null);

(cr72346_state[(1)] = null);

throw cr72346_exception;
}});
var cr72346_block_20 = (function frontend$components$views$load_view_data_$_cr72346_block_20(cr72346_state){
try{var cr72346_place_2 = (cr72346_state[(2)]);
var cr72346_place_51 = cr72346_place_2;
(cr72346_state[(0)] = cr72346_block_22);

(cr72346_state[(2)] = null);

(cr72346_state[(5)] = cr72346_place_51);

return cr72346_state;
}catch (e72720){var cr72346_exception = e72720;
(cr72346_state[(0)] = null);

(cr72346_state[(5)] = null);

(cr72346_state[(3)] = null);

(cr72346_state[(4)] = null);

(cr72346_state[(2)] = null);

(cr72346_state[(1)] = null);

throw cr72346_exception;
}});
var cr72346_block_25 = (function frontend$components$views$load_view_data_$_cr72346_block_25(cr72346_state){
try{var cr72346_place_57 = frontend.common.missionary._LT__BANG_;
var cr72346_place_58 = frontend.components.views._LT_load_view_data;
var cr72346_place_59 = view_entity;
var cr72346_place_60 = new cljs.core.Keyword(null,"view-for-id","view-for-id",-450280889);
var cr72346_place_61 = new cljs.core.Keyword("db","id","db/id",-1388397098);
var cr72346_place_62 = new cljs.core.Keyword("logseq.property","view-for","logseq.property/view-for",-36274319);
var cr72346_place_63 = view_entity;
var cr72346_place_64 = cr72346_place_62.cljs$core$IFn$_invoke$arity$1(cr72346_place_63);
var cr72346_place_65 = cr72346_place_61.cljs$core$IFn$_invoke$arity$1(cr72346_place_64);
var cr72346_place_66 = cr72346_place_65;
var cr72346_place_67 = null;
if(cljs.core.truth_(cr72346_place_66)){
(cr72346_state[(0)] = cr72346_block_27);

(cr72346_state[(12)] = cr72346_place_65);

(cr72346_state[(7)] = cr72346_place_67);

(cr72346_state[(8)] = cr72346_place_59);

(cr72346_state[(9)] = cr72346_place_60);

(cr72346_state[(10)] = cr72346_place_58);

(cr72346_state[(11)] = cr72346_place_57);

return cr72346_state;
} else {
(cr72346_state[(0)] = cr72346_block_26);

(cr72346_state[(7)] = cr72346_place_67);

(cr72346_state[(8)] = cr72346_place_59);

(cr72346_state[(9)] = cr72346_place_60);

(cr72346_state[(10)] = cr72346_place_58);

(cr72346_state[(11)] = cr72346_place_57);

return cr72346_state;
}
}catch (e72721){var cr72346_exception = e72721;
(cr72346_state[(0)] = cr72346_block_36);

(cr72346_state[(5)] = cr72346_exception);

return cr72346_state;
}});
var cr72346_block_22 = (function frontend$components$views$load_view_data_$_cr72346_block_22(cr72346_state){
try{var cr72346_place_50 = (cr72346_state[(5)]);
var cr72346_place_53 = null;
if(cljs.core.truth_(cr72346_place_50)){
(cr72346_state[(0)] = cr72346_block_24);

(cr72346_state[(5)] = null);

(cr72346_state[(2)] = cr72346_place_53);

return cr72346_state;
} else {
(cr72346_state[(0)] = cr72346_block_23);

(cr72346_state[(5)] = null);

(cr72346_state[(2)] = cr72346_place_53);

return cr72346_state;
}
}catch (e72722){var cr72346_exception = e72722;
(cr72346_state[(0)] = null);

(cr72346_state[(5)] = null);

(cr72346_state[(3)] = null);

(cr72346_state[(4)] = null);

(cr72346_state[(1)] = null);

throw cr72346_exception;
}});
var cr72346_block_33 = (function frontend$components$views$load_view_data_$_cr72346_block_33(cr72346_state){
try{var cr72346_place_110 = null;
(cr72346_state[(0)] = cr72346_block_35);

(cr72346_state[(7)] = cr72346_place_110);

return cr72346_state;
}catch (e72723){var cr72346_exception = e72723;
(cr72346_state[(0)] = cr72346_block_36);

(cr72346_state[(7)] = null);

(cr72346_state[(5)] = cr72346_exception);

return cr72346_state;
}});
var cr72346_block_7 = (function frontend$components$views$load_view_data_$_cr72346_block_7(cr72346_state){
try{var cr72346_place_13 = (cr72346_state[(5)]);
var cr72346_place_21 = cr72346_place_13;
(cr72346_state[(0)] = cr72346_block_8);

(cr72346_state[(5)] = null);

(cr72346_state[(4)] = cr72346_place_21);

return cr72346_state;
}catch (e72724){var cr72346_exception = e72724;
(cr72346_state[(0)] = null);

(cr72346_state[(1)] = null);

(cr72346_state[(4)] = null);

(cr72346_state[(2)] = null);

(cr72346_state[(5)] = null);

(cr72346_state[(3)] = null);

throw cr72346_exception;
}});
var cr72346_block_19 = (function frontend$components$views$load_view_data_$_cr72346_block_19(cr72346_state){
try{var cr72346_place_46 = cljs.core.not;
var cr72346_place_47 = query_QMARK_;
var cr72346_place_48 = (function (){var G__72727 = cr72346_place_47;
var fexpr__72726 = cr72346_place_46;
return (fexpr__72726.cljs$core$IFn$_invoke$arity$1 ? fexpr__72726.cljs$core$IFn$_invoke$arity$1(G__72727) : fexpr__72726.call(null,G__72727));
})();
var cr72346_place_49 = cr72346_place_48;
var cr72346_place_50 = null;
if(cr72346_place_49){
(cr72346_state[(0)] = cr72346_block_21);

(cr72346_state[(2)] = null);

(cr72346_state[(2)] = cr72346_place_48);

(cr72346_state[(5)] = cr72346_place_50);

return cr72346_state;
} else {
(cr72346_state[(0)] = cr72346_block_20);

(cr72346_state[(5)] = cr72346_place_50);

return cr72346_state;
}
}catch (e72725){var cr72346_exception = e72725;
(cr72346_state[(0)] = null);

(cr72346_state[(3)] = null);

(cr72346_state[(4)] = null);

(cr72346_state[(2)] = null);

(cr72346_state[(1)] = null);

throw cr72346_exception;
}});
var cr72346_block_38 = (function frontend$components$views$load_view_data_$_cr72346_block_38(cr72346_state){
try{var cr72346_place_53 = (cr72346_state[(2)]);
(cr72346_state[(0)] = cr72346_block_39);

(cr72346_state[(2)] = null);

(cr72346_state[(4)] = cr72346_place_53);

return cr72346_state;
}catch (e72728){var cr72346_exception = e72728;
(cr72346_state[(0)] = null);

(cr72346_state[(3)] = null);

(cr72346_state[(4)] = null);

(cr72346_state[(2)] = null);

(cr72346_state[(1)] = null);

throw cr72346_exception;
}});
var cr72346_block_18 = (function frontend$components$views$load_view_data_$_cr72346_block_18(cr72346_state){
try{var cr72346_place_45 = null;
(cr72346_state[(0)] = cr72346_block_39);

(cr72346_state[(4)] = cr72346_place_45);

return cr72346_state;
}catch (e72729){var cr72346_exception = e72729;
(cr72346_state[(0)] = null);

(cr72346_state[(3)] = null);

(cr72346_state[(4)] = null);

(cr72346_state[(1)] = null);

throw cr72346_exception;
}});
var cr72346_block_4 = (function frontend$components$views$load_view_data_$_cr72346_block_4(cr72346_state){
try{var cr72346_place_10 = sorting__$1;
var cr72346_place_11 = cr72346_place_10;
var cr72346_place_12 = null;
if(cljs.core.truth_(cr72346_place_11)){
(cr72346_state[(0)] = cr72346_block_9);

(cr72346_state[(4)] = cr72346_place_10);

(cr72346_state[(3)] = cr72346_place_12);

return cr72346_state;
} else {
(cr72346_state[(0)] = cr72346_block_5);

(cr72346_state[(3)] = cr72346_place_12);

return cr72346_state;
}
}catch (e72730){var cr72346_exception = e72730;
(cr72346_state[(0)] = null);

(cr72346_state[(1)] = null);

(cr72346_state[(2)] = null);

throw cr72346_exception;
}});
var cr72346_block_10 = (function frontend$components$views$load_view_data_$_cr72346_block_10(cr72346_state){
try{var cr72346_place_12 = (cr72346_state[(3)]);
(cr72346_state[(0)] = cr72346_block_11);

(cr72346_state[(3)] = null);

(cr72346_state[(1)] = cr72346_place_12);

return cr72346_state;
}catch (e72731){var cr72346_exception = e72731;
(cr72346_state[(0)] = null);

(cr72346_state[(1)] = null);

(cr72346_state[(2)] = null);

(cr72346_state[(3)] = null);

throw cr72346_exception;
}});
var cr72346_block_35 = (function frontend$components$views$load_view_data_$_cr72346_block_35(cr72346_state){
try{var cr72346_place_109 = (cr72346_state[(7)]);
(cr72346_state[(0)] = cr72346_block_37);

(cr72346_state[(7)] = null);

(cr72346_state[(5)] = cr72346_place_109);

return cr72346_state;
}catch (e72732){var cr72346_exception = e72732;
(cr72346_state[(0)] = cr72346_block_36);

(cr72346_state[(7)] = null);

(cr72346_state[(5)] = cr72346_exception);

return cr72346_state;
}});
var cr72346_block_14 = (function frontend$components$views$load_view_data_$_cr72346_block_14(cr72346_state){
try{var cr72346_place_34 = filters;
(cr72346_state[(0)] = cr72346_block_16);

(cr72346_state[(4)] = cr72346_place_34);

return cr72346_state;
}catch (e72733){var cr72346_exception = e72733;
(cr72346_state[(0)] = null);

(cr72346_state[(3)] = null);

(cr72346_state[(2)] = null);

(cr72346_state[(4)] = null);

(cr72346_state[(1)] = null);

(cr72346_state[(5)] = null);

throw cr72346_exception;
}});
var cr72346_block_31 = (function frontend$components$views$load_view_data_$_cr72346_block_31(cr72346_state){
try{var cr72346_place_59 = (cr72346_state[(8)]);
var cr72346_place_84 = (cr72346_state[(7)]);
var cr72346_place_58 = (cr72346_state[(10)]);
var cr72346_place_57 = (cr72346_state[(11)]);
var cr72346_place_91 = (function (){var G__72736 = cr72346_place_59;
var G__72737 = cr72346_place_84;
var fexpr__72735 = cr72346_place_58;
return (fexpr__72735.cljs$core$IFn$_invoke$arity$2 ? fexpr__72735.cljs$core$IFn$_invoke$arity$2(G__72736,G__72737) : fexpr__72735.call(null,G__72736,G__72737));
})();
var cr72346_place_92 = (function (){var G__72739 = cr72346_place_91;
var fexpr__72738 = cr72346_place_57;
return (fexpr__72738.cljs$core$IFn$_invoke$arity$1 ? fexpr__72738.cljs$core$IFn$_invoke$arity$1(G__72739) : fexpr__72738.call(null,G__72739));
})();
(cr72346_state[(0)] = cr72346_block_32);

(cr72346_state[(8)] = null);

(cr72346_state[(7)] = null);

(cr72346_state[(10)] = null);

(cr72346_state[(11)] = null);

return missionary.core.park(cr72346_place_92);
}catch (e72734){var cr72346_exception = e72734;
(cr72346_state[(0)] = cr72346_block_36);

(cr72346_state[(8)] = null);

(cr72346_state[(7)] = null);

(cr72346_state[(10)] = null);

(cr72346_state[(11)] = null);

(cr72346_state[(5)] = cr72346_exception);

return cr72346_state;
}});
var cr72346_block_32 = (function frontend$components$views$load_view_data_$_cr72346_block_32(cr72346_state){
try{var cr72346_place_93 = missionary.core.unpark();
var cr72346_place_94 = cljs.core.__destructure_map;
var cr72346_place_95 = cr72346_place_93;
var cr72346_place_96 = (function (){var G__72742 = cr72346_place_95;
var fexpr__72741 = cr72346_place_94;
return (fexpr__72741.cljs$core$IFn$_invoke$arity$1 ? fexpr__72741.cljs$core$IFn$_invoke$arity$1(G__72742) : fexpr__72741.call(null,G__72742));
})();
var cr72346_place_97 = cljs.core.get;
var cr72346_place_98 = cr72346_place_96;
var cr72346_place_99 = new cljs.core.Keyword(null,"data","data",-232669377);
var cr72346_place_100 = (function (){var G__72744 = cr72346_place_98;
var G__72745 = cr72346_place_99;
var fexpr__72743 = cr72346_place_97;
return (fexpr__72743.cljs$core$IFn$_invoke$arity$2 ? fexpr__72743.cljs$core$IFn$_invoke$arity$2(G__72744,G__72745) : fexpr__72743.call(null,G__72744,G__72745));
})();
var cr72346_place_101 = cljs.core.get;
var cr72346_place_102 = cr72346_place_96;
var cr72346_place_103 = new cljs.core.Keyword(null,"ref-pages-count","ref-pages-count",-74477634);
var cr72346_place_104 = (function (){var G__72747 = cr72346_place_102;
var G__72748 = cr72346_place_103;
var fexpr__72746 = cr72346_place_101;
return (fexpr__72746.cljs$core$IFn$_invoke$arity$2 ? fexpr__72746.cljs$core$IFn$_invoke$arity$2(G__72747,G__72748) : fexpr__72746.call(null,G__72747,G__72748));
})();
var cr72346_place_105 = set_data_BANG_;
var cr72346_place_106 = cr72346_place_100;
var cr72346_place_107 = (function (){var G__72750 = cr72346_place_106;
var fexpr__72749 = cr72346_place_105;
return (fexpr__72749.cljs$core$IFn$_invoke$arity$1 ? fexpr__72749.cljs$core$IFn$_invoke$arity$1(G__72750) : fexpr__72749.call(null,G__72750));
})();
var cr72346_place_108 = cr72346_place_104;
var cr72346_place_109 = null;
if(cljs.core.truth_(cr72346_place_108)){
(cr72346_state[(0)] = cr72346_block_34);

(cr72346_state[(7)] = cr72346_place_109);

(cr72346_state[(8)] = cr72346_place_104);

return cr72346_state;
} else {
(cr72346_state[(0)] = cr72346_block_33);

(cr72346_state[(7)] = cr72346_place_109);

return cr72346_state;
}
}catch (e72740){var cr72346_exception = e72740;
(cr72346_state[(0)] = cr72346_block_36);

(cr72346_state[(5)] = cr72346_exception);

return cr72346_state;
}});
var cr72346_block_5 = (function frontend$components$views$load_view_data_$_cr72346_block_5(cr72346_state){
try{var cr72346_place_13 = filters;
var cr72346_place_14 = cr72346_place_13;
var cr72346_place_15 = null;
if(cljs.core.truth_(cr72346_place_14)){
(cr72346_state[(0)] = cr72346_block_7);

(cr72346_state[(5)] = cr72346_place_13);

(cr72346_state[(4)] = cr72346_place_15);

return cr72346_state;
} else {
(cr72346_state[(0)] = cr72346_block_6);

(cr72346_state[(4)] = cr72346_place_15);

return cr72346_state;
}
}catch (e72751){var cr72346_exception = e72751;
(cr72346_state[(0)] = null);

(cr72346_state[(1)] = null);

(cr72346_state[(2)] = null);

(cr72346_state[(3)] = null);

throw cr72346_exception;
}});
var cr72346_block_0 = (function frontend$components$views$load_view_data_$_cr72346_block_0(cr72346_state){
try{var cr72346_place_0 = query_QMARK_;
var cr72346_place_1 = cr72346_place_0;
var cr72346_place_2 = null;
if(cr72346_place_1){
(cr72346_state[(0)] = cr72346_block_2);

(cr72346_state[(2)] = cr72346_place_2);

return cr72346_state;
} else {
(cr72346_state[(0)] = cr72346_block_1);

(cr72346_state[(1)] = cr72346_place_0);

(cr72346_state[(2)] = cr72346_place_2);

return cr72346_state;
}
}catch (e72752){var cr72346_exception = e72752;
(cr72346_state[(0)] = null);

throw cr72346_exception;
}});
return cloroutine.impl.coroutine((function (){var G__72753 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((13));
(G__72753[(0)] = cr72346_block_0);

return G__72753;
})());
})(),missionary.core.sp_run));
});
var sorting_filters_73403 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"sorting","sorting",622249690),sorting__$1,new cljs.core.Keyword(null,"filters","filters",974726919),filters], null);
logseq.shui.hooks.use_effect_BANG_(load_view_data,new cljs.core.PersistentVector(null, 10, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_entity),logseq.shui.hooks.use_debounced_value(input,(300)),sorting_filters_73403,group_by_property_ident,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property.view","type","logseq.property.view/type",218237607).cljs$core$IFn$_invoke$arity$1(view_entity)),new cljs.core.Keyword("logseq.property.linked-references","includes","logseq.property.linked-references/includes",1680577703).cljs$core$IFn$_invoke$arity$1(view_parent),new cljs.core.Keyword("logseq.property.linked-references","excludes","logseq.property.linked-references/excludes",242675889).cljs$core$IFn$_invoke$arity$1(view_parent),new cljs.core.Keyword(null,"filters","filters",974726919).cljs$core$IFn$_invoke$arity$1(view_parent),query_entity_ids,new cljs.core.Keyword(null,"data-changes-version","data-changes-version",-1524375086).cljs$core$IFn$_invoke$arity$1(option)], null));

if(cljs.core.truth_(loading_QMARK_)){
var attrs72756 = cljs.core.repeat.cljs$core$IFn$_invoke$arity$2((3),(function (){var G__72773 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"h-6 w-full"], null);
return (logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1(G__72773) : logseq.shui.ui.skeleton.call(null,G__72773));
})());
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs72756))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-col","space-2","gap-2","my-2"], null)], null),attrs72756], 0))):{'className':"flex flex-col space-2 gap-2 my-2"}),((cljs.core.map_QMARK_(attrs72756))?null:[daiquiri.interpreter.interpret(attrs72756)]));
} else {
return daiquiri.core.create_element("div",{'className':"flex flex-col gap-2"},[frontend.components.views.view_container(view_entity,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(option,new cljs.core.Keyword(null,"data","data",-232669377),data__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"full-data","full-data",-1430830367),data__$1,new cljs.core.Keyword(null,"filters","filters",974726919),filters,new cljs.core.Keyword(null,"sorting","sorting",622249690),sorting__$1,new cljs.core.Keyword(null,"set-filters!","set-filters!",385623142),set_filters_BANG_,new cljs.core.Keyword(null,"set-sorting!","set-sorting!",543042376),set_sorting_BANG_,new cljs.core.Keyword(null,"set-data!","set-data!",150955183),set_data_BANG_,new cljs.core.Keyword(null,"set-input!","set-input!",-615513292),set_input_BANG_,new cljs.core.Keyword(null,"input","input",556931961),input,new cljs.core.Keyword(null,"items-count","items-count",-135458025),((cljs.core.every_QMARK_(cljs.core.number_QMARK_,data__$1))?cljs.core.count(data__$1):cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (total,p__72798){
var vec__72799 = p__72798;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72799,(0),null);
var col = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72799,(1),null);
return (total + cljs.core.count(col));
}),(0),data__$1)),new cljs.core.Keyword(null,"group-by-property-ident","group-by-property-ident",1221613316),group_by_property_ident,new cljs.core.Keyword(null,"ref-pages-count","ref-pages-count",-74477634),ref_pages_count,new cljs.core.Keyword(null,"display-type","display-type",-749971179),display_type,new cljs.core.Keyword(null,"load-view-data","load-view-data",16347011),load_view_data,new cljs.core.Keyword(null,"set-view-entity!","set-view-entity!",-69891185),set_view_entity_BANG_], 0)))]);
}
}),null,"frontend.components.views/view-aux");
frontend.components.views.sub_view_data_changes = (function frontend$components$views$sub_view_data_changes(view_parent,view_feature_type){
if(cljs.core.truth_(view_parent)){
var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
var temp__5804__auto____$1 = (function (){var G__72802 = view_feature_type;
var G__72802__$1 = (((G__72802 instanceof cljs.core.Keyword))?G__72802.fqn:null);
switch (G__72802__$1) {
case "class-objects":
return new cljs.core.Keyword("frontend.worker.react","objects","frontend.worker.react/objects",-1926010543);

break;
case "linked-references":
return new cljs.core.Keyword("frontend.worker.react","refs","frontend.worker.react/refs",-217551383);

break;
default:
return null;

}
})();
if(cljs.core.truth_(temp__5804__auto____$1)){
var k = temp__5804__auto____$1;
var _STAR_version = cljs.core.atom.cljs$core$IFn$_invoke$arity$1((0));
return frontend.db.react.q(repo,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_parent)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"query-fn","query-fn",-646736760),(function (_){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_version,cljs.core.inc);
})], null),null);
} else {
return null;
}
} else {
return null;
}
} else {
return null;
}
});
frontend.components.views.sub_view = rum.core.lazy_build(rum.core.build_defc,(function (view_entity,option){
var view = (function (){var or__5002__auto__ = (function (){var G__72803 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_entity);
if((G__72803 == null)){
return null;
} else {
return (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(G__72803) : frontend.db.sub_block.call(null,G__72803));
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return view_entity;
}
})();
var data_changes_version = (function (){var G__72839 = frontend.components.views.sub_view_data_changes(new cljs.core.Keyword(null,"view-parent","view-parent",675596601).cljs$core$IFn$_invoke$arity$1(option),new cljs.core.Keyword(null,"view-feature-type","view-feature-type",-945869610).cljs$core$IFn$_invoke$arity$1(option));
if((G__72839 == null)){
return null;
} else {
return rum.core.react(G__72839);
}
})();
return frontend.components.views.view_aux(view,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(option,new cljs.core.Keyword(null,"data-changes-version","data-changes-version",-1524375086),data_changes_version));
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query], null),"frontend.components.views/sub-view");
frontend.components.views.view = rum.core.lazy_build(rum.core.build_defc,(function (p__72860){
var map__72861 = p__72860;
var map__72861__$1 = cljs.core.__destructure_map(map__72861);
var option = map__72861__$1;
var view_parent = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__72861__$1,new cljs.core.Keyword(null,"view-parent","view-parent",675596601));
var view_feature_type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__72861__$1,new cljs.core.Keyword(null,"view-feature-type","view-feature-type",-945869610));
var view_entity = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__72861__$1,new cljs.core.Keyword(null,"view-entity","view-entity",-1084117808));
var vec__72862 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_state.call(null,null));
var views = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72862,(0),null);
var set_views_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72862,(1),null);
var vec__72865 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(view_entity) : logseq.shui.hooks.use_state.call(null,view_entity));
var view_entity__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72865,(0),null);
var set_view_entity_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__72865,(1),null);
var query_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(view_feature_type,new cljs.core.Keyword(null,"query-result","query-result",-833644142));
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0();
logseq.shui.hooks.use_effect_BANG_((function (){
return frontend.common.missionary.run_task_STAR_(cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr72868_block_9 = (function frontend$components$views$cr72868_block_9(cr72868_state){
try{var cr72868_place_32 = (cr72868_state[(5)]);
var cr72868_place_35 = cr72868_place_32;
(cr72868_state[(0)] = cr72868_block_14);

(cr72868_state[(5)] = null);

(cr72868_state[(6)] = cr72868_place_35);

return cr72868_state;
}catch (e73031){var cr72868_exception = e73031;
(cr72868_state[(0)] = null);

(cr72868_state[(5)] = null);

(cr72868_state[(2)] = null);

(cr72868_state[(3)] = null);

(cr72868_state[(6)] = null);

(cr72868_state[(1)] = null);

(cr72868_state[(4)] = null);

throw cr72868_exception;
}});
var cr72868_block_24 = (function frontend$components$views$cr72868_block_24(cr72868_state){
try{var cr72868_place_11 = (cr72868_state[(2)]);
(cr72868_state[(0)] = cr72868_block_26);

(cr72868_state[(2)] = null);

(cr72868_state[(1)] = cr72868_place_11);

return cr72868_state;
}catch (e73032){var cr72868_exception = e73032;
(cr72868_state[(0)] = null);

(cr72868_state[(2)] = null);

(cr72868_state[(1)] = null);

throw cr72868_exception;
}});
var cr72868_block_13 = (function frontend$components$views$cr72868_block_13(cr72868_state){
try{var cr72868_place_38 = (cr72868_state[(7)]);
(cr72868_state[(0)] = cr72868_block_14);

(cr72868_state[(7)] = null);

(cr72868_state[(6)] = cr72868_place_38);

return cr72868_state;
}catch (e73033){var cr72868_exception = e73033;
(cr72868_state[(0)] = null);

(cr72868_state[(2)] = null);

(cr72868_state[(3)] = null);

(cr72868_state[(6)] = null);

(cr72868_state[(1)] = null);

(cr72868_state[(4)] = null);

(cr72868_state[(7)] = null);

throw cr72868_exception;
}});
var cr72868_block_15 = (function frontend$components$views$cr72868_block_15(cr72868_state){
try{var cr72868_place_44 = null;
(cr72868_state[(0)] = cr72868_block_18);

(cr72868_state[(5)] = cr72868_place_44);

return cr72868_state;
}catch (e73034){var cr72868_exception = e73034;
(cr72868_state[(0)] = null);

(cr72868_state[(2)] = null);

(cr72868_state[(5)] = null);

(cr72868_state[(1)] = null);

(cr72868_state[(4)] = null);

throw cr72868_exception;
}});
var cr72868_block_10 = (function frontend$components$views$cr72868_block_10(cr72868_state){
try{var cr72868_place_36 = view_feature_type;
var cr72868_place_37 = cr72868_place_36;
var cr72868_place_38 = null;
if(cljs.core.truth_(cr72868_place_37)){
(cr72868_state[(0)] = cr72868_block_12);

(cr72868_state[(7)] = cr72868_place_38);

return cr72868_state;
} else {
(cr72868_state[(0)] = cr72868_block_11);

(cr72868_state[(5)] = cr72868_place_36);

(cr72868_state[(7)] = cr72868_place_38);

return cr72868_state;
}
}catch (e73035){var cr72868_exception = e73035;
(cr72868_state[(0)] = null);

(cr72868_state[(2)] = null);

(cr72868_state[(3)] = null);

(cr72868_state[(6)] = null);

(cr72868_state[(1)] = null);

(cr72868_state[(4)] = null);

throw cr72868_exception;
}});
var cr72868_block_14 = (function frontend$components$views$cr72868_block_14(cr72868_state){
try{var cr72868_place_34 = (cr72868_state[(6)]);
var cr72868_place_43 = null;
if(cljs.core.truth_(cr72868_place_34)){
(cr72868_state[(0)] = cr72868_block_16);

(cr72868_state[(6)] = null);

(cr72868_state[(5)] = cr72868_place_43);

return cr72868_state;
} else {
(cr72868_state[(0)] = cr72868_block_15);

(cr72868_state[(3)] = null);

(cr72868_state[(6)] = null);

(cr72868_state[(5)] = cr72868_place_43);

return cr72868_state;
}
}catch (e73036){var cr72868_exception = e73036;
(cr72868_state[(0)] = null);

(cr72868_state[(2)] = null);

(cr72868_state[(3)] = null);

(cr72868_state[(6)] = null);

(cr72868_state[(1)] = null);

(cr72868_state[(4)] = null);

throw cr72868_exception;
}});
var cr72868_block_19 = (function frontend$components$views$cr72868_block_19(cr72868_state){
try{var cr72868_place_29 = (cr72868_state[(5)]);
var cr72868_place_26 = (cr72868_state[(3)]);
var cr72868_place_66 = cr72868_place_29;
var cr72868_place_67 = set_views_BANG_;
var cr72868_place_68 = cr72868_place_26;
var cr72868_place_69 = (function (){var G__73039 = cr72868_place_68;
var fexpr__73038 = cr72868_place_67;
return (fexpr__73038.cljs$core$IFn$_invoke$arity$1 ? fexpr__73038.cljs$core$IFn$_invoke$arity$1(G__73039) : fexpr__73038.call(null,G__73039));
})();
var cr72868_place_70 = view_entity__$1;
var cr72868_place_71 = null;
if(cljs.core.truth_(cr72868_place_70)){
(cr72868_state[(0)] = cr72868_block_21);

(cr72868_state[(5)] = null);

(cr72868_state[(3)] = null);

(cr72868_state[(5)] = cr72868_place_71);

return cr72868_state;
} else {
(cr72868_state[(0)] = cr72868_block_20);

(cr72868_state[(5)] = null);

(cr72868_state[(3)] = null);

(cr72868_state[(3)] = cr72868_place_66);

(cr72868_state[(5)] = cr72868_place_71);

return cr72868_state;
}
}catch (e73037){var cr72868_exception = e73037;
(cr72868_state[(0)] = null);

(cr72868_state[(5)] = null);

(cr72868_state[(2)] = null);

(cr72868_state[(3)] = null);

(cr72868_state[(1)] = null);

(cr72868_state[(4)] = null);

throw cr72868_exception;
}});
var cr72868_block_16 = (function frontend$components$views$cr72868_block_16(cr72868_state){
try{var cr72868_place_45 = frontend.common.missionary._LT__BANG_;
var cr72868_place_46 = frontend.components.views.create_view_BANG_;
var cr72868_place_47 = view_parent;
var cr72868_place_48 = view_feature_type;
var cr72868_place_49 = new cljs.core.Keyword(null,"auto-triggered?","auto-triggered?",1255221895);
var cr72868_place_50 = true;
var cr72868_place_51 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr72868_place_49,cr72868_place_50]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr72868_place_52 = (function (){var G__73042 = cr72868_place_47;
var G__73043 = cr72868_place_48;
var G__73044 = cr72868_place_51;
var fexpr__73041 = cr72868_place_46;
return (fexpr__73041.cljs$core$IFn$_invoke$arity$3 ? fexpr__73041.cljs$core$IFn$_invoke$arity$3(G__73042,G__73043,G__73044) : fexpr__73041.call(null,G__73042,G__73043,G__73044));
})();
var cr72868_place_53 = (function (){var G__73046 = cr72868_place_52;
var fexpr__73045 = cr72868_place_45;
return (fexpr__73045.cljs$core$IFn$_invoke$arity$1 ? fexpr__73045.cljs$core$IFn$_invoke$arity$1(G__73046) : fexpr__73045.call(null,G__73046));
})();
(cr72868_state[(0)] = cr72868_block_17);

return missionary.core.park(cr72868_place_53);
}catch (e73040){var cr72868_exception = e73040;
(cr72868_state[(0)] = null);

(cr72868_state[(2)] = null);

(cr72868_state[(3)] = null);

(cr72868_state[(5)] = null);

(cr72868_state[(1)] = null);

(cr72868_state[(4)] = null);

throw cr72868_exception;
}});
var cr72868_block_21 = (function frontend$components$views$cr72868_block_21(cr72868_state){
try{var cr72868_place_75 = null;
(cr72868_state[(0)] = cr72868_block_22);

(cr72868_state[(5)] = cr72868_place_75);

return cr72868_state;
}catch (e73047){var cr72868_exception = e73047;
(cr72868_state[(0)] = null);

(cr72868_state[(2)] = null);

(cr72868_state[(5)] = null);

(cr72868_state[(1)] = null);

(cr72868_state[(4)] = null);

throw cr72868_exception;
}});
var cr72868_block_12 = (function frontend$components$views$cr72868_block_12(cr72868_state){
try{var cr72868_place_40 = cljs.core.not;
var cr72868_place_41 = view_entity__$1;
var cr72868_place_42 = (function (){var G__73050 = cr72868_place_41;
var fexpr__73049 = cr72868_place_40;
return (fexpr__73049.cljs$core$IFn$_invoke$arity$1 ? fexpr__73049.cljs$core$IFn$_invoke$arity$1(G__73050) : fexpr__73049.call(null,G__73050));
})();
(cr72868_state[(0)] = cr72868_block_13);

(cr72868_state[(7)] = cr72868_place_42);

return cr72868_state;
}catch (e73048){var cr72868_exception = e73048;
(cr72868_state[(0)] = null);

(cr72868_state[(2)] = null);

(cr72868_state[(3)] = null);

(cr72868_state[(6)] = null);

(cr72868_state[(1)] = null);

(cr72868_state[(4)] = null);

(cr72868_state[(7)] = null);

throw cr72868_exception;
}});
var cr72868_block_11 = (function frontend$components$views$cr72868_block_11(cr72868_state){
try{var cr72868_place_36 = (cr72868_state[(5)]);
var cr72868_place_39 = cr72868_place_36;
(cr72868_state[(0)] = cr72868_block_13);

(cr72868_state[(5)] = null);

(cr72868_state[(7)] = cr72868_place_39);

return cr72868_state;
}catch (e73051){var cr72868_exception = e73051;
(cr72868_state[(0)] = null);

(cr72868_state[(2)] = null);

(cr72868_state[(3)] = null);

(cr72868_state[(6)] = null);

(cr72868_state[(5)] = null);

(cr72868_state[(1)] = null);

(cr72868_state[(4)] = null);

(cr72868_state[(7)] = null);

throw cr72868_exception;
}});
var cr72868_block_6 = (function frontend$components$views$cr72868_block_6(cr72868_state){
try{var cr72868_place_3 = (cr72868_state[(3)]);
var cr72868_place_13 = frontend.common.missionary._LT__BANG_;
var cr72868_place_14 = frontend.db.async._LT_get_views;
var cr72868_place_15 = cr72868_place_3;
var cr72868_place_16 = new cljs.core.Keyword("db","id","db/id",-1388397098);
var cr72868_place_17 = view_parent;
var cr72868_place_18 = cr72868_place_16.cljs$core$IFn$_invoke$arity$1(cr72868_place_17);
var cr72868_place_19 = view_feature_type;
var cr72868_place_20 = (function (){var G__73054 = cr72868_place_15;
var G__73055 = cr72868_place_18;
var G__73056 = cr72868_place_19;
var fexpr__73053 = cr72868_place_14;
return (fexpr__73053.cljs$core$IFn$_invoke$arity$3 ? fexpr__73053.cljs$core$IFn$_invoke$arity$3(G__73054,G__73055,G__73056) : fexpr__73053.call(null,G__73054,G__73055,G__73056));
})();
var cr72868_place_21 = (function (){var G__73058 = cr72868_place_20;
var fexpr__73057 = cr72868_place_13;
return (fexpr__73057.cljs$core$IFn$_invoke$arity$1 ? fexpr__73057.cljs$core$IFn$_invoke$arity$1(G__73058) : fexpr__73057.call(null,G__73058));
})();
(cr72868_state[(0)] = cr72868_block_7);

(cr72868_state[(3)] = null);

return missionary.core.park(cr72868_place_21);
}catch (e73052){var cr72868_exception = e73052;
(cr72868_state[(0)] = null);

(cr72868_state[(3)] = null);

(cr72868_state[(2)] = null);

(cr72868_state[(1)] = null);

throw cr72868_exception;
}});
var cr72868_block_7 = (function frontend$components$views$cr72868_block_7(cr72868_state){
try{var cr72868_place_22 = missionary.core.unpark();
var cr72868_place_23 = frontend.components.views.get_views;
var cr72868_place_24 = view_parent;
var cr72868_place_25 = view_feature_type;
var cr72868_place_26 = (function (){var G__73061 = cr72868_place_24;
var G__73062 = cr72868_place_25;
var fexpr__73060 = cr72868_place_23;
return (fexpr__73060.cljs$core$IFn$_invoke$arity$2 ? fexpr__73060.cljs$core$IFn$_invoke$arity$2(G__73061,G__73062) : fexpr__73060.call(null,G__73061,G__73062));
})();
var cr72868_place_27 = cljs.core.first;
var cr72868_place_28 = cr72868_place_26;
var cr72868_place_29 = (function (){var G__73064 = cr72868_place_28;
var fexpr__73063 = cr72868_place_27;
return (fexpr__73063.cljs$core$IFn$_invoke$arity$1 ? fexpr__73063.cljs$core$IFn$_invoke$arity$1(G__73064) : fexpr__73063.call(null,G__73064));
})();
var cr72868_place_30 = cr72868_place_29;
var cr72868_place_31 = null;
if(cljs.core.truth_(cr72868_place_30)){
(cr72868_state[(0)] = cr72868_block_19);

(cr72868_state[(5)] = cr72868_place_29);

(cr72868_state[(3)] = cr72868_place_26);

(cr72868_state[(4)] = cr72868_place_31);

return cr72868_state;
} else {
(cr72868_state[(0)] = cr72868_block_8);

(cr72868_state[(3)] = cr72868_place_26);

(cr72868_state[(4)] = cr72868_place_31);

return cr72868_state;
}
}catch (e73059){var cr72868_exception = e73059;
(cr72868_state[(0)] = null);

(cr72868_state[(2)] = null);

(cr72868_state[(1)] = null);

throw cr72868_exception;
}});
var cr72868_block_0 = (function frontend$components$views$cr72868_block_0(cr72868_state){
try{var cr72868_place_0 = query_QMARK_;
var cr72868_place_1 = null;
if(cr72868_place_0){
(cr72868_state[(0)] = cr72868_block_25);

(cr72868_state[(1)] = cr72868_place_1);

return cr72868_state;
} else {
(cr72868_state[(0)] = cr72868_block_1);

(cr72868_state[(1)] = cr72868_place_1);

return cr72868_state;
}
}catch (e73065){var cr72868_exception = e73065;
(cr72868_state[(0)] = null);

throw cr72868_exception;
}});
var cr72868_block_23 = (function frontend$components$views$cr72868_block_23(cr72868_state){
try{var cr72868_place_31 = (cr72868_state[(4)]);
(cr72868_state[(0)] = cr72868_block_24);

(cr72868_state[(4)] = null);

(cr72868_state[(2)] = cr72868_place_31);

return cr72868_state;
}catch (e73066){var cr72868_exception = e73066;
(cr72868_state[(0)] = null);

(cr72868_state[(2)] = null);

(cr72868_state[(1)] = null);

(cr72868_state[(4)] = null);

throw cr72868_exception;
}});
var cr72868_block_26 = (function frontend$components$views$cr72868_block_26(cr72868_state){
try{var cr72868_place_1 = (cr72868_state[(1)]);
(cr72868_state[(0)] = null);

(cr72868_state[(1)] = null);

return cr72868_place_1;
}catch (e73067){var cr72868_exception = e73067;
(cr72868_state[(0)] = null);

(cr72868_state[(1)] = null);

throw cr72868_exception;
}});
var cr72868_block_8 = (function frontend$components$views$cr72868_block_8(cr72868_state){
try{var cr72868_place_32 = view_parent;
var cr72868_place_33 = cr72868_place_32;
var cr72868_place_34 = null;
if(cljs.core.truth_(cr72868_place_33)){
(cr72868_state[(0)] = cr72868_block_10);

(cr72868_state[(6)] = cr72868_place_34);

return cr72868_state;
} else {
(cr72868_state[(0)] = cr72868_block_9);

(cr72868_state[(5)] = cr72868_place_32);

(cr72868_state[(6)] = cr72868_place_34);

return cr72868_state;
}
}catch (e73068){var cr72868_exception = e73068;
(cr72868_state[(0)] = null);

(cr72868_state[(2)] = null);

(cr72868_state[(3)] = null);

(cr72868_state[(1)] = null);

(cr72868_state[(4)] = null);

throw cr72868_exception;
}});
var cr72868_block_17 = (function frontend$components$views$cr72868_block_17(cr72868_state){
try{var cr72868_place_26 = (cr72868_state[(3)]);
var cr72868_place_54 = missionary.core.unpark();
var cr72868_place_55 = cljs.core.concat;
var cr72868_place_56 = cr72868_place_26;
var cr72868_place_57 = cr72868_place_54;
var cr72868_place_58 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr72868_place_57], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
var cr72868_place_59 = (function (){var G__73071 = cr72868_place_56;
var G__73072 = cr72868_place_58;
var fexpr__73070 = cr72868_place_55;
return (fexpr__73070.cljs$core$IFn$_invoke$arity$2 ? fexpr__73070.cljs$core$IFn$_invoke$arity$2(G__73071,G__73072) : fexpr__73070.call(null,G__73071,G__73072));
})();
var cr72868_place_60 = set_views_BANG_;
var cr72868_place_61 = cr72868_place_59;
var cr72868_place_62 = (function (){var G__73074 = cr72868_place_61;
var fexpr__73073 = cr72868_place_60;
return (fexpr__73073.cljs$core$IFn$_invoke$arity$1 ? fexpr__73073.cljs$core$IFn$_invoke$arity$1(G__73074) : fexpr__73073.call(null,G__73074));
})();
var cr72868_place_63 = set_view_entity_BANG_;
var cr72868_place_64 = cr72868_place_54;
var cr72868_place_65 = (function (){var G__73076 = cr72868_place_64;
var fexpr__73075 = cr72868_place_63;
return (fexpr__73075.cljs$core$IFn$_invoke$arity$1 ? fexpr__73075.cljs$core$IFn$_invoke$arity$1(G__73076) : fexpr__73075.call(null,G__73076));
})();
(cr72868_state[(0)] = cr72868_block_18);

(cr72868_state[(3)] = null);

(cr72868_state[(5)] = cr72868_place_65);

return cr72868_state;
}catch (e73069){var cr72868_exception = e73069;
(cr72868_state[(0)] = null);

(cr72868_state[(2)] = null);

(cr72868_state[(3)] = null);

(cr72868_state[(5)] = null);

(cr72868_state[(1)] = null);

(cr72868_state[(4)] = null);

throw cr72868_exception;
}});
var cr72868_block_4 = (function frontend$components$views$cr72868_block_4(cr72868_state){
try{var cr72868_place_6 = (cr72868_state[(4)]);
var cr72868_place_11 = null;
if(cljs.core.truth_(cr72868_place_6)){
(cr72868_state[(0)] = cr72868_block_6);

(cr72868_state[(4)] = null);

(cr72868_state[(2)] = cr72868_place_11);

return cr72868_state;
} else {
(cr72868_state[(0)] = cr72868_block_5);

(cr72868_state[(3)] = null);

(cr72868_state[(4)] = null);

(cr72868_state[(2)] = cr72868_place_11);

return cr72868_state;
}
}catch (e73077){var cr72868_exception = e73077;
(cr72868_state[(0)] = null);

(cr72868_state[(3)] = null);

(cr72868_state[(4)] = null);

(cr72868_state[(1)] = null);

throw cr72868_exception;
}});
var cr72868_block_3 = (function frontend$components$views$cr72868_block_3(cr72868_state){
try{var cr72868_place_8 = cljs.core.not;
var cr72868_place_9 = view_entity__$1;
var cr72868_place_10 = (function (){var G__73080 = cr72868_place_9;
var fexpr__73079 = cr72868_place_8;
return (fexpr__73079.cljs$core$IFn$_invoke$arity$1 ? fexpr__73079.cljs$core$IFn$_invoke$arity$1(G__73080) : fexpr__73079.call(null,G__73080));
})();
(cr72868_state[(0)] = cr72868_block_4);

(cr72868_state[(4)] = cr72868_place_10);

return cr72868_state;
}catch (e73078){var cr72868_exception = e73078;
(cr72868_state[(0)] = null);

(cr72868_state[(3)] = null);

(cr72868_state[(4)] = null);

(cr72868_state[(1)] = null);

throw cr72868_exception;
}});
var cr72868_block_2 = (function frontend$components$views$cr72868_block_2(cr72868_state){
try{var cr72868_place_4 = (cr72868_state[(2)]);
var cr72868_place_7 = cr72868_place_4;
(cr72868_state[(0)] = cr72868_block_4);

(cr72868_state[(2)] = null);

(cr72868_state[(4)] = cr72868_place_7);

return cr72868_state;
}catch (e73081){var cr72868_exception = e73081;
(cr72868_state[(0)] = null);

(cr72868_state[(2)] = null);

(cr72868_state[(3)] = null);

(cr72868_state[(4)] = null);

(cr72868_state[(1)] = null);

throw cr72868_exception;
}});
var cr72868_block_18 = (function frontend$components$views$cr72868_block_18(cr72868_state){
try{var cr72868_place_43 = (cr72868_state[(5)]);
(cr72868_state[(0)] = cr72868_block_23);

(cr72868_state[(5)] = null);

(cr72868_state[(4)] = cr72868_place_43);

return cr72868_state;
}catch (e73082){var cr72868_exception = e73082;
(cr72868_state[(0)] = null);

(cr72868_state[(2)] = null);

(cr72868_state[(5)] = null);

(cr72868_state[(1)] = null);

(cr72868_state[(4)] = null);

throw cr72868_exception;
}});
var cr72868_block_22 = (function frontend$components$views$cr72868_block_22(cr72868_state){
try{var cr72868_place_71 = (cr72868_state[(5)]);
(cr72868_state[(0)] = cr72868_block_23);

(cr72868_state[(5)] = null);

(cr72868_state[(4)] = cr72868_place_71);

return cr72868_state;
}catch (e73083){var cr72868_exception = e73083;
(cr72868_state[(0)] = null);

(cr72868_state[(2)] = null);

(cr72868_state[(5)] = null);

(cr72868_state[(1)] = null);

(cr72868_state[(4)] = null);

throw cr72868_exception;
}});
var cr72868_block_5 = (function frontend$components$views$cr72868_block_5(cr72868_state){
try{var cr72868_place_12 = null;
(cr72868_state[(0)] = cr72868_block_24);

(cr72868_state[(2)] = cr72868_place_12);

return cr72868_state;
}catch (e73084){var cr72868_exception = e73084;
(cr72868_state[(0)] = null);

(cr72868_state[(2)] = null);

(cr72868_state[(1)] = null);

throw cr72868_exception;
}});
var cr72868_block_20 = (function frontend$components$views$cr72868_block_20(cr72868_state){
try{var cr72868_place_66 = (cr72868_state[(3)]);
var cr72868_place_72 = set_view_entity_BANG_;
var cr72868_place_73 = cr72868_place_66;
var cr72868_place_74 = (function (){var G__73087 = cr72868_place_73;
var fexpr__73086 = cr72868_place_72;
return (fexpr__73086.cljs$core$IFn$_invoke$arity$1 ? fexpr__73086.cljs$core$IFn$_invoke$arity$1(G__73087) : fexpr__73086.call(null,G__73087));
})();
(cr72868_state[(0)] = cr72868_block_22);

(cr72868_state[(3)] = null);

(cr72868_state[(5)] = cr72868_place_74);

return cr72868_state;
}catch (e73085){var cr72868_exception = e73085;
(cr72868_state[(0)] = null);

(cr72868_state[(3)] = null);

(cr72868_state[(2)] = null);

(cr72868_state[(5)] = null);

(cr72868_state[(1)] = null);

(cr72868_state[(4)] = null);

throw cr72868_exception;
}});
var cr72868_block_1 = (function frontend$components$views$cr72868_block_1(cr72868_state){
try{var cr72868_place_2 = frontend.state.get_current_repo;
var cr72868_place_3 = (function (){var fexpr__73089 = cr72868_place_2;
return (fexpr__73089.cljs$core$IFn$_invoke$arity$0 ? fexpr__73089.cljs$core$IFn$_invoke$arity$0() : fexpr__73089.call(null));
})();
var cr72868_place_4 = db_based_QMARK_;
var cr72868_place_5 = cr72868_place_4;
var cr72868_place_6 = null;
if(cljs.core.truth_(cr72868_place_5)){
(cr72868_state[(0)] = cr72868_block_3);

(cr72868_state[(3)] = cr72868_place_3);

(cr72868_state[(4)] = cr72868_place_6);

return cr72868_state;
} else {
(cr72868_state[(0)] = cr72868_block_2);

(cr72868_state[(3)] = cr72868_place_3);

(cr72868_state[(2)] = cr72868_place_4);

(cr72868_state[(4)] = cr72868_place_6);

return cr72868_state;
}
}catch (e73088){var cr72868_exception = e73088;
(cr72868_state[(0)] = null);

(cr72868_state[(1)] = null);

throw cr72868_exception;
}});
var cr72868_block_25 = (function frontend$components$views$cr72868_block_25(cr72868_state){
try{var cr72868_place_76 = null;
(cr72868_state[(0)] = cr72868_block_26);

(cr72868_state[(1)] = cr72868_place_76);

return cr72868_state;
}catch (e73090){var cr72868_exception = e73090;
(cr72868_state[(0)] = null);

(cr72868_state[(1)] = null);

throw cr72868_exception;
}});
return cloroutine.impl.coroutine((function (){var G__73091 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((8));
(G__73091[(0)] = cr72868_block_0);

return G__73091;
})());
})(),missionary.core.sp_run));
}),cljs.core.PersistentVector.EMPTY);

if(cljs.core.truth_((cljs.core.truth_(db_based_QMARK_)?view_entity__$1:(function (){var or__5002__auto__ = view_entity__$1;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = view_parent;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(view_feature_type,new cljs.core.Keyword(null,"all-pages","all-pages",1017563062));
}
}
})()))){
var option_SINGLEQUOTE_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(option,new cljs.core.Keyword(null,"view-feature-type","view-feature-type",-945869610),(function (){var or__5002__auto__ = view_feature_type;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("logseq.property.view","feature-type","logseq.property.view/feature-type",-939141871).cljs$core$IFn$_invoke$arity$1(view_entity__$1);
}
})(),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"views","views",1450155487),views,new cljs.core.Keyword(null,"set-views!","set-views!",-185817176),set_views_BANG_,new cljs.core.Keyword(null,"set-view-entity!","set-view-entity!",-69891185),set_view_entity_BANG_], 0));
return rum.core.with_key(frontend.components.views.sub_view(view_entity__$1,option_SINGLEQUOTE_),["view-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_entity__$1))].join(''));
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.views/view");

//# sourceMappingURL=frontend.components.views.js.map
