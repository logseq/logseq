goog.provide('frontend.extensions.handbooks.core');
if((typeof frontend !== 'undefined') && (typeof frontend.extensions !== 'undefined') && (typeof frontend.extensions.handbooks !== 'undefined') && (typeof frontend.extensions.handbooks.core !== 'undefined') && (typeof frontend.extensions.handbooks.core._STAR_config !== 'undefined')){
} else {
frontend.extensions.handbooks.core._STAR_config = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
}
frontend.extensions.handbooks.core.get_handbooks_endpoint = (function frontend$extensions$handbooks$core$get_handbooks_endpoint(resource){
return [(cljs.core.truth_(frontend.storage.get(new cljs.core.Keyword(null,"handbooks-dev-watch?","handbooks-dev-watch?",-372916840)))?"http://localhost:1337":"https://handbooks.pages.dev"),cljs.core.str.cljs$core$IFn$_invoke$arity$1(resource)].join('');
});
frontend.extensions.handbooks.core.resolve_asset_url = (function frontend$extensions$handbooks$core$resolve_asset_url(path){
if(clojure.string.starts_with_QMARK_(path,"http")){
return path;
} else {
return [frontend.extensions.handbooks.core.get_handbooks_endpoint("/"),clojure.string.replace_first(clojure.string.replace_first(path,"./",""),/^\/+/,"")].join('');
}
});
frontend.extensions.handbooks.core.inflate_content_assets_urls = (function frontend$extensions$handbooks$core$inflate_content_assets_urls(content){
var temp__5802__auto__ = (function (){var and__5000__auto__ = (!(clojure.string.blank_QMARK_(content)));
if(and__5000__auto__){
return cljs.core.re_seq(/src=\"([^\"]+)\"/,content);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var matches = temp__5802__auto__;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (content__$1,matched){
var temp__5802__auto____$1 = cljs.core.second(matched);
if(cljs.core.truth_(temp__5802__auto____$1)){
var matched__$1 = temp__5802__auto____$1;
return clojure.string.replace(content__$1,matched__$1,frontend.extensions.handbooks.core.resolve_asset_url(matched__$1));
} else {
return content__$1;
}
}),content,matches);
} else {
return content;
}
});
frontend.extensions.handbooks.core.parse_key_from_href = (function frontend$extensions$handbooks$core$parse_key_from_href(href,base){
if(((typeof href === 'string') && ((!(clojure.string.blank_QMARK_(href)))))){
var temp__5804__auto__ = (function (){var G__128677 = href;
var G__128677__$1 = (((G__128677 == null))?null:clojure.string.trim(G__128677));
if((G__128677__$1 == null)){
return null;
} else {
return clojure.string.replace(G__128677__$1,/.edn$/,"");
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var href__$1 = temp__5804__auto__;
var G__128678 = ((clojure.string.starts_with_QMARK_(href__$1,"@"))?clojure.string.replace(href__$1,/^[@\\/]+/,""):(frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2 ? frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2(base,href__$1) : frontend.util.node_path.join.call(null,base,href__$1)));
var G__128678__$1 = (((G__128678 == null))?null:clojure.string.lower_case(G__128678));
if((G__128678__$1 == null)){
return null;
} else {
return camel_snake_kebab.core.__GT_snake_case_string(G__128678__$1);
}
} else {
return null;
}
} else {
return null;
}
});
frontend.extensions.handbooks.core.parse_parent_key = (function frontend$extensions$handbooks$core$parse_parent_key(s){
if(((typeof s === 'string') && (clojure.string.includes_QMARK_(s,"/")))){
return cljs.core.subs.cljs$core$IFn$_invoke$arity$3(s,(0),clojure.string.last_index_of.cljs$core$IFn$_invoke$arity$2(s,"/"));
} else {
return s;
}
});
frontend.extensions.handbooks.core.bind_parent_key = (function frontend$extensions$handbooks$core$bind_parent_key(p__128679){
var map__128681 = p__128679;
var map__128681__$1 = cljs.core.__destructure_map(map__128681);
var node = map__128681__$1;
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__128681__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var G__128682 = node;
if(((typeof key === 'string') && (clojure.string.includes_QMARK_(key,"/")))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__128682,new cljs.core.Keyword(null,"parent","parent",-878878779),frontend.extensions.handbooks.core.parse_parent_key(key));
} else {
return G__128682;
}
});
frontend.extensions.handbooks.core.load_glide_assets_BANG_ = (function frontend$extensions$handbooks$core$load_glide_assets_BANG_(){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.util.css_load$.cljs$core$IFn$_invoke$arity$1([frontend.util.JS_ROOT,"/glide/glide.core.min.css"].join(''))),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.util.css_load$.cljs$core$IFn$_invoke$arity$1([frontend.util.JS_ROOT,"/glide/glide.theme.min.css"].join(''))),(function (___$1){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_((window["Glide"]))?null:frontend.util.js_load$([frontend.util.JS_ROOT,"/glide/glide.min.js"].join('')))),(function (___$2){
return promesa.impl.resolved(null);
}));
}));
}));
}));
});
frontend.extensions.handbooks.core.topic_card = rum.core.lazy_build(rum.core.build_defc,(function (p__128685,nav_fn_BANG_,opts){
var map__128687 = p__128685;
var map__128687__$1 = cljs.core.__destructure_map(map__128687);
var _topic = map__128687__$1;
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__128687__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__128687__$1,new cljs.core.Keyword(null,"title","title",636505583));
var description = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__128687__$1,new cljs.core.Keyword(null,"description","description",-1428560544));
var cover = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__128687__$1,new cljs.core.Keyword(null,"cover","cover",-823541365));
var attrs128684 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),key,new cljs.core.Keyword(null,"on-click","on-click",1632826543),nav_fn_BANG_], null),opts], 0));
return daiquiri.core.create_element("button",((cljs.core.map_QMARK_(attrs128684))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["w-full","topic-card","flex","text-left"], null)], null),attrs128684], 0))):{'className':"w-full topic-card flex text-left"}),((cljs.core.map_QMARK_(attrs128684))?[(cljs.core.truth_(cover)?daiquiri.core.create_element("div",{'className':"l flex items-center"},[daiquiri.core.create_element("img",{'src':frontend.extensions.handbooks.core.resolve_asset_url(cover)},[])]):null),daiquiri.core.create_element("div",{'className':"r flex flex-col"},[(function (){var attrs128688 = title;
return daiquiri.core.create_element("strong",((cljs.core.map_QMARK_(attrs128688))?daiquiri.interpreter.element_attributes(attrs128688):null),((cljs.core.map_QMARK_(attrs128688))?null:[daiquiri.interpreter.interpret(attrs128688)]));
})(),(function (){var attrs128689 = description;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs128689))?daiquiri.interpreter.element_attributes(attrs128689):null),((cljs.core.map_QMARK_(attrs128689))?null:[daiquiri.interpreter.interpret(attrs128689)]));
})()])]:[daiquiri.interpreter.interpret(attrs128684),(cljs.core.truth_(cover)?daiquiri.core.create_element("div",{'className':"l flex items-center"},[daiquiri.core.create_element("img",{'src':frontend.extensions.handbooks.core.resolve_asset_url(cover)},[])]):null),daiquiri.core.create_element("div",{'className':"r flex flex-col"},[(function (){var attrs128690 = title;
return daiquiri.core.create_element("strong",((cljs.core.map_QMARK_(attrs128690))?daiquiri.interpreter.element_attributes(attrs128690):null),((cljs.core.map_QMARK_(attrs128690))?null:[daiquiri.interpreter.interpret(attrs128690)]));
})(),(function (){var attrs128691 = description;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs128691))?daiquiri.interpreter.element_attributes(attrs128691):null),((cljs.core.map_QMARK_(attrs128691))?null:[daiquiri.interpreter.interpret(attrs128691)]));
})()])]));
}),null,"frontend.extensions.handbooks.core/topic-card");
frontend.extensions.handbooks.core.pane_category_topics = rum.core.lazy_build(rum.core.build_defc,(function (handbook_nodes,pane_state,nav_BANG_){
return daiquiri.core.create_element("div",{'className':"pane pane-category-topics"},[(function (){var attrs128708 = (function (){var category_key = new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(cljs.core.second(pane_state));
var temp__5804__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(handbook_nodes,category_key);
if(cljs.core.truth_(temp__5804__auto__)){
var category = temp__5804__auto__;
var iter__5480__auto__ = (function frontend$extensions$handbooks$core$iter__128709(s__128710){
return (new cljs.core.LazySeq(null,(function (){
var s__128710__$1 = s__128710;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__128710__$1);
if(temp__5804__auto____$1){
var s__128710__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__128710__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__128710__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__128712 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__128711 = (0);
while(true){
if((i__128711 < size__5479__auto__)){
var topic = cljs.core._nth(c__5478__auto__,i__128711);
cljs.core.chunk_append(b__128712,rum.core.with_key(frontend.extensions.handbooks.core.topic_card(topic,((function (i__128711,topic,c__5478__auto__,size__5479__auto__,b__128712,s__128710__$2,temp__5804__auto____$1,category,temp__5804__auto__,category_key){
return (function (){
var G__128713 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"topic-detail","topic-detail",-2143221053),topic,new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(category)], null);
var G__128714 = pane_state;
return (nav_BANG_.cljs$core$IFn$_invoke$arity$2 ? nav_BANG_.cljs$core$IFn$_invoke$arity$2(G__128713,G__128714) : nav_BANG_.call(null,G__128713,G__128714));
});})(i__128711,topic,c__5478__auto__,size__5479__auto__,b__128712,s__128710__$2,temp__5804__auto____$1,category,temp__5804__auto__,category_key))
,null),new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(topic)));

var G__128982 = (i__128711 + (1));
i__128711 = G__128982;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__128712),frontend$extensions$handbooks$core$iter__128709(cljs.core.chunk_rest(s__128710__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__128712),null);
}
} else {
var topic = cljs.core.first(s__128710__$2);
return cljs.core.cons(rum.core.with_key(frontend.extensions.handbooks.core.topic_card(topic,((function (topic,s__128710__$2,temp__5804__auto____$1,category,temp__5804__auto__,category_key){
return (function (){
var G__128715 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"topic-detail","topic-detail",-2143221053),topic,new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(category)], null);
var G__128716 = pane_state;
return (nav_BANG_.cljs$core$IFn$_invoke$arity$2 ? nav_BANG_.cljs$core$IFn$_invoke$arity$2(G__128715,G__128716) : nav_BANG_.call(null,G__128715,G__128716));
});})(topic,s__128710__$2,temp__5804__auto____$1,category,temp__5804__auto__,category_key))
,null),new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(topic)),frontend$extensions$handbooks$core$iter__128709(cljs.core.rest(s__128710__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(new cljs.core.Keyword(null,"children","children",-940561982).cljs$core$IFn$_invoke$arity$1(category));
} else {
return null;
}
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs128708))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["topics-list"], null)], null),attrs128708], 0))):{'className':"topics-list"}),((cljs.core.map_QMARK_(attrs128708))?null:[daiquiri.interpreter.interpret(attrs128708)]));
})()]);
}),null,"frontend.extensions.handbooks.core/pane-category-topics");
frontend.extensions.handbooks.core.media_render = rum.core.lazy_build(rum.core.build_defc,(function (src){
var src__$1 = frontend.util.trim_safe(src);
var extname = (function (){var G__128717 = src__$1;
var G__128717__$1 = (((G__128717 == null))?null:(frontend.util.full_path_extname.cljs$core$IFn$_invoke$arity$1 ? frontend.util.full_path_extname.cljs$core$IFn$_invoke$arity$1(G__128717) : frontend.util.full_path_extname.call(null,G__128717)));
if((G__128717__$1 == null)){
return null;
} else {
return cljs.core.subs.cljs$core$IFn$_invoke$arity$2(G__128717__$1,(1));
}
})();
var youtube_id = (function (){var and__5000__auto__ = clojure.string.includes_QMARK_(src__$1,"youtube.com/watch?v=");
if(and__5000__auto__){
return cljs.core.subs.cljs$core$IFn$_invoke$arity$2(src__$1,((2) + clojure.string.last_index_of.cljs$core$IFn$_invoke$arity$2(src__$1,"v=")));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_((function (){var and__5000__auto__ = extname;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.contains_QMARK_(frontend.config.video_formats,cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(extname));
} else {
return and__5000__auto__;
}
})())){
return daiquiri.core.create_element("video",{'src':src__$1,'controls':true},[]);
} else {
if(typeof youtube_id === 'string'){
return frontend.extensions.video.youtube.youtube_video(youtube_id,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"width","width",-384071477),"100%",new cljs.core.Keyword(null,"height","height",1025178622),(235)], null));
} else {
return daiquiri.core.create_element("img",{'src':src__$1},[]);

}
}
}),null,"frontend.extensions.handbooks.core/media-render");
frontend.extensions.handbooks.core.chapter_select = rum.core.lazy_build(rum.core.build_defc,(function (topic,children,on_select){
var vec__128719 = rum.core.use_state(false);
var open_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128719,(0),null);
var set_open_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128719,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
var temp__5804__auto__ = document.querySelector("[data-identity=logseq-handbooks]");
if(cljs.core.truth_(temp__5804__auto__)){
var el = temp__5804__auto__;
var h = (function (p1__128718_SHARP_){
if(cljs.core.truth_((function (){var G__128722 = p1__128718_SHARP_.target;
if((G__128722 == null)){
return null;
} else {
return document.querySelector(".chapters-select").contains(G__128722);
}
})())){
return null;
} else {
return (set_open_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_open_QMARK_.cljs$core$IFn$_invoke$arity$1(false) : set_open_QMARK_.call(null,false));
}
});
el.addEventListener("click",h);

return (function (){
return el.removeEventListener("click",h);
});
} else {
return null;
}
}),cljs.core.PersistentVector.EMPTY);

