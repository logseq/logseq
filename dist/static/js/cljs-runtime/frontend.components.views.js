goog.provide('frontend.components.views');
frontend.components.views.get_scroll_parent = (function frontend$components$views$get_scroll_parent(config){
if(cljs.core.truth_(new cljs.core.Keyword(null,"sidebar?","sidebar?",-534999672).cljs$core$IFn$_invoke$arity$1(config))){
return (dommy.utils.__GT_Array(document.getElementsByClassName("sidebar-item-list"))[(0)]);
} else {
return goog.dom.getElement("main-content-container");
}
});
frontend.components.views.header_checkbox = rum.core.lazy_build(rum.core.build_defc,(function (p__116444){
var map__116446 = p__116444;
var map__116446__$1 = cljs.core.__destructure_map(map__116446);
var table = map__116446__$1;
var selected_all_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__116446__$1,new cljs.core.Keyword(null,"selected-all?","selected-all?",1723040507));
var selected_some_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__116446__$1,new cljs.core.Keyword(null,"selected-some?","selected-some?",-1877870503));
var toggle_selected_all_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__116446__$1,new cljs.core.Keyword(null,"toggle-selected-all!","toggle-selected-all!",-649409852));
var vec__116451 = rum.core.use_state(false);
var show_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__116451,(0),null);
var set_show_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__116451,(1),null);
return daiquiri.core.create_element("label",{'htmlFor':"header-checkbox",'onMouseOver':(function (){
return (set_show_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_show_BANG_.cljs$core$IFn$_invoke$arity$1(true) : set_show_BANG_.call(null,true));
}),'onMouseOut':(function (){
return (set_show_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_show_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_show_BANG_.call(null,false));
}),'className':"h-8 w-8 flex items-center justify-center cursor-pointer"},[daiquiri.interpreter.interpret((function (){var G__116460 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"id","id",-1388402092),"header-checkbox",new cljs.core.Keyword(null,"checked","checked",-50955819),(function (){var or__5002__auto__ = selected_all_QMARK_;
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(value)?frontend.db.async._LT_get_blocks.cljs$core$IFn$_invoke$arity$variadic(frontend.state.get_current_repo(),new cljs.core.Keyword(null,"rows","rows",850049680).cljs$core$IFn$_invoke$arity$1(table),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.PersistentArrayMap.EMPTY], 0)):null)),(function (___41611__auto__){
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
return (logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1(G__116460) : logseq.shui.ui.checkbox.call(null,G__116460));
})())]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.views/header-checkbox");
frontend.components.views.header_index = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.core.create_element("label",{'htmlFor':"header-index",'title':"Row number",'className':"h-8 w-6 flex items-center justify-center"},["ID"]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.views/header-index");
frontend.components.views.row_checkbox = rum.core.lazy_build(rum.core.build_defc,(function (p__116512,row,_column){
var map__116513 = p__116512;
var map__116513__$1 = cljs.core.__destructure_map(map__116513);
var row_selected_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__116513__$1,new cljs.core.Keyword(null,"row-selected?","row-selected?",165215850));
var row_toggle_selected_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__116513__$1,new cljs.core.Keyword(null,"row-toggle-selected!","row-toggle-selected!",1549823697));
var data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__116513__$1,new cljs.core.Keyword(null,"data","data",-232669377));
var state = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__116513__$1,new cljs.core.Keyword(null,"state","state",-1988618099));
var data_fns = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__116513__$1,new cljs.core.Keyword(null,"data-fns","data-fns",-1065218324));
var idx = data.indexOf(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(row));
var id = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(row)),"-","checkbox"].join('');
var vec__116518 = rum.core.use_state(false);
var show_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__116518,(0),null);
var set_show_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__116518,(1),null);
var checked_QMARK_ = (row_selected_QMARK_.cljs$core$IFn$_invoke$arity$1 ? row_selected_QMARK_.cljs$core$IFn$_invoke$arity$1(row) : row_selected_QMARK_.call(null,row));
var map__116521 = state;
var map__116521__$1 = cljs.core.__destructure_map(map__116521);
var last_selected_idx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__116521__$1,new cljs.core.Keyword(null,"last-selected-idx","last-selected-idx",2024080238));
var row_selection = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__116521__$1,new cljs.core.Keyword(null,"row-selection","row-selection",1964656498));
var map__116522 = data_fns;
var map__116522__$1 = cljs.core.__destructure_map(map__116522);
var set_last_selected_idx_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__116522__$1,new cljs.core.Keyword(null,"set-last-selected-idx!","set-last-selected-idx!",1750927071));
var set_row_selection_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__116522__$1,new cljs.core.Keyword(null,"set-row-selection!","set-row-selection!",1872995139));
return daiquiri.core.create_element("label",{'htmlFor':[cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(row)),"-","checkbox"].join(''),'onMouseOver':(function (){
return (set_show_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_show_BANG_.cljs$core$IFn$_invoke$arity$1(true) : set_show_BANG_.call(null,true));
}),'onMouseOut':(function (){
return (set_show_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_show_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_show_BANG_.call(null,false));
}),'className':"h-8 w-8 flex items-center justify-center cursor-pointer"},[daiquiri.interpreter.interpret((function (){var G__116533 = new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"id","id",-1388402092),id,new cljs.core.Keyword(null,"checked","checked",-50955819),checked_QMARK_,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(v)?frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(row),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"skip-refresh?","skip-refresh?",878432095),true,new cljs.core.Keyword(null,"children?","children?",-1199594108),false], null)], 0)):null)),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(v)?(set_last_selected_idx_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_last_selected_idx_BANG_.cljs$core$IFn$_invoke$arity$1(idx) : set_last_selected_idx_BANG_.call(null,idx)):((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(row),last_selected_idx))?(set_last_selected_idx_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_last_selected_idx_BANG_.cljs$core$IFn$_invoke$arity$1(null) : set_last_selected_idx_BANG_.call(null,null)):null))),(function (___41611__auto____$1){
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
return (logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1(G__116533) : logseq.shui.ui.checkbox.call(null,G__116533));
})())]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.views/row-checkbox");
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.views !== 'undefined') && (typeof frontend.components.views._STAR_last_header_action_target !== 'undefined')){
} else {
frontend.components.views._STAR_last_header_action_target = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
frontend.components.views.header_cp = (function frontend$components$views$header_cp(p__116559,column){
var map__116560 = p__116559;
var map__116560__$1 = cljs.core.__destructure_map(map__116560);
var view_entity = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__116560__$1,new cljs.core.Keyword(null,"view-entity","view-entity",-1084117808));
var column_set_sorting_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__116560__$1,new cljs.core.Keyword(null,"column-set-sorting!","column-set-sorting!",892954674));
var state = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__116560__$1,new cljs.core.Keyword(null,"state","state",-1988618099));
var sorting = new cljs.core.Keyword(null,"sorting","sorting",622249690).cljs$core$IFn$_invoke$arity$1(state);
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0();
var vec__116562 = cljs.core.some((function (item){
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
var asc_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__116562,(0),null);
var property = (function (){var G__116568 = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__116568) : frontend.db.entity.call(null,G__116568));
})();
var pinned_QMARK_ = (cljs.core.truth_(property)?cljs.core.contains_QMARK_(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("logseq.property.table","pinned-columns","logseq.property.table/pinned-columns",267375138).cljs$core$IFn$_invoke$arity$1(view_entity))),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property)):null);
var sub_content = (function (p__116570){
var map__116571 = p__116570;
var map__116571__$1 = cljs.core.__destructure_map(map__116571);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__116571__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var table_options = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var G__116572 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"asc",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (column_set_sorting_BANG_.cljs$core$IFn$_invoke$arity$3 ? column_set_sorting_BANG_.cljs$core$IFn$_invoke$arity$3(sorting,column,true) : column_set_sorting_BANG_.call(null,sorting,column,true));
})], null);
var G__116573 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.items-center.gap-1","div.flex.flex-row.items-center.gap-1",-1023433319),frontend.ui.icon("arrow-up",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(15)], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"Sort ascending"], null)], null);
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__116572,G__116573) : logseq.shui.ui.dropdown_menu_item.call(null,G__116572,G__116573));
})(),(function (){var G__116574 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"desc",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (column_set_sorting_BANG_.cljs$core$IFn$_invoke$arity$3 ? column_set_sorting_BANG_.cljs$core$IFn$_invoke$arity$3(sorting,column,false) : column_set_sorting_BANG_.call(null,sorting,column,false));
})], null);
var G__116575 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.items-center.gap-1","div.flex.flex-row.items-center.gap-1",-1023433319),frontend.ui.icon("arrow-down",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(15)], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"Sort descending"], null)], null);
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__116574,G__116575) : logseq.shui.ui.dropdown_menu_item.call(null,G__116574,G__116575));
})(),(cljs.core.truth_((function (){var and__5000__auto__ = db_based_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return property;
} else {
return and__5000__auto__;
}
})())?(function (){var G__116576 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_e){
if(cljs.core.truth_(pinned_QMARK_)){
frontend.handler.db_based.property.delete_property_value_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_entity),new cljs.core.Keyword("logseq.property.table","pinned-columns","logseq.property.table/pinned-columns",267375138),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property));
} else {
frontend.handler.property.set_block_property_BANG_(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_entity),new cljs.core.Keyword("logseq.property.table","pinned-columns","logseq.property.table/pinned-columns",267375138),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property));
}

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1(id) : logseq.shui.ui.popup_hide_BANG_.call(null,id));
})], null);
var G__116577 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.items-center.gap-1","div.flex.flex-row.items-center.gap-1",-1023433319),frontend.ui.icon("pin",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(15)], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),(cljs.core.truth_(pinned_QMARK_)?"Unpin":"Pin")], null)], null);
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__116576,G__116577) : logseq.shui.ui.dropdown_menu_item.call(null,G__116576,G__116577));
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
var option = (function (){var G__116582 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"with-title?","with-title?",-1110963321),false,new cljs.core.Keyword(null,"more-options","more-options",1399478268),table_options], null);
if((!((tag == null)))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__116582,new cljs.core.Keyword(null,"class-schema?","class-schema?",508813900),true);
} else {
return G__116582;
}
})();
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.ls-property-dropdown","div.ls-property-dropdown",-263769697),frontend.components.property.config.property_dropdown(property,tag,option)], null);
});
var G__116589 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"variant","variant",-424354234),"text",new cljs.core.Keyword(null,"class","class",-2030961996),"h-8 !pl-4 !px-2 !py-0 hover:text-foreground w-full justify-start",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
var popup_id = ["table-column-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column))].join('');
var temp__5804__auto__ = (function (){var G__116611 = e.target;
if((G__116611 == null)){
return null;
} else {
return G__116611.closest("[aria-roledescription=sortable]");
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var el = temp__5804__auto__;
if((((((cljs.core.deref(frontend.components.views._STAR_last_header_action_target) == null)) || (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(el,cljs.core.deref(frontend.components.views._STAR_last_header_action_target))))) && (clojure.string.blank_QMARK_((function (){var G__116614 = el;
var G__116614__$1 = (((G__116614 == null))?null:G__116614.style);
if((G__116614__$1 == null)){
return null;
} else {
return G__116614__$1.transform;
}
})())))){
var G__116616 = el;
var G__116617 = sub_content;
var G__116618 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"id","id",-1388402092),popup_id,new cljs.core.Keyword(null,"align","align",1964212802),"start",new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558),true,new cljs.core.Keyword(null,"on-before-hide","on-before-hide",782449747),(function (){
cljs.core.reset_BANG_(frontend.components.views._STAR_last_header_action_target,el);

return setTimeout((function (){
return cljs.core.reset_BANG_(frontend.components.views._STAR_last_header_action_target,null);
}),(128));
})], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__116616,G__116617,G__116618) : logseq.shui.ui.popup_show_BANG_.call(null,G__116616,G__116617,G__116618));
} else {
return null;
}
} else {
return null;
}
})], null);
var G__116590 = (function (){var title = cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(column));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),title,new cljs.core.Keyword(null,"class","class",-2030961996),"max-w-full overflow-hidden text-ellipsis"], null),title], null);
})();
var G__116591 = (function (){var G__116621 = asc_QMARK_;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(true,G__116621)){
return frontend.ui.icon("arrow-up");
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(false,G__116621)){
return frontend.ui.icon("arrow-down");
} else {
return null;

}
}
})();
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3(G__116589,G__116590,G__116591) : logseq.shui.ui.button.call(null,G__116589,G__116590,G__116591));
});
frontend.components.views.timestamp_cell_cp = (function frontend$components$views$timestamp_cell_cp(_table,row,column){
var G__116625 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(row,new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column));
if((G__116625 == null)){
return null;
} else {
return frontend.date.int__GT_local_time_2(G__116625);
}
});
frontend.components.views.get_property_value_content = (function frontend$components$views$get_property_value_content(entity){
return logseq.db.common.view.get_property_value_content((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),entity);
});
frontend.components.views.block_container = rum.core.lazy_build(rum.core.build_defc,(function (config,row){
var container = frontend.state.get_component(new cljs.core.Keyword("block","container","block/container",510671002));
var config_SINGLEQUOTE_ = (function (){var G__116634 = config;
if(cljs.core.not(new cljs.core.Keyword(null,"popup?","popup?",-266197002).cljs$core$IFn$_invoke$arity$1(config))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__116634,new cljs.core.Keyword(null,"view?","view?",655244230),true);
} else {
return G__116634;
}
})();
return daiquiri.core.create_element("div",{'style':{'minHeight':(24)},'className':"relative w-full"},[(cljs.core.truth_(row)?daiquiri.interpreter.interpret((container.cljs$core$IFn$_invoke$arity$2 ? container.cljs$core$IFn$_invoke$arity$2(config_SINGLEQUOTE_,row) : container.call(null,config_SINGLEQUOTE_,row))):daiquiri.core.create_element("div",null,null))]);
}),null,"frontend.components.views/block-container");
frontend.components.views.save_block_and_focus = (function frontend$components$views$save_block_and_focus(_STAR_ref,set_focus_timeout_BANG_,hide_popup_QMARK_){
var node = rum.core.deref(_STAR_ref);
var cell = frontend.util.rec_get_node(node,"ls-table-cell");
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0()),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(hide_popup_QMARK_)?(logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null)):null)),(function (___41611__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.exit_editing_and_set_selected_blocks_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cell], null))),(function (___41611__auto____$2){
return promesa.protocols._promise((function (){var G__116644 = setTimeout((function (){
return cell.focus();
}),(100));
return (set_focus_timeout_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_focus_timeout_BANG_.cljs$core$IFn$_invoke$arity$1(G__116644) : set_focus_timeout_BANG_.call(null,G__116644));
})());
}));
}));
}));
}));
});
/**
 * Used on table view
 */
frontend.components.views.block_title = rum.core.lazy_build(rum.core.build_defc,(function (block_STAR_,p__116680){
var map__116681 = p__116680;
var map__116681__$1 = cljs.core.__destructure_map(map__116681);
var create_new_block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__116681__$1,new cljs.core.Keyword(null,"create-new-block","create-new-block",1377747253));
var width = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__116681__$1,new cljs.core.Keyword(null,"width","width",-384071477));
var row = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__116681__$1,new cljs.core.Keyword(null,"row","row",-570139521));
var property = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__116681__$1,new cljs.core.Keyword(null,"property","property",-1114278232));
var _STAR_ref = (logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_ref.call(null,null));
var vec__116703 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1((0)) : logseq.shui.hooks.use_state.call(null,(0)));
var opacity = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__116703,(0),null);
var set_opacity_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__116703,(1),null);
var vec__116706 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_state.call(null,null));
var focus_timeout = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__116706,(0),null);
var set_focus_timeout_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__116706,(1),null);
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
var G__116710 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
if((G__116710 == null)){
return null;
} else {
return frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$1(G__116710);
}
});
logseq.shui.hooks.use_effect_BANG_((function (){
return (function (){
var G__116712 = focus_timeout;
if((G__116712 == null)){
return null;
} else {
return clearTimeout(G__116712);
}
});
}),cljs.core.PersistentVector.EMPTY);

return daiquiri.core.create_element("div",{'ref':_STAR_ref,'onMouseOver':(function (){
return (set_opacity_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_opacity_BANG_.cljs$core$IFn$_invoke$arity$1((100)) : set_opacity_BANG_.call(null,(100)));
}),'onMouseOut':(function (){
return (set_opacity_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_opacity_BANG_.cljs$core$IFn$_invoke$arity$1((0)) : set_opacity_BANG_.call(null,(0)));
}),'onClick':(function (e){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__116725 = e.target.closest(".ls-table-cell");
var G__116726 = popup;
var G__116727 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"ls-table-block-editor","ls-table-block-editor",-2091588140),new cljs.core.Keyword(null,"as-mask?","as-mask?",1898009773),true,new cljs.core.Keyword(null,"on-after-hide","on-after-hide",-1040754229),(function (){
return frontend.components.views.save_block_and_focus(_STAR_ref,set_focus_timeout_BANG_,false);
})], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__116725,G__116726,G__116727) : logseq.shui.ui.popup_show_BANG_.call(null,G__116725,G__116726,G__116727));
})()),(function (___41611__auto__){
return promesa.protocols._promise((function (){var G__116730 = block__$1;
var G__116731 = new cljs.core.Keyword(null,"max","max",61366548);
var G__116732 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"container-id","container-id",1274665684),new cljs.core.Keyword(null,"unknown-container","unknown-container",1739831473)], null);
return (frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3(G__116730,G__116731,G__116732) : frontend.handler.editor.edit_block_BANG_.call(null,G__116730,G__116731,G__116732));
})());
}));
}));
})()
)):null));
}));
}));
}),'className':"table-block-title relative flex items-center w-full h-full cursor-pointer items-center"},[(cljs.core.truth_(block)?(function (){var attrs116782 = (function (){var render = (function (block__$1){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),(function (){var G__116817 = (function (){var G__116818 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block__$1);
var G__116818__$1 = (((G__116818 == null))?null:clojure.string.trim(G__116818));
var G__116818__$2 = (((G__116818__$1 == null))?null:clojure.string.split_lines(G__116818__$1));
if((G__116818__$2 == null)){
return null;
} else {
return cljs.core.first(G__116818__$2);
}
})();
return (inline_title.cljs$core$IFn$_invoke$arity$1 ? inline_title.cljs$core$IFn$_invoke$arity$1(G__116817) : inline_title.call(null,G__116817));
})()], null);
});
if(many_QMARK_){
return cljs.core.interpose.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mr-1","div.mr-1",470602940),","], null),cljs.core.map.cljs$core$IFn$_invoke$arity$2(render,block_STAR_));
} else {
return render(block_STAR_);
}
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs116782))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row"], null)], null),attrs116782], 0))):{'className':"flex flex-row"}),((cljs.core.map_QMARK_(attrs116782))?null:[daiquiri.interpreter.interpret(attrs116782)]));
})():daiquiri.core.create_element("div",null,null)),(function (){var class$ = ["h-6 w-6 !p-1 text-muted-foreground transition-opacity duration-100 ease-in bg-gray-01 ","opacity-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(opacity)].join('');
return daiquiri.core.create_element("div",{'className':"absolute -right-1"},[(function (){var attrs116962 = (function (){var G__116963 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"title","title",636505583),"Open",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
frontend.util.stop_propagation(e);

return redirect_BANG_();
}),new cljs.core.Keyword(null,"class","class",-2030961996),class$], null);
var G__116964 = frontend.ui.icon("arrow-right");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__116963,G__116964) : logseq.shui.ui.button.call(null,G__116963,G__116964));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs116962))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","items-center"], null)], null),attrs116962], 0))):{'className':"flex flex-row items-center"}),((cljs.core.map_QMARK_(attrs116962))?[daiquiri.interpreter.interpret((function (){var G__116967 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"title","title",636505583),"Open in sidebar",new cljs.core.Keyword(null,"class","class",-2030961996),class$,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
frontend.util.stop_propagation(e);

