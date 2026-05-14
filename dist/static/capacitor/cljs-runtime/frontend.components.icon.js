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
var len__5726__auto___68059 = arguments.length;
var i__5727__auto___68060 = (0);
while(true){
if((i__5727__auto___68060 < len__5726__auto___68059)){
args__5732__auto__.push((arguments[i__5727__auto___68060]));

var G__68061 = (i__5727__auto___68060 + (1));
i__5727__auto___68060 = G__68061;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.components.icon.icon.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.components.icon.icon.cljs$core$IFn$_invoke$arity$variadic = (function (icon_SINGLEQUOTE_,p__67696){
var vec__67697 = p__67696;
var opts = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67697,(0),null);
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
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.inline-flex.items-center.ls-icon-color-wrap","span.inline-flex.items-center.ls-icon-color-wrap",1409953162),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color","color",1011675173),(function (){var or__5002__auto__ = (function (){var G__67706 = icon_SINGLEQUOTE___$1;
if((G__67706 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"color","color",1011675173).cljs$core$IFn$_invoke$arity$1(G__67706);
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
(frontend.components.icon.icon.cljs$lang$applyTo = (function (seq67674){
var G__67676 = cljs.core.first(seq67674);
var seq67674__$1 = cljs.core.next(seq67674);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__67676,seq67674__$1);
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
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
var G__67728 = frontend.components.icon.get_tabler_icons();
var G__67729 = q;
var G__67730 = new cljs.core.Keyword(null,"limit","limit",-1355822363);
var G__67731 = (100);
return (frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$4 ? frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$4(G__67728,G__67729,G__67730,G__67731) : frontend.search.fuzzy_search.call(null,G__67728,G__67729,G__67730,G__67731));
});
frontend.components.icon.search = (function frontend$components$icon$search(q,tab){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(tab,new cljs.core.Keyword(null,"emoji","emoji",1031230144)))?frontend.components.icon.search_tabler_icons(q):null)),(function (icons){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(tab,new cljs.core.Keyword(null,"icon","icon",1679606541)))?frontend.components.icon.search_emojis(q):null)),(function (emojis_SINGLEQUOTE_){
return promesa.protocols._promise(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"icons","icons",-297140977),icons,new cljs.core.Keyword(null,"emojis","emojis",-2098458463),emojis_SINGLEQUOTE_], null));
}));
}));
}));
});
frontend.components.icon.icons_row = rum.core.lazy_build(rum.core.build_defc,(function (items){
var attrs67737 = items;
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs67737))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["its","icons-row"], null)], null),attrs67737], 0))):{'className':"its icons-row"}),((cljs.core.map_QMARK_(attrs67737))?null:[daiquiri.interpreter.interpret(attrs67737)]));
}),null,"frontend.components.icon/icons-row");
frontend.components.icon.icon_cp = rum.core.lazy_build(rum.core.build_defc,(function (icon_SINGLEQUOTE_,p__67750){
var map__67751 = p__67750;
var map__67751__$1 = cljs.core.__destructure_map(map__67751);
var on_chosen = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67751__$1,new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900));
var hover = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67751__$1,new cljs.core.Keyword(null,"hover","hover",-341141711));
var attrs67748 = (function (){var temp__5804__auto__ = (function (){var G__67752 = icon_SINGLEQUOTE_;
if(typeof icon_SINGLEQUOTE_ === 'string'){
return clojure.string.replace(G__67752," ","");
} else {
return G__67752;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var icon_SINGLEQUOTE___$1 = temp__5804__auto__;
return new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"key","key",-1516042587),icon_SINGLEQUOTE___$1,new cljs.core.Keyword(null,"tabIndex","tabIndex",-169286716),"0",new cljs.core.Keyword(null,"title","title",636505583),icon_SINGLEQUOTE___$1,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
var G__67753 = e;
var G__67754 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"tabler-icon","tabler-icon",945975358),new cljs.core.Keyword(null,"id","id",-1388402092),icon_SINGLEQUOTE___$1,new cljs.core.Keyword(null,"name","name",1843675177),icon_SINGLEQUOTE___$1], null);
return (on_chosen.cljs$core$IFn$_invoke$arity$2 ? on_chosen.cljs$core$IFn$_invoke$arity$2(G__67753,G__67754) : on_chosen.call(null,G__67753,G__67754));
}),new cljs.core.Keyword(null,"on-mouse-over","on-mouse-over",-858472552),(function (){
var G__67755 = hover;
if((G__67755 == null)){
return null;
} else {
return cljs.core.reset_BANG_(G__67755,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"tabler-icon","tabler-icon",945975358),new cljs.core.Keyword(null,"id","id",-1388402092),icon_SINGLEQUOTE___$1,new cljs.core.Keyword(null,"name","name",1843675177),icon_SINGLEQUOTE___$1,new cljs.core.Keyword(null,"icon","icon",1679606541),icon_SINGLEQUOTE___$1], null));
}
}),new cljs.core.Keyword(null,"on-mouse-out","on-mouse-out",643448647),(function (){
return cljs.core.List.EMPTY;
})], null);
} else {
return null;
}
})();
return daiquiri.core.create_element("button",((cljs.core.map_QMARK_(attrs67748))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["w-9","h-9","transition-opacity"], null)], null),attrs67748], 0))):{'className':"w-9 h-9 transition-opacity"}),((cljs.core.map_QMARK_(attrs67748))?[daiquiri.interpreter.interpret(frontend.ui.icon(icon_SINGLEQUOTE_,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(24)], null)))]:[daiquiri.interpreter.interpret(attrs67748),daiquiri.interpreter.interpret(frontend.ui.icon(icon_SINGLEQUOTE_,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(24)], null)))]));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.icon/icon-cp");
frontend.components.icon.emoji_cp = rum.core.lazy_build(rum.core.build_defc,(function (p__67767,p__67768){
var map__67769 = p__67767;
var map__67769__$1 = cljs.core.__destructure_map(map__67769);
var emoji = map__67769__$1;
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67769__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67769__$1,new cljs.core.Keyword(null,"name","name",1843675177));
var map__67770 = p__67768;
var map__67770__$1 = cljs.core.__destructure_map(map__67770);
var on_chosen = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67770__$1,new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900));
var hover = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67770__$1,new cljs.core.Keyword(null,"hover","hover",-341141711));
var attrs67766 = (function (){var G__67771 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"tabIndex","tabIndex",-169286716),"0",new cljs.core.Keyword(null,"title","title",636505583),name,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
var G__67772 = e;
var G__67773 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(emoji,new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"emoji","emoji",1031230144));
return (on_chosen.cljs$core$IFn$_invoke$arity$2 ? on_chosen.cljs$core$IFn$_invoke$arity$2(G__67772,G__67773) : on_chosen.call(null,G__67772,G__67773));
})], null);
if((!((hover == null)))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(G__67771,new cljs.core.Keyword(null,"on-mouse-over","on-mouse-over",-858472552),(function (){
return cljs.core.reset_BANG_(hover,emoji);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-mouse-out","on-mouse-out",643448647),(function (){
return cljs.core.List.EMPTY;
})], 0));
} else {
return G__67771;
}
})();
return daiquiri.core.create_element("button",((cljs.core.map_QMARK_(attrs67766))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-2xl","w-9","h-9","transition-opacity"], null)], null),attrs67766], 0))):{'className':"text-2xl w-9 h-9 transition-opacity"}),((cljs.core.map_QMARK_(attrs67766))?[daiquiri.core.create_element("em-emoji",{'id':id,'style':{'lineHeight':(1)}},[])]:[daiquiri.interpreter.interpret(attrs67766),daiquiri.core.create_element("em-emoji",{'id':id,'style':{'lineHeight':(1)}},[])]));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.icon/emoji-cp");
frontend.components.icon.item_render = (function frontend$components$icon$item_render(item,opts){
if(((typeof item === 'string') || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"tabler-icon","tabler-icon",945975358),new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(item))))){
return frontend.components.icon.icon_cp(((typeof item === 'string')?item:new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item)),opts);
} else {
return frontend.components.icon.emoji_cp(item,opts);
}
});
frontend.components.icon.pane_section = rum.core.lazy_build(rum.core.build_defc,(function() { 
var G__68144__delegate = function (label,items,p__67776){
var map__67777 = p__67776;
var map__67777__$1 = cljs.core.__destructure_map(map__67777);
var opts = map__67777__$1;
var searching_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67777__$1,new cljs.core.Keyword(null,"searching?","searching?",1889514722));
var virtual_list_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__67777__$1,new cljs.core.Keyword(null,"virtual-list?","virtual-list?",-1922275028),true);
var _STAR_el_ref = rum.core.use_ref(null);
return daiquiri.core.create_element("div",{'ref':_STAR_el_ref,'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pane-section",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"has-virtual-list","has-virtual-list",-939554329),virtual_list_QMARK_,new cljs.core.Keyword(null,"searching-result","searching-result",-38269107),searching_QMARK_], null)], null))], null))},[daiquiri.core.create_element("div",{'className':"hd px-1 pb-1 leading-none"},[(function (){var attrs67778 = label;
return daiquiri.core.create_element("strong",((cljs.core.map_QMARK_(attrs67778))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-xs","font-medium","text-gray-07","dark:opacity-80"], null)], null),attrs67778], 0))):{'className':"text-xs font-medium text-gray-07 dark:opacity-80"}),((cljs.core.map_QMARK_(attrs67778))?null:[daiquiri.interpreter.interpret(attrs67778)]));
})()]),(cljs.core.truth_(virtual_list_QMARK_)?(function (){var total = cljs.core.count(items);
var step = (9);
var rows = cljs.core.quot(total,step);
var mods = cljs.core.mod(total,step);
var rows__$1 = (((mods === (0)))?rows:(rows + (1)));
var items__$1 = cljs.core.vec(items);
return daiquiri.interpreter.interpret((function (){var G__67802 = (function (){var G__67803 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"total-count","total-count",-1999441386),rows__$1,new cljs.core.Keyword(null,"item-content","item-content",1656730280),(function (idx){
return frontend.components.icon.icons_row((function (){var last_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((rows__$1 - (1)),idx);
var start = (idx * step);
var end = ((idx + (1)) * ((((last_QMARK_) && ((!((mods === (0)))))))?mods:step));
var icons = (function (){try{return cljs.core.subvec.cljs$core$IFn$_invoke$arity$3(items__$1,start,end);
}catch (e67808){if((e67808 instanceof Error)){
var e = e67808;
console.error(e);

return null;
} else {
throw e67808;

}
}})();
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__67774_SHARP_){
return frontend.components.icon.item_render(p1__67774_SHARP_,opts);
}),icons);
})());
})], null);
if(cljs.core.truth_(searching_QMARK_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__67803,new cljs.core.Keyword(null,"custom-scroll-parent","custom-scroll-parent",1031485618),(function (){var G__67809 = rum.core.deref(_STAR_el_ref);
if((G__67809 == null)){
return null;
} else {
return G__67809.closest(".bd-scroll");
}
})());
} else {
return G__67803;
}
})();
return (frontend.ui.virtualized_list.cljs$core$IFn$_invoke$arity$1 ? frontend.ui.virtualized_list.cljs$core$IFn$_invoke$arity$1(G__67802) : frontend.ui.virtualized_list.call(null,G__67802));
})());
})():(function (){var attrs67797 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__67775_SHARP_){
return frontend.components.icon.item_render(p1__67775_SHARP_,opts);
}),items);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs67797))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["its"], null)], null),attrs67797], 0))):{'className':"its"}),((cljs.core.map_QMARK_(attrs67797))?null:[daiquiri.interpreter.interpret(attrs67797)]));
})())]);
};
var G__68144 = function (label,items,var_args){
var p__67776 = null;
if (arguments.length > 2) {
var G__68166__i = 0, G__68166__a = new Array(arguments.length -  2);
while (G__68166__i < G__68166__a.length) {G__68166__a[G__68166__i] = arguments[G__68166__i + 2]; ++G__68166__i;}
  p__67776 = new cljs.core.IndexedSeq(G__68166__a,0,null);
} 
return G__68144__delegate.call(this,label,items,p__67776);};
G__68144.cljs$lang$maxFixedArity = 2;
G__68144.cljs$lang$applyTo = (function (arglist__68167){
var label = cljs.core.first(arglist__68167);
arglist__68167 = cljs.core.next(arglist__68167);
var items = cljs.core.first(arglist__68167);
var p__67776 = cljs.core.rest(arglist__68167);
return G__68144__delegate(label,items,p__67776);
});
G__68144.cljs$core$IFn$_invoke$arity$variadic = G__68144__delegate;
return G__68144;
})()
,null,"frontend.components.icon/pane-section");
frontend.components.icon.emojis_cp = rum.core.lazy_build(rum.core.build_defc,(function (emojis_STAR_,opts){
return frontend.components.icon.pane_section((function (){var G__67813 = "Emojis (%s)";
var G__67814 = cljs.core.count(emojis_STAR_);
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__67813,G__67814) : frontend.util.format.call(null,G__67813,G__67814));
})(),emojis_STAR_,opts);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.icon/emojis-cp");
frontend.components.icon.icons_cp = rum.core.lazy_build(rum.core.build_defc,(function (icons,opts){
return frontend.components.icon.pane_section((function (){var G__67817 = "Icons (%s)";
var G__67818 = cljs.core.count(icons);
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__67817,G__67818) : frontend.util.format.call(null,G__67817,G__67818));
})(),icons,opts);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.icon/icons-cp");
frontend.components.icon.get_used_items = (function frontend$components$icon$get_used_items(){
return frontend.storage.get(new cljs.core.Keyword("ui","ls-icons-used","ui/ls-icons-used",750017965));
});
frontend.components.icon.add_used_item_BANG_ = (function frontend$components$icon$add_used_item_BANG_(m){
var s = (function (){var G__67820 = (function (){var or__5002__auto__ = frontend.components.icon.get_used_items();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentVector.EMPTY;
}
})();
var G__67820__$1 = (((G__67820 == null))?null:cljs.core.take.cljs$core$IFn$_invoke$arity$2((24),G__67820));
var G__67820__$2 = (((G__67820__$1 == null))?null:cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__67819_SHARP_){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(m,p1__67819_SHARP_);
}),G__67820__$1));
if((G__67820__$2 == null)){
return null;
} else {
return cljs.core.cons(m,G__67820__$2);
}
})();
return frontend.storage.set(new cljs.core.Keyword("ui","ls-icons-used","ui/ls-icons-used",750017965),s);
});
frontend.components.icon.all_cp = rum.core.lazy_build(rum.core.build_defc,(function (opts){
var used_items = frontend.components.icon.get_used_items();
var emoji_items = cljs.core.take.cljs$core$IFn$_invoke$arity$2((32),frontend.components.icon.emojis);
var icon_items = cljs.core.take.cljs$core$IFn$_invoke$arity$2((48),frontend.components.icon.get_tabler_icons());
var opts__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"virtual-list?","virtual-list?",-1922275028),false);
var attrs67821 = (cljs.core.truth_(cljs.core.count(used_items))?frontend.components.icon.pane_section("Frequently used",used_items,opts__$1):null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs67821))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["all-pane","pb-10"], null)], null),attrs67821], 0))):{'className':"all-pane pb-10"}),((cljs.core.map_QMARK_(attrs67821))?[frontend.components.icon.pane_section((function (){var G__67824 = "Emojis (%s)";
var G__67825 = cljs.core.count(frontend.components.icon.emojis);
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__67824,G__67825) : frontend.util.format.call(null,G__67824,G__67825));
})(),emoji_items,opts__$1),frontend.components.icon.pane_section((function (){var G__67828 = "Icons (%s)";
var G__67829 = cljs.core.count(frontend.components.icon.get_tabler_icons());
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__67828,G__67829) : frontend.util.format.call(null,G__67828,G__67829));
})(),icon_items,opts__$1)]:[daiquiri.interpreter.interpret(attrs67821),frontend.components.icon.pane_section((function (){var G__67832 = "Emojis (%s)";
var G__67833 = cljs.core.count(frontend.components.icon.emojis);
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__67832,G__67833) : frontend.util.format.call(null,G__67832,G__67833));
})(),emoji_items,opts__$1),frontend.components.icon.pane_section((function (){var G__67836 = "Icons (%s)";
var G__67837 = cljs.core.count(frontend.components.icon.get_tabler_icons());
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__67836,G__67837) : frontend.util.format.call(null,G__67836,G__67837));
})(),icon_items,opts__$1)]));
}),null,"frontend.components.icon/all-cp");
frontend.components.icon.tab_observer = rum.core.lazy_build(rum.core.build_defc,(function (tab,p__67838){
var map__67839 = p__67838;
var map__67839__$1 = cljs.core.__destructure_map(map__67839);
var reset_q_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67839__$1,new cljs.core.Keyword(null,"reset-q!","reset-q!",1334474852));
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
var G__67842 = rum.core.deref(_STAR_el_ref);
if((G__67842 == null)){
return null;
} else {
return G__67842.closest(".cp__emoji-icon-picker");
}
});
var focus_BANG_ = (function (idx,dir){
var items = rum.core.deref(_STAR_items_ref);
var popup = (function (){var G__67843 = get_cnt();
if((G__67843 == null)){
return null;
} else {
return G__67843.parentNode;
}
})();
var idx__$1 = (function (){var n = idx;
while(true){
if(cljs.core.nth.cljs$core$IFn$_invoke$arity$3(items,n,null) === false){
var G__68186 = (n + ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(dir,new cljs.core.Keyword(null,"prev","prev",-1597069226)))?(-1):(1)));
n = G__68186;
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
var G__67844 = cljs.core.second(rum.core.deref(_STAR_current_ref));
if((G__67844 == null)){
return null;
} else {
return G__67844.click();
}
} else {
var vec__67845 = rum.core.deref(_STAR_current_ref);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67845,(0),null);
var _node = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67845,(1),null);
var G__67848 = e.keyCode;
switch (G__67848) {
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
var sections_68196 = get_cnt().querySelectorAll(".pane-section");
var items_68197 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__67840_SHARP_){
var G__67849 = p1__67840_SHARP_.querySelectorAll(".its > button");
var G__67849__$1 = (((G__67849 == null))?null:Array.from(G__67849));
if((G__67849__$1 == null)){
return null;
} else {
return cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$1(G__67849__$1);
}
}),sections_68196);
var step_68198 = (9);
var items_68199__$1 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__67841_SHARP_){
var count = cljs.core.count(p1__67841_SHARP_);
var m = cljs.core.mod(count,step_68198);
if((m > (0))){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(p1__67841_SHARP_,cljs.core.repeat.cljs$core$IFn$_invoke$arity$2((step_68198 - m),false));
} else {
return p1__67841_SHARP_;
}
}),items_68197);
(_STAR_items_ref.current = cljs.core.flatten(items_68199__$1));

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
var vec__67850 = rum.core.use_state(cljs.core.deref(_STAR_color));
var color = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67850,(0),null);
var set_color_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67850,(1),null);
var _STAR_el = rum.core.use_ref(null);
var content_fn = (function (){
var colors = new cljs.core.PersistentVector(null, 9, 5, cljs.core.PersistentVector.EMPTY_NODE, ["#6e7b8b","#5e69d2","#00b5ed","#00b55b","#f2be00","#e47a00","#f38e81","#fb434c",null], null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.color-picker-presets","div.color-picker-presets",-143418367),(function (){var iter__5480__auto__ = (function frontend$components$icon$iter__67853(s__67854){
return (new cljs.core.LazySeq(null,(function (){
var s__67854__$1 = s__67854;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__67854__$1);
if(temp__5804__auto__){
var s__67854__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__67854__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__67854__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__67856 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__67855 = (0);
while(true){
if((i__67855 < size__5479__auto__)){
var c = cljs.core._nth(c__5478__auto__,i__67855);
cljs.core.chunk_append(b__67856,(function (){var G__67857 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__67855,c,c__5478__auto__,size__5479__auto__,b__67856,s__67854__$2,temp__5804__auto__,colors,vec__67850,color,set_color_BANG_,_STAR_el){
return (function (){
(set_color_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_color_BANG_.cljs$core$IFn$_invoke$arity$1(c) : set_color_BANG_.call(null,c));

var G__67859_68204 = on_select_BANG_;
if((G__67859_68204 == null)){
} else {
cljs.core.apply.cljs$core$IFn$_invoke$arity$2(G__67859_68204,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [c], null));
}

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
});})(i__67855,c,c__5478__auto__,size__5479__auto__,b__67856,s__67854__$2,temp__5804__auto__,colors,vec__67850,color,set_color_BANG_,_STAR_el))
,new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"outline","outline",793464534),new cljs.core.Keyword(null,"class","class",-2030961996),"it",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"background-color","background-color",570434026),c], null)], null);
var G__67858 = (cljs.core.truth_(c)?"":logseq.shui.ui.tabler_icon("minus",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"scale-75 opacity-70"], null)));
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__67857,G__67858) : logseq.shui.ui.button.call(null,G__67857,G__67858));
})());

