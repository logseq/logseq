goog.provide('frontend.components.lazy_editor');
frontend.components.lazy_editor.lazy_editor = (new shadow.lazy.Loadable(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["code-editor"], null),(function (){
return frontend.extensions.code.editor;
})));
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.lazy_editor !== 'undefined') && (typeof frontend.components.lazy_editor.loaded_QMARK_ !== 'undefined')){
} else {
frontend.components.lazy_editor.loaded_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
}
frontend.components.lazy_editor.editor_aux = rum.core.lazy_build(rum.core.build_defc,(function (config,id,attr,code,theme,options,codemirror_loaded_QMARK_){
var state = (function (){var G__106754 = ({"rootMargin": "0px"});
return (frontend.ui.useInView.cljs$core$IFn$_invoke$arity$1 ? frontend.ui.useInView.cljs$core$IFn$_invoke$arity$1(G__106754) : frontend.ui.useInView.call(null,G__106754));
})();
var in_view_QMARK_ = state.inView;
var placeholder = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"height","height",1025178622),(function (){var x__5090__auto__ = (23.2 * cljs.core.count(clojure.string.split_lines(code)));
var y__5091__auto__ = (600);
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})()], null)], null)], null);
return daiquiri.core.create_element("div",{'ref':state.ref},[(cljs.core.truth_((function (){var and__5000__auto__ = codemirror_loaded_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return in_view_QMARK_;
} else {
return and__5000__auto__;
}
})())?daiquiri.interpreter.interpret((function (){var fexpr__106757 = cljs.core.deref(frontend.components.lazy_editor.lazy_editor);
return (fexpr__106757.cljs$core$IFn$_invoke$arity$6 ? fexpr__106757.cljs$core$IFn$_invoke$arity$6(config,id,attr,code,theme,options) : fexpr__106757.call(null,config,id,attr,code,theme,options));
})()):daiquiri.interpreter.interpret(placeholder))]);
}),null,"frontend.components.lazy-editor/editor-aux");
frontend.components.lazy_editor.editor = rum.core.lazy_build(rum.core.build_defc,(function (config,id,attr,code,options){
var loaded_QMARK__SINGLEQUOTE_ = rum.core.react(frontend.components.lazy_editor.loaded_QMARK_);
var theme = frontend.state.sub(new cljs.core.Keyword("ui","theme","ui/theme",-1247877132));
var code__$1 = (function (){var or__5002__auto__ = code;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})();
var code__$2 = clojure.string.replace_first(code__$1,/\n$/,"");
return frontend.components.lazy_editor.editor_aux(config,id,attr,code__$2,theme,options,loaded_QMARK__SINGLEQUOTE_);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"will-mount","will-mount",-434633071),(function (state){
if(cljs.core.truth_(cljs.core.deref(frontend.components.lazy_editor.loaded_QMARK_))){
} else {
shadow.lazy.load.cljs$core$IFn$_invoke$arity$2(frontend.components.lazy_editor.lazy_editor,(function (){
if(cljs.core.not(cljs.core.deref(frontend.components.lazy_editor.loaded_QMARK_))){
return promesa.core.finally$.cljs$core$IFn$_invoke$arity$2(promesa.core.all((function (){var temp__5804__auto__ = (function (){var and__5000__auto__ = frontend.config.lsp_enabled_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.seq(frontend.handler.plugin.hook_extensions_enhancers_by_key(new cljs.core.Keyword(null,"codemirror","codemirror",-1221931625)));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var enhancers = temp__5804__auto__;
var iter__5480__auto__ = (function frontend$components$lazy_editor$iter__106760(s__106761){
return (new cljs.core.LazySeq(null,(function (){
var s__106761__$1 = s__106761;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__106761__$1);
if(temp__5804__auto____$1){
var s__106761__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__106761__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__106761__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__106763 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__106762 = (0);
while(true){
if((i__106762 < size__5479__auto__)){
var map__106764 = cljs.core._nth(c__5478__auto__,i__106762);
var map__106764__$1 = cljs.core.__destructure_map(map__106764);
var f = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106764__$1,new cljs.core.Keyword(null,"enhancer","enhancer",-929020171));
cljs.core.chunk_append(b__106763,((cljs.core.fn_QMARK_(f))?(function (){var G__106765 = window.CodeMirror;
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(G__106765) : f.call(null,G__106765));
})():null));

var G__106769 = (i__106762 + (1));
i__106762 = G__106769;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__106763),frontend$components$lazy_editor$iter__106760(cljs.core.chunk_rest(s__106761__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__106763),null);
}
} else {
var map__106766 = cljs.core.first(s__106761__$2);
var map__106766__$1 = cljs.core.__destructure_map(map__106766);
var f = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106766__$1,new cljs.core.Keyword(null,"enhancer","enhancer",-929020171));
return cljs.core.cons(((cljs.core.fn_QMARK_(f))?(function (){var G__106767 = window.CodeMirror;
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(G__106767) : f.call(null,G__106767));
})():null),frontend$components$lazy_editor$iter__106760(cljs.core.rest(s__106761__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(enhancers);
} else {
return null;
}
})()),(function (){
return cljs.core.reset_BANG_(frontend.components.lazy_editor.loaded_QMARK_,true);
}));
} else {
return cljs.core.reset_BANG_(frontend.components.lazy_editor.loaded_QMARK_,true);
}
}));
}

return state;
})], null)], null),"frontend.components.lazy-editor/editor");

//# sourceMappingURL=frontend.components.lazy_editor.js.map
