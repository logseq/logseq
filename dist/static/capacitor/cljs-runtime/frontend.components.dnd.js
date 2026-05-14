goog.provide('frontend.components.dnd');
var module$node_modules$$dnd_kit$core$dist$index=shadow.js.require("module$node_modules$$dnd_kit$core$dist$index", {});
var module$node_modules$$dnd_kit$sortable$dist$index=shadow.js.require("module$node_modules$$dnd_kit$sortable$dist$index", {});
var module$node_modules$$dnd_kit$utilities$dist$index=shadow.js.require("module$node_modules$$dnd_kit$utilities$dist$index", {});
frontend.components.dnd.dnd_context = frontend.rum.adapt_class.cljs$core$IFn$_invoke$arity$1(module$node_modules$$dnd_kit$core$dist$index.DndContext);
frontend.components.dnd.sortable_context = frontend.rum.adapt_class.cljs$core$IFn$_invoke$arity$1(module$node_modules$$dnd_kit$sortable$dist$index.SortableContext);
frontend.components.dnd.non_sortable_item = rum.core.lazy_build(rum.core.build_defc,(function (props,children){
var attrs67668 = props;
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs67668))?daiquiri.interpreter.element_attributes(attrs67668):null),((cljs.core.map_QMARK_(attrs67668))?[daiquiri.interpreter.interpret(children)]:[daiquiri.interpreter.interpret(attrs67668),daiquiri.interpreter.interpret(children)]));
}),null,"frontend.components.dnd/non-sortable-item");
frontend.components.dnd.sortable_item = rum.core.lazy_build(rum.core.build_defc,(function (props,children){
var sortable = module$node_modules$$dnd_kit$sortable$dist$index.useSortable(({"id": new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(props)}));
var attributes = sortable.attributes;
var listeners = sortable.listeners;
var set_node_ref = sortable.setNodeRef;
var transform = sortable.transform;
var transition = sortable.transition;
var style = ({"transform": (function (){var fexpr__67672 = module$node_modules$$dnd_kit$utilities$dist$index.CSS.Transform.toString;
return (fexpr__67672.cljs$core$IFn$_invoke$arity$1 ? fexpr__67672.cljs$core$IFn$_invoke$arity$1(transform) : fexpr__67672.call(null,transform));
})(), "transition": transition});
var attrs67671 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"ref","ref",1289896967),set_node_ref,new cljs.core.Keyword(null,"style","style",-496642736),style], null),cljs_bean.core.__GT_clj(attributes),cljs_bean.core.__GT_clj(listeners),cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(props,new cljs.core.Keyword(null,"id","id",-1388402092))], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs67671))?daiquiri.interpreter.element_attributes(attrs67671):null),((cljs.core.map_QMARK_(attrs67671))?[daiquiri.interpreter.interpret(children)]:[daiquiri.interpreter.interpret(attrs67671),daiquiri.interpreter.interpret(children)]));
}),null,"frontend.components.dnd/sortable-item");
frontend.components.dnd.items = rum.core.lazy_build(rum.core.build_defc,(function (col,p__67680){
var map__67681 = p__67680;
var map__67681__$1 = cljs.core.__destructure_map(map__67681);
var on_drag_end = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67681__$1,new cljs.core.Keyword(null,"on-drag-end","on-drag-end",520272671));
var parent_node = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67681__$1,new cljs.core.Keyword(null,"parent-node","parent-node",-605954869));
var vertical_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__67681__$1,new cljs.core.Keyword(null,"vertical?","vertical?",-1522630444),true);
var sort_by_inner_element_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67681__$1,new cljs.core.Keyword(null,"sort-by-inner-element?","sort-by-inner-element?",235482267));
var ids = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092),col);
var items_SINGLEQUOTE_ = cljs_bean.core.__GT_js(ids);
var id__GT_item = cljs.core.zipmap(ids,col);
var vec__67682 = rum.core.use_state(items_SINGLEQUOTE_);
var items_state = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67682,(0),null);
var set_items = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67682,(1),null);
var _ = logseq.shui.hooks.use_effect_BANG_((function (){
return (set_items.cljs$core$IFn$_invoke$arity$1 ? set_items.cljs$core$IFn$_invoke$arity$1(items_SINGLEQUOTE_) : set_items.call(null,items_SINGLEQUOTE_));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [col], null));
var vec__67685 = rum.core.use_state(null);
var _active_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67685,(0),null);
var set_active_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67685,(1),null);
var sensors = module$node_modules$$dnd_kit$core$dist$index.useSensors(module$node_modules$$dnd_kit$core$dist$index.useSensor(module$node_modules$$dnd_kit$core$dist$index.MouseSensor,cljs_bean.core.__GT_js(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"activationConstraint","activationConstraint",-448729250),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"distance","distance",-1671893894),(8)], null)], null))));
var dnd_opts = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"sensors","sensors",-1987490738),sensors,new cljs.core.Keyword(null,"collisionDetection","collisionDetection",-2054491885),module$node_modules$$dnd_kit$core$dist$index.closestCenter,new cljs.core.Keyword(null,"onDragStart","onDragStart",-2108300997),(function (event){
if(frontend.state.editing_QMARK_()){
return null;
} else {
var G__67689 = event.active.id;
return (set_active_id.cljs$core$IFn$_invoke$arity$1 ? set_active_id.cljs$core$IFn$_invoke$arity$1(G__67689) : set_active_id.call(null,G__67689));
}
}),new cljs.core.Keyword(null,"onDragEnd","onDragEnd",1520191895),(function (event){
var active_id = event.active.id;
var over_id = event.over.id;
if(cljs.core.truth_(active_id)){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(active_id,over_id)){
} else {
var old_index_67720 = ids.indexOf(active_id);
var new_index_67721 = ids.indexOf(over_id);
var new_items_67722 = module$node_modules$$dnd_kit$sortable$dist$index.arrayMove(items_state,old_index_67720,new_index_67721);
if(cljs.core.fn_QMARK_(on_drag_end)){
var new_values_67724 = cljs.core.vec(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (id){
var item = (id__GT_item.cljs$core$IFn$_invoke$arity$1 ? id__GT_item.cljs$core$IFn$_invoke$arity$1(id) : id__GT_item.call(null,id));
if(cljs.core.map_QMARK_(item)){
return new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(item);
} else {
return item;
}
}),new_items_67722)));
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(new_values_67724),cljs.core.count(ids))){
console.error("Dnd length not matched: ");

new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"old-items","old-items",1364373850),items_state,new cljs.core.Keyword(null,"new-items","new-items",-2122710837),new_items_67722], null);
} else {
(set_items.cljs$core$IFn$_invoke$arity$1 ? set_items.cljs$core$IFn$_invoke$arity$1(new_items_67722) : set_items.call(null,new_items_67722));

var G__67692_67726 = new_values_67724;
var G__67693_67727 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"active-id","active-id",-59238656),active_id,new cljs.core.Keyword(null,"over-id","over-id",257293900),over_id,new cljs.core.Keyword(null,"direction","direction",-633359395),(((new_index_67721 > old_index_67720))?new cljs.core.Keyword(null,"down","down",1565245570):new cljs.core.Keyword(null,"up","up",-269712113))], null);
(on_drag_end.cljs$core$IFn$_invoke$arity$2 ? on_drag_end.cljs$core$IFn$_invoke$arity$2(G__67692_67726,G__67693_67727) : on_drag_end.call(null,G__67692_67726,G__67693_67727));
}
} else {
}
}
} else {
}

