goog.provide('frontend.components.icon');
goog.scope(function(){
  frontend.components.icon.goog$module$goog$object = goog.module.get('goog.object');
});
var module$node_modules$$emoji_mart$data$sets$14$native_json=shadow.js.require("module$node_modules$$emoji_mart$data$sets$14$native_json", {});
var module$node_modules$emoji_mart$dist$main=shadow.js.require("module$node_modules$emoji_mart$dist$main", {});
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.icon !== 'undefined') && (typeof frontend.components.icon.emojis !== 'undefined')){
} else {
frontend.components.icon.emojis = cljs.core.vals(cljs_bean.core.__GT_clj(frontend.components.icon.goog$module$goog$object.get(module$node_modules$$emoji_mart$data$sets$14$native_json,"emojis")));
}
frontend.components.icon.icon = (function frontend$components$icon$icon(var_args){
var args__5732__auto__ = [];
var len__5726__auto___109895 = arguments.length;
var i__5727__auto___109896 = (0);
while(true){
if((i__5727__auto___109896 < len__5726__auto___109895)){
args__5732__auto__.push((arguments[i__5727__auto___109896]));

var G__109897 = (i__5727__auto___109896 + (1));
i__5727__auto___109896 = G__109897;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.components.icon.icon.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.components.icon.icon.cljs$core$IFn$_invoke$arity$variadic = (function (icon_SINGLEQUOTE_,p__108803){
var vec__108804 = p__108803;
var opts = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__108804,(0),null);
var icon_SINGLEQUOTE___$1 = ((((typeof icon_SINGLEQUOTE_ === 'string') || ((icon_SINGLEQUOTE_ instanceof cljs.core.Keyword))))?new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"tabler-icon","tabler-icon",945975358),new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.name(icon_SINGLEQUOTE_)], null):icon_SINGLEQUOTE_);
var color_QMARK_ = new cljs.core.Keyword(null,"color?","color?",-1891974356).cljs$core$IFn$_invoke$arity$1(opts);
var opts__$1 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(opts,new cljs.core.Keyword(null,"color?","color?",-1891974356));
var item = (cljs.core.truth_((function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"emoji","emoji",1031230144),new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(icon_SINGLEQUOTE___$1));
if(and__5000__auto__){
return new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(icon_SINGLEQUOTE___$1);
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.ui__icon","span.ui__icon",-681203515),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"em-emoji","em-emoji",1985182592),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(icon_SINGLEQUOTE___$1),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"line-height","line-height",1870784992),(1)], null)], null),opts__$1], 0))], null)], null):(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"tabler-icon","tabler-icon",945975358),new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(icon_SINGLEQUOTE___$1));
if(and__5000__auto__){
return new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(icon_SINGLEQUOTE___$1);
} else {
return and__5000__auto__;
}
})())?frontend.ui.icon(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(icon_SINGLEQUOTE___$1),opts__$1):null));
if(cljs.core.truth_(color_QMARK_)){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.inline-flex.items-center.ls-icon-color-wrap","span.inline-flex.items-center.ls-icon-color-wrap",1409953162),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color","color",1011675173),(function (){var or__5002__auto__ = (function (){var G__108809 = icon_SINGLEQUOTE___$1;
if((G__108809 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"color","color",1011675173).cljs$core$IFn$_invoke$arity$1(G__108809);
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "inherit";
}
})()], null)], null),item], null);
} else {
return item;
}
}));

(frontend.components.icon.icon.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.components.icon.icon.cljs$lang$applyTo = (function (seq108783){
var G__108784 = cljs.core.first(seq108783);
var seq108783__$1 = cljs.core.next(seq108783);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__108784,seq108783__$1);
}));

frontend.components.icon.get_node_icon = (function frontend$components$icon$get_node_icon(node_entity){
var first_tag_icon = cljs.core.some(new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285),cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(node_entity)));
var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(node_entity,frontend.handler.property.util.get_pid(new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285)));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var asset_type = new cljs.core.Keyword("logseq.property.asset","type","logseq.property.asset/type",-1142083098).cljs$core$IFn$_invoke$arity$1(node_entity);
if((!((first_tag_icon == null)))){
return first_tag_icon;
} else {
if(cljs.core.truth_((logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(node_entity) : logseq.db.class_QMARK_.call(null,node_entity)))){
return "hash";
} else {
if(cljs.core.truth_((logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1(node_entity) : logseq.db.property_QMARK_.call(null,node_entity)))){
return "letter-p";
} else {
if(cljs.core.truth_((logseq.db.whiteboard_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.whiteboard_QMARK_.cljs$core$IFn$_invoke$arity$1(node_entity) : logseq.db.whiteboard_QMARK_.call(null,node_entity)))){
return "writing";
} else {
if(cljs.core.truth_((logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(node_entity) : logseq.db.page_QMARK_.call(null,node_entity)))){
return "file";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(asset_type,"pdf")){
return "book";
} else {
return "letter-n";

}
}
}
}
}
}
}
});
frontend.components.icon.get_node_icon_cp = (function frontend$components$icon$get_node_icon_cp(node_entity,opts){
var opts_SINGLEQUOTE_ = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(14)], null),opts], 0));
var node_icon = (cljs.core.truth_(new cljs.core.Keyword(null,"own-icon?","own-icon?",-1404102266).cljs$core$IFn$_invoke$arity$1(opts))?cljs.core.get.cljs$core$IFn$_invoke$arity$2(node_entity,frontend.handler.property.util.get_pid(new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285))):frontend.components.icon.get_node_icon(node_entity));
if(cljs.core.truth_((function (){var or__5002__auto__ = clojure.string.blank_QMARK_(node_icon);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["letter-n",null,"file",null], null), null),node_icon);
if(and__5000__auto__){
return new cljs.core.Keyword(null,"not-text-or-page?","not-text-or-page?",1103352804).cljs$core$IFn$_invoke$arity$1(opts);
} else {
return and__5000__auto__;
}
}
})())){
return null;
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.icon-cp-container.flex.items-center","div.icon-cp-container.flex.items-center",598158841),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color","color",1011675173),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"color","color",1011675173).cljs$core$IFn$_invoke$arity$1(node_icon);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "inherit";
}
})()], null)], null),cljs.core.select_keys(opts,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"class","class",-2030961996)], null))], 0)),frontend.components.icon.icon.cljs$core$IFn$_invoke$arity$variadic(node_icon,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts_SINGLEQUOTE_], 0))], null);
}
});
frontend.components.icon.search_emojis = (function frontend$components$icon$search_emojis(q){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(module$node_modules$emoji_mart$dist$main.SearchIndex.search(q)),(function (result){
return promesa.protocols._promise(cljs_bean.core.__GT_clj(result));
}));
}));
});
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.icon !== 'undefined') && (typeof frontend.components.icon._STAR_tabler_icons !== 'undefined')){
} else {
frontend.components.icon._STAR_tabler_icons = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
frontend.components.icon.get_tabler_icons = (function frontend$components$icon$get_tabler_icons(){
if(cljs.core.truth_(cljs.core.deref(frontend.components.icon._STAR_tabler_icons))){
return cljs.core.deref(frontend.components.icon._STAR_tabler_icons);
} else {
var result = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, ["Ab 2",null,"Ab",null,"Ab Off",null], null), null),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (k){
return clojure.string.replace_first(clojure.string.replace(camel_snake_kebab.core.__GT_Camel_Snake_Case(cljs.core.name(k)),"_"," "),"Icon ","");
}),cljs.core.keys(cljs_bean.core.__GT_clj(tablerIcons))));
cljs.core.reset_BANG_(frontend.components.icon._STAR_tabler_icons,result);

