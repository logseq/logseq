goog.provide('frontend.components.class$');
frontend.components.class$.class_children_aux = (function frontend$components$class$class_children_aux(class$,p__133265){
var map__133266 = p__133265;
var map__133266__$1 = cljs.core.__destructure_map(map__133266);
var opts = map__133266__$1;
var default_collapsed_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133266__$1,new cljs.core.Keyword(null,"default-collapsed?","default-collapsed?",-1350393823));
var children = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__133264_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(class$),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(p1__133264_SHARP_));
}),new cljs.core.Keyword("logseq.property","_parent","logseq.property/_parent",444328035).cljs$core$IFn$_invoke$arity$1(class$));
if(cljs.core.seq(children)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ul","ul",-1349521403),(function (){var iter__5480__auto__ = (function frontend$components$class$class_children_aux_$_iter__133268(s__133269){
return (new cljs.core.LazySeq(null,(function (){
var s__133269__$1 = s__133269;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__133269__$1);
if(temp__5804__auto__){
var s__133269__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__133269__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__133269__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__133271 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__133270 = (0);
while(true){
if((i__133270 < size__5479__auto__)){
var child = cljs.core._nth(c__5478__auto__,i__133270);
cljs.core.chunk_append(b__133271,(function (){var title = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li.ml-2","li.ml-2",540554485),frontend.components.block.page_reference(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"show-brackets?","show-brackets?",659769842),false], null),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(child),null)], null);
if(cljs.core.seq(new cljs.core.Keyword("logseq.property","_parent","logseq.property/_parent",444328035).cljs$core$IFn$_invoke$arity$1(child))){
return frontend.ui.foldable(title,(frontend.components.class$.class_children_aux.cljs$core$IFn$_invoke$arity$2 ? frontend.components.class$.class_children_aux.cljs$core$IFn$_invoke$arity$2(child,opts) : frontend.components.class$.class_children_aux.call(null,child,opts)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"default-collapsed?","default-collapsed?",-1350393823),default_collapsed_QMARK_], null));
} else {
return title;
}
})());

var G__133288 = (i__133270 + (1));
i__133270 = G__133288;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__133271),frontend$components$class$class_children_aux_$_iter__133268(cljs.core.chunk_rest(s__133269__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__133271),null);
}
} else {
var child = cljs.core.first(s__133269__$2);
return cljs.core.cons((function (){var title = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li.ml-2","li.ml-2",540554485),frontend.components.block.page_reference(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"show-brackets?","show-brackets?",659769842),false], null),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(child),null)], null);
if(cljs.core.seq(new cljs.core.Keyword("logseq.property","_parent","logseq.property/_parent",444328035).cljs$core$IFn$_invoke$arity$1(child))){
return frontend.ui.foldable(title,(frontend.components.class$.class_children_aux.cljs$core$IFn$_invoke$arity$2 ? frontend.components.class$.class_children_aux.cljs$core$IFn$_invoke$arity$2(child,opts) : frontend.components.class$.class_children_aux.call(null,child,opts)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"default-collapsed?","default-collapsed?",-1350393823),default_collapsed_QMARK_], null));
} else {
return title;
}
})(),frontend$components$class$class_children_aux_$_iter__133268(cljs.core.rest(s__133269__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","title","block/title",710445684),children));
})()], null);
} else {
return null;
}
});
frontend.components.class$.class_children = rum.core.lazy_build(rum.core.build_defc,(function (class$){
if(cljs.core.seq(new cljs.core.Keyword("logseq.property","_parent","logseq.property/_parent",444328035).cljs$core$IFn$_invoke$arity$1(class$))){
var children_pages = cljs.core.set(frontend.db.model.get_structured_children(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(class$)));
var default_collapsed_QMARK_ = (cljs.core.count(children_pages) > (30));
return frontend.ui.foldable(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.font-medium.opacity-50","div.font-medium.opacity-50",-844969190),["Children (",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.count(children_pages)),")"].join('')], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.ml-1.mt-2","div.ml-1.mt-2",-72616519),frontend.components.class$.class_children_aux(class$,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"default-collapsed?","default-collapsed?",-1350393823),default_collapsed_QMARK_], null))], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"default-collapsed?","default-collapsed?",-1350393823),false,new cljs.core.Keyword(null,"title-trigger?","title-trigger?",-613599873),true], null));
} else {
return null;
}
}),null,"frontend.components.class/class-children");

//# sourceMappingURL=frontend.components.class.js.map