return daiquiri.core.create_element("div",{'className':"chapters-select w-full"},[daiquiri.core.create_element("a",{'onClick':(function (){
var G__128723 = cljs.core.not(open_QMARK_);
return (set_open_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_open_QMARK_.cljs$core$IFn$_invoke$arity$1(G__128723) : set_open_QMARK_.call(null,G__128723));
}),'tabIndex':"0",'className':"select-trigger"},[daiquiri.core.create_element("small",null,["Current chapter"]),(function (){var attrs128726 = new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(topic);
return daiquiri.core.create_element("strong",((cljs.core.map_QMARK_(attrs128726))?daiquiri.interpreter.element_attributes(attrs128726):null),((cljs.core.map_QMARK_(attrs128726))?null:[daiquiri.interpreter.interpret(attrs128726)]));
})(),(cljs.core.truth_(open_QMARK_)?daiquiri.interpreter.interpret(frontend.ui.icon("chevron-down")):daiquiri.interpreter.interpret(frontend.ui.icon("chevron-left"))),(cljs.core.truth_(open_QMARK_)?daiquiri.core.create_element("ul",null,[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$extensions$handbooks$core$iter__128727(s__128728){
return (new cljs.core.LazySeq(null,(function (){
var s__128728__$1 = s__128728;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__128728__$1);
if(temp__5804__auto__){
var s__128728__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__128728__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__128728__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__128730 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__128729 = (0);
while(true){
if((i__128729 < size__5479__auto__)){
var c = cljs.core._nth(c__5478__auto__,i__128729);
cljs.core.chunk_append(b__128730,((((cljs.core.seq(c)) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(c),new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(topic)))))?daiquiri.core.create_element("li",{'key':new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(c)},[daiquiri.core.create_element("a",{'tabIndex':"0",'onClick':((function (i__128729,c,c__5478__auto__,size__5479__auto__,b__128730,s__128728__$2,temp__5804__auto__,vec__128719,open_QMARK_,set_open_QMARK_){
return (function (){
var G__128731 = new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(c);
return (on_select.cljs$core$IFn$_invoke$arity$1 ? on_select.cljs$core$IFn$_invoke$arity$1(G__128731) : on_select.call(null,G__128731));
});})(i__128729,c,c__5478__auto__,size__5479__auto__,b__128730,s__128728__$2,temp__5804__auto__,vec__128719,open_QMARK_,set_open_QMARK_))
,'className':"flex"},[daiquiri.interpreter.interpret((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(c);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(c);
}
})())])]):null));

var G__128983 = (i__128729 + (1));
i__128729 = G__128983;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__128730),frontend$extensions$handbooks$core$iter__128727(cljs.core.chunk_rest(s__128728__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__128730),null);
}
} else {
var c = cljs.core.first(s__128728__$2);
return cljs.core.cons(((((cljs.core.seq(c)) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(c),new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(topic)))))?daiquiri.core.create_element("li",{'key':new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(c)},[daiquiri.core.create_element("a",{'tabIndex':"0",'onClick':((function (c,s__128728__$2,temp__5804__auto__,vec__128719,open_QMARK_,set_open_QMARK_){
return (function (){
var G__128732 = new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(c);
return (on_select.cljs$core$IFn$_invoke$arity$1 ? on_select.cljs$core$IFn$_invoke$arity$1(G__128732) : on_select.call(null,G__128732));
});})(c,s__128728__$2,temp__5804__auto__,vec__128719,open_QMARK_,set_open_QMARK_))
,'className':"flex"},[daiquiri.interpreter.interpret((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(c);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(c);
}
})())])]):null),frontend$extensions$handbooks$core$iter__128727(cljs.core.rest(s__128728__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(children);
})())]):null)])]);
}),null,"frontend.extensions.handbooks.core/chapter-select");
frontend.extensions.handbooks.core.pane_topic_detail = rum.core.lazy_build(rum.core.build_defc,(function (handbook_nodes,pane_state,nav_BANG_){
var vec__128734 = rum.core.use_state(false);
var deps_pending_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128734,(0),null);
var set_deps_pending_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128734,(1),null);
var _STAR_id_ref = rum.core.use_ref(["glide--",cljs.core.str.cljs$core$IFn$_invoke$arity$1(Date.now())].join(''));
logseq.shui.hooks.use_effect_BANG_((function (){
(set_deps_pending_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_deps_pending_QMARK_.cljs$core$IFn$_invoke$arity$1(true) : set_deps_pending_QMARK_.call(null,true));

return promesa.core.finally$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.extensions.handbooks.core.load_glide_assets_BANG_(),(function (){
return setTimeout((function (){
if(cljs.core.truth_(document.getElementById(rum.core.deref(_STAR_id_ref)))){
var G__128737 = (new window.Glide(["#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(rum.core.deref(_STAR_id_ref))].join('')));
G__128737.mount();

return G__128737;
} else {
return null;
}
}),(50));
})),(function (){
return (set_deps_pending_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_deps_pending_QMARK_.cljs$core$IFn$_invoke$arity$1(false) : set_deps_pending_QMARK_.call(null,false));
}));
}),cljs.core.PersistentVector.EMPTY);

logseq.shui.hooks.use_effect_BANG_((function (){
return setTimeout((function (){
var G__128738 = document.querySelector(".cp__handbooks-content");
if((G__128738 == null)){
return null;
} else {
return G__128738.scrollTo((0),(0));
}
}));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [pane_state], null));

return daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(cljs.core.second(pane_state));
if(cljs.core.truth_(temp__5804__auto__)){
var topic_key = temp__5804__auto__;
var temp__5804__auto____$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(handbook_nodes,topic_key);
if(cljs.core.truth_(temp__5804__auto____$1)){
var topic = temp__5804__auto____$1;
var chapters = new cljs.core.Keyword(null,"children","children",-940561982).cljs$core$IFn$_invoke$arity$1(topic);
var has_chapters_QMARK_ = cljs.core.seq(chapters);
var topic__$1 = ((has_chapters_QMARK_)?cljs.core.first(chapters):topic);
var parent = cljs.core.get.cljs$core$IFn$_invoke$arity$2(handbook_nodes,new cljs.core.Keyword(null,"parent","parent",-878878779).cljs$core$IFn$_invoke$arity$1(frontend.extensions.handbooks.core.bind_parent_key(topic__$1)));
var chapters__$1 = (function (){var or__5002__auto__ = chapters;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"children","children",-940561982).cljs$core$IFn$_invoke$arity$1(parent);
}
})();
var parent_key = new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(parent);
var parent_category_QMARK_ = (!(clojure.string.includes_QMARK_(parent_key,"/")));
var show_chapters_QMARK_ = (((!(parent_category_QMARK_))) && (cljs.core.seq(chapters__$1)));
var chapters_len = cljs.core.count(chapters__$1);
var chapter_current_idx = (((chapters_len === (0)))?null:frontend.util.find_index((function (p1__128733_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(p1__128733_SHARP_),new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(topic__$1));
}),chapters__$1));
if(cljs.core.truth_(deps_pending_QMARK_)){
return null;
} else {
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.pane.pane-topic-detail","div.pane.pane-topic-detail",-1359891875),((show_chapters_QMARK_)?null:new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h1.text-2xl.pb-3.font-semibold","h1.text-2xl.pb-3.font-semibold",1202289385),new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(topic__$1)], null)),((show_chapters_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.chapters-wrap.py-2","div.chapters-wrap.py-2",-36217700),frontend.extensions.handbooks.core.chapter_select(topic__$1,chapters__$1,(function (k){
var temp__5804__auto____$2 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(handbook_nodes,k);
if(cljs.core.truth_(temp__5804__auto____$2)){
var chapter = temp__5804__auto____$2;
var G__128753 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"topic-detail","topic-detail",-2143221053),chapter,new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(parent)], null);
var G__128754 = pane_state;
return (nav_BANG_.cljs$core$IFn$_invoke$arity$2 ? nav_BANG_.cljs$core$IFn$_invoke$arity$2(G__128753,G__128754) : nav_BANG_.call(null,G__128753,G__128754));
} else {
return null;
}
}))], null):null),(function (){var temp__5804__auto____$2 = new cljs.core.Keyword(null,"demos","demos",2019929767).cljs$core$IFn$_invoke$arity$1(topic__$1);
if(cljs.core.truth_(temp__5804__auto____$2)){
var demos = temp__5804__auto____$2;
var demos__$1 = (function (){var G__128755 = demos;
if(typeof demos === 'string'){
return (new cljs.core.List(null,G__128755,null,(1),null));
} else {
return G__128755;
}
})();
if((cljs.core.count(demos__$1) > (1))){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.demos.glide","div.flex.demos.glide",-1625455235),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"id","id",-1388402092),rum.core.deref(_STAR_id_ref)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.glide__track","div.glide__track",-633527809),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data-glide-el","data-glide-el",-1091179891),"track"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.glide__slides","div.glide__slides",-999448224),(function (){var iter__5480__auto__ = (function frontend$extensions$handbooks$core$iter__128756(s__128757){
return (new cljs.core.LazySeq(null,(function (){
var s__128757__$1 = s__128757;
while(true){
var temp__5804__auto____$3 = cljs.core.seq(s__128757__$1);
if(temp__5804__auto____$3){
var s__128757__$2 = temp__5804__auto____$3;
if(cljs.core.chunked_seq_QMARK_(s__128757__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__128757__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__128759 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__128758 = (0);
while(true){
if((i__128758 < size__5479__auto__)){
var demo = cljs.core._nth(c__5478__auto__,i__128758);
cljs.core.chunk_append(b__128759,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.item.glide__slide","div.item.glide__slide",-1497684829),frontend.extensions.handbooks.core.media_render(frontend.extensions.handbooks.core.resolve_asset_url(demo))], null));

var G__128984 = (i__128758 + (1));
i__128758 = G__128984;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__128759),frontend$extensions$handbooks$core$iter__128756(cljs.core.chunk_rest(s__128757__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__128759),null);
}
} else {
var demo = cljs.core.first(s__128757__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.item.glide__slide","div.item.glide__slide",-1497684829),frontend.extensions.handbooks.core.media_render(frontend.extensions.handbooks.core.resolve_asset_url(demo))], null),frontend$extensions$handbooks$core$iter__128756(cljs.core.rest(s__128757__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(demos__$1);
})()], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.glide__bullets","div.glide__bullets",-2112036241),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data-glide-el","data-glide-el",-1091179891),"controls[nav]"], null),cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2((function (idx,_){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.glide__bullet","button.glide__bullet",-1928516082),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data-glide-dir","data-glide-dir",653306489),["=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx)].join('')], null),(idx + (1))], null);
}),demos__$1)], null)], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.demos.pt-1","div.flex.demos.pt-1",1609910240),frontend.extensions.handbooks.core.media_render(frontend.extensions.handbooks.core.resolve_asset_url(cljs.core.first(demos__$1)))], null);
}
} else {
return null;
}
})(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.content-wrap","div.content-wrap",1869004654),(function (){var temp__5804__auto____$2 = new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(topic__$1);
if(cljs.core.truth_(temp__5804__auto____$2)){
var content = temp__5804__auto____$2;
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.content.markdown-body","div.content.markdown-body",1198787733),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"dangerouslySetInnerHTML","dangerouslySetInnerHTML",-554971138),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"__html","__html",674048345),frontend.extensions.handbooks.core.inflate_content_assets_urls(content)], null),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
var temp__5804__auto____$3 = e.target;
if(cljs.core.truth_(temp__5804__auto____$3)){
var target = temp__5804__auto____$3;
var temp__5802__auto__ = target.closest("img");
if(cljs.core.truth_(temp__5802__auto__)){
var img = temp__5802__auto__;
return frontend.extensions.lightbox.preview_images_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"src","src",-1651076051),img.src,new cljs.core.Keyword(null,"w","w",354169001),img.naturalWidth,new cljs.core.Keyword(null,"h","h",1109658740),img.naturalHeight], null)], null));
} else {
var temp__5804__auto____$4 = (function (){var G__128760 = target.closest("a");
if((G__128760 == null)){
return null;
} else {
return G__128760.getAttribute("href");
}
})();
if(cljs.core.truth_(temp__5804__auto____$4)){
var link = temp__5804__auto____$4;
var temp__5804__auto____$5 = (function (){var and__5000__auto__ = (!(clojure.string.starts_with_QMARK_(link,"http")));
if(and__5000__auto__){
return frontend.extensions.handbooks.core.parse_key_from_href(link,parent_key);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto____$5)){
var to_k = temp__5804__auto____$5;
var temp__5802__auto___128985__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(handbook_nodes,to_k);
if(cljs.core.truth_(temp__5802__auto___128985__$1)){
var to_128986 = temp__5802__auto___128985__$1;
var G__128761_128987 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"topic-detail","topic-detail",-2143221053),to_128986,new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(parent)], null);
var G__128762_128988 = pane_state;
(nav_BANG_.cljs$core$IFn$_invoke$arity$2 ? nav_BANG_.cljs$core$IFn$_invoke$arity$2(G__128761_128987,G__128762_128988) : nav_BANG_.call(null,G__128761_128987,G__128762_128988));
} else {
console.error("ERROR: handbook link resource not found: ",to_k,link);
}

return frontend.util.stop(e);
} else {
return null;
}
} else {
return null;
}
}
} else {
return null;
}
})], null)], null),(function (){var temp__5804__auto____$3 = (function (){var and__5000__auto__ = (chapters_len > (1));
if(and__5000__auto__){
return chapter_current_idx;
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto____$3)){
var idx = temp__5804__auto____$3;
var prev = (((idx === (0)))?null:(idx - (1)));
var next = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(idx,(chapters_len - (1))))?null:(idx + (1)));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.controls.flex.justify-between.pt-4","div.controls.flex.justify-between.pt-4",-1953435199),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),(cljs.core.truth_(prev)?frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center","span.flex.items-center",-463750193),frontend.ui.icon("arrow-left"),"Prev chapter"], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"small?","small?",95242445),true,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var G__128763 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"topic-detail","topic-detail",-2143221053),cljs.core.nth.cljs$core$IFn$_invoke$arity$2(chapters__$1,prev),new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(parent)], null);
var G__128764 = pane_state;
return (nav_BANG_.cljs$core$IFn$_invoke$arity$2 ? nav_BANG_.cljs$core$IFn$_invoke$arity$2(G__128763,G__128764) : nav_BANG_.call(null,G__128763,G__128764));
})], 0)):null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),(cljs.core.truth_(next)?frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center","span.flex.items-center",-463750193),"Next chapter",frontend.ui.icon("arrow-right")], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"small?","small?",95242445),true,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var G__128765 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"topic-detail","topic-detail",-2143221053),cljs.core.nth.cljs$core$IFn$_invoke$arity$2(chapters__$1,next),new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(parent)], null);
var G__128766 = pane_state;
return (nav_BANG_.cljs$core$IFn$_invoke$arity$2 ? nav_BANG_.cljs$core$IFn$_invoke$arity$2(G__128765,G__128766) : nav_BANG_.call(null,G__128765,G__128766));
})], 0)):null)], null)], null);
} else {
return null;
}
})()], null);
} else {
return null;
}
})()], null)], null);
}
} else {
return null;
}
} else {
return null;
}
})());
}),null,"frontend.extensions.handbooks.core/pane-topic-detail");
frontend.extensions.handbooks.core.pane_dashboard = rum.core.lazy_build(rum.core.build_defc,(function (handbooks_nodes,pane_state,nav_to_pane_BANG_){
return daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(handbooks_nodes,"__root");
if(cljs.core.truth_(temp__5804__auto__)){
var root = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.pane.dashboard-pane","div.pane.dashboard-pane",2038750316),(function (){var temp__5804__auto____$1 = new cljs.core.Keyword(null,"popular-topics","popular-topics",-562514196).cljs$core$IFn$_invoke$arity$1(root);
if(cljs.core.truth_(temp__5804__auto____$1)){
var popular_topics = temp__5804__auto____$1;
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h2","h2",-372662728),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("handbook","popular-topics","handbook/popular-topics",-564403500)], 0))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.topics-list","div.topics-list",-199461940),(function (){var iter__5480__auto__ = (function frontend$extensions$handbooks$core$iter__128785(s__128786){
return (new cljs.core.LazySeq(null,(function (){
var s__128786__$1 = s__128786;
while(true){
var temp__5804__auto____$2 = cljs.core.seq(s__128786__$1);
if(temp__5804__auto____$2){
var s__128786__$2 = temp__5804__auto____$2;
if(cljs.core.chunked_seq_QMARK_(s__128786__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__128786__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__128788 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__128787 = (0);
while(true){
if((i__128787 < size__5479__auto__)){
var topic_key = cljs.core._nth(c__5478__auto__,i__128787);
cljs.core.chunk_append(b__128788,(function (){var temp__5804__auto____$3 = (function (){var and__5000__auto__ = typeof topic_key === 'string';
if(and__5000__auto__){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(handbooks_nodes,camel_snake_kebab.core.__GT_snake_case_string(frontend.util.safe_lower_case(topic_key)));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto____$3)){
var topic = temp__5804__auto____$3;
return frontend.extensions.handbooks.core.topic_card(topic,((function (i__128787,topic,temp__5804__auto____$3,topic_key,c__5478__auto__,size__5479__auto__,b__128788,s__128786__$2,temp__5804__auto____$2,popular_topics,temp__5804__auto____$1,root,temp__5804__auto__){
return (function (){
var G__128789 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"topic-detail","topic-detail",-2143221053),topic,frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("handbook","title","handbook/title",630546951)], 0))], null);
var G__128790 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"dashboard","dashboard",-631747508)], null);
return (nav_to_pane_BANG_.cljs$core$IFn$_invoke$arity$2 ? nav_to_pane_BANG_.cljs$core$IFn$_invoke$arity$2(G__128789,G__128790) : nav_to_pane_BANG_.call(null,G__128789,G__128790));
});})(i__128787,topic,temp__5804__auto____$3,topic_key,c__5478__auto__,size__5479__auto__,b__128788,s__128786__$2,temp__5804__auto____$2,popular_topics,temp__5804__auto____$1,root,temp__5804__auto__))
,null);
} else {
return null;
}
})());

var G__128989 = (i__128787 + (1));
i__128787 = G__128989;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__128788),frontend$extensions$handbooks$core$iter__128785(cljs.core.chunk_rest(s__128786__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__128788),null);
}
} else {
var topic_key = cljs.core.first(s__128786__$2);
return cljs.core.cons((function (){var temp__5804__auto____$3 = (function (){var and__5000__auto__ = typeof topic_key === 'string';
if(and__5000__auto__){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(handbooks_nodes,camel_snake_kebab.core.__GT_snake_case_string(frontend.util.safe_lower_case(topic_key)));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto____$3)){
var topic = temp__5804__auto____$3;
return frontend.extensions.handbooks.core.topic_card(topic,((function (topic,temp__5804__auto____$3,topic_key,s__128786__$2,temp__5804__auto____$2,popular_topics,temp__5804__auto____$1,root,temp__5804__auto__){
return (function (){
var G__128791 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"topic-detail","topic-detail",-2143221053),topic,frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("handbook","title","handbook/title",630546951)], 0))], null);
var G__128792 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"dashboard","dashboard",-631747508)], null);
return (nav_to_pane_BANG_.cljs$core$IFn$_invoke$arity$2 ? nav_to_pane_BANG_.cljs$core$IFn$_invoke$arity$2(G__128791,G__128792) : nav_to_pane_BANG_.call(null,G__128791,G__128792));
});})(topic,temp__5804__auto____$3,topic_key,s__128786__$2,temp__5804__auto____$2,popular_topics,temp__5804__auto____$1,root,temp__5804__auto__))
,null);
} else {
return null;
}
})(),frontend$extensions$handbooks$core$iter__128785(cljs.core.rest(s__128786__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(popular_topics);
})()], null)], null);
} else {
return null;
}
})(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h2","h2",-372662728),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("handbook","help-categories","handbook/help-categories",227903835)], 0))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.categories-list","div.categories-list",-1909249109),(function (){var categories = new cljs.core.Keyword(null,"children","children",-940561982).cljs$core$IFn$_invoke$arity$1(root);
var categories__$1 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.vec(categories),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"ls-shortcuts","ls-shortcuts",-1222790504),new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),"Keyboard shortcuts"], null),new cljs.core.Keyword(null,"children","children",-940561982),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core._PLUS_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.count,cljs.core.vals(cljs.core.deref(frontend.modules.shortcut.config._STAR_config))))," shortcuts"], null),new cljs.core.Keyword(null,"color","color",1011675173),"#2563EB",new cljs.core.Keyword(null,"icon","icon",1679606541),"command"], null));
var iter__5480__auto__ = (function frontend$extensions$handbooks$core$iter__128793(s__128794){
return (new cljs.core.LazySeq(null,(function (){
var s__128794__$1 = s__128794;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__128794__$1);
if(temp__5804__auto____$1){
var s__128794__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__128794__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__128794__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__128796 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__128795 = (0);
while(true){
if((i__128795 < size__5479__auto__)){
var map__128797 = cljs.core._nth(c__5478__auto__,i__128795);
var map__128797__$1 = cljs.core.__destructure_map(map__128797);
var category = map__128797__$1;
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__128797__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__128797__$1,new cljs.core.Keyword(null,"title","title",636505583));
var children = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__128797__$1,new cljs.core.Keyword(null,"children","children",-940561982));
var color = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__128797__$1,new cljs.core.Keyword(null,"color","color",1011675173));
var icon = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__128797__$1,new cljs.core.Keyword(null,"icon","icon",1679606541));
var total = (cljs.core.truth_(cljs.core.counted_QMARK_)?cljs.core.count(children):(0));
cljs.core.chunk_append(b__128796,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.category-card.text-left","button.category-card.text-left",-2091900834),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"key","key",-1516042587),key,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"border-left-color","border-left-color",-1166146583),(function (){var or__5002__auto__ = frontend.ui.__GT_block_background_color(color);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "var(--ls-secondary-background-color)";
}
})()], null),new cljs.core.Keyword(null,"data-total","data-total",1198476295),total,new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__128795,total,map__128797,map__128797__$1,category,key,title,children,color,icon,c__5478__auto__,size__5479__auto__,b__128796,s__128794__$2,temp__5804__auto____$1,categories,categories__$1,root,temp__5804__auto__){
return (function (){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(key,new cljs.core.Keyword(null,"ls-shortcuts","ls-shortcuts",-1222790504))){
frontend.state.toggle_BANG_(new cljs.core.Keyword("ui","handbooks-open?","ui/handbooks-open?",1677401058));

frontend.state.open_right_sidebar_BANG_();

return frontend.state.sidebar_add_block_BANG_(frontend.state.get_current_repo(),"shortcut-settings",new cljs.core.Keyword(null,"shortcut-settings","shortcut-settings",-1663349734));
} else {
var G__128798 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"topics","topics",625768208),category,title], null);
var G__128799 = pane_state;
return (nav_to_pane_BANG_.cljs$core$IFn$_invoke$arity$2 ? nav_to_pane_BANG_.cljs$core$IFn$_invoke$arity$2(G__128798,G__128799) : nav_to_pane_BANG_.call(null,G__128798,G__128799));
}
});})(i__128795,total,map__128797,map__128797__$1,category,key,title,children,color,icon,c__5478__auto__,size__5479__auto__,b__128796,s__128794__$2,temp__5804__auto____$1,categories,categories__$1,root,temp__5804__auto__))
], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.icon-wrap","div.icon-wrap",1583346389),frontend.ui.icon((function (){var or__5002__auto__ = icon;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "chart-bubble";
}
})(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(20)], null))], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-wrap","div.text-wrap",-1396076251),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong","strong",269529000),title], null),((cljs.core.vector_QMARK_(children))?children:new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(total)," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.util.safe_lower_case(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("handbook","topics","handbook/topics",627523704)], 0))))].join('')], null)
)], null)], null));

