goog.provide('frontend.quick_capture');
frontend.quick_capture.is_tweet_link = (function frontend$quick_capture$is_tweet_link(url){
if(cljs.core.truth_(cljs.core.not_empty(url))){
var or__5002__auto__ = cljs.core.re_matches(/^https:\/\/twitter\.com\/.*?\/status\/.*?$/,url);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.re_matches(/^https:\/\/x\.com\/.*?\/status\/.*?$/,url);
}
} else {
return null;
}
});
frontend.quick_capture.quick_capture = (function frontend$quick_capture$quick_capture(args){
var map__91466 = cljs_bean.core.__GT_clj(args);
var map__91466__$1 = cljs.core.__destructure_map(map__91466);
var url = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91466__$1,new cljs.core.Keyword(null,"url","url",276297046));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91466__$1,new cljs.core.Keyword(null,"title","title",636505583));
var content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91466__$1,new cljs.core.Keyword(null,"content","content",15833224));
var page = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91466__$1,new cljs.core.Keyword(null,"page","page",849072397));
var append = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91466__$1,new cljs.core.Keyword(null,"append","append",-291298229));
var title__$1 = (function (){var or__5002__auto__ = title;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})();
var url__$1 = (function (){var or__5002__auto__ = url;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})();
var insert_today_QMARK_ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$3(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"quick-capture-options","quick-capture-options",-1438286765),new cljs.core.Keyword(null,"insert-today?","insert-today?",-1745022679)], null),false);
var redirect_page_QMARK_ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$3(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"quick-capture-options","quick-capture-options",-1438286765),new cljs.core.Keyword(null,"redirect-page?","redirect-page?",1237222059)], null),false);
var today_page = clojure.string.lower_case(frontend.date.today());
var current_page = frontend.state.get_current_page();
var default_page = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"quick-capture-options","quick-capture-options",-1438286765),new cljs.core.Keyword(null,"default-page","default-page",673738268)], null));
var page__$1 = (cljs.core.truth_((function (){var and__5000__auto__ = frontend.state.enable_journals_QMARK_.cljs$core$IFn$_invoke$arity$0();
if(cljs.core.truth_(and__5000__auto__)){
var or__5002__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(page,"TODAY");
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto____$1 = clojure.string.blank_QMARK_(page);
if(and__5000__auto____$1){
return insert_today_QMARK_;
} else {
return and__5000__auto____$1;
}
}
} else {
return and__5000__auto__;
}
})())?today_page:(cljs.core.truth_(cljs.core.not_empty(page))?page:(cljs.core.truth_(cljs.core.not_empty(default_page))?default_page:(cljs.core.truth_(cljs.core.not_empty(current_page))?current_page:(cljs.core.truth_(frontend.state.enable_journals_QMARK_.cljs$core$IFn$_invoke$arity$0())?today_page:"quick capture")
))));
var format = (frontend.db.get_page_format.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page_format.cljs$core$IFn$_invoke$arity$1(page__$1) : frontend.db.get_page_format.call(null,page__$1));
var time = frontend.date.get_current_time();
var text = (function (){var or__5002__auto__ = (function (){var and__5000__auto__ = content;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not_empty(clojure.string.trim(content));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})();
var link = ((clojure.string.blank_QMARK_(url__$1))?title__$1:((cljs.core.boolean$(frontend.util.text.get_matched_video(url__$1)))?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(title__$1)," {{video ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(url__$1),"}}"].join(''):(cljs.core.truth_(frontend.quick_capture.is_tweet_link(url__$1))?(frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("{{twitter %s}}",url__$1) : frontend.util.format.call(null,"{{twitter %s}}",url__$1)):((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(title__$1,url__$1))?frontend.config.link_format(format,null,url__$1):frontend.config.link_format(format,title__$1,url__$1)
))));
var template = cljs.core.get_in.cljs$core$IFn$_invoke$arity$3(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"quick-capture-templates","quick-capture-templates",-1488741596),new cljs.core.Keyword(null,"text","text",-1790561697)], null),"**{time}** [[quick capture]]: {text} {url}");
var date_ref_name = frontend.date.today();
var content__$1 = clojure.string.replace(clojure.string.replace(clojure.string.replace(clojure.string.replace(template,"{time}",time),"{date}",date_ref_name),"{url}",link),"{text}",text);
var edit_content = frontend.state.get_edit_content();
var edit_content_blank_QMARK_ = clojure.string.blank_QMARK_(edit_content);
var edit_content_include_capture_QMARK_ = (function (){var and__5000__auto__ = cljs.core.not_empty(edit_content);
if(cljs.core.truth_(and__5000__auto__)){
return clojure.string.includes_QMARK_(edit_content,"[[quick capture]]");
} else {
return and__5000__auto__;
}
})();
if(((frontend.state.editing_QMARK_()) && (((cljs.core.not(append)) && (cljs.core.not(edit_content_include_capture_QMARK_)))))){
if(edit_content_blank_QMARK_){
return frontend.handler.editor.insert.cljs$core$IFn$_invoke$arity$1(content__$1);
} else {
return frontend.handler.editor.insert.cljs$core$IFn$_invoke$arity$1(["\n",content__$1].join(''));
}
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.escape_editing()),(function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(page__$1,frontend.state.get_current_page()))?(function (){var G__91467 = page__$1;
var G__91468 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"redirect?","redirect?",-1229259098),redirect_page_QMARK_], null);
return (frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2(G__91467,G__91468) : frontend.handler.page._LT_create_BANG_.call(null,G__91467,G__91468));
})():null)),(function (___40947__auto____$1){
return promesa.protocols._promise(setTimeout((function (){
return frontend.handler.editor.api_insert_new_block_BANG_(content__$1,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"page","page",849072397),page__$1,new cljs.core.Keyword(null,"edit-block?","edit-block?",-310383789),true,new cljs.core.Keyword(null,"replace-empty-target?","replace-empty-target?",-923732440),true], null));
}),(100)));
}));
}));
}));
}
});

//# sourceMappingURL=frontend.quick_capture.js.map