var G__68206 = (i__67855 + (1));
i__67855 = G__68206;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__67856),frontend$components$icon$iter__67853(cljs.core.chunk_rest(s__67854__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__67856),null);
}
} else {
var c = cljs.core.first(s__67854__$2);
return cljs.core.cons((function (){var G__67860 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (c,s__67854__$2,temp__5804__auto__,colors,vec__67850,color,set_color_BANG_,_STAR_el){
return (function (){
(set_color_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_color_BANG_.cljs$core$IFn$_invoke$arity$1(c) : set_color_BANG_.call(null,c));

var G__67862_68207 = on_select_BANG_;
if((G__67862_68207 == null)){
} else {
cljs.core.apply.cljs$core$IFn$_invoke$arity$2(G__67862_68207,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [c], null));
}

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
});})(c,s__67854__$2,temp__5804__auto__,colors,vec__67850,color,set_color_BANG_,_STAR_el))
,new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"outline","outline",793464534),new cljs.core.Keyword(null,"class","class",-2030961996),"it",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"background-color","background-color",570434026),c], null)], null);
var G__67861 = (cljs.core.truth_(c)?"":logseq.shui.ui.tabler_icon("minus",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"scale-75 opacity-70"], null)));
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__67860,G__67861) : logseq.shui.ui.button.call(null,G__67860,G__67861));
})(),frontend$components$icon$iter__67853(cljs.core.rest(s__67854__$2)));
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
var temp__5804__auto___68209 = (function (){var G__67863 = rum.core.deref(_STAR_el);
if((G__67863 == null)){
return null;
} else {
return G__67863.closest(".cp__emoji-icon-picker");
}
})();
if(cljs.core.truth_(temp__5804__auto___68209)){
var picker_68210 = temp__5804__auto___68209;
var color_68211__$1 = ((clojure.string.blank_QMARK_(color))?"inherit":color);
picker_68210.style.setProperty("--ls-color-icon-preset",color_68211__$1);

frontend.storage.set(new cljs.core.Keyword(null,"ls-icon-color-preset","ls-icon-color-preset",-574354162),color_68211__$1);
} else {
}