var G__128990 = (i__128795 + (1));
i__128795 = G__128990;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__128796),frontend$extensions$handbooks$core$iter__128793(cljs.core.chunk_rest(s__128794__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__128796),null);
}
} else {
var map__128800 = cljs.core.first(s__128794__$2);
var map__128800__$1 = cljs.core.__destructure_map(map__128800);
var category = map__128800__$1;
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__128800__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__128800__$1,new cljs.core.Keyword(null,"title","title",636505583));
var children = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__128800__$1,new cljs.core.Keyword(null,"children","children",-940561982));
var color = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__128800__$1,new cljs.core.Keyword(null,"color","color",1011675173));
var icon = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__128800__$1,new cljs.core.Keyword(null,"icon","icon",1679606541));
var total = (cljs.core.truth_(cljs.core.counted_QMARK_)?cljs.core.count(children):(0));
return cljs.core.cons(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.category-card.text-left","button.category-card.text-left",-2091900834),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"key","key",-1516042587),key,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"border-left-color","border-left-color",-1166146583),(function (){var or__5002__auto__ = frontend.ui.__GT_block_background_color(color);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "var(--ls-secondary-background-color)";
}
})()], null),new cljs.core.Keyword(null,"data-total","data-total",1198476295),total,new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (total,map__128800,map__128800__$1,category,key,title,children,color,icon,s__128794__$2,temp__5804__auto____$1,categories,categories__$1,root,temp__5804__auto__){
return (function (){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(key,new cljs.core.Keyword(null,"ls-shortcuts","ls-shortcuts",-1222790504))){
frontend.state.toggle_BANG_(new cljs.core.Keyword("ui","handbooks-open?","ui/handbooks-open?",1677401058));

frontend.state.open_right_sidebar_BANG_();

return frontend.state.sidebar_add_block_BANG_(frontend.state.get_current_repo(),"shortcut-settings",new cljs.core.Keyword(null,"shortcut-settings","shortcut-settings",-1663349734));
} else {
var G__128801 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"topics","topics",625768208),category,title], null);
var G__128802 = pane_state;
return (nav_to_pane_BANG_.cljs$core$IFn$_invoke$arity$2 ? nav_to_pane_BANG_.cljs$core$IFn$_invoke$arity$2(G__128801,G__128802) : nav_to_pane_BANG_.call(null,G__128801,G__128802));
}
});})(total,map__128800,map__128800__$1,category,key,title,children,color,icon,s__128794__$2,temp__5804__auto____$1,categories,categories__$1,root,temp__5804__auto__))
], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.icon-wrap","div.icon-wrap",1583346389),frontend.ui.icon((function (){var or__5002__auto__ = icon;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "chart-bubble";
}
})(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(20)], null))], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-wrap","div.text-wrap",-1396076251),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong","strong",269529000),title], null),((cljs.core.vector_QMARK_(children))?children:new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(total)," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.util.safe_lower_case(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("handbook","topics","handbook/topics",627523704)], 0))))].join('')], null)
)], null)], null),frontend$extensions$handbooks$core$iter__128793(cljs.core.rest(s__128794__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(categories__$1);
})()], null)], null);
} else {
return null;
}
})());
}),null,"frontend.extensions.handbooks.core/pane-dashboard");
frontend.extensions.handbooks.core.pane_settings = rum.core.lazy_build(rum.core.build_defc,(function (dev_watch_QMARK_,set_dev_watch_QMARK_){
return daiquiri.core.create_element("div",{'className':"pane pane-settings"},[daiquiri.core.create_element("div",{'className':"item"},[daiquiri.core.create_element("p",{'className':"flex items-center space-x-3 mb-0"},[daiquiri.core.create_element("strong",null,["Writing mode (preview in time)"]),daiquiri.interpreter.interpret(frontend.ui.toggle.cljs$core$IFn$_invoke$arity$3(dev_watch_QMARK_,(function (){
var G__128806 = cljs.core.not(dev_watch_QMARK_);
return (set_dev_watch_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_dev_watch_QMARK_.cljs$core$IFn$_invoke$arity$1(G__128806) : set_dev_watch_QMARK_.call(null,G__128806));
}),true))]),daiquiri.core.create_element("small",{'className':"opacity-30"},[["Resources from ",frontend.extensions.handbooks.core.get_handbooks_endpoint("/")].join('')])])]);
}),null,"frontend.extensions.handbooks.core/pane-settings");
frontend.extensions.handbooks.core.search_bar = rum.core.lazy_build(rum.core.build_defc,(function (pane_state,nav_BANG_,handbooks_nodes,search_state,set_search_state_BANG_){
var _STAR_input_ref = rum.core.use_ref(null);
var vec__128811 = rum.core.use_state("");
var q = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128811,(0),null);
var set_q_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128811,(1),null);
var vec__128814 = rum.core.use_state(null);
var results = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128814,(0),null);
var set_results_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128814,(1),null);
var vec__128817 = rum.core.use_state((0));
var selected = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128817,(0),null);
var set_selected_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128817,(1),null);
var select_fn_BANG_ = (function (p1__128807_SHARP_){
var temp__5804__auto__ = (function (){var and__5000__auto__ = cljs.core.seq(results);
if(and__5000__auto__){
return (cljs.core.count(results) - (1));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var ldx = temp__5804__auto__;
var G__128820 = (function (){var G__128821 = p1__128807_SHARP_;
var G__128821__$1 = (((G__128821 instanceof cljs.core.Keyword))?G__128821.fqn:null);
switch (G__128821__$1) {
case "up":
if((selected === (0))){
return ldx;
} else {
var x__5087__auto__ = (selected - (1));
var y__5088__auto__ = (0);
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
}

break;
case "down":
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(selected,ldx)){
return (0);
} else {
var x__5090__auto__ = (selected + (1));
var y__5091__auto__ = ldx;
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
}

break;
default:
return new cljs.core.Keyword(null,"dune","dune",1737226819);

}
})();
return (set_selected_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_selected_BANG_.cljs$core$IFn$_invoke$arity$1(G__128820) : set_selected_BANG_.call(null,G__128820));
} else {
return null;
}
});
var q__$1 = frontend.util.trim_safe(q);
var active_QMARK_ = (!(clojure.string.blank_QMARK_(frontend.util.trim_safe(q__$1))));
var reset_q_BANG_ = (function (){
var G__128822 = (rum.core.deref(_STAR_input_ref).value = "");
return (set_q_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_q_BANG_.cljs$core$IFn$_invoke$arity$1(G__128822) : set_q_BANG_.call(null,G__128822));
});
var focus_q_BANG_ = (function (){
var G__128823 = rum.core.deref(_STAR_input_ref);
if((G__128823 == null)){
return null;
} else {
return G__128823.focus();
}
});
logseq.shui.hooks.use_effect_BANG_((function (){
return focus_q_BANG_();
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [pane_state], null));

logseq.shui.hooks.use_effect_BANG_((function (){
var pane_nodes = new cljs.core.Keyword(null,"children","children",-940561982).cljs$core$IFn$_invoke$arity$1(cljs.core.second(pane_state));
var pane_nodes__$1 = (function (){var and__5000__auto__ = cljs.core.seq(pane_nodes);
if(and__5000__auto__){
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__128808_SHARP_){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"children","children",-940561982).cljs$core$IFn$_invoke$arity$1(p1__128808_SHARP_),p1__128808_SHARP_);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([pane_nodes], 0));
} else {
return and__5000__auto__;
}
})();
var G__128824_128992 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([search_state,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"active?","active?",459499776),active_QMARK_], null)], 0));
(set_search_state_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_search_state_BANG_.cljs$core$IFn$_invoke$arity$1(G__128824_128992) : set_search_state_BANG_.call(null,G__128824_128992));