return result;
}
});
frontend.components.icon.search_tabler_icons = (function frontend$components$icon$search_tabler_icons(q){
var G__108897 = frontend.components.icon.get_tabler_icons();
var G__108898 = q;
var G__108899 = new cljs.core.Keyword(null,"limit","limit",-1355822363);
var G__108900 = (100);
return (frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$4 ? frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$4(G__108897,G__108898,G__108899,G__108900) : frontend.search.fuzzy_search.call(null,G__108897,G__108898,G__108899,G__108900));
});
frontend.components.icon.search = (function frontend$components$icon$search(q,tab){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(tab,new cljs.core.Keyword(null,"emoji","emoji",1031230144)))?frontend.components.icon.search_tabler_icons(q):null)),(function (icons){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(tab,new cljs.core.Keyword(null,"icon","icon",1679606541)))?frontend.components.icon.search_emojis(q):null)),(function (emojis_SINGLEQUOTE_){
return promesa.protocols._promise(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"icons","icons",-297140977),icons,new cljs.core.Keyword(null,"emojis","emojis",-2098458463),emojis_SINGLEQUOTE_], null));
}));
}));
}));
});
frontend.components.icon.icons_row = rum.core.lazy_build(rum.core.build_defc,(function (items){
var attrs108904 = items;
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs108904))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["its","icons-row"], null)], null),attrs108904], 0))):{'className':"its icons-row"}),((cljs.core.map_QMARK_(attrs108904))?null:[daiquiri.interpreter.interpret(attrs108904)]));
}),null,"frontend.components.icon/icons-row");
frontend.components.icon.icon_cp = rum.core.lazy_build(rum.core.build_defc,(function (icon_SINGLEQUOTE_,p__108920){
var map__108921 = p__108920;
var map__108921__$1 = cljs.core.__destructure_map(map__108921);
var on_chosen = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108921__$1,new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900));
var hover = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108921__$1,new cljs.core.Keyword(null,"hover","hover",-341141711));
var attrs108919 = (function (){var temp__5804__auto__ = (function (){var G__108922 = icon_SINGLEQUOTE_;
if(typeof icon_SINGLEQUOTE_ === 'string'){
return clojure.string.replace(G__108922," ","");
} else {
return G__108922;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var icon_SINGLEQUOTE___$1 = temp__5804__auto__;
return new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"key","key",-1516042587),icon_SINGLEQUOTE___$1,new cljs.core.Keyword(null,"tabIndex","tabIndex",-169286716),"0",new cljs.core.Keyword(null,"title","title",636505583),icon_SINGLEQUOTE___$1,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
var G__108924 = e;
var G__108925 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"tabler-icon","tabler-icon",945975358),new cljs.core.Keyword(null,"id","id",-1388402092),icon_SINGLEQUOTE___$1,new cljs.core.Keyword(null,"name","name",1843675177),icon_SINGLEQUOTE___$1], null);
return (on_chosen.cljs$core$IFn$_invoke$arity$2 ? on_chosen.cljs$core$IFn$_invoke$arity$2(G__108924,G__108925) : on_chosen.call(null,G__108924,G__108925));
}),new cljs.core.Keyword(null,"on-mouse-over","on-mouse-over",-858472552),(function (){
var G__108926 = hover;
if((G__108926 == null)){
return null;
} else {
return cljs.core.reset_BANG_(G__108926,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"tabler-icon","tabler-icon",945975358),new cljs.core.Keyword(null,"id","id",-1388402092),icon_SINGLEQUOTE___$1,new cljs.core.Keyword(null,"name","name",1843675177),icon_SINGLEQUOTE___$1,new cljs.core.Keyword(null,"icon","icon",1679606541),icon_SINGLEQUOTE___$1], null));
}
}),new cljs.core.Keyword(null,"on-mouse-out","on-mouse-out",643448647),(function (){
return cljs.core.List.EMPTY;
})], null);
} else {
return null;
}
})();
return daiquiri.core.create_element("button",((cljs.core.map_QMARK_(attrs108919))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["w-9","h-9","transition-opacity"], null)], null),attrs108919], 0))):{'className':"w-9 h-9 transition-opacity"}),((cljs.core.map_QMARK_(attrs108919))?[daiquiri.interpreter.interpret(frontend.ui.icon(icon_SINGLEQUOTE_,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(24)], null)))]:[daiquiri.interpreter.interpret(attrs108919),daiquiri.interpreter.interpret(frontend.ui.icon(icon_SINGLEQUOTE_,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(24)], null)))]));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.icon/icon-cp");
frontend.components.icon.emoji_cp = rum.core.lazy_build(rum.core.build_defc,(function (p__108948,p__108949){
var map__108950 = p__108948;
var map__108950__$1 = cljs.core.__destructure_map(map__108950);
var emoji = map__108950__$1;
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108950__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108950__$1,new cljs.core.Keyword(null,"name","name",1843675177));
var map__108951 = p__108949;
var map__108951__$1 = cljs.core.__destructure_map(map__108951);
var on_chosen = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108951__$1,new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900));
var hover = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108951__$1,new cljs.core.Keyword(null,"hover","hover",-341141711));
var attrs108947 = (function (){var G__108952 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"tabIndex","tabIndex",-169286716),"0",new cljs.core.Keyword(null,"title","title",636505583),name,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
var G__108954 = e;
var G__108955 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(emoji,new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"emoji","emoji",1031230144));
return (on_chosen.cljs$core$IFn$_invoke$arity$2 ? on_chosen.cljs$core$IFn$_invoke$arity$2(G__108954,G__108955) : on_chosen.call(null,G__108954,G__108955));
})], null);
if((!((hover == null)))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(G__108952,new cljs.core.Keyword(null,"on-mouse-over","on-mouse-over",-858472552),(function (){
return cljs.core.reset_BANG_(hover,emoji);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-mouse-out","on-mouse-out",643448647),(function (){
return cljs.core.List.EMPTY;
})], 0));
} else {
return G__108952;
}
})();
return daiquiri.core.create_element("button",((cljs.core.map_QMARK_(attrs108947))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-2xl","w-9","h-9","transition-opacity"], null)], null),attrs108947], 0))):{'className':"text-2xl w-9 h-9 transition-opacity"}),((cljs.core.map_QMARK_(attrs108947))?[daiquiri.core.create_element("em-emoji",{'id':id,'style':{'lineHeight':(1)}},[])]:[daiquiri.interpreter.interpret(attrs108947),daiquiri.core.create_element("em-emoji",{'id':id,'style':{'lineHeight':(1)}},[])]));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.icon/emoji-cp");
frontend.components.icon.item_render = (function frontend$components$icon$item_render(item,opts){
if(((typeof item === 'string') || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"tabler-icon","tabler-icon",945975358),new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(item))))){
return frontend.components.icon.icon_cp(((typeof item === 'string')?item:new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item)),opts);
} else {
return frontend.components.icon.emoji_cp(item,opts);
}
});
frontend.components.icon.pane_section = rum.core.lazy_build(rum.core.build_defc,(function() { 
var G__109945__delegate = function (label,items,p__108959){
var map__108960 = p__108959;
var map__108960__$1 = cljs.core.__destructure_map(map__108960);
var opts = map__108960__$1;
var searching_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108960__$1,new cljs.core.Keyword(null,"searching?","searching?",1889514722));
var virtual_list_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__108960__$1,new cljs.core.Keyword(null,"virtual-list?","virtual-list?",-1922275028),true);
var _STAR_el_ref = rum.core.use_ref(null);
return daiquiri.core.create_element("div",{'ref':_STAR_el_ref,'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pane-section",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"has-virtual-list","has-virtual-list",-939554329),virtual_list_QMARK_,new cljs.core.Keyword(null,"searching-result","searching-result",-38269107),searching_QMARK_], null)], null))], null))},[daiquiri.core.create_element("div",{'className':"hd px-1 pb-1 leading-none"},[(function (){var attrs108977 = label;
return daiquiri.core.create_element("strong",((cljs.core.map_QMARK_(attrs108977))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-xs","font-medium","text-gray-07","dark:opacity-80"], null)], null),attrs108977], 0))):{'className':"text-xs font-medium text-gray-07 dark:opacity-80"}),((cljs.core.map_QMARK_(attrs108977))?null:[daiquiri.interpreter.interpret(attrs108977)]));
})()]),(cljs.core.truth_(virtual_list_QMARK_)?(function (){var total = cljs.core.count(items);
var step = (9);
var rows = cljs.core.quot(total,step);
var mods = cljs.core.mod(total,step);
var rows__$1 = (((mods === (0)))?rows:(rows + (1)));
var items__$1 = cljs.core.vec(items);
return daiquiri.interpreter.interpret((function (){var G__108991 = (function (){var G__108992 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"total-count","total-count",-1999441386),rows__$1,new cljs.core.Keyword(null,"item-content","item-content",1656730280),(function (idx){
return frontend.components.icon.icons_row((function (){var last_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((rows__$1 - (1)),idx);
var start = (idx * step);
var end = ((idx + (1)) * ((((last_QMARK_) && ((!((mods === (0)))))))?mods:step));
var icons = (function (){try{return cljs.core.subvec.cljs$core$IFn$_invoke$arity$3(items__$1,start,end);
}catch (e109063){if((e109063 instanceof Error)){
var e = e109063;
console.error(e);

return null;
} else {
throw e109063;

}
}})();
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__108957_SHARP_){
return frontend.components.icon.item_render(p1__108957_SHARP_,opts);
}),icons);
})());
})], null);
if(cljs.core.truth_(searching_QMARK_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__108992,new cljs.core.Keyword(null,"custom-scroll-parent","custom-scroll-parent",1031485618),(function (){var G__109066 = rum.core.deref(_STAR_el_ref);
if((G__109066 == null)){
return null;
} else {
return G__109066.closest(".bd-scroll");
}
})());
} else {
return G__108992;
}
})();
return (frontend.ui.virtualized_list.cljs$core$IFn$_invoke$arity$1 ? frontend.ui.virtualized_list.cljs$core$IFn$_invoke$arity$1(G__108991) : frontend.ui.virtualized_list.call(null,G__108991));
})());
})():(function (){var attrs108982 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__108958_SHARP_){
return frontend.components.icon.item_render(p1__108958_SHARP_,opts);
}),items);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs108982))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["its"], null)], null),attrs108982], 0))):{'className':"its"}),((cljs.core.map_QMARK_(attrs108982))?null:[daiquiri.interpreter.interpret(attrs108982)]));
})())]);
};
var G__109945 = function (label,items,var_args){
var p__108959 = null;
if (arguments.length > 2) {
var G__109958__i = 0, G__109958__a = new Array(arguments.length -  2);
while (G__109958__i < G__109958__a.length) {G__109958__a[G__109958__i] = arguments[G__109958__i + 2]; ++G__109958__i;}
  p__108959 = new cljs.core.IndexedSeq(G__109958__a,0,null);
} 
return G__109945__delegate.call(this,label,items,p__108959);};
G__109945.cljs$lang$maxFixedArity = 2;
G__109945.cljs$lang$applyTo = (function (arglist__109960){
var label = cljs.core.first(arglist__109960);
arglist__109960 = cljs.core.next(arglist__109960);
var items = cljs.core.first(arglist__109960);
var p__108959 = cljs.core.rest(arglist__109960);
return G__109945__delegate(label,items,p__108959);
});
G__109945.cljs$core$IFn$_invoke$arity$variadic = G__109945__delegate;
return G__109945;
})()
,null,"frontend.components.icon/pane-section");
frontend.components.icon.emojis_cp = rum.core.lazy_build(rum.core.build_defc,(function (emojis_STAR_,opts){
return frontend.components.icon.pane_section((function (){var G__109077 = "Emojis (%s)";
var G__109078 = cljs.core.count(emojis_STAR_);
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__109077,G__109078) : frontend.util.format.call(null,G__109077,G__109078));
})(),emojis_STAR_,opts);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.icon/emojis-cp");
frontend.components.icon.icons_cp = rum.core.lazy_build(rum.core.build_defc,(function (icons,opts){
return frontend.components.icon.pane_section((function (){var G__109081 = "Icons (%s)";
var G__109082 = cljs.core.count(icons);
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__109081,G__109082) : frontend.util.format.call(null,G__109081,G__109082));
})(),icons,opts);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.icon/icons-cp");
frontend.components.icon.get_used_items = (function frontend$components$icon$get_used_items(){
return frontend.storage.get(new cljs.core.Keyword("ui","ls-icons-used","ui/ls-icons-used",750017965));
});
frontend.components.icon.add_used_item_BANG_ = (function frontend$components$icon$add_used_item_BANG_(m){
var s = (function (){var G__109084 = (function (){var or__5002__auto__ = frontend.components.icon.get_used_items();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentVector.EMPTY;
}
})();
var G__109084__$1 = (((G__109084 == null))?null:cljs.core.take.cljs$core$IFn$_invoke$arity$2((24),G__109084));
var G__109084__$2 = (((G__109084__$1 == null))?null:cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__109083_SHARP_){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(m,p1__109083_SHARP_);
}),G__109084__$1));
if((G__109084__$2 == null)){
return null;
} else {
return cljs.core.cons(m,G__109084__$2);
}
})();
return frontend.storage.set(new cljs.core.Keyword("ui","ls-icons-used","ui/ls-icons-used",750017965),s);
});
frontend.components.icon.all_cp = rum.core.lazy_build(rum.core.build_defc,(function (opts){
var used_items = frontend.components.icon.get_used_items();
var emoji_items = cljs.core.take.cljs$core$IFn$_invoke$arity$2((32),frontend.components.icon.emojis);
var icon_items = cljs.core.take.cljs$core$IFn$_invoke$arity$2((48),frontend.components.icon.get_tabler_icons());
var opts__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"virtual-list?","virtual-list?",-1922275028),false);
var attrs109090 = (cljs.core.truth_(cljs.core.count(used_items))?frontend.components.icon.pane_section("Frequently used",used_items,opts__$1):null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs109090))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["all-pane","pb-10"], null)], null),attrs109090], 0))):{'className':"all-pane pb-10"}),((cljs.core.map_QMARK_(attrs109090))?[frontend.components.icon.pane_section((function (){var G__109108 = "Emojis (%s)";
var G__109109 = cljs.core.count(frontend.components.icon.emojis);
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__109108,G__109109) : frontend.util.format.call(null,G__109108,G__109109));
})(),emoji_items,opts__$1),frontend.components.icon.pane_section((function (){var G__109118 = "Icons (%s)";
var G__109119 = cljs.core.count(frontend.components.icon.get_tabler_icons());
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__109118,G__109119) : frontend.util.format.call(null,G__109118,G__109119));
})(),icon_items,opts__$1)]:[daiquiri.interpreter.interpret(attrs109090),frontend.components.icon.pane_section((function (){var G__109124 = "Emojis (%s)";
var G__109125 = cljs.core.count(frontend.components.icon.emojis);
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__109124,G__109125) : frontend.util.format.call(null,G__109124,G__109125));
})(),emoji_items,opts__$1),frontend.components.icon.pane_section((function (){var G__109128 = "Icons (%s)";
var G__109129 = cljs.core.count(frontend.components.icon.get_tabler_icons());
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__109128,G__109129) : frontend.util.format.call(null,G__109128,G__109129));
})(),icon_items,opts__$1)]));
}),null,"frontend.components.icon/all-cp");
frontend.components.icon.tab_observer = rum.core.lazy_build(rum.core.build_defc,(function (tab,p__109137){
var map__109138 = p__109137;
var map__109138__$1 = cljs.core.__destructure_map(map__109138);
var reset_q_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__109138__$1,new cljs.core.Keyword(null,"reset-q!","reset-q!",1334474852));
logseq.shui.hooks.use_effect_BANG_((function (){
return (reset_q_BANG_.cljs$core$IFn$_invoke$arity$0 ? reset_q_BANG_.cljs$core$IFn$_invoke$arity$0() : reset_q_BANG_.call(null));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [tab], null));

return null;
}),null,"frontend.components.icon/tab-observer");
frontend.components.icon.select_observer = rum.core.lazy_build(rum.core.build_defc,(function (_STAR_input_ref){
var _STAR_el_ref = rum.core.use_ref(null);
var _STAR_items_ref = rum.core.use_ref(cljs.core.PersistentVector.EMPTY);
var _STAR_current_ref = rum.core.use_ref(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(-1)], null));
var set_current_BANG_ = (function (idx,node){
return (_STAR_current_ref.current = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [idx,node], null));
});
var get_cnt = (function (){
var G__109151 = rum.core.deref(_STAR_el_ref);
if((G__109151 == null)){
return null;
} else {
return G__109151.closest(".cp__emoji-icon-picker");
}
});
var focus_BANG_ = (function (idx,dir){
var items = rum.core.deref(_STAR_items_ref);
var popup = (function (){var G__109154 = get_cnt();
if((G__109154 == null)){
return null;
} else {
return G__109154.parentNode;
}
})();
var idx__$1 = (function (){var n = idx;
while(true){
if(cljs.core.nth.cljs$core$IFn$_invoke$arity$3(items,n,null) === false){
var G__109965 = (n + ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(dir,new cljs.core.Keyword(null,"prev","prev",-1597069226)))?(-1):(1)));
n = G__109965;
continue;
} else {
return n;
}
break;
}
})();
var temp__5802__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(items,idx__$1,null);
if(cljs.core.truth_(temp__5802__auto__)){
var node = temp__5802__auto__;
node.focus(({"preventScroll": true, "focusVisible": true}));

node.scrollIntoView(({"block": "center"}));

if(cljs.core.truth_(popup)){
(popup.scrollTop = (0));
} else {
}

return set_current_BANG_(idx__$1,node);
} else {
rum.core.deref(_STAR_input_ref).focus();

return set_current_BANG_((-1),null);
}
});
var down_handler_BANG_ = logseq.shui.hooks.use_callback((function (e){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((13),e.keyCode)){
var G__109239 = cljs.core.second(rum.core.deref(_STAR_current_ref));
if((G__109239 == null)){
return null;
} else {
return G__109239.click();
}
} else {
var vec__109254 = rum.core.deref(_STAR_current_ref);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__109254,(0),null);
var _node = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__109254,(1),null);
var G__109258 = e.keyCode;
switch (G__109258) {
case (37):
return focus_BANG_((idx - (1)),new cljs.core.Keyword(null,"prev","prev",-1597069226));

break;
case (9):
case (39):
return focus_BANG_((idx + (1)),new cljs.core.Keyword(null,"next","next",-117701485));

break;
case (38):
focus_BANG_((idx - (9)),new cljs.core.Keyword(null,"prev","prev",-1597069226));

return frontend.util.stop(e);

break;
case (40):
focus_BANG_((idx + (9)),new cljs.core.Keyword(null,"next","next",-117701485));

return frontend.util.stop(e);

break;
default:
return new cljs.core.Keyword(null,"dune","dune",1737226819);

}
}
}),cljs.core.PersistentVector.EMPTY);
logseq.shui.hooks.use_effect_BANG_((function (){
var sections_109970 = get_cnt().querySelectorAll(".pane-section");
var items_109971 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__109139_SHARP_){
var G__109274 = p1__109139_SHARP_.querySelectorAll(".its > button");
var G__109274__$1 = (((G__109274 == null))?null:Array.from(G__109274));
if((G__109274__$1 == null)){
return null;
} else {
return cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$1(G__109274__$1);
}
}),sections_109970);
var step_109972 = (9);
var items_109973__$1 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__109140_SHARP_){
var count = cljs.core.count(p1__109140_SHARP_);
var m = cljs.core.mod(count,step_109972);
if((m > (0))){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(p1__109140_SHARP_,cljs.core.repeat.cljs$core$IFn$_invoke$arity$2((step_109972 - m),false));
} else {
return p1__109140_SHARP_;
}
}),items_109971);
(_STAR_items_ref.current = cljs.core.flatten(items_109973__$1));