return add_to_sidebar_BANG_();
})], null);
var G__116968 = frontend.ui.icon("layout-sidebar-right");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__116967,G__116968) : logseq.shui.ui.button.call(null,G__116967,G__116968));
})())]:[daiquiri.interpreter.interpret(attrs116962),daiquiri.interpreter.interpret((function (){var G__116973 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"title","title",636505583),"Open in sidebar",new cljs.core.Keyword(null,"class","class",-2030961996),class$,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
frontend.util.stop_propagation(e);

return add_to_sidebar_BANG_();
})], null);
var G__116974 = frontend.ui.icon("layout-sidebar-right");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__116973,G__116974) : logseq.shui.ui.button.call(null,G__116973,G__116974));
})())]));
})()]);
})()]);
}),null,"frontend.components.views/block-title");
frontend.components.views.build_columns = (function frontend$components$views$build_columns(var_args){
var args__5732__auto__ = [];
var len__5726__auto___122339 = arguments.length;
var i__5727__auto___122340 = (0);
while(true){
if((i__5727__auto___122340 < len__5726__auto___122339)){
args__5732__auto__.push((arguments[i__5727__auto___122340]));

var G__122342 = (i__5727__auto___122340 + (1));
i__5727__auto___122340 = G__122342;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.components.views.build_columns.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.components.views.build_columns.cljs$core$IFn$_invoke$arity$variadic = (function (config,properties,p__116981){
var map__116982 = p__116981;
var map__116982__$1 = cljs.core.__destructure_map(map__116982);
var with_object_name_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__116982__$1,new cljs.core.Keyword(null,"with-object-name?","with-object-name?",1288972903),true);
var with_id_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__116982__$1,new cljs.core.Keyword(null,"with-id?","with-id?",1405069912),true);
var add_tags_column_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__116982__$1,new cljs.core.Keyword(null,"add-tags-column?","add-tags-column?",708044916),true);
var add_tags_column_QMARK__SINGLEQUOTE_ = (function (){var and__5000__auto__ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo());
if(and__5000__auto__){
return add_tags_column_QMARK_;
} else {
return and__5000__auto__;
}
})();
var properties_SINGLEQUOTE_ = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,(cljs.core.truth_((function (){var or__5002__auto__ = cljs.core.some((function (p1__116975_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(p1__116975_SHARP_),new cljs.core.Keyword("block","tags","block/tags",1814948340));
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
(frontend.components.views.build_columns.cljs$lang$applyTo = (function (seq116976){
var G__116977 = cljs.core.first(seq116976);
var seq116976__$1 = cljs.core.next(seq116976);
var G__116978 = cljs.core.first(seq116976__$1);
var seq116976__$2 = cljs.core.next(seq116976__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__116977,G__116978,seq116976__$2);
}));

frontend.components.views.sort_columns = (function frontend$components$views$sort_columns(columns,ordered_column_ids){
if(cljs.core.seq(ordered_column_ids)){
var id__GT_columns = cljs.core.zipmap(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092),columns),columns);
var ordered_id_set = cljs.core.set(ordered_column_ids);
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (id){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(id__GT_columns,id);
}),ordered_column_ids),cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (column){
var G__117001 = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column);
return (ordered_id_set.cljs$core$IFn$_invoke$arity$1 ? ordered_id_set.cljs$core$IFn$_invoke$arity$1(G__117001) : ordered_id_set.call(null,G__117001));
}),columns));
} else {
return columns;
}
});
frontend.components.views.more_actions = rum.core.lazy_build(rum.core.build_defc,(function (view_entity,columns,p__117006,p__117007){
var map__117008 = p__117006;
var map__117008__$1 = cljs.core.__destructure_map(map__117008);
var column_visible_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117008__$1,new cljs.core.Keyword(null,"column-visible?","column-visible?",-864117722));
var rows = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117008__$1,new cljs.core.Keyword(null,"rows","rows",850049680));
var column_toggle_visibility = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117008__$1,new cljs.core.Keyword(null,"column-toggle-visibility","column-toggle-visibility",481480390));
var map__117009 = p__117007;
var map__117009__$1 = cljs.core.__destructure_map(map__117009);
var group_by_property_ident = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117009__$1,new cljs.core.Keyword(null,"group-by-property-ident","group-by-property-ident",1221613316));
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
var temp__5804__auto__ = (function (){var G__117012 = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__117012) : frontend.db.entity.call(null,G__117012));
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
return daiquiri.interpreter.interpret((function (){var G__117066 = (function (){var G__117068 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"asChild","asChild",682531623),true], null);
var G__117069 = (function (){var G__117070 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"variant","variant",-424354234),"ghost",new cljs.core.Keyword(null,"class","class",-2030961996),"text-muted-foreground !px-1",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065)], null);
var G__117071 = frontend.ui.icon("dots",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(15)], null));
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__117070,G__117071) : logseq.shui.ui.button.call(null,G__117070,G__117071));
})();
return (logseq.shui.ui.dropdown_menu_trigger.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_trigger.cljs$core$IFn$_invoke$arity$2(G__117068,G__117069) : logseq.shui.ui.dropdown_menu_trigger.call(null,G__117068,G__117069));
})();
var G__117067 = (function (){var G__117072 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"align","align",1964212802),"end"], null);
var G__117073 = (function (){var G__117074 = ((table_QMARK_)?(function (){var G__117077 = (logseq.shui.ui.dropdown_menu_sub_trigger.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_sub_trigger.cljs$core$IFn$_invoke$arity$1("Columns visibility") : logseq.shui.ui.dropdown_menu_sub_trigger.call(null,"Columns visibility"));
var G__117078 = (function (){var G__117079 = (function (){var iter__5480__auto__ = (function frontend$components$views$iter__117080(s__117081){
return (new cljs.core.LazySeq(null,(function (){
var s__117081__$1 = s__117081;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__117081__$1);
if(temp__5804__auto__){
var s__117081__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__117081__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__117081__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__117083 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__117082 = (0);
while(true){
if((i__117082 < size__5479__auto__)){
var column = cljs.core._nth(c__5478__auto__,i__117082);
cljs.core.chunk_append(b__117083,(function (){var G__117085 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"key","key",-1516042587),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column)),new cljs.core.Keyword(null,"className","className",-1983287057),"capitalize",new cljs.core.Keyword(null,"checked","checked",-50955819),(column_visible_QMARK_.cljs$core$IFn$_invoke$arity$1 ? column_visible_QMARK_.cljs$core$IFn$_invoke$arity$1(column) : column_visible_QMARK_.call(null,column)),new cljs.core.Keyword(null,"onCheckedChange","onCheckedChange",842153815),((function (i__117082,column,c__5478__auto__,size__5479__auto__,b__117083,s__117081__$2,temp__5804__auto__,G__117077,G__117072,G__117066,display_type,table_QMARK_,group_by_columns,map__117008,map__117008__$1,column_visible_QMARK_,rows,column_toggle_visibility,map__117009,map__117009__$1,group_by_property_ident){
return (function (p1__117004_SHARP_){
return (column_toggle_visibility.cljs$core$IFn$_invoke$arity$2 ? column_toggle_visibility.cljs$core$IFn$_invoke$arity$2(column,p1__117004_SHARP_) : column_toggle_visibility.call(null,column,p1__117004_SHARP_));
});})(i__117082,column,c__5478__auto__,size__5479__auto__,b__117083,s__117081__$2,temp__5804__auto__,G__117077,G__117072,G__117066,display_type,table_QMARK_,group_by_columns,map__117008,map__117008__$1,column_visible_QMARK_,rows,column_toggle_visibility,map__117009,map__117009__$1,group_by_property_ident))
,new cljs.core.Keyword(null,"onSelect","onSelect",251862405),((function (i__117082,column,c__5478__auto__,size__5479__auto__,b__117083,s__117081__$2,temp__5804__auto__,G__117077,G__117072,G__117066,display_type,table_QMARK_,group_by_columns,map__117008,map__117008__$1,column_visible_QMARK_,rows,column_toggle_visibility,map__117009,map__117009__$1,group_by_property_ident){
return (function (e){
return e.preventDefault();
});})(i__117082,column,c__5478__auto__,size__5479__auto__,b__117083,s__117081__$2,temp__5804__auto__,G__117077,G__117072,G__117066,display_type,table_QMARK_,group_by_columns,map__117008,map__117008__$1,column_visible_QMARK_,rows,column_toggle_visibility,map__117009,map__117009__$1,group_by_property_ident))
], null);
var G__117086 = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(column);
return (logseq.shui.ui.dropdown_menu_checkbox_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_checkbox_item.cljs$core$IFn$_invoke$arity$2(G__117085,G__117086) : logseq.shui.ui.dropdown_menu_checkbox_item.call(null,G__117085,G__117086));
})());

var G__122386 = (i__117082 + (1));
i__117082 = G__122386;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__117083),frontend$components$views$iter__117080(cljs.core.chunk_rest(s__117081__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__117083),null);
}
} else {
var column = cljs.core.first(s__117081__$2);
return cljs.core.cons((function (){var G__117088 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"key","key",-1516042587),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column)),new cljs.core.Keyword(null,"className","className",-1983287057),"capitalize",new cljs.core.Keyword(null,"checked","checked",-50955819),(column_visible_QMARK_.cljs$core$IFn$_invoke$arity$1 ? column_visible_QMARK_.cljs$core$IFn$_invoke$arity$1(column) : column_visible_QMARK_.call(null,column)),new cljs.core.Keyword(null,"onCheckedChange","onCheckedChange",842153815),((function (column,s__117081__$2,temp__5804__auto__,G__117077,G__117072,G__117066,display_type,table_QMARK_,group_by_columns,map__117008,map__117008__$1,column_visible_QMARK_,rows,column_toggle_visibility,map__117009,map__117009__$1,group_by_property_ident){
return (function (p1__117004_SHARP_){
return (column_toggle_visibility.cljs$core$IFn$_invoke$arity$2 ? column_toggle_visibility.cljs$core$IFn$_invoke$arity$2(column,p1__117004_SHARP_) : column_toggle_visibility.call(null,column,p1__117004_SHARP_));
});})(column,s__117081__$2,temp__5804__auto__,G__117077,G__117072,G__117066,display_type,table_QMARK_,group_by_columns,map__117008,map__117008__$1,column_visible_QMARK_,rows,column_toggle_visibility,map__117009,map__117009__$1,group_by_property_ident))
,new cljs.core.Keyword(null,"onSelect","onSelect",251862405),((function (column,s__117081__$2,temp__5804__auto__,G__117077,G__117072,G__117066,display_type,table_QMARK_,group_by_columns,map__117008,map__117008__$1,column_visible_QMARK_,rows,column_toggle_visibility,map__117009,map__117009__$1,group_by_property_ident){
return (function (e){
return e.preventDefault();
});})(column,s__117081__$2,temp__5804__auto__,G__117077,G__117072,G__117066,display_type,table_QMARK_,group_by_columns,map__117008,map__117008__$1,column_visible_QMARK_,rows,column_toggle_visibility,map__117009,map__117009__$1,group_by_property_ident))
], null);
var G__117089 = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(column);
return (logseq.shui.ui.dropdown_menu_checkbox_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_checkbox_item.cljs$core$IFn$_invoke$arity$2(G__117088,G__117089) : logseq.shui.ui.dropdown_menu_checkbox_item.call(null,G__117088,G__117089));
})(),frontend$components$views$iter__117080(cljs.core.rest(s__117081__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__117003_SHARP_){
var or__5002__auto__ = new cljs.core.Keyword(null,"column-list?","column-list?",-538229318).cljs$core$IFn$_invoke$arity$1(p1__117003_SHARP_) === false;
if(or__5002__auto__){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"disable-hide?","disable-hide?",-1203602151).cljs$core$IFn$_invoke$arity$1(p1__117003_SHARP_);
}
}),columns));
})();
return (logseq.shui.ui.dropdown_menu_sub_content.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_sub_content.cljs$core$IFn$_invoke$arity$1(G__117079) : logseq.shui.ui.dropdown_menu_sub_content.call(null,G__117079));
})();
return (logseq.shui.ui.dropdown_menu_sub.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_sub.cljs$core$IFn$_invoke$arity$2(G__117077,G__117078) : logseq.shui.ui.dropdown_menu_sub.call(null,G__117077,G__117078));
})():null);
var G__117075 = ((cljs.core.seq(group_by_columns))?(function (){var G__117090 = (logseq.shui.ui.dropdown_menu_sub_trigger.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_sub_trigger.cljs$core$IFn$_invoke$arity$1("Group by") : logseq.shui.ui.dropdown_menu_sub_trigger.call(null,"Group by"));
var G__117091 = (function (){var G__117092 = (function (){var iter__5480__auto__ = (function frontend$components$views$iter__117093(s__117094){
return (new cljs.core.LazySeq(null,(function (){
var s__117094__$1 = s__117094;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__117094__$1);
if(temp__5804__auto__){
var s__117094__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__117094__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__117094__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__117096 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__117095 = (0);
while(true){
if((i__117095 < size__5479__auto__)){
var column = cljs.core._nth(c__5478__auto__,i__117095);
cljs.core.chunk_append(b__117096,(function (){var G__117099 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"key","key",-1516042587),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column)),new cljs.core.Keyword(null,"className","className",-1983287057),"capitalize",new cljs.core.Keyword(null,"checked","checked",-50955819),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column),group_by_property_ident),new cljs.core.Keyword(null,"onCheckedChange","onCheckedChange",842153815),((function (i__117095,column,c__5478__auto__,size__5479__auto__,b__117096,s__117094__$2,temp__5804__auto__,G__117090,G__117074,G__117072,G__117066,display_type,table_QMARK_,group_by_columns,map__117008,map__117008__$1,column_visible_QMARK_,rows,column_toggle_visibility,map__117009,map__117009__$1,group_by_property_ident){
return (function (result){
if(cljs.core.truth_(result)){
return frontend.handler.db_based.property.set_block_property_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_entity),new cljs.core.Keyword("logseq.property.view","group-by-property","logseq.property.view/group-by-property",809216236),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((function (){var G__117102 = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__117102) : frontend.db.entity.call(null,G__117102));
})()));
} else {
return frontend.handler.db_based.property.remove_block_property_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_entity),new cljs.core.Keyword("logseq.property.view","group-by-property","logseq.property.view/group-by-property",809216236));
}
});})(i__117095,column,c__5478__auto__,size__5479__auto__,b__117096,s__117094__$2,temp__5804__auto__,G__117090,G__117074,G__117072,G__117066,display_type,table_QMARK_,group_by_columns,map__117008,map__117008__$1,column_visible_QMARK_,rows,column_toggle_visibility,map__117009,map__117009__$1,group_by_property_ident))
,new cljs.core.Keyword(null,"onSelect","onSelect",251862405),((function (i__117095,column,c__5478__auto__,size__5479__auto__,b__117096,s__117094__$2,temp__5804__auto__,G__117090,G__117074,G__117072,G__117066,display_type,table_QMARK_,group_by_columns,map__117008,map__117008__$1,column_visible_QMARK_,rows,column_toggle_visibility,map__117009,map__117009__$1,group_by_property_ident){
return (function (e){
return e.preventDefault();
});})(i__117095,column,c__5478__auto__,size__5479__auto__,b__117096,s__117094__$2,temp__5804__auto__,G__117090,G__117074,G__117072,G__117066,display_type,table_QMARK_,group_by_columns,map__117008,map__117008__$1,column_visible_QMARK_,rows,column_toggle_visibility,map__117009,map__117009__$1,group_by_property_ident))
], null);
var G__117100 = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(column);
return (logseq.shui.ui.dropdown_menu_checkbox_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_checkbox_item.cljs$core$IFn$_invoke$arity$2(G__117099,G__117100) : logseq.shui.ui.dropdown_menu_checkbox_item.call(null,G__117099,G__117100));
})());

var G__122404 = (i__117095 + (1));
i__117095 = G__122404;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__117096),frontend$components$views$iter__117093(cljs.core.chunk_rest(s__117094__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__117096),null);
}
} else {
var column = cljs.core.first(s__117094__$2);
return cljs.core.cons((function (){var G__117105 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"key","key",-1516042587),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column)),new cljs.core.Keyword(null,"className","className",-1983287057),"capitalize",new cljs.core.Keyword(null,"checked","checked",-50955819),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column),group_by_property_ident),new cljs.core.Keyword(null,"onCheckedChange","onCheckedChange",842153815),((function (column,s__117094__$2,temp__5804__auto__,G__117090,G__117074,G__117072,G__117066,display_type,table_QMARK_,group_by_columns,map__117008,map__117008__$1,column_visible_QMARK_,rows,column_toggle_visibility,map__117009,map__117009__$1,group_by_property_ident){
return (function (result){
if(cljs.core.truth_(result)){
return frontend.handler.db_based.property.set_block_property_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_entity),new cljs.core.Keyword("logseq.property.view","group-by-property","logseq.property.view/group-by-property",809216236),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((function (){var G__117108 = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__117108) : frontend.db.entity.call(null,G__117108));
})()));
} else {
return frontend.handler.db_based.property.remove_block_property_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_entity),new cljs.core.Keyword("logseq.property.view","group-by-property","logseq.property.view/group-by-property",809216236));
}
});})(column,s__117094__$2,temp__5804__auto__,G__117090,G__117074,G__117072,G__117066,display_type,table_QMARK_,group_by_columns,map__117008,map__117008__$1,column_visible_QMARK_,rows,column_toggle_visibility,map__117009,map__117009__$1,group_by_property_ident))
,new cljs.core.Keyword(null,"onSelect","onSelect",251862405),((function (column,s__117094__$2,temp__5804__auto__,G__117090,G__117074,G__117072,G__117066,display_type,table_QMARK_,group_by_columns,map__117008,map__117008__$1,column_visible_QMARK_,rows,column_toggle_visibility,map__117009,map__117009__$1,group_by_property_ident){
return (function (e){
return e.preventDefault();
});})(column,s__117094__$2,temp__5804__auto__,G__117090,G__117074,G__117072,G__117066,display_type,table_QMARK_,group_by_columns,map__117008,map__117008__$1,column_visible_QMARK_,rows,column_toggle_visibility,map__117009,map__117009__$1,group_by_property_ident))
], null);
var G__117106 = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(column);
return (logseq.shui.ui.dropdown_menu_checkbox_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_checkbox_item.cljs$core$IFn$_invoke$arity$2(G__117105,G__117106) : logseq.shui.ui.dropdown_menu_checkbox_item.call(null,G__117105,G__117106));
})(),frontend$components$views$iter__117093(cljs.core.rest(s__117094__$2)));
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
return (logseq.shui.ui.dropdown_menu_sub_content.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_sub_content.cljs$core$IFn$_invoke$arity$1(G__117092) : logseq.shui.ui.dropdown_menu_sub_content.call(null,G__117092));
})();
return (logseq.shui.ui.dropdown_menu_sub.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_sub.cljs$core$IFn$_invoke$arity$2(G__117090,G__117091) : logseq.shui.ui.dropdown_menu_sub.call(null,G__117090,G__117091));
})():null);
var G__117076 = (function (){var G__117109 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"export-edn",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.db_based.export$.export_view_nodes_data(rows);
})], null);
var G__117110 = "Export EDN";
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__117109,G__117110) : logseq.shui.ui.dropdown_menu_item.call(null,G__117109,G__117110));
})();
return (logseq.shui.ui.dropdown_menu_group.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_group.cljs$core$IFn$_invoke$arity$3(G__117074,G__117075,G__117076) : logseq.shui.ui.dropdown_menu_group.call(null,G__117074,G__117075,G__117076));
})();
return (logseq.shui.ui.dropdown_menu_content.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_content.cljs$core$IFn$_invoke$arity$2(G__117072,G__117073) : logseq.shui.ui.dropdown_menu_content.call(null,G__117072,G__117073));
})();
return (logseq.shui.ui.dropdown_menu.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu.cljs$core$IFn$_invoke$arity$2(G__117066,G__117067) : logseq.shui.ui.dropdown_menu.call(null,G__117066,G__117067));
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
var G__117114 = id;
var G__117114__$1 = (((G__117114 instanceof cljs.core.Keyword))?G__117114.fqn:null);
switch (G__117114__$1) {
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
var attrs117122 = (function (){var G__117124 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"variant","variant",-424354234),"text",new cljs.core.Keyword(null,"class","class",-2030961996),"h-8 !pl-4 !px-2 !py-0 hover:text-foreground w-full justify-start"], null);
var G__117125 = frontend.ui.icon("plus");
var G__117126 = "New property";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3(G__117124,G__117125,G__117126) : logseq.shui.ui.button.call(null,G__117124,G__117125,G__117126));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs117122))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ls-table-header-cell","!border-0"], null)], null),attrs117122], 0))):{'className':"ls-table-header-cell !border-0"}),((cljs.core.map_QMARK_(attrs117122))?null:[daiquiri.interpreter.interpret(attrs117122)]));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.views/add-property-button");
frontend.components.views.action_bar = rum.core.lazy_build(rum.core.build_defc,(function (table,selected_rows,p__117128){
var map__117129 = p__117128;
var map__117129__$1 = cljs.core.__destructure_map(map__117129);
var on_delete_rows = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117129__$1,new cljs.core.Keyword(null,"on-delete-rows","on-delete-rows",464374868));
return daiquiri.interpreter.interpret(logseq.shui.ui.table_actions(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.count(selected_rows))," selected"].join('')], null),frontend.components.selection.action_bar(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"on-cut","on-cut",-1019124687),(function (){
return (on_delete_rows.cljs$core$IFn$_invoke$arity$2 ? on_delete_rows.cljs$core$IFn$_invoke$arity$2(table,selected_rows) : on_delete_rows.call(null,table,selected_rows));
}),new cljs.core.Keyword(null,"selected-blocks","selected-blocks",-96882948),selected_rows,new cljs.core.Keyword(null,"hide-dots?","hide-dots?",-901521952),true,new cljs.core.Keyword(null,"button-border?","button-border?",-2028710343),true], null))));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.views/action-bar");
frontend.components.views.column_resizer = rum.core.lazy_build(rum.core.build_defc,(function (_column,on_sized_BANG_){
var _STAR_el = rum.core.use_ref(null);
var vec__117137 = rum.core.use_state(null);
var dx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117137,(0),null);
var set_dx_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117137,(1),null);
var vec__117140 = rum.core.use_state(null);
var width = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117140,(0),null);
var set_width_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117140,(1),null);
var add_resizing_class = (function (){
return dommy.core.add_class_BANG_.cljs$core$IFn$_invoke$arity$2(document.documentElement,"is-resizing-buf");
});
var remove_resizing_class = (function (){
return dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$2(document.documentElement,"is-resizing-buf");
});
logseq.shui.hooks.use_effect_BANG_((function (){
if(typeof dx === 'number'){
var G__117149 = rum.core.deref(_STAR_el);
if((G__117149 == null)){
return null;
} else {
return dommy.core.set_style_BANG_.cljs$core$IFn$_invoke$arity$variadic(G__117149,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"transform","transform",1381301764),["translate3D(",cljs.core.str.cljs$core$IFn$_invoke$arity$1(dx),"px , 0, 0)"].join('')], 0));
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
var map__117155 = cljs_bean.core.__GT_clj(el.closest(".ls-table-header-cell").getBoundingClientRect().toJSON());
var map__117155__$1 = cljs.core.__destructure_map(map__117155);
var rect = map__117155__$1;
var width__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117155__$1,new cljs.core.Keyword(null,"width","width",-384071477));
var right = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117155__$1,new cljs.core.Keyword(null,"right","right",-452581833));
var left_dx = (((width__$1 >= min_width))?(min_width - width__$1):(0));
var right_dx = (((width__$1 <= max_width))?(max_width - width__$1):(0));
cljs.core.reset_BANG_(_STAR_field_rect,rect);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(_STAR_field_rect,cljs.core.assoc,new cljs.core.Keyword(null,"left-dx","left-dx",-1775595870),left_dx,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"right-dx","right-dx",531815659),right_dx,new cljs.core.Keyword(null,"left-b","left-b",-1716414262),((left_dx + right) + (1)),new cljs.core.Keyword(null,"right-b","right-b",33784407),((right_dx + right) + (1))], 0));

return dommy.core.add_class_BANG_.cljs$core$IFn$_invoke$arity$2(el,"is-active");
}),new cljs.core.Keyword(null,"move","move",-2110884309),(function (e){
var dx__$1 = e.dx;
var pointer_x = Math.floor(e.clientX);
var map__117158 = cljs.core.deref(_STAR_field_rect);
var map__117158__$1 = cljs.core.__destructure_map(map__117158);
var left_b = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117158__$1,new cljs.core.Keyword(null,"left-b","left-b",-1716414262));
var right_b = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117158__$1,new cljs.core.Keyword(null,"right-b","right-b",33784407));
var left_b__$1 = Math.floor(left_b);
var right_b__$1 = Math.floor(right_b);
if((((pointer_x > left_b__$1)) && ((pointer_x < right_b__$1)))){
var G__117160 = (function (dx_SINGLEQUOTE_){
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
var map__117161 = cljs.core.deref(_STAR_field_rect);
var map__117161__$1 = cljs.core.__destructure_map(map__117161);
var left_dx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117161__$1,new cljs.core.Keyword(null,"left-dx","left-dx",-1775595870));
var right_dx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117161__$1,new cljs.core.Keyword(null,"right-dx","right-dx",531815659));
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
return (set_dx_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_dx_BANG_.cljs$core$IFn$_invoke$arity$1(G__117160) : set_dx_BANG_.call(null,G__117160));
} else {
return null;
}
}),new cljs.core.Keyword(null,"end","end",-268185958),(function (){
var G__117163 = (function (dx__$1){
var w_122438 = Math.round((dx__$1 + new cljs.core.Keyword(null,"width","width",-384071477).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(_STAR_field_rect))));
var G__117165_122439 = (((w_122438 < min_width))?min_width:(((w_122438 > max_width))?max_width:w_122438
));
(set_width_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_width_BANG_.cljs$core$IFn$_invoke$arity$1(G__117165_122439) : set_width_BANG_.call(null,G__117165_122439));

cljs.core.reset_BANG_(_STAR_field_rect,null);

dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$2(el,"is-active");

return (0);
});
return (set_dx_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_dx_BANG_.cljs$core$IFn$_invoke$arity$1(G__117163) : set_dx_BANG_.call(null,G__117163));
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
var G__117175 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(sized_columns,new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column),size);
return (set_sized_columns_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_sized_columns_BANG_.cljs$core$IFn$_invoke$arity$1(G__117175) : set_sized_columns_BANG_.call(null,G__117175));
})))], null);
});
frontend.components.views.on_delete_rows = (function frontend$components$views$on_delete_rows(view_parent,view_feature_type,table,selected_ids){
var selected_rows = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160),cljs.core.map.cljs$core$IFn$_invoke$arity$2(frontend.db.entity,selected_ids));
var pages = cljs.core.filter.cljs$core$IFn$_invoke$arity$2(logseq.db.page_QMARK_,selected_rows);
var blocks = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(logseq.db.page_QMARK_,selected_rows);
var page_ids = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),pages);
var map__117183 = new cljs.core.Keyword(null,"data-fns","data-fns",-1065218324).cljs$core$IFn$_invoke$arity$1(table);
var map__117183__$1 = cljs.core.__destructure_map(map__117183);
var set_data_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117183__$1,new cljs.core.Keyword(null,"set-data!","set-data!",150955183));
var set_row_selection_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117183__$1,new cljs.core.Keyword(null,"set-row-selection!","set-row-selection!",1872995139));
var update_table_state_BANG_ = (function (){
var data = new cljs.core.Keyword(null,"full-data","full-data",-1430830367).cljs$core$IFn$_invoke$arity$1(table);
var selected_ids__$1 = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),selected_rows));
var new_data = ((cljs.core.every_QMARK_(cljs.core.number_QMARK_,data))?cljs.core.remove.cljs$core$IFn$_invoke$arity$2(selected_ids__$1,data):cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__117185){
var vec__117186 = p__117185;
var by_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117186,(0),null);
var col = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117186,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [by_value,cljs.core.remove.cljs$core$IFn$_invoke$arity$2(selected_ids__$1,col)], null);
}),data));
(set_data_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_data_BANG_.cljs$core$IFn$_invoke$arity$1(new_data) : set_data_BANG_.call(null,new_data));

var G__117189 = cljs.core.PersistentArrayMap.EMPTY;
return (set_row_selection_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_row_selection_BANG_.cljs$core$IFn$_invoke$arity$1(G__117189) : set_row_selection_BANG_.call(null,G__117189));
});
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var test_QMARK___49426__auto__ = frontend.util.node_test_QMARK_;
var ops__49427__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__49428__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__49428__auto__);

if(cljs.core.truth_(ops__49427__auto__)){
if(cljs.core.seq(blocks)){
frontend.modules.outliner.op.delete_blocks_BANG_(blocks,null);
} else {
}

var G__117190 = view_feature_type;
var G__117190__$1 = (((G__117190 instanceof cljs.core.Keyword))?G__117190.fqn:null);
switch (G__117190__$1) {
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
var seq__117213 = cljs.core.seq(pages);
var chunk__117214 = null;
var count__117215 = (0);
var i__117216 = (0);
while(true){
if((i__117216 < count__117215)){
var page = chunk__117214.cljs$core$IIndexed$_nth$arity$2(null,i__117216);
var temp__5804__auto___122457 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page);
if(cljs.core.truth_(temp__5804__auto___122457)){
var id_122458 = temp__5804__auto___122457;
frontend.modules.outliner.op.delete_page_BANG_(id_122458);
} else {
}


var G__122460 = seq__117213;
var G__122461 = chunk__117214;
var G__122462 = count__117215;
var G__122463 = (i__117216 + (1));
seq__117213 = G__122460;
chunk__117214 = G__122461;
count__117215 = G__122462;
i__117216 = G__122463;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__117213);
if(temp__5804__auto__){
var seq__117213__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__117213__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__117213__$1);
var G__122464 = cljs.core.chunk_rest(seq__117213__$1);
var G__122465 = c__5525__auto__;
var G__122466 = cljs.core.count(c__5525__auto__);
var G__122467 = (0);
seq__117213 = G__122464;
chunk__117214 = G__122465;
count__117215 = G__122466;
i__117216 = G__122467;
continue;
} else {
var page = cljs.core.first(seq__117213__$1);
var temp__5804__auto___122468__$1 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page);
if(cljs.core.truth_(temp__5804__auto___122468__$1)){
var id_122469 = temp__5804__auto___122468__$1;
frontend.modules.outliner.op.delete_page_BANG_(id_122469);
} else {
}


var G__122471 = cljs.core.next(seq__117213__$1);
var G__122472 = null;
var G__122473 = (0);
var G__122474 = (0);
seq__117213 = G__122471;
chunk__117214 = G__122472;
count__117215 = G__122473;
i__117216 = G__122474;
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
var _STAR_outliner_ops_STAR__orig_val__117255 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__117256 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__117256);

try{if(cljs.core.seq(blocks)){
frontend.modules.outliner.op.delete_blocks_BANG_(blocks,null);
} else {
}

var G__117257_122477 = view_feature_type;
var G__117257_122478__$1 = (((G__117257_122477 instanceof cljs.core.Keyword))?G__117257_122477.fqn:null);
switch (G__117257_122478__$1) {
case "class-objects":
if(cljs.core.seq(page_ids)){
var tx_data_122480 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (pid){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),pid,new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_parent)], null);
}),page_ids);
if(cljs.core.seq(tx_data_122480)){
frontend.modules.outliner.op.transact_BANG_(tx_data_122480,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null));
} else {
}
} else {
}

break;
case "property-objects":
if(cljs.core.truth_(new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160).cljs$core$IFn$_invoke$arity$1(view_parent))){
} else {
var tx_data_122483 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (pid){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),pid,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(view_parent)], null);
}),page_ids);
if(cljs.core.seq(tx_data_122483)){
frontend.modules.outliner.op.transact_BANG_(tx_data_122483,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null));
} else {
}
}

break;
case "query-result":
var seq__117258_122484 = cljs.core.seq(pages);
var chunk__117259_122485 = null;
var count__117260_122486 = (0);
var i__117261_122487 = (0);
while(true){
if((i__117261_122487 < count__117260_122486)){
var page_122488 = chunk__117259_122485.cljs$core$IIndexed$_nth$arity$2(null,i__117261_122487);
var temp__5804__auto___122489 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page_122488);
if(cljs.core.truth_(temp__5804__auto___122489)){
var id_122490 = temp__5804__auto___122489;
frontend.modules.outliner.op.delete_page_BANG_(id_122490);
} else {
}


var G__122492 = seq__117258_122484;
var G__122493 = chunk__117259_122485;
var G__122494 = count__117260_122486;
var G__122495 = (i__117261_122487 + (1));
seq__117258_122484 = G__122492;
chunk__117259_122485 = G__122493;
count__117260_122486 = G__122494;
i__117261_122487 = G__122495;
continue;
} else {
var temp__5804__auto___122497 = cljs.core.seq(seq__117258_122484);
if(temp__5804__auto___122497){
var seq__117258_122498__$1 = temp__5804__auto___122497;
if(cljs.core.chunked_seq_QMARK_(seq__117258_122498__$1)){
var c__5525__auto___122500 = cljs.core.chunk_first(seq__117258_122498__$1);
var G__122501 = cljs.core.chunk_rest(seq__117258_122498__$1);
var G__122502 = c__5525__auto___122500;
var G__122503 = cljs.core.count(c__5525__auto___122500);
var G__122504 = (0);
seq__117258_122484 = G__122501;
chunk__117259_122485 = G__122502;
count__117260_122486 = G__122503;
i__117261_122487 = G__122504;
continue;
} else {
var page_122506 = cljs.core.first(seq__117258_122498__$1);
var temp__5804__auto___122507__$1 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page_122506);
if(cljs.core.truth_(temp__5804__auto___122507__$1)){
var id_122508 = temp__5804__auto___122507__$1;
frontend.modules.outliner.op.delete_page_BANG_(id_122508);
} else {
}


var G__122509 = cljs.core.next(seq__117258_122498__$1);
var G__122510 = null;
var G__122511 = (0);
var G__122512 = (0);
seq__117258_122484 = G__122509;
chunk__117259_122485 = G__122510;
count__117260_122486 = G__122511;
i__117261_122487 = G__122512;
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

var r__49429__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___49426__auto__){
if(cljs.core.seq(r__49429__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__49429__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"delete-blocks","delete-blocks",-1868631596)], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__49429__auto__)){
var request_id__49430__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__49431__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__49429__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"delete-blocks","delete-blocks",-1868631596)], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__49430__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__49432__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__49430__auto__,request__49431__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__49430__auto__,request__49431__auto__));
return response__49432__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__117255);
}}
})()),(function (___41611__auto__){
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
frontend.components.views.table_header = (function frontend$components$views$table_header(table,p__117274,selected_rows){
var map__117275 = p__117274;
var map__117275__$1 = cljs.core.__destructure_map(map__117275);
var option = map__117275__$1;
var show_add_property_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117275__$1,new cljs.core.Keyword(null,"show-add-property?","show-add-property?",2062685338));
var add_property_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117275__$1,new cljs.core.Keyword(null,"add-property!","add-property!",1318392926));
var view_parent = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117275__$1,new cljs.core.Keyword(null,"view-parent","view-parent",675596601));
var view_feature_type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117275__$1,new cljs.core.Keyword(null,"view-feature-type","view-feature-type",-945869610));
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
var state = (function (){var G__117306 = ({"rootMargin": "0px"});
return (frontend.ui.useInView.cljs$core$IFn$_invoke$arity$1 ? frontend.ui.useInView.cljs$core$IFn$_invoke$arity$1(G__117306) : frontend.ui.useInView.call(null,G__117306));
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
var next_cell = (function (){var G__117316 = direction;
var G__117316__$1 = (((G__117316 instanceof cljs.core.Keyword))?G__117316.fqn:null);
switch (G__117316__$1) {
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
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__117316__$1)].join('')));

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
var G__117323 = frontend.util.ekey(e);
switch (G__117323) {
case "Escape":
if(cljs.core.truth_(frontend.util.input_QMARK_(e.target))){
frontend.state.exit_editing_and_set_selected_blocks_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [container], null));

container.focus();
} else {
dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$2(container,"selected");

var row_122525 = frontend.util.rec_get_node(container,"ls-table-row");
frontend.state.exit_editing_and_set_selected_blocks_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [row_122525], null));
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
frontend.components.views.table_row_inner = rum.core.lazy_build(rum.core.build_defc,(function (p__117330,row,props,p__117331){
var map__117333 = p__117330;
var map__117333__$1 = cljs.core.__destructure_map(map__117333);
var table = map__117333__$1;
var row_selected_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117333__$1,new cljs.core.Keyword(null,"row-selected?","row-selected?",165215850));
var map__117334 = p__117331;
var map__117334__$1 = cljs.core.__destructure_map(map__117334);
var show_add_property_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117334__$1,new cljs.core.Keyword(null,"show-add-property?","show-add-property?",2062685338));
var scrolling_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117334__$1,new cljs.core.Keyword(null,"scrolling?","scrolling?",-365022499));
var _STAR_ref = (logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_ref.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_ref.call(null,null));
var pinned_columns = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(table,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"state","state",-1988618099),new cljs.core.Keyword(null,"pinned-columns","pinned-columns",-1218428870)], null));
var unpinned = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(table,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"state","state",-1988618099),new cljs.core.Keyword(null,"unpinned-columns","unpinned-columns",1124489041)], null));
var unpinned_columns = (cljs.core.truth_(show_add_property_QMARK_)?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.vec(unpinned),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"add-property","add-property",-714058455),new cljs.core.Keyword(null,"cell","cell",764245084),(function (_table,_row,_column){
return null;
})], null)):unpinned);
var sized_columns = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(table,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"state","state",-1988618099),new cljs.core.Keyword(null,"sized-columns","sized-columns",-224617731)], null));
var row_cell_f = (function (column,p__117341){
var map__117342 = p__117341;
var map__117342__$1 = cljs.core.__destructure_map(map__117342);
var _lazy_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117342__$1,new cljs.core.Keyword(null,"_lazy?","_lazy?",1898869592));
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
var G__117353 = frontend.util.ekey(e);
switch (G__117353) {
case "Enter":
frontend.state.sidebar_add_block_BANG_(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(row),new cljs.core.Keyword(null,"block","block",664686210));

frontend.state.clear_selection_BANG_();

return frontend.util.stop(e);

break;
case "ArrowLeft":
var temp__5804__auto___122528 = cljs.core.first(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (node){
return (!(((dommy.utils.__GT_Array(node.getElementsByClassName("ui__checkbox"))[(0)]) == null)));
}),dommy.utils.__GT_Array(container.getElementsByClassName("ls-table-cell"))));
if(cljs.core.truth_(temp__5804__auto___122528)){
var cell_122529 = temp__5804__auto___122528;
frontend.state.clear_selection_BANG_();

dommy.core.add_class_BANG_.cljs$core$IFn$_invoke$arity$2(cell_122529,"selected");

cell_122529.focus();
} else {
}

return frontend.util.stop(e);

break;
case "ArrowRight":
var temp__5804__auto___122530 = cljs.core.last(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (node){
return (!(((dommy.utils.__GT_Array(node.getElementsByClassName("ui__checkbox"))[(0)]) == null)));
}),dommy.utils.__GT_Array(container.getElementsByClassName("ls-table-cell"))));
if(cljs.core.truth_(temp__5804__auto___122530)){
var cell_122531 = temp__5804__auto___122530;
frontend.state.clear_selection_BANG_();

dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$2(container,"selected");

dommy.core.add_class_BANG_.cljs$core$IFn$_invoke$arity$2(cell_122531,"selected");

cell_122531.focus();
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
})], null)], 0)),((cljs.core.seq(pinned_columns))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.sticky-columns.flex.flex-row","div.sticky-columns.flex.flex-row",-2049518578),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__117328_SHARP_){
return row_cell_f(p1__117328_SHARP_,cljs.core.PersistentArrayMap.EMPTY);
}),pinned_columns)], null):null),((cljs.core.seq(unpinned_columns))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row","div.flex.flex-row",209103675),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__117329_SHARP_){
return row_cell_f(p1__117329_SHARP_,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"lazy?","lazy?",2035907855),true], null));
}),unpinned_columns)], null):null)));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.views/table-row-inner");
frontend.components.views.table_row = rum.core.lazy_build(rum.core.build_defc,(function (table,row,props,option){
var block = (function (){var G__117356 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(row);
return (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(G__117356) : frontend.db.sub_block.call(null,G__117356));
})();
var row_SINGLEQUOTE_ = (cljs.core.truth_(new cljs.core.Keyword("block.temp","fully-loaded?","block.temp/fully-loaded?",-116637365).cljs$core$IFn$_invoke$arity$1(block))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block.temp","refs-count","block.temp/refs-count",-598132499),new cljs.core.Keyword("block.temp","refs-count","block.temp/refs-count",-598132499).cljs$core$IFn$_invoke$arity$1(row)):row);
return frontend.components.views.table_row_inner(table,row_SINGLEQUOTE_,props,option);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query], null),"frontend.components.views/table-row");
frontend.components.views.search = rum.core.lazy_build(rum.core.build_defc,(function (input,p__117357){
var map__117358 = p__117357;
var map__117358__$1 = cljs.core.__destructure_map(map__117358);
var on_change = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117358__$1,new cljs.core.Keyword(null,"on-change","on-change",-732046149));
var set_input_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117358__$1,new cljs.core.Keyword(null,"set-input!","set-input!",-615513292));
var vec__117360 = rum.core.use_state(false);
var show_input_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117360,(0),null);
var set_show_input_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117360,(1),null);
if(cljs.core.truth_(show_input_QMARK_)){
var attrs117365 = (function (){var G__117366 = new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"Type to search",new cljs.core.Keyword(null,"auto-focus","auto-focus",1250006231),true,new cljs.core.Keyword(null,"value","value",305978217),input,new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
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
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__117366) : logseq.shui.ui.input.call(null,G__117366));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs117365))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","items-center"], null)], null),attrs117365], 0))):{'className':"flex flex-row items-center"}),((cljs.core.map_QMARK_(attrs117365))?[daiquiri.interpreter.interpret((function (){var G__117370 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),"ghost",new cljs.core.Keyword(null,"class","class",-2030961996),"text-muted-foreground !px-1",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
(set_show_input_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_show_input_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_show_input_BANG_.call(null,false));