if(((cljs.core.seq(handbooks_nodes)) && (active_QMARK_))){
var G__128825_128993 = (function (){var G__128826 = (function (){var or__5002__auto__ = pane_nodes__$1;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.vals(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(handbooks_nodes,"__root"));
}
})();
var G__128827 = q__$1;
var G__128828 = new cljs.core.Keyword(null,"limit","limit",-1355822363);
var G__128829 = (30);
var G__128830 = new cljs.core.Keyword(null,"extract-fn","extract-fn",-339752723);
var G__128831 = new cljs.core.Keyword(null,"title","title",636505583);
return (frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$6 ? frontend.search.fuzzy_search.cljs$core$IFn$_invoke$arity$6(G__128826,G__128827,G__128828,G__128829,G__128830,G__128831) : frontend.search.fuzzy_search.call(null,G__128826,G__128827,G__128828,G__128829,G__128830,G__128831));
})();
(set_results_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_results_BANG_.cljs$core$IFn$_invoke$arity$1(G__128825_128993) : set_results_BANG_.call(null,G__128825_128993));
} else {
(set_results_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_results_BANG_.cljs$core$IFn$_invoke$arity$1(null) : set_results_BANG_.call(null,null));
}

return (set_selected_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_selected_BANG_.cljs$core$IFn$_invoke$arity$1((0)) : set_selected_BANG_.call(null,(0)));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [q__$1], null));

