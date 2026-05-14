goog.provide('logseq.shui.table.core');
logseq.shui.table.core.get_head_container = (function logseq$shui$table$core$get_head_container(){
return document.getElementById("head");
});
logseq.shui.table.core.get_main_scroll_container = (function logseq$shui$table$core$get_main_scroll_container(){
return document.getElementById("main-content-container");
});
logseq.shui.table.core.row_selected_QMARK_ = (function logseq$shui$table$core$row_selected_QMARK_(row,row_selection){
var id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(row);
var or__5002__auto__ = (function (){var and__5000__auto__ = new cljs.core.Keyword(null,"selected-all?","selected-all?",1723040507).cljs$core$IFn$_invoke$arity$1(row_selection);
if(cljs.core.truth_(and__5000__auto__)){
return (!(cljs.core.contains_QMARK_(new cljs.core.Keyword(null,"excluded-ids","excluded-ids",-523478844).cljs$core$IFn$_invoke$arity$1(row_selection),id)));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return ((cljs.core.not(new cljs.core.Keyword(null,"selected-all?","selected-all?",1723040507).cljs$core$IFn$_invoke$arity$1(row_selection))) && (cljs.core.contains_QMARK_(new cljs.core.Keyword(null,"selected-ids","selected-ids",-1154760141).cljs$core$IFn$_invoke$arity$1(row_selection),id)));
}
});
logseq.shui.table.core.select_some_QMARK_ = (function logseq$shui$table$core$select_some_QMARK_(row_selection,rows){
var or__5002__auto__ = (function (){var and__5000__auto__ = cljs.core.seq(new cljs.core.Keyword(null,"selected-ids","selected-ids",-1154760141).cljs$core$IFn$_invoke$arity$1(row_selection));
if(and__5000__auto__){
return cljs.core.some(new cljs.core.Keyword(null,"selected-ids","selected-ids",-1154760141).cljs$core$IFn$_invoke$arity$1(row_selection),rows);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return ((cljs.core.seq(new cljs.core.Keyword(null,"excluded-ids","excluded-ids",-523478844).cljs$core$IFn$_invoke$arity$1(row_selection))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(rows),cljs.core.count(new cljs.core.Keyword(null,"excluded-ids","excluded-ids",-523478844).cljs$core$IFn$_invoke$arity$1(row_selection)))));
}
});
logseq.shui.table.core.select_all_QMARK_ = (function logseq$shui$table$core$select_all_QMARK_(row_selection,rows){
return ((cljs.core.seq(new cljs.core.Keyword(null,"selected-ids","selected-ids",-1154760141).cljs$core$IFn$_invoke$arity$1(row_selection))) && (clojure.set.subset_QMARK_(cljs.core.set(rows),new cljs.core.Keyword(null,"selected-ids","selected-ids",-1154760141).cljs$core$IFn$_invoke$arity$1(row_selection))));
});
logseq.shui.table.core.toggle_selected_all_BANG_ = (function logseq$shui$table$core$toggle_selected_all_BANG_(table,value,set_row_selection_BANG_){
var group_by_property = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(table,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"state","state",-1988618099),new cljs.core.Keyword(null,"group-by-property","group-by-property",1732754405)], null));
var row_selection = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(table,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"state","state",-1988618099),new cljs.core.Keyword(null,"row-selection","row-selection",1964656498)], null));
if(cljs.core.truth_((function (){var and__5000__auto__ = group_by_property;
if(cljs.core.truth_(and__5000__auto__)){
return value;
} else {
return and__5000__auto__;
}
})())){
var new_selection = cljs.core.update.cljs$core$IFn$_invoke$arity$3(row_selection,new cljs.core.Keyword(null,"selected-ids","selected-ids",-1154760141),(function (ids){
return clojure.set.union.cljs$core$IFn$_invoke$arity$2(cljs.core.set(ids),cljs.core.set(new cljs.core.Keyword(null,"rows","rows",850049680).cljs$core$IFn$_invoke$arity$1(table)));
}));
return (set_row_selection_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_row_selection_BANG_.cljs$core$IFn$_invoke$arity$1(new_selection) : set_row_selection_BANG_.call(null,new_selection));
} else {
if(cljs.core.truth_(value)){
var G__74931 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"selected-all?","selected-all?",1723040507),value], null);
return (set_row_selection_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_row_selection_BANG_.cljs$core$IFn$_invoke$arity$1(G__74931) : set_row_selection_BANG_.call(null,G__74931));
} else {
if(cljs.core.truth_(group_by_property)){
var new_selection = cljs.core.update.cljs$core$IFn$_invoke$arity$3(row_selection,new cljs.core.Keyword(null,"selected-ids","selected-ids",-1154760141),(function (ids){
return clojure.set.difference.cljs$core$IFn$_invoke$arity$2(cljs.core.set(ids),cljs.core.set(new cljs.core.Keyword(null,"rows","rows",850049680).cljs$core$IFn$_invoke$arity$1(table)));
}));
return (set_row_selection_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_row_selection_BANG_.cljs$core$IFn$_invoke$arity$1(new_selection) : set_row_selection_BANG_.call(null,new_selection));
} else {
var G__74938 = cljs.core.PersistentArrayMap.EMPTY;
return (set_row_selection_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_row_selection_BANG_.cljs$core$IFn$_invoke$arity$1(G__74938) : set_row_selection_BANG_.call(null,G__74938));

}
}
}
});
logseq.shui.table.core.set_conj = (function logseq$shui$table$core$set_conj(col,item){
if(cljs.core.seq(col)){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(((cljs.core.set_QMARK_(col))?col:cljs.core.set(col)),item);
} else {
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentHashSet.EMPTY,item);
}
});
logseq.shui.table.core.row_toggle_selected_BANG_ = (function logseq$shui$table$core$row_toggle_selected_BANG_(row,value,set_row_selection_BANG_,row_selection){
var id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(row);
var new_selection = (cljs.core.truth_(new cljs.core.Keyword(null,"selected-all?","selected-all?",1723040507).cljs$core$IFn$_invoke$arity$1(row_selection))?cljs.core.update.cljs$core$IFn$_invoke$arity$4(row_selection,new cljs.core.Keyword(null,"excluded-ids","excluded-ids",-523478844),(cljs.core.truth_(value)?cljs.core.disj:logseq.shui.table.core.set_conj),id):cljs.core.update.cljs$core$IFn$_invoke$arity$4(row_selection,new cljs.core.Keyword(null,"selected-ids","selected-ids",-1154760141),(cljs.core.truth_(value)?logseq.shui.table.core.set_conj:cljs.core.disj),id));
return (set_row_selection_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_row_selection_BANG_.cljs$core$IFn$_invoke$arity$1(new_selection) : set_row_selection_BANG_.call(null,new_selection));
});
logseq.shui.table.core.column_set_sorting_BANG_ = (function logseq$shui$table$core$column_set_sorting_BANG_(column,set_sorting_BANG_,sorting,asc_QMARK_){
var id = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column);
var existing_column = cljs.core.some((function (item){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item),id)){
return item;
} else {
return null;
}
}),sorting);
var value = cljs.core.vec(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,(cljs.core.truth_(existing_column)?(((asc_QMARK_ == null))?cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (item){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item),id);
}),sorting):cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (item){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item),id)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(item,new cljs.core.Keyword(null,"asc?","asc?",891093427),asc_QMARK_);
} else {
return item;
}
}),sorting)):(((asc_QMARK_ == null))?null:cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),id,new cljs.core.Keyword(null,"asc?","asc?",891093427),asc_QMARK_], null)], null),sorting)))));
(set_sorting_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_sorting_BANG_.cljs$core$IFn$_invoke$arity$1(value) : set_sorting_BANG_.call(null,value));