return cljs.core.reset_BANG_(_STAR_color,color);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [color], null));

return daiquiri.interpreter.interpret((function (){var G__67869 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_el,new cljs.core.Keyword(null,"class","class",-2030961996),"color-picker",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
var G__67871 = e.target;
var G__67872 = content_fn;
var G__67873 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"side-offset","side-offset",207149931),(6)], null)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__67871,G__67872,G__67873) : logseq.shui.ui.popup_show_BANG_.call(null,G__67871,G__67872,G__67873));
}),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"outline","outline",793464534)], null);
var G__67870 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong","strong",269529000),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color","color",1011675173),(function (){var or__5002__auto__ = color;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "inherit";
}
})()], null)], null),logseq.shui.ui.tabler_icon("palette")], null);
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__67869,G__67870) : logseq.shui.ui.button.call(null,G__67869,G__67870));
})());
}),null,"frontend.components.icon/color-picker");
frontend.components.icon.icon_search = rum.core.lazy_build(rum.core.build_defcs,(function (state,p__67874){
var map__67877 = p__67874;
var map__67877__$1 = cljs.core.__destructure_map(map__67877);
var opts = map__67877__$1;
var on_chosen = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67877__$1,new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900));
var del_btn_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67877__$1,new cljs.core.Keyword(null,"del-btn?","del-btn?",-1094924362));
var icon_value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67877__$1,new cljs.core.Keyword(null,"icon-value","icon-value",-510636889));
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
var and__5000__auto___68213 = on_chosen;
if(cljs.core.truth_(and__5000__auto___68213)){
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

var G__67880 = (function (){
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(document.activeElement,input)){
input.focus();
} else {
}

return frontend.util.scroll_to.cljs$core$IFn$_invoke$arity$3(rum.core.deref(_STAR_result_ref),(0),false);
});
return (frontend.util.schedule.cljs$core$IFn$_invoke$arity$1 ? frontend.util.schedule.cljs$core$IFn$_invoke$arity$1(G__67880) : frontend.util.schedule.call(null,G__67880));
} else {
return null;
}
});
return daiquiri.core.create_element("div",{'data-keep-selection':true,'className':"cp__emoji-icon-picker"},[daiquiri.core.create_element("div",{'className':"hd bg-popover"},[frontend.components.icon.tab_observer(cljs.core.deref(_STAR_tab),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"reset-q!","reset-q!",1334474852),reset_q_BANG_], null)),(cljs.core.truth_(cljs.core.deref(_STAR_select_mode_QMARK_))?frontend.components.icon.select_observer(_STAR_input_ref):null),(function (){var attrs67882 = logseq.shui.ui.tabler_icon("search",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(16)], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs67882))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["search-input"], null)], null),attrs67882], 0))):{'className':"search-input"}),((cljs.core.map_QMARK_(attrs67882))?[daiquiri.interpreter.interpret(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var G__67885 = new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"auto-focus","auto-focus",1250006231),true,new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_input_ref,new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),(function (){var G__67886 = "Search %s items";
var G__67887 = clojure.string.lower_case(cljs.core.name(cljs.core.deref(_STAR_tab)));
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__67886,G__67887) : frontend.util.format.call(null,G__67886,G__67887));
})(),new cljs.core.Keyword(null,"default-value","default-value",232220170),"",new cljs.core.Keyword(null,"on-focus","on-focus",-13737624),(function (){
return cljs.core.reset_BANG_(_STAR_select_mode_QMARK_,false);
}),new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (e){
var G__67888 = e.keyCode;
switch (G__67888) {
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.components.icon.search(cljs.core.deref(_STAR_q),cljs.core.deref(_STAR_tab))),(function (result__$1){
return promesa.protocols._promise(cljs.core.reset_BANG_(_STAR_result,result__$1));
}));
}));
}
}),(200))], null);
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__67885) : logseq.shui.ui.input.call(null,G__67885));
})()], null)),((clojure.string.blank_QMARK_(cljs.core.deref(_STAR_q)))?null:daiquiri.core.create_element("a",{'onClick':reset_q_BANG_,'className':"x"},[daiquiri.interpreter.interpret(logseq.shui.ui.tabler_icon("x",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(14)], null)))]))]:[daiquiri.interpreter.interpret(attrs67882),daiquiri.interpreter.interpret(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var G__67891 = new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"auto-focus","auto-focus",1250006231),true,new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_input_ref,new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),(function (){var G__67892 = "Search %s items";
var G__67893 = clojure.string.lower_case(cljs.core.name(cljs.core.deref(_STAR_tab)));
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__67892,G__67893) : frontend.util.format.call(null,G__67892,G__67893));
})(),new cljs.core.Keyword(null,"default-value","default-value",232220170),"",new cljs.core.Keyword(null,"on-focus","on-focus",-13737624),(function (){
return cljs.core.reset_BANG_(_STAR_select_mode_QMARK_,false);
}),new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (e){
var G__67894 = e.keyCode;
switch (G__67894) {
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.components.icon.search(cljs.core.deref(_STAR_q),cljs.core.deref(_STAR_tab))),(function (result__$1){
return promesa.protocols._promise(cljs.core.reset_BANG_(_STAR_result,result__$1));
}));
}));
}
}),(200))], null);
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__67891) : logseq.shui.ui.input.call(null,G__67891));
})()], null)),((clojure.string.blank_QMARK_(cljs.core.deref(_STAR_q)))?null:daiquiri.core.create_element("a",{'onClick':reset_q_BANG_,'className':"x"},[daiquiri.interpreter.interpret(logseq.shui.ui.tabler_icon("x",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(14)], null)))]))]));
})()]),daiquiri.core.create_element("div",{'ref':_STAR_result_ref,'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["bd","bd-scroll",(function (){var or__5002__auto__ = (function (){var G__67897 = cljs.core.deref(_STAR_tab);
if((G__67897 == null)){
return null;
} else {
return cljs.core.name(G__67897);
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "other";
}
})()], null))},[(function (){var attrs67913 = ((cljs.core.seq(result))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-1.flex-col.gap-1.search-result","div.flex.flex-1.flex-col.gap-1.search-result",761669577),(function (){var matched = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"emojis","emojis",-2098458463).cljs$core$IFn$_invoke$arity$1(result),new cljs.core.Keyword(null,"icons","icons",-297140977).cljs$core$IFn$_invoke$arity$1(result));
if(cljs.core.seq(matched)){
return frontend.components.icon.pane_section((function (){var G__67914 = "Matched (%s)";
var G__67915 = cljs.core.count(matched);
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__67914,G__67915) : frontend.util.format.call(null,G__67914,G__67915));
})(),matched,opts__$1);
} else {
return null;
}
})()], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-1.flex-col.gap-1","div.flex.flex-1.flex-col.gap-1",742206800),(function (){var G__67916 = cljs.core.deref(_STAR_tab);
var G__67916__$1 = (((G__67916 instanceof cljs.core.Keyword))?G__67916.fqn:null);
switch (G__67916__$1) {
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
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs67913))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["content-pane"], null)], null),attrs67913], 0))):{'className':"content-pane"}),((cljs.core.map_QMARK_(attrs67913))?null:[daiquiri.interpreter.interpret(attrs67913)]));
})()]),daiquiri.core.create_element("div",{'className':"ft"},[daiquiri.core.create_element(daiquiri.core.fragment,null,[(function (){var attrs67955 = (function (){var tabs = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"all","all",892129742),"All"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"emoji","emoji",1031230144),"Emojis"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"icon","icon",1679606541),"Icons"], null)], null);
var iter__5480__auto__ = (function frontend$components$icon$iter__67956(s__67957){
return (new cljs.core.LazySeq(null,(function (){
var s__67957__$1 = s__67957;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__67957__$1);
if(temp__5804__auto__){
var s__67957__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__67957__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__67957__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__67959 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__67958 = (0);
while(true){
if((i__67958 < size__5479__auto__)){
var vec__67961 = cljs.core._nth(c__5478__auto__,i__67958);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67961,(0),null);
var label = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67961,(1),null);
var active_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(_STAR_tab),id);
cljs.core.chunk_append(b__67959,(function (){var G__67968 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"class","class",-2030961996),frontend.util.classnames(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"active","active",1895962068),active_QMARK_], null),"tab-item"], null)),new cljs.core.Keyword(null,"on-mouse-down","on-mouse-down",1147755470),((function (i__67958,active_QMARK_,vec__67961,id,label,c__5478__auto__,size__5479__auto__,b__67959,s__67957__$2,temp__5804__auto__,tabs,_STAR_q,_STAR_result,_STAR_tab,_STAR_color,_STAR_input_ref,_STAR_result_ref,result,opts__$1,_STAR_select_mode_QMARK_,reset_q_BANG_,map__67877,map__67877__$1,opts,on_chosen,del_btn_QMARK_,icon_value){
return (function (e){
frontend.util.stop(e);

return cljs.core.reset_BANG_(_STAR_tab,id);
});})(i__67958,active_QMARK_,vec__67961,id,label,c__5478__auto__,size__5479__auto__,b__67959,s__67957__$2,temp__5804__auto__,tabs,_STAR_q,_STAR_result,_STAR_tab,_STAR_color,_STAR_input_ref,_STAR_result_ref,result,opts__$1,_STAR_select_mode_QMARK_,reset_q_BANG_,map__67877,map__67877__$1,opts,on_chosen,del_btn_QMARK_,icon_value))
], null);
var G__67969 = label;
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__67968,G__67969) : logseq.shui.ui.button.call(null,G__67968,G__67969));
})());

