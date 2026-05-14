goog.provide('logseq.shui.icon.v2');
goog.scope(function(){
  logseq.shui.icon.v2.goog$module$goog$object = goog.module.get('goog.object');
});
logseq.shui.icon.v2.root = rum.core.lazy_build(rum.core.build_defc,(function() {
var G__74405 = null;
var G__74405__1 = (function (name){
return daiquiri.interpreter.interpret((logseq.shui.icon.v2.root.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.icon.v2.root.cljs$core$IFn$_invoke$arity$2(name,null) : logseq.shui.icon.v2.root.call(null,name,null)));
});
var G__74405__2 = (function (name,p__74328){
var map__74330 = p__74328;
var map__74330__$1 = cljs.core.__destructure_map(map__74330);
var opts = map__74330__$1;
var extension_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74330__$1,new cljs.core.Keyword(null,"extension?","extension?",-1574402873));
var font_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74330__$1,new cljs.core.Keyword(null,"font?","font?",-1448494423));
var class$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74330__$1,new cljs.core.Keyword(null,"class","class",-2030961996));
if(((typeof name === 'string') && ((!(clojure.string.blank_QMARK_(name)))))){
var jsTablerIcons = logseq.shui.icon.v2.goog$module$goog$object.get(window,"tablerIcons");
if(cljs.core.truth_((function (){var or__5002__auto__ = extension_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = font_QMARK_;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return cljs.core.not(jsTablerIcons);
}
}
})())){
var attrs74379 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),goog.string.format(["%s-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(name),(cljs.core.truth_(new cljs.core.Keyword(null,"class","class",-2030961996).cljs$core$IFn$_invoke$arity$1(opts))?[" ",clojure.string.trim(new cljs.core.Keyword(null,"class","class",-2030961996).cljs$core$IFn$_invoke$arity$1(opts))].join(''):null)].join(''),(cljs.core.truth_(extension_QMARK_)?"tie tie":"ti ti"))], null),cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(opts,new cljs.core.Keyword(null,"class","class",-2030961996),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"extension?","extension?",-1574402873),new cljs.core.Keyword(null,"font?","font?",-1448494423)], 0))], 0));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs74379))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ui__icon"], null)], null),attrs74379], 0))):{'className':"ui__icon"}),((cljs.core.map_QMARK_(attrs74379))?null:[daiquiri.interpreter.interpret(attrs74379)]));
} else {
return daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = logseq.shui.icon.v2.goog$module$goog$object.get(tablerIcons,["Icon",cljs.core.str.cljs$core$IFn$_invoke$arity$1(camel_snake_kebab.core.__GT_PascalCase(name))].join(''));
if(cljs.core.truth_(temp__5804__auto__)){
var _klass = temp__5804__auto__;
var f = logseq.shui.util.component_wrap(tablerIcons,["Icon",cljs.core.str.cljs$core$IFn$_invoke$arity$1(camel_snake_kebab.core.__GT_PascalCase(name))].join(''));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.ui__icon.ti","span.ui__icon.ti",1689748997),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),["ls-icon-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(name)," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(class$)].join('')], null),f(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null),logseq.shui.util.map_keys__GT_camel_case(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(opts,new cljs.core.Keyword(null,"class","class",-2030961996)))], 0)))], null);
} else {
return null;
}
})());
}
} else {
return null;
}
});
G__74405 = function(name,p__74328){
switch(arguments.length){
case 1:
return G__74405__1.call(this,name);
case 2:
return G__74405__2.call(this,name,p__74328);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__74405.cljs$core$IFn$_invoke$arity$1 = G__74405__1;
G__74405.cljs$core$IFn$_invoke$arity$2 = G__74405__2;
return G__74405;
})()
,null,"logseq.shui.icon.v2/root");

//# sourceMappingURL=logseq.shui.icon.v2.js.map