return value;
});
logseq.shui.table.core.get_selection_rows = (function logseq$shui$table$core$get_selection_rows(row_selection,rows){
if(cljs.core.truth_(new cljs.core.Keyword(null,"selected-all?","selected-all?",1723040507).cljs$core$IFn$_invoke$arity$1(row_selection))){
var excluded_ids = new cljs.core.Keyword(null,"excluded-ids","excluded-ids",-523478844).cljs$core$IFn$_invoke$arity$1(row_selection);
if(cljs.core.seq(excluded_ids)){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__74965_SHARP_){
return (excluded_ids.cljs$core$IFn$_invoke$arity$1 ? excluded_ids.cljs$core$IFn$_invoke$arity$1(p1__74965_SHARP_) : excluded_ids.call(null,p1__74965_SHARP_));
}),rows);
} else {
return rows;
}
} else {
var selected_ids = new cljs.core.Keyword(null,"selected-ids","selected-ids",-1154760141).cljs$core$IFn$_invoke$arity$1(row_selection);
if(cljs.core.seq(selected_ids)){
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__74967_SHARP_){
return (selected_ids.cljs$core$IFn$_invoke$arity$1 ? selected_ids.cljs$core$IFn$_invoke$arity$1(p1__74967_SHARP_) : selected_ids.call(null,p1__74967_SHARP_));
}),rows);
} else {
return null;
}
}
});
logseq.shui.table.core.table_option = (function logseq$shui$table$core$table_option(p__74976){
var map__74979 = p__74976;
var map__74979__$1 = cljs.core.__destructure_map(map__74979);
var option = map__74979__$1;
var data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74979__$1,new cljs.core.Keyword(null,"data","data",-232669377));
var columns = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74979__$1,new cljs.core.Keyword(null,"columns","columns",1998437288));
var state = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74979__$1,new cljs.core.Keyword(null,"state","state",-1988618099));
var data_fns = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74979__$1,new cljs.core.Keyword(null,"data-fns","data-fns",-1065218324));
var map__74980 = state;
var map__74980__$1 = cljs.core.__destructure_map(map__74980);
var sorting = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74980__$1,new cljs.core.Keyword(null,"sorting","sorting",622249690));
var row_filter = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74980__$1,new cljs.core.Keyword(null,"row-filter","row-filter",-2109922673));
var row_selection = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74980__$1,new cljs.core.Keyword(null,"row-selection","row-selection",1964656498));
var visible_columns = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74980__$1,new cljs.core.Keyword(null,"visible-columns","visible-columns",1134718660));
var map__74981 = data_fns;
var map__74981__$1 = cljs.core.__destructure_map(map__74981);
var set_sorting_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74981__$1,new cljs.core.Keyword(null,"set-sorting!","set-sorting!",543042376));
var set_visible_columns_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74981__$1,new cljs.core.Keyword(null,"set-visible-columns!","set-visible-columns!",729806223));
var set_row_selection_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74981__$1,new cljs.core.Keyword(null,"set-row-selection!","set-row-selection!",1872995139));
var columns_SINGLEQUOTE_ = logseq.shui.table.impl.visible_columns(columns,visible_columns);
var filtered_rows = logseq.shui.table.impl.rows(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"rows","rows",850049680),data,new cljs.core.Keyword(null,"columns","columns",1998437288),columns,new cljs.core.Keyword(null,"sorting","sorting",622249690),sorting,new cljs.core.Keyword(null,"row-filter","row-filter",-2109922673),row_filter], null));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(option,new cljs.core.Keyword(null,"columns","columns",1998437288),columns_SINGLEQUOTE_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"rows","rows",850049680),filtered_rows,new cljs.core.Keyword(null,"column-visible?","column-visible?",-864117722),(function (column){
return logseq.shui.table.impl.column_visible_QMARK_(column,visible_columns);
}),new cljs.core.Keyword(null,"column-toggle-visibility","column-toggle-visibility",481480390),(function (column,v){
var G__74984 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(visible_columns,logseq.shui.table.impl.column_id(column),v);
return (set_visible_columns_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_visible_columns_BANG_.cljs$core$IFn$_invoke$arity$1(G__74984) : set_visible_columns_BANG_.call(null,G__74984));
}),new cljs.core.Keyword(null,"selected-all?","selected-all?",1723040507),(function (){var or__5002__auto__ = (function (){var and__5000__auto__ = new cljs.core.Keyword(null,"selected-all?","selected-all?",1723040507).cljs$core$IFn$_invoke$arity$1(row_selection);
if(cljs.core.truth_(and__5000__auto__)){
return (cljs.core.seq(new cljs.core.Keyword(null,"excluded-ids","excluded-ids",-523478844).cljs$core$IFn$_invoke$arity$1(row_selection)) == null);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return logseq.shui.table.core.select_all_QMARK_(row_selection,filtered_rows);
}
})(),new cljs.core.Keyword(null,"selected-some?","selected-some?",-1877870503),logseq.shui.table.core.select_some_QMARK_(row_selection,filtered_rows),new cljs.core.Keyword(null,"row-selected?","row-selected?",165215850),(function (row){
return logseq.shui.table.core.row_selected_QMARK_(row,row_selection);
}),new cljs.core.Keyword(null,"row-toggle-selected!","row-toggle-selected!",1549823697),(function (row_selection__$1,row,value){
return logseq.shui.table.core.row_toggle_selected_BANG_(row,value,set_row_selection_BANG_,row_selection__$1);
}),new cljs.core.Keyword(null,"toggle-selected-all!","toggle-selected-all!",-649409852),(function (table,value){
return logseq.shui.table.core.toggle_selected_all_BANG_(table,value,set_row_selection_BANG_);
}),new cljs.core.Keyword(null,"column-set-sorting!","column-set-sorting!",892954674),(function (sorting__$1,column,asc_QMARK_){
return logseq.shui.table.core.column_set_sorting_BANG_(column,set_sorting_BANG_,sorting__$1,asc_QMARK_);
})], 0));
});
logseq.shui.table.core.get_prop_and_children = (function logseq$shui$table$core$get_prop_and_children(prop_and_children){
var prop = ((cljs.core.map_QMARK_(cljs.core.first(prop_and_children)))?cljs.core.first(prop_and_children):null);
if(cljs.core.truth_(prop)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [prop,cljs.core.rest(prop_and_children)], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.PersistentArrayMap.EMPTY,prop_and_children], null);
}
});
logseq.shui.table.core.table = rum.core.lazy_build(rum.core.build_defc,(function() { 
var G__75064__delegate = function (prop_and_children){
var vec__75000 = logseq.shui.table.core.get_prop_and_children(prop_and_children);
var prop = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__75000,(0),null);
var children = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__75000,(1),null);
var attrs74997 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"ls-table w-full caption-bottom text-sm table-fixed"], null),prop], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs74997))?daiquiri.interpreter.element_attributes(attrs74997):null),((cljs.core.map_QMARK_(attrs74997))?[daiquiri.interpreter.interpret(children)]:[daiquiri.interpreter.interpret(attrs74997),daiquiri.interpreter.interpret(children)]));
};
var G__75064 = function (var_args){
var prop_and_children = null;
if (arguments.length > 0) {
var G__75065__i = 0, G__75065__a = new Array(arguments.length -  0);
while (G__75065__i < G__75065__a.length) {G__75065__a[G__75065__i] = arguments[G__75065__i + 0]; ++G__75065__i;}
  prop_and_children = new cljs.core.IndexedSeq(G__75065__a,0,null);
} 
return G__75064__delegate.call(this,prop_and_children);};
G__75064.cljs$lang$maxFixedArity = 0;
G__75064.cljs$lang$applyTo = (function (arglist__75066){
var prop_and_children = cljs.core.seq(arglist__75066);
return G__75064__delegate(prop_and_children);
});
G__75064.cljs$core$IFn$_invoke$arity$variadic = G__75064__delegate;
return G__75064;
})()
,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"logseq.shui.table.core/table");
logseq.shui.table.core.use_sticky_element_BANG_ = (function logseq$shui$table$core$use_sticky_element_BANG_(container,target_ref){
return logseq.shui.hooks.use_effect_BANG_((function (){
var el = rum.core.deref(target_ref);
var cls = el.classList;
var _STAR_ticking_QMARK_ = cljs.core.volatile_BANG_(false);
var el_top = el.getBoundingClientRect().top;
var head_top = parseInt(getComputedStyle(logseq.shui.table.core.get_head_container()).height);
var translate = (function (offset){
(el.style.transform = ["translate3d(0, ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(offset),"px , 0)"].join(''));

if((offset === (0))){
return cls.remove("translated");
} else {
return cls.add("translated");
}
});
var _STAR_last_offset = cljs.core.volatile_BANG_((0));
var handle = (function (){
var scroll_top = parseInt(container.scrollTop);
var offset = ((((scroll_top + head_top) > el_top))?(((scroll_top - el_top) + head_top) + (1)):(0));
var offset__$1 = parseInt(offset);
var last_offset = cljs.core.deref(_STAR_last_offset);
if((((!((last_offset === (0))))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(offset__$1,last_offset)))){
var dir_75067 = ((((offset__$1 - last_offset) < (0)))?(-1):(1));
var offset_SINGLEQUOTE__75068 = (last_offset + dir_75067);
while(true){
translate(offset_SINGLEQUOTE__75068);

if(((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(offset__$1,offset_SINGLEQUOTE__75068)) && ((cljs.core.abs((offset__$1 - offset_SINGLEQUOTE__75068)) < (100))))){
var G__75069 = (offset_SINGLEQUOTE__75068 + dir_75067);
offset_SINGLEQUOTE__75068 = G__75069;
continue;
} else {
translate(offset__$1);
}
break;
}
} else {
translate(offset__$1);
}

return cljs.core.vreset_BANG_(_STAR_last_offset,offset__$1);
});
var handler = (function (e){
if(cljs.core.not(cljs.core.deref(_STAR_ticking_QMARK_))){
window.requestAnimationFrame((function (){
handle();

return cljs.core.vreset_BANG_(_STAR_ticking_QMARK_,false);
}));

return cljs.core.vreset_BANG_(_STAR_ticking_QMARK_,true);
} else {
return null;
}
});
container.addEventListener("scroll",handler);

return (function (){
return container.removeEventListener("scroll",handler);
});
}),cljs.core.PersistentVector.EMPTY);
});
logseq.shui.table.core.use_sticky_element2_BANG_ = (function logseq$shui$table$core$use_sticky_element2_BANG_(target_ref){
return logseq.shui.hooks.use_effect_BANG_((function (){
var target = rum.core.deref(target_ref);
var container = (function (){var or__5002__auto__ = target.closest(".sidebar-item-list");
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return logseq.shui.table.core.get_main_scroll_container();
}
})();
var table = target.closest(".ls-table-rows");
var refs_table_QMARK_ = table.closest(".references");
if(cljs.core.not(refs_table_QMARK_)){
var target_cls = target.classList;
var table_footer = (function (){var G__75021 = table;
if((G__75021 == null)){
return null;
} else {
return G__75021.querySelector(".ls-table-footer");
}
})();
var page_el = target.closest(".page-inner");
var _STAR_ticking_QMARK_ = cljs.core.volatile_BANG_(false);
var _STAR_el_top = cljs.core.volatile_BANG_(target.getBoundingClientRect().top);
var head_height = logseq.shui.table.core.get_head_container().offsetHeight;
var update_target_top_BANG_ = (function (){
if(cljs.core.not(target_cls.contains("ls-fixed"))){
return cljs.core.vreset_BANG_(_STAR_el_top,(target.getBoundingClientRect().top + container.scrollTop));
} else {
return null;
}
});
var update_footer_BANG_ = (function (){
var tw = table.scrollWidth;
if(cljs.core.truth_((function (){var and__5000__auto__ = table_footer;
if(cljs.core.truth_(and__5000__auto__)){
return ((typeof tw === 'number') && ((tw > (0))));
} else {
return and__5000__auto__;
}
})())){
return (table_footer.style.width = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(tw),"px"].join(''));
} else {
return null;
}
});
var update_target_BANG_ = (function (){
if(cljs.core.truth_(target_cls.contains("ls-fixed"))){
var rect_75070 = table.getBoundingClientRect();
var width_75071 = table.clientWidth;
var left_75072 = rect_75070.left;
(target.style.width = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(width_75071),"px"].join(''));

(target.style.left = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(left_75072),"px"].join(''));
} else {
(target.style.width = "auto");

(target.style.left = "0px");
}

return (target.scrollLeft = table.scrollLeft);
});
var target_observe_BANG_ = (function (){
var scroll_top = parseInt(container.scrollTop);
var table_in_top = (scroll_top + head_height);
var table_bottom = table.getBoundingClientRect().bottom;
var fixed_QMARK_ = (((table_bottom > (head_height + (90)))) && ((table_in_top > cljs.core.deref(_STAR_el_top))));
if(fixed_QMARK_){
target_cls.add("ls-fixed");
} else {
target_cls.remove("ls-fixed");
}

return update_target_BANG_();
});
var target_observe_handle_BANG_ = (function (_e){
if(cljs.core.not(cljs.core.deref(_STAR_ticking_QMARK_))){
window.requestAnimationFrame((function (){
target_observe_BANG_();

return cljs.core.vreset_BANG_(_STAR_ticking_QMARK_,false);
}));

return cljs.core.vreset_BANG_(_STAR_ticking_QMARK_,true);
} else {
return null;
}
});
var resize_observer = (new ResizeObserver(update_target_BANG_));
var page_resize_observer = (new ResizeObserver((function (){
return update_target_top_BANG_();
})));
resize_observer.observe(container);

resize_observer.observe(table);

var G__75026_75073 = page_el;
if((G__75026_75073 == null)){
} else {
page_resize_observer.observe(G__75026_75073);
}

container.addEventListener("scroll",target_observe_handle_BANG_);

table.addEventListener("scroll",update_target_BANG_);

table.addEventListener("resize",update_target_BANG_);

update_footer_BANG_();

return (function (){
container.removeEventListener("scroll",target_observe_BANG_);

resize_observer.disconnect();

return page_resize_observer.disconnect();
});
} else {
return null;
}
}),cljs.core.PersistentVector.EMPTY);
});
logseq.shui.table.core.table_header = rum.core.lazy_build(rum.core.build_defc,(function() { 
var G__75074__delegate = function (prop_and_children){
var vec__75029 = logseq.shui.table.core.get_prop_and_children(prop_and_children);
var prop = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__75029,(0),null);
var children = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__75029,(1),null);
var el_ref = rum.core.use_ref(null);
var _ = logseq.shui.table.core.use_sticky_element2_BANG_(el_ref);
var attrs75028 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"class","class",-2030961996),"border-y transition-colors bg-gray-01",new cljs.core.Keyword(null,"ref","ref",1289896967),el_ref,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"z-index","z-index",1892827090),(9)], null)], null),prop], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs75028))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ls-table-header"], null)], null),attrs75028], 0))):{'className':"ls-table-header"}),((cljs.core.map_QMARK_(attrs75028))?[daiquiri.interpreter.interpret(children)]:[daiquiri.interpreter.interpret(attrs75028),daiquiri.interpreter.interpret(children)]));
};
var G__75074 = function (var_args){
var prop_and_children = null;
if (arguments.length > 0) {
var G__75077__i = 0, G__75077__a = new Array(arguments.length -  0);
while (G__75077__i < G__75077__a.length) {G__75077__a[G__75077__i] = arguments[G__75077__i + 0]; ++G__75077__i;}
  prop_and_children = new cljs.core.IndexedSeq(G__75077__a,0,null);
} 
return G__75074__delegate.call(this,prop_and_children);};
G__75074.cljs$lang$maxFixedArity = 0;
G__75074.cljs$lang$applyTo = (function (arglist__75078){
var prop_and_children = cljs.core.seq(arglist__75078);
return G__75074__delegate(prop_and_children);
});
G__75074.cljs$core$IFn$_invoke$arity$variadic = G__75074__delegate;
return G__75074;
})()
,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"logseq.shui.table.core/table-header");
logseq.shui.table.core.table_footer = rum.core.lazy_build(rum.core.build_defc,(function (children){
var attrs75034 = children;
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs75034))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ls-table-footer","fade-in","faster"], null)], null),attrs75034], 0))):{'className':"ls-table-footer fade-in faster"}),((cljs.core.map_QMARK_(attrs75034))?null:[daiquiri.interpreter.interpret(attrs75034)]));
}),null,"logseq.shui.table.core/table-footer");
logseq.shui.table.core.table_row = rum.core.lazy_build(rum.core.build_defc,(function() { 
var G__75079__delegate = function (prop_and_children){
var vec__75038 = logseq.shui.table.core.get_prop_and_children(prop_and_children);
var prop = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__75038,(0),null);
var children = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__75038,(1),null);
var attrs75036 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted bg-gray-01 items-stretch"], null),prop], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs75036))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ls-table-row","ls-block","flex","flex-row","items-center"], null)], null),attrs75036], 0))):{'className':"ls-table-row ls-block flex flex-row items-center"}),((cljs.core.map_QMARK_(attrs75036))?[daiquiri.interpreter.interpret(children)]:[daiquiri.interpreter.interpret(attrs75036),daiquiri.interpreter.interpret(children)]));
};
var G__75079 = function (var_args){
var prop_and_children = null;
if (arguments.length > 0) {
var G__75082__i = 0, G__75082__a = new Array(arguments.length -  0);
while (G__75082__i < G__75082__a.length) {G__75082__a[G__75082__i] = arguments[G__75082__i + 0]; ++G__75082__i;}
  prop_and_children = new cljs.core.IndexedSeq(G__75082__a,0,null);
} 
return G__75079__delegate.call(this,prop_and_children);};
G__75079.cljs$lang$maxFixedArity = 0;
G__75079.cljs$lang$applyTo = (function (arglist__75084){
var prop_and_children = cljs.core.seq(arglist__75084);
return G__75079__delegate(prop_and_children);
});
G__75079.cljs$core$IFn$_invoke$arity$variadic = G__75079__delegate;
return G__75079;
})()
,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"logseq.shui.table.core/table-row");
logseq.shui.table.core.table_cell = rum.core.lazy_build(rum.core.build_defc,(function() { 
var G__75085__delegate = function (prop_and_children){
var vec__75043 = logseq.shui.table.core.get_prop_and_children(prop_and_children);
var prop = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__75043,(0),null);
var children = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__75043,(1),null);
var attrs75041 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(prop,new cljs.core.Keyword(null,"select?","select?",-1012224063),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"add-property?","add-property?",1697808154)], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs75041))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ls-table-cell","flex","relative","h-full"], null)], null),attrs75041], 0))):{'className':"ls-table-cell flex relative h-full"}),((cljs.core.map_QMARK_(attrs75041))?[daiquiri.core.create_element("div",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [["flex align-middle w-full overflow-x-clip items-center",(cljs.core.truth_(new cljs.core.Keyword(null,"select?","select?",-1012224063).cljs$core$IFn$_invoke$arity$1(prop))?" px-0":(cljs.core.truth_(new cljs.core.Keyword(null,"add-property?","add-property?",1697808154).cljs$core$IFn$_invoke$arity$1(prop))?"":" border-r px-2"
))].join('')], null))},[daiquiri.interpreter.interpret(children)])]:[daiquiri.interpreter.interpret(attrs75041),daiquiri.core.create_element("div",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [["flex align-middle w-full overflow-x-clip items-center",(cljs.core.truth_(new cljs.core.Keyword(null,"select?","select?",-1012224063).cljs$core$IFn$_invoke$arity$1(prop))?" px-0":(cljs.core.truth_(new cljs.core.Keyword(null,"add-property?","add-property?",1697808154).cljs$core$IFn$_invoke$arity$1(prop))?"":" border-r px-2"
))].join('')], null))},[daiquiri.interpreter.interpret(children)])]));
};
var G__75085 = function (var_args){
var prop_and_children = null;
if (arguments.length > 0) {
var G__75087__i = 0, G__75087__a = new Array(arguments.length -  0);
while (G__75087__i < G__75087__a.length) {G__75087__a[G__75087__i] = arguments[G__75087__i + 0]; ++G__75087__i;}
  prop_and_children = new cljs.core.IndexedSeq(G__75087__a,0,null);
} 
return G__75085__delegate.call(this,prop_and_children);};
G__75085.cljs$lang$maxFixedArity = 0;
G__75085.cljs$lang$applyTo = (function (arglist__75088){
var prop_and_children = cljs.core.seq(arglist__75088);
return G__75085__delegate(prop_and_children);
});
G__75085.cljs$core$IFn$_invoke$arity$variadic = G__75085__delegate;
return G__75085;
})()
,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"logseq.shui.table.core/table-cell");
logseq.shui.table.core.table_actions = rum.core.lazy_build(rum.core.build_defc,(function() { 
var G__75089__delegate = function (prop_and_children){
var vec__75047 = logseq.shui.table.core.get_prop_and_children(prop_and_children);
var prop = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__75047,(0),null);
var children = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__75047,(1),null);
var el_ref = rum.core.use_ref(null);
var attrs75046 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"ref","ref",1289896967),el_ref,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"z-index","z-index",1892827090),(101)], null)], null),prop], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs75046))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ls-table-actions","flex","flex-row","items-center","gap-1","bg-gray-01"], null)], null),attrs75046], 0))):{'className':"ls-table-actions flex flex-row items-center gap-1 bg-gray-01"}),((cljs.core.map_QMARK_(attrs75046))?[daiquiri.interpreter.interpret(children)]:[daiquiri.interpreter.interpret(attrs75046),daiquiri.interpreter.interpret(children)]));
};
var G__75089 = function (var_args){
var prop_and_children = null;
if (arguments.length > 0) {
var G__75092__i = 0, G__75092__a = new Array(arguments.length -  0);
while (G__75092__i < G__75092__a.length) {G__75092__a[G__75092__i] = arguments[G__75092__i + 0]; ++G__75092__i;}
  prop_and_children = new cljs.core.IndexedSeq(G__75092__a,0,null);
} 
return G__75089__delegate.call(this,prop_and_children);};
G__75089.cljs$lang$maxFixedArity = 0;
G__75089.cljs$lang$applyTo = (function (arglist__75094){
var prop_and_children = cljs.core.seq(arglist__75094);
return G__75089__delegate(prop_and_children);
});
G__75089.cljs$core$IFn$_invoke$arity$variadic = G__75089__delegate;
return G__75089;
})()
,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"logseq.shui.table.core/table-actions");

//# sourceMappingURL=logseq.shui.table.core.js.map