var G__68227 = (i__67958 + (1));
i__67958 = G__68227;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__67959),frontend$components$icon$iter__67956(cljs.core.chunk_rest(s__67957__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__67959),null);
}
} else {
var vec__67976 = cljs.core.first(s__67957__$2);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67976,(0),null);
var label = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67976,(1),null);
var active_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(_STAR_tab),id);
return cljs.core.cons((function (){var G__67979 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"class","class",-2030961996),frontend.util.classnames(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"active","active",1895962068),active_QMARK_], null),"tab-item"], null)),new cljs.core.Keyword(null,"on-mouse-down","on-mouse-down",1147755470),((function (active_QMARK_,vec__67976,id,label,s__67957__$2,temp__5804__auto__,tabs,_STAR_q,_STAR_result,_STAR_tab,_STAR_color,_STAR_input_ref,_STAR_result_ref,result,opts__$1,_STAR_select_mode_QMARK_,reset_q_BANG_,map__67877,map__67877__$1,opts,on_chosen,del_btn_QMARK_,icon_value){
return (function (e){
frontend.util.stop(e);

return cljs.core.reset_BANG_(_STAR_tab,id);
});})(active_QMARK_,vec__67976,id,label,s__67957__$2,temp__5804__auto__,tabs,_STAR_q,_STAR_result,_STAR_tab,_STAR_color,_STAR_input_ref,_STAR_result_ref,result,opts__$1,_STAR_select_mode_QMARK_,reset_q_BANG_,map__67877,map__67877__$1,opts,on_chosen,del_btn_QMARK_,icon_value))
], null);
var G__67980 = label;
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__67979,G__67980) : logseq.shui.ui.button.call(null,G__67979,G__67980));
})(),frontend$components$icon$iter__67956(cljs.core.rest(s__67957__$2)));
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
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs67955))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-1","flex-row","items-center","gap-2"], null)], null),attrs67955], 0))):{'className':"flex flex-1 flex-row items-center gap-2"}),((cljs.core.map_QMARK_(attrs67955))?null:[daiquiri.interpreter.interpret(attrs67955)]));
})(),((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"emoji","emoji",1031230144),cljs.core.deref(_STAR_tab)))?frontend.components.icon.color_picker(_STAR_color,(function (c){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"tabler-icon","tabler-icon",945975358),(function (){var G__67991 = icon_value;
if((G__67991 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(G__67991);
}
})())){
var G__67992 = null;
var G__67993 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(icon_value,new cljs.core.Keyword(null,"color","color",1011675173),c);
var G__67994 = true;
return (on_chosen.cljs$core$IFn$_invoke$arity$3 ? on_chosen.cljs$core$IFn$_invoke$arity$3(G__67992,G__67993,G__67994) : on_chosen.call(null,G__67992,G__67993,G__67994));
} else {
return null;
}
})):null),(cljs.core.truth_(del_btn_QMARK_)?daiquiri.interpreter.interpret((function (){var G__67997 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"outline","outline",793464534),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"data-action","data-action",821237678),"del",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (on_chosen.cljs$core$IFn$_invoke$arity$1 ? on_chosen.cljs$core$IFn$_invoke$arity$1(null) : on_chosen.call(null,null));
})], null);
var G__67998 = logseq.shui.ui.tabler_icon("trash",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(17)], null));
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__67997,G__67998) : logseq.shui.ui.button.call(null,G__67997,G__67998));
})()):null)])])]);
}),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.local.cljs$core$IFn$_invoke$arity$2("",new cljs.core.Keyword("frontend.components.icon","q","frontend.components.icon/q",-443560690)),rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.icon","result","frontend.components.icon/result",-505929638)),rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.components.icon","select-mode?","frontend.components.icon/select-mode?",-1815830707)),rum.core.local.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"all","all",892129742),new cljs.core.Keyword("frontend.components.icon","tab","frontend.components.icon/tab",1411774210)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (s){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(s,new cljs.core.Keyword("frontend.components.icon","color","frontend.components.icon/color",1607363474),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(frontend.storage.get(new cljs.core.Keyword(null,"ls-icon-color-preset","ls-icon-color-preset",-574354162))));
})], null)], null),"frontend.components.icon/icon-search");
frontend.components.icon.icon_picker = rum.core.lazy_build(rum.core.build_defc,(function (icon_value,p__68011){
var map__68012 = p__68011;
var map__68012__$1 = cljs.core.__destructure_map(map__68012);
var empty_label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__68012__$1,new cljs.core.Keyword(null,"empty-label","empty-label",-288358384));
var disabled_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__68012__$1,new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181));
var initial_open_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__68012__$1,new cljs.core.Keyword(null,"initial-open?","initial-open?",1869534108));
var del_btn_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__68012__$1,new cljs.core.Keyword(null,"del-btn?","del-btn?",-1094924362));
var on_chosen = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__68012__$1,new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900));
var icon_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__68012__$1,new cljs.core.Keyword(null,"icon-props","icon-props",-895221875));
var popup_opts = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__68012__$1,new cljs.core.Keyword(null,"popup-opts","popup-opts",-1667184839));
var button_opts = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__68012__$1,new cljs.core.Keyword(null,"button-opts","button-opts",1112045560));
var _STAR_trigger_ref = rum.core.use_ref(null);
var content_fn = ((frontend.config.publishing_QMARK_)?cljs.core.constantly(cljs.core.PersistentVector.EMPTY):(function (p__68013){
var map__68014 = p__68013;
var map__68014__$1 = cljs.core.__destructure_map(map__68014);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__68014__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
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
var G__68015 = rum.core.deref(_STAR_trigger_ref);
if((G__68015 == null)){
return null;
} else {
return G__68015.click();
}
}),(32));
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [initial_open_QMARK_], null));