focus_BANG_((0),new cljs.core.Keyword(null,"next","next",-117701485));

var cnt = get_cnt();
cnt.addEventListener("keydown",down_handler_BANG_,false);

return (function (){
return cnt.removeEventListener("keydown",down_handler_BANG_);
});
}),cljs.core.PersistentVector.EMPTY);

return daiquiri.core.create_element("span",{'ref':_STAR_el_ref,'className':"absolute hidden"},[]);
}),null,"frontend.components.icon/select-observer");
frontend.components.icon.color_picker = rum.core.lazy_build(rum.core.build_defc,(function (_STAR_color,on_select_BANG_){
var vec__109282 = rum.core.use_state(cljs.core.deref(_STAR_color));
var color = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__109282,(0),null);
var set_color_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__109282,(1),null);
var _STAR_el = rum.core.use_ref(null);
var content_fn = (function (){
var colors = new cljs.core.PersistentVector(null, 9, 5, cljs.core.PersistentVector.EMPTY_NODE, ["#6e7b8b","#5e69d2","#00b5ed","#00b55b","#f2be00","#e47a00","#f38e81","#fb434c",null], null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.color-picker-presets","div.color-picker-presets",-143418367),(function (){var iter__5480__auto__ = (function frontend$components$icon$iter__109285(s__109286){
return (new cljs.core.LazySeq(null,(function (){
var s__109286__$1 = s__109286;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__109286__$1);
if(temp__5804__auto__){
var s__109286__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__109286__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__109286__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__109288 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__109287 = (0);
while(true){
if((i__109287 < size__5479__auto__)){
var c = cljs.core._nth(c__5478__auto__,i__109287);
cljs.core.chunk_append(b__109288,(function (){var G__109332 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__109287,c,c__5478__auto__,size__5479__auto__,b__109288,s__109286__$2,temp__5804__auto__,colors,vec__109282,color,set_color_BANG_,_STAR_el){
return (function (){
(set_color_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_color_BANG_.cljs$core$IFn$_invoke$arity$1(c) : set_color_BANG_.call(null,c));

var G__109335_109976 = on_select_BANG_;
if((G__109335_109976 == null)){
} else {
cljs.core.apply.cljs$core$IFn$_invoke$arity$2(G__109335_109976,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [c], null));
}

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
});})(i__109287,c,c__5478__auto__,size__5479__auto__,b__109288,s__109286__$2,temp__5804__auto__,colors,vec__109282,color,set_color_BANG_,_STAR_el))
,new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"outline","outline",793464534),new cljs.core.Keyword(null,"class","class",-2030961996),"it",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"background-color","background-color",570434026),c], null)], null);
var G__109333 = (cljs.core.truth_(c)?"":logseq.shui.ui.tabler_icon("minus",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"scale-75 opacity-70"], null)));
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__109332,G__109333) : logseq.shui.ui.button.call(null,G__109332,G__109333));
})());