return daiquiri.core.create_element("div",{'className':"search"},[daiquiri.core.create_element("div",{'className':"input-wrap relative"},[daiquiri.core.create_element("span",{'style':{'top':(6),'left':(7)},'className':"icon absolute opacity-90"},[daiquiri.interpreter.interpret(frontend.ui.icon("search",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(12)], null)))]),daiquiri.core.create_element("input",{'placeholder':frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("handbook","search","handbook/search",1571568150)], 0)),'autoFocus':true,'defaultValue':q__$1,'onChange':rum.core.mark_sync_update((function (p1__128809_SHARP_){
var G__128832 = frontend.util.evalue(p1__128809_SHARP_);
return (set_q_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_q_BANG_.cljs$core$IFn$_invoke$arity$1(G__128832) : set_q_BANG_.call(null,G__128832));
})),'onKeyDown':(function (p1__128810_SHARP_){
var G__128833 = p1__128810_SHARP_.keyCode;
switch (G__128833) {
case (27):
if((!(active_QMARK_))){
return frontend.state.toggle_BANG_(new cljs.core.Keyword("ui","handbooks-open?","ui/handbooks-open?",1677401058));
} else {
return reset_q_BANG_();
}

break;
case (38):
frontend.util.stop(p1__128810_SHARP_);

return select_fn_BANG_(new cljs.core.Keyword(null,"up","up",-269712113));

break;
case (40):
frontend.util.stop(p1__128810_SHARP_);

return select_fn_BANG_(new cljs.core.Keyword(null,"down","down",1565245570));

break;
case (13):
var temp__5804__auto__ = (function (){var and__5000__auto__ = active_QMARK_;
if(and__5000__auto__){
return cljs.core.nth.cljs$core$IFn$_invoke$arity$2(results,selected);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var topic = temp__5804__auto__;
frontend.util.stop(p1__128810_SHARP_);

var G__128834 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"topic-detail","topic-detail",-2143221053),topic,new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(topic)], null);
var G__128835 = pane_state;
return (nav_BANG_.cljs$core$IFn$_invoke$arity$2 ? nav_BANG_.cljs$core$IFn$_invoke$arity$2(G__128834,G__128835) : nav_BANG_.call(null,G__128834,G__128835));
} else {
return null;
}

break;
default:
return new cljs.core.Keyword(null,"dune","dune",1737226819);

}
}),'ref':_STAR_input_ref},[]),((active_QMARK_)?daiquiri.core.create_element("button",{'style':{'right':(6),'top':(7)},'onClick':(function (){
reset_q_BANG_();

return focus_q_BANG_();
}),'className':"icon absolute opacity-50 hover:opacity-80 select-none"},[daiquiri.interpreter.interpret(frontend.ui.icon("x",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(12)], null)))]):null)]),(cljs.core.truth_(new cljs.core.Keyword(null,"active?","active?",459499776).cljs$core$IFn$_invoke$arity$1(search_state))?daiquiri.core.create_element("div",{'className':"search-results-wrap"},[daiquiri.core.create_element("div",{'className':"results-wrap"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$extensions$handbooks$core$iter__128836(s__128837){
return (new cljs.core.LazySeq(null,(function (){
var s__128837__$1 = s__128837;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__128837__$1);
if(temp__5804__auto__){
var s__128837__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__128837__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__128837__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__128839 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__128838 = (0);
while(true){
if((i__128838 < size__5479__auto__)){
var vec__128840 = cljs.core._nth(c__5478__auto__,i__128838);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128840,(0),null);
var topic = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128840,(1),null);
cljs.core.chunk_append(b__128839,rum.core.with_key(frontend.extensions.handbooks.core.topic_card(topic,((function (i__128838,vec__128840,idx,topic,c__5478__auto__,size__5479__auto__,b__128839,s__128837__$2,temp__5804__auto__,_STAR_input_ref,vec__128811,q,set_q_BANG_,vec__128814,results,set_results_BANG_,vec__128817,selected,set_selected_BANG_,select_fn_BANG_,q__$1,active_QMARK_,reset_q_BANG_,focus_q_BANG_){
return (function (){
var G__128845 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"topic-detail","topic-detail",-2143221053),topic,new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(topic)], null);
var G__128846 = pane_state;
return (nav_BANG_.cljs$core$IFn$_invoke$arity$2 ? nav_BANG_.cljs$core$IFn$_invoke$arity$2(G__128845,G__128846) : nav_BANG_.call(null,G__128845,G__128846));
});})(i__128838,vec__128840,idx,topic,c__5478__auto__,size__5479__auto__,b__128839,s__128837__$2,temp__5804__auto__,_STAR_input_ref,vec__128811,q,set_q_BANG_,vec__128814,results,set_results_BANG_,vec__128817,selected,set_selected_BANG_,select_fn_BANG_,q__$1,active_QMARK_,reset_q_BANG_,focus_q_BANG_))
,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"active","active",1895962068),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(selected,idx)], null)], null))], null)),new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(topic)));