return (set_input_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_input_BANG_.cljs$core$IFn$_invoke$arity$1("") : set_input_BANG_.call(null,""));
})], null);
var G__117371 = frontend.ui.icon("x");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__117370,G__117371) : logseq.shui.ui.button.call(null,G__117370,G__117371));
})())]:[daiquiri.interpreter.interpret(attrs117365),daiquiri.interpreter.interpret((function (){var G__117374 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),"ghost",new cljs.core.Keyword(null,"class","class",-2030961996),"text-muted-foreground !px-1",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
(set_show_input_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_show_input_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_show_input_BANG_.call(null,false));

return (set_input_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_input_BANG_.cljs$core$IFn$_invoke$arity$1("") : set_input_BANG_.call(null,""));
})], null);
var G__117375 = frontend.ui.icon("x");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__117374,G__117375) : logseq.shui.ui.button.call(null,G__117374,G__117375));
})())]));
} else {
return daiquiri.interpreter.interpret((function (){var G__117378 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),"ghost",new cljs.core.Keyword(null,"class","class",-2030961996),"text-muted-foreground !px-1",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (set_show_input_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_show_input_BANG_.cljs$core$IFn$_invoke$arity$1(true) : set_show_input_BANG_.call(null,true));
})], null);
var G__117379 = frontend.ui.icon("search",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(15)], null));
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__117378,G__117379) : logseq.shui.ui.button.call(null,G__117378,G__117379));
})());
}
}),null,"frontend.components.views/search");
frontend.components.views.datetime_property_QMARK_ = (function frontend$components$views$datetime_property_QMARK_(property){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"datetime","datetime",494675702),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property))) || (cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551),null,new cljs.core.Keyword("block","created-at","block/created-at",1440015),null], null), null),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property))));
});
frontend.components.views.timestamp_options = new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),"1 day ago",new cljs.core.Keyword(null,"label","label",1718410804),"1 day ago"], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),"3 days ago",new cljs.core.Keyword(null,"label","label",1718410804),"3 days ago"], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),"1 week ago",new cljs.core.Keyword(null,"label","label",1718410804),"1 week ago"], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),"1 month ago",new cljs.core.Keyword(null,"label","label",1718410804),"1 month ago"], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),"3 months ago",new cljs.core.Keyword(null,"label","label",1718410804),"3 months ago"], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),"1 year ago",new cljs.core.Keyword(null,"label","label",1718410804),"1 year ago"], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),"Custom date",new cljs.core.Keyword(null,"label","label",1718410804),"Custom date"], null)], null);
frontend.components.views.filter_property = rum.core.lazy_build(rum.core.build_defc,(function (view_entity,columns,p__117414,opts){
var map__117418 = p__117414;
var map__117418__$1 = cljs.core.__destructure_map(map__117418);
var table = map__117418__$1;
var data_fns = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117418__$1,new cljs.core.Keyword(null,"data-fns","data-fns",-1065218324));
var vec__117438 = rum.core.use_state(null);
var property = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117438,(0),null);
var set_property_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117438,(1),null);
var vec__117441 = rum.core.use_state(null);
var values = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117441,(0),null);
var set_values_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117441,(1),null);
var schema = new cljs.core.Keyword(null,"schema","schema",-1582001791).cljs$core$IFn$_invoke$arity$1((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)));
var timestamp_QMARK_ = frontend.components.views.datetime_property_QMARK_(property);
var set_filters_BANG_ = new cljs.core.Keyword(null,"set-filters!","set-filters!",385623142).cljs$core$IFn$_invoke$arity$1(data_fns);
var filters = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(table,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"state","state",-1988618099),new cljs.core.Keyword(null,"filters","filters",974726919)], null));
var columns__$1 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__117384_SHARP_){
return ((new cljs.core.Keyword(null,"column-list?","column-list?",-538229318).cljs$core$IFn$_invoke$arity$1(p1__117384_SHARP_) === false) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(p1__117384_SHARP_))));
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
var G__117476 = (function (){var or__5002__auto__ = property__$1;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return internal_property;
}
})();
return (set_property_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_property_BANG_.cljs$core$IFn$_invoke$arity$1(G__117476) : set_property_BANG_.call(null,G__117476));
} else {
(logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));

var property__$2 = internal_property;
var new_filter = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property__$2),new cljs.core.Keyword(null,"text-contains","text-contains",-1761634668)], null);
var filters_SINGLEQUOTE_ = ((cljs.core.seq(new cljs.core.Keyword(null,"filters","filters",974726919).cljs$core$IFn$_invoke$arity$1(filters)))?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"filters","filters",974726919).cljs$core$IFn$_invoke$arity$1(filters),new_filter):new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new_filter], null));
var G__117478 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"or?","or?",-1226532173),new cljs.core.Keyword(null,"or?","or?",-1226532173).cljs$core$IFn$_invoke$arity$1(filters),new cljs.core.Keyword(null,"filters","filters",974726919),filters_SINGLEQUOTE_], null);
return (set_filters_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_filters_BANG_.cljs$core$IFn$_invoke$arity$1(G__117478) : set_filters_BANG_.call(null,G__117478));
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
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
var G__117489 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"or?","or?",-1226532173),new cljs.core.Keyword(null,"or?","or?",-1226532173).cljs$core$IFn$_invoke$arity$1(filters),new cljs.core.Keyword(null,"filters","filters",974726919),filters_SINGLEQUOTE_], null);
return (set_filters_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_filters_BANG_.cljs$core$IFn$_invoke$arity$1(G__117489) : set_filters_BANG_.call(null,G__117489));
});
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(value,"Custom date")){
var G__117490 = e.target;
var G__117491 = frontend.ui.nlp_calendar(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"initial-focus","initial-focus",1154999719),true,new cljs.core.Keyword(null,"datetime?","datetime?",-1173480100),false,new cljs.core.Keyword(null,"on-day-click","on-day-click",1918658076),(function (value__$1){
set_filter_fn(value__$1);

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
})], null));
var G__117492 = cljs.core.PersistentArrayMap.EMPTY;
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__117490,G__117491,G__117492) : logseq.shui.ui.popup_show_BANG_.call(null,G__117490,G__117491,G__117492));
} else {
return set_filter_fn(value);
}
})], null)], 0)):(cljs.core.truth_(property)?((checkbox_QMARK_)?(function (){var items__$1 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),true,new cljs.core.Keyword(null,"label","label",1718410804),"true"], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),false,new cljs.core.Keyword(null,"label","label",1718410804),"false"], null)], null);
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([option,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"items","items",1031954938),items__$1,new cljs.core.Keyword(null,"input-default-placeholder","input-default-placeholder",-1040139250),(cljs.core.truth_(property)?new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(property):"Select"),new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),(function (value){
var filters_SINGLEQUOTE_ = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"filters","filters",974726919).cljs$core$IFn$_invoke$arity$1(filters),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword(null,"is","is",369128998),value], null));
var G__117497 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"or?","or?",-1226532173),new cljs.core.Keyword(null,"or?","or?",-1226532173).cljs$core$IFn$_invoke$arity$1(filters),new cljs.core.Keyword(null,"filters","filters",974726919),filters_SINGLEQUOTE_], null);
return (set_filters_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_filters_BANG_.cljs$core$IFn$_invoke$arity$1(G__117497) : set_filters_BANG_.call(null,G__117497));
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
var G__117502 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"or?","or?",-1226532173),new cljs.core.Keyword(null,"or?","or?",-1226532173).cljs$core$IFn$_invoke$arity$1(filters),new cljs.core.Keyword(null,"filters","filters",974726919),filters_SINGLEQUOTE_], null);
return (set_filters_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_filters_BANG_.cljs$core$IFn$_invoke$arity$1(G__117502) : set_filters_BANG_.call(null,G__117502));
})], null)], 0));
})()):option
));
return frontend.components.select.select(option__$1);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.views/filter-property");
frontend.components.views.filter_properties = rum.core.lazy_build(rum.core.build_defc,(function (view_entity,columns,table,opts){
return daiquiri.interpreter.interpret((function (){var G__117515 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),"ghost",new cljs.core.Keyword(null,"class","class",-2030961996),"text-muted-foreground !px-1",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
var G__117518 = e.target;
var G__117519 = (function (){
return frontend.components.views.filter_property(view_entity,columns,table,opts);
});
var G__117520 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"end","end",-268185958),new cljs.core.Keyword(null,"auto-focus?","auto-focus?",1021654593),true], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__117518,G__117519,G__117520) : logseq.shui.ui.popup_show_BANG_.call(null,G__117518,G__117519,G__117520));
})], null);
var G__117516 = frontend.ui.icon("filter");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__117515,G__117516) : logseq.shui.ui.button.call(null,G__117515,G__117516));
})());
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.views/filter-properties");
frontend.components.views.operator__GT_text = (function frontend$components$views$operator__GT_text(operator){
var G__117526 = operator;
var G__117526__$1 = (((G__117526 instanceof cljs.core.Keyword))?G__117526.fqn:null);
switch (G__117526__$1) {
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
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__117526__$1)].join('')));

}
});
frontend.components.views.get_property_operators = (function frontend$components$views$get_property_operators(property){
if(frontend.components.views.datetime_property_QMARK_(property)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"before","before",-1633692388),new cljs.core.Keyword(null,"after","after",594996914)], null);
} else {
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"is","is",369128998),new cljs.core.Keyword(null,"is-not","is-not",-677962855)], null),(function (){var G__117530 = new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property);
var G__117530__$1 = (((G__117530 instanceof cljs.core.Keyword))?G__117530.fqn:null);
switch (G__117530__$1) {
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
var G__117538 = operator;
var G__117538__$1 = (((G__117538 instanceof cljs.core.Keyword))?G__117538.fqn:null);
switch (G__117538__$1) {
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
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__117538__$1)].join('')));

}
});
frontend.components.views.filter_operator = rum.core.lazy_build(rum.core.build_defc,(function (property,operator,filters,set_filters_BANG_,idx){
return daiquiri.interpreter.interpret((function (){var G__117628 = (function (){var G__117630 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"asChild","asChild",682531623),true], null);
var G__117631 = (function (){var G__117634 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"class","class",-2030961996),"!px-2 rounded-none border-r",new cljs.core.Keyword(null,"variant","variant",-424354234),"ghost",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065)], null);
var G__117635 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-xs","span.text-xs",63518557),frontend.components.views.operator__GT_text(operator)], null);
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__117634,G__117635) : logseq.shui.ui.button.call(null,G__117634,G__117635));
})();
return (logseq.shui.ui.dropdown_menu_trigger.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_trigger.cljs$core$IFn$_invoke$arity$2(G__117630,G__117631) : logseq.shui.ui.dropdown_menu_trigger.call(null,G__117630,G__117631));
})();
var G__117629 = (function (){var G__117642 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"align","align",1964212802),"start"], null);
var G__117643 = (function (){var operators = frontend.components.views.get_property_operators(property);
var iter__5480__auto__ = (function frontend$components$views$iter__117647(s__117648){
return (new cljs.core.LazySeq(null,(function (){
var s__117648__$1 = s__117648;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__117648__$1);
if(temp__5804__auto__){
var s__117648__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__117648__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__117648__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__117650 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__117649 = (0);
while(true){
if((i__117649 < size__5479__auto__)){
var operator__$1 = cljs.core._nth(c__5478__auto__,i__117649);
cljs.core.chunk_append(b__117650,(function (){var G__117681 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__117649,operator__$1,c__5478__auto__,size__5479__auto__,b__117650,s__117648__$2,temp__5804__auto__,operators,G__117642,G__117628){
return (function (){
var new_filters = cljs.core.update.cljs$core$IFn$_invoke$arity$3(filters,new cljs.core.Keyword(null,"filters","filters",974726919),((function (i__117649,operator__$1,c__5478__auto__,size__5479__auto__,b__117650,s__117648__$2,temp__5804__auto__,operators,G__117642,G__117628){
return (function (col){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(col,idx,((function (i__117649,operator__$1,c__5478__auto__,size__5479__auto__,b__117650,s__117648__$2,temp__5804__auto__,operators,G__117642,G__117628){
return (function (p__117695){
var vec__117712 = p__117695;
var property__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117712,(0),null);
var _old_operator = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117712,(1),null);
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117712,(2),null);
var value_SINGLEQUOTE_ = frontend.components.views.get_filter_with_changed_operator(property__$1,operator__$1,value);
if(cljs.core.truth_(value_SINGLEQUOTE_)){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [property__$1,operator__$1,value_SINGLEQUOTE_], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [property__$1,operator__$1], null);
}
});})(i__117649,operator__$1,c__5478__auto__,size__5479__auto__,b__117650,s__117648__$2,temp__5804__auto__,operators,G__117642,G__117628))
);
});})(i__117649,operator__$1,c__5478__auto__,size__5479__auto__,b__117650,s__117648__$2,temp__5804__auto__,operators,G__117642,G__117628))
);
return (set_filters_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_filters_BANG_.cljs$core$IFn$_invoke$arity$1(new_filters) : set_filters_BANG_.call(null,new_filters));
});})(i__117649,operator__$1,c__5478__auto__,size__5479__auto__,b__117650,s__117648__$2,temp__5804__auto__,operators,G__117642,G__117628))
], null);
var G__117682 = frontend.components.views.operator__GT_text(operator__$1);
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__117681,G__117682) : logseq.shui.ui.dropdown_menu_item.call(null,G__117681,G__117682));
})());