var G__109978 = (i__109287 + (1));
i__109287 = G__109978;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__109288),frontend$components$icon$iter__109285(cljs.core.chunk_rest(s__109286__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__109288),null);
}
} else {
var c = cljs.core.first(s__109286__$2);
return cljs.core.cons((function (){var G__109343 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (c,s__109286__$2,temp__5804__auto__,colors,vec__109282,color,set_color_BANG_,_STAR_el){
return (function (){
(set_color_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_color_BANG_.cljs$core$IFn$_invoke$arity$1(c) : set_color_BANG_.call(null,c));

var G__109345_109980 = on_select_BANG_;
if((G__109345_109980 == null)){
} else {
cljs.core.apply.cljs$core$IFn$_invoke$arity$2(G__109345_109980,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [c], null));
}

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
});})(c,s__109286__$2,temp__5804__auto__,colors,vec__109282,color,set_color_BANG_,_STAR_el))
,new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"outline","outline",793464534),new cljs.core.Keyword(null,"class","class",-2030961996),"it",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"background-color","background-color",570434026),c], null)], null);
var G__109344 = (cljs.core.truth_(c)?"":logseq.shui.ui.tabler_icon("minus",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"scale-75 opacity-70"], null)));
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__109343,G__109344) : logseq.shui.ui.button.call(null,G__109343,G__109344));
})(),frontend$components$icon$iter__109285(cljs.core.rest(s__109286__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(colors);
})()], null);
});
logseq.shui.hooks.use_effect_BANG_((function (){
var temp__5804__auto___109985 = (function (){var G__109357 = rum.core.deref(_STAR_el);
if((G__109357 == null)){
return null;
} else {
return G__109357.closest(".cp__emoji-icon-picker");
}
})();
if(cljs.core.truth_(temp__5804__auto___109985)){
var picker_109986 = temp__5804__auto___109985;
var color_109987__$1 = ((clojure.string.blank_QMARK_(color))?"inherit":color);
picker_109986.style.setProperty("--ls-color-icon-preset",color_109987__$1);

frontend.storage.set(new cljs.core.Keyword(null,"ls-icon-color-preset","ls-icon-color-preset",-574354162),color_109987__$1);
} else {
}

return cljs.core.reset_BANG_(_STAR_color,color);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [color], null));

return daiquiri.interpreter.interpret((function (){var G__109372 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_el,new cljs.core.Keyword(null,"class","class",-2030961996),"color-picker",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
var G__109376 = e.target;
var G__109377 = content_fn;
var G__109378 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"side-offset","side-offset",207149931),(6)], null)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__109376,G__109377,G__109378) : logseq.shui.ui.popup_show_BANG_.call(null,G__109376,G__109377,G__109378));
}),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"outline","outline",793464534)], null);
var G__109373 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong","strong",269529000),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color","color",1011675173),(function (){var or__5002__auto__ = color;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "inherit";
}
})()], null)], null),logseq.shui.ui.tabler_icon("palette")], null);
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__109372,G__109373) : logseq.shui.ui.button.call(null,G__109372,G__109373));
})());
}),null,"frontend.components.icon/color-picker");
frontend.components.icon.icon_search = rum.core.lazy_build(rum.core.build_defcs,(function (state,p__109403){
var map__109409 = p__109403;
var map__109409__$1 = cljs.core.__destructure_map(map__109409);
var opts = map__109409__$1;
var on_chosen = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__109409__$1,new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900));
var del_btn_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__109409__$1,new cljs.core.Keyword(null,"del-btn?","del-btn?",-1094924362));
var icon_value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__109409__$1,new cljs.core.Keyword(null,"icon-value","icon-value",-510636889));
var _STAR_q = new cljs.core.Keyword("frontend.components.icon","q","frontend.components.icon/q",-443560690).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_result = new cljs.core.Keyword("frontend.components.icon","result","frontend.components.icon/result",-505929638).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_tab = new cljs.core.Keyword("frontend.components.icon","tab","frontend.components.icon/tab",1411774210).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_color = new cljs.core.Keyword("frontend.components.icon","color","frontend.components.icon/color",1607363474).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_input_ref = rum.core.create_ref();
var _STAR_result_ref = rum.core.create_ref();
var result = cljs.core.deref(_STAR_result);
var opts__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),(function (e,m){
var icon_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(m),new cljs.core.Keyword(null,"tabler-icon","tabler-icon",945975358));
var m__$1 = ((((icon_QMARK_) && ((!(clojure.string.blank_QMARK_(cljs.core.deref(_STAR_color)))))))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword(null,"color","color",1011675173),cljs.core.deref(_STAR_color)):m);
var and__5000__auto___109988 = on_chosen;
if(cljs.core.truth_(and__5000__auto___109988)){
(on_chosen.cljs$core$IFn$_invoke$arity$2 ? on_chosen.cljs$core$IFn$_invoke$arity$2(e,m__$1) : on_chosen.call(null,e,m__$1));
} else {
}