var has_icon_QMARK_ = (!((icon_value == null)));
return daiquiri.interpreter.interpret((function (){var G__68023 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_trigger_ref,new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"class","class",-2030961996),((has_icon_QMARK_)?"px-1 leading-none text-muted-foreground hover:text-foreground":"font-normal text-sm px-[0.5px] text-muted-foreground hover:text-foreground"),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
if(cljs.core.truth_(disabled_QMARK_)){
return null;
} else {
var G__68029 = e.target;
var G__68030 = content_fn;
var G__68031 = medley.core.deep_merge.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"start","start",-355208981),new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"ls-icon-picker","ls-icon-picker",1363108390),new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"ls-icon-picker",new cljs.core.Keyword(null,"onEscapeKeyDown","onEscapeKeyDown",1908839912),(function (p1__68000_SHARP_){
return p1__68000_SHARP_.preventDefault();
})], null)], null),popup_opts);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__68029,G__68030,G__68031) : logseq.shui.ui.popup_show_BANG_.call(null,G__68029,G__68030,G__68031));
}
})], null),button_opts], 0));
var G__68024 = ((has_icon_QMARK_)?((cljs.core.vector_QMARK_(icon_value))?icon_value:frontend.components.icon.icon.cljs$core$IFn$_invoke$arity$variadic(icon_value,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color?","color?",-1891974356),true], null),icon_props], 0))], 0))):(function (){var or__5002__auto__ = empty_label;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "Empty";
}
})());
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__68023,G__68024) : logseq.shui.ui.button.call(null,G__68023,G__68024));
})());
}),null,"frontend.components.icon/icon-picker");

//# sourceMappingURL=frontend.components.icon.js.map