var G__122536 = (i__117649 + (1));
i__117649 = G__122536;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__117650),frontend$components$views$iter__117647(cljs.core.chunk_rest(s__117648__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__117650),null);
}
} else {
var operator__$1 = cljs.core.first(s__117648__$2);
return cljs.core.cons((function (){var G__117749 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (operator__$1,s__117648__$2,temp__5804__auto__,operators,G__117642,G__117628){
return (function (){
var new_filters = cljs.core.update.cljs$core$IFn$_invoke$arity$3(filters,new cljs.core.Keyword(null,"filters","filters",974726919),(function (col){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(col,idx,(function (p__117759){
var vec__117762 = p__117759;
var property__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117762,(0),null);
var _old_operator = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117762,(1),null);
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117762,(2),null);
var value_SINGLEQUOTE_ = frontend.components.views.get_filter_with_changed_operator(property__$1,operator__$1,value);
if(cljs.core.truth_(value_SINGLEQUOTE_)){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [property__$1,operator__$1,value_SINGLEQUOTE_], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [property__$1,operator__$1], null);
}
}));
}));
return (set_filters_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_filters_BANG_.cljs$core$IFn$_invoke$arity$1(new_filters) : set_filters_BANG_.call(null,new_filters));
});})(operator__$1,s__117648__$2,temp__5804__auto__,operators,G__117642,G__117628))
], null);
var G__117750 = frontend.components.views.operator__GT_text(operator__$1);
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__117749,G__117750) : logseq.shui.ui.dropdown_menu_item.call(null,G__117749,G__117750));
})(),frontend$components$views$iter__117647(cljs.core.rest(s__117648__$2)));
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
return (logseq.shui.ui.dropdown_menu_content.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_content.cljs$core$IFn$_invoke$arity$2(G__117642,G__117643) : logseq.shui.ui.dropdown_menu_content.call(null,G__117642,G__117643));
})();
return (logseq.shui.ui.dropdown_menu.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu.cljs$core$IFn$_invoke$arity$2(G__117628,G__117629) : logseq.shui.ui.dropdown_menu.call(null,G__117628,G__117629));
})());
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.views/filter-operator");
frontend.components.views.between = rum.core.lazy_build(rum.core.build_defc,(function (_property,p__117865,filters,set_filters_BANG_,idx){
var vec__117866 = p__117865;
var start = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117866,(0),null);
var end = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117866,(1),null);
var attrs117863 = (function (){var G__117876 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"auto-focus","auto-focus",1250006231),true,new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"from",new cljs.core.Keyword(null,"value","value",305978217),cljs.core.str.cljs$core$IFn$_invoke$arity$1(start),new cljs.core.Keyword(null,"onChange","onChange",-312891301),(function (e){
var input_value = frontend.util.evalue(e);
var number_value = ((clojure.string.blank_QMARK_(input_value))?null:frontend.util.safe_parse_float(input_value));
var value = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [number_value,end], null);
var value__$1 = ((cljs.core.every_QMARK_(cljs.core.nil_QMARK_,value))?null:value);
var new_filters = cljs.core.update.cljs$core$IFn$_invoke$arity$3(filters,new cljs.core.Keyword(null,"filters","filters",974726919),(function (col){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(col,idx,(function (p__117879){
var vec__117880 = p__117879;
var property = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117880,(0),null);
var operator = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117880,(1),null);
var _old_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117880,(2),null);
if((value__$1 == null)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [property,operator], null);
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [property,operator,value__$1], null);
}
}));
}));
return (set_filters_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_filters_BANG_.cljs$core$IFn$_invoke$arity$1(new_filters) : set_filters_BANG_.call(null,new_filters));
}),new cljs.core.Keyword(null,"class","class",-2030961996),"w-24 !h-6 !py-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0"], null);
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__117876) : logseq.shui.ui.input.call(null,G__117876));
})();
return daiquiri.core.create_element(daiquiri.core.fragment,((cljs.core.map_QMARK_(attrs117863))?daiquiri.interpreter.element_attributes(attrs117863):null),((cljs.core.map_QMARK_(attrs117863))?[daiquiri.interpreter.interpret((function (){var G__117892 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"value","value",305978217),cljs.core.str.cljs$core$IFn$_invoke$arity$1(end),new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"to",new cljs.core.Keyword(null,"onChange","onChange",-312891301),(function (e){
var input_value = frontend.util.evalue(e);
var number_value = ((clojure.string.blank_QMARK_(input_value))?null:frontend.util.safe_parse_float(input_value));
var value = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [start,number_value], null);
var value__$1 = ((cljs.core.every_QMARK_(cljs.core.nil_QMARK_,value))?null:value);
var new_filters = cljs.core.update.cljs$core$IFn$_invoke$arity$3(filters,new cljs.core.Keyword(null,"filters","filters",974726919),(function (col){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(col,idx,(function (p__117904){
var vec__117915 = p__117904;
var property = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117915,(0),null);
var operator = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117915,(1),null);
var _old_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117915,(2),null);
if((value__$1 == null)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [property,operator], null);
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [property,operator,value__$1], null);
}
}));
}));
return (set_filters_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_filters_BANG_.cljs$core$IFn$_invoke$arity$1(new_filters) : set_filters_BANG_.call(null,new_filters));
}),new cljs.core.Keyword(null,"class","class",-2030961996),"w-24 !h-6 !py-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0"], null);
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__117892) : logseq.shui.ui.input.call(null,G__117892));
})())]:[daiquiri.interpreter.interpret(attrs117863),daiquiri.interpreter.interpret((function (){var G__117993 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"value","value",305978217),cljs.core.str.cljs$core$IFn$_invoke$arity$1(end),new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"to",new cljs.core.Keyword(null,"onChange","onChange",-312891301),(function (e){
var input_value = frontend.util.evalue(e);
var number_value = ((clojure.string.blank_QMARK_(input_value))?null:frontend.util.safe_parse_float(input_value));
var value = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [start,number_value], null);
var value__$1 = ((cljs.core.every_QMARK_(cljs.core.nil_QMARK_,value))?null:value);
var new_filters = cljs.core.update.cljs$core$IFn$_invoke$arity$3(filters,new cljs.core.Keyword(null,"filters","filters",974726919),(function (col){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(col,idx,(function (p__118009){
var vec__118011 = p__118009;
var property = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__118011,(0),null);
var operator = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__118011,(1),null);
var _old_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__118011,(2),null);
if((value__$1 == null)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [property,operator], null);
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [property,operator,value__$1], null);
}
}));
}));
return (set_filters_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_filters_BANG_.cljs$core$IFn$_invoke$arity$1(new_filters) : set_filters_BANG_.call(null,new_filters));
}),new cljs.core.Keyword(null,"class","class",-2030961996),"w-24 !h-6 !py-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0"], null);
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__117993) : logseq.shui.ui.input.call(null,G__117993));
})())]));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.views/between");
frontend.components.views.filter_value_select = rum.core.lazy_build(rum.core.build_defc,(function (view_entity,p__118043,property,value,operator,idx,opts){
var map__118046 = p__118043;
var map__118046__$1 = cljs.core.__destructure_map(map__118046);
var table = map__118046__$1;
var data_fns = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__118046__$1,new cljs.core.Keyword(null,"data-fns","data-fns",-1065218324));
var type = new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property);
var property_ident = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property);
logseq.shui.hooks.use_effect_BANG_((function (){
var values = ((cljs.core.coll_QMARK_(value))?value:new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [value], null));
var ids = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__118020_SHARP_){
return ((cljs.core.uuid_QMARK_(p1__118020_SHARP_)) && (((function (){var G__118054 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),p1__118020_SHARP_], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__118054) : frontend.db.entity.call(null,G__118054));
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
return daiquiri.interpreter.interpret((function (){var G__118136 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"class","class",-2030961996),"!px-2 rounded-none border-r",new cljs.core.Keyword(null,"variant","variant",-424354234),"ghost",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_((function (){var and__5000__auto__ = property_ident;
if(cljs.core.truth_(and__5000__auto__)){
return (!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"checkbox","checkbox",1612615655),null,new cljs.core.Keyword(null,"datetime","datetime",494675702),null,new cljs.core.Keyword(null,"data","data",-232669377),null], null), null),type)));
} else {
return and__5000__auto__;
}
})())?promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto____$1){
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
return promesa.protocols._promise((function (){var G__118148 = e.target;
var G__118149 = (function (){
var option = (function (){var G__118153 = new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"input-default-placeholder","input-default-placeholder",-1040139250),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword(null,"input-opts","input-opts",1688681135),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"!px-3 !py-1"], null),new cljs.core.Keyword(null,"items","items",1031954938),items,new cljs.core.Keyword(null,"extract-fn","extract-fn",-339752723),new cljs.core.Keyword(null,"label","label",1718410804),new cljs.core.Keyword(null,"extract-chosen-fn","extract-chosen-fn",1058364622),new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),(function (value__$1,_selected_QMARK_,selected,e__$1){
if(many_QMARK_){
} else {
(logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
}

var value_SINGLEQUOTE_ = ((many_QMARK_)?selected:value__$1);
var set_filters_fn = (function (value_SINGLEQUOTE___$1){
var new_filters = cljs.core.update.cljs$core$IFn$_invoke$arity$3(filters,new cljs.core.Keyword(null,"filters","filters",974726919),(function (col){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(col,idx,(function (p__118161){
var vec__118162 = p__118161;
var property__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__118162,(0),null);
var operator__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__118162,(1),null);
var _value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__118162,(2),null);
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [property__$1,operator__$1,value_SINGLEQUOTE___$1], null);
}));
}));
return (set_filters_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_filters_BANG_.cljs$core$IFn$_invoke$arity$1(new_filters) : set_filters_BANG_.call(null,new_filters));
});
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(value__$1,"Custom date")){
var G__118166 = e__$1.target;
var G__118167 = frontend.ui.nlp_calendar(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"initial-focus","initial-focus",1154999719),true,new cljs.core.Keyword(null,"datetime?","datetime?",-1173480100),false,new cljs.core.Keyword(null,"on-day-click","on-day-click",1918658076),(function (value__$2){
set_filters_fn(value__$2);

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
})], null));
var G__118168 = cljs.core.PersistentArrayMap.EMPTY;
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__118166,G__118167,G__118168) : logseq.shui.ui.popup_show_BANG_.call(null,G__118166,G__118167,G__118168));
} else {
return set_filters_fn(value_SINGLEQUOTE_);
}
})], null);
if(many_QMARK_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(G__118153,new cljs.core.Keyword(null,"multiple-choices?","multiple-choices?",-1858892490),true,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"selected-choices","selected-choices",1913324317),value], 0));
} else {
return G__118153;
}
})();
return frontend.components.select.select(option);
});
var G__118150 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"start","start",-355208981)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__118148,G__118149,G__118150) : logseq.shui.ui.popup_show_BANG_.call(null,G__118148,G__118149,G__118150));
})());
}));
}));
}));
})], null);
var G__118137 = (function (){var value__$1 = ((cljs.core.uuid_QMARK_(value))?(function (){var G__118174 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),value], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__118174) : frontend.db.entity.call(null,G__118174));
})():(((value instanceof Date))?(function (){var G__118176 = cljs_time.coerce.to_date(value);
var G__118176__$1 = (((G__118176 == null))?null:cljs_time.core.to_default_time_zone(G__118176));
if((G__118176__$1 == null)){
return null;
} else {
return cljs_time.format.unparse(cljs_time.format.formatter.cljs$core$IFn$_invoke$arity$1("yyyy-MM-dd"),G__118176__$1);
}
})():((((cljs.core.coll_QMARK_(value)) && (cljs.core.every_QMARK_(cljs.core.uuid_QMARK_,value))))?cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p1__118035_SHARP_){
var G__118180 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),p1__118035_SHARP_], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__118180) : frontend.db.entity.call(null,G__118180));
}),value):value
)));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.items-center.gap-1.text-xs","div.flex.flex-row.items-center.gap-1.text-xs",1157558383),((datascript.impl.entity.entity_QMARK_(value__$1))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),frontend.components.views.get_property_value_content(value__$1)], null):((typeof value__$1 === 'string')?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),value__$1], null):((cljs.core.boolean_QMARK_(value__$1))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),cljs.core.str.cljs$core$IFn$_invoke$arity$1(value__$1)], null):((cljs.core.seq(value__$1))?cljs.core.interpose.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"or"], null),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (v){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),frontend.components.views.get_property_value_content(v)], null);
}),value__$1)):"All"
))))], null);
})();
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__118136,G__118137) : logseq.shui.ui.button.call(null,G__118136,G__118137));
})());
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.views/filter-value-select");
frontend.components.views.filter_value = rum.core.lazy_build(rum.core.build_defc,(function (view_entity,table,property,operator,value,filters,set_filters_BANG_,idx,opts){
var number_operator_QMARK_ = clojure.string.starts_with_QMARK_(cljs.core.name(operator),"number-");
var G__118191 = operator;
var G__118191__$1 = (((G__118191 instanceof cljs.core.Keyword))?G__118191.fqn:null);
switch (G__118191__$1) {
case "between":
return frontend.components.views.between(property,value,filters,set_filters_BANG_,idx);

break;
case "text-contains":
case "text-not-contains":
case "number-gt":
case "number-lt":
case "number-gte":
case "number-lte":
return daiquiri.interpreter.interpret((function (){var G__118206 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"auto-focus","auto-focus",1250006231),false,new cljs.core.Keyword(null,"value","value",305978217),(function (){var or__5002__auto__ = value;
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
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(col,idx,(function (p__118212){
var vec__118214 = p__118212;
var property__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__118214,(0),null);
var operator__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__118214,(1),null);
var _value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__118214,(2),null);
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
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__118206) : logseq.shui.ui.input.call(null,G__118206));
})());

break;
default:
return frontend.components.views.filter_value_select(view_entity,table,property,value,operator,idx,opts);

}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.views/filter-value");
frontend.components.views.filters_row = rum.core.lazy_build(rum.core.build_defc,(function (view_entity,p__118230,opts){
var map__118231 = p__118230;
var map__118231__$1 = cljs.core.__destructure_map(map__118231);
var table = map__118231__$1;
var data_fns = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__118231__$1,new cljs.core.Keyword(null,"data-fns","data-fns",-1065218324));
var columns = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__118231__$1,new cljs.core.Keyword(null,"columns","columns",1998437288));
var filters = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(table,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"state","state",-1988618099),new cljs.core.Keyword(null,"filters","filters",974726919)], null));
var map__118234 = data_fns;
var map__118234__$1 = cljs.core.__destructure_map(map__118234);
var set_filters_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__118234__$1,new cljs.core.Keyword(null,"set-filters!","set-filters!",385623142));
if(cljs.core.seq(new cljs.core.Keyword(null,"filters","filters",974726919).cljs$core$IFn$_invoke$arity$1(filters))){
return daiquiri.core.create_element("div",{'className':"filters-row flex flex-row items-center gap-4 justify-between flex-wrap py-2"},[(function (){var attrs118371 = cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2((function (idx,filter_SINGLEQUOTE_){
var vec__118433 = filter_SINGLEQUOTE_;
var property_ident = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__118433,(0),null);
var operator = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__118433,(1),null);
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__118433,(2),null);
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
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.items-center.border.rounded","div.flex.flex-row.items-center.border.rounded",-1595973469),(function (){var G__118439 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"class","class",-2030961996),"!px-2 rounded-none border-r",new cljs.core.Keyword(null,"variant","variant",-424354234),"ghost",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),true], null);
var G__118440 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-xs","span.text-xs",63518557),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(property)], null);
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__118439,G__118440) : logseq.shui.ui.button.call(null,G__118439,G__118440));
})(),frontend.components.views.filter_operator(property,operator,filters,set_filters_BANG_,idx),frontend.components.views.filter_value(view_entity,table,property,operator,value,filters,set_filters_BANG_,idx,opts),(function (){var G__118442 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"class","class",-2030961996),"!px-1 rounded-none text-muted-foreground",new cljs.core.Keyword(null,"variant","variant",-424354234),"ghost",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_e){
var new_filters = cljs.core.update.cljs$core$IFn$_invoke$arity$3(filters,new cljs.core.Keyword(null,"filters","filters",974726919),(function (col){
return cljs.core.vec(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentHashSet.createAsIfByAssoc([filter_SINGLEQUOTE_]),col));
}));
return (set_filters_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_filters_BANG_.cljs$core$IFn$_invoke$arity$1(new_filters) : set_filters_BANG_.call(null,new_filters));
})], null);
var G__118443 = frontend.ui.icon("x");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__118442,G__118443) : logseq.shui.ui.button.call(null,G__118442,G__118443));
})()], null);
}),new cljs.core.Keyword(null,"filters","filters",974726919).cljs$core$IFn$_invoke$arity$1(filters));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs118371))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","items-center","gap-2"], null)], null),attrs118371], 0))):{'className':"flex flex-row items-center gap-2"}),((cljs.core.map_QMARK_(attrs118371))?null:[daiquiri.interpreter.interpret(attrs118371)]));
})(),(((cljs.core.count(new cljs.core.Keyword(null,"filters","filters",974726919).cljs$core$IFn$_invoke$arity$1(filters)) > (1)))?(function (){var attrs118431 = (function (){var G__118450 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"default-value","default-value",232220170),(cljs.core.truth_(new cljs.core.Keyword(null,"or?","or?",-1226532173).cljs$core$IFn$_invoke$arity$1(filters))?"or":"and"),new cljs.core.Keyword(null,"on-value-change","on-value-change",-621835289),(function (v){
var G__118454 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(filters,new cljs.core.Keyword(null,"or?","or?",-1226532173),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(v,"or"));
return (set_filters_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_filters_BANG_.cljs$core$IFn$_invoke$arity$1(G__118454) : set_filters_BANG_.call(null,G__118454));
})], null);
var G__118451 = (function (){var G__118456 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"opacity-75 hover:opacity-100 !px-2 !py-0 !h-6"], null);
var G__118457 = (function (){var G__118458 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"Match"], null);
return (logseq.shui.ui.select_value.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_value.cljs$core$IFn$_invoke$arity$1(G__118458) : logseq.shui.ui.select_value.call(null,G__118458));
})();
return (logseq.shui.ui.select_trigger.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_trigger.cljs$core$IFn$_invoke$arity$2(G__118456,G__118457) : logseq.shui.ui.select_trigger.call(null,G__118456,G__118457));
})();
var G__118452 = (function (){var G__118461 = (function (){var G__118462 = (function (){var G__118464 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"value","value",305978217),"and"], null);
var G__118465 = "Match all filters";
return (logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2(G__118464,G__118465) : logseq.shui.ui.select_item.call(null,G__118464,G__118465));
})();
var G__118463 = (function (){var G__118467 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"value","value",305978217),"or"], null);
var G__118468 = "Match any filter";
return (logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2(G__118467,G__118468) : logseq.shui.ui.select_item.call(null,G__118467,G__118468));
})();
return (logseq.shui.ui.select_group.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_group.cljs$core$IFn$_invoke$arity$2(G__118462,G__118463) : logseq.shui.ui.select_group.call(null,G__118462,G__118463));
})();
return (logseq.shui.ui.select_content.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_content.cljs$core$IFn$_invoke$arity$1(G__118461) : logseq.shui.ui.select_content.call(null,G__118461));
})();
return (logseq.shui.ui.select.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.select.cljs$core$IFn$_invoke$arity$3(G__118450,G__118451,G__118452) : logseq.shui.ui.select.call(null,G__118450,G__118451,G__118452));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs118431))?daiquiri.interpreter.element_attributes(attrs118431):null),((cljs.core.map_QMARK_(attrs118431))?null:[daiquiri.interpreter.interpret(attrs118431)]));
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
return frontend.ui.tooltip((function (){var G__118498 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),"ghost",new cljs.core.Keyword(null,"class","class",-2030961996),"!px-1 text-muted-foreground",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_){
var f = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(table,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"data-fns","data-fns",-1065218324),new cljs.core.Keyword(null,"add-new-object!","add-new-object!",622560106)], null));
return (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(view_entity,table) : f.call(null,view_entity,table));
})], null);
var G__118499 = frontend.ui.icon((cljs.core.truth_(asset_QMARK_)?"upload":"plus"));
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__118498,G__118499) : logseq.shui.ui.button.call(null,G__118498,G__118499));
})(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"New node"], null));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.views/new-record-button");
frontend.components.views.add_new_row = rum.core.lazy_build(rum.core.build_defc,(function (view_entity,table){
return daiquiri.core.create_element("div",{'onClick':(function (_){
var f = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(table,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"data-fns","data-fns",-1065218324),new cljs.core.Keyword(null,"add-new-object!","add-new-object!",622560106)], null));
return (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(view_entity,table) : f.call(null,view_entity,table));
}),'className':"py-1 px-2 cursor-pointer flex flex-row items-center gap-1 text-muted-foreground hover:text-foreground w-full text-sm border-b"},[daiquiri.interpreter.interpret(frontend.ui.icon("plus",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(14)], null))),daiquiri.core.create_element("div",null,["New"])]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.views/add-new-row");
frontend.components.views.table_filters__GT_persist_state = (function frontend$components$views$table_filters__GT_persist_state(filters){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p__118522){
var vec__118523 = p__118522;
var property = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__118523,(0),null);
var operator = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__118523,(1),null);
var matches = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__118523,(2),null);
var matches_SINGLEQUOTE_ = ((datascript.impl.entity.entity_QMARK_(matches))?new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(matches):((((cljs.core.coll_QMARK_(matches)) && (cljs.core.every_QMARK_(datascript.impl.entity.entity_QMARK_,matches))))?cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),matches)):matches
));
if((!((matches_SINGLEQUOTE_ == null)))){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [property,operator,matches_SINGLEQUOTE_], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [property,operator], null);
}
}),filters);
});
frontend.components.views.db_set_table_state_BANG_ = (function frontend$components$views$db_set_table_state_BANG_(entity,p__118534){
var map__118538 = p__118534;
var map__118538__$1 = cljs.core.__destructure_map(map__118538);
var set_sorting_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__118538__$1,new cljs.core.Keyword(null,"set-sorting!","set-sorting!",543042376));
var set_filters_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__118538__$1,new cljs.core.Keyword(null,"set-filters!","set-filters!",385623142));
var set_visible_columns_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__118538__$1,new cljs.core.Keyword(null,"set-visible-columns!","set-visible-columns!",729806223));
var set_ordered_columns_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__118538__$1,new cljs.core.Keyword(null,"set-ordered-columns!","set-ordered-columns!",-315299263));
var set_sized_columns_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__118538__$1,new cljs.core.Keyword(null,"set-sized-columns!","set-sized-columns!",899502581));
var repo = frontend.state.get_current_repo();
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0();
return new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"set-sorting!","set-sorting!",543042376),(function (sorting){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(db_based_QMARK_)?frontend.handler.property.set_block_property_BANG_(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity),new cljs.core.Keyword("logseq.property.table","sorting","logseq.property.table/sorting",208102594),sorting):null)),(function (___41611__auto__){
return promesa.protocols._promise((set_sorting_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_sorting_BANG_.cljs$core$IFn$_invoke$arity$1(sorting) : set_sorting_BANG_.call(null,sorting)));
}));
}));
}),new cljs.core.Keyword(null,"set-filters!","set-filters!",385623142),(function (filters){
var filters__$1 = cljs.core.update.cljs$core$IFn$_invoke$arity$3(cljs.core.update.cljs$core$IFn$_invoke$arity$3(filters,new cljs.core.Keyword(null,"filters","filters",974726919),frontend.components.views.table_filters__GT_persist_state),new cljs.core.Keyword(null,"or?","or?",-1226532173),cljs.core.boolean$);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(db_based_QMARK_)?frontend.handler.property.set_block_property_BANG_(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity),new cljs.core.Keyword("logseq.property.table","filters","logseq.property.table/filters",-1702393633),filters__$1):null)),(function (___41611__auto__){
return promesa.protocols._promise((set_filters_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_filters_BANG_.cljs$core$IFn$_invoke$arity$1(filters__$1) : set_filters_BANG_.call(null,filters__$1)));
}));
}));
}),new cljs.core.Keyword(null,"set-visible-columns!","set-visible-columns!",729806223),(function (columns){
var hidden_columns = cljs.core.vec(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__118547){
var vec__118557 = p__118547;
var column = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__118557,(0),null);
var visible_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__118557,(1),null);
if(visible_QMARK_ === false){
return column;
} else {
return null;
}
}),columns));
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(db_based_QMARK_)?frontend.handler.property.set_block_property_BANG_(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity),new cljs.core.Keyword("logseq.property.table","hidden-columns","logseq.property.table/hidden-columns",975057192),hidden_columns):null)),(function (___41611__auto__){
return promesa.protocols._promise((set_visible_columns_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_visible_columns_BANG_.cljs$core$IFn$_invoke$arity$1(columns) : set_visible_columns_BANG_.call(null,columns)));
}));
}));
}),new cljs.core.Keyword(null,"set-ordered-columns!","set-ordered-columns!",-315299263),(function (ordered_columns){
var ids = cljs.core.vec(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"select","select",1147833503),null], null), null),ordered_columns));
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(db_based_QMARK_)?frontend.handler.property.set_block_property_BANG_(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity),new cljs.core.Keyword("logseq.property.table","ordered-columns","logseq.property.table/ordered-columns",1485587100),ids):null)),(function (___41611__auto__){
return promesa.protocols._promise((set_ordered_columns_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_ordered_columns_BANG_.cljs$core$IFn$_invoke$arity$1(ordered_columns) : set_ordered_columns_BANG_.call(null,ordered_columns)));
}));
}));
}),new cljs.core.Keyword(null,"set-sized-columns!","set-sized-columns!",899502581),(function (sized_columns){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(db_based_QMARK_)?frontend.handler.property.set_block_property_BANG_(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity),new cljs.core.Keyword("logseq.property.table","sized-columns","logseq.property.table/sized-columns",-1675510555),sized_columns):null)),(function (___41611__auto__){
return promesa.protocols._promise((set_sized_columns_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_sized_columns_BANG_.cljs$core$IFn$_invoke$arity$1(sized_columns) : set_sized_columns_BANG_.call(null,sized_columns)));
}));
}));
})], null);
});
frontend.components.views.lazy_item = rum.core.lazy_build(rum.core.build_defc,(function (data,idx,p__118674,item_render){
var map__118676 = p__118674;
var map__118676__$1 = cljs.core.__destructure_map(map__118676);
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__118676__$1,new cljs.core.Keyword(null,"properties","properties",685819552));
var list_view_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__118676__$1,new cljs.core.Keyword(null,"list-view?","list-view?",499477951));
var scrolling_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__118676__$1,new cljs.core.Keyword(null,"scrolling?","scrolling?",-365022499));
var item = frontend.util.nth_safe(data,idx);
var db_id = ((cljs.core.map_QMARK_(item))?new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(item):((typeof item === 'number')?item:null
));
var vec__118688 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_state.call(null,null));
var item__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__118688,(0),null);
var set_item_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__118688,(1),null);
var opts = (cljs.core.truth_(list_view_QMARK_)?new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"skip-refresh?","skip-refresh?",878432095),true,new cljs.core.Keyword(null,"children?","children?",-1199594108),false], null):new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"children?","children?",-1199594108),false,new cljs.core.Keyword(null,"properties","properties",685819552),properties,new cljs.core.Keyword(null,"skip-transact?","skip-transact?",-1820887310),true,new cljs.core.Keyword(null,"skip-refresh?","skip-refresh?",878432095),true], null));
logseq.shui.hooks.use_effect_BANG_((function (){
return frontend.common.missionary.run_task_STAR_(cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr118712_block_8 = (function frontend$components$views$cr118712_block_8(cr118712_state){
try{var cr118712_place_25 = frontend.db.entity;
var cr118712_place_26 = db_id;
var cr118712_place_27 = (function (){var G__118936 = cr118712_place_26;
var fexpr__118935 = cr118712_place_25;
return (fexpr__118935.cljs$core$IFn$_invoke$arity$1 ? fexpr__118935.cljs$core$IFn$_invoke$arity$1(G__118936) : fexpr__118935.call(null,G__118936));
})();
(cr118712_state[(0)] = cr118712_block_9);

(cr118712_state[(2)] = cr118712_place_27);

return cr118712_state;
}catch (e118927){var cr118712_exception = e118927;
(cr118712_state[(0)] = null);

(cr118712_state[(1)] = null);

(cr118712_state[(2)] = null);

throw cr118712_exception;
}});
var cr118712_block_2 = (function frontend$components$views$cr118712_block_2(cr118712_state){
try{var cr118712_place_4 = cljs.core.not;
var cr118712_place_5 = item__$1;
var cr118712_place_6 = (function (){var G__118953 = cr118712_place_5;
var fexpr__118952 = cr118712_place_4;
return (fexpr__118952.cljs$core$IFn$_invoke$arity$1 ? fexpr__118952.cljs$core$IFn$_invoke$arity$1(G__118953) : fexpr__118952.call(null,G__118953));
})();
var cr118712_place_7 = cljs.core.not;
var cr118712_place_8 = scrolling_QMARK_;
var cr118712_place_9 = (function (){var G__118956 = cr118712_place_8;
var fexpr__118955 = cr118712_place_7;
return (fexpr__118955.cljs$core$IFn$_invoke$arity$1 ? fexpr__118955.cljs$core$IFn$_invoke$arity$1(G__118956) : fexpr__118955.call(null,G__118956));
})();
var cr118712_place_10 = ((cr118712_place_6) && (cr118712_place_9));
(cr118712_state[(0)] = cr118712_block_3);

(cr118712_state[(2)] = cr118712_place_10);

return cr118712_state;
}catch (e118949){var cr118712_exception = e118949;
(cr118712_state[(0)] = null);

(cr118712_state[(2)] = null);

throw cr118712_exception;
}});
var cr118712_block_10 = (function frontend$components$views$cr118712_block_10(cr118712_state){
try{var cr118712_place_11 = (cr118712_state[(1)]);
(cr118712_state[(0)] = null);

(cr118712_state[(1)] = null);

return cr118712_place_11;
}catch (e118962){var cr118712_exception = e118962;
(cr118712_state[(0)] = null);

(cr118712_state[(1)] = null);

throw cr118712_exception;
}});
var cr118712_block_3 = (function frontend$components$views$cr118712_block_3(cr118712_state){
try{var cr118712_place_2 = (cr118712_state[(2)]);
var cr118712_place_11 = null;
if(cljs.core.truth_(cr118712_place_2)){
(cr118712_state[(0)] = cr118712_block_5);

(cr118712_state[(2)] = null);

(cr118712_state[(1)] = cr118712_place_11);

return cr118712_state;
} else {
(cr118712_state[(0)] = cr118712_block_4);

(cr118712_state[(2)] = null);

(cr118712_state[(1)] = cr118712_place_11);

return cr118712_state;
}
}catch (e118967){var cr118712_exception = e118967;
(cr118712_state[(0)] = null);

(cr118712_state[(2)] = null);

throw cr118712_exception;
}});
var cr118712_block_6 = (function frontend$components$views$cr118712_block_6(cr118712_state){
try{var cr118712_place_21 = missionary.core.unpark();
var cr118712_place_22 = list_view_QMARK_;
var cr118712_place_23 = null;
if(cljs.core.truth_(cr118712_place_22)){
(cr118712_state[(0)] = cr118712_block_8);

(cr118712_state[(2)] = cr118712_place_23);

return cr118712_state;
} else {
(cr118712_state[(0)] = cr118712_block_7);

(cr118712_state[(3)] = cr118712_place_21);

(cr118712_state[(2)] = cr118712_place_23);

return cr118712_state;
}
}catch (e118975){var cr118712_exception = e118975;
(cr118712_state[(0)] = null);

(cr118712_state[(1)] = null);

throw cr118712_exception;
}});
var cr118712_block_1 = (function frontend$components$views$cr118712_block_1(cr118712_state){
try{var cr118712_place_0 = (cr118712_state[(1)]);
var cr118712_place_3 = cr118712_place_0;
(cr118712_state[(0)] = cr118712_block_3);

(cr118712_state[(1)] = null);

(cr118712_state[(2)] = cr118712_place_3);

return cr118712_state;
}catch (e118986){var cr118712_exception = e118986;
(cr118712_state[(0)] = null);

(cr118712_state[(1)] = null);

(cr118712_state[(2)] = null);

throw cr118712_exception;
}});
var cr118712_block_9 = (function frontend$components$views$cr118712_block_9(cr118712_state){
try{var cr118712_place_23 = (cr118712_state[(2)]);
var cr118712_place_28 = set_item_BANG_;
var cr118712_place_29 = cr118712_place_23;
var cr118712_place_30 = (function (){var G__118995 = cr118712_place_29;
var fexpr__118994 = cr118712_place_28;
return (fexpr__118994.cljs$core$IFn$_invoke$arity$1 ? fexpr__118994.cljs$core$IFn$_invoke$arity$1(G__118995) : fexpr__118994.call(null,G__118995));
})();
(cr118712_state[(0)] = cr118712_block_10);

(cr118712_state[(2)] = null);

(cr118712_state[(1)] = cr118712_place_30);

return cr118712_state;
}catch (e118992){var cr118712_exception = e118992;
(cr118712_state[(0)] = null);

(cr118712_state[(1)] = null);

(cr118712_state[(2)] = null);

throw cr118712_exception;
}});
var cr118712_block_0 = (function frontend$components$views$cr118712_block_0(cr118712_state){
try{var cr118712_place_0 = db_id;
var cr118712_place_1 = cr118712_place_0;
var cr118712_place_2 = null;
if(cljs.core.truth_(cr118712_place_1)){
(cr118712_state[(0)] = cr118712_block_2);

(cr118712_state[(2)] = cr118712_place_2);

return cr118712_state;
} else {
(cr118712_state[(0)] = cr118712_block_1);

(cr118712_state[(1)] = cr118712_place_0);

(cr118712_state[(2)] = cr118712_place_2);

return cr118712_state;
}
}catch (e118996){var cr118712_exception = e118996;
(cr118712_state[(0)] = null);

throw cr118712_exception;
}});
var cr118712_block_5 = (function frontend$components$views$cr118712_block_5(cr118712_state){
try{var cr118712_place_13 = frontend.common.missionary._LT__BANG_;
var cr118712_place_14 = frontend.db.async._LT_get_block;
var cr118712_place_15 = frontend.state.get_current_repo;
var cr118712_place_16 = (function (){var fexpr__119003 = cr118712_place_15;
return (fexpr__119003.cljs$core$IFn$_invoke$arity$0 ? fexpr__119003.cljs$core$IFn$_invoke$arity$0() : fexpr__119003.call(null));
})();
var cr118712_place_17 = db_id;
var cr118712_place_18 = opts;
var cr118712_place_19 = (function (){var G__119006 = cr118712_place_16;
var G__119007 = cr118712_place_17;
var G__119008 = cr118712_place_18;
var fexpr__119005 = cr118712_place_14;
return (fexpr__119005.cljs$core$IFn$_invoke$arity$3 ? fexpr__119005.cljs$core$IFn$_invoke$arity$3(G__119006,G__119007,G__119008) : fexpr__119005.call(null,G__119006,G__119007,G__119008));
})();
var cr118712_place_20 = (function (){var G__119012 = cr118712_place_19;
var fexpr__119011 = cr118712_place_13;
return (fexpr__119011.cljs$core$IFn$_invoke$arity$1 ? fexpr__119011.cljs$core$IFn$_invoke$arity$1(G__119012) : fexpr__119011.call(null,G__119012));
})();
(cr118712_state[(0)] = cr118712_block_6);

return missionary.core.park(cr118712_place_20);
}catch (e119001){var cr118712_exception = e119001;
(cr118712_state[(0)] = null);

(cr118712_state[(1)] = null);

throw cr118712_exception;
}});
var cr118712_block_4 = (function frontend$components$views$cr118712_block_4(cr118712_state){
try{var cr118712_place_12 = null;
(cr118712_state[(0)] = cr118712_block_10);

(cr118712_state[(1)] = cr118712_place_12);

return cr118712_state;
}catch (e119013){var cr118712_exception = e119013;
(cr118712_state[(0)] = null);

(cr118712_state[(1)] = null);

throw cr118712_exception;
}});
var cr118712_block_7 = (function frontend$components$views$cr118712_block_7(cr118712_state){
try{var cr118712_place_21 = (cr118712_state[(3)]);
var cr118712_place_24 = cr118712_place_21;
(cr118712_state[(0)] = cr118712_block_9);

(cr118712_state[(3)] = null);

(cr118712_state[(2)] = cr118712_place_24);

return cr118712_state;
}catch (e119014){var cr118712_exception = e119014;
(cr118712_state[(0)] = null);

(cr118712_state[(1)] = null);

(cr118712_state[(2)] = null);

(cr118712_state[(3)] = null);

throw cr118712_exception;
}});
return cloroutine.impl.coroutine((function (){var G__119018 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((4));
(G__119018[(0)] = cr118712_block_0);

return G__119018;
})());
})(),missionary.core.sp_run));
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [db_id,scrolling_QMARK_], null));

var item_SINGLEQUOTE_ = ((cljs.core.map_QMARK_(item__$1))?item__$1:((typeof item__$1 === 'number')?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","id","db/id",-1388397098),item__$1], null):null));
return daiquiri.interpreter.interpret((item_render.cljs$core$IFn$_invoke$arity$1 ? item_render.cljs$core$IFn$_invoke$arity$1(item_SINGLEQUOTE_) : item_render.call(null,item_SINGLEQUOTE_)));
}),null,"frontend.components.views/lazy-item");
frontend.components.views.table_body = rum.core.lazy_build(rum.core.build_defc,(function (table,option,rows,_STAR_scroller_ref,set_items_rendered_BANG_){
var vec__119031 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(false) : logseq.shui.hooks.use_state.call(null,false));
var scrolling_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__119031,(0),null);
var set_scrolling_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__119031,(1),null);
if(cljs.core.seq(rows)){
return daiquiri.interpreter.interpret((function (){var G__119040 = cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"skipAnimationFrameInResizeObserver","skipAnimationFrameInResizeObserver",1677982016),new cljs.core.Keyword(null,"ref","ref",1289896967),new cljs.core.Keyword(null,"is-scrolling","is-scrolling",982444296),new cljs.core.Keyword(null,"increase-viewport-by","increase-viewport-by",1517073864),new cljs.core.Keyword(null,"item-content","item-content",1656730280),new cljs.core.Keyword(null,"compute-item-key","compute-item-key",-621146487),new cljs.core.Keyword(null,"custom-scroll-parent","custom-scroll-parent",1031485618),new cljs.core.Keyword(null,"total-count","total-count",-1999441386),new cljs.core.Keyword(null,"context","context",-830191113),new cljs.core.Keyword(null,"items-rendered","items-rendered",1483099102)],[true,(function (p1__119025_SHARP_){
return cljs.core.reset_BANG_(_STAR_scroller_ref,p1__119025_SHARP_);
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
return (frontend.ui.virtualized_list.cljs$core$IFn$_invoke$arity$1 ? frontend.ui.virtualized_list.cljs$core$IFn$_invoke$arity$1(G__119040) : frontend.ui.virtualized_list.call(null,G__119040));
})());
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.views/table-body");
frontend.components.views.table_view = rum.core.lazy_build(rum.core.build_defc,(function (table,option,row_selection,_STAR_scroller_ref){
var selected_rows = (function (){var G__119050 = row_selection;
var G__119051 = new cljs.core.Keyword(null,"rows","rows",850049680).cljs$core$IFn$_invoke$arity$1(table);
return (logseq.shui.ui.table_get_selection_rows.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.table_get_selection_rows.cljs$core$IFn$_invoke$arity$2(G__119050,G__119051) : logseq.shui.ui.table_get_selection_rows.call(null,G__119050,G__119051));
})();
var vec__119046 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(false) : logseq.shui.hooks.use_state.call(null,false));
var items_rendered_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__119046,(0),null);
var set_items_rendered_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__119046,(1),null);
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
frontend.components.views.list_view = rum.core.lazy_build(rum.core.build_defc,(function (p__119062,_view_entity,p__119063,_STAR_scroller_ref){
var map__119064 = p__119062;
var map__119064__$1 = cljs.core.__destructure_map(map__119064);
var option = map__119064__$1;
var config = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__119064__$1,new cljs.core.Keyword(null,"config","config",994861415));
var map__119065 = p__119063;
var map__119065__$1 = cljs.core.__destructure_map(map__119065);
var rows = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__119065__$1,new cljs.core.Keyword(null,"rows","rows",850049680));
var lazy_item_render = (function (rows__$1,idx){
return frontend.components.views.lazy_item(rows__$1,idx,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(option,new cljs.core.Keyword(null,"list-view?","list-view?",499477951),true),(function (block){
return frontend.components.views.block_container(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(config,new cljs.core.Keyword(null,"list-view?","list-view?",499477951),true,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"block-level","block-level",390971879),(1)], 0)),block);
}));
});
var list_cp = (function (rows__$1){
if(cljs.core.seq(rows__$1)){
var G__119071 = new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"ref","ref",1289896967),(function (p1__119058_SHARP_){
return cljs.core.reset_BANG_(_STAR_scroller_ref,p1__119058_SHARP_);
}),new cljs.core.Keyword(null,"class","class",-2030961996),"content",new cljs.core.Keyword(null,"custom-scroll-parent","custom-scroll-parent",1031485618),frontend.components.views.get_scroll_parent(config),new cljs.core.Keyword(null,"increase-viewport-by","increase-viewport-by",1517073864),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"top","top",-1856271961),(64),new cljs.core.Keyword(null,"bottom","bottom",-1550509018),(64)], null),new cljs.core.Keyword(null,"compute-item-key","compute-item-key",-621146487),(function (idx){
var block_id = frontend.util.nth_safe(rows__$1,idx);
return ["list-row-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(block_id)].join('');
}),new cljs.core.Keyword(null,"total-count","total-count",-1999441386),cljs.core.count(rows__$1),new cljs.core.Keyword(null,"skipAnimationFrameInResizeObserver","skipAnimationFrameInResizeObserver",1677982016),true,new cljs.core.Keyword(null,"item-content","item-content",1656730280),(function (idx){
return lazy_item_render(rows__$1,idx);
})], null);
return (frontend.ui.virtualized_list.cljs$core$IFn$_invoke$arity$1 ? frontend.ui.virtualized_list.cljs$core$IFn$_invoke$arity$1(G__119071) : frontend.ui.virtualized_list.call(null,G__119071));
} else {
return null;
}
});
var breadcrumb = frontend.state.get_component(new cljs.core.Keyword("block","breadcrumb","block/breadcrumb",1725167425));
var all_numbers_QMARK_ = cljs.core.every_QMARK_(cljs.core.number_QMARK_,rows);
if(all_numbers_QMARK_){
return daiquiri.interpreter.interpret(list_cp(rows));
} else {
return cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$views$iter__119076(s__119077){
return (new cljs.core.LazySeq(null,(function (){
var s__119077__$1 = s__119077;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__119077__$1);
if(temp__5804__auto__){
var s__119077__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__119077__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__119077__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__119079 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__119078 = (0);
while(true){
if((i__119078 < size__5479__auto__)){
var vec__119085 = cljs.core._nth(c__5478__auto__,i__119078);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__119085,(0),null);
var row = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__119085,(1),null);
cljs.core.chunk_append(b__119079,((((cljs.core.vector_QMARK_(row)) && (cljs.core.uuid_QMARK_(cljs.core.first(row)))))?(function (){var vec__119091 = row;
var first_block_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__119091,(0),null);
var blocks = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__119091,(1),null);
return daiquiri.core.create_element("div",{'key':["partition-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(first_block_id)].join('')},[(function (){var attrs119118 = (function (){var G__119120 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"list-view?","list-view?",499477951),true);
var G__119121 = frontend.state.get_current_repo();
var G__119122 = first_block_id;
var G__119123 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"show-page?","show-page?",792494155),false], null);
return (breadcrumb.cljs$core$IFn$_invoke$arity$4 ? breadcrumb.cljs$core$IFn$_invoke$arity$4(G__119120,G__119121,G__119122,G__119123) : breadcrumb.call(null,G__119120,G__119121,G__119122,G__119123));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs119118))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ml-6","text-sm","opacity-70","hover:opacity-100","mt-1"], null)], null),attrs119118], 0))):{'className':"ml-6 text-sm opacity-70 hover:opacity-100 mt-1"}),((cljs.core.map_QMARK_(attrs119118))?null:[daiquiri.interpreter.interpret(attrs119118)]));
})(),daiquiri.interpreter.interpret(list_cp(blocks))]);
})():rum.core.with_key(lazy_item_render(rows,idx),["partition-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx)].join(''))));

var G__122538 = (i__119078 + (1));
i__119078 = G__122538;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__119079),frontend$components$views$iter__119076(cljs.core.chunk_rest(s__119077__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__119079),null);
}
} else {
var vec__119130 = cljs.core.first(s__119077__$2);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__119130,(0),null);
var row = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__119130,(1),null);
return cljs.core.cons(((((cljs.core.vector_QMARK_(row)) && (cljs.core.uuid_QMARK_(cljs.core.first(row)))))?(function (){var vec__119136 = row;
var first_block_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__119136,(0),null);
var blocks = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__119136,(1),null);
return daiquiri.core.create_element("div",{'key':["partition-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(first_block_id)].join('')},[(function (){var attrs119118 = (function (){var G__119139 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"list-view?","list-view?",499477951),true);
var G__119140 = frontend.state.get_current_repo();
var G__119141 = first_block_id;
var G__119142 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"show-page?","show-page?",792494155),false], null);
return (breadcrumb.cljs$core$IFn$_invoke$arity$4 ? breadcrumb.cljs$core$IFn$_invoke$arity$4(G__119139,G__119140,G__119141,G__119142) : breadcrumb.call(null,G__119139,G__119140,G__119141,G__119142));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs119118))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ml-6","text-sm","opacity-70","hover:opacity-100","mt-1"], null)], null),attrs119118], 0))):{'className':"ml-6 text-sm opacity-70 hover:opacity-100 mt-1"}),((cljs.core.map_QMARK_(attrs119118))?null:[daiquiri.interpreter.interpret(attrs119118)]));
})(),daiquiri.interpreter.interpret(list_cp(blocks))]);
})():rum.core.with_key(lazy_item_render(rows,idx),["partition-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx)].join(''))),frontend$components$views$iter__119076(cljs.core.rest(s__119077__$2)));
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
frontend.components.views.gallery_view = rum.core.lazy_build(rum.core.build_defcs,(function (state,p__119202,table,view_entity,blocks,_STAR_scroller_ref){
var map__119203 = p__119202;
var map__119203__$1 = cljs.core.__destructure_map(map__119203);
var config = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__119203__$1,new cljs.core.Keyword(null,"config","config",994861415));
var config_SINGLEQUOTE_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"container-id","container-id",1274665684),new cljs.core.Keyword(null,"container-id","container-id",1274665684).cljs$core$IFn$_invoke$arity$1(state));
var attrs119201 = ((cljs.core.seq(blocks))?(function (){var G__119206 = new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"ref","ref",1289896967),(function (p1__119159_SHARP_){
return cljs.core.reset_BANG_(_STAR_scroller_ref,p1__119159_SHARP_);
}),new cljs.core.Keyword(null,"total-count","total-count",-1999441386),cljs.core.count(blocks),new cljs.core.Keyword(null,"custom-scroll-parent","custom-scroll-parent",1031485618),frontend.components.views.get_scroll_parent(config),new cljs.core.Keyword(null,"skipAnimationFrameInResizeObserver","skipAnimationFrameInResizeObserver",1677982016),true,new cljs.core.Keyword(null,"compute-item-key","compute-item-key",-621146487),(function (idx){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_entity)),"-card-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx)].join('');
}),new cljs.core.Keyword(null,"item-content","item-content",1656730280),(function (idx){
return frontend.components.views.lazy_item(new cljs.core.Keyword(null,"data","data",-232669377).cljs$core$IFn$_invoke$arity$1(table),idx,cljs.core.PersistentArrayMap.EMPTY,(function (block){
return frontend.components.views.gallery_card_item(view_entity,block,config_SINGLEQUOTE_);
}));
})], null);
return (frontend.ui.virtualized_grid.cljs$core$IFn$_invoke$arity$1 ? frontend.ui.virtualized_grid.cljs$core$IFn$_invoke$arity$1(G__119206) : frontend.ui.virtualized_grid.call(null,G__119206));
})():null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs119201))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ls-cards"], null)], null),attrs119201], 0))):{'className':"ls-cards"}),((cljs.core.map_QMARK_(attrs119201))?null:[daiquiri.interpreter.interpret(attrs119201)]));
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$,frontend.mixins.container_id], null),"frontend.components.views/gallery-view");
frontend.components.views.run_effects_BANG_ = (function frontend$components$views$run_effects_BANG_(option,p__119214,_STAR_scroller_ref,gallery_QMARK_){
var map__119215 = p__119214;
var map__119215__$1 = cljs.core.__destructure_map(map__119215);
var data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__119215__$1,new cljs.core.Keyword(null,"data","data",-232669377));
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
return daiquiri.core.create_element("div",{'className':"flex flex-row gap-2 items-center justify-between px-2"},[(function (){var attrs119229 = (function (){var G__119287 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"class","class",-2030961996),"!px-1",new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"title","title",636505583),"Drag && Drop to reorder"], null);
var G__119288 = logseq.shui.ui.tabler_icon("grip-vertical",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(14)], null));
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__119287,G__119288) : logseq.shui.ui.button.call(null,G__119287,G__119288));
})();
return daiquiri.core.create_element("div:div",((cljs.core.map_QMARK_(attrs119229))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","gap-1","items-center"], null)], null),attrs119229], 0))):{'className':"flex flex-row gap-1 items-center"}),((cljs.core.map_QMARK_(attrs119229))?[daiquiri.core.create_element("div",{'className':"text-muted-foreground whitespace-nowrap"},[[cljs.core.str.cljs$core$IFn$_invoke$arity$1(name),":"].join('')])]:[daiquiri.interpreter.interpret(attrs119229),daiquiri.core.create_element("div",{'className':"text-muted-foreground whitespace-nowrap"},[[cljs.core.str.cljs$core$IFn$_invoke$arity$1(name),":"].join('')])]));
})(),(function (){var attrs119285 = (function (){var G__119293 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"default-value","default-value",232220170),(cljs.core.truth_(asc_QMARK_)?"asc":"desc"),new cljs.core.Keyword(null,"on-value-change","on-value-change",-621835289),(function (v){
var asc_QMARK___$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(v,"asc");
var f = new cljs.core.Keyword(null,"column-set-sorting!","column-set-sorting!",892954674).cljs$core$IFn$_invoke$arity$1(table);
if(cljs.core.truth_(f)){
var G__119296 = sorting;
var G__119297 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"id","id",-1388402092),id], null);
var G__119299 = asc_QMARK___$1;
return (f.cljs$core$IFn$_invoke$arity$3 ? f.cljs$core$IFn$_invoke$arity$3(G__119296,G__119297,G__119299) : f.call(null,G__119296,G__119297,G__119299));
} else {
return null;
}
})], null);
var G__119294 = (function (){var G__119300 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"order-button !px-2 !py-0 !h-8"], null);
var G__119301 = (function (){var G__119302 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"Select order"], null);
return (logseq.shui.ui.select_value.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_value.cljs$core$IFn$_invoke$arity$1(G__119302) : logseq.shui.ui.select_value.call(null,G__119302));
})();
return (logseq.shui.ui.select_trigger.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_trigger.cljs$core$IFn$_invoke$arity$2(G__119300,G__119301) : logseq.shui.ui.select_trigger.call(null,G__119300,G__119301));
})();
var G__119295 = (function (){var G__119305 = (function (){var G__119306 = (function (){var G__119309 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"value","value",305978217),"asc"], null);
var G__119310 = "Ascending";
return (logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2(G__119309,G__119310) : logseq.shui.ui.select_item.call(null,G__119309,G__119310));
})();
var G__119307 = (function (){var G__119311 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"value","value",305978217),"desc"], null);
var G__119312 = "Descending";
return (logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2(G__119311,G__119312) : logseq.shui.ui.select_item.call(null,G__119311,G__119312));
})();
return (logseq.shui.ui.select_group.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_group.cljs$core$IFn$_invoke$arity$2(G__119306,G__119307) : logseq.shui.ui.select_group.call(null,G__119306,G__119307));
})();
return (logseq.shui.ui.select_content.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_content.cljs$core$IFn$_invoke$arity$1(G__119305) : logseq.shui.ui.select_content.call(null,G__119305));
})();
return (logseq.shui.ui.select.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.select.cljs$core$IFn$_invoke$arity$3(G__119293,G__119294,G__119295) : logseq.shui.ui.select.call(null,G__119293,G__119294,G__119295));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs119285))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","gap-2","items-center"], null)], null),attrs119285], 0))):{'className':"flex flex-row gap-2 items-center"}),((cljs.core.map_QMARK_(attrs119285))?[daiquiri.interpreter.interpret((function (){var G__119323 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),"ghost",new cljs.core.Keyword(null,"class","class",-2030961996),"text-muted-foreground !px-1",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var f = new cljs.core.Keyword(null,"column-set-sorting!","column-set-sorting!",892954674).cljs$core$IFn$_invoke$arity$1(table);
var new_sorting = (function (){var G__119326 = sorting;
var G__119327 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"id","id",-1388402092),id], null);
var G__119328 = null;
return (f.cljs$core$IFn$_invoke$arity$3 ? f.cljs$core$IFn$_invoke$arity$3(G__119326,G__119327,G__119328) : f.call(null,G__119326,G__119327,G__119328));
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
var G__119324 = frontend.ui.icon("x");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__119323,G__119324) : logseq.shui.ui.button.call(null,G__119323,G__119324));
})())]:[daiquiri.interpreter.interpret(attrs119285),daiquiri.interpreter.interpret((function (){var G__119340 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),"ghost",new cljs.core.Keyword(null,"class","class",-2030961996),"text-muted-foreground !px-1",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var f = new cljs.core.Keyword(null,"column-set-sorting!","column-set-sorting!",892954674).cljs$core$IFn$_invoke$arity$1(table);
var new_sorting = (function (){var G__119343 = sorting;
var G__119344 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"id","id",-1388402092),id], null);
var G__119345 = null;
return (f.cljs$core$IFn$_invoke$arity$3 ? f.cljs$core$IFn$_invoke$arity$3(G__119343,G__119344,G__119345) : f.call(null,G__119343,G__119344,G__119345));
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
var G__119341 = frontend.ui.icon("x");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__119340,G__119341) : logseq.shui.ui.button.call(null,G__119340,G__119341));
})())]));
})()]);
}),null,"frontend.components.views/view-sorting-item");
frontend.components.views.view_sorting_config = rum.core.lazy_build(rum.core.build_defc,(function (table,sorting,columns){
var vec__119464 = rum.core.use_state(sorting);
var sorting__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__119464,(0),null);
var set_sorting_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__119464,(1),null);
var attrs119463 = (function (){var items = (function (){var iter__5480__auto__ = (function frontend$components$views$iter__119467(s__119468){
return (new cljs.core.LazySeq(null,(function (){
var s__119468__$1 = s__119468;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__119468__$1);
if(temp__5804__auto__){
var s__119468__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__119468__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__119468__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__119470 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__119469 = (0);
while(true){
if((i__119469 < size__5479__auto__)){
var map__119480 = cljs.core._nth(c__5478__auto__,i__119469);
var map__119480__$1 = cljs.core.__destructure_map(map__119480);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__119480__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var asc_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__119480__$1,new cljs.core.Keyword(null,"asc?","asc?",891093427));
cljs.core.chunk_append(b__119470,(function (){var temp__5804__auto____$1 = cljs.core.some(((function (i__119469,map__119480,map__119480__$1,id,asc_QMARK_,c__5478__auto__,size__5479__auto__,b__119470,s__119468__$2,temp__5804__auto__,vec__119464,sorting__$1,set_sorting_BANG_){
return (function (column){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(id,new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column))){
return new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(column);
} else {
return null;
}
});})(i__119469,map__119480,map__119480__$1,id,asc_QMARK_,c__5478__auto__,size__5479__auto__,b__119470,s__119468__$2,temp__5804__auto__,vec__119464,sorting__$1,set_sorting_BANG_))
,columns);
if(cljs.core.truth_(temp__5804__auto____$1)){
var name = temp__5804__auto____$1;
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),new cljs.core.Keyword(null,"value","value",305978217),id,new cljs.core.Keyword(null,"content","content",15833224),frontend.components.views.view_sorting_item(table,sorting__$1,id,name,asc_QMARK_,set_sorting_BANG_)], null);
} else {
return null;
}
})());

var G__122542 = (i__119469 + (1));
i__119469 = G__122542;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__119470),frontend$components$views$iter__119467(cljs.core.chunk_rest(s__119468__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__119470),null);
}
} else {
var map__119493 = cljs.core.first(s__119468__$2);
var map__119493__$1 = cljs.core.__destructure_map(map__119493);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__119493__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var asc_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__119493__$1,new cljs.core.Keyword(null,"asc?","asc?",891093427));
return cljs.core.cons((function (){var temp__5804__auto____$1 = cljs.core.some(((function (map__119493,map__119493__$1,id,asc_QMARK_,s__119468__$2,temp__5804__auto__,vec__119464,sorting__$1,set_sorting_BANG_){
return (function (column){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(id,new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column))){
return new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(column);
} else {
return null;
}
});})(map__119493,map__119493__$1,id,asc_QMARK_,s__119468__$2,temp__5804__auto__,vec__119464,sorting__$1,set_sorting_BANG_))
,columns);
if(cljs.core.truth_(temp__5804__auto____$1)){
var name = temp__5804__auto____$1;
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),new cljs.core.Keyword(null,"value","value",305978217),id,new cljs.core.Keyword(null,"content","content",15833224),frontend.components.views.view_sorting_item(table,sorting__$1,id,name,asc_QMARK_,set_sorting_BANG_)], null);
} else {
return null;
}
})(),frontend$components$views$iter__119467(cljs.core.rest(s__119468__$2)));
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
return cljs.core.some((function (p1__119352_SHARP_){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(column,new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(p1__119352_SHARP_))){
return p1__119352_SHARP_;
} else {
return null;
}
}),sorting__$1);
}),ordered_columns);
(set_sorting_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_sorting_BANG_.cljs$core$IFn$_invoke$arity$1(new_sorting) : set_sorting_BANG_.call(null,new_sorting));