if(cljs.core.truth_(new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(m__$1))){
return frontend.components.icon.add_used_item_BANG_(m__$1);
} else {
return null;
}
}));
var _STAR_select_mode_QMARK_ = new cljs.core.Keyword("frontend.components.icon","select-mode?","frontend.components.icon/select-mode?",-1815830707).cljs$core$IFn$_invoke$arity$1(state);
var reset_q_BANG_ = (function (){
var temp__5804__auto__ = rum.core.deref(_STAR_input_ref);
if(cljs.core.truth_(temp__5804__auto__)){
var input = temp__5804__auto__;
cljs.core.reset_BANG_(_STAR_q,"");

cljs.core.reset_BANG_(_STAR_result,cljs.core.PersistentArrayMap.EMPTY);

cljs.core.reset_BANG_(_STAR_select_mode_QMARK_,false);

(input.value = "");

var G__109435 = (function (){
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(document.activeElement,input)){
input.focus();
} else {
}

return frontend.util.scroll_to.cljs$core$IFn$_invoke$arity$3(rum.core.deref(_STAR_result_ref),(0),false);
});
return (frontend.util.schedule.cljs$core$IFn$_invoke$arity$1 ? frontend.util.schedule.cljs$core$IFn$_invoke$arity$1(G__109435) : frontend.util.schedule.call(null,G__109435));
} else {
return null;
}
});
return daiquiri.core.create_element("div",{'data-keep-selection':true,'className':"cp__emoji-icon-picker"},[daiquiri.core.create_element("div",{'className':"hd bg-popover"},[frontend.components.icon.tab_observer(cljs.core.deref(_STAR_tab),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"reset-q!","reset-q!",1334474852),reset_q_BANG_], null)),(cljs.core.truth_(cljs.core.deref(_STAR_select_mode_QMARK_))?frontend.components.icon.select_observer(_STAR_input_ref):null),(function (){var attrs109439 = logseq.shui.ui.tabler_icon("search",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(16)], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs109439))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["search-input"], null)], null),attrs109439], 0))):{'className':"search-input"}),((cljs.core.map_QMARK_(attrs109439))?[daiquiri.interpreter.interpret(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var G__109441 = new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"auto-focus","auto-focus",1250006231),true,new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_input_ref,new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),(function (){var G__109442 = "Search %s items";
var G__109443 = clojure.string.lower_case(cljs.core.name(cljs.core.deref(_STAR_tab)));
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__109442,G__109443) : frontend.util.format.call(null,G__109442,G__109443));
})(),new cljs.core.Keyword(null,"default-value","default-value",232220170),"",new cljs.core.Keyword(null,"on-focus","on-focus",-13737624),(function (){
return cljs.core.reset_BANG_(_STAR_select_mode_QMARK_,false);
}),new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (e){
var G__109445 = e.keyCode;
switch (G__109445) {
case (27):
frontend.util.stop(e);

if(clojure.string.blank_QMARK_(cljs.core.deref(_STAR_q))){
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
} else {
return reset_q_BANG_();
}

break;
case (38):
return frontend.util.stop(e);

break;
case (9):
case (40):
cljs.core.reset_BANG_(_STAR_select_mode_QMARK_,true);

return frontend.util.stop(e);

break;
default:
return new cljs.core.Keyword(null,"dune","dune",1737226819);

}
}),new cljs.core.Keyword(null,"on-change","on-change",-732046149),goog.functions.debounce((function (e){
cljs.core.reset_BANG_(_STAR_q,frontend.util.evalue(e));

cljs.core.reset_BANG_(_STAR_select_mode_QMARK_,false);

if(clojure.string.blank_QMARK_(cljs.core.deref(_STAR_q))){
return cljs.core.reset_BANG_(_STAR_result,cljs.core.PersistentArrayMap.EMPTY);
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.components.icon.search(cljs.core.deref(_STAR_q),cljs.core.deref(_STAR_tab))),(function (result__$1){
return promesa.protocols._promise(cljs.core.reset_BANG_(_STAR_result,result__$1));
}));
}));
}
}),(200))], null);
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__109441) : logseq.shui.ui.input.call(null,G__109441));
})()], null)),((clojure.string.blank_QMARK_(cljs.core.deref(_STAR_q)))?null:daiquiri.core.create_element("a",{'onClick':reset_q_BANG_,'className':"x"},[daiquiri.interpreter.interpret(logseq.shui.ui.tabler_icon("x",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(14)], null)))]))]:[daiquiri.interpreter.interpret(attrs109439),daiquiri.interpreter.interpret(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var G__109449 = new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"auto-focus","auto-focus",1250006231),true,new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_input_ref,new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),(function (){var G__109450 = "Search %s items";
var G__109451 = clojure.string.lower_case(cljs.core.name(cljs.core.deref(_STAR_tab)));
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__109450,G__109451) : frontend.util.format.call(null,G__109450,G__109451));
})(),new cljs.core.Keyword(null,"default-value","default-value",232220170),"",new cljs.core.Keyword(null,"on-focus","on-focus",-13737624),(function (){
return cljs.core.reset_BANG_(_STAR_select_mode_QMARK_,false);
}),new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (e){
var G__109454 = e.keyCode;
switch (G__109454) {
case (27):
frontend.util.stop(e);

if(clojure.string.blank_QMARK_(cljs.core.deref(_STAR_q))){
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
} else {
return reset_q_BANG_();
}

break;
case (38):
return frontend.util.stop(e);

break;
case (9):
case (40):
cljs.core.reset_BANG_(_STAR_select_mode_QMARK_,true);

return frontend.util.stop(e);

break;
default:
return new cljs.core.Keyword(null,"dune","dune",1737226819);

}
}),new cljs.core.Keyword(null,"on-change","on-change",-732046149),goog.functions.debounce((function (e){
cljs.core.reset_BANG_(_STAR_q,frontend.util.evalue(e));

cljs.core.reset_BANG_(_STAR_select_mode_QMARK_,false);

if(clojure.string.blank_QMARK_(cljs.core.deref(_STAR_q))){
return cljs.core.reset_BANG_(_STAR_result,cljs.core.PersistentArrayMap.EMPTY);
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.components.icon.search(cljs.core.deref(_STAR_q),cljs.core.deref(_STAR_tab))),(function (result__$1){
return promesa.protocols._promise(cljs.core.reset_BANG_(_STAR_result,result__$1));
}));
}));
}
}),(200))], null);
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__109449) : logseq.shui.ui.input.call(null,G__109449));
})()], null)),((clojure.string.blank_QMARK_(cljs.core.deref(_STAR_q)))?null:daiquiri.core.create_element("a",{'onClick':reset_q_BANG_,'className':"x"},[daiquiri.interpreter.interpret(logseq.shui.ui.tabler_icon("x",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(14)], null)))]))]));
})()]),daiquiri.core.create_element("div",{'ref':_STAR_result_ref,'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["bd","bd-scroll",(function (){var or__5002__auto__ = (function (){var G__109484 = cljs.core.deref(_STAR_tab);
if((G__109484 == null)){
return null;
} else {
return cljs.core.name(G__109484);
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "other";
}
})()], null))},[(function (){var attrs109531 = ((cljs.core.seq(result))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-1.flex-col.gap-1.search-result","div.flex.flex-1.flex-col.gap-1.search-result",761669577),(function (){var matched = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"emojis","emojis",-2098458463).cljs$core$IFn$_invoke$arity$1(result),new cljs.core.Keyword(null,"icons","icons",-297140977).cljs$core$IFn$_invoke$arity$1(result));
if(cljs.core.seq(matched)){
return frontend.components.icon.pane_section((function (){var G__109545 = "Matched (%s)";
var G__109546 = cljs.core.count(matched);
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__109545,G__109546) : frontend.util.format.call(null,G__109545,G__109546));
})(),matched,opts__$1);
} else {
return null;
}
})()], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-1.flex-col.gap-1","div.flex.flex-1.flex-col.gap-1",742206800),(function (){var G__109549 = cljs.core.deref(_STAR_tab);
var G__109549__$1 = (((G__109549 instanceof cljs.core.Keyword))?G__109549.fqn:null);
switch (G__109549__$1) {
case "emoji":
return frontend.components.icon.emojis_cp(frontend.components.icon.emojis,opts__$1);

break;
case "icon":
return frontend.components.icon.icons_cp(frontend.components.icon.get_tabler_icons(),opts__$1);

break;
default:
return frontend.components.icon.all_cp(opts__$1);

}
})()], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs109531))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["content-pane"], null)], null),attrs109531], 0))):{'className':"content-pane"}),((cljs.core.map_QMARK_(attrs109531))?null:[daiquiri.interpreter.interpret(attrs109531)]));
})()]),daiquiri.core.create_element("div",{'className':"ft"},[daiquiri.core.create_element(daiquiri.core.fragment,null,[(function (){var attrs109779 = (function (){var tabs = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"all","all",892129742),"All"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"emoji","emoji",1031230144),"Emojis"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"icon","icon",1679606541),"Icons"], null)], null);
var iter__5480__auto__ = (function frontend$components$icon$iter__109785(s__109786){
return (new cljs.core.LazySeq(null,(function (){
var s__109786__$1 = s__109786;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__109786__$1);
if(temp__5804__auto__){
var s__109786__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__109786__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__109786__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__109788 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__109787 = (0);
while(true){
if((i__109787 < size__5479__auto__)){
var vec__109791 = cljs.core._nth(c__5478__auto__,i__109787);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__109791,(0),null);
var label = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__109791,(1),null);
var active_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(_STAR_tab),id);
cljs.core.chunk_append(b__109788,(function (){var G__109796 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"class","class",-2030961996),frontend.util.classnames(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"active","active",1895962068),active_QMARK_], null),"tab-item"], null)),new cljs.core.Keyword(null,"on-mouse-down","on-mouse-down",1147755470),((function (i__109787,active_QMARK_,vec__109791,id,label,c__5478__auto__,size__5479__auto__,b__109788,s__109786__$2,temp__5804__auto__,tabs,_STAR_q,_STAR_result,_STAR_tab,_STAR_color,_STAR_input_ref,_STAR_result_ref,result,opts__$1,_STAR_select_mode_QMARK_,reset_q_BANG_,map__109409,map__109409__$1,opts,on_chosen,del_btn_QMARK_,icon_value){
return (function (e){
frontend.util.stop(e);

return cljs.core.reset_BANG_(_STAR_tab,id);
});})(i__109787,active_QMARK_,vec__109791,id,label,c__5478__auto__,size__5479__auto__,b__109788,s__109786__$2,temp__5804__auto__,tabs,_STAR_q,_STAR_result,_STAR_tab,_STAR_color,_STAR_input_ref,_STAR_result_ref,result,opts__$1,_STAR_select_mode_QMARK_,reset_q_BANG_,map__109409,map__109409__$1,opts,on_chosen,del_btn_QMARK_,icon_value))
], null);
var G__109797 = label;
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__109796,G__109797) : logseq.shui.ui.button.call(null,G__109796,G__109797));
})());