var G__128995 = (i__128838 + (1));
i__128838 = G__128995;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__128839),frontend$extensions$handbooks$core$iter__128836(cljs.core.chunk_rest(s__128837__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__128839),null);
}
} else {
var vec__128847 = cljs.core.first(s__128837__$2);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128847,(0),null);
var topic = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128847,(1),null);
return cljs.core.cons(rum.core.with_key(frontend.extensions.handbooks.core.topic_card(topic,((function (vec__128847,idx,topic,s__128837__$2,temp__5804__auto__,_STAR_input_ref,vec__128811,q,set_q_BANG_,vec__128814,results,set_results_BANG_,vec__128817,selected,set_selected_BANG_,select_fn_BANG_,q__$1,active_QMARK_,reset_q_BANG_,focus_q_BANG_){
return (function (){
var G__128852 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"topic-detail","topic-detail",-2143221053),topic,new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(topic)], null);
var G__128853 = pane_state;
return (nav_BANG_.cljs$core$IFn$_invoke$arity$2 ? nav_BANG_.cljs$core$IFn$_invoke$arity$2(G__128852,G__128853) : nav_BANG_.call(null,G__128852,G__128853));
});})(vec__128847,idx,topic,s__128837__$2,temp__5804__auto__,_STAR_input_ref,vec__128811,q,set_q_BANG_,vec__128814,results,set_results_BANG_,vec__128817,selected,set_selected_BANG_,select_fn_BANG_,q__$1,active_QMARK_,reset_q_BANG_,focus_q_BANG_))
,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"active","active",1895962068),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(selected,idx)], null)], null))], null)),new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(topic)),frontend$extensions$handbooks$core$iter__128836(cljs.core.rest(s__128837__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(medley.core.indexed.cljs$core$IFn$_invoke$arity$1(results));
})())])]):null)]);
}),null,"frontend.extensions.handbooks.core/search-bar");
frontend.extensions.handbooks.core.link_card = rum.core.lazy_build(rum.core.build_defc,(function (opts,child){
var map__128857 = opts;
var map__128857__$1 = cljs.core.__destructure_map(map__128857);
var href = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__128857__$1,new cljs.core.Keyword(null,"href","href",-793805698));
var attrs128856 = (function (){var G__128858 = opts;
if(typeof href === 'string'){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__128858,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.util.open_url(href);
}));
} else {
return G__128858;
}
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs128856))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["link-card"], null)], null),attrs128856], 0))):{'className':"link-card"}),((cljs.core.map_QMARK_(attrs128856))?[daiquiri.interpreter.interpret(child)]:[daiquiri.interpreter.interpret(attrs128856),daiquiri.interpreter.interpret(child)]));
}),null,"frontend.extensions.handbooks.core/link-card");
frontend.extensions.handbooks.core.panes_mapping = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"dashboard","dashboard",-631747508),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.extensions.handbooks.core.pane_dashboard], null),new cljs.core.Keyword(null,"topics","topics",625768208),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.extensions.handbooks.core.pane_category_topics], null),new cljs.core.Keyword(null,"topic-detail","topic-detail",-2143221053),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.extensions.handbooks.core.pane_topic_detail], null),new cljs.core.Keyword(null,"settings","settings",1556144875),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.extensions.handbooks.core.pane_settings], null)], null);
if((typeof frontend !== 'undefined') && (typeof frontend.extensions !== 'undefined') && (typeof frontend.extensions.handbooks !== 'undefined') && (typeof frontend.extensions.handbooks.core !== 'undefined') && (typeof frontend.extensions.handbooks.core.discord_endpoint !== 'undefined')){
} else {
frontend.extensions.handbooks.core.discord_endpoint = "https://plugins.logseq.io/ds";
}
frontend.extensions.handbooks.core.footer_link_cards = rum.core.lazy_build(rum.core.build_defc,(function (){
var vec__128861 = frontend.rum.use_atom(frontend.extensions.handbooks.core._STAR_config);
var config = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128861,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128861,(1),null);
var discord_count = new cljs.core.Keyword(null,"discord-online","discord-online",2134040021).cljs$core$IFn$_invoke$arity$1(config);
logseq.shui.hooks.use_effect_BANG_((function (){
if((((discord_count == null)) || (((Date.now() - new cljs.core.Keyword(null,"discord-online-created","discord-online-created",-1284739526).cljs$core$IFn$_invoke$arity$1(config)) > (((10) * (60)) * (1000)))))){
return promesa.core.then.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(window.fetch(frontend.extensions.handbooks.core.discord_endpoint),(function (p1__128859_SHARP_){
return p1__128859_SHARP_.json();
})),(function (p1__128860_SHARP_){
var temp__5804__auto__ = p1__128860_SHARP_.approximate_presence_count;
if(cljs.core.truth_(temp__5804__auto__)){
var count = temp__5804__auto__;
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(frontend.extensions.handbooks.core._STAR_config,cljs.core.assoc,new cljs.core.Keyword(null,"discord-online","discord-online",2134040021),count.toLocaleString(),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"discord-online-created","discord-online-created",-1284739526),Date.now()], 0));
} else {
return null;
}
}));
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [discord_count], null));

return daiquiri.core.create_element(daiquiri.core.fragment,null,[daiquiri.core.create_element("div",{'style':{'paddingTop':"4px"},'className':"flex space-x-3"},[frontend.extensions.handbooks.core.link_card(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"flex-1",new cljs.core.Keyword(null,"href","href",-793805698),"https://discord.gg/KpN4eHY"], null),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.inner.flex.space-x-1.flex-col","div.inner.flex.space-x-1.flex-col",1191635754),frontend.ui.icon("brand-discord",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"opacity-30",new cljs.core.Keyword(null,"size","size",1098693007),(26)], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h1.font-medium.py-1","h1.font-medium.py-1",255670902),"Chat on Discord"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h2.text-xs.leading-4.opacity-40","h2.text-xs.leading-4.opacity-40",-972896950),"Ask quick questions, meet fellow users, and learn new workflows."], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"small.flex.items-center.pt-1.5","small.flex.items-center.pt-1.5",-524446070),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"i.block.rounded-full.bg-green-500","i.block.rounded-full.bg-green-500",1711595098),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"width","width",-384071477),"8px",new cljs.core.Keyword(null,"height","height",1025178622),"8px"], null)], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.pl-2.opacity-90","span.pl-2.opacity-90",-756222661),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong.opacity-60","strong.opacity-60",972256666),(function (){var or__5002__auto__ = discord_count;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "?";
}
})()], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.opacity-70.font-light","span.opacity-70.font-light",1749010421)," users online"], null)], null)], null)], null)),frontend.extensions.handbooks.core.link_card(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"flex-1",new cljs.core.Keyword(null,"href","href",-793805698),"https://discuss.logseq.com"], null),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.inner.flex.space-x-1.flex-col","div.inner.flex.space-x-1.flex-col",1191635754),frontend.ui.icon("message-dots",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"opacity-30",new cljs.core.Keyword(null,"size","size",1098693007),(26)], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h1.font-medium.py-1","h1.font-medium.py-1",255670902),"Visit the forum"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h2.text-xs.leading-4.opacity-40","h2.text-xs.leading-4.opacity-40",-972896950),"Give feedback, request features, and have in-depth conversations."], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"small.flex.items-center.pt-1.5","small.flex.items-center.pt-1.5",-524446070),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"i.flex.items-center.opacity-50","i.flex.items-center.opacity-50",279473892),frontend.ui.icon("bolt",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(14)], null))], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.pl-1.opacity-90","span.pl-1.opacity-90",1964490413),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong.opacity-60","strong.opacity-60",972256666),"800+"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.opacity-70.font-light","span.opacity-70.font-light",1749010421)," monthly posts"], null)], null)], null)], null))])]);
}),null,"frontend.extensions.handbooks.core/footer-link-cards");
frontend.extensions.handbooks.core.content = rum.core.lazy_build(rum.core.build_defc,(function (){
var vec__128875 = rum.core.use_state(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"dashboard","dashboard",-631747508),null,frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("handbook","title","handbook/title",630546951)], 0))], null));
var active_pane_state = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128875,(0),null);
var set_active_pane_state_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128875,(1),null);
var vec__128878 = rum.core.use_state(null);
var handbooks_state = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128878,(0),null);
var set_handbooks_state_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128878,(1),null);
var vec__128881 = rum.core.use_state(null);
var handbooks_nodes = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128881,(0),null);
var set_handbooks_nodes_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128881,(1),null);
var vec__128884 = rum.core.use_state(cljs.core.List.EMPTY);
var history_state = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128884,(0),null);
var set_history_state_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128884,(1),null);
var vec__128887 = rum.core.use_state(frontend.storage.get(new cljs.core.Keyword(null,"handbooks-dev-watch?","handbooks-dev-watch?",-372916840)));
var dev_watch_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128887,(0),null);
var set_dev_watch_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128887,(1),null);
var vec__128890 = rum.core.use_state(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"active?","active?",459499776),false], null));
var search_state = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128890,(0),null);
var set_search_state_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128890,(1),null);
var reset_handbooks_BANG_ = (function (){
var G__128896 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"status","status",-1997798413),null,new cljs.core.Keyword(null,"data","data",-232669377),null,new cljs.core.Keyword(null,"error","error",-978969032),null], null);
return (set_handbooks_state_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_handbooks_state_BANG_.cljs$core$IFn$_invoke$arity$1(G__128896) : set_handbooks_state_BANG_.call(null,G__128896));
});
var update_handbooks_BANG_ = (function (p1__128868_SHARP_){
var G__128897 = (function (v){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([v,p1__128868_SHARP_], 0));
});
return (set_handbooks_state_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_handbooks_state_BANG_.cljs$core$IFn$_invoke$arity$1(G__128897) : set_handbooks_state_BANG_.call(null,G__128897));
});
var load_handbooks_BANG_ = (function (){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"pending","pending",-220036727),new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(handbooks_state))){
return null;
} else {
reset_handbooks_BANG_();

update_handbooks_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"pending","pending",-220036727)], null));

return promesa.core.finally$.cljs$core$IFn$_invoke$arity$2(promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(fetch(frontend.extensions.handbooks.core.get_handbooks_endpoint("/handbooks.edn"))),(function (res){
return promesa.protocols._mcat(promesa.protocols._promise(res.text()),(function (data){
return promesa.protocols._promise(update_handbooks_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data","data",-232669377),clojure.edn.read_string.cljs$core$IFn$_invoke$arity$1(data)], null)));
}));
}));
})),(function (p1__128869_SHARP_){
return update_handbooks_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__128869_SHARP_)], null));
})),(function (){
return update_handbooks_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"completed","completed",-486056503)], null));
}));
}
});
var active_pane_name = cljs.core.first(active_pane_state);
var pane_render = cljs.core.first(cljs.core.get.cljs$core$IFn$_invoke$arity$2(frontend.extensions.handbooks.core.panes_mapping,active_pane_name));
var pane_dashboard_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"dashboard","dashboard",-631747508),active_pane_name);
var pane_settings_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"settings","settings",1556144875),active_pane_name);
var pane_topic_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"topic-detail","topic-detail",-2143221053),active_pane_name);
var force_nav_dashboard_BANG_ = (function (){
var G__128898_128996 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"dashboard","dashboard",-631747508)], null);
(set_active_pane_state_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_active_pane_state_BANG_.cljs$core$IFn$_invoke$arity$1(G__128898_128996) : set_active_pane_state_BANG_.call(null,G__128898_128996));

