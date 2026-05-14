goog.provide('frontend.handler.property.file');
frontend.handler.property.file.insert_properties_when_file_based = (function frontend$handler$property$file$insert_properties_when_file_based(repo,format,content,kvs){
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)){
return content;
} else {
return frontend.handler.file_based.property.util.insert_properties(format,content,kvs);
}
});
frontend.handler.property.file.remove_property_when_file_based = (function frontend$handler$property$file$remove_property_when_file_based(var_args){
var args__5732__auto__ = [];
var len__5726__auto___51996 = arguments.length;
var i__5727__auto___51997 = (0);
while(true){
if((i__5727__auto___51997 < len__5726__auto___51996)){
args__5732__auto__.push((arguments[i__5727__auto___51997]));

var G__51998 = (i__5727__auto___51997 + (1));
i__5727__auto___51997 = G__51998;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((4) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((4)),(0),null)):null);
return frontend.handler.property.file.remove_property_when_file_based.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),argseq__5733__auto__);
});

(frontend.handler.property.file.remove_property_when_file_based.cljs$core$IFn$_invoke$arity$variadic = (function (repo,format,key,content,args){
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)){
return content;
} else {
return cljs.core.apply.cljs$core$IFn$_invoke$arity$5(frontend.handler.file_based.property.util.remove_property,format,key,content,args);
}
}));

(frontend.handler.property.file.remove_property_when_file_based.cljs$lang$maxFixedArity = (4));

/** @this {Function} */
(frontend.handler.property.file.remove_property_when_file_based.cljs$lang$applyTo = (function (seq51991){
var G__51992 = cljs.core.first(seq51991);
var seq51991__$1 = cljs.core.next(seq51991);
var G__51993 = cljs.core.first(seq51991__$1);
var seq51991__$2 = cljs.core.next(seq51991__$1);
var G__51994 = cljs.core.first(seq51991__$2);
var seq51991__$3 = cljs.core.next(seq51991__$2);
var G__51995 = cljs.core.first(seq51991__$3);
var seq51991__$4 = cljs.core.next(seq51991__$3);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__51992,G__51993,G__51994,G__51995,seq51991__$4);
}));

frontend.handler.property.file.remove_properties_when_file_based = (function frontend$handler$property$file$remove_properties_when_file_based(repo,format,content){
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)){
return content;
} else {
return (frontend.handler.file_based.property.util.remove_properties.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.file_based.property.util.remove_properties.cljs$core$IFn$_invoke$arity$2(format,content) : frontend.handler.file_based.property.util.remove_properties.call(null,format,content));
}
});
frontend.handler.property.file.remove_built_in_properties_when_file_based = (function frontend$handler$property$file$remove_built_in_properties_when_file_based(repo,format,content){
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)){
return content;
} else {
return frontend.handler.file_based.property.util.remove_built_in_properties(format,content);
}
});
frontend.handler.property.file.with_built_in_properties_when_file_based = (function frontend$handler$property$file$with_built_in_properties_when_file_based(repo,properties,content,format){
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)){
return content;
} else {
return frontend.handler.file_based.property.util.with_built_in_properties(properties,content,format);
}
});
frontend.handler.property.file.property_key_exist_QMARK__when_file_based = frontend.handler.file_based.property.util.property_key_exist_QMARK_;
frontend.handler.property.file.goto_properties_end_when_file_based = frontend.handler.file_based.property.util.goto_properties_end;
frontend.handler.property.file.properties_hidden_QMARK_ = (function frontend$handler$property$file$properties_hidden_QMARK_(properties){
var and__5000__auto__ = cljs.core.seq(properties);
if(and__5000__auto__){
var ks = cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.comp.cljs$core$IFn$_invoke$arity$3(cljs.core.keyword,clojure.string.lower_case,cljs.core.name),cljs.core.keys(properties));
var hidden_properties_set = (frontend.handler.file_based.property.hidden_properties.cljs$core$IFn$_invoke$arity$0 ? frontend.handler.file_based.property.hidden_properties.cljs$core$IFn$_invoke$arity$0() : frontend.handler.file_based.property.hidden_properties.call(null));
return cljs.core.every_QMARK_(hidden_properties_set,ks);
} else {
return and__5000__auto__;
}
});

//# sourceMappingURL=frontend.handler.property.file.js.map
