goog.provide('frontend.extensions.latex');
frontend.extensions.latex.loaded_QMARK_ = (function frontend$extensions$latex$loaded_QMARK_(){
return window.katex;
});
if((typeof frontend !== 'undefined') && (typeof frontend.extensions !== 'undefined') && (typeof frontend.extensions.latex !== 'undefined') && (typeof frontend.extensions.latex._STAR_loading_QMARK_ !== 'undefined')){
} else {
frontend.extensions.latex._STAR_loading_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
}
frontend.extensions.latex.render_BANG_ = (function frontend$extensions$latex$render_BANG_(state){
var vec__117380 = new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state);
var s = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117380,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117380,(1),null);
var display_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117380,(2),null);
var id = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(state);
try{var temp__5804__auto__ = goog.dom.getElement(id);
if(cljs.core.truth_(temp__5804__auto__)){
var elem = temp__5804__auto__;
return katex.render(s,elem,({"displayMode": display_QMARK_, "throwOnError": false, "strict": false}));
} else {
return null;
}
}catch (e117383){var e = e117383;
return console.error(e);
}});
frontend.extensions.latex.load_and_render_BANG_ = (function frontend$extensions$latex$load_and_render_BANG_(state){
if(cljs.core.truth_(frontend.extensions.latex.loaded_QMARK_())){
cljs.core.reset_BANG_(frontend.extensions.latex._STAR_loading_QMARK_,false);

return frontend.extensions.latex.render_BANG_(state);
} else {
if(cljs.core.truth_(cljs.core.deref(frontend.extensions.latex._STAR_loading_QMARK_))){
return null;
} else {
cljs.core.reset_BANG_(frontend.extensions.latex._STAR_loading_QMARK_,true);

return frontend.loader.load.cljs$core$IFn$_invoke$arity$3(frontend.config.asset_uri("/static/js/katex.min.js"),(function (){
return frontend.loader.load.cljs$core$IFn$_invoke$arity$2(frontend.config.asset_uri("/static/js/mhchem.min.js"),(function (){
return promesa.core.finally$.cljs$core$IFn$_invoke$arity$2(promesa.core.all((function (){var temp__5804__auto__ = (function (){var and__5000__auto__ = frontend.config.lsp_enabled_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.seq(frontend.handler.plugin.hook_extensions_enhancers_by_key(new cljs.core.Keyword(null,"katex","katex",648363779)));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var enhancers = temp__5804__auto__;
var iter__5480__auto__ = (function frontend$extensions$latex$load_and_render_BANG__$_iter__117484(s__117485){
return (new cljs.core.LazySeq(null,(function (){
var s__117485__$1 = s__117485;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__117485__$1);
if(temp__5804__auto____$1){
var s__117485__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__117485__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__117485__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__117487 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__117486 = (0);
while(true){
if((i__117486 < size__5479__auto__)){
var map__117503 = cljs.core._nth(c__5478__auto__,i__117486);
var map__117503__$1 = cljs.core.__destructure_map(map__117503);
var f = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117503__$1,new cljs.core.Keyword(null,"enhancer","enhancer",-929020171));
cljs.core.chunk_append(b__117487,((cljs.core.fn_QMARK_(f))?(f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(window.katex) : f.call(null,window.katex)):null));

var G__117574 = (i__117486 + (1));
i__117486 = G__117574;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__117487),frontend$extensions$latex$load_and_render_BANG__$_iter__117484(cljs.core.chunk_rest(s__117485__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__117487),null);
}
} else {
var map__117510 = cljs.core.first(s__117485__$2);
var map__117510__$1 = cljs.core.__destructure_map(map__117510);
var f = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117510__$1,new cljs.core.Keyword(null,"enhancer","enhancer",-929020171));
return cljs.core.cons(((cljs.core.fn_QMARK_(f))?(f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(window.katex) : f.call(null,window.katex)):null),frontend$extensions$latex$load_and_render_BANG__$_iter__117484(cljs.core.rest(s__117485__$2)));
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
cljs.core.reset_BANG_(frontend.extensions.latex._STAR_loading_QMARK_,false);

return frontend.extensions.latex.render_BANG_(state);
}));
}));
}),state);
}
}
});
frontend.extensions.latex.state__AMPERSAND__load_and_render_BANG_ = (function frontend$extensions$latex$state__AMPERSAND__load_and_render_BANG_(state){
frontend.extensions.latex.load_and_render_BANG_(state);

return state;
});
frontend.extensions.latex.latex = rum.core.lazy_build(rum.core.build_defcs,(function (state,s,block_QMARK_,_display_QMARK_){
var id = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(state);
var loading_QMARK_ = rum.core.react(frontend.extensions.latex._STAR_loading_QMARK_);
if(cljs.core.truth_(loading_QMARK_)){
return daiquiri.interpreter.interpret(frontend.ui.loading.cljs$core$IFn$_invoke$arity$0());
} else {
var element = (cljs.core.truth_(block_QMARK_)?new cljs.core.Keyword(null,"div.latex","div.latex",1964645203):new cljs.core.Keyword(null,"span.latex-inline","span.latex-inline",2007517054));
return daiquiri.interpreter.interpret(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [element,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),id,new cljs.core.Keyword(null,"class","class",-2030961996),"initial"], null),(function (){var attrs117535 = s;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs117535))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["opacity-0"], null)], null),attrs117535], 0))):{'className':"opacity-0"}),((cljs.core.map_QMARK_(attrs117535))?null:[daiquiri.interpreter.interpret(attrs117535)]));
})()], null));
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(state,new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.random_uuid()));
}),new cljs.core.Keyword(null,"did-mount","did-mount",918232960),frontend.extensions.latex.state__AMPERSAND__load_and_render_BANG_,new cljs.core.Keyword(null,"did-update","did-update",-2143702256),frontend.extensions.latex.state__AMPERSAND__load_and_render_BANG_], null)], null),"frontend.extensions.latex/latex");
frontend.extensions.latex.html_export = (function frontend$extensions$latex$html_export(s,block_QMARK_,display_QMARK_){
var element = (cljs.core.truth_(block_QMARK_)?new cljs.core.Keyword(null,"div.latex","div.latex",1964645203):new cljs.core.Keyword(null,"span.latex-inline","span.latex-inline",2007517054));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [element,(cljs.core.truth_((function (){var or__5002__auto__ = block_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return display_QMARK_;
}
})())?(frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("$$%s$$",s) : frontend.util.format.call(null,"$$%s$$",s)):(frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("$%s$",s) : frontend.util.format.call(null,"$%s$",s)))], null);
});

//# sourceMappingURL=frontend.extensions.latex.js.map