return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(new_sorting) : f.call(null,new_sorting));
})], null));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs119463))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ls-view-order-setting","flex","flex-col","gap-2","py-2","text-sm"], null)], null),attrs119463], 0))):{'className':"ls-view-order-setting flex flex-col gap-2 py-2 text-sm"}),((cljs.core.map_QMARK_(attrs119463))?[daiquiri.interpreter.interpret((function (){var G__119526 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-muted-foreground pl-3",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var f = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(table,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"data-fns","data-fns",-1065218324),new cljs.core.Keyword(null,"set-sorting!","set-sorting!",543042376)], null));
(set_sorting_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_sorting_BANG_.cljs$core$IFn$_invoke$arity$1(null) : set_sorting_BANG_.call(null,null));

(f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(null) : f.call(null,null));

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
})], null);
var G__119527 = frontend.ui.icon("trash",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(15)], null));
var G__119528 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.ml-1","span.ml-1",-436032201),"Delete sort"], null);
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__119526,G__119527,G__119528) : logseq.shui.ui.dropdown_menu_item.call(null,G__119526,G__119527,G__119528));
})())]:[daiquiri.interpreter.interpret(attrs119463),daiquiri.interpreter.interpret((function (){var G__119537 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-muted-foreground pl-3",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var f = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(table,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"data-fns","data-fns",-1065218324),new cljs.core.Keyword(null,"set-sorting!","set-sorting!",543042376)], null));
(set_sorting_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_sorting_BANG_.cljs$core$IFn$_invoke$arity$1(null) : set_sorting_BANG_.call(null,null));

(f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(null) : f.call(null,null));

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
})], null);
var G__119538 = frontend.ui.icon("trash",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(15)], null));
var G__119539 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.ml-1","span.ml-1",-436032201),"Delete sort"], null);
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__119537,G__119538,G__119539) : logseq.shui.ui.dropdown_menu_item.call(null,G__119537,G__119538,G__119539));
})())]));
}),null,"frontend.components.views/view-sorting-config");
frontend.components.views.view_sorting = rum.core.lazy_build(rum.core.build_defc,(function (table,columns,sorting){
return daiquiri.interpreter.interpret((function (){var G__119557 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),"ghost",new cljs.core.Keyword(null,"class","class",-2030961996),"text-muted-foreground !px-1",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
var G__119559 = e.target;
var G__119560 = (function (){
return frontend.components.views.view_sorting_config(table,sorting,columns);
});
var G__119561 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"end","end",-268185958)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__119559,G__119560,G__119561) : logseq.shui.ui.popup_show_BANG_.call(null,G__119559,G__119560,G__119561));
})], null);
var G__119558 = frontend.ui.icon("arrows-up-down");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__119557,G__119558) : logseq.shui.ui.button.call(null,G__119557,G__119558));
})());
}),null,"frontend.components.views/view-sorting");
frontend.components.views.view_cp = (function frontend$components$views$view_cp(view_entity,table,option_STAR_,p__119566){
var map__119567 = p__119566;
var map__119567__$1 = cljs.core.__destructure_map(map__119567);
var _STAR_scroller_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__119567__$1,new cljs.core.Keyword(null,"*scroller-ref","*scroller-ref",-635636256));
var display_type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__119567__$1,new cljs.core.Keyword(null,"display-type","display-type",-749971179));
var row_selection = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__119567__$1,new cljs.core.Keyword(null,"row-selection","row-selection",1964656498));
var option = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(option_STAR_,new cljs.core.Keyword(null,"view-entity","view-entity",-1084117808),view_entity);
var G__119570 = display_type;
var G__119570__$1 = (((G__119570 instanceof cljs.core.Keyword))?G__119570.fqn:null);
switch (G__119570__$1) {
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
var entity = (function (){var G__119580 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(ent);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__119580) : frontend.db.entity.call(null,G__119580));
})();
var views = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (view){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(view_feature_type,new cljs.core.Keyword("logseq.property.view","feature-type","logseq.property.view/feature-type",-939141871).cljs$core$IFn$_invoke$arity$1(view));
}),new cljs.core.Keyword("logseq.property","_view-for","logseq.property/_view-for",427007845).cljs$core$IFn$_invoke$arity$1(entity));
return logseq.db.sort_by_order(views);
});
frontend.components.views.create_view_BANG_ = (function frontend$components$views$create_view_BANG_(view_parent,view_feature_type,p__119584){
var map__119585 = p__119584;
var map__119585__$1 = cljs.core.__destructure_map(map__119585);
var auto_triggered_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__119585__$1,new cljs.core.Keyword(null,"auto-triggered?","auto-triggered?",1255221895));
var temp__5804__auto__ = (frontend.db.get_case_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_case_page.cljs$core$IFn$_invoke$arity$1(logseq.common.config.views_page_name) : frontend.db.get_case_page.call(null,logseq.common.config.views_page_name));
if(cljs.core.truth_(temp__5804__auto__)){
var page = temp__5804__auto__;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__119592 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("logseq.property","view-for","logseq.property/view-for",-36274319),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_parent),new cljs.core.Keyword("logseq.property.view","feature-type","logseq.property.view/feature-type",-939141871),view_feature_type], null);
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"linked-references","linked-references",-2117592379),null,new cljs.core.Keyword(null,"unlinked-references","unlinked-references",1918870007),null], null), null),view_feature_type)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(G__119592,new cljs.core.Keyword("logseq.property.view","type","logseq.property.view/type",218237607),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property.view","type.list","logseq.property.view/type.list",-1164828502)) : frontend.db.entity.call(null,new cljs.core.Keyword("logseq.property.view","type.list","logseq.property.view/type.list",-1164828502)))),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("logseq.property.view","group-by-property","logseq.property.view/group-by-property",809216236),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108)) : frontend.db.entity.call(null,new cljs.core.Keyword("block","page","block/page",822314108))))], 0));
} else {
return G__119592;
}
})()),(function (properties){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.seq(frontend.components.views.get_views(view_parent,view_feature_type))),(function (view_exists_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(view_exists_QMARK_)?"":(function (){var G__119607 = view_feature_type;
var G__119607__$1 = (((G__119607 instanceof cljs.core.Keyword))?G__119607.fqn:null);
switch (G__119607__$1) {
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
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.api_insert_new_block_BANG_(view_title,(function (){var G__119621 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page),new cljs.core.Keyword(null,"properties","properties",685819552),properties,new cljs.core.Keyword(null,"edit-block?","edit-block?",-310383789),false], null);
if(cljs.core.truth_(auto_triggered_QMARK_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__119621,new cljs.core.Keyword(null,"custom-uuid","custom-uuid",-1095135430),view_block_id);
} else {
return G__119621;
}
})())),(function (result){
return promesa.protocols._promise((function (){var G__119627 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(result)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__119627) : frontend.db.entity.call(null,G__119627));
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
frontend.components.views.views_tab = rum.core.lazy_build(rum.core.build_defc,(function (view_parent,current_view,p__119651){
var map__119653 = p__119651;
var map__119653__$1 = cljs.core.__destructure_map(map__119653);
var views = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__119653__$1,new cljs.core.Keyword(null,"views","views",1450155487));
var data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__119653__$1,new cljs.core.Keyword(null,"data","data",-232669377));
var show_items_count_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__119653__$1,new cljs.core.Keyword(null,"show-items-count?","show-items-count?",-1022363900));
var set_views_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__119653__$1,new cljs.core.Keyword(null,"set-views!","set-views!",-185817176));
var set_view_entity_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__119653__$1,new cljs.core.Keyword(null,"set-view-entity!","set-view-entity!",-69891185));
var set_data_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__119653__$1,new cljs.core.Keyword(null,"set-data!","set-data!",150955183));
var opacity = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__119653__$1,new cljs.core.Keyword(null,"opacity","opacity",397153780));
var view_feature_type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__119653__$1,new cljs.core.Keyword(null,"view-feature-type","view-feature-type",-945869610));
var items_count = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__119653__$1,new cljs.core.Keyword(null,"items-count","items-count",-135458025));
var references_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__119653__$1,new cljs.core.Keyword(null,"references?","references?",-487254152));
return daiquiri.core.create_element("div",{'className':"views"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$views$iter__119660(s__119661){
return (new cljs.core.LazySeq(null,(function (){
var s__119661__$1 = s__119661;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__119661__$1);
if(temp__5804__auto__){
var s__119661__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__119661__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__119661__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__119663 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__119662 = (0);
while(true){
if((i__119662 < size__5479__auto__)){
var view_STAR_ = cljs.core._nth(c__5478__auto__,i__119662);
cljs.core.chunk_append(b__119663,(function (){var view = (function (){var G__119695 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_STAR_);
return (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(G__119695) : frontend.db.sub_block.call(null,G__119695));
})();
var current_view_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(current_view),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view));
return daiquiri.interpreter.interpret((function (){var G__119847 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"text","text",-1790561697),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"class","class",-2030961996),["text-sm px-0 py-0 h-6 ",((current_view_QMARK_)?null:"text-muted-foreground")].join(''),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__119662,view,current_view_QMARK_,view_STAR_,c__5478__auto__,size__5479__auto__,b__119663,s__119661__$2,temp__5804__auto__,map__119653,map__119653__$1,views,data,show_items_count_QMARK_,set_views_BANG_,set_view_entity_BANG_,set_data_BANG_,opacity,view_feature_type,items_count,references_QMARK_){
return (function (e){
if(((current_view_QMARK_) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_parent))))){
var G__119861 = e.target;
var G__119862 = ((function (i__119662,G__119861,view,current_view_QMARK_,view_STAR_,c__5478__auto__,size__5479__auto__,b__119663,s__119661__$2,temp__5804__auto__,map__119653,map__119653__$1,views,data,show_items_count_QMARK_,set_views_BANG_,set_view_entity_BANG_,set_data_BANG_,opacity,view_feature_type,items_count,references_QMARK_){
return (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),(function (){var G__119871 = (logseq.shui.ui.dropdown_menu_sub_trigger.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_sub_trigger.cljs$core$IFn$_invoke$arity$1("Rename") : logseq.shui.ui.dropdown_menu_sub_trigger.call(null,"Rename"));
var G__119872 = (function (){var G__119883 = (function (){var temp__5804__auto____$1 = frontend.state.get_component(new cljs.core.Keyword("block","container","block/container",510671002));
if(cljs.core.truth_(temp__5804__auto____$1)){
var block_container_cp = temp__5804__auto____$1;
var G__119886 = cljs.core.PersistentArrayMap.EMPTY;
var G__119887 = view;
return (block_container_cp.cljs$core$IFn$_invoke$arity$2 ? block_container_cp.cljs$core$IFn$_invoke$arity$2(G__119886,G__119887) : block_container_cp.call(null,G__119886,G__119887));
} else {
return null;
}
})();
return (logseq.shui.ui.dropdown_menu_sub_content.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_sub_content.cljs$core$IFn$_invoke$arity$1(G__119883) : logseq.shui.ui.dropdown_menu_sub_content.call(null,G__119883));
})();
return (logseq.shui.ui.dropdown_menu_sub.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_sub.cljs$core$IFn$_invoke$arity$2(G__119871,G__119872) : logseq.shui.ui.dropdown_menu_sub.call(null,G__119871,G__119872));
})(),(function (){var G__119893 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Delete",new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__119662,G__119861,view,current_view_QMARK_,view_STAR_,c__5478__auto__,size__5479__auto__,b__119663,s__119661__$2,temp__5804__auto__,map__119653,map__119653__$1,views,data,show_items_count_QMARK_,set_views_BANG_,set_view_entity_BANG_,set_data_BANG_,opacity,view_feature_type,items_count,references_QMARK_){
return (function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),((function (i__119662,G__119861,view,current_view_QMARK_,view_STAR_,c__5478__auto__,size__5479__auto__,b__119663,s__119661__$2,temp__5804__auto__,map__119653,map__119653__$1,views,data,show_items_count_QMARK_,set_views_BANG_,set_view_entity_BANG_,set_data_BANG_,opacity,view_feature_type,items_count,references_QMARK_){
return (function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.delete_block_aux_BANG_(view)),((function (i__119662,G__119861,view,current_view_QMARK_,view_STAR_,c__5478__auto__,size__5479__auto__,b__119663,s__119661__$2,temp__5804__auto__,map__119653,map__119653__$1,views,data,show_items_count_QMARK_,set_views_BANG_,set_view_entity_BANG_,set_data_BANG_,opacity,view_feature_type,items_count,references_QMARK_){
return (function (___41611__auto__){
return promesa.protocols._promise((function (){var views_SINGLEQUOTE_ = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(((function (i__119662,G__119861,view,current_view_QMARK_,view_STAR_,c__5478__auto__,size__5479__auto__,b__119663,s__119661__$2,temp__5804__auto__,map__119653,map__119653__$1,views,data,show_items_count_QMARK_,set_views_BANG_,set_view_entity_BANG_,set_data_BANG_,opacity,view_feature_type,items_count,references_QMARK_){
return (function (v){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(v),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view));
});})(i__119662,G__119861,view,current_view_QMARK_,view_STAR_,c__5478__auto__,size__5479__auto__,b__119663,s__119661__$2,temp__5804__auto__,map__119653,map__119653__$1,views,data,show_items_count_QMARK_,set_views_BANG_,set_view_entity_BANG_,set_data_BANG_,opacity,view_feature_type,items_count,references_QMARK_))
,views);
(set_views_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_views_BANG_.cljs$core$IFn$_invoke$arity$1(views_SINGLEQUOTE_) : set_views_BANG_.call(null,views_SINGLEQUOTE_));

var G__119947_122545 = cljs.core.first(views_SINGLEQUOTE_);
(set_view_entity_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_view_entity_BANG_.cljs$core$IFn$_invoke$arity$1(G__119947_122545) : set_view_entity_BANG_.call(null,G__119947_122545));

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
})());
});})(i__119662,G__119861,view,current_view_QMARK_,view_STAR_,c__5478__auto__,size__5479__auto__,b__119663,s__119661__$2,temp__5804__auto__,map__119653,map__119653__$1,views,data,show_items_count_QMARK_,set_views_BANG_,set_view_entity_BANG_,set_data_BANG_,opacity,view_feature_type,items_count,references_QMARK_))
);
});})(i__119662,G__119861,view,current_view_QMARK_,view_STAR_,c__5478__auto__,size__5479__auto__,b__119663,s__119661__$2,temp__5804__auto__,map__119653,map__119653__$1,views,data,show_items_count_QMARK_,set_views_BANG_,set_view_entity_BANG_,set_data_BANG_,opacity,view_feature_type,items_count,references_QMARK_))
);
});})(i__119662,G__119861,view,current_view_QMARK_,view_STAR_,c__5478__auto__,size__5479__auto__,b__119663,s__119661__$2,temp__5804__auto__,map__119653,map__119653__$1,views,data,show_items_count_QMARK_,set_views_BANG_,set_view_entity_BANG_,set_data_BANG_,opacity,view_feature_type,items_count,references_QMARK_))
], null);
var G__119894 = "Delete";
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__119893,G__119894) : logseq.shui.ui.dropdown_menu_item.call(null,G__119893,G__119894));
})()], null);
});})(i__119662,G__119861,view,current_view_QMARK_,view_STAR_,c__5478__auto__,size__5479__auto__,b__119663,s__119661__$2,temp__5804__auto__,map__119653,map__119653__$1,views,data,show_items_count_QMARK_,set_views_BANG_,set_view_entity_BANG_,set_data_BANG_,opacity,view_feature_type,items_count,references_QMARK_))
;
var G__119863 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558),true,new cljs.core.Keyword(null,"align","align",1964212802),"start",new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"onClick","onClick",-1991238530),logseq.shui.ui.popup_hide_BANG_], null)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__119861,G__119862,G__119863) : logseq.shui.ui.popup_show_BANG_.call(null,G__119861,G__119862,G__119863));
} else {
(set_view_entity_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_view_entity_BANG_.cljs$core$IFn$_invoke$arity$1(view) : set_view_entity_BANG_.call(null,view));

return (set_data_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_data_BANG_.cljs$core$IFn$_invoke$arity$1(null) : set_data_BANG_.call(null,null));
}
});})(i__119662,view,current_view_QMARK_,view_STAR_,c__5478__auto__,size__5479__auto__,b__119663,s__119661__$2,temp__5804__auto__,map__119653,map__119653__$1,views,data,show_items_count_QMARK_,set_views_BANG_,set_view_entity_BANG_,set_data_BANG_,opacity,view_feature_type,items_count,references_QMARK_))
], null);
var G__119848 = (cljs.core.truth_(references_QMARK_)?null:(function (){var display_type = (function (){var or__5002__auto__ = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(cljs.core.get.cljs$core$IFn$_invoke$arity$2(view,new cljs.core.Keyword("logseq.property.view","type","logseq.property.view/type",218237607)));
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
var G__119849 = (function (){var title = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(view);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(title,"")){
return "New view";
} else {
return title;
}
})();
var G__119850 = (cljs.core.truth_((function (){var and__5000__auto__ = current_view_QMARK_;
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
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$4 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$4(G__119847,G__119848,G__119849,G__119850) : logseq.shui.ui.button.call(null,G__119847,G__119848,G__119849,G__119850));
})());
})());

var G__122546 = (i__119662 + (1));
i__119662 = G__122546;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__119663),frontend$components$views$iter__119660(cljs.core.chunk_rest(s__119661__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__119663),null);
}
} else {
var view_STAR_ = cljs.core.first(s__119661__$2);
return cljs.core.cons((function (){var view = (function (){var G__119994 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_STAR_);
return (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(G__119994) : frontend.db.sub_block.call(null,G__119994));
})();
var current_view_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(current_view),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view));
return daiquiri.interpreter.interpret((function (){var G__120107 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"text","text",-1790561697),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"class","class",-2030961996),["text-sm px-0 py-0 h-6 ",((current_view_QMARK_)?null:"text-muted-foreground")].join(''),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (view,current_view_QMARK_,view_STAR_,s__119661__$2,temp__5804__auto__,map__119653,map__119653__$1,views,data,show_items_count_QMARK_,set_views_BANG_,set_view_entity_BANG_,set_data_BANG_,opacity,view_feature_type,items_count,references_QMARK_){
return (function (e){
if(((current_view_QMARK_) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_parent))))){
var G__120120 = e.target;
var G__120121 = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),(function (){var G__120124 = (logseq.shui.ui.dropdown_menu_sub_trigger.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_sub_trigger.cljs$core$IFn$_invoke$arity$1("Rename") : logseq.shui.ui.dropdown_menu_sub_trigger.call(null,"Rename"));
var G__120125 = (function (){var G__120126 = (function (){var temp__5804__auto____$1 = frontend.state.get_component(new cljs.core.Keyword("block","container","block/container",510671002));
if(cljs.core.truth_(temp__5804__auto____$1)){
var block_container_cp = temp__5804__auto____$1;
var G__120134 = cljs.core.PersistentArrayMap.EMPTY;
var G__120135 = view;
return (block_container_cp.cljs$core$IFn$_invoke$arity$2 ? block_container_cp.cljs$core$IFn$_invoke$arity$2(G__120134,G__120135) : block_container_cp.call(null,G__120134,G__120135));
} else {
return null;
}
})();
return (logseq.shui.ui.dropdown_menu_sub_content.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_sub_content.cljs$core$IFn$_invoke$arity$1(G__120126) : logseq.shui.ui.dropdown_menu_sub_content.call(null,G__120126));
})();
return (logseq.shui.ui.dropdown_menu_sub.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_sub.cljs$core$IFn$_invoke$arity$2(G__120124,G__120125) : logseq.shui.ui.dropdown_menu_sub.call(null,G__120124,G__120125));
})(),(function (){var G__120140 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"Delete",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.delete_block_aux_BANG_(view)),(function (___41611__auto__){
return promesa.protocols._promise((function (){var views_SINGLEQUOTE_ = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (v){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(v),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view));
}),views);
(set_views_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_views_BANG_.cljs$core$IFn$_invoke$arity$1(views_SINGLEQUOTE_) : set_views_BANG_.call(null,views_SINGLEQUOTE_));

var G__120161_122547 = cljs.core.first(views_SINGLEQUOTE_);
(set_view_entity_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_view_entity_BANG_.cljs$core$IFn$_invoke$arity$1(G__120161_122547) : set_view_entity_BANG_.call(null,G__120161_122547));

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
})());
}));
}));
})], null);
var G__120141 = "Delete";
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__120140,G__120141) : logseq.shui.ui.dropdown_menu_item.call(null,G__120140,G__120141));
})()], null);
});
var G__120122 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558),true,new cljs.core.Keyword(null,"align","align",1964212802),"start",new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"onClick","onClick",-1991238530),logseq.shui.ui.popup_hide_BANG_], null)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__120120,G__120121,G__120122) : logseq.shui.ui.popup_show_BANG_.call(null,G__120120,G__120121,G__120122));
} else {
(set_view_entity_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_view_entity_BANG_.cljs$core$IFn$_invoke$arity$1(view) : set_view_entity_BANG_.call(null,view));

return (set_data_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_data_BANG_.cljs$core$IFn$_invoke$arity$1(null) : set_data_BANG_.call(null,null));
}
});})(view,current_view_QMARK_,view_STAR_,s__119661__$2,temp__5804__auto__,map__119653,map__119653__$1,views,data,show_items_count_QMARK_,set_views_BANG_,set_view_entity_BANG_,set_data_BANG_,opacity,view_feature_type,items_count,references_QMARK_))
], null);
var G__120108 = (cljs.core.truth_(references_QMARK_)?null:(function (){var display_type = (function (){var or__5002__auto__ = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(cljs.core.get.cljs$core$IFn$_invoke$arity$2(view,new cljs.core.Keyword("logseq.property.view","type","logseq.property.view/type",218237607)));
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
var G__120109 = (function (){var title = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(view);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(title,"")){
return "New view";
} else {
return title;
}
})();
var G__120110 = (cljs.core.truth_((function (){var and__5000__auto__ = current_view_QMARK_;
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
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$4 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$4(G__120107,G__120108,G__120109,G__120110) : logseq.shui.ui.button.call(null,G__120107,G__120108,G__120109,G__120110));
})());
})(),frontend$components$views$iter__119660(cljs.core.rest(s__119661__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(views);
})()),daiquiri.interpreter.interpret((function (){var G__120244 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"text","text",-1790561697),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"title","title",636505583),"Add new view",new cljs.core.Keyword(null,"class","class",-2030961996),["!px-1 -ml-1 text-muted-foreground hover:text-foreground transition-opacity ease-in duration-300 ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(opacity)].join(''),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.components.views.create_view_BANG_(view_parent,view_feature_type,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"auto-triggered?","auto-triggered?",1255221895),false], null))),(function (view){
return promesa.protocols._promise((function (){var G__120261 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(views,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [view], null));
return (set_views_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_views_BANG_.cljs$core$IFn$_invoke$arity$1(G__120261) : set_views_BANG_.call(null,G__120261));
})());
}));
}));
})], null);
var G__120245 = frontend.ui.icon("plus",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(15)], null));
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__120244,G__120245) : logseq.shui.ui.button.call(null,G__120244,G__120245));
})())]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query], null),"frontend.components.views/views-tab");
frontend.components.views.view_head = rum.core.lazy_build(rum.core.build_defc,(function (view_parent,view_entity,table,columns,input,sorting,set_input_BANG_,add_new_object_BANG_,p__120394){
var map__120398 = p__120394;
var map__120398__$1 = cljs.core.__destructure_map(map__120398);
var option = map__120398__$1;
var view_feature_type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120398__$1,new cljs.core.Keyword(null,"view-feature-type","view-feature-type",-945869610));
var title_key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120398__$1,new cljs.core.Keyword(null,"title-key","title-key",830482796));
var additional_actions = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120398__$1,new cljs.core.Keyword(null,"additional-actions","additional-actions",1699457595));
var vec__120404 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_state.call(null,null));
var hover_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120404,(0),null);
var set_hover_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120404,(1),null);
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo());
var references_QMARK_ = cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"linked-references","linked-references",-2117592379),null,new cljs.core.Keyword(null,"unlinked-references","unlinked-references",1918870007),null], null), null),view_feature_type);
var opacity = ((((references_QMARK_) && (cljs.core.not(hover_QMARK_))))?"opacity-0":(cljs.core.truth_(hover_QMARK_)?"opacity-100":"opacity-75"
));
return daiquiri.core.create_element("div",{'onMouseOver':(function (){
return (set_hover_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_hover_QMARK_.cljs$core$IFn$_invoke$arity$1(true) : set_hover_QMARK_.call(null,true));
}),'onMouseOut':(function (){
return (set_hover_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_hover_QMARK_.cljs$core$IFn$_invoke$arity$1(false) : set_hover_QMARK_.call(null,false));
}),'className':"flex flex-1 flex-nowrap items-center justify-between gap-1 overflow-hidden"},[(function (){var attrs120598 = ((db_based_QMARK_)?((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(view_feature_type,new cljs.core.Keyword(null,"query-result","query-result",-833644142)))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.font-medium.opacity-50.text-sm","div.font-medium.opacity-50.text-sm",-355795656),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(function (){var or__5002__auto__ = title_key;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("views.table","default-title","views.table/default-title",577959565);
}
})(),cljs.core.count(new cljs.core.Keyword(null,"rows","rows",850049680).cljs$core$IFn$_invoke$arity$1(table))], 0))], null):frontend.components.views.views_tab(view_parent,view_entity,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(option,new cljs.core.Keyword(null,"hover?","hover?",-1201331489),hover_QMARK_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"opacity","opacity",397153780),opacity,new cljs.core.Keyword(null,"references?","references?",-487254152),references_QMARK_], 0)))):new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.font-medium.text-sm","div.font-medium.text-sm",619848115),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),(function (){var G__120602 = view_feature_type;
var G__120602__$1 = (((G__120602 instanceof cljs.core.Keyword))?G__120602.fqn:null);
switch (G__120602__$1) {
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
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs120598))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","items-center","gap-2"], null)], null),attrs120598], 0))):{'className':"flex flex-row items-center gap-2"}),((cljs.core.map_QMARK_(attrs120598))?null:[daiquiri.interpreter.interpret(attrs120598)]));
})(),daiquiri.core.create_element("div",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, ["view-actions","flex","items-center","gap-1","transition-opacity","ease-in","duration-300",opacity], null))},[((cljs.core.seq(additional_actions))?daiquiri.core.create_element(daiquiri.core.fragment,null,[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$views$iter__120627(s__120629){
return (new cljs.core.LazySeq(null,(function (){
var s__120629__$1 = s__120629;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__120629__$1);
if(temp__5804__auto__){
var s__120629__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__120629__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__120629__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__120631 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__120630 = (0);
while(true){
if((i__120630 < size__5479__auto__)){
var action = cljs.core._nth(c__5478__auto__,i__120630);
cljs.core.chunk_append(b__120631,((cljs.core.fn_QMARK_(action))?daiquiri.interpreter.interpret((action.cljs$core$IFn$_invoke$arity$1 ? action.cljs$core$IFn$_invoke$arity$1(option) : action.call(null,option))):daiquiri.interpreter.interpret(action)));

var G__122553 = (i__120630 + (1));
i__120630 = G__122553;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__120631),frontend$components$views$iter__120627(cljs.core.chunk_rest(s__120629__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__120631),null);
}
} else {
var action = cljs.core.first(s__120629__$2);
return cljs.core.cons(((cljs.core.fn_QMARK_(action))?daiquiri.interpreter.interpret((action.cljs$core$IFn$_invoke$arity$1 ? action.cljs$core$IFn$_invoke$arity$1(option) : action.call(null,option))):daiquiri.interpreter.interpret(action)),frontend$components$views$iter__120627(cljs.core.rest(s__120629__$2)));
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
frontend.components.views.view_inner = rum.core.lazy_build(rum.core.build_defc,(function (view_entity,p__120666,_STAR_scroller_ref){
var map__120667 = p__120666;
var map__120667__$1 = cljs.core.__destructure_map(map__120667);
var option_STAR_ = map__120667__$1;
var input = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120667__$1,new cljs.core.Keyword(null,"input","input",556931961));
var view_parent = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120667__$1,new cljs.core.Keyword(null,"view-parent","view-parent",675596601));
var sorting = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120667__$1,new cljs.core.Keyword(null,"sorting","sorting",622249690));
var data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120667__$1,new cljs.core.Keyword(null,"data","data",-232669377));
var full_data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120667__$1,new cljs.core.Keyword(null,"full-data","full-data",-1430830367));
var group_by_property_ident = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120667__$1,new cljs.core.Keyword(null,"group-by-property-ident","group-by-property-ident",1221613316));
var set_filters_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120667__$1,new cljs.core.Keyword(null,"set-filters!","set-filters!",385623142));
var filters = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120667__$1,new cljs.core.Keyword(null,"filters","filters",974726919));
var set_sorting_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120667__$1,new cljs.core.Keyword(null,"set-sorting!","set-sorting!",543042376));
var columns = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120667__$1,new cljs.core.Keyword(null,"columns","columns",1998437288));
var add_new_object_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120667__$1,new cljs.core.Keyword(null,"add-new-object!","add-new-object!",622560106));
var set_data_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120667__$1,new cljs.core.Keyword(null,"set-data!","set-data!",150955183));
var foldable_options = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120667__$1,new cljs.core.Keyword(null,"foldable-options","foldable-options",1611436976));
var set_input_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120667__$1,new cljs.core.Keyword(null,"set-input!","set-input!",-615513292));
var display_type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120667__$1,new cljs.core.Keyword(null,"display-type","display-type",-749971179));
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
var vec__120671 = rum.core.use_state(default_visible_columns);
var visible_columns = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120671,(0),null);
var set_visible_columns_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120671,(1),null);
var ordered_columns = cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"select","select",1147833503)], null),new cljs.core.Keyword("logseq.property.table","ordered-columns","logseq.property.table/ordered-columns",1485587100).cljs$core$IFn$_invoke$arity$1(view_entity)));
var sized_columns = new cljs.core.Keyword("logseq.property.table","sized-columns","logseq.property.table/sized-columns",-1675510555).cljs$core$IFn$_invoke$arity$1(view_entity);
var vec__120674 = rum.core.use_state(ordered_columns);
var ordered_columns__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120674,(0),null);
var set_ordered_columns_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120674,(1),null);
var vec__120677 = rum.core.use_state(sized_columns);
var sized_columns__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120677,(0),null);
var set_sized_columns_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120677,(1),null);
var map__120680 = frontend.components.views.db_set_table_state_BANG_(view_entity,new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"set-sorting!","set-sorting!",543042376),set_sorting_BANG_,new cljs.core.Keyword(null,"set-filters!","set-filters!",385623142),set_filters_BANG_,new cljs.core.Keyword(null,"set-visible-columns!","set-visible-columns!",729806223),set_visible_columns_BANG_,new cljs.core.Keyword(null,"set-sized-columns!","set-sized-columns!",899502581),set_sized_columns_BANG_,new cljs.core.Keyword(null,"set-ordered-columns!","set-ordered-columns!",-315299263),set_ordered_columns_BANG_], null));
var map__120680__$1 = cljs.core.__destructure_map(map__120680);
var set_sorting_BANG___$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120680__$1,new cljs.core.Keyword(null,"set-sorting!","set-sorting!",543042376));
var set_filters_BANG___$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120680__$1,new cljs.core.Keyword(null,"set-filters!","set-filters!",385623142));
var set_visible_columns_BANG___$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120680__$1,new cljs.core.Keyword(null,"set-visible-columns!","set-visible-columns!",729806223));
var set_ordered_columns_BANG___$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120680__$1,new cljs.core.Keyword(null,"set-ordered-columns!","set-ordered-columns!",-315299263));
var set_sized_columns_BANG___$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120680__$1,new cljs.core.Keyword(null,"set-sized-columns!","set-sized-columns!",899502581));
var vec__120681 = rum.core.use_state(cljs.core.PersistentArrayMap.EMPTY);
var row_selection = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120681,(0),null);
var set_row_selection_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120681,(1),null);
var vec__120684 = rum.core.use_state(null);
var last_selected_idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120684,(0),null);
var set_last_selected_idx_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120684,(1),null);
var columns__$1 = frontend.components.views.sort_columns(columns,ordered_columns__$1);
var select_QMARK_ = cljs.core.first(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (item){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item),new cljs.core.Keyword(null,"select","select",1147833503));
}),columns__$1));
var id_QMARK_ = cljs.core.first(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (item){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item),new cljs.core.Keyword(null,"id","id",-1388402092));
}),columns__$1));
var pinned_properties = cljs.core.set((function (){var G__120703 = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword("logseq.property.table","pinned-columns","logseq.property.table/pinned-columns",267375138).cljs$core$IFn$_invoke$arity$1(view_entity));
var G__120703__$1 = (cljs.core.truth_(id_QMARK_)?cljs.core.cons(new cljs.core.Keyword(null,"id","id",-1388402092),G__120703):G__120703);
if(cljs.core.truth_(select_QMARK_)){
return cljs.core.cons(new cljs.core.Keyword(null,"select","select",1147833503),G__120703__$1);
} else {
return G__120703__$1;
}
})());
var map__120687 = cljs.core.group_by((function (item){
return cljs.core.contains_QMARK_(pinned_properties,new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item));
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (column){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(visible_columns,new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column)) === false;
}),columns__$1));
var map__120687__$1 = cljs.core.__destructure_map(map__120687);
var pinned = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120687__$1,true);
var unpinned = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120687__$1,false);
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
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-col.border-t.pt-2.gap-2","div.flex.flex-col.border-t.pt-2.gap-2",-1423751738),cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2((function (idx,p__120762){
var vec__120765 = p__120762;
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120765,(0),null);
var group = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120765,(1),null);
var add_new_object_BANG___$1 = ((cljs.core.fn_QMARK_(add_new_object_BANG_))?(function (_){
var G__120773 = view_entity;
var G__120774 = table;
var G__120775 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"properties","properties",685819552),cljs.core.PersistentArrayMap.createAsIfByAssoc([new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(group_by_property),(function (){var or__5002__auto__ = (function (){var and__5000__auto__ = cljs.core.map_QMARK_(value);
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
return (add_new_object_BANG_.cljs$core$IFn$_invoke$arity$3 ? add_new_object_BANG_.cljs$core$IFn$_invoke$arity$3(G__120773,G__120774,G__120775) : add_new_object_BANG_.call(null,G__120773,G__120774,G__120775));
}):null);
var table_SINGLEQUOTE_ = (function (){var G__120784 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc_in(table_map,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"data-fns","data-fns",-1065218324),new cljs.core.Keyword(null,"add-new-object!","add-new-object!",622560106)], null),add_new_object_BANG___$1),new cljs.core.Keyword(null,"data","data",-232669377),group);
return (logseq.shui.ui.table_option.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.table_option.cljs$core$IFn$_invoke$arity$1(G__120784) : logseq.shui.ui.table_option.call(null,G__120784));
})();
var readable_property_value = (function (p1__120658_SHARP_){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.map_QMARK_(p1__120658_SHARP_);
if(and__5000__auto__){
var or__5002__auto__ = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(p1__120658_SHARP_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("logseq.property","value","logseq.property/value",1396524865).cljs$core$IFn$_invoke$arity$1(p1__120658_SHARP_);
}
} else {
return and__5000__auto__;
}
})())){
return logseq.db.frontend.property.property_value_content(p1__120658_SHARP_);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(p1__120658_SHARP_),new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837))){
return "Empty";
} else {
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__120658_SHARP_);

}
}
});
var group_by_page_QMARK_ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","page","block/page",822314108),group_by_property_ident)) || (((cljs.core.not(db_based_QMARK_)) && (cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"linked-references","linked-references",-2117592379),null,new cljs.core.Keyword(null,"unlinked-references","unlinked-references",1918870007),null], null), null),display_type)))));
return rum.core.with_key(frontend.ui.foldable(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),((list_view_QMARK_)?null:"my-4")], null),((group_by_page_QMARK_)?(cljs.core.truth_(value)?(function (){var c = frontend.state.get_component(new cljs.core.Keyword("block","page-cp","block/page-cp",975876274));
var G__120791 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"disable-preview?","disable-preview?",1485814365),true], null);
var G__120792 = value;
return (c.cljs$core$IFn$_invoke$arity$2 ? c.cljs$core$IFn$_invoke$arity$2(G__120791,G__120792) : c.call(null,G__120791,G__120792));
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
return rum.core.with_key(frontend.components.views.view_inner(view_entity,(function (){var G__120806 = option;
if(cljs.core.truth_((function (){var or__5002__auto__ = frontend.config.publishing_QMARK_;
if(or__5002__auto__){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("logseq.property.view","group-by-property","logseq.property.view/group-by-property",809216236).cljs$core$IFn$_invoke$arity$1(view_entity);
}
})())){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(G__120806,new cljs.core.Keyword(null,"add-new-object!","add-new-object!",622560106));
} else {
return G__120806;
}
})(),new cljs.core.Keyword("frontend.components.views","scroller-ref","frontend.components.views/scroller-ref",-1179817487).cljs$core$IFn$_invoke$arity$1(state)),["view-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_entity))].join(''));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.views","scroller-ref","frontend.components.views/scroller-ref",-1179817487))], null),"frontend.components.views/view-container");
frontend.components.views._LT_load_view_data = (function frontend$components$views$_LT_load_view_data(view,opts){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","get-view-data","thread-api/get-view-data",1976013429),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view),opts], 0));
});
frontend.components.views.view_aux = rum.core.lazy_build(rum.core.build_defc,(function (view_entity,p__120808){
var map__120809 = p__120808;
var map__120809__$1 = cljs.core.__destructure_map(map__120809);
var option = map__120809__$1;
var view_parent = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120809__$1,new cljs.core.Keyword(null,"view-parent","view-parent",675596601));
var view_feature_type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120809__$1,new cljs.core.Keyword(null,"view-feature-type","view-feature-type",-945869610));
var data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120809__$1,new cljs.core.Keyword(null,"data","data",-232669377));
var query_entity_ids = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120809__$1,new cljs.core.Keyword(null,"query-entity-ids","query-entity-ids",2135324416));
var set_view_entity_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120809__$1,new cljs.core.Keyword(null,"set-view-entity!","set-view-entity!",-69891185));
var vec__120811 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1("") : logseq.shui.hooks.use_state.call(null,""));
var input = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120811,(0),null);
var set_input_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120811,(1),null);
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
var vec__120814 = rum.core.use_state(sorting);
var sorting__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120814,(0),null);
var set_sorting_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120814,(1),null);
var view_filters = new cljs.core.Keyword("logseq.property.table","filters","logseq.property.table/filters",-1702393633).cljs$core$IFn$_invoke$arity$1(view_entity);
var vec__120817 = rum.core.use_state((function (){var or__5002__auto__ = view_filters;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentArrayMap.EMPTY;
}
})());
var filters = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120817,(0),null);
var set_filters_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120817,(1),null);
var query_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(view_feature_type,new cljs.core.Keyword(null,"query-result","query-result",-833644142));
var vec__120820 = (function (){var G__120837 = (!(query_QMARK_));
return (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(G__120837) : logseq.shui.hooks.use_state.call(null,G__120837));
})();
var loading_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120820,(0),null);
var set_loading_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120820,(1),null);
var vec__120823 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(data) : logseq.shui.hooks.use_state.call(null,data));
var data__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120823,(0),null);
var set_data_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120823,(1),null);
var vec__120826 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_state.call(null,null));
var ref_pages_count = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120826,(0),null);
var set_ref_pages_count_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120826,(1),null);
var load_view_data = (function frontend$components$views$load_view_data(){
return frontend.common.missionary.run_task_STAR_(cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr120844_block_42 = (function frontend$components$views$load_view_data_$_cr120844_block_42(cr120844_state){
try{var cr120844_place_123 = set_data_BANG_;
var cr120844_place_124 = null;
var cr120844_place_125 = (function (){var G__121363 = cr120844_place_124;
var fexpr__121362 = cr120844_place_123;
return (fexpr__121362.cljs$core$IFn$_invoke$arity$1 ? fexpr__121362.cljs$core$IFn$_invoke$arity$1(G__121363) : fexpr__121362.call(null,G__121363));
})();
(cr120844_state[(0)] = cr120844_block_43);

(cr120844_state[(1)] = cr120844_place_125);

return cr120844_state;
}catch (e121361){var cr120844_exception = e121361;
(cr120844_state[(0)] = null);

(cr120844_state[(1)] = null);

throw cr120844_exception;
}});
var cr120844_block_13 = (function frontend$components$views$load_view_data_$_cr120844_block_13(cr120844_state){
try{var cr120844_place_29 = query_QMARK_;
var cr120844_place_30 = cljs.core.not;
var cr120844_place_31 = sorting__$1;
var cr120844_place_32 = cr120844_place_31;
var cr120844_place_33 = null;
if(cljs.core.truth_(cr120844_place_32)){
(cr120844_state[(0)] = cr120844_block_15);

(cr120844_state[(3)] = cr120844_place_29);

(cr120844_state[(5)] = cr120844_place_30);

(cr120844_state[(6)] = cr120844_place_31);

(cr120844_state[(4)] = cr120844_place_33);

return cr120844_state;
} else {
(cr120844_state[(0)] = cr120844_block_14);

(cr120844_state[(3)] = cr120844_place_29);

(cr120844_state[(5)] = cr120844_place_30);

(cr120844_state[(4)] = cr120844_place_33);

return cr120844_state;
}
}catch (e121364){var cr120844_exception = e121364;
(cr120844_state[(0)] = null);

(cr120844_state[(1)] = null);

(cr120844_state[(2)] = null);

throw cr120844_exception;
}});
var cr120844_block_4 = (function frontend$components$views$load_view_data_$_cr120844_block_4(cr120844_state){
try{var cr120844_place_10 = sorting__$1;
var cr120844_place_11 = cr120844_place_10;
var cr120844_place_12 = null;
if(cljs.core.truth_(cr120844_place_11)){
(cr120844_state[(0)] = cr120844_block_9);

(cr120844_state[(4)] = cr120844_place_10);

(cr120844_state[(3)] = cr120844_place_12);

return cr120844_state;
} else {
(cr120844_state[(0)] = cr120844_block_5);

(cr120844_state[(3)] = cr120844_place_12);

return cr120844_state;
}
}catch (e121367){var cr120844_exception = e121367;
(cr120844_state[(0)] = null);

(cr120844_state[(1)] = null);

(cr120844_state[(2)] = null);

throw cr120844_exception;
}});
var cr120844_block_34 = (function frontend$components$views$load_view_data_$_cr120844_block_34(cr120844_state){
try{var cr120844_place_104 = (cr120844_state[(8)]);
var cr120844_place_111 = set_ref_pages_count_BANG_;
var cr120844_place_112 = cr120844_place_104;
var cr120844_place_113 = (function (){var G__121372 = cr120844_place_112;
var fexpr__121371 = cr120844_place_111;
return (fexpr__121371.cljs$core$IFn$_invoke$arity$1 ? fexpr__121371.cljs$core$IFn$_invoke$arity$1(G__121372) : fexpr__121371.call(null,G__121372));
})();
(cr120844_state[(0)] = cr120844_block_35);

(cr120844_state[(8)] = null);

(cr120844_state[(7)] = cr120844_place_113);

return cr120844_state;
}catch (e121368){var cr120844_exception = e121368;
(cr120844_state[(0)] = cr120844_block_36);

(cr120844_state[(8)] = null);

(cr120844_state[(7)] = null);

(cr120844_state[(6)] = cr120844_exception);

return cr120844_state;
}});
var cr120844_block_36 = (function frontend$components$views$load_view_data_$_cr120844_block_36(cr120844_state){
try{var cr120844_place_55 = (cr120844_state[(6)]);
var cr120844_place_114 = cr120844_place_55;
var cr120844_place_115 = (function(){throw cr120844_place_114})();
(cr120844_state[(0)] = null);

(cr120844_state[(2)] = null);

(cr120844_state[(1)] = null);

(cr120844_state[(3)] = null);

(cr120844_state[(4)] = null);

(cr120844_state[(5)] = null);

(cr120844_state[(6)] = null);

return null;
}catch (e121374){var cr120844_exception = e121374;
(cr120844_state[(0)] = cr120844_block_37);

(cr120844_state[(5)] = true);

(cr120844_state[(6)] = cr120844_exception);

return cr120844_state;
}});
var cr120844_block_32 = (function frontend$components$views$load_view_data_$_cr120844_block_32(cr120844_state){
try{var cr120844_place_93 = missionary.core.unpark();
var cr120844_place_94 = cljs.core.__destructure_map;
var cr120844_place_95 = cr120844_place_93;
var cr120844_place_96 = (function (){var G__121384 = cr120844_place_95;
var fexpr__121383 = cr120844_place_94;
return (fexpr__121383.cljs$core$IFn$_invoke$arity$1 ? fexpr__121383.cljs$core$IFn$_invoke$arity$1(G__121384) : fexpr__121383.call(null,G__121384));
})();
var cr120844_place_97 = cljs.core.get;
var cr120844_place_98 = cr120844_place_96;
var cr120844_place_99 = new cljs.core.Keyword(null,"data","data",-232669377);
var cr120844_place_100 = (function (){var G__121386 = cr120844_place_98;
var G__121387 = cr120844_place_99;
var fexpr__121385 = cr120844_place_97;
return (fexpr__121385.cljs$core$IFn$_invoke$arity$2 ? fexpr__121385.cljs$core$IFn$_invoke$arity$2(G__121386,G__121387) : fexpr__121385.call(null,G__121386,G__121387));
})();
var cr120844_place_101 = cljs.core.get;
var cr120844_place_102 = cr120844_place_96;
var cr120844_place_103 = new cljs.core.Keyword(null,"ref-pages-count","ref-pages-count",-74477634);
var cr120844_place_104 = (function (){var G__121390 = cr120844_place_102;
var G__121391 = cr120844_place_103;
var fexpr__121389 = cr120844_place_101;
return (fexpr__121389.cljs$core$IFn$_invoke$arity$2 ? fexpr__121389.cljs$core$IFn$_invoke$arity$2(G__121390,G__121391) : fexpr__121389.call(null,G__121390,G__121391));
})();
var cr120844_place_105 = set_data_BANG_;
var cr120844_place_106 = cr120844_place_100;
var cr120844_place_107 = (function (){var G__121394 = cr120844_place_106;
var fexpr__121393 = cr120844_place_105;
return (fexpr__121393.cljs$core$IFn$_invoke$arity$1 ? fexpr__121393.cljs$core$IFn$_invoke$arity$1(G__121394) : fexpr__121393.call(null,G__121394));
})();
var cr120844_place_108 = cr120844_place_104;
var cr120844_place_109 = null;
if(cljs.core.truth_(cr120844_place_108)){
(cr120844_state[(0)] = cr120844_block_34);

(cr120844_state[(8)] = cr120844_place_104);

(cr120844_state[(7)] = cr120844_place_109);

return cr120844_state;
} else {
(cr120844_state[(0)] = cr120844_block_33);

(cr120844_state[(7)] = cr120844_place_109);

return cr120844_state;
}
}catch (e121380){var cr120844_exception = e121380;
(cr120844_state[(0)] = cr120844_block_36);

(cr120844_state[(6)] = cr120844_exception);

return cr120844_state;
}});
var cr120844_block_16 = (function frontend$components$views$load_view_data_$_cr120844_block_16(cr120844_state){
try{var cr120844_place_29 = (cr120844_state[(3)]);
var cr120844_place_33 = (cr120844_state[(4)]);
var cr120844_place_30 = (cr120844_state[(5)]);
var cr120844_place_36 = (function (){var G__121404 = cr120844_place_33;
var fexpr__121403 = cr120844_place_30;
return (fexpr__121403.cljs$core$IFn$_invoke$arity$1 ? fexpr__121403.cljs$core$IFn$_invoke$arity$1(G__121404) : fexpr__121403.call(null,G__121404));
})();
var cr120844_place_37 = clojure.string.blank_QMARK_;
var cr120844_place_38 = input;
var cr120844_place_39 = (function (){var G__121406 = cr120844_place_38;
var fexpr__121405 = cr120844_place_37;
return (fexpr__121405.cljs$core$IFn$_invoke$arity$1 ? fexpr__121405.cljs$core$IFn$_invoke$arity$1(G__121406) : fexpr__121405.call(null,G__121406));
})();
var cr120844_place_40 = ((cr120844_place_36) && (cr120844_place_39));
var cr120844_place_41 = ((cr120844_place_29) && (cr120844_place_40));
var cr120844_place_42 = null;
if(cr120844_place_41){
(cr120844_state[(0)] = cr120844_block_40);

(cr120844_state[(3)] = null);

(cr120844_state[(4)] = null);

(cr120844_state[(2)] = null);

(cr120844_state[(5)] = null);

(cr120844_state[(3)] = cr120844_place_42);

return cr120844_state;
} else {
(cr120844_state[(0)] = cr120844_block_17);

(cr120844_state[(3)] = null);

(cr120844_state[(4)] = null);

(cr120844_state[(5)] = null);

(cr120844_state[(3)] = cr120844_place_42);

return cr120844_state;
}
}catch (e121399){var cr120844_exception = e121399;
(cr120844_state[(0)] = null);

(cr120844_state[(3)] = null);

(cr120844_state[(1)] = null);

(cr120844_state[(4)] = null);

(cr120844_state[(2)] = null);

(cr120844_state[(5)] = null);

throw cr120844_exception;
}});
var cr120844_block_21 = (function frontend$components$views$load_view_data_$_cr120844_block_21(cr120844_state){
try{var cr120844_place_48 = (cr120844_state[(2)]);
var cr120844_place_52 = cr120844_place_48;
(cr120844_state[(0)] = cr120844_block_22);

(cr120844_state[(2)] = null);

(cr120844_state[(5)] = cr120844_place_52);

return cr120844_state;
}catch (e121407){var cr120844_exception = e121407;
(cr120844_state[(0)] = null);

(cr120844_state[(1)] = null);

(cr120844_state[(5)] = null);

(cr120844_state[(3)] = null);

(cr120844_state[(4)] = null);

(cr120844_state[(2)] = null);

throw cr120844_exception;
}});
var cr120844_block_11 = (function frontend$components$views$load_view_data_$_cr120844_block_11(cr120844_state){
try{var cr120844_place_8 = (cr120844_state[(1)]);
(cr120844_state[(0)] = cr120844_block_12);

(cr120844_state[(1)] = null);

(cr120844_state[(2)] = cr120844_place_8);

return cr120844_state;
}catch (e121408){var cr120844_exception = e121408;
(cr120844_state[(0)] = null);

(cr120844_state[(1)] = null);

(cr120844_state[(2)] = null);

throw cr120844_exception;
}});
var cr120844_block_26 = (function frontend$components$views$load_view_data_$_cr120844_block_26(cr120844_state){
try{var cr120844_place_68 = new cljs.core.Keyword("db","id","db/id",-1388397098);
var cr120844_place_69 = view_parent;
var cr120844_place_70 = cr120844_place_68.cljs$core$IFn$_invoke$arity$1(cr120844_place_69);
(cr120844_state[(0)] = cr120844_block_28);

(cr120844_state[(9)] = cr120844_place_70);

return cr120844_state;
}catch (e121409){var cr120844_exception = e121409;
(cr120844_state[(0)] = cr120844_block_36);

(cr120844_state[(7)] = null);

(cr120844_state[(8)] = null);

(cr120844_state[(9)] = null);

(cr120844_state[(10)] = null);

(cr120844_state[(11)] = null);

(cr120844_state[(6)] = cr120844_exception);

return cr120844_state;
}});
var cr120844_block_33 = (function frontend$components$views$load_view_data_$_cr120844_block_33(cr120844_state){
try{var cr120844_place_110 = null;
(cr120844_state[(0)] = cr120844_block_35);

(cr120844_state[(7)] = cr120844_place_110);

return cr120844_state;
}catch (e121410){var cr120844_exception = e121410;
(cr120844_state[(0)] = cr120844_block_36);

(cr120844_state[(7)] = null);

(cr120844_state[(6)] = cr120844_exception);

return cr120844_state;
}});
var cr120844_block_29 = (function frontend$components$views$load_view_data_$_cr120844_block_29(cr120844_state){
try{var cr120844_place_82 = (cr120844_state[(11)]);
var cr120844_place_85 = cr120844_place_82;
(cr120844_state[(0)] = cr120844_block_31);

(cr120844_state[(11)] = null);

(cr120844_state[(9)] = cr120844_place_85);

return cr120844_state;
}catch (e121413){var cr120844_exception = e121413;
(cr120844_state[(0)] = cr120844_block_36);

(cr120844_state[(7)] = null);

(cr120844_state[(8)] = null);

(cr120844_state[(10)] = null);

(cr120844_state[(9)] = null);

(cr120844_state[(11)] = null);

(cr120844_state[(6)] = cr120844_exception);

return cr120844_state;
}});
var cr120844_block_37 = (function frontend$components$views$load_view_data_$_cr120844_block_37(cr120844_state){
try{var cr120844_place_56 = (cr120844_state[(5)]);
var cr120844_place_55 = (cr120844_state[(6)]);
var cr120844_place_116 = set_loading_BANG_;
var cr120844_place_117 = false;
var cr120844_place_118 = (function (){var G__121422 = cr120844_place_117;
var fexpr__121421 = cr120844_place_116;
return (fexpr__121421.cljs$core$IFn$_invoke$arity$1 ? fexpr__121421.cljs$core$IFn$_invoke$arity$1(G__121422) : fexpr__121421.call(null,G__121422));
})();
var cr120844_place_119 = (cljs.core.truth_(cr120844_place_56)?(function(){throw cr120844_place_55})():cr120844_place_55);
(cr120844_state[(0)] = cr120844_block_38);

(cr120844_state[(5)] = null);

(cr120844_state[(6)] = null);

(cr120844_state[(2)] = cr120844_place_119);

return cr120844_state;
}catch (e121417){var cr120844_exception = e121417;
(cr120844_state[(0)] = null);

(cr120844_state[(2)] = null);

(cr120844_state[(1)] = null);

(cr120844_state[(3)] = null);

(cr120844_state[(4)] = null);

(cr120844_state[(5)] = null);

(cr120844_state[(6)] = null);

throw cr120844_exception;
}});
var cr120844_block_38 = (function frontend$components$views$load_view_data_$_cr120844_block_38(cr120844_state){
try{var cr120844_place_53 = (cr120844_state[(2)]);
(cr120844_state[(0)] = cr120844_block_39);

(cr120844_state[(2)] = null);

(cr120844_state[(4)] = cr120844_place_53);

return cr120844_state;
}catch (e121427){var cr120844_exception = e121427;
(cr120844_state[(0)] = null);

(cr120844_state[(2)] = null);

(cr120844_state[(1)] = null);

(cr120844_state[(3)] = null);

(cr120844_state[(4)] = null);

throw cr120844_exception;
}});
var cr120844_block_5 = (function frontend$components$views$load_view_data_$_cr120844_block_5(cr120844_state){
try{var cr120844_place_13 = filters;
var cr120844_place_14 = cr120844_place_13;
var cr120844_place_15 = null;
if(cljs.core.truth_(cr120844_place_14)){
(cr120844_state[(0)] = cr120844_block_7);

(cr120844_state[(5)] = cr120844_place_13);

(cr120844_state[(4)] = cr120844_place_15);

return cr120844_state;
} else {
(cr120844_state[(0)] = cr120844_block_6);

(cr120844_state[(4)] = cr120844_place_15);

return cr120844_state;
}
}catch (e121432){var cr120844_exception = e121432;
(cr120844_state[(0)] = null);

(cr120844_state[(1)] = null);

(cr120844_state[(2)] = null);

(cr120844_state[(3)] = null);

throw cr120844_exception;
}});
var cr120844_block_7 = (function frontend$components$views$load_view_data_$_cr120844_block_7(cr120844_state){
try{var cr120844_place_13 = (cr120844_state[(5)]);
var cr120844_place_21 = cr120844_place_13;
(cr120844_state[(0)] = cr120844_block_8);

(cr120844_state[(5)] = null);

(cr120844_state[(4)] = cr120844_place_21);

return cr120844_state;
}catch (e121436){var cr120844_exception = e121436;
(cr120844_state[(0)] = null);

(cr120844_state[(1)] = null);

(cr120844_state[(4)] = null);

(cr120844_state[(5)] = null);

(cr120844_state[(2)] = null);

(cr120844_state[(3)] = null);

throw cr120844_exception;
}});
var cr120844_block_35 = (function frontend$components$views$load_view_data_$_cr120844_block_35(cr120844_state){
try{var cr120844_place_109 = (cr120844_state[(7)]);
(cr120844_state[(0)] = cr120844_block_37);

(cr120844_state[(7)] = null);

(cr120844_state[(6)] = cr120844_place_109);

return cr120844_state;
}catch (e121450){var cr120844_exception = e121450;
(cr120844_state[(0)] = cr120844_block_36);

(cr120844_state[(7)] = null);

(cr120844_state[(6)] = cr120844_exception);

return cr120844_state;
}});
var cr120844_block_6 = (function frontend$components$views$load_view_data_$_cr120844_block_6(cr120844_state){
try{var cr120844_place_16 = cljs.core.not;
var cr120844_place_17 = clojure.string.blank_QMARK_;
var cr120844_place_18 = input;
var cr120844_place_19 = (function (){var G__121458 = cr120844_place_18;
var fexpr__121457 = cr120844_place_17;
return (fexpr__121457.cljs$core$IFn$_invoke$arity$1 ? fexpr__121457.cljs$core$IFn$_invoke$arity$1(G__121458) : fexpr__121457.call(null,G__121458));
})();
var cr120844_place_20 = (function (){var G__121462 = cr120844_place_19;
var fexpr__121461 = cr120844_place_16;
return (fexpr__121461.cljs$core$IFn$_invoke$arity$1 ? fexpr__121461.cljs$core$IFn$_invoke$arity$1(G__121462) : fexpr__121461.call(null,G__121462));
})();
(cr120844_state[(0)] = cr120844_block_8);

(cr120844_state[(4)] = cr120844_place_20);

return cr120844_state;
}catch (e121452){var cr120844_exception = e121452;
(cr120844_state[(0)] = null);

(cr120844_state[(1)] = null);

(cr120844_state[(4)] = null);

(cr120844_state[(2)] = null);

(cr120844_state[(3)] = null);

throw cr120844_exception;
}});
var cr120844_block_40 = (function frontend$components$views$load_view_data_$_cr120844_block_40(cr120844_state){
try{var cr120844_place_120 = set_data_BANG_;
var cr120844_place_121 = query_entity_ids;
var cr120844_place_122 = (function (){var G__121469 = cr120844_place_121;
var fexpr__121468 = cr120844_place_120;
return (fexpr__121468.cljs$core$IFn$_invoke$arity$1 ? fexpr__121468.cljs$core$IFn$_invoke$arity$1(G__121469) : fexpr__121468.call(null,G__121469));
})();
(cr120844_state[(0)] = cr120844_block_41);

(cr120844_state[(3)] = cr120844_place_122);

return cr120844_state;
}catch (e121463){var cr120844_exception = e121463;
(cr120844_state[(0)] = null);

(cr120844_state[(1)] = null);

(cr120844_state[(3)] = null);

throw cr120844_exception;
}});
var cr120844_block_27 = (function frontend$components$views$load_view_data_$_cr120844_block_27(cr120844_state){
try{var cr120844_place_65 = (cr120844_state[(12)]);
var cr120844_place_71 = cr120844_place_65;
(cr120844_state[(0)] = cr120844_block_28);

(cr120844_state[(12)] = null);

(cr120844_state[(9)] = cr120844_place_71);

return cr120844_state;
}catch (e121470){var cr120844_exception = e121470;
(cr120844_state[(0)] = cr120844_block_36);

(cr120844_state[(12)] = null);

(cr120844_state[(7)] = null);

(cr120844_state[(8)] = null);

(cr120844_state[(9)] = null);

(cr120844_state[(10)] = null);

(cr120844_state[(11)] = null);

(cr120844_state[(6)] = cr120844_exception);

return cr120844_state;
}});
var cr120844_block_31 = (function frontend$components$views$load_view_data_$_cr120844_block_31(cr120844_state){
try{var cr120844_place_57 = (cr120844_state[(7)]);
var cr120844_place_59 = (cr120844_state[(8)]);
var cr120844_place_58 = (cr120844_state[(10)]);
var cr120844_place_84 = (cr120844_state[(9)]);
var cr120844_place_91 = (function (){var G__121474 = cr120844_place_59;
var G__121475 = cr120844_place_84;
var fexpr__121473 = cr120844_place_58;
return (fexpr__121473.cljs$core$IFn$_invoke$arity$2 ? fexpr__121473.cljs$core$IFn$_invoke$arity$2(G__121474,G__121475) : fexpr__121473.call(null,G__121474,G__121475));
})();
var cr120844_place_92 = (function (){var G__121477 = cr120844_place_91;
var fexpr__121476 = cr120844_place_57;
return (fexpr__121476.cljs$core$IFn$_invoke$arity$1 ? fexpr__121476.cljs$core$IFn$_invoke$arity$1(G__121477) : fexpr__121476.call(null,G__121477));
})();
(cr120844_state[(0)] = cr120844_block_32);

(cr120844_state[(7)] = null);

(cr120844_state[(8)] = null);

(cr120844_state[(10)] = null);

(cr120844_state[(9)] = null);

return missionary.core.park(cr120844_place_92);
}catch (e121471){var cr120844_exception = e121471;
(cr120844_state[(0)] = cr120844_block_36);

(cr120844_state[(7)] = null);

(cr120844_state[(8)] = null);

(cr120844_state[(10)] = null);

(cr120844_state[(9)] = null);

(cr120844_state[(6)] = cr120844_exception);

return cr120844_state;
}});
var cr120844_block_15 = (function frontend$components$views$load_view_data_$_cr120844_block_15(cr120844_state){
try{var cr120844_place_31 = (cr120844_state[(6)]);
var cr120844_place_35 = cr120844_place_31;
(cr120844_state[(0)] = cr120844_block_16);

(cr120844_state[(6)] = null);

(cr120844_state[(4)] = cr120844_place_35);

return cr120844_state;
}catch (e121478){var cr120844_exception = e121478;
(cr120844_state[(0)] = null);

(cr120844_state[(3)] = null);

(cr120844_state[(1)] = null);

(cr120844_state[(4)] = null);

(cr120844_state[(6)] = null);

(cr120844_state[(2)] = null);

(cr120844_state[(5)] = null);

throw cr120844_exception;
}});
var cr120844_block_25 = (function frontend$components$views$load_view_data_$_cr120844_block_25(cr120844_state){
try{var cr120844_place_57 = frontend.common.missionary._LT__BANG_;
var cr120844_place_58 = frontend.components.views._LT_load_view_data;
var cr120844_place_59 = view_entity;
var cr120844_place_60 = new cljs.core.Keyword(null,"view-for-id","view-for-id",-450280889);
var cr120844_place_61 = new cljs.core.Keyword("db","id","db/id",-1388397098);
var cr120844_place_62 = new cljs.core.Keyword("logseq.property","view-for","logseq.property/view-for",-36274319);
var cr120844_place_63 = view_entity;
var cr120844_place_64 = cr120844_place_62.cljs$core$IFn$_invoke$arity$1(cr120844_place_63);
var cr120844_place_65 = cr120844_place_61.cljs$core$IFn$_invoke$arity$1(cr120844_place_64);
var cr120844_place_66 = cr120844_place_65;
var cr120844_place_67 = null;
if(cljs.core.truth_(cr120844_place_66)){
(cr120844_state[(0)] = cr120844_block_27);

(cr120844_state[(12)] = cr120844_place_65);

(cr120844_state[(7)] = cr120844_place_57);

(cr120844_state[(8)] = cr120844_place_59);

(cr120844_state[(9)] = cr120844_place_67);

(cr120844_state[(10)] = cr120844_place_58);

(cr120844_state[(11)] = cr120844_place_60);

return cr120844_state;
} else {
(cr120844_state[(0)] = cr120844_block_26);

(cr120844_state[(7)] = cr120844_place_57);

(cr120844_state[(8)] = cr120844_place_59);

(cr120844_state[(9)] = cr120844_place_67);

(cr120844_state[(10)] = cr120844_place_58);

(cr120844_state[(11)] = cr120844_place_60);

return cr120844_state;
}
}catch (e121479){var cr120844_exception = e121479;
(cr120844_state[(0)] = cr120844_block_36);

(cr120844_state[(6)] = cr120844_exception);

return cr120844_state;
}});
var cr120844_block_39 = (function frontend$components$views$load_view_data_$_cr120844_block_39(cr120844_state){
try{var cr120844_place_44 = (cr120844_state[(4)]);
(cr120844_state[(0)] = cr120844_block_41);

(cr120844_state[(4)] = null);

(cr120844_state[(3)] = cr120844_place_44);

return cr120844_state;
}catch (e121482){var cr120844_exception = e121482;
(cr120844_state[(0)] = null);

(cr120844_state[(1)] = null);

(cr120844_state[(3)] = null);

(cr120844_state[(4)] = null);

throw cr120844_exception;
}});
var cr120844_block_8 = (function frontend$components$views$load_view_data_$_cr120844_block_8(cr120844_state){
try{var cr120844_place_15 = (cr120844_state[(4)]);
(cr120844_state[(0)] = cr120844_block_10);

(cr120844_state[(4)] = null);

(cr120844_state[(3)] = cr120844_place_15);

return cr120844_state;
}catch (e121508){var cr120844_exception = e121508;
(cr120844_state[(0)] = null);

(cr120844_state[(1)] = null);

(cr120844_state[(4)] = null);

(cr120844_state[(2)] = null);

(cr120844_state[(3)] = null);

throw cr120844_exception;
}});
var cr120844_block_41 = (function frontend$components$views$load_view_data_$_cr120844_block_41(cr120844_state){
try{var cr120844_place_42 = (cr120844_state[(3)]);
(cr120844_state[(0)] = cr120844_block_43);

(cr120844_state[(3)] = null);

(cr120844_state[(1)] = cr120844_place_42);

return cr120844_state;
}catch (e121509){var cr120844_exception = e121509;
(cr120844_state[(0)] = null);

(cr120844_state[(1)] = null);

(cr120844_state[(3)] = null);

throw cr120844_exception;
}});
var cr120844_block_10 = (function frontend$components$views$load_view_data_$_cr120844_block_10(cr120844_state){
try{var cr120844_place_12 = (cr120844_state[(3)]);
(cr120844_state[(0)] = cr120844_block_11);

(cr120844_state[(3)] = null);

(cr120844_state[(1)] = cr120844_place_12);

return cr120844_state;
}catch (e121510){var cr120844_exception = e121510;
(cr120844_state[(0)] = null);

(cr120844_state[(1)] = null);

(cr120844_state[(2)] = null);

(cr120844_state[(3)] = null);

throw cr120844_exception;
}});
var cr120844_block_0 = (function frontend$components$views$load_view_data_$_cr120844_block_0(cr120844_state){
try{var cr120844_place_0 = query_QMARK_;
var cr120844_place_1 = cr120844_place_0;
var cr120844_place_2 = null;
if(cr120844_place_1){
(cr120844_state[(0)] = cr120844_block_2);

(cr120844_state[(2)] = cr120844_place_2);

return cr120844_state;
} else {
(cr120844_state[(0)] = cr120844_block_1);

(cr120844_state[(1)] = cr120844_place_0);

(cr120844_state[(2)] = cr120844_place_2);

return cr120844_state;
}
}catch (e121523){var cr120844_exception = e121523;
(cr120844_state[(0)] = null);

throw cr120844_exception;
}});
var cr120844_block_14 = (function frontend$components$views$load_view_data_$_cr120844_block_14(cr120844_state){
try{var cr120844_place_34 = filters;
(cr120844_state[(0)] = cr120844_block_16);

(cr120844_state[(4)] = cr120844_place_34);

return cr120844_state;
}catch (e121529){var cr120844_exception = e121529;
(cr120844_state[(0)] = null);

(cr120844_state[(3)] = null);

(cr120844_state[(1)] = null);

(cr120844_state[(4)] = null);

(cr120844_state[(2)] = null);

(cr120844_state[(5)] = null);

throw cr120844_exception;
}});
var cr120844_block_2 = (function frontend$components$views$load_view_data_$_cr120844_block_2(cr120844_state){
try{var cr120844_place_4 = cljs.core.seq;
var cr120844_place_5 = query_entity_ids;
var cr120844_place_6 = (function (){var G__121534 = cr120844_place_5;
var fexpr__121533 = cr120844_place_4;
return (fexpr__121533.cljs$core$IFn$_invoke$arity$1 ? fexpr__121533.cljs$core$IFn$_invoke$arity$1(G__121534) : fexpr__121533.call(null,G__121534));
})();
var cr120844_place_7 = cr120844_place_6;
var cr120844_place_8 = null;
if(cr120844_place_7){
(cr120844_state[(0)] = cr120844_block_4);

(cr120844_state[(1)] = cr120844_place_8);

return cr120844_state;
} else {
(cr120844_state[(0)] = cr120844_block_3);

(cr120844_state[(3)] = cr120844_place_6);

(cr120844_state[(1)] = cr120844_place_8);

return cr120844_state;
}
}catch (e121531){var cr120844_exception = e121531;
(cr120844_state[(0)] = null);

(cr120844_state[(2)] = null);

throw cr120844_exception;
}});
var cr120844_block_12 = (function frontend$components$views$load_view_data_$_cr120844_block_12(cr120844_state){
try{var cr120844_place_2 = (cr120844_state[(2)]);
var cr120844_place_23 = query_QMARK_;
var cr120844_place_24 = cljs.core.empty_QMARK_;
var cr120844_place_25 = query_entity_ids;
var cr120844_place_26 = (function (){var G__121541 = cr120844_place_25;
var fexpr__121540 = cr120844_place_24;
return (fexpr__121540.cljs$core$IFn$_invoke$arity$1 ? fexpr__121540.cljs$core$IFn$_invoke$arity$1(G__121541) : fexpr__121540.call(null,G__121541));
})();
var cr120844_place_27 = ((cr120844_place_23) && (cr120844_place_26));
var cr120844_place_28 = null;
if(cr120844_place_27){
(cr120844_state[(0)] = cr120844_block_42);

(cr120844_state[(2)] = null);

(cr120844_state[(1)] = cr120844_place_28);

return cr120844_state;
} else {
(cr120844_state[(0)] = cr120844_block_13);

(cr120844_state[(1)] = cr120844_place_28);

return cr120844_state;
}
}catch (e121538){var cr120844_exception = e121538;
(cr120844_state[(0)] = null);

(cr120844_state[(2)] = null);

throw cr120844_exception;
}});
var cr120844_block_22 = (function frontend$components$views$load_view_data_$_cr120844_block_22(cr120844_state){
try{var cr120844_place_50 = (cr120844_state[(5)]);
var cr120844_place_53 = null;
if(cljs.core.truth_(cr120844_place_50)){
(cr120844_state[(0)] = cr120844_block_24);

(cr120844_state[(5)] = null);

(cr120844_state[(2)] = cr120844_place_53);

return cr120844_state;
} else {
(cr120844_state[(0)] = cr120844_block_23);

(cr120844_state[(5)] = null);

(cr120844_state[(2)] = cr120844_place_53);

return cr120844_state;
}
}catch (e121543){var cr120844_exception = e121543;
(cr120844_state[(0)] = null);

(cr120844_state[(1)] = null);

(cr120844_state[(5)] = null);

(cr120844_state[(3)] = null);

(cr120844_state[(4)] = null);

throw cr120844_exception;
}});
var cr120844_block_20 = (function frontend$components$views$load_view_data_$_cr120844_block_20(cr120844_state){
try{var cr120844_place_2 = (cr120844_state[(2)]);
var cr120844_place_51 = cr120844_place_2;
(cr120844_state[(0)] = cr120844_block_22);

(cr120844_state[(2)] = null);

(cr120844_state[(5)] = cr120844_place_51);

return cr120844_state;
}catch (e121545){var cr120844_exception = e121545;
(cr120844_state[(0)] = null);

(cr120844_state[(1)] = null);

(cr120844_state[(5)] = null);

(cr120844_state[(3)] = null);

(cr120844_state[(4)] = null);

(cr120844_state[(2)] = null);

throw cr120844_exception;
}});
var cr120844_block_28 = (function frontend$components$views$load_view_data_$_cr120844_block_28(cr120844_state){
try{var cr120844_place_67 = (cr120844_state[(9)]);
var cr120844_place_60 = (cr120844_state[(11)]);
var cr120844_place_72 = new cljs.core.Keyword(null,"view-feature-type","view-feature-type",-945869610);
var cr120844_place_73 = view_feature_type;
var cr120844_place_74 = new cljs.core.Keyword(null,"group-by-property-ident","group-by-property-ident",1221613316);
var cr120844_place_75 = group_by_property_ident;
var cr120844_place_76 = new cljs.core.Keyword(null,"input","input",556931961);
var cr120844_place_77 = input;
var cr120844_place_78 = new cljs.core.Keyword(null,"filters","filters",974726919);
var cr120844_place_79 = filters;
var cr120844_place_80 = new cljs.core.Keyword(null,"sorting","sorting",622249690);
var cr120844_place_81 = sorting__$1;
var cr120844_place_82 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr120844_place_76,cr120844_place_77,cr120844_place_80,cr120844_place_81,cr120844_place_60,cr120844_place_67,cr120844_place_78,cr120844_place_79,cr120844_place_72,cr120844_place_73,cr120844_place_74,cr120844_place_75]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr120844_place_83 = query_QMARK_;
var cr120844_place_84 = null;
if(cr120844_place_83){
(cr120844_state[(0)] = cr120844_block_30);

(cr120844_state[(9)] = null);

(cr120844_state[(11)] = null);

(cr120844_state[(9)] = cr120844_place_84);

(cr120844_state[(11)] = cr120844_place_82);

return cr120844_state;
} else {
(cr120844_state[(0)] = cr120844_block_29);

(cr120844_state[(9)] = null);

(cr120844_state[(11)] = null);

(cr120844_state[(9)] = cr120844_place_84);

(cr120844_state[(11)] = cr120844_place_82);

return cr120844_state;
}
}catch (e121547){var cr120844_exception = e121547;
(cr120844_state[(0)] = cr120844_block_36);

(cr120844_state[(7)] = null);

(cr120844_state[(8)] = null);

(cr120844_state[(9)] = null);

(cr120844_state[(10)] = null);

(cr120844_state[(11)] = null);

(cr120844_state[(6)] = cr120844_exception);

return cr120844_state;
}});
var cr120844_block_9 = (function frontend$components$views$load_view_data_$_cr120844_block_9(cr120844_state){
try{var cr120844_place_10 = (cr120844_state[(4)]);
var cr120844_place_22 = cr120844_place_10;
(cr120844_state[(0)] = cr120844_block_10);

(cr120844_state[(4)] = null);

(cr120844_state[(3)] = cr120844_place_22);

return cr120844_state;
}catch (e121552){var cr120844_exception = e121552;
(cr120844_state[(0)] = null);

(cr120844_state[(1)] = null);

(cr120844_state[(2)] = null);

(cr120844_state[(4)] = null);

(cr120844_state[(3)] = null);

throw cr120844_exception;
}});
var cr120844_block_19 = (function frontend$components$views$load_view_data_$_cr120844_block_19(cr120844_state){
try{var cr120844_place_46 = cljs.core.not;
var cr120844_place_47 = query_QMARK_;
var cr120844_place_48 = (function (){var G__121569 = cr120844_place_47;
var fexpr__121568 = cr120844_place_46;
return (fexpr__121568.cljs$core$IFn$_invoke$arity$1 ? fexpr__121568.cljs$core$IFn$_invoke$arity$1(G__121569) : fexpr__121568.call(null,G__121569));
})();
var cr120844_place_49 = cr120844_place_48;
var cr120844_place_50 = null;
if(cr120844_place_49){
(cr120844_state[(0)] = cr120844_block_21);

(cr120844_state[(2)] = null);

(cr120844_state[(2)] = cr120844_place_48);

(cr120844_state[(5)] = cr120844_place_50);

return cr120844_state;
} else {
(cr120844_state[(0)] = cr120844_block_20);

(cr120844_state[(5)] = cr120844_place_50);

return cr120844_state;
}
}catch (e121555){var cr120844_exception = e121555;
(cr120844_state[(0)] = null);

(cr120844_state[(1)] = null);

(cr120844_state[(3)] = null);

(cr120844_state[(4)] = null);

(cr120844_state[(2)] = null);

throw cr120844_exception;
}});
var cr120844_block_18 = (function frontend$components$views$load_view_data_$_cr120844_block_18(cr120844_state){
try{var cr120844_place_45 = null;
(cr120844_state[(0)] = cr120844_block_39);

(cr120844_state[(4)] = cr120844_place_45);

return cr120844_state;
}catch (e121576){var cr120844_exception = e121576;
(cr120844_state[(0)] = null);

(cr120844_state[(1)] = null);

(cr120844_state[(3)] = null);

(cr120844_state[(4)] = null);

throw cr120844_exception;
}});
var cr120844_block_3 = (function frontend$components$views$load_view_data_$_cr120844_block_3(cr120844_state){
try{var cr120844_place_6 = (cr120844_state[(3)]);
var cr120844_place_9 = cr120844_place_6;
(cr120844_state[(0)] = cr120844_block_11);

(cr120844_state[(3)] = null);

(cr120844_state[(1)] = cr120844_place_9);

return cr120844_state;
}catch (e121586){var cr120844_exception = e121586;
(cr120844_state[(0)] = null);

(cr120844_state[(1)] = null);

(cr120844_state[(2)] = null);

(cr120844_state[(3)] = null);

throw cr120844_exception;
}});
var cr120844_block_30 = (function frontend$components$views$load_view_data_$_cr120844_block_30(cr120844_state){
try{var cr120844_place_82 = (cr120844_state[(11)]);
var cr120844_place_86 = cljs.core.assoc;
var cr120844_place_87 = cr120844_place_82;
var cr120844_place_88 = new cljs.core.Keyword(null,"query-entity-ids","query-entity-ids",2135324416);
var cr120844_place_89 = query_entity_ids;
var cr120844_place_90 = (function (){var G__121600 = cr120844_place_87;
var G__121602 = cr120844_place_88;
var G__121603 = cr120844_place_89;
var fexpr__121599 = cr120844_place_86;
return (fexpr__121599.cljs$core$IFn$_invoke$arity$3 ? fexpr__121599.cljs$core$IFn$_invoke$arity$3(G__121600,G__121602,G__121603) : fexpr__121599.call(null,G__121600,G__121602,G__121603));
})();
(cr120844_state[(0)] = cr120844_block_31);

(cr120844_state[(11)] = null);

(cr120844_state[(9)] = cr120844_place_90);

return cr120844_state;
}catch (e121594){var cr120844_exception = e121594;
(cr120844_state[(0)] = cr120844_block_36);

(cr120844_state[(7)] = null);

(cr120844_state[(8)] = null);

(cr120844_state[(10)] = null);

(cr120844_state[(9)] = null);

(cr120844_state[(11)] = null);

(cr120844_state[(6)] = cr120844_exception);

return cr120844_state;
}});
var cr120844_block_17 = (function frontend$components$views$load_view_data_$_cr120844_block_17(cr120844_state){
try{var cr120844_place_43 = new cljs.core.Keyword(null,"else","else",-1508377146);
var cr120844_place_44 = null;
if(cljs.core.truth_(cr120844_place_43)){
(cr120844_state[(0)] = cr120844_block_19);

(cr120844_state[(4)] = cr120844_place_44);

return cr120844_state;
} else {
(cr120844_state[(0)] = cr120844_block_18);

(cr120844_state[(2)] = null);

(cr120844_state[(4)] = cr120844_place_44);

return cr120844_state;
}
}catch (e121609){var cr120844_exception = e121609;
(cr120844_state[(0)] = null);

(cr120844_state[(1)] = null);

(cr120844_state[(3)] = null);

(cr120844_state[(2)] = null);

throw cr120844_exception;
}});
var cr120844_block_43 = (function frontend$components$views$load_view_data_$_cr120844_block_43(cr120844_state){
try{var cr120844_place_28 = (cr120844_state[(1)]);
(cr120844_state[(0)] = null);

(cr120844_state[(1)] = null);

return cr120844_place_28;
}catch (e121614){var cr120844_exception = e121614;
(cr120844_state[(0)] = null);

(cr120844_state[(1)] = null);

throw cr120844_exception;
}});
var cr120844_block_23 = (function frontend$components$views$load_view_data_$_cr120844_block_23(cr120844_state){
try{var cr120844_place_54 = null;
(cr120844_state[(0)] = cr120844_block_38);

(cr120844_state[(2)] = cr120844_place_54);

return cr120844_state;
}catch (e121617){var cr120844_exception = e121617;
(cr120844_state[(0)] = null);

(cr120844_state[(2)] = null);

(cr120844_state[(1)] = null);

(cr120844_state[(3)] = null);

(cr120844_state[(4)] = null);

throw cr120844_exception;
}});
var cr120844_block_24 = (function frontend$components$views$load_view_data_$_cr120844_block_24(cr120844_state){
try{var cr120844_place_55 = null;
var cr120844_place_56 = false;
(cr120844_state[(0)] = cr120844_block_25);

(cr120844_state[(6)] = cr120844_place_55);

(cr120844_state[(5)] = cr120844_place_56);

return cr120844_state;
}catch (e121625){var cr120844_exception = e121625;
(cr120844_state[(0)] = null);

(cr120844_state[(2)] = null);

(cr120844_state[(1)] = null);

(cr120844_state[(3)] = null);

(cr120844_state[(4)] = null);

throw cr120844_exception;
}});
var cr120844_block_1 = (function frontend$components$views$load_view_data_$_cr120844_block_1(cr120844_state){
try{var cr120844_place_0 = (cr120844_state[(1)]);
var cr120844_place_3 = cr120844_place_0;
(cr120844_state[(0)] = cr120844_block_12);

(cr120844_state[(1)] = null);

(cr120844_state[(2)] = cr120844_place_3);

return cr120844_state;
}catch (e121641){var cr120844_exception = e121641;
(cr120844_state[(0)] = null);

(cr120844_state[(1)] = null);

(cr120844_state[(2)] = null);

throw cr120844_exception;
}});
return cloroutine.impl.coroutine((function (){var G__121648 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((13));
(G__121648[(0)] = cr120844_block_0);

return G__121648;
})());
})(),missionary.core.sp_run));
});
var sorting_filters_122593 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"sorting","sorting",622249690),sorting__$1,new cljs.core.Keyword(null,"filters","filters",974726919),filters], null);
logseq.shui.hooks.use_effect_BANG_(load_view_data,new cljs.core.PersistentVector(null, 10, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_entity),logseq.shui.hooks.use_debounced_value(input,(300)),sorting_filters_122593,group_by_property_ident,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property.view","type","logseq.property.view/type",218237607).cljs$core$IFn$_invoke$arity$1(view_entity)),new cljs.core.Keyword("logseq.property.linked-references","includes","logseq.property.linked-references/includes",1680577703).cljs$core$IFn$_invoke$arity$1(view_parent),new cljs.core.Keyword("logseq.property.linked-references","excludes","logseq.property.linked-references/excludes",242675889).cljs$core$IFn$_invoke$arity$1(view_parent),new cljs.core.Keyword(null,"filters","filters",974726919).cljs$core$IFn$_invoke$arity$1(view_parent),query_entity_ids,new cljs.core.Keyword(null,"data-changes-version","data-changes-version",-1524375086).cljs$core$IFn$_invoke$arity$1(option)], null));

if(cljs.core.truth_(loading_QMARK_)){
var attrs121652 = cljs.core.repeat.cljs$core$IFn$_invoke$arity$2((3),(function (){var G__121780 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"h-6 w-full"], null);
return (logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.skeleton.cljs$core$IFn$_invoke$arity$1(G__121780) : logseq.shui.ui.skeleton.call(null,G__121780));
})());
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs121652))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-col","space-2","gap-2","my-2"], null)], null),attrs121652], 0))):{'className':"flex flex-col space-2 gap-2 my-2"}),((cljs.core.map_QMARK_(attrs121652))?null:[daiquiri.interpreter.interpret(attrs121652)]));
} else {
return daiquiri.core.create_element("div",{'className':"flex flex-col gap-2"},[frontend.components.views.view_container(view_entity,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(option,new cljs.core.Keyword(null,"data","data",-232669377),data__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"full-data","full-data",-1430830367),data__$1,new cljs.core.Keyword(null,"filters","filters",974726919),filters,new cljs.core.Keyword(null,"sorting","sorting",622249690),sorting__$1,new cljs.core.Keyword(null,"set-filters!","set-filters!",385623142),set_filters_BANG_,new cljs.core.Keyword(null,"set-sorting!","set-sorting!",543042376),set_sorting_BANG_,new cljs.core.Keyword(null,"set-data!","set-data!",150955183),set_data_BANG_,new cljs.core.Keyword(null,"set-input!","set-input!",-615513292),set_input_BANG_,new cljs.core.Keyword(null,"input","input",556931961),input,new cljs.core.Keyword(null,"items-count","items-count",-135458025),((cljs.core.every_QMARK_(cljs.core.number_QMARK_,data__$1))?cljs.core.count(data__$1):cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (total,p__121803){
var vec__121804 = p__121803;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__121804,(0),null);
var col = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__121804,(1),null);
return (total + cljs.core.count(col));
}),(0),data__$1)),new cljs.core.Keyword(null,"group-by-property-ident","group-by-property-ident",1221613316),group_by_property_ident,new cljs.core.Keyword(null,"ref-pages-count","ref-pages-count",-74477634),ref_pages_count,new cljs.core.Keyword(null,"display-type","display-type",-749971179),display_type,new cljs.core.Keyword(null,"load-view-data","load-view-data",16347011),load_view_data,new cljs.core.Keyword(null,"set-view-entity!","set-view-entity!",-69891185),set_view_entity_BANG_], 0)))]);
}
}),null,"frontend.components.views/view-aux");
frontend.components.views.sub_view_data_changes = (function frontend$components$views$sub_view_data_changes(view_parent,view_feature_type){
if(cljs.core.truth_(view_parent)){
var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
var temp__5804__auto____$1 = (function (){var G__121819 = view_feature_type;
var G__121819__$1 = (((G__121819 instanceof cljs.core.Keyword))?G__121819.fqn:null);
switch (G__121819__$1) {
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
var view = (function (){var or__5002__auto__ = (function (){var G__121826 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_entity);
if((G__121826 == null)){
return null;
} else {
return (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(G__121826) : frontend.db.sub_block.call(null,G__121826));
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return view_entity;
}
})();
var data_changes_version = (function (){var G__121832 = frontend.components.views.sub_view_data_changes(new cljs.core.Keyword(null,"view-parent","view-parent",675596601).cljs$core$IFn$_invoke$arity$1(option),new cljs.core.Keyword(null,"view-feature-type","view-feature-type",-945869610).cljs$core$IFn$_invoke$arity$1(option));
if((G__121832 == null)){
return null;
} else {
return rum.core.react(G__121832);
}
})();
return frontend.components.views.view_aux(view,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(option,new cljs.core.Keyword(null,"data-changes-version","data-changes-version",-1524375086),data_changes_version));
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query], null),"frontend.components.views/sub-view");
frontend.components.views.view = rum.core.lazy_build(rum.core.build_defc,(function (p__121841){
var map__121842 = p__121841;
var map__121842__$1 = cljs.core.__destructure_map(map__121842);
var option = map__121842__$1;
var view_parent = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__121842__$1,new cljs.core.Keyword(null,"view-parent","view-parent",675596601));
var view_feature_type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__121842__$1,new cljs.core.Keyword(null,"view-feature-type","view-feature-type",-945869610));
var view_entity = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__121842__$1,new cljs.core.Keyword(null,"view-entity","view-entity",-1084117808));
var vec__121843 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_state.call(null,null));
var views = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__121843,(0),null);
var set_views_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__121843,(1),null);
var vec__121846 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(view_entity) : logseq.shui.hooks.use_state.call(null,view_entity));
var view_entity__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__121846,(0),null);
var set_view_entity_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__121846,(1),null);
var query_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(view_feature_type,new cljs.core.Keyword(null,"query-result","query-result",-833644142));
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0();
logseq.shui.hooks.use_effect_BANG_((function (){
return frontend.common.missionary.run_task_STAR_(cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr121849_block_22 = (function frontend$components$views$cr121849_block_22(cr121849_state){
try{var cr121849_place_71 = (cr121849_state[(5)]);
(cr121849_state[(0)] = cr121849_block_23);

(cr121849_state[(5)] = null);

(cr121849_state[(4)] = cr121849_place_71);

return cr121849_state;
}catch (e122113){var cr121849_exception = e122113;
(cr121849_state[(0)] = null);

(cr121849_state[(1)] = null);

(cr121849_state[(2)] = null);

(cr121849_state[(5)] = null);

(cr121849_state[(4)] = null);

throw cr121849_exception;
}});
var cr121849_block_26 = (function frontend$components$views$cr121849_block_26(cr121849_state){
try{var cr121849_place_1 = (cr121849_state[(1)]);
(cr121849_state[(0)] = null);

(cr121849_state[(1)] = null);

return cr121849_place_1;
}catch (e122119){var cr121849_exception = e122119;
(cr121849_state[(0)] = null);

(cr121849_state[(1)] = null);

throw cr121849_exception;
}});
var cr121849_block_5 = (function frontend$components$views$cr121849_block_5(cr121849_state){
try{var cr121849_place_12 = null;
(cr121849_state[(0)] = cr121849_block_24);

(cr121849_state[(2)] = cr121849_place_12);

return cr121849_state;
}catch (e122120){var cr121849_exception = e122120;
(cr121849_state[(0)] = null);

(cr121849_state[(1)] = null);

(cr121849_state[(2)] = null);

throw cr121849_exception;
}});
var cr121849_block_14 = (function frontend$components$views$cr121849_block_14(cr121849_state){
try{var cr121849_place_34 = (cr121849_state[(6)]);
var cr121849_place_43 = null;
if(cljs.core.truth_(cr121849_place_34)){
(cr121849_state[(0)] = cr121849_block_16);

(cr121849_state[(6)] = null);

(cr121849_state[(5)] = cr121849_place_43);

return cr121849_state;
} else {
(cr121849_state[(0)] = cr121849_block_15);

(cr121849_state[(3)] = null);

(cr121849_state[(6)] = null);

(cr121849_state[(5)] = cr121849_place_43);

return cr121849_state;
}
}catch (e122124){var cr121849_exception = e122124;
(cr121849_state[(0)] = null);

(cr121849_state[(1)] = null);

(cr121849_state[(3)] = null);

(cr121849_state[(2)] = null);

(cr121849_state[(6)] = null);

(cr121849_state[(4)] = null);

throw cr121849_exception;
}});
var cr121849_block_6 = (function frontend$components$views$cr121849_block_6(cr121849_state){
try{var cr121849_place_3 = (cr121849_state[(3)]);
var cr121849_place_13 = frontend.common.missionary._LT__BANG_;
var cr121849_place_14 = frontend.db.async._LT_get_views;
var cr121849_place_15 = cr121849_place_3;
var cr121849_place_16 = new cljs.core.Keyword("db","id","db/id",-1388397098);
var cr121849_place_17 = view_parent;
var cr121849_place_18 = cr121849_place_16.cljs$core$IFn$_invoke$arity$1(cr121849_place_17);
var cr121849_place_19 = view_feature_type;
var cr121849_place_20 = (function (){var G__122135 = cr121849_place_15;
var G__122136 = cr121849_place_18;
var G__122137 = cr121849_place_19;
var fexpr__122134 = cr121849_place_14;
return (fexpr__122134.cljs$core$IFn$_invoke$arity$3 ? fexpr__122134.cljs$core$IFn$_invoke$arity$3(G__122135,G__122136,G__122137) : fexpr__122134.call(null,G__122135,G__122136,G__122137));
})();
var cr121849_place_21 = (function (){var G__122141 = cr121849_place_20;
var fexpr__122140 = cr121849_place_13;
return (fexpr__122140.cljs$core$IFn$_invoke$arity$1 ? fexpr__122140.cljs$core$IFn$_invoke$arity$1(G__122141) : fexpr__122140.call(null,G__122141));
})();
(cr121849_state[(0)] = cr121849_block_7);

(cr121849_state[(3)] = null);

return missionary.core.park(cr121849_place_21);
}catch (e122130){var cr121849_exception = e122130;
(cr121849_state[(0)] = null);

(cr121849_state[(3)] = null);

(cr121849_state[(1)] = null);

(cr121849_state[(2)] = null);

throw cr121849_exception;
}});
var cr121849_block_12 = (function frontend$components$views$cr121849_block_12(cr121849_state){
try{var cr121849_place_40 = cljs.core.not;
var cr121849_place_41 = view_entity__$1;
var cr121849_place_42 = (function (){var G__122147 = cr121849_place_41;
var fexpr__122146 = cr121849_place_40;
return (fexpr__122146.cljs$core$IFn$_invoke$arity$1 ? fexpr__122146.cljs$core$IFn$_invoke$arity$1(G__122147) : fexpr__122146.call(null,G__122147));
})();
(cr121849_state[(0)] = cr121849_block_13);

(cr121849_state[(5)] = cr121849_place_42);

return cr121849_state;
}catch (e122143){var cr121849_exception = e122143;
(cr121849_state[(0)] = null);

(cr121849_state[(5)] = null);

(cr121849_state[(1)] = null);

(cr121849_state[(3)] = null);

(cr121849_state[(2)] = null);

(cr121849_state[(6)] = null);

(cr121849_state[(4)] = null);

throw cr121849_exception;
}});
var cr121849_block_9 = (function frontend$components$views$cr121849_block_9(cr121849_state){
try{var cr121849_place_32 = (cr121849_state[(5)]);
var cr121849_place_35 = cr121849_place_32;
(cr121849_state[(0)] = cr121849_block_14);

(cr121849_state[(5)] = null);

(cr121849_state[(6)] = cr121849_place_35);

return cr121849_state;
}catch (e122149){var cr121849_exception = e122149;
(cr121849_state[(0)] = null);

(cr121849_state[(5)] = null);

(cr121849_state[(1)] = null);

(cr121849_state[(3)] = null);

(cr121849_state[(2)] = null);

(cr121849_state[(6)] = null);

(cr121849_state[(4)] = null);

throw cr121849_exception;
}});
var cr121849_block_19 = (function frontend$components$views$cr121849_block_19(cr121849_state){
try{var cr121849_place_26 = (cr121849_state[(3)]);
var cr121849_place_29 = (cr121849_state[(5)]);
var cr121849_place_66 = cr121849_place_29;
var cr121849_place_67 = set_views_BANG_;
var cr121849_place_68 = cr121849_place_26;
var cr121849_place_69 = (function (){var G__122158 = cr121849_place_68;
var fexpr__122157 = cr121849_place_67;
return (fexpr__122157.cljs$core$IFn$_invoke$arity$1 ? fexpr__122157.cljs$core$IFn$_invoke$arity$1(G__122158) : fexpr__122157.call(null,G__122158));
})();
var cr121849_place_70 = view_entity__$1;
var cr121849_place_71 = null;
if(cljs.core.truth_(cr121849_place_70)){
(cr121849_state[(0)] = cr121849_block_21);

(cr121849_state[(3)] = null);

(cr121849_state[(5)] = null);

(cr121849_state[(5)] = cr121849_place_71);

return cr121849_state;
} else {
(cr121849_state[(0)] = cr121849_block_20);

(cr121849_state[(3)] = null);

(cr121849_state[(5)] = null);

(cr121849_state[(3)] = cr121849_place_66);

(cr121849_state[(5)] = cr121849_place_71);

return cr121849_state;
}
}catch (e122152){var cr121849_exception = e122152;
(cr121849_state[(0)] = null);

(cr121849_state[(1)] = null);

(cr121849_state[(3)] = null);

(cr121849_state[(5)] = null);

(cr121849_state[(2)] = null);

(cr121849_state[(4)] = null);

throw cr121849_exception;
}});
var cr121849_block_3 = (function frontend$components$views$cr121849_block_3(cr121849_state){
try{var cr121849_place_8 = cljs.core.not;
var cr121849_place_9 = view_entity__$1;
var cr121849_place_10 = (function (){var G__122166 = cr121849_place_9;
var fexpr__122165 = cr121849_place_8;
return (fexpr__122165.cljs$core$IFn$_invoke$arity$1 ? fexpr__122165.cljs$core$IFn$_invoke$arity$1(G__122166) : fexpr__122165.call(null,G__122166));
})();
(cr121849_state[(0)] = cr121849_block_4);

(cr121849_state[(4)] = cr121849_place_10);

return cr121849_state;
}catch (e122161){var cr121849_exception = e122161;
(cr121849_state[(0)] = null);

(cr121849_state[(3)] = null);

(cr121849_state[(1)] = null);

(cr121849_state[(4)] = null);

throw cr121849_exception;
}});
var cr121849_block_7 = (function frontend$components$views$cr121849_block_7(cr121849_state){
try{var cr121849_place_22 = missionary.core.unpark();
var cr121849_place_23 = frontend.components.views.get_views;
var cr121849_place_24 = view_parent;
var cr121849_place_25 = view_feature_type;
var cr121849_place_26 = (function (){var G__122177 = cr121849_place_24;
var G__122178 = cr121849_place_25;
var fexpr__122176 = cr121849_place_23;
return (fexpr__122176.cljs$core$IFn$_invoke$arity$2 ? fexpr__122176.cljs$core$IFn$_invoke$arity$2(G__122177,G__122178) : fexpr__122176.call(null,G__122177,G__122178));
})();
var cr121849_place_27 = cljs.core.first;
var cr121849_place_28 = cr121849_place_26;
var cr121849_place_29 = (function (){var G__122182 = cr121849_place_28;
var fexpr__122181 = cr121849_place_27;
return (fexpr__122181.cljs$core$IFn$_invoke$arity$1 ? fexpr__122181.cljs$core$IFn$_invoke$arity$1(G__122182) : fexpr__122181.call(null,G__122182));
})();
var cr121849_place_30 = cr121849_place_29;
var cr121849_place_31 = null;
if(cljs.core.truth_(cr121849_place_30)){
(cr121849_state[(0)] = cr121849_block_19);

(cr121849_state[(3)] = cr121849_place_26);

(cr121849_state[(5)] = cr121849_place_29);

(cr121849_state[(4)] = cr121849_place_31);

return cr121849_state;
} else {
(cr121849_state[(0)] = cr121849_block_8);

(cr121849_state[(3)] = cr121849_place_26);

(cr121849_state[(4)] = cr121849_place_31);

return cr121849_state;
}
}catch (e122171){var cr121849_exception = e122171;
(cr121849_state[(0)] = null);

(cr121849_state[(1)] = null);

(cr121849_state[(2)] = null);

throw cr121849_exception;
}});
var cr121849_block_20 = (function frontend$components$views$cr121849_block_20(cr121849_state){
try{var cr121849_place_66 = (cr121849_state[(3)]);
var cr121849_place_72 = set_view_entity_BANG_;
var cr121849_place_73 = cr121849_place_66;
var cr121849_place_74 = (function (){var G__122191 = cr121849_place_73;
var fexpr__122190 = cr121849_place_72;
return (fexpr__122190.cljs$core$IFn$_invoke$arity$1 ? fexpr__122190.cljs$core$IFn$_invoke$arity$1(G__122191) : fexpr__122190.call(null,G__122191));
})();
(cr121849_state[(0)] = cr121849_block_22);

(cr121849_state[(3)] = null);

(cr121849_state[(5)] = cr121849_place_74);

return cr121849_state;
}catch (e122187){var cr121849_exception = e122187;
(cr121849_state[(0)] = null);

(cr121849_state[(1)] = null);

(cr121849_state[(3)] = null);

(cr121849_state[(2)] = null);

(cr121849_state[(5)] = null);

(cr121849_state[(4)] = null);

throw cr121849_exception;
}});
var cr121849_block_24 = (function frontend$components$views$cr121849_block_24(cr121849_state){
try{var cr121849_place_11 = (cr121849_state[(2)]);
(cr121849_state[(0)] = cr121849_block_26);

(cr121849_state[(2)] = null);

(cr121849_state[(1)] = cr121849_place_11);

return cr121849_state;
}catch (e122194){var cr121849_exception = e122194;
(cr121849_state[(0)] = null);

(cr121849_state[(1)] = null);

(cr121849_state[(2)] = null);

throw cr121849_exception;
}});
var cr121849_block_18 = (function frontend$components$views$cr121849_block_18(cr121849_state){
try{var cr121849_place_43 = (cr121849_state[(5)]);
(cr121849_state[(0)] = cr121849_block_23);

(cr121849_state[(5)] = null);

(cr121849_state[(4)] = cr121849_place_43);

return cr121849_state;
}catch (e122198){var cr121849_exception = e122198;
(cr121849_state[(0)] = null);

(cr121849_state[(5)] = null);

(cr121849_state[(1)] = null);

(cr121849_state[(2)] = null);

(cr121849_state[(4)] = null);

throw cr121849_exception;
}});
var cr121849_block_10 = (function frontend$components$views$cr121849_block_10(cr121849_state){
try{var cr121849_place_36 = view_feature_type;
var cr121849_place_37 = cr121849_place_36;
var cr121849_place_38 = null;
if(cljs.core.truth_(cr121849_place_37)){
(cr121849_state[(0)] = cr121849_block_12);

(cr121849_state[(5)] = cr121849_place_38);

return cr121849_state;
} else {
(cr121849_state[(0)] = cr121849_block_11);

(cr121849_state[(7)] = cr121849_place_36);

(cr121849_state[(5)] = cr121849_place_38);

return cr121849_state;
}
}catch (e122202){var cr121849_exception = e122202;
(cr121849_state[(0)] = null);

(cr121849_state[(1)] = null);

(cr121849_state[(3)] = null);

(cr121849_state[(2)] = null);

(cr121849_state[(6)] = null);

(cr121849_state[(4)] = null);

throw cr121849_exception;
}});
var cr121849_block_13 = (function frontend$components$views$cr121849_block_13(cr121849_state){
try{var cr121849_place_38 = (cr121849_state[(5)]);
(cr121849_state[(0)] = cr121849_block_14);

(cr121849_state[(5)] = null);

(cr121849_state[(6)] = cr121849_place_38);

return cr121849_state;
}catch (e122205){var cr121849_exception = e122205;
(cr121849_state[(0)] = null);

(cr121849_state[(5)] = null);

(cr121849_state[(1)] = null);

(cr121849_state[(3)] = null);

(cr121849_state[(2)] = null);

(cr121849_state[(6)] = null);

(cr121849_state[(4)] = null);

throw cr121849_exception;
}});
var cr121849_block_16 = (function frontend$components$views$cr121849_block_16(cr121849_state){
try{var cr121849_place_45 = frontend.common.missionary._LT__BANG_;
var cr121849_place_46 = frontend.components.views.create_view_BANG_;
var cr121849_place_47 = view_parent;
var cr121849_place_48 = view_feature_type;
var cr121849_place_49 = new cljs.core.Keyword(null,"auto-triggered?","auto-triggered?",1255221895);
var cr121849_place_50 = true;
var cr121849_place_51 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr121849_place_49,cr121849_place_50]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr121849_place_52 = (function (){var G__122212 = cr121849_place_47;
var G__122213 = cr121849_place_48;
var G__122214 = cr121849_place_51;
var fexpr__122211 = cr121849_place_46;
return (fexpr__122211.cljs$core$IFn$_invoke$arity$3 ? fexpr__122211.cljs$core$IFn$_invoke$arity$3(G__122212,G__122213,G__122214) : fexpr__122211.call(null,G__122212,G__122213,G__122214));
})();
var cr121849_place_53 = (function (){var G__122216 = cr121849_place_52;
var fexpr__122215 = cr121849_place_45;
return (fexpr__122215.cljs$core$IFn$_invoke$arity$1 ? fexpr__122215.cljs$core$IFn$_invoke$arity$1(G__122216) : fexpr__122215.call(null,G__122216));
})();
(cr121849_state[(0)] = cr121849_block_17);

return missionary.core.park(cr121849_place_53);
}catch (e122209){var cr121849_exception = e122209;
(cr121849_state[(0)] = null);

(cr121849_state[(5)] = null);

(cr121849_state[(1)] = null);

(cr121849_state[(3)] = null);

(cr121849_state[(2)] = null);

(cr121849_state[(4)] = null);

throw cr121849_exception;
}});
var cr121849_block_2 = (function frontend$components$views$cr121849_block_2(cr121849_state){
try{var cr121849_place_4 = (cr121849_state[(2)]);
var cr121849_place_7 = cr121849_place_4;
(cr121849_state[(0)] = cr121849_block_4);

(cr121849_state[(2)] = null);

(cr121849_state[(4)] = cr121849_place_7);

return cr121849_state;
}catch (e122219){var cr121849_exception = e122219;
(cr121849_state[(0)] = null);

(cr121849_state[(2)] = null);

(cr121849_state[(3)] = null);

(cr121849_state[(1)] = null);

(cr121849_state[(4)] = null);

throw cr121849_exception;
}});
var cr121849_block_8 = (function frontend$components$views$cr121849_block_8(cr121849_state){
try{var cr121849_place_32 = view_parent;
var cr121849_place_33 = cr121849_place_32;
var cr121849_place_34 = null;
if(cljs.core.truth_(cr121849_place_33)){
(cr121849_state[(0)] = cr121849_block_10);

(cr121849_state[(6)] = cr121849_place_34);

return cr121849_state;
} else {
(cr121849_state[(0)] = cr121849_block_9);

(cr121849_state[(5)] = cr121849_place_32);

(cr121849_state[(6)] = cr121849_place_34);

return cr121849_state;
}
}catch (e122222){var cr121849_exception = e122222;
(cr121849_state[(0)] = null);

(cr121849_state[(1)] = null);

(cr121849_state[(3)] = null);

(cr121849_state[(2)] = null);

(cr121849_state[(4)] = null);

throw cr121849_exception;
}});
var cr121849_block_1 = (function frontend$components$views$cr121849_block_1(cr121849_state){
try{var cr121849_place_2 = frontend.state.get_current_repo;
var cr121849_place_3 = (function (){var fexpr__122228 = cr121849_place_2;
return (fexpr__122228.cljs$core$IFn$_invoke$arity$0 ? fexpr__122228.cljs$core$IFn$_invoke$arity$0() : fexpr__122228.call(null));
})();
var cr121849_place_4 = db_based_QMARK_;
var cr121849_place_5 = cr121849_place_4;
var cr121849_place_6 = null;
if(cljs.core.truth_(cr121849_place_5)){
(cr121849_state[(0)] = cr121849_block_3);

(cr121849_state[(3)] = cr121849_place_3);

(cr121849_state[(4)] = cr121849_place_6);

return cr121849_state;
} else {
(cr121849_state[(0)] = cr121849_block_2);

(cr121849_state[(3)] = cr121849_place_3);

(cr121849_state[(2)] = cr121849_place_4);

(cr121849_state[(4)] = cr121849_place_6);

return cr121849_state;
}
}catch (e122225){var cr121849_exception = e122225;
(cr121849_state[(0)] = null);

(cr121849_state[(1)] = null);

throw cr121849_exception;
}});
var cr121849_block_11 = (function frontend$components$views$cr121849_block_11(cr121849_state){
try{var cr121849_place_36 = (cr121849_state[(7)]);
var cr121849_place_39 = cr121849_place_36;
(cr121849_state[(0)] = cr121849_block_13);

(cr121849_state[(7)] = null);

(cr121849_state[(5)] = cr121849_place_39);

return cr121849_state;
}catch (e122232){var cr121849_exception = e122232;
(cr121849_state[(0)] = null);

(cr121849_state[(5)] = null);

(cr121849_state[(1)] = null);

(cr121849_state[(3)] = null);

(cr121849_state[(2)] = null);

(cr121849_state[(7)] = null);

(cr121849_state[(6)] = null);

(cr121849_state[(4)] = null);

throw cr121849_exception;
}});
var cr121849_block_0 = (function frontend$components$views$cr121849_block_0(cr121849_state){
try{var cr121849_place_0 = query_QMARK_;
var cr121849_place_1 = null;
if(cr121849_place_0){
(cr121849_state[(0)] = cr121849_block_25);

(cr121849_state[(1)] = cr121849_place_1);

return cr121849_state;
} else {
(cr121849_state[(0)] = cr121849_block_1);

(cr121849_state[(1)] = cr121849_place_1);

return cr121849_state;
}
}catch (e122237){var cr121849_exception = e122237;
(cr121849_state[(0)] = null);

throw cr121849_exception;
}});
var cr121849_block_23 = (function frontend$components$views$cr121849_block_23(cr121849_state){
try{var cr121849_place_31 = (cr121849_state[(4)]);
(cr121849_state[(0)] = cr121849_block_24);

(cr121849_state[(4)] = null);

(cr121849_state[(2)] = cr121849_place_31);

return cr121849_state;
}catch (e122241){var cr121849_exception = e122241;
(cr121849_state[(0)] = null);

(cr121849_state[(1)] = null);

(cr121849_state[(2)] = null);

(cr121849_state[(4)] = null);

throw cr121849_exception;
}});
var cr121849_block_25 = (function frontend$components$views$cr121849_block_25(cr121849_state){
try{var cr121849_place_76 = null;
(cr121849_state[(0)] = cr121849_block_26);

(cr121849_state[(1)] = cr121849_place_76);

return cr121849_state;
}catch (e122243){var cr121849_exception = e122243;
(cr121849_state[(0)] = null);

(cr121849_state[(1)] = null);

throw cr121849_exception;
}});
var cr121849_block_4 = (function frontend$components$views$cr121849_block_4(cr121849_state){
try{var cr121849_place_6 = (cr121849_state[(4)]);
var cr121849_place_11 = null;
if(cljs.core.truth_(cr121849_place_6)){
(cr121849_state[(0)] = cr121849_block_6);

(cr121849_state[(4)] = null);

(cr121849_state[(2)] = cr121849_place_11);

return cr121849_state;
} else {
(cr121849_state[(0)] = cr121849_block_5);

(cr121849_state[(3)] = null);

(cr121849_state[(4)] = null);

(cr121849_state[(2)] = cr121849_place_11);

return cr121849_state;
}
}catch (e122245){var cr121849_exception = e122245;
(cr121849_state[(0)] = null);

(cr121849_state[(3)] = null);

(cr121849_state[(1)] = null);

(cr121849_state[(4)] = null);

throw cr121849_exception;
}});
var cr121849_block_15 = (function frontend$components$views$cr121849_block_15(cr121849_state){
try{var cr121849_place_44 = null;
(cr121849_state[(0)] = cr121849_block_18);

(cr121849_state[(5)] = cr121849_place_44);

return cr121849_state;
}catch (e122247){var cr121849_exception = e122247;
(cr121849_state[(0)] = null);

(cr121849_state[(5)] = null);

(cr121849_state[(1)] = null);

(cr121849_state[(2)] = null);

(cr121849_state[(4)] = null);

throw cr121849_exception;
}});
var cr121849_block_21 = (function frontend$components$views$cr121849_block_21(cr121849_state){
try{var cr121849_place_75 = null;
(cr121849_state[(0)] = cr121849_block_22);

(cr121849_state[(5)] = cr121849_place_75);

return cr121849_state;
}catch (e122250){var cr121849_exception = e122250;
(cr121849_state[(0)] = null);

(cr121849_state[(1)] = null);

(cr121849_state[(2)] = null);

(cr121849_state[(5)] = null);

(cr121849_state[(4)] = null);

throw cr121849_exception;
}});
var cr121849_block_17 = (function frontend$components$views$cr121849_block_17(cr121849_state){
try{var cr121849_place_26 = (cr121849_state[(3)]);
var cr121849_place_54 = missionary.core.unpark();
var cr121849_place_55 = cljs.core.concat;
var cr121849_place_56 = cr121849_place_26;
var cr121849_place_57 = cr121849_place_54;
var cr121849_place_58 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr121849_place_57], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
var cr121849_place_59 = (function (){var G__122259 = cr121849_place_56;
var G__122260 = cr121849_place_58;
var fexpr__122258 = cr121849_place_55;
return (fexpr__122258.cljs$core$IFn$_invoke$arity$2 ? fexpr__122258.cljs$core$IFn$_invoke$arity$2(G__122259,G__122260) : fexpr__122258.call(null,G__122259,G__122260));
})();
var cr121849_place_60 = set_views_BANG_;
var cr121849_place_61 = cr121849_place_59;
var cr121849_place_62 = (function (){var G__122264 = cr121849_place_61;
var fexpr__122263 = cr121849_place_60;
return (fexpr__122263.cljs$core$IFn$_invoke$arity$1 ? fexpr__122263.cljs$core$IFn$_invoke$arity$1(G__122264) : fexpr__122263.call(null,G__122264));
})();
var cr121849_place_63 = set_view_entity_BANG_;
var cr121849_place_64 = cr121849_place_54;
var cr121849_place_65 = (function (){var G__122267 = cr121849_place_64;
var fexpr__122266 = cr121849_place_63;
return (fexpr__122266.cljs$core$IFn$_invoke$arity$1 ? fexpr__122266.cljs$core$IFn$_invoke$arity$1(G__122267) : fexpr__122266.call(null,G__122267));
})();
(cr121849_state[(0)] = cr121849_block_18);

(cr121849_state[(3)] = null);

(cr121849_state[(5)] = cr121849_place_65);

return cr121849_state;
}catch (e122255){var cr121849_exception = e122255;
(cr121849_state[(0)] = null);

(cr121849_state[(5)] = null);

(cr121849_state[(1)] = null);

(cr121849_state[(3)] = null);

(cr121849_state[(2)] = null);

(cr121849_state[(4)] = null);

throw cr121849_exception;
}});
return cloroutine.impl.coroutine((function (){var G__122271 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((8));
(G__122271[(0)] = cr121849_block_0);

return G__122271;
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