return (set_active_id.cljs$core$IFn$_invoke$arity$1 ? set_active_id.cljs$core$IFn$_invoke$arity$1(null) : set_active_id.call(null,null));
})], null);
var sortable_opts = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"items","items",1031954938),items_state,new cljs.core.Keyword(null,"strategy","strategy",-1471631918),(cljs.core.truth_(vertical_QMARK_)?module$node_modules$$dnd_kit$sortable$dist$index.verticalListSortingStrategy:module$node_modules$$dnd_kit$sortable$dist$index.horizontalListSortingStrategy)], null);
var children = (function (){var iter__5480__auto__ = (function frontend$components$dnd$iter__67700(s__67701){
return (new cljs.core.LazySeq(null,(function (){
var s__67701__$1 = s__67701;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__67701__$1);
if(temp__5804__auto__){
var s__67701__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__67701__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__67701__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__67703 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__67702 = (0);
while(true){
if((i__67702 < size__5479__auto__)){
var item = cljs.core._nth(c__5478__auto__,i__67702);
cljs.core.chunk_append(b__67703,(function (){var id = cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item));
var prop = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"prop","prop",-515168332).cljs$core$IFn$_invoke$arity$1(item),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),id,new cljs.core.Keyword(null,"id","id",-1388402092),id], null)], 0));
if(cljs.core.truth_(sort_by_inner_element_QMARK_)){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),id], null),new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(item)], null);
} else {
if(cljs.core.truth_(new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181).cljs$core$IFn$_invoke$arity$1(item))){
return rum.core.with_key(frontend.components.dnd.non_sortable_item(prop,new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(item)),id);
} else {
return rum.core.with_key(frontend.components.dnd.sortable_item(prop,new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(item)),id);

}
}
})());

var G__67733 = (i__67702 + (1));
i__67702 = G__67733;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__67703),frontend$components$dnd$iter__67700(cljs.core.chunk_rest(s__67701__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__67703),null);
}
} else {
var item = cljs.core.first(s__67701__$2);
return cljs.core.cons((function (){var id = cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item));
var prop = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"prop","prop",-515168332).cljs$core$IFn$_invoke$arity$1(item),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),id,new cljs.core.Keyword(null,"id","id",-1388402092),id], null)], 0));
if(cljs.core.truth_(sort_by_inner_element_QMARK_)){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),id], null),new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(item)], null);
} else {
if(cljs.core.truth_(new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181).cljs$core$IFn$_invoke$arity$1(item))){
return rum.core.with_key(frontend.components.dnd.non_sortable_item(prop,new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(item)),id);
} else {
return rum.core.with_key(frontend.components.dnd.sortable_item(prop,new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(item)),id);

}
}
})(),frontend$components$dnd$iter__67700(cljs.core.rest(s__67701__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(col);
})();
var children_SINGLEQUOTE_ = (cljs.core.truth_(parent_node)?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [parent_node,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),"parent-node"], null),children], null):children);
return daiquiri.interpreter.interpret((function (){var G__67711 = dnd_opts;
var G__67712 = (frontend.components.dnd.sortable_context.cljs$core$IFn$_invoke$arity$2 ? frontend.components.dnd.sortable_context.cljs$core$IFn$_invoke$arity$2(sortable_opts,children_SINGLEQUOTE_) : frontend.components.dnd.sortable_context.call(null,sortable_opts,children_SINGLEQUOTE_));
return (frontend.components.dnd.dnd_context.cljs$core$IFn$_invoke$arity$2 ? frontend.components.dnd.dnd_context.cljs$core$IFn$_invoke$arity$2(G__67711,G__67712) : frontend.components.dnd.dnd_context.call(null,G__67711,G__67712));
})());
}),null,"frontend.components.dnd/items");

//# sourceMappingURL=frontend.components.dnd.js.map