var G__110011 = (i__109787 + (1));
i__109787 = G__110011;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__109788),frontend$components$icon$iter__109785(cljs.core.chunk_rest(s__109786__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__109788),null);
}
} else {
var vec__109800 = cljs.core.first(s__109786__$2);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__109800,(0),null);
var label = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__109800,(1),null);
var active_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(_STAR_tab),id);
return cljs.core.cons((function (){var G__109803 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"class","class",-2030961996),frontend.util.classnames(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"active","active",1895962068),active_QMARK_], null),"tab-item"], null)),new cljs.core.Keyword(null,"on-mouse-down","on-mouse-down",1147755470),((function (active_QMARK_,vec__109800,id,label,s__109786__$2,temp__5804__auto__,tabs,_STAR_q,_STAR_result,_STAR_tab,_STAR_color,_STAR_input_ref,_STAR_result_ref,result,opts__$1,_STAR_select_mode_QMARK_,reset_q_BANG_,map__109409,map__109409__$1,opts,on_chosen,del_btn_QMARK_,icon_value){
return (function (e){
frontend.util.stop(e);

return cljs.core.reset_BANG_(_STAR_tab,id);
});})(active_QMARK_,vec__109800,id,label,s__109786__$2,temp__5804__auto__,tabs,_STAR_q,_STAR_result,_STAR_tab,_STAR_color,_STAR_input_ref,_STAR_result_ref,result,opts__$1,_STAR_select_mode_QMARK_,reset_q_BANG_,map__109409,map__109409__$1,opts,on_chosen,del_btn_QMARK_,icon_value))
], null);
var G__109804 = label;
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__109803,G__109804) : logseq.shui.ui.button.call(null,G__109803,G__109804));
})(),frontend$components$icon$iter__109785(cljs.core.rest(s__109786__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(tabs);
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs109779))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-1","flex-row","items-center","gap-2"], null)], null),attrs109779], 0))):{'className':"flex flex-1 flex-row items-center gap-2"}),((cljs.core.map_QMARK_(attrs109779))?null:[daiquiri.interpreter.interpret(attrs109779)]));
})(),((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"emoji","emoji",1031230144),cljs.core.deref(_STAR_tab)))?frontend.components.icon.color_picker(_STAR_color,(function (c){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"tabler-icon","tabler-icon",945975358),(function (){var G__109812 = icon_value;
if((G__109812 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(G__109812);
}
})())){
var G__109813 = null;
var G__109814 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(icon_value,new cljs.core.Keyword(null,"color","color",1011675173),c);
var G__109815 = true;
return (on_chosen.cljs$core$IFn$_invoke$arity$3 ? on_chosen.cljs$core$IFn$_invoke$arity$3(G__109813,G__109814,G__109815) : on_chosen.call(null,G__109813,G__109814,G__109815));
} else {
return null;
}
})):null),(cljs.core.truth_(del_btn_QMARK_)?daiquiri.interpreter.interpret((function (){var G__109819 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"outline","outline",793464534),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"data-action","data-action",821237678),"del",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (on_chosen.cljs$core$IFn$_invoke$arity$1 ? on_chosen.cljs$core$IFn$_invoke$arity$1(null) : on_chosen.call(null,null));
})], null);
var G__109820 = logseq.shui.ui.tabler_icon("trash",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(17)], null));
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__109819,G__109820) : logseq.shui.ui.button.call(null,G__109819,G__109820));
})()):null)])])]);
}),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.local.cljs$core$IFn$_invoke$arity$2("",new cljs.core.Keyword("frontend.components.icon","q","frontend.components.icon/q",-443560690)),rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.icon","result","frontend.components.icon/result",-505929638)),rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.components.icon","select-mode?","frontend.components.icon/select-mode?",-1815830707)),rum.core.local.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"all","all",892129742),new cljs.core.Keyword("frontend.components.icon","tab","frontend.components.icon/tab",1411774210)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (s){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(s,new cljs.core.Keyword("frontend.components.icon","color","frontend.components.icon/color",1607363474),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(frontend.storage.get(new cljs.core.Keyword(null,"ls-icon-color-preset","ls-icon-color-preset",-574354162))));
})], null)], null),"frontend.components.icon/icon-search");
frontend.components.icon.icon_picker = rum.core.lazy_build(rum.core.build_defc,(function (icon_value,p__109829){
var map__109831 = p__109829;
var map__109831__$1 = cljs.core.__destructure_map(map__109831);
var empty_label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__109831__$1,new cljs.core.Keyword(null,"empty-label","empty-label",-288358384));
var disabled_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__109831__$1,new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181));
var initial_open_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__109831__$1,new cljs.core.Keyword(null,"initial-open?","initial-open?",1869534108));
var del_btn_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__109831__$1,new cljs.core.Keyword(null,"del-btn?","del-btn?",-1094924362));
var on_chosen = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__109831__$1,new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900));
var icon_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__109831__$1,new cljs.core.Keyword(null,"icon-props","icon-props",-895221875));
var popup_opts = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__109831__$1,new cljs.core.Keyword(null,"popup-opts","popup-opts",-1667184839));
var button_opts = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__109831__$1,new cljs.core.Keyword(null,"button-opts","button-opts",1112045560));
var _STAR_trigger_ref = rum.core.use_ref(null);
var content_fn = ((frontend.config.publishing_QMARK_)?cljs.core.constantly(cljs.core.PersistentVector.EMPTY):(function (p__109834){
var map__109835 = p__109834;
var map__109835__$1 = cljs.core.__destructure_map(map__109835);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__109835__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
return frontend.components.icon.icon_search(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),(function (e,icon_value__$1,keep_popup_QMARK_){
(on_chosen.cljs$core$IFn$_invoke$arity$2 ? on_chosen.cljs$core$IFn$_invoke$arity$2(e,icon_value__$1) : on_chosen.call(null,e,icon_value__$1));

if(keep_popup_QMARK_ === true){
return null;
} else {
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1(id) : logseq.shui.ui.popup_hide_BANG_.call(null,id));
}
}),new cljs.core.Keyword(null,"icon-value","icon-value",-510636889),icon_value,new cljs.core.Keyword(null,"del-btn?","del-btn?",-1094924362),del_btn_QMARK_], null));
}));
logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core.truth_(initial_open_QMARK_)){
return setTimeout((function (){
var G__109840 = rum.core.deref(_STAR_trigger_ref);
if((G__109840 == null)){
return null;
} else {
return G__109840.click();
}
}),(32));
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [initial_open_QMARK_], null));

