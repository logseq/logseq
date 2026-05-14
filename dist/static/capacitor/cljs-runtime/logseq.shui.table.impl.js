goog.provide('logseq.shui.table.impl');
logseq.shui.table.impl.column_id = (function logseq$shui$table$impl$column_id(column){
if((!((new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column) == null)))){
} else {
throw (new Error(["Assert failed: ","No id specified for this column","\n","(some? (:id column))"].join('')));
}

return new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(column);
});
logseq.shui.table.impl.column_visible_QMARK_ = (function logseq$shui$table$impl$column_visible_QMARK_(column,visible_columns){
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(visible_columns,logseq.shui.table.impl.column_id(column));
return (!(value === false));
});
logseq.shui.table.impl.visible_columns = (function logseq$shui$table$impl$visible_columns(columns,visible_columns_SINGLEQUOTE_){
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__73691_SHARP_){
return logseq.shui.table.impl.column_visible_QMARK_(p1__73691_SHARP_,visible_columns_SINGLEQUOTE_);
}),columns);
});
logseq.shui.table.impl.rows = (function logseq$shui$table$impl$rows(p__73695){
var map__73700 = p__73695;
var map__73700__$1 = cljs.core.__destructure_map(map__73700);
var opts = map__73700__$1;
var row_filter = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73700__$1,new cljs.core.Keyword(null,"row-filter","row-filter",-2109922673));
var rows_SINGLEQUOTE_ = new cljs.core.Keyword(null,"rows","rows",850049680).cljs$core$IFn$_invoke$arity$1(opts);
if(cljs.core.truth_(row_filter)){
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2(row_filter,rows_SINGLEQUOTE_);
} else {
return rows_SINGLEQUOTE_;
}
});

//# sourceMappingURL=logseq.shui.table.impl.js.map