var G__128899 = cljs.core.List.EMPTY;
return (set_history_state_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_history_state_BANG_.cljs$core$IFn$_invoke$arity$1(G__128899) : set_history_state_BANG_.call(null,G__128899));
});
var handbooks_loaded_QMARK_ = ((cljs.core.seq(new cljs.core.Keyword(null,"data","data",-232669377).cljs$core$IFn$_invoke$arity$1(handbooks_state))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"completed","completed",-486056503),new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(handbooks_state))));
var handbooks_data = new cljs.core.Keyword(null,"data","data",-232669377).cljs$core$IFn$_invoke$arity$1(handbooks_state);
var nav_to_pane_BANG_ = (function (next_state,prev_state){
var next_key_128997 = new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(cljs.core.second(next_state));
var prev_key_128998 = new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(cljs.core.second(prev_state));
var in_chapters_QMARK__128999 = (function (){var and__5000__auto__ = prev_key_128998;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = next_key_128997;
if(cljs.core.truth_(and__5000__auto____$1)){
var and__5000__auto____$2 = clojure.string.includes_QMARK_(prev_key_128998,"/");
if(and__5000__auto____$2){
var or__5002__auto__ = clojure.string.starts_with_QMARK_(next_key_128997,prev_key_128998);
if(or__5002__auto__){
return or__5002__auto__;
} else {
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core._EQ_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(frontend.extensions.handbooks.core.parse_parent_key,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [prev_key_128998,next_key_128997], null)));
}
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(in_chapters_QMARK__128999)){
} else {
var G__128900_129000 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(history_state),prev_state);
(set_history_state_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_history_state_BANG_.cljs$core$IFn$_invoke$arity$1(G__128900_129000) : set_history_state_BANG_.call(null,G__128900_129000));
}

return (set_active_pane_state_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_active_pane_state_BANG_.cljs$core$IFn$_invoke$arity$1(next_state) : set_active_pane_state_BANG_.call(null,next_state));
});
var vec__128893 = rum.core.use_state(false);
var scrolled_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128893,(0),null);
var set_scrolled_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__128893,(1),null);
var on_scroll = logseq.shui.hooks.use_memo((function (){
var G__128901 = (function (e){
var G__128903 = (!((e.target.scrollTop < (10))));
return (set_scrolled_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_scrolled_BANG_.cljs$core$IFn$_invoke$arity$1(G__128903) : set_scrolled_BANG_.call(null,G__128903));
});
var G__128902 = (100);
return (frontend.util.debounce.cljs$core$IFn$_invoke$arity$2 ? frontend.util.debounce.cljs$core$IFn$_invoke$arity$2(G__128901,G__128902) : frontend.util.debounce.call(null,G__128901,G__128902));
}),cljs.core.PersistentVector.EMPTY);
logseq.shui.hooks.use_effect_BANG_((function (){
return load_handbooks_BANG_();
}),cljs.core.PersistentVector.EMPTY);

logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core.seq(handbooks_nodes)){
var c = new cljs.core.Keyword("handbook","route-chan","handbook/route-chan",1649058330).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
var c__32195__auto___129001 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_128929){
var state_val_128930 = (state_128929[(1)]);
if((state_val_128930 === (7))){
var inst_128925 = (state_128929[(2)]);
var state_128929__$1 = state_128929;
var statearr_128931_129002 = state_128929__$1;
(statearr_128931_129002[(2)] = inst_128925);

(statearr_128931_129002[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_128930 === (1))){
var state_128929__$1 = state_128929;
var statearr_128932_129003 = state_128929__$1;
(statearr_128932_129003[(2)] = null);

(statearr_128932_129003[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_128930 === (4))){
var inst_128906 = (state_128929[(7)]);
var inst_128906__$1 = (state_128929[(2)]);
var inst_128907 = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(inst_128906__$1,new cljs.core.Keyword(null,"return","return",-1891502105));
var state_128929__$1 = (function (){var statearr_128933 = state_128929;
(statearr_128933[(7)] = inst_128906__$1);

return statearr_128933;
})();
if(inst_128907){
var statearr_128934_129004 = state_128929__$1;
(statearr_128934_129004[(1)] = (5));

} else {
var statearr_128935_129005 = state_128929__$1;
(statearr_128935_129005[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_128930 === (6))){
var state_128929__$1 = state_128929;
var statearr_128936_129006 = state_128929__$1;
(statearr_128936_129006[(2)] = null);

(statearr_128936_129006[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_128930 === (3))){
var inst_128927 = (state_128929[(2)]);
var state_128929__$1 = state_128929;
return cljs.core.async.impl.ioc_helpers.return_chan(state_128929__$1,inst_128927);
} else {
if((state_val_128930 === (2))){
var state_128929__$1 = state_128929;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_128929__$1,(4),c);
} else {
if((state_val_128930 === (9))){
var state_128929__$1 = state_128929;
var statearr_128937_129007 = state_128929__$1;
(statearr_128937_129007[(2)] = null);

(statearr_128937_129007[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_128930 === (5))){
var inst_128906 = (state_128929[(7)]);
var inst_128909 = (state_128929[(8)]);
var inst_128909__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(handbooks_nodes,inst_128906);
var state_128929__$1 = (function (){var statearr_128939 = state_128929;
(statearr_128939[(8)] = inst_128909__$1);

return statearr_128939;
})();
if(cljs.core.truth_(inst_128909__$1)){
var statearr_128940_129008 = state_128929__$1;
(statearr_128940_129008[(1)] = (8));

} else {
var statearr_128941_129009 = state_128929__$1;
(statearr_128941_129009[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_128930 === (10))){
var inst_128921 = (state_128929[(2)]);
var state_128929__$1 = (function (){var statearr_128942 = state_128929;
(statearr_128942[(9)] = inst_128921);

return statearr_128942;
})();
var statearr_128943_129010 = state_128929__$1;
(statearr_128943_129010[(2)] = null);

(statearr_128943_129010[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_128930 === (8))){
var inst_128909 = (state_128929[(8)]);
var inst_128911 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_128912 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("handbook","title","handbook/title",630546951)], 0));
var inst_128913 = [new cljs.core.Keyword(null,"topic-detail","topic-detail",-2143221053),inst_128909,inst_128912];
var inst_128914 = (new cljs.core.PersistentVector(null,3,(5),inst_128911,inst_128913,null));
var inst_128915 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_128916 = [new cljs.core.Keyword(null,"dashboard","dashboard",-631747508)];
var inst_128917 = (new cljs.core.PersistentVector(null,1,(5),inst_128915,inst_128916,null));
var inst_128918 = nav_to_pane_BANG_(inst_128914,inst_128917);
var state_128929__$1 = state_128929;
var statearr_128944_129011 = state_128929__$1;
(statearr_128944_129011[(2)] = inst_128918);

(statearr_128944_129011[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var frontend$extensions$handbooks$core$state_machine__32004__auto__ = null;
var frontend$extensions$handbooks$core$state_machine__32004__auto____0 = (function (){
var statearr_128945 = [null,null,null,null,null,null,null,null,null,null];
(statearr_128945[(0)] = frontend$extensions$handbooks$core$state_machine__32004__auto__);

(statearr_128945[(1)] = (1));

return statearr_128945;
});
var frontend$extensions$handbooks$core$state_machine__32004__auto____1 = (function (state_128929){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_128929);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e128946){var ex__32007__auto__ = e128946;
var statearr_128947_129012 = state_128929;
(statearr_128947_129012[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_128929[(4)]))){
var statearr_128948_129013 = state_128929;
(statearr_128948_129013[(1)] = cljs.core.first((state_128929[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__129014 = state_128929;
state_128929 = G__129014;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$extensions$handbooks$core$state_machine__32004__auto__ = function(state_128929){
switch(arguments.length){
case 0:
return frontend$extensions$handbooks$core$state_machine__32004__auto____0.call(this);
case 1:
return frontend$extensions$handbooks$core$state_machine__32004__auto____1.call(this,state_128929);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$extensions$handbooks$core$state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$extensions$handbooks$core$state_machine__32004__auto____0;
frontend$extensions$handbooks$core$state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$extensions$handbooks$core$state_machine__32004__auto____1;
return frontend$extensions$handbooks$core$state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_128949 = f__32196__auto__();
(statearr_128949[(6)] = c__32195__auto___129001);

return statearr_128949;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));


return (function (){
var c__32195__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_128954){
var state_val_128955 = (state_128954[(1)]);
if((state_val_128955 === (1))){
var state_128954__$1 = state_128954;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_128954__$1,(2),c,new cljs.core.Keyword(null,"return","return",-1891502105));
} else {
if((state_val_128955 === (2))){
var inst_128952 = (state_128954[(2)]);
var state_128954__$1 = state_128954;
return cljs.core.async.impl.ioc_helpers.return_chan(state_128954__$1,inst_128952);
} else {
return null;
}
}
});
return (function() {
var frontend$extensions$handbooks$core$state_machine__32004__auto__ = null;
var frontend$extensions$handbooks$core$state_machine__32004__auto____0 = (function (){
var statearr_128956 = [null,null,null,null,null,null,null];
(statearr_128956[(0)] = frontend$extensions$handbooks$core$state_machine__32004__auto__);

(statearr_128956[(1)] = (1));

return statearr_128956;
});
var frontend$extensions$handbooks$core$state_machine__32004__auto____1 = (function (state_128954){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_128954);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e128957){var ex__32007__auto__ = e128957;
var statearr_128958_129015 = state_128954;
(statearr_128958_129015[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_128954[(4)]))){
var statearr_128959_129016 = state_128954;
(statearr_128959_129016[(1)] = cljs.core.first((state_128954[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__129017 = state_128954;
state_128954 = G__129017;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$extensions$handbooks$core$state_machine__32004__auto__ = function(state_128954){
switch(arguments.length){
case 0:
return frontend$extensions$handbooks$core$state_machine__32004__auto____0.call(this);
case 1:
return frontend$extensions$handbooks$core$state_machine__32004__auto____1.call(this,state_128954);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$extensions$handbooks$core$state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$extensions$handbooks$core$state_machine__32004__auto____0;
frontend$extensions$handbooks$core$state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$extensions$handbooks$core$state_machine__32004__auto____1;
return frontend$extensions$handbooks$core$state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_128960 = f__32196__auto__();
(statearr_128960[(6)] = c__32195__auto__);

return statearr_128960;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));

return c__32195__auto__;
});
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [handbooks_nodes], null));

logseq.shui.hooks.use_effect_BANG_((function (){
var _STAR_cnt_len = cljs.core.atom.cljs$core$IFn$_invoke$arity$1((0));
var check_BANG_ = (function (){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(fetch(frontend.extensions.handbooks.core.get_handbooks_endpoint("/handbooks.edn"),({"method": "HEAD"}))),(function (res){
return promesa.protocols._promise((function (){var temp__5804__auto__ = res.headers.get("content-length");
if(cljs.core.truth_(temp__5804__auto__)){
var cl = temp__5804__auto__;
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(_STAR_cnt_len),cl)){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["[Handbooks] dev reload!"], 0));

load_handbooks_BANG_();
} else {
}

return cljs.core.reset_BANG_(_STAR_cnt_len,cl);
} else {
return null;
}
})());
}));
})),(function (p1__128871_SHARP_){
return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["[Handbooks] dev check Error:",p1__128871_SHARP_], 0));
}));
});
var timer0 = (cljs.core.truth_(dev_watch_QMARK_)?setInterval(check_BANG_,(2000)):(0));
return (function (){
return clearInterval(timer0);
});
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [dev_watch_QMARK_], null));

logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core.truth_(handbooks_data)){
var nodes = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (p1__128872_SHARP_,p2__128873_SHARP_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__128872_SHARP_,(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(p2__128873_SHARP_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "__root";
}
})(),frontend.extensions.handbooks.core.bind_parent_key(p2__128873_SHARP_));
}),cljs.core.PersistentArrayMap.EMPTY,cljs.core.tree_seq(cljs.core.map_QMARK_,new cljs.core.Keyword(null,"children","children",-940561982),handbooks_data));
(set_handbooks_nodes_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_handbooks_nodes_BANG_.cljs$core$IFn$_invoke$arity$1(nodes) : set_handbooks_nodes_BANG_.call(null,nodes));

return (window.handbook_nodes = cljs_bean.core.__GT_js(nodes));
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [handbooks_data], null));

return daiquiri.core.create_element("div",{'onScroll':on_scroll,'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cp__handbooks-content",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"search-active","search-active",913672682),new cljs.core.Keyword(null,"active?","active?",459499776).cljs$core$IFn$_invoke$arity$1(search_state),new cljs.core.Keyword(null,"scrolled","scrolled",1345586855),scrolled_QMARK_], null)], null))], null))},[daiquiri.core.create_element("div",{'className':"pane-wrap"},[daiquiri.core.create_element("div",{'className':"hd flex justify-between select-none draggable-handle"},[(function (){var attrs128969 = ((pane_dashboard_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("handbook","title","handbook/title",630546951)], 0))], null):new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.active:opacity-80.flex.items-center.cursor-pointer","button.active:opacity-80.flex.items-center.cursor-pointer",42988709),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var prev = cljs.core.first(history_state);
var prev__$1 = (function (){var G__128971 = prev;
if((cljs.core.seq(prev) == null)){
var fexpr__128972 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"dashboard","dashboard",-631747508)], null);
return (fexpr__128972.cljs$core$IFn$_invoke$arity$1 ? fexpr__128972.cljs$core$IFn$_invoke$arity$1(G__128971) : fexpr__128972.call(null,G__128971));
} else {
return G__128971;
}
})();
(set_active_pane_state_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_active_pane_state_BANG_.cljs$core$IFn$_invoke$arity$1(prev__$1) : set_active_pane_state_BANG_.call(null,prev__$1));

var G__128973 = cljs.core.rest(history_state);
return (set_history_state_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_history_state_BANG_.cljs$core$IFn$_invoke$arity$1(G__128973) : set_history_state_BANG_.call(null,G__128973));
})], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.pr-2.flex.items-center","span.pr-2.flex.items-center",1598272298),frontend.ui.icon("chevron-left")], null),(function (){var title = (function (){var or__5002__auto__ = cljs.core.last(active_pane_state);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("handbook","title","handbook/title",630546951)], 0));
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return "";
}
}
})();
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.truncate.title","span.truncate.title",900934232),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title","title",636505583),title], null),title], null);
})()], null));
return daiquiri.core.create_element("h1",((cljs.core.map_QMARK_(attrs128969))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-xl","flex","items-center","font-bold"], null)], null),attrs128969], 0))):{'className':"text-xl flex items-center font-bold"}),((cljs.core.map_QMARK_(attrs128969))?null:[daiquiri.interpreter.interpret(attrs128969)]));
})(),(function (){var attrs128970 = (((cljs.core.count(history_state) > (1)))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.flex.items-center","a.flex.items-center",46069439),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"aria-label","aria-label",455891514),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("handbook","home","handbook/home",-85236773)], 0)),new cljs.core.Keyword(null,"tabIndex","tabIndex",-169286716),"0",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return force_nav_dashboard_BANG_();
})], null),frontend.ui.icon("home")], null):null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs128970))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","space-x-3"], null)], null),attrs128970], 0))):{'className':"flex items-center space-x-3"}),((cljs.core.map_QMARK_(attrs128970))?[((pane_topic_QMARK_)?daiquiri.core.create_element("a",{'aria-label':"Copy topic link",'tabIndex':"0",'onClick':(function (){
var s = ["logseq://handbook/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(cljs.core.second(active_pane_state)))].join('');
frontend.util.copy_to_clipboard_BANG_(s);

return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong.block","strong.block",-1457813199),"Handbook link copied!"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"label.opacity-50","label.opacity-50",-1137064458),s], null)], null),new cljs.core.Keyword(null,"success","success",1890645906));
}),'className':"flex items-center"},[daiquiri.interpreter.interpret(frontend.ui.icon("copy"))]):null),(cljs.core.truth_(frontend.state.developer_mode_QMARK_())?daiquiri.core.create_element("a",{'aria-label':frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("handbook","settings","handbook/settings",1558555811)], 0)),'tabIndex':"0",'onClick':(function (){
return nav_to_pane_BANG_(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"settings","settings",1556144875),null,"Settings"], null),active_pane_state);
}),'className':"flex items-center"},[daiquiri.interpreter.interpret(frontend.ui.icon("settings"))]):null),daiquiri.core.create_element("a",{'aria-label':frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("handbook","close","handbook/close",1837454534)], 0)),'tabIndex':"0",'onClick':(function (){
return frontend.state.toggle_BANG_(new cljs.core.Keyword("ui","handbooks-open?","ui/handbooks-open?",1677401058));
}),'className':"flex items-center"},[daiquiri.interpreter.interpret(frontend.ui.icon("x"))])]:[daiquiri.interpreter.interpret(attrs128970),((pane_topic_QMARK_)?daiquiri.core.create_element("a",{'aria-label':"Copy topic link",'tabIndex':"0",'onClick':(function (){
var s = ["logseq://handbook/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(cljs.core.second(active_pane_state)))].join('');
frontend.util.copy_to_clipboard_BANG_(s);

return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong.block","strong.block",-1457813199),"Handbook link copied!"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"label.opacity-50","label.opacity-50",-1137064458),s], null)], null),new cljs.core.Keyword(null,"success","success",1890645906));
}),'className':"flex items-center"},[daiquiri.interpreter.interpret(frontend.ui.icon("copy"))]):null),(cljs.core.truth_(frontend.state.developer_mode_QMARK_())?daiquiri.core.create_element("a",{'aria-label':frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("handbook","settings","handbook/settings",1558555811)], 0)),'tabIndex':"0",'onClick':(function (){
return nav_to_pane_BANG_(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"settings","settings",1556144875),null,"Settings"], null),active_pane_state);
}),'className':"flex items-center"},[daiquiri.interpreter.interpret(frontend.ui.icon("settings"))]):null),daiquiri.core.create_element("a",{'aria-label':frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("handbook","close","handbook/close",1837454534)], 0)),'tabIndex':"0",'onClick':(function (){
return frontend.state.toggle_BANG_(new cljs.core.Keyword("ui","handbooks-open?","ui/handbooks-open?",1677401058));
}),'className':"flex items-center"},[daiquiri.interpreter.interpret(frontend.ui.icon("x"))])]));
})()]),(((((!(pane_settings_QMARK_))) && ((!(handbooks_loaded_QMARK_)))))?(function (){var attrs128961 = ((cljs.core.not(new cljs.core.Keyword(null,"error","error",-978969032).cljs$core$IFn$_invoke$arity$1(handbooks_state)))?frontend.ui.loading.cljs$core$IFn$_invoke$arity$1("Loading ..."):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"code","code",1586293142),new cljs.core.Keyword(null,"error","error",-978969032).cljs$core$IFn$_invoke$arity$1(handbooks_state)], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs128961))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center","justify-center","pt-32"], null)], null),attrs128961], 0))):{'className':"flex items-center justify-center pt-32"}),((cljs.core.map_QMARK_(attrs128961))?null:[daiquiri.interpreter.interpret(attrs128961)]));
})():null),((((pane_settings_QMARK_) || (handbooks_loaded_QMARK_)))?(function (){var attrs128962 = ((((pane_dashboard_QMARK_) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"topics","topics",625768208),active_pane_name))))?frontend.extensions.handbooks.core.search_bar(active_pane_state,nav_to_pane_BANG_,handbooks_nodes,search_state,set_search_state_BANG_):null);
return daiquiri.core.create_element(daiquiri.core.fragment,((cljs.core.map_QMARK_(attrs128962))?daiquiri.interpreter.element_attributes(attrs128962):null),((cljs.core.map_QMARK_(attrs128962))?[(cljs.core.truth_(pane_render)?daiquiri.interpreter.interpret(cljs.core.apply.cljs$core$IFn$_invoke$arity$2(pane_render,(function (){var G__128975 = active_pane_name;
var G__128975__$1 = (((G__128975 instanceof cljs.core.Keyword))?G__128975.fqn:null);
switch (G__128975__$1) {
case "settings":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [dev_watch_QMARK_,(function (p1__128874_SHARP_){
(set_dev_watch_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_dev_watch_QMARK_.cljs$core$IFn$_invoke$arity$1(p1__128874_SHARP_) : set_dev_watch_QMARK_.call(null,p1__128874_SHARP_));

return frontend.storage.set(new cljs.core.Keyword(null,"handbooks-dev-watch?","handbooks-dev-watch?",-372916840),p1__128874_SHARP_);
})], null);

break;
default:
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [handbooks_nodes,active_pane_state,nav_to_pane_BANG_], null);

}
})())):null)]:[daiquiri.interpreter.interpret(attrs128962),(cljs.core.truth_(pane_render)?daiquiri.interpreter.interpret(cljs.core.apply.cljs$core$IFn$_invoke$arity$2(pane_render,(function (){var G__128977 = active_pane_name;
var G__128977__$1 = (((G__128977 instanceof cljs.core.Keyword))?G__128977.fqn:null);
switch (G__128977__$1) {
case "settings":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [dev_watch_QMARK_,(function (p1__128874_SHARP_){
(set_dev_watch_QMARK_.cljs$core$IFn$_invoke$arity$1 ? set_dev_watch_QMARK_.cljs$core$IFn$_invoke$arity$1(p1__128874_SHARP_) : set_dev_watch_QMARK_.call(null,p1__128874_SHARP_));

return frontend.storage.set(new cljs.core.Keyword(null,"handbooks-dev-watch?","handbooks-dev-watch?",-372916840),p1__128874_SHARP_);
})], null);

break;
default:
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [handbooks_nodes,active_pane_state,nav_to_pane_BANG_], null);

}
})())):null)]));
})():null)]),((handbooks_loaded_QMARK_)?((pane_dashboard_QMARK_)?daiquiri.core.create_element("div",{'className':"ft"},[frontend.extensions.handbooks.core.footer_link_cards()]):null):null)]);
}),null,"frontend.extensions.handbooks.core/content");

//# sourceMappingURL=frontend.extensions.handbooks.core.js.map