var has_icon_QMARK_ = (!((icon_value == null)));
return daiquiri.interpreter.interpret((function (){var G__109853 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_trigger_ref,new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"class","class",-2030961996),((has_icon_QMARK_)?"px-1 leading-none text-muted-foreground hover:text-foreground":"font-normal text-sm px-[0.5px] text-muted-foreground hover:text-foreground"),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
if(cljs.core.truth_(disabled_QMARK_)){
return null;
} else {
var G__109871 = e.target;
var G__109872 = content_fn;
var G__109873 = medley.core.deep_merge.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"start","start",-355208981),new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"ls-icon-picker","ls-icon-picker",1363108390),new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"ls-icon-picker",new cljs.core.Keyword(null,"onEscapeKeyDown","onEscapeKeyDown",1908839912),(function (p1__109828_SHARP_){
return p1__109828_SHARP_.preventDefault();
})], null)], null),popup_opts);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__109871,G__109872,G__109873) : logseq.shui.ui.popup_show_BANG_.call(null,G__109871,G__109872,G__109873));
}
})], null),button_opts], 0));
var G__109854 = ((has_icon_QMARK_)?((cljs.core.vector_QMARK_(icon_value))?icon_value:frontend.components.icon.icon.cljs$core$IFn$_invoke$arity$variadic(icon_value,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color?","color?",-1891974356),true], null),icon_props], 0))], 0))):(function (){var or__5002__auto__ = empty_label;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "Empty";
}
})());
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__109853,G__109854) : logseq.shui.ui.button.call(null,G__109853,G__109854));
})());
}),null,"frontend.components.icon/icon-picker");

//# sourceMappingURL=frontend.components.icon.js.map
