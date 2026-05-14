goog.provide('frontend.util');
goog.scope(function(){
  frontend.util.goog$module$goog$object = goog.module.get('goog.object');
});
var module$node_modules$$capacitor$status_bar$dist$plugin_cjs=shadow.js.require("module$node_modules$$capacitor$status_bar$dist$plugin_cjs", {});
var module$node_modules$$capgo$capacitor_navigation_bar$dist$plugin_cjs=shadow.js.require("module$node_modules$$capgo$capacitor_navigation_bar$dist$plugin_cjs", {});
var module$node_modules$grapheme_splitter$index=shadow.js.require("module$node_modules$grapheme_splitter$index", {});
var module$node_modules$sanitize_filename$index=shadow.js.require("module$node_modules$sanitize_filename$index", {});
var module$node_modules$check_password_strength$dist$umd=shadow.js.require("module$node_modules$check_password_strength$dist$umd", {});
var module$node_modules$path_complete_extname$index=shadow.js.require("module$node_modules$path_complete_extname$index", {});
var module$node_modules$semver$index=shadow.js.require("module$node_modules$semver$index", {});
/**
 * @define {boolean}
 */
frontend.util.NODETEST = goog.define("frontend.util.NODETEST",false);
if((typeof frontend !== 'undefined') && (typeof frontend.util !== 'undefined') && (typeof frontend.util.node_test_QMARK_ !== 'undefined')){
} else {
frontend.util.node_test_QMARK_ = frontend.util.NODETEST;
}
(cljs.core.IPrintWithWriter["symbol"] = true);

(cljs.core._pr_writer["symbol"] = (function (sym,writer,_){
return cljs.core._write(writer,["\"",cljs.core.str.cljs$core$IFn$_invoke$arity$1(sym.toString()),"\""].join(''));
}));
(cljs.core.UUID.prototype.cljs$core$INamed$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.UUID.prototype.cljs$core$INamed$_name$arity$1 = (function (this$){
var this$__$1 = this;
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(this$__$1);
}));

(cljs.core.UUID.prototype.cljs$core$INamed$_namespace$arity$1 = (function (_){
var ___$1 = this;
return null;
}));
if((typeof frontend !== 'undefined') && (typeof frontend.util !== 'undefined') && (typeof frontend.util.node_path !== 'undefined')){
} else {
frontend.util.node_path = module$frontend$utils.nodePath;
}
if((typeof frontend !== 'undefined') && (typeof frontend.util !== 'undefined') && (typeof frontend.util.sem_ver !== 'undefined')){
} else {
frontend.util.sem_ver = module$node_modules$semver$index;
}
if((typeof frontend !== 'undefined') && (typeof frontend.util !== 'undefined') && (typeof frontend.util.full_path_extname !== 'undefined')){
} else {
frontend.util.full_path_extname = module$node_modules$path_complete_extname$index;
}
frontend.util.app_scroll_container_node = (function frontend$util$app_scroll_container_node(var_args){
var G__99554 = arguments.length;
switch (G__99554) {
case 0:
return frontend.util.app_scroll_container_node.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.util.app_scroll_container_node.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.util.app_scroll_container_node.cljs$core$IFn$_invoke$arity$0 = (function (){
return goog.dom.getElement("main-content-container");
}));

(frontend.util.app_scroll_container_node.cljs$core$IFn$_invoke$arity$1 = (function (el){
if(cljs.core.truth_(el.closest("#main-content-container"))){
return frontend.util.app_scroll_container_node.cljs$core$IFn$_invoke$arity$0();
} else {
var or__5002__auto__ = goog.dom.getElementByClass("sidebar-item-list");
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.util.app_scroll_container_node.cljs$core$IFn$_invoke$arity$0();
}
}
}));

(frontend.util.app_scroll_container_node.cljs$lang$maxFixedArity = 1);

if((typeof frontend !== 'undefined') && (typeof frontend.util !== 'undefined') && (typeof frontend.util.el_visible_in_viewport_QMARK_ !== 'undefined')){
} else {
frontend.util.el_visible_in_viewport_QMARK_ = module$frontend$utils.elementIsVisibleInViewport;
}
if((typeof frontend !== 'undefined') && (typeof frontend.util !== 'undefined') && (typeof frontend.util.convert_to_roman !== 'undefined')){
} else {
frontend.util.convert_to_roman = module$frontend$utils.convertToRoman;
}
if((typeof frontend !== 'undefined') && (typeof frontend.util !== 'undefined') && (typeof frontend.util.convert_to_letters !== 'undefined')){
} else {
frontend.util.convert_to_letters = module$frontend$utils.convertToLetters;
}
if((typeof frontend !== 'undefined') && (typeof frontend.util !== 'undefined') && (typeof frontend.util.hsl2hex !== 'undefined')){
} else {
frontend.util.hsl2hex = module$frontend$utils.hsl2hex;
}
frontend.util.string_join_path = logseq.common.util.string_join_path;
frontend.util.safe_re_find = logseq.common.util.safe_re_find;

frontend.util.safe_keyword = (function frontend$util$safe_keyword(s){
if(typeof s === 'string'){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(clojure.string.replace(s," ","_"));
} else {
return null;
}
});
frontend.util.uuid_string_QMARK_ = logseq.common.util.uuid_string_QMARK_;

frontend.util.check_password_strength = (function frontend$util$check_password_strength(input){
var temp__5804__auto__ = (function (){var and__5000__auto__ = typeof input === 'string';
if(and__5000__auto__){
var and__5000__auto____$1 = (!(clojure.string.blank_QMARK_(input)));
if(and__5000__auto____$1){
return module$node_modules$check_password_strength$dist$umd.passwordStrength(input);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var ret = temp__5804__auto__;
return cljs_bean.core.__GT_clj(ret);
} else {
return null;
}
});

frontend.util.safe_sanitize_file_name = (function frontend$util$safe_sanitize_file_name(s){
return module$node_modules$sanitize_filename$index(cljs.core.str.cljs$core$IFn$_invoke$arity$1(s));
});
frontend.util.ios_STAR__QMARK_ = (function frontend$util$ios_STAR__QMARK_(){
return module$frontend$utils.ios();
});

frontend.util.ios_QMARK_ = cljs.core.memoize(frontend.util.ios_STAR__QMARK_);
frontend.util.safari_STAR__QMARK_ = (function frontend$util$safari_STAR__QMARK_(){
var ua = clojure.string.lower_case(navigator.userAgent);
return ((clojure.string.includes_QMARK_(ua,"webkit")) && ((!(clojure.string.includes_QMARK_(ua,"chrome")))));
});

frontend.util.safari_QMARK_ = cljs.core.memoize(frontend.util.safari_STAR__QMARK_);
/**
 * Triggering condition: Mobile phones
 *      *** Warning!!! ***
 *      For UX logic only! Don't use for FS logic
 *      iPad / Android Pad doesn't trigger!
 */
frontend.util.mobile_STAR__QMARK_ = (function frontend$util$mobile_STAR__QMARK_(){
if(frontend.util.node_test_QMARK_){
return null;
} else {
var G__99555 = /Mobi/;
var G__99556 = navigator.userAgent;
return (frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2 ? frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2(G__99555,G__99556) : frontend.util.safe_re_find.call(null,G__99555,G__99556));
}
});

frontend.util.mobile_QMARK_ = cljs.core.memoize(frontend.util.mobile_STAR__QMARK_);
frontend.util.electron_STAR__QMARK_ = (function frontend$util$electron_STAR__QMARK_(){
if(cljs.core.truth_((function (){var and__5000__auto__ = window;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.util.goog$module$goog$object.get(window,"navigator");
} else {
return and__5000__auto__;
}
})())){
return goog.string.caseInsensitiveContains(navigator.userAgent," electron");
} else {
return null;
}
});

frontend.util.electron_QMARK_ = cljs.core.memoize(frontend.util.electron_STAR__QMARK_);
/**
 * Mocked open DIR path for by-passing open dir in electron during testing. Nil if not given
 */
frontend.util.mocked_open_dir_path = (function frontend$util$mocked_open_dir_path(){
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return window.__MOCKED_OPEN_DIR_PATH__;
} else {
return null;
}
});
frontend.util.nfs_QMARK_ = ((cljs.core.not(frontend.util.electron_QMARK_())) && (cljs.core.not(frontend.mobile.util.native_platform_QMARK_())));

frontend.util.web_platform_QMARK_ = frontend.util.nfs_QMARK_;

frontend.util.plugin_platform_QMARK_ = (function (){var or__5002__auto__ = ((frontend.util.web_platform_QMARK_) && ((!(logseq.common.config.PUBLISHING))));
if(or__5002__auto__){
return or__5002__auto__;
} else {
return frontend.util.electron_QMARK_();
}
})();
frontend.util.file_protocol_QMARK_ = (function frontend$util$file_protocol_QMARK_(){
return clojure.string.starts_with_QMARK_(window.location.href,"file://");
});
frontend.util.format = logseq.common.util.format;
frontend.util.evalue = (function frontend$util$evalue(event){
return frontend.util.goog$module$goog$object.getValueByKeys(event,"target","value");
});
frontend.util.ekey = (function frontend$util$ekey(event){
return frontend.util.goog$module$goog$object.getValueByKeys(event,"key");
});
frontend.util.echecked_QMARK_ = (function frontend$util$echecked_QMARK_(event){
return frontend.util.goog$module$goog$object.getValueByKeys(event,"target","checked");
});
/**
 * compatible change event for React
 */
frontend.util.set_change_value = (function frontend$util$set_change_value(node,value){
return module$frontend$utils.triggerInputChange(node,value);
});
frontend.util.p_handle = (function frontend$util$p_handle(var_args){
var G__99558 = arguments.length;
switch (G__99558) {
case 2:
return frontend.util.p_handle.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.util.p_handle.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.util.p_handle.cljs$core$IFn$_invoke$arity$2 = (function (p,ok_handler){
return frontend.util.p_handle.cljs$core$IFn$_invoke$arity$3(p,ok_handler,(function (error){
return console.error(error);
}));
}));

(frontend.util.p_handle.cljs$core$IFn$_invoke$arity$3 = (function (p,ok_handler,error_handler){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(p,(function (result){
return (ok_handler.cljs$core$IFn$_invoke$arity$1 ? ok_handler.cljs$core$IFn$_invoke$arity$1(result) : ok_handler.call(null,result));
})),(function (error){
return (error_handler.cljs$core$IFn$_invoke$arity$1 ? error_handler.cljs$core$IFn$_invoke$arity$1(error) : error_handler.call(null,error));
}));
}));

(frontend.util.p_handle.cljs$lang$maxFixedArity = 3);

frontend.util.get_width = (function frontend$util$get_width(){
return frontend.util.goog$module$goog$object.get(window,"innerWidth");
});
frontend.util.get_computed_bg_color = (function frontend$util$get_computed_bg_color(){
var styles = window.getComputedStyle(document.body);
var bg_color = frontend.util.goog$module$goog$object.get(styles,"background-color");
var rgb2hex = (function (rgb){
return ["#",clojure.string.join.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__99560_SHARP_){
if((cljs.core.count(p1__99560_SHARP_) < (2))){
return ["0",cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__99560_SHARP_)].join('');
} else {
return p1__99560_SHARP_;
}
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.comp.cljs$core$IFn$_invoke$arity$3((function (p1__99559_SHARP_){
return p1__99559_SHARP_.toString((16));
}),cljs.core.parse_long,clojure.string.trim),rgb)))].join('');
});
if(clojure.string.starts_with_QMARK_(bg_color,"rgb")){
var rgb = clojure.string.split.cljs$core$IFn$_invoke$arity$2(clojure.string.replace(clojure.string.replace(bg_color,/^rgb[^\d]+/,""),/\)$/,""),/,/);
var rgb__$1 = cljs.core.take.cljs$core$IFn$_invoke$arity$2((3),rgb);
return rgb2hex(rgb__$1);
} else {
return null;
}
});
frontend.util.set_android_theme = (function frontend$util$set_android_theme(){
var f = (function (){
if(cljs.core.truth_(frontend.mobile.util.native_android_QMARK_())){
var temp__5804__auto__ = (function (){try{return frontend.util.get_computed_bg_color();
}catch (e99561){var _ = e99561;
return null;
}})();
if(cljs.core.truth_(temp__5804__auto__)){
var bg_color = temp__5804__auto__;
module$node_modules$$capgo$capacitor_navigation_bar$dist$plugin_cjs.NavigationBar.setNavigationBarColor(cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color","color",1011675173),bg_color], null)));

return module$node_modules$$capacitor$status_bar$dist$plugin_cjs.StatusBar.setBackgroundColor(cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color","color",1011675173),bg_color], null)));
} else {
return null;
}
} else {
return null;
}
});
return setTimeout(f,(32));
});
frontend.util.set_theme_light = (function frontend$util$set_theme_light(){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(module$node_modules$$capacitor$status_bar$dist$plugin_cjs.StatusBar.setStyle(cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),module$node_modules$$capacitor$status_bar$dist$plugin_cjs.Style.Light], null)))),(function (___41611__auto__){
return promesa.protocols._promise(frontend.util.set_android_theme());
}));
}));
});
frontend.util.set_theme_dark = (function frontend$util$set_theme_dark(){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(module$node_modules$$capacitor$status_bar$dist$plugin_cjs.StatusBar.setStyle(cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),module$node_modules$$capacitor$status_bar$dist$plugin_cjs.Style.Dark], null)))),(function (___41611__auto__){
return promesa.protocols._promise(frontend.util.set_android_theme());
}));
}));
});
frontend.util.find_first = (function frontend$util$find_first(pred,coll){
return cljs.core.first(cljs.core.filter.cljs$core$IFn$_invoke$arity$2(pred,coll));
});
/**
 * Find first index of an element in list
 */
frontend.util.find_index = (function frontend$util$find_index(pred_or_val,coll){
var pred = ((cljs.core.fn_QMARK_(pred_or_val))?pred_or_val:(function (p1__99562_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(pred_or_val,p1__99562_SHARP_);
}));
return cljs.core.reduce_kv((function (p1__99565_SHARP_,p2__99564_SHARP_,p3__99563_SHARP_){
if(cljs.core.truth_((pred.cljs$core$IFn$_invoke$arity$1 ? pred.cljs$core$IFn$_invoke$arity$1(p3__99563_SHARP_) : pred.call(null,p3__99563_SHARP_)))){
return cljs.core.reduced(p2__99564_SHARP_);
} else {
return p1__99565_SHARP_;
}
}),(-1),(function (){var G__99566 = coll;
if(cljs.core.list_QMARK_(coll)){
return cljs.core.vec(G__99566);
} else {
return G__99566;
}
})());
});
frontend.util.hiccup__GT_class = (function frontend$util$hiccup__GT_class(class_SINGLEQUOTE_){
var G__99567 = clojure.string.split.cljs$core$IFn$_invoke$arity$2(class_SINGLEQUOTE_,/\./);
var G__99567__$1 = (((G__99567 == null))?null:clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",G__99567));
if((G__99567__$1 == null)){
return null;
} else {
return clojure.string.trim(G__99567__$1);
}
});
frontend.util.fetch = (function frontend$util$fetch(var_args){
var G__99570 = arguments.length;
switch (G__99570) {
case 3:
return frontend.util.fetch.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return frontend.util.fetch.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.util.fetch.cljs$core$IFn$_invoke$arity$3 = (function (url,on_ok,on_failed){
return frontend.util.fetch.cljs$core$IFn$_invoke$arity$4(url,cljs.core.PersistentArrayMap.EMPTY,on_ok,on_failed);
}));

(frontend.util.fetch.cljs$core$IFn$_invoke$arity$4 = (function (url,opts,on_ok,on_failed){
return fetch(url,cljs_bean.core.__GT_js(opts)).then((function (resp){
if((resp.status >= (400))){
return (on_failed.cljs$core$IFn$_invoke$arity$1 ? on_failed.cljs$core$IFn$_invoke$arity$1(resp) : on_failed.call(null,resp));
} else {
if(cljs.core.truth_(resp.ok)){
return resp.json().then(cljs_bean.core.__GT_clj).then((function (p1__99568_SHARP_){
return (on_ok.cljs$core$IFn$_invoke$arity$1 ? on_ok.cljs$core$IFn$_invoke$arity$1(p1__99568_SHARP_) : on_ok.call(null,p1__99568_SHARP_));
}));
} else {
return (on_failed.cljs$core$IFn$_invoke$arity$1 ? on_failed.cljs$core$IFn$_invoke$arity$1(resp) : on_failed.call(null,resp));
}
}
}));
}));

(frontend.util.fetch.cljs$lang$maxFixedArity = 4);

frontend.util.zero_pad = (function frontend$util$zero_pad(n){
if((n < (10))){
return ["0",cljs.core.str.cljs$core$IFn$_invoke$arity$1(n)].join('');
} else {
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(n);
}
});
/**
 * Use if arg could be an int or string. If arg is only a string, use `parse-long`.
 */
frontend.util.safe_parse_int = (function frontend$util$safe_parse_int(x){
if(typeof x === 'string'){
return cljs.core.parse_long(x);
} else {
return x;
}
});
/**
 * Use if arg could be a float or string. If arg is only a string, use `parse-double`
 */
frontend.util.safe_parse_float = (function frontend$util$safe_parse_float(x){
if(typeof x === 'string'){
return cljs.core.parse_double(x);
} else {
return x;
}
});
frontend.util.debounce = goog.functions.debounce;
/**
 * Create a stateful debounce function with specified interval
 * 
 *    Returns [fire-fn, cancel-fn]
 * 
 *    Use `fire-fn` to call the function(debounced)
 * 
 *    Use `cancel-fn` to cancel pending callback if there is
 */
frontend.util.cancelable_debounce = (function frontend$util$cancelable_debounce(f,interval){
var debouncer = (new goog.async.Debouncer(f,interval));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function() { 
var G__99742__delegate = function (args){
return debouncer.fire.apply(debouncer,cljs.core.to_array(args));
};
var G__99742 = function (var_args){
var args = null;
if (arguments.length > 0) {
var G__99744__i = 0, G__99744__a = new Array(arguments.length -  0);
while (G__99744__i < G__99744__a.length) {G__99744__a[G__99744__i] = arguments[G__99744__i + 0]; ++G__99744__i;}
  args = new cljs.core.IndexedSeq(G__99744__a,0,null);
} 
return G__99742__delegate.call(this,args);};
G__99742.cljs$lang$maxFixedArity = 0;
G__99742.cljs$lang$applyTo = (function (arglist__99745){
var args = cljs.core.seq(arglist__99745);
return G__99742__delegate(args);
});
G__99742.cljs$core$IFn$_invoke$arity$variadic = G__99742__delegate;
return G__99742;
})()
,(function (){
return debouncer.stop();
})], null);
});
frontend.util.nth_safe = (function frontend$util$nth_safe(c,i){
if((((i < (0))) || ((i >= cljs.core.count(c))))){
return null;
} else {
return cljs.core.nth.cljs$core$IFn$_invoke$arity$2(c,i);
}
});
if(frontend.util.node_test_QMARK_){
} else {
(NodeList.prototype.cljs$core$ISeqable$ = cljs.core.PROTOCOL_SENTINEL);

(NodeList.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (arr){
var arr__$1 = this;
return cljs.core.array_seq.cljs$core$IFn$_invoke$arity$2(arr__$1,(0));
}));
}
frontend.util.caret_range = (function frontend$util$caret_range(node){
var temp__5804__auto__ = (function (){var or__5002__auto__ = frontend.util.goog$module$goog$object.get(node,"ownerDocument");
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.util.goog$module$goog$object.get(node,"document");
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var doc = temp__5804__auto__;
var win = (function (){var or__5002__auto__ = frontend.util.goog$module$goog$object.get(doc,"defaultView");
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.util.goog$module$goog$object.get(doc,"parentWindow");
}
})();
var selection = win.getSelection();
if(cljs.core.truth_(selection)){
var range_count = frontend.util.goog$module$goog$object.get(selection,"rangeCount");
if((range_count > (0))){
var range = win.getSelection().getRangeAt((0));
var pre_caret_range = range.cloneRange();
pre_caret_range.selectNodeContents(node);

pre_caret_range.setEnd(frontend.util.goog$module$goog$object.get(range,"endContainer"),frontend.util.goog$module$goog$object.get(range,"endOffset"));

var contents = pre_caret_range.cloneContents();
var html = (function (){var G__99571 = cljs.core.first(contents.childNodes);
var G__99571__$1 = (((G__99571 == null))?null:frontend.util.goog$module$goog$object.get(G__99571,"innerHTML"));
if((G__99571__$1 == null)){
return null;
} else {
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__99571__$1);
}
})();
var br_ended_QMARK_ = (function (){var and__5000__auto__ = html;
if(cljs.core.truth_(and__5000__auto__)){
return ((clojure.string.ends_with_QMARK_(html,"<div class=\"is-paragraph\"></div></div></span></div></div></div>")) || (clojure.string.ends_with_QMARK_(html,"<br></div></div></span></div></div></div>")));
} else {
return and__5000__auto__;
}
})();
var value = pre_caret_range.toString();
if(cljs.core.truth_(br_ended_QMARK_)){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(value),"\n"].join('');
} else {
return value;
}
} else {
return null;
}
} else {
var temp__5804__auto____$1 = frontend.util.goog$module$goog$object.get(doc,"selection");
if(cljs.core.truth_(temp__5804__auto____$1)){
var selection__$1 = temp__5804__auto____$1;
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2("Control",frontend.util.goog$module$goog$object.get(selection__$1,"type"))){
var text_range = selection__$1.createRange();
var pre_caret_text_range = frontend.util.goog$module$goog$object.get(doc,"body").createTextRange();
pre_caret_text_range.moveToElementText(node);

pre_caret_text_range.setEndPoint("EndToEnd",text_range);

return frontend.util.goog$module$goog$object.get(pre_caret_text_range,"text");
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
});
frontend.util.get_selection_start = (function frontend$util$get_selection_start(input){
if(cljs.core.truth_(input)){
return input.selectionStart;
} else {
return null;
}
});
frontend.util.get_selection_end = (function frontend$util$get_selection_end(input){
if(cljs.core.truth_(input)){
return input.selectionEnd;
} else {
return null;
}
});
frontend.util.input_text_selected_QMARK_ = (function frontend$util$input_text_selected_QMARK_(input){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(frontend.util.get_selection_start(input),frontend.util.get_selection_end(input));
});
frontend.util.get_selection_direction = (function frontend$util$get_selection_direction(input){
if(cljs.core.truth_(input)){
return input.selectionDirection;
} else {
return null;
}
});
frontend.util.split_graphemes = (function frontend$util$split_graphemes(s){
var splitter = (new module$node_modules$grapheme_splitter$index());
return splitter.splitGraphemes(s);
});
/**
 * Return the length of the substrings in s between start and from-index.
 * 
 *    multi-char count as 1, like emoji characters
 */
frontend.util.get_graphemes_pos = (function frontend$util$get_graphemes_pos(s,from_index){
var splitter = (new module$node_modules$grapheme_splitter$index());
return splitter.countGraphemes(cljs.core.subs.cljs$core$IFn$_invoke$arity$3(s,(0),from_index));
});
/**
 * Return the length of the substrings in s between the last index of newline
 *    in s searching backward from from-newline-index and from-newline-index.
 * 
 *    multi-char count as 1, like emoji characters
 */
frontend.util.get_line_pos = (function frontend$util$get_line_pos(s,from_newline_index){
var splitter = (new module$node_modules$grapheme_splitter$index());
var last_newline_pos = clojure.string.last_index_of.cljs$core$IFn$_invoke$arity$3(s,"\n",(from_newline_index - (1)));
var before_last_newline_length = (function (){var or__5002__auto__ = last_newline_pos;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (-1);
}
})();
var last_newline_content = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(s,(before_last_newline_length + (1)),from_newline_index);
return splitter.countGraphemes(last_newline_content);
});
/**
 * Return the substring of the first grapheme-num characters of s if first-line? is true,
 *    otherwise return the substring of s before the last 
 *  and the first grapheme-num characters.
 * 
 *    grapheme-num treats multi-char as 1, like emoji characters
 */
frontend.util.get_text_range = (function frontend$util$get_text_range(s,grapheme_num,first_line_QMARK_){
var newline_pos = (cljs.core.truth_(first_line_QMARK_)?(0):((function (){var or__5002__auto__ = clojure.string.last_index_of.cljs$core$IFn$_invoke$arity$2(s,"\n");
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (-1);
}
})() + (1)));
var splitter = (new module$node_modules$grapheme_splitter$index());
var newline_graphemes = splitter.splitGraphemes(cljs.core.subs.cljs$core$IFn$_invoke$arity$2(s,newline_pos));
var newline_graphemes__$1 = newline_graphemes.slice((0),grapheme_num);
var content = newline_graphemes__$1.join("");
return cljs.core.subs.cljs$core$IFn$_invoke$arity$3(s,(0),(newline_pos + cljs.core.count(content)));
});
frontend.util.stop = (function frontend$util$stop(e){
if(cljs.core.truth_(e)){
var G__99572 = e;
G__99572.preventDefault();

G__99572.stopPropagation();

return G__99572;
} else {
return null;
}
});
frontend.util.stop_propagation = (function frontend$util$stop_propagation(e){
if(cljs.core.truth_(e)){
return e.stopPropagation();
} else {
return null;
}
});
frontend.util.nearest_scrollable_container = (function frontend$util$nearest_scrollable_container(element){
return cljs.core.some((function (p1__99573_SHARP_){
var temp__5804__auto__ = window.getComputedStyle(p1__99573_SHARP_).overflowY;
if(cljs.core.truth_(temp__5804__auto__)){
var overflow_y = temp__5804__auto__;
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, ["scroll",null,"auto",null,"overlay",null], null), null),overflow_y)){
return p1__99573_SHARP_;
} else {
return null;
}
} else {
return null;
}
}),cljs.core.take_while.cljs$core$IFn$_invoke$arity$2(cljs.core.complement(cljs.core.nil_QMARK_),cljs.core.iterate((function (p1__99574_SHARP_){
return p1__99574_SHARP_.parentElement;
}),element)));
});
frontend.util.element_visible_QMARK_ = (function frontend$util$element_visible_QMARK_(element){
if(cljs.core.truth_(element)){
var temp__5804__auto__ = element.getBoundingClientRect();
if(cljs.core.truth_(temp__5804__auto__)){
var r = temp__5804__auto__;
return (((r.top >= (0))) && (((r.bottom + (64)) <= (function (){var or__5002__auto__ = window.innerHeight;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return document.documentElement.clientHeight();
}
})())));
} else {
return null;
}
} else {
return null;
}
});
frontend.util.element_top = (function frontend$util$element_top(elem,top){
if(cljs.core.truth_(elem)){
if(cljs.core.truth_(elem.offsetParent)){
var client_top = (function (){var or__5002__auto__ = elem.clientTop;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})();
var offset_top = elem.offsetTop;
return (((top + client_top) + offset_top) + (function (){var G__99575 = elem.offsetParent;
var G__99576 = top;
return (frontend.util.element_top.cljs$core$IFn$_invoke$arity$2 ? frontend.util.element_top.cljs$core$IFn$_invoke$arity$2(G__99575,G__99576) : frontend.util.element_top.call(null,G__99575,G__99576));
})());
} else {
return top;
}
} else {
return null;
}
});
frontend.util.scroll_to_element = (function frontend$util$scroll_to_element(elem_id){
if(cljs.core.truth_((function (){var G__99577 = /^\/\d+$/;
var G__99578 = elem_id;
return (frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2 ? frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2(G__99577,G__99578) : frontend.util.safe_re_find.call(null,G__99577,G__99578));
})())){
return null;
} else {
if(cljs.core.truth_(elem_id)){
var temp__5804__auto__ = goog.dom.getElement(elem_id);
if(cljs.core.truth_(temp__5804__auto__)){
var elem = temp__5804__auto__;
return frontend.util.app_scroll_container_node.cljs$core$IFn$_invoke$arity$0().scroll(({"top": (function (){var top = frontend.util.element_top(elem,(0));
if((top < (256))){
return (0);
} else {
return (top - (80));
}
})(), "behavior": "smooth"}));
} else {
return null;
}
} else {
return null;
}
}
});
frontend.util.scroll_to = (function frontend$util$scroll_to(var_args){
var G__99580 = arguments.length;
switch (G__99580) {
case 1:
return frontend.util.scroll_to.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.util.scroll_to.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.util.scroll_to.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.util.scroll_to.cljs$core$IFn$_invoke$arity$1 = (function (pos){
return frontend.util.scroll_to.cljs$core$IFn$_invoke$arity$2(frontend.util.app_scroll_container_node.cljs$core$IFn$_invoke$arity$0(),pos);
}));

(frontend.util.scroll_to.cljs$core$IFn$_invoke$arity$2 = (function (node,pos){
return frontend.util.scroll_to.cljs$core$IFn$_invoke$arity$3(node,pos,true);
}));

(frontend.util.scroll_to.cljs$core$IFn$_invoke$arity$3 = (function (node,pos,animate_QMARK_){
if(cljs.core.truth_(node)){
return node.scroll(({"top": pos, "behavior": (cljs.core.truth_(animate_QMARK_)?"smooth":"auto")}));
} else {
return null;
}
}));

(frontend.util.scroll_to.cljs$lang$maxFixedArity = 3);

/**
 * Returns the scroll top position of the `node`. If `node` is not specified,
 *   returns the scroll top position of the `app-scroll-container-node`.
 */
frontend.util.scroll_top = (function frontend$util$scroll_top(var_args){
var G__99582 = arguments.length;
switch (G__99582) {
case 0:
return frontend.util.scroll_top.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.util.scroll_top.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.util.scroll_top.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.util.scroll_top.cljs$core$IFn$_invoke$arity$1(frontend.util.app_scroll_container_node.cljs$core$IFn$_invoke$arity$0());
}));

(frontend.util.scroll_top.cljs$core$IFn$_invoke$arity$1 = (function (node){
if(cljs.core.truth_(node)){
return node.scrollTop;
} else {
return null;
}
}));

(frontend.util.scroll_top.cljs$lang$maxFixedArity = 1);

frontend.util.scroll_to_top = (function frontend$util$scroll_to_top(var_args){
var G__99584 = arguments.length;
switch (G__99584) {
case 0:
return frontend.util.scroll_to_top.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.util.scroll_to_top.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.util.scroll_to_top.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.util.scroll_to.cljs$core$IFn$_invoke$arity$3(frontend.util.app_scroll_container_node.cljs$core$IFn$_invoke$arity$0(),(0),false);
}));

(frontend.util.scroll_to_top.cljs$core$IFn$_invoke$arity$1 = (function (animate_QMARK_){
return frontend.util.scroll_to.cljs$core$IFn$_invoke$arity$3(frontend.util.app_scroll_container_node.cljs$core$IFn$_invoke$arity$0(),(0),animate_QMARK_);
}));

(frontend.util.scroll_to_top.cljs$lang$maxFixedArity = 1);

/**
 * Scroll into the view to vertically align a non-visible block to the centre
 *   of the visible area
 */
frontend.util.scroll_to_block = (function frontend$util$scroll_to_block(var_args){
var G__99586 = arguments.length;
switch (G__99586) {
case 1:
return frontend.util.scroll_to_block.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.util.scroll_to_block.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.util.scroll_to_block.cljs$core$IFn$_invoke$arity$1 = (function (block){
return frontend.util.scroll_to_block.cljs$core$IFn$_invoke$arity$2(block,true);
}));

(frontend.util.scroll_to_block.cljs$core$IFn$_invoke$arity$2 = (function (block,animate_QMARK_){
if(cljs.core.truth_(block)){
if(cljs.core.truth_(frontend.util.element_visible_QMARK_(block))){
return null;
} else {
return block.scrollIntoView(({"behavior": (cljs.core.truth_(animate_QMARK_)?"smooth":"auto"), "block": "center"}));
}
} else {
return null;
}
}));

(frontend.util.scroll_to_block.cljs$lang$maxFixedArity = 2);

frontend.util.link_QMARK_ = (function frontend$util$link_QMARK_(node){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["A",null,"BUTTON",null], null), null),frontend.util.goog$module$goog$object.get(node,"tagName"));
});
frontend.util.time_QMARK_ = (function frontend$util$time_QMARK_(node){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, ["TIME",null], null), null),frontend.util.goog$module$goog$object.get(node,"tagName"));
});
frontend.util.audio_QMARK_ = (function frontend$util$audio_QMARK_(node){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, ["AUDIO",null], null), null),frontend.util.goog$module$goog$object.get(node,"tagName"));
});
frontend.util.video_QMARK_ = (function frontend$util$video_QMARK_(node){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, ["VIDEO",null], null), null),frontend.util.goog$module$goog$object.get(node,"tagName"));
});
frontend.util.sup_QMARK_ = (function frontend$util$sup_QMARK_(node){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, ["SUP",null], null), null),frontend.util.goog$module$goog$object.get(node,"tagName"));
});
frontend.util.input_QMARK_ = (function frontend$util$input_QMARK_(node){
if(cljs.core.truth_(node)){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["INPUT",null,"TEXTAREA",null], null), null),frontend.util.goog$module$goog$object.get(node,"tagName"));
} else {
return null;
}
});
frontend.util.details_or_summary_QMARK_ = (function frontend$util$details_or_summary_QMARK_(node){
if(cljs.core.truth_(node)){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["DETAILS",null,"SUMMARY",null], null), null),frontend.util.goog$module$goog$object.get(node,"tagName"));
} else {
return null;
}
});
frontend.util.starts_with_QMARK_ = (function frontend$util$starts_with_QMARK_(s,substr){
return clojure.string.starts_with_QMARK_(s,substr);
});
frontend.util.distinct_by = logseq.common.util.distinct_by;
frontend.util.distinct_by_last_wins = logseq.common.util.distinct_by_last_wins;
frontend.util.get_git_owner_and_repo = (function frontend$util$get_git_owner_and_repo(repo_url){
return cljs.core.take_last((2),clojure.string.split.cljs$core$IFn$_invoke$arity$2(repo_url,/\//));
});
frontend.util.safe_lower_case = (function frontend$util$safe_lower_case(s){
if(typeof s === 'string'){
return clojure.string.lower_case(s);
} else {
return s;
}
});
frontend.util.trim_safe = (function frontend$util$trim_safe(s){
if(typeof s === 'string'){
return clojure.string.trim(s);
} else {
return s;
}
});
frontend.util.trimr_without_newlines = (function frontend$util$trimr_without_newlines(s){
return s.replace(/[ \t\r]+$/,"");
});
frontend.util.triml_without_newlines = (function frontend$util$triml_without_newlines(s){
return s.replace(/^[ \t\r]+/,"");
});
frontend.util.concat_without_spaces = (function frontend$util$concat_without_spaces(left,right){
if(((typeof left === 'string') && (typeof right === 'string'))){
var left__$1 = frontend.util.trimr_without_newlines(left);
var not_space_QMARK_ = ((clojure.string.blank_QMARK_(left__$1)) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("\n",cljs.core.last(left__$1))));
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(left__$1),((not_space_QMARK_)?null:" "),cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.util.triml_without_newlines(right))].join('');
} else {
return null;
}
});
frontend.util.cjk_string_QMARK_ = (function frontend$util$cjk_string_QMARK_(s){
return cljs.core.re_find(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/,s);
});
frontend.util.replace_first = (function frontend$util$replace_first(pattern,s,new_value){
var temp__5802__auto__ = clojure.string.index_of.cljs$core$IFn$_invoke$arity$2(s,pattern);
if(cljs.core.truth_(temp__5802__auto__)){
var first_index = temp__5802__auto__;
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(new_value),cljs.core.subs.cljs$core$IFn$_invoke$arity$2(s,(first_index + cljs.core.count(pattern)))].join('');
} else {
return s;
}
});
frontend.util.replace_last = (function frontend$util$replace_last(var_args){
var G__99588 = arguments.length;
switch (G__99588) {
case 3:
return frontend.util.replace_last.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return frontend.util.replace_last.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.util.replace_last.cljs$core$IFn$_invoke$arity$3 = (function (pattern,s,new_value){
return frontend.util.replace_last.cljs$core$IFn$_invoke$arity$4(pattern,s,new_value,true);
}));

(frontend.util.replace_last.cljs$core$IFn$_invoke$arity$4 = (function (pattern,s,new_value,space_QMARK_){
var temp__5802__auto__ = clojure.string.last_index_of.cljs$core$IFn$_invoke$arity$2(s,pattern);
if(cljs.core.truth_(temp__5802__auto__)){
var last_index = temp__5802__auto__;
var prefix = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(s,(0),last_index);
if(cljs.core.truth_(space_QMARK_)){
return frontend.util.concat_without_spaces(prefix,new_value);
} else {
return [prefix,cljs.core.str.cljs$core$IFn$_invoke$arity$1(new_value)].join('');
}
} else {
return s;
}
}));

(frontend.util.replace_last.cljs$lang$maxFixedArity = 4);

frontend.util.re_pos = (function frontend$util$re_pos(re,s){
var re__$1 = (new RegExp(re.source,"g"));
var res = cljs.core.PersistentVector.EMPTY;
while(true){
var temp__5802__auto__ = re__$1.exec(s);
if(cljs.core.truth_(temp__5802__auto__)){
var m = temp__5802__auto__;
var G__99775 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(res,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [m.index,cljs.core.first(m)], null));
res = G__99775;
continue;
} else {
return res;
}
break;
}
});
frontend.util.safe_set_range_text_BANG_ = (function frontend$util$safe_set_range_text_BANG_(var_args){
var G__99590 = arguments.length;
switch (G__99590) {
case 4:
return frontend.util.safe_set_range_text_BANG_.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
case 5:
return frontend.util.safe_set_range_text_BANG_.cljs$core$IFn$_invoke$arity$5((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.util.safe_set_range_text_BANG_.cljs$core$IFn$_invoke$arity$4 = (function (input,text,start,end){
try{return input.setRangeText(text,start,end);
}catch (e99591){var _e = e99591;
return null;
}}));

(frontend.util.safe_set_range_text_BANG_.cljs$core$IFn$_invoke$arity$5 = (function (input,text,start,end,select_mode){
try{return input.setRangeText(text,start,end,select_mode);
}catch (e99592){var _e = e99592;
return null;
}}));

(frontend.util.safe_set_range_text_BANG_.cljs$lang$maxFixedArity = 5);

frontend.util.safe_dec_current_pos_from_end = (function frontend$util$safe_dec_current_pos_from_end(input,current_pos){
var temp__5802__auto__ = (function (){var and__5000__auto__ = typeof current_pos === 'number';
if(and__5000__auto__){
var and__5000__auto____$1 = typeof input === 'string';
if(and__5000__auto____$1){
return input.length;
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var len = temp__5802__auto__;
var temp__5802__auto____$1 = (function (){var and__5000__auto__ = (len >= (2));
if(and__5000__auto__){
var and__5000__auto____$1 = (current_pos <= len);
if(and__5000__auto____$1){
return input.substring((function (){var x__5087__auto__ = (current_pos - (20));
var y__5088__auto__ = (0);
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})(),current_pos);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto____$1)){
var input__$1 = temp__5802__auto____$1;
try{var splitter = (new module$node_modules$grapheme_splitter$index());
var input_SINGLEQUOTE_ = splitter.splitGraphemes(input__$1);
return (current_pos - input_SINGLEQUOTE_.pop().length);
}catch (e99593){var e = e99593;
console.error(e);

return (current_pos - (1));
}} else {
return (current_pos - (1));
}
} else {
return current_pos;
}
});
frontend.util.safe_inc_current_pos_from_start = (function frontend$util$safe_inc_current_pos_from_start(input,current_pos){
var temp__5802__auto__ = (function (){var and__5000__auto__ = typeof current_pos === 'number';
if(and__5000__auto__){
var and__5000__auto____$1 = typeof input === 'string';
if(and__5000__auto____$1){
return input.length;
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var len = temp__5802__auto__;
var temp__5802__auto____$1 = (function (){var and__5000__auto__ = (len >= (2));
if(and__5000__auto__){
var and__5000__auto____$1 = (current_pos <= len);
if(and__5000__auto____$1){
return input.substr(current_pos,(20));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto____$1)){
var input__$1 = temp__5802__auto____$1;
try{var splitter = (new module$node_modules$grapheme_splitter$index());
var input__$2 = splitter.splitGraphemes(input__$1);
return (current_pos + input__$2.shift().length);
}catch (e99594){var e = e99594;
console.error(e);

return (current_pos + (1));
}} else {
return (current_pos + (1));
}
} else {
return current_pos;
}
});
frontend.util.kill_line_before_BANG_ = (function frontend$util$kill_line_before_BANG_(input){
var val = input.value;
var end = frontend.util.get_selection_start(input);
var n_pos = clojure.string.last_index_of.cljs$core$IFn$_invoke$arity$3(val,"\n",(end - (1)));
var start = (cljs.core.truth_(n_pos)?(n_pos + (1)):(0));
return frontend.util.safe_set_range_text_BANG_.cljs$core$IFn$_invoke$arity$4(input,"",start,end);
});
frontend.util.kill_line_after_BANG_ = (function frontend$util$kill_line_after_BANG_(input){
var val = input.value;
var start = frontend.util.get_selection_start(input);
var end = (function (){var or__5002__auto__ = clojure.string.index_of.cljs$core$IFn$_invoke$arity$3(val,"\n",start);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.count(val);
}
})();
return frontend.util.safe_set_range_text_BANG_.cljs$core$IFn$_invoke$arity$4(input,"",start,end);
});
frontend.util.insert_at_current_position_BANG_ = (function frontend$util$insert_at_current_position_BANG_(input,text){
var start = frontend.util.get_selection_start(input);
var end = frontend.util.get_selection_end(input);
return frontend.util.safe_set_range_text_BANG_.cljs$core$IFn$_invoke$arity$5(input,text,start,end,"end");
});
frontend.util.safe_subvec = (function frontend$util$safe_subvec(xs,start,end){
if((((start < (0))) || ((((start > end)) || ((end > cljs.core.count(xs))))))){
return cljs.core.PersistentVector.EMPTY;
} else {
return cljs.core.subvec.cljs$core$IFn$_invoke$arity$3(xs,start,end);
}
});
frontend.util.get_nodes_between_two_nodes = (function frontend$util$get_nodes_between_two_nodes(id1,id2,class$){
var temp__5804__auto__ = cljs.core.array_seq.cljs$core$IFn$_invoke$arity$1(document.getElementsByClassName(class$));
if(cljs.core.truth_(temp__5804__auto__)){
var nodes = temp__5804__auto__;
var node_1 = goog.dom.getElement(id1);
var node_2 = goog.dom.getElement(id2);
var idx_1 = nodes.indexOf(node_1);
var idx_2 = nodes.indexOf(node_2);
var start = (function (){var x__5090__auto__ = idx_1;
var y__5091__auto__ = idx_2;
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})();
var end = ((function (){var x__5087__auto__ = idx_1;
var y__5088__auto__ = idx_2;
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})() + (1));
return frontend.util.safe_subvec(cljs.core.vec(nodes),start,end);
} else {
return null;
}
});
frontend.util.get_direction_between_two_nodes = (function frontend$util$get_direction_between_two_nodes(id1,id2,class$){
var temp__5804__auto__ = cljs.core.array_seq.cljs$core$IFn$_invoke$arity$1(document.getElementsByClassName(class$));
if(cljs.core.truth_(temp__5804__auto__)){
var nodes = temp__5804__auto__;
var node_1 = goog.dom.getElement(id1);
var node_2 = goog.dom.getElement(id2);
var idx_1 = nodes.indexOf(node_1);
var idx_2 = nodes.indexOf(node_2);
if((idx_1 >= idx_2)){
return new cljs.core.Keyword(null,"up","up",-269712113);
} else {
return new cljs.core.Keyword(null,"down","down",1565245570);
}
} else {
return null;
}
});
frontend.util.rec_get_node = (function frontend$util$rec_get_node(node,class$){
if(cljs.core.truth_((function (){var and__5000__auto__ = node;
if(cljs.core.truth_(and__5000__auto__)){
return dommy.core.has_class_QMARK_(node,class$);
} else {
return and__5000__auto__;
}
})())){
return node;
} else {
var and__5000__auto__ = node;
if(cljs.core.truth_(and__5000__auto__)){
var G__99595 = frontend.util.goog$module$goog$object.get(node,"parentNode");
var G__99596 = class$;
return (frontend.util.rec_get_node.cljs$core$IFn$_invoke$arity$2 ? frontend.util.rec_get_node.cljs$core$IFn$_invoke$arity$2(G__99595,G__99596) : frontend.util.rec_get_node.call(null,G__99595,G__99596));
} else {
return and__5000__auto__;
}
}
});
frontend.util.rec_get_blocks_container = (function frontend$util$rec_get_blocks_container(node){
return frontend.util.rec_get_node(node,"blocks-container");
});
frontend.util.rec_get_blocks_content_section = (function frontend$util$rec_get_blocks_content_section(node){
return frontend.util.rec_get_node(node,"content");
});
frontend.util.get_blocks_noncollapse = (function frontend$util$get_blocks_noncollapse(var_args){
var G__99598 = arguments.length;
switch (G__99598) {
case 0:
return frontend.util.get_blocks_noncollapse.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.util.get_blocks_noncollapse.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.util.get_blocks_noncollapse.cljs$core$IFn$_invoke$arity$0 = (function (){
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (b){
return (!((frontend.util.goog$module$goog$object.get(b,"offsetParent") == null)));
}),dommy.utils.__GT_Array(document.querySelectorAll("div .ls-block")));
}));

(frontend.util.get_blocks_noncollapse.cljs$core$IFn$_invoke$arity$1 = (function (blocks_container){
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (b){
return (!((frontend.util.goog$module$goog$object.get(b,"offsetParent") == null)));
}),dommy.utils.__GT_Array(blocks_container.querySelectorAll("div .ls-block")));
}));

(frontend.util.get_blocks_noncollapse.cljs$lang$maxFixedArity = 1);

frontend.util.remove_embedded_blocks = (function frontend$util$remove_embedded_blocks(blocks){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (b){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("true",dommy.core.attr(b,"data-embed"));
}),blocks);
});
frontend.util.remove_property_value_blocks = (function frontend$util$remove_property_value_blocks(blocks){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (b){
return dommy.core.has_class_QMARK_(b,"property-value-container");
}),blocks);
});
frontend.util.get_selected_text = (function frontend$util$get_selected_text(){
return module$frontend$utils.getSelectionText();
});
frontend.util.clear_selection_BANG_ = module$frontend$selection.clearSelection;
frontend.util.copy_to_clipboard_BANG_ = (function frontend$util$copy_to_clipboard_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___99788 = arguments.length;
var i__5727__auto___99789 = (0);
while(true){
if((i__5727__auto___99789 < len__5726__auto___99788)){
args__5732__auto__.push((arguments[i__5727__auto___99789]));

var G__99790 = (i__5727__auto___99789 + (1));
i__5727__auto___99789 = G__99790;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.util.copy_to_clipboard_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.util.copy_to_clipboard_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (text,p__99602){
var map__99603 = p__99602;
var map__99603__$1 = cljs.core.__destructure_map(map__99603);
var graph = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__99603__$1,new cljs.core.Keyword(null,"graph","graph",1558099509));
var html = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__99603__$1,new cljs.core.Keyword(null,"html","html",-998796897));
var blocks = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__99603__$1,new cljs.core.Keyword(null,"blocks","blocks",-610462153));
var embed_block_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__99603__$1,new cljs.core.Keyword(null,"embed-block?","embed-block?",402074593));
var owner_window = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__99603__$1,new cljs.core.Keyword(null,"owner-window","owner-window",-2139116435));
var blocks__$1 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block){
if(datascript.impl.entity.entity_QMARK_(block)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,block),new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block));
} else {
return block;
}
}),blocks);
var data = cljs.core.clj__GT_js(logseq.common.util.remove_nils_non_nested(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"text","text",-1790561697),text,new cljs.core.Keyword(null,"html","html",-998796897),html,new cljs.core.Keyword(null,"blocks","blocks",-610462153),(cljs.core.truth_((function (){var and__5000__auto__ = graph;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.seq(blocks__$1);
} else {
return and__5000__auto__;
}
})())?cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"graph","graph",1558099509),graph,new cljs.core.Keyword(null,"embed-block?","embed-block?",402074593),embed_block_QMARK_,new cljs.core.Keyword(null,"blocks","blocks",-610462153),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__99599_SHARP_){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(p1__99599_SHARP_,new cljs.core.Keyword("block.temp","fully-loaded?","block.temp/fully-loaded?",-116637365),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([p1__99599_SHARP_], 0));
}),blocks__$1)], null)], 0)):null)], null)));
if(cljs.core.truth_(owner_window)){
return module$frontend$utils.writeClipboard(data,owner_window);
} else {
return module$frontend$utils.writeClipboard(data);
}
}));

(frontend.util.copy_to_clipboard_BANG_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.util.copy_to_clipboard_BANG_.cljs$lang$applyTo = (function (seq99600){
var G__99601 = cljs.core.first(seq99600);
var seq99600__$1 = cljs.core.next(seq99600);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__99601,seq99600__$1);
}));

frontend.util.drop_nth = (function frontend$util$drop_nth(n,coll){
return cljs.core.keep_indexed.cljs$core$IFn$_invoke$arity$2((function (p1__99604_SHARP_,p2__99605_SHARP_){
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(p1__99604_SHARP_,n)){
return p2__99605_SHARP_;
} else {
return null;
}
}),coll);
});
frontend.util.atom_QMARK_ = (function frontend$util$atom_QMARK_(v){
return (v instanceof cljs.core.Atom);
});
frontend.util.react = (function frontend$util$react(ref){
if(cljs.core.truth_(ref)){
if(cljs.core.truth_(rum.core._STAR_reactions_STAR_)){
return rum.core.react(ref);
} else {
return cljs.core.deref(ref);
}
} else {
return null;
}
});
frontend.util.time_ms = logseq.common.util.time_ms;
frontend.util.d = (function frontend$util$d(k,f){
var result = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([["Debug ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(k)].join('')], 0));

var start__5606__auto___99792 = cljs.core.system_time();
var ret__5607__auto___99793 = cljs.core.reset_BANG_(result,cljs.core.doall.cljs$core$IFn$_invoke$arity$1((f.cljs$core$IFn$_invoke$arity$0 ? f.cljs$core$IFn$_invoke$arity$0() : f.call(null))));
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([["Elapsed time: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((cljs.core.system_time() - start__5606__auto___99792).toFixed((6)))," msecs"].join('')], 0));


return cljs.core.deref(result);
});
frontend.util.concat_without_nil = logseq.common.util.concat_without_nil;
frontend.util.set_title_BANG_ = (function frontend$util$set_title_BANG_(title){
return (document.title = title);
});
frontend.util.get_block_container = (function frontend$util$get_block_container(block_element){
if(cljs.core.truth_(block_element)){
var temp__5804__auto__ = (function (){var G__99606 = frontend.util.rec_get_blocks_content_section(block_element);
if((G__99606 == null)){
return null;
} else {
return dommy.core.parent(G__99606);
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var section = temp__5804__auto__;
if(cljs.core.truth_(section)){
return goog.dom.getElement(section,"id");
} else {
return null;
}
} else {
return null;
}
} else {
return null;
}
});
frontend.util.skip_same_top_blocks = (function frontend$util$skip_same_top_blocks(blocks,block){
var property_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(dommy.core.attr(block,"data-is-property"),"true");
var properties_area = frontend.util.rec_get_node(block,"ls-properties-area");
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (b){
var and__5000__auto__ = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(b,block);
if(and__5000__auto__){
var or__5002__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((cljs.core.truth_(b)?b.getBoundingClientRect().top:null),(cljs.core.truth_(block)?block.getBoundingClientRect().top:null));
if(or__5002__auto__){
return or__5002__auto__;
} else {
if(property_QMARK_){
var and__5000__auto____$1 = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(dommy.core.attr(b,"data-is-property"),"true");
if(and__5000__auto____$1){
return goog.dom.contains(properties_area,b);
} else {
return and__5000__auto____$1;
}
} else {
return null;
}
}
} else {
return and__5000__auto__;
}
}),blocks);
});
/**
 * Gets previous non-collapsed block. If given a container
 *    looks up blocks in that container e.g. for embed
 */
frontend.util.get_prev_block_non_collapsed = (function frontend$util$get_prev_block_non_collapsed(var_args){
var G__99608 = arguments.length;
switch (G__99608) {
case 1:
return frontend.util.get_prev_block_non_collapsed.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.util.get_prev_block_non_collapsed.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.util.get_prev_block_non_collapsed.cljs$core$IFn$_invoke$arity$1 = (function (block){
return frontend.util.get_prev_block_non_collapsed.cljs$core$IFn$_invoke$arity$2(block,cljs.core.PersistentArrayMap.EMPTY);
}));

(frontend.util.get_prev_block_non_collapsed.cljs$core$IFn$_invoke$arity$2 = (function (block,p__99609){
var map__99610 = p__99609;
var map__99610__$1 = cljs.core.__destructure_map(map__99610);
var container = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__99610__$1,new cljs.core.Keyword(null,"container","container",-1736937707));
var up_down_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__99610__$1,new cljs.core.Keyword(null,"up-down?","up-down?",1084256379));
var exclude_property_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__99610__$1,new cljs.core.Keyword(null,"exclude-property?","exclude-property?",1621722390));
var temp__5804__auto__ = (cljs.core.truth_(container)?frontend.util.get_blocks_noncollapse.cljs$core$IFn$_invoke$arity$1(container):frontend.util.get_blocks_noncollapse.cljs$core$IFn$_invoke$arity$0());
if(cljs.core.truth_(temp__5804__auto__)){
var blocks = temp__5804__auto__;
var blocks__$1 = (function (){var G__99611 = (cljs.core.truth_(up_down_QMARK_)?frontend.util.skip_same_top_blocks(blocks,block):blocks);
if(cljs.core.truth_(exclude_property_QMARK_)){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (node){
return dommy.core.has_class_QMARK_(node,"property-value-container");
}),G__99611);
} else {
return G__99611;
}
})();
var temp__5804__auto____$1 = blocks__$1.indexOf(block);
if(cljs.core.truth_(temp__5804__auto____$1)){
var index = temp__5804__auto____$1;
var idx = (index - (1));
if((idx >= (0))){
return frontend.util.nth_safe(blocks__$1,idx);
} else {
return null;
}
} else {
return null;
}
} else {
return null;
}
}));

(frontend.util.get_prev_block_non_collapsed.cljs$lang$maxFixedArity = 2);

frontend.util.get_prev_block_non_collapsed_non_embed = (function frontend$util$get_prev_block_non_collapsed_non_embed(block){
var temp__5804__auto__ = frontend.util.remove_property_value_blocks(frontend.util.remove_embedded_blocks(frontend.util.get_blocks_noncollapse.cljs$core$IFn$_invoke$arity$0()));
if(cljs.core.truth_(temp__5804__auto__)){
var blocks = temp__5804__auto__;
var temp__5804__auto____$1 = blocks.indexOf(block);
if(cljs.core.truth_(temp__5804__auto____$1)){
var index = temp__5804__auto____$1;
var idx = (index - (1));
if((idx >= (0))){
return frontend.util.nth_safe(blocks,idx);
} else {
return null;
}
} else {
return null;
}
} else {
return null;
}
});
frontend.util.get_next_block_non_collapsed = (function frontend$util$get_next_block_non_collapsed(block,p__99612){
var map__99613 = p__99612;
var map__99613__$1 = cljs.core.__destructure_map(map__99613);
var up_down_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__99613__$1,new cljs.core.Keyword(null,"up-down?","up-down?",1084256379));
var exclude_property_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__99613__$1,new cljs.core.Keyword(null,"exclude-property?","exclude-property?",1621722390));
var temp__5804__auto__ = (function (){var and__5000__auto__ = block;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.util.get_blocks_noncollapse.cljs$core$IFn$_invoke$arity$0();
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var blocks = temp__5804__auto__;
var blocks__$1 = (function (){var G__99614 = (cljs.core.truth_(up_down_QMARK_)?frontend.util.skip_same_top_blocks(blocks,block):blocks);
if(cljs.core.truth_(exclude_property_QMARK_)){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (node){
return dommy.core.has_class_QMARK_(node,"property-value-container");
}),G__99614);
} else {
return G__99614;
}
})();
var temp__5804__auto____$1 = blocks__$1.indexOf(block);
if(cljs.core.truth_(temp__5804__auto____$1)){
var index = temp__5804__auto____$1;
var idx = (index + (1));
if((cljs.core.count(blocks__$1) >= idx)){
return frontend.util.nth_safe(blocks__$1,idx);
} else {
return null;
}
} else {
return null;
}
} else {
return null;
}
});
frontend.util.get_next_block_non_collapsed_skip = (function frontend$util$get_next_block_non_collapsed_skip(block){
var temp__5804__auto__ = frontend.util.get_blocks_noncollapse.cljs$core$IFn$_invoke$arity$0();
if(cljs.core.truth_(temp__5804__auto__)){
var blocks = temp__5804__auto__;
var temp__5804__auto____$1 = blocks.indexOf(block);
if(cljs.core.truth_(temp__5804__auto____$1)){
var index = temp__5804__auto____$1;
var idx = (index + (1));
while(true){
if((cljs.core.count(blocks) >= idx)){
var block__$1 = frontend.util.nth_safe(blocks,idx);
var nested_QMARK_ = cljs.core.some(((function (idx,block__$1,index,temp__5804__auto____$1,blocks,temp__5804__auto__){
return (function (dom){
return dom.contains(block__$1);
});})(idx,block__$1,index,temp__5804__auto____$1,blocks,temp__5804__auto__))
,cljs.core.array_seq.cljs$core$IFn$_invoke$arity$1(goog.dom.getElementsByClass("selected")));
if(cljs.core.truth_(nested_QMARK_)){
var G__99795 = (idx + (1));
idx = G__99795;
continue;
} else {
return block__$1;
}
} else {
return null;
}
break;
}
} else {
return null;
}
} else {
return null;
}
});
frontend.util.rand_str = (function frontend$util$rand_str(n){
return Math.random().toString((36)).substr((2),n);
});
frontend.util.unique_id = (function frontend$util$unique_id(){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.util.rand_str((6))),cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.util.rand_str((3)))].join('');
});
frontend.util.pp_str = (function frontend$util$pp_str(x){
var sb__5647__auto__ = (new goog.string.StringBuffer());
var _STAR_print_newline_STAR__orig_val__99615_99796 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__orig_val__99616_99797 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_newline_STAR__temp_val__99617_99798 = true;
var _STAR_print_fn_STAR__temp_val__99618_99799 = (function (x__5648__auto__){
return sb__5647__auto__.append(x__5648__auto__);
});
(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__99617_99798);

(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__99618_99799);

try{cljs.pprint.pprint.cljs$core$IFn$_invoke$arity$1(x);
}finally {(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__99616_99797);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__99615_99796);
}
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(sb__5647__auto__);
});
frontend.util.hiccup_keywordize = (function frontend$util$hiccup_keywordize(hiccup){
return clojure.walk.postwalk((function (f){
if(((cljs.core.vector_QMARK_(f)) && (typeof cljs.core.first(f) === 'string'))){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(f,(0),cljs.core.keyword);
} else {
return f;
}
}),hiccup);
});
frontend.util.chrome_QMARK_ = (function frontend$util$chrome_QMARK_(){
var user_agent = navigator.userAgent;
var vendor = navigator.vendor;
return cljs.core.boolean$((function (){var and__5000__auto__ = (function (){var G__99619 = /Chrome/;
var G__99620 = user_agent;
return (frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2 ? frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2(G__99619,G__99620) : frontend.util.safe_re_find.call(null,G__99619,G__99620));
})();
if(cljs.core.truth_(and__5000__auto__)){
var G__99621 = /Google Inc/;
var G__99622 = vendor;
return (frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2 ? frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2(G__99621,G__99622) : frontend.util.safe_re_find.call(null,G__99621,G__99622));
} else {
return and__5000__auto__;
}
})());
});
/**
 * Check if indexedDB support is available, reject if not
 */
frontend.util.indexeddb_check_QMARK_ = (function frontend$util$indexeddb_check_QMARK_(){
var db_name = "logseq-indexeddb-check";
if(cljs.core.truth_(window.indexedDB)){
return (new Promise((function (resolve,reject){
var req = window.indexedDB.open(db_name);
(req.onerror = reject);

return (req.onsuccess = (function (_event){
req.result.close();

var req__$1 = window.indexedDB.deleteDatabase(db_name);
(req__$1.onerror = reject);

return (req__$1.onsuccess = (function (_event__$1){
return (resolve.cljs$core$IFn$_invoke$arity$1 ? resolve.cljs$core$IFn$_invoke$arity$1(true) : resolve.call(null,true));
}));
}));
})));
} else {
return promesa.core.rejected("no indexeddb defined");
}
});
if((typeof frontend !== 'undefined') && (typeof frontend.util !== 'undefined') && (typeof frontend.util.mac_QMARK_ !== 'undefined')){
} else {
frontend.util.mac_QMARK_ = goog.userAgent.MAC;
}
if((typeof frontend !== 'undefined') && (typeof frontend.util !== 'undefined') && (typeof frontend.util.win32_QMARK_ !== 'undefined')){
} else {
frontend.util.win32_QMARK_ = goog.userAgent.WINDOWS;
}
if((typeof frontend !== 'undefined') && (typeof frontend.util !== 'undefined') && (typeof frontend.util.linux_QMARK_ !== 'undefined')){
} else {
frontend.util.linux_QMARK_ = goog.userAgent.LINUX;
}
frontend.util.get_blocks_by_id = (function frontend$util$get_blocks_by_id(block_id){
if(cljs.core.truth_((function (){var G__99623 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(block_id);
return (frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1(G__99623) : frontend.util.uuid_string_QMARK_.call(null,G__99623));
})())){
return dommy.utils.__GT_Array(document.querySelectorAll(dommy.core.selector((function (){var G__99624 = "[blockid='%s']";
var G__99625 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(block_id);
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__99624,G__99625) : frontend.util.format.call(null,G__99624,G__99625));
})())));
} else {
return null;
}
});
frontend.util.get_first_block_by_id = (function frontend$util$get_first_block_by_id(block_id){
return cljs.core.first(frontend.util.get_blocks_by_id(block_id));
});
frontend.util.url_encode = (function frontend$util$url_encode(string){
var G__99626 = string;
var G__99626__$1 = (((G__99626 == null))?null:cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__99626));
var G__99626__$2 = (((G__99626__$1 == null))?null:encodeURIComponent(G__99626__$1));
if((G__99626__$2 == null)){
return null;
} else {
return G__99626__$2.replace("+","%20");
}
});
/**
 * Delegate to common-util to loosely couple app usages to graph-parser
 */
frontend.util.page_name_sanity_lc = logseq.common.util.page_name_sanity_lc;
frontend.util.safe_page_name_sanity_lc = logseq.common.util.safe_page_name_sanity_lc;
frontend.util.get_page_title = logseq.common.util.get_page_title;
frontend.util.add_style_BANG_ = (function frontend$util$add_style_BANG_(style){
if((!((style == null)))){
var parent_node = document.head;
var id = "logseq-custom-theme-id";
var old_link_element = document.querySelector(dommy.core.selector(["#",id].join('')));
var style__$1 = ((clojure.string.starts_with_QMARK_(style,"http"))?style:["data:text/css;charset=utf-8,",cljs.core.str.cljs$core$IFn$_invoke$arity$1(encodeURIComponent(style))].join(''));
if(cljs.core.truth_(old_link_element)){
dommy.core.remove_BANG_.cljs$core$IFn$_invoke$arity$1(old_link_element);
} else {
}

var link_99802 = dommy.core.set_attr_BANG_.cljs$core$IFn$_invoke$arity$3(dommy.core.set_attr_BANG_.cljs$core$IFn$_invoke$arity$3(dommy.core.set_attr_BANG_.cljs$core$IFn$_invoke$arity$3(dommy.core.set_attr_BANG_.cljs$core$IFn$_invoke$arity$3(dommy.core.set_attr_BANG_.cljs$core$IFn$_invoke$arity$3(dommy.core.create_element.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"link","link",-1769163468)),new cljs.core.Keyword(null,"id","id",-1388402092),id),new cljs.core.Keyword(null,"rel","rel",1378823488),"stylesheet"),new cljs.core.Keyword(null,"type","type",1174270348),"text/css"),new cljs.core.Keyword(null,"href","href",-793805698),style__$1),new cljs.core.Keyword(null,"media","media",-1066138403),"all");
dommy.core.append_BANG_.cljs$core$IFn$_invoke$arity$2(parent_node,link_99802);

return frontend.util.set_android_theme();
} else {
return null;
}
});
frontend.util.remove_common_preceding = (function frontend$util$remove_common_preceding(col1,col2){
while(true){
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(col1),cljs.core.first(col2))) && (cljs.core.seq(col1)))){
var G__99804 = cljs.core.rest(col1);
var G__99805 = cljs.core.rest(col2);
col1 = G__99804;
col2 = G__99805;
continue;
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [col1,col2], null);
}
break;
}
});
frontend.util.get_file_ext = (function frontend$util$get_file_ext(file){
var and__5000__auto__ = typeof file === 'string';
if(and__5000__auto__){
var and__5000__auto____$1 = clojure.string.includes_QMARK_(file,".");
if(and__5000__auto____$1){
var G__99627 = logseq.common.util.path__GT_file_ext(file);
if((G__99627 == null)){
return null;
} else {
return clojure.string.lower_case(G__99627);
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
});
frontend.util.get_dir_and_basename = (function frontend$util$get_dir_and_basename(path){
var parts = clojure.string.split.cljs$core$IFn$_invoke$arity$2(path,"/");
var basename = cljs.core.last(parts);
var dir = (function (){var G__99628 = cljs.core.butlast(parts);
return (frontend.util.string_join_path.cljs$core$IFn$_invoke$arity$1 ? frontend.util.string_join_path.cljs$core$IFn$_invoke$arity$1(G__99628) : frontend.util.string_join_path.call(null,G__99628));
})();
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [dir,basename], null);
});
frontend.util.get_relative_path = (function frontend$util$get_relative_path(current_file_path,another_file_path){
var directories_f = (function (p1__99629_SHARP_){
return cljs.core.butlast(clojure.string.split.cljs$core$IFn$_invoke$arity$2(p1__99629_SHARP_,"/"));
});
var parts_1 = directories_f(current_file_path);
var parts_2 = directories_f(another_file_path);
var vec__99630 = frontend.util.remove_common_preceding(parts_1,parts_2);
var parts_1__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__99630,(0),null);
var parts_2__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__99630,(1),null);
var another_file_name = cljs.core.last(clojure.string.split.cljs$core$IFn$_invoke$arity$2(another_file_path,"/"));
var G__99633 = cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(((cljs.core.seq(parts_1__$1))?cljs.core.repeat.cljs$core$IFn$_invoke$arity$2(cljs.core.count(parts_1__$1),".."):new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["."], null)),parts_2__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [another_file_name], null)], 0));
return (frontend.util.string_join_path.cljs$core$IFn$_invoke$arity$1 ? frontend.util.string_join_path.cljs$core$IFn$_invoke$arity$1(G__99633) : frontend.util.string_join_path.call(null,G__99633));
});
frontend.util.keyname = (function frontend$util$keyname(key){
return [cljs.core.namespace(key),"/",cljs.core.name(key)].join('');
});
/**
 * drop all stuffs in CH, and return all of them
 */
frontend.util.drain_chan = (function frontend$util$drain_chan(ch){
return cljs.core.take_while.cljs$core$IFn$_invoke$arity$2(cljs.core.identity,cljs.core.repeatedly.cljs$core$IFn$_invoke$arity$1((function (){
return cljs.core.async.poll_BANG_(ch);
})));
});
frontend.util.trace_BANG_ = (function frontend$util$trace_BANG_(){
return console.trace();
});
frontend.util.remove_first = logseq.common.util.remove_first;
frontend.util.backward_kill_word = (function frontend$util$backward_kill_word(input){
var val = input.value;
var current = frontend.util.get_selection_start(input);
var prev = (function (){var or__5002__auto__ = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.max,cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [clojure.string.last_index_of.cljs$core$IFn$_invoke$arity$3(val," ",(current - (1))),clojure.string.last_index_of.cljs$core$IFn$_invoke$arity$3(val,"\n",(current - (1)))], null)));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})();
var idx = (((prev === (0)))?(0):((function (){var idx = prev;
while(true){
if(cljs.core.truth_((function (){var G__99641 = frontend.util.nth_safe(val,idx);
var fexpr__99640 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [" ",null,"\n",null], null), null);
return (fexpr__99640.cljs$core$IFn$_invoke$arity$1 ? fexpr__99640.cljs$core$IFn$_invoke$arity$1(G__99641) : fexpr__99640.call(null,G__99641));
})())){
var G__99808 = (idx - (1));
idx = G__99808;
continue;
} else {
return idx;
}
break;
}
})() + (1)));
return frontend.util.safe_set_range_text_BANG_.cljs$core$IFn$_invoke$arity$4(input,"",idx,current);
});
frontend.util.forward_kill_word = (function frontend$util$forward_kill_word(input){
var val = input.value;
var current = frontend.util.get_selection_start(input);
var current__$1 = (function (){var idx = current;
while(true){
if(cljs.core.truth_((function (){var G__99645 = frontend.util.nth_safe(val,idx);
var fexpr__99644 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [" ",null,"\n",null], null), null);
return (fexpr__99644.cljs$core$IFn$_invoke$arity$1 ? fexpr__99644.cljs$core$IFn$_invoke$arity$1(G__99645) : fexpr__99644.call(null,G__99645));
})())){
var G__99809 = (idx + (1));
idx = G__99809;
continue;
} else {
return idx;
}
break;
}
})();
var idx = (function (){var or__5002__auto__ = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.min,cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [clojure.string.index_of.cljs$core$IFn$_invoke$arity$3(val," ",current__$1),clojure.string.index_of.cljs$core$IFn$_invoke$arity$3(val,"\n",current__$1)], null)));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.count(val);
}
})();
return frontend.util.safe_set_range_text_BANG_.cljs$core$IFn$_invoke$arity$4(input,"",current__$1,(idx + (1)));
});
frontend.util.fix_open_external_with_shift_BANG_ = (function frontend$util$fix_open_external_with_shift_BANG_(e){
if(cljs.core.truth_((function (){var and__5000__auto__ = e.shiftKey;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = frontend.util.win32_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
var and__5000__auto____$2 = frontend.util.electron_QMARK_();
if(cljs.core.truth_(and__5000__auto____$2)){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(clojure.string.lower_case(e.target.nodeName),"a")) && (clojure.string.starts_with_QMARK_(e.target.href,"file:")));
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return e.preventDefault();
} else {
return null;
}
});
/**
 * Like react classnames utility:
 * 
 *   ```
 *    [:div {:class (classnames [:a :b {:c true}])}
 *   ```
 *   
 */
frontend.util.classnames = (function frontend$util$classnames(args){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentHashSet.EMPTY,cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__99646_SHARP_){
if(cljs.core.map_QMARK_(p1__99646_SHARP_)){
var iter__5480__auto__ = (function frontend$util$classnames_$_iter__99647(s__99648){
return (new cljs.core.LazySeq(null,(function (){
var s__99648__$1 = s__99648;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__99648__$1);
if(temp__5804__auto__){
var s__99648__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__99648__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__99648__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__99650 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__99649 = (0);
while(true){
if((i__99649 < size__5479__auto__)){
var vec__99651 = cljs.core._nth(c__5478__auto__,i__99649);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__99651,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__99651,(1),null);
cljs.core.chunk_append(b__99650,(cljs.core.truth_(v)?cljs.core.name(k):null));

var G__99812 = (i__99649 + (1));
i__99649 = G__99812;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__99650),frontend$util$classnames_$_iter__99647(cljs.core.chunk_rest(s__99648__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__99650),null);
}
} else {
var vec__99654 = cljs.core.first(s__99648__$2);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__99654,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__99654,(1),null);
return cljs.core.cons((cljs.core.truth_(v)?cljs.core.name(k):null),frontend$util$classnames_$_iter__99647(cljs.core.rest(s__99648__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(p1__99646_SHARP_);
} else {
if((p1__99646_SHARP_ == null)){
return null;
} else {
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.name(p1__99646_SHARP_)], null);
}
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([args], 0)));
});
frontend.util.get_dom_top = (function frontend$util$get_dom_top(node){
if(cljs.core.truth_(node)){
return frontend.util.goog$module$goog$object.get(node.getBoundingClientRect(),"top");
} else {
return null;
}
});
frontend.util.sort_by_height = (function frontend$util$sort_by_height(elements){
return cljs.core.sort.cljs$core$IFn$_invoke$arity$2((function (x,y){
return (frontend.util.get_dom_top(x) < frontend.util.get_dom_top(y));
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,elements));
});
frontend.util.calc_delta_rect_offset = (function frontend$util$calc_delta_rect_offset(target,container){
var target_rect = cljs_bean.core.__GT_clj(target.getBoundingClientRect().toJSON());
var viewport_rect = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"width","width",-384071477),container.clientWidth,new cljs.core.Keyword(null,"height","height",1025178622),container.clientHeight], null);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"y","y",-1757859776),(new cljs.core.Keyword(null,"height","height",1025178622).cljs$core$IFn$_invoke$arity$1(viewport_rect) - new cljs.core.Keyword(null,"bottom","bottom",-1550509018).cljs$core$IFn$_invoke$arity$1(target_rect)),new cljs.core.Keyword(null,"x","x",2099068185),(new cljs.core.Keyword(null,"width","width",-384071477).cljs$core$IFn$_invoke$arity$1(viewport_rect) - new cljs.core.Keyword(null,"right","right",-452581833).cljs$core$IFn$_invoke$arity$1(target_rect))], null);
});
frontend.util.regex_char_esc_smap = (function (){var esc_chars = "{}[]()&^%$#!?*.+|\\";
return cljs.core.zipmap(esc_chars,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__99657_SHARP_){
return ["\\",cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__99657_SHARP_)].join('');
}),esc_chars));
})();
/**
 * Escape all regex meta chars in text.
 */
frontend.util.regex_escape = (function frontend$util$regex_escape(text){
return clojure.string.join.cljs$core$IFn$_invoke$arity$1(cljs.core.replace.cljs$core$IFn$_invoke$arity$2(frontend.util.regex_char_esc_smap,text));
});
frontend.util.meta_key_QMARK_ = (function frontend$util$meta_key_QMARK_(e){
if(cljs.core.truth_(frontend.util.mac_QMARK_)){
return frontend.util.goog$module$goog$object.get(e,"metaKey");
} else {
return frontend.util.goog$module$goog$object.get(e,"ctrlKey");
}
});
frontend.util.shift_key_QMARK_ = (function frontend$util$shift_key_QMARK_(e){
return frontend.util.goog$module$goog$object.get(e,"shiftKey");
});
frontend.util.right_click_QMARK_ = (function frontend$util$right_click_QMARK_(e){
var which = frontend.util.goog$module$goog$object.get(e,"which");
var button = frontend.util.goog$module$goog$object.get(e,"button");
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(which,(3))) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(button,(2))));
});
frontend.util.keyboard_height = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
frontend.util.scroll_editor_cursor = (function frontend$util$scroll_editor_cursor(var_args){
var args__5732__auto__ = [];
var len__5726__auto___99813 = arguments.length;
var i__5727__auto___99814 = (0);
while(true){
if((i__5727__auto___99814 < len__5726__auto___99813)){
args__5732__auto__.push((arguments[i__5727__auto___99814]));

var G__99815 = (i__5727__auto___99814 + (1));
i__5727__auto___99814 = G__99815;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.util.scroll_editor_cursor.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.util.scroll_editor_cursor.cljs$core$IFn$_invoke$arity$variadic = (function (el,p__99660){
var map__99661 = p__99660;
var map__99661__$1 = cljs.core.__destructure_map(map__99661);
var to_vw_one_quarter_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__99661__$1,new cljs.core.Keyword(null,"to-vw-one-quarter?","to-vw-one-quarter?",1745595255));
if(cljs.core.truth_((function (){var and__5000__auto__ = el;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.util.mobile_QMARK_();
} else {
return and__5000__auto__;
}
})())){
var box_rect = el.getBoundingClientRect();
var box_top = box_rect.top;
var box_bottom = box_rect.bottom;
var header_height = goog.dom.getElementByClass("cp__header").clientHeight;
var main_node = frontend.util.app_scroll_container_node.cljs$core$IFn$_invoke$arity$1(el);
var scroll_top_SINGLEQUOTE_ = main_node.scrollTop;
var current_pos = frontend.util.get_selection_start(el);
var grapheme_pos = frontend.util.get_graphemes_pos(el.value,current_pos);
var mock_text = (function (){var G__99662 = goog.dom.getElement("mock-text");
var G__99662__$1 = (((G__99662 == null))?null:goog.dom.getChildren(G__99662));
var G__99662__$2 = (((G__99662__$1 == null))?null:cljs.core.array_seq.cljs$core$IFn$_invoke$arity$1(G__99662__$1));
if((G__99662__$2 == null)){
return null;
} else {
return frontend.util.nth_safe(G__99662__$2,grapheme_pos);
}
})();
var offset_top = (function (){var and__5000__auto__ = mock_text;
if(cljs.core.truth_(and__5000__auto__)){
return mock_text.offsetTop;
} else {
return and__5000__auto__;
}
})();
var offset_height = (function (){var and__5000__auto__ = mock_text;
if(cljs.core.truth_(and__5000__auto__)){
return mock_text.offsetHeight;
} else {
return and__5000__auto__;
}
})();
var cursor_y = (cljs.core.truth_(offset_top)?(((offset_top + box_top) + offset_height) + (2)):box_bottom);
var vw_height = (function (){var or__5002__auto__ = window.visualViewport.height;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return document.documentElement.clientHeight;
}
})();
var scroll = (cursor_y - (vw_height - (cljs.core.deref(frontend.util.keyboard_height) + ((40) + (4)))));
if(cljs.core.truth_((function (){var and__5000__auto__ = to_vw_one_quarter_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (cursor_y > (vw_height * 0.4));
} else {
return and__5000__auto__;
}
})())){
return (main_node.scrollTop = (scroll_top_SINGLEQUOTE_ + (cursor_y - (vw_height / (4)))));
} else {
if((((cursor_y < ((header_height + offset_height) + (4)))) && ((cursor_y >= header_height)))){
return main_node.scrollBy(cljs_bean.core.__GT_js(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"top","top",-1856271961),(- (offset_height + (4)))], null)));
} else {
if((cursor_y < header_height)){
var _ = el.scrollIntoView(true);
var main_node__$1 = frontend.util.app_scroll_container_node.cljs$core$IFn$_invoke$arity$1(el);
var scroll_top_SINGLEQUOTE___$1 = main_node__$1.scrollTop;
return (main_node__$1.scrollTop = (scroll_top_SINGLEQUOTE___$1 - (vw_height / (4))));
} else {
if((scroll > (0))){
return (main_node.scrollTop = (scroll_top_SINGLEQUOTE_ + scroll));
} else {
return null;

}
}
}
}
} else {
return null;
}
}));

(frontend.util.scroll_editor_cursor.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.util.scroll_editor_cursor.cljs$lang$applyTo = (function (seq99658){
var G__99659 = cljs.core.first(seq99658);
var seq99658__$1 = cljs.core.next(seq99658);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__99659,seq99658__$1);
}));

frontend.util.breakpoint_QMARK_ = (function frontend$util$breakpoint_QMARK_(size){
return (document.documentElement.offsetWidth < size);
});

frontend.util.sm_breakpoint_QMARK_ = (function frontend$util$sm_breakpoint_QMARK_(){
return frontend.util.breakpoint_QMARK_((640));
});
frontend.util.goog_event_QMARK_ = (function frontend$util$goog_event_QMARK_(e){
var and__5000__auto__ = e;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.fn_QMARK_(frontend.util.goog$module$goog$object.get(e,"getBrowserEvent"));
} else {
return and__5000__auto__;
}
});

/**
 * Check if keydown event is a composing (IME) event.
 *      Ignore the IME process by default.
 */
frontend.util.goog_event_is_composing_QMARK_ = (function frontend$util$goog_event_is_composing_QMARK_(var_args){
var G__99664 = arguments.length;
switch (G__99664) {
case 1:
return frontend.util.goog_event_is_composing_QMARK_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.util.goog_event_is_composing_QMARK_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.util.goog_event_is_composing_QMARK_.cljs$core$IFn$_invoke$arity$1 = (function (e){
return frontend.util.goog_event_is_composing_QMARK_.cljs$core$IFn$_invoke$arity$2(e,false);
}));

(frontend.util.goog_event_is_composing_QMARK_.cljs$core$IFn$_invoke$arity$2 = (function (e,include_process_QMARK_){
if(cljs.core.truth_(frontend.util.goog_event_QMARK_(e))){
var event_composing_QMARK_ = (function (){var G__99665 = e.getBrowserEvent();
if((G__99665 == null)){
return null;
} else {
return G__99665.isComposing;
}
})();
if(cljs.core.truth_(include_process_QMARK_)){
var or__5002__auto__ = event_composing_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.util.goog$module$goog$object.get(e,"keyCode"),(229))) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.util.goog$module$goog$object.get(e,"key"),"Process")));
}
} else {
return event_composing_QMARK_;
}
} else {
return null;
}
}));

(frontend.util.goog_event_is_composing_QMARK_.cljs$lang$maxFixedArity = 2);

/**
 * Check if onchange event of Input is a composing (IME) event.
 *     Always ignore the IME process.
 */
frontend.util.native_event_is_composing_QMARK_ = (function frontend$util$native_event_is_composing_QMARK_(e){
var temp__5804__auto__ = (function (){var and__5000__auto__ = e;
if(cljs.core.truth_(and__5000__auto__)){
if(cljs.core.truth_(frontend.util.goog_event_QMARK_(e))){
return e.getBrowserEvent();
} else {
if(cljs.core.truth_("_reactName" in e)){
return e.nativeEvent;
} else {
return e;

}
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var native_event = temp__5804__auto__;
return native_event.isComposing;
} else {
return null;
}
});
frontend.util.open_url = (function frontend$util$open_url(url){
var route_QMARK_ = ((clojure.string.starts_with_QMARK_(url,clojure.string.replace(location.href,location.hash,""))) || (clojure.string.starts_with_QMARK_(url,"#")));
if(cljs.core.truth_((function (){var and__5000__auto__ = (!(route_QMARK_));
if(and__5000__auto__){
return frontend.util.electron_QMARK_();
} else {
return and__5000__auto__;
}
})())){
return window.apis.openExternal(url);
} else {
return (window.location.href = url);
}
});
frontend.util.collapsed_QMARK_ = (function frontend$util$collapsed_QMARK_(block){
return new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991).cljs$core$IFn$_invoke$arity$1(block);
});
/**
 * time: inst-ms or js/Date
 */
frontend.util.human_time = (function frontend$util$human_time(var_args){
var args__5732__auto__ = [];
var len__5726__auto___99817 = arguments.length;
var i__5727__auto___99818 = (0);
while(true){
if((i__5727__auto___99818 < len__5726__auto___99817)){
args__5732__auto__.push((arguments[i__5727__auto___99818]));

var G__99819 = (i__5727__auto___99818 + (1));
i__5727__auto___99818 = G__99819;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.util.human_time.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.util.human_time.cljs$core$IFn$_invoke$arity$variadic = (function (time,p__99670){
var map__99671 = p__99670;
var map__99671__$1 = cljs.core.__destructure_map(map__99671);
var ago_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__99671__$1,new cljs.core.Keyword(null,"ago?","ago?",1414384824),true);
var after_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__99671__$1,new cljs.core.Keyword(null,"after?","after?",-1377776671),false);
var ago_QMARK___$1 = (cljs.core.truth_(after_QMARK_)?false:ago_QMARK_);
var units = new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"name","name",1843675177),"second",new cljs.core.Keyword(null,"limit","limit",-1355822363),(60),new cljs.core.Keyword(null,"in-second","in-second",-1351007453),(1)], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"name","name",1843675177),"minute",new cljs.core.Keyword(null,"limit","limit",-1355822363),(3600),new cljs.core.Keyword(null,"in-second","in-second",-1351007453),(60)], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"name","name",1843675177),"hour",new cljs.core.Keyword(null,"limit","limit",-1355822363),(86400),new cljs.core.Keyword(null,"in-second","in-second",-1351007453),(3600)], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"name","name",1843675177),"day",new cljs.core.Keyword(null,"limit","limit",-1355822363),(604800),new cljs.core.Keyword(null,"in-second","in-second",-1351007453),(86400)], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"name","name",1843675177),"week",new cljs.core.Keyword(null,"limit","limit",-1355822363),(2629743),new cljs.core.Keyword(null,"in-second","in-second",-1351007453),(604800)], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"name","name",1843675177),"month",new cljs.core.Keyword(null,"limit","limit",-1355822363),(31556926),new cljs.core.Keyword(null,"in-second","in-second",-1351007453),(2629743)], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"name","name",1843675177),"year",new cljs.core.Keyword(null,"limit","limit",-1355822363),Number.MAX_SAFE_INTEGER,new cljs.core.Keyword(null,"in-second","in-second",-1351007453),(31556926)], null)], null);
var time_SINGLEQUOTE_ = (((time instanceof Date))?time:(new Date(time)));
var now = cljs_time.core.now();
var diff = cljs_time.core.in_seconds((cljs.core.truth_(ago_QMARK___$1)?cljs_time.core.interval(time_SINGLEQUOTE_,now):cljs_time.core.interval(now,time_SINGLEQUOTE_)));
if((diff < (5))){
if(cljs.core.truth_(ago_QMARK___$1)){
return "just now";
} else {
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(diff),"seconds"].join('');
}
} else {
var unit = cljs.core.first(cljs.core.drop_while.cljs$core$IFn$_invoke$arity$2((function (p1__99666_SHARP_){
return (((diff >= new cljs.core.Keyword(null,"limit","limit",-1355822363).cljs$core$IFn$_invoke$arity$1(p1__99666_SHARP_))) || (cljs.core.not(new cljs.core.Keyword(null,"limit","limit",-1355822363).cljs$core$IFn$_invoke$arity$1(p1__99666_SHARP_))));
}),units));
return (function (p1__99667_SHARP_){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__99667_SHARP_)," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(unit)),(((p1__99667_SHARP_ > (1)))?"s":null),(cljs.core.truth_(ago_QMARK___$1)?" ago":null),(cljs.core.truth_(after_QMARK_)?" later":null)].join('');
})((Math.floor((diff / new cljs.core.Keyword(null,"in-second","in-second",-1351007453).cljs$core$IFn$_invoke$arity$1(unit))) | (0)));
}
}));

(frontend.util.human_time.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.util.human_time.cljs$lang$applyTo = (function (seq99668){
var G__99669 = cljs.core.first(seq99668);
var seq99668__$1 = cljs.core.next(seq99668);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__99669,seq99668__$1);
}));

frontend.util.JS_ROOT = ((frontend.util.node_test_QMARK_)?null:((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(location.protocol,"file:"))?"./js":"./static/js"));
frontend.util.js_load$ = (function frontend$util$js_load$(url){
return promesa.core.create.cljs$core$IFn$_invoke$arity$1((function (resolve){
return frontend.loader.load.cljs$core$IFn$_invoke$arity$2(url,resolve);
}));
});
frontend.util.css_load$ = (function frontend$util$css_load$(var_args){
var G__99673 = arguments.length;
switch (G__99673) {
case 1:
return frontend.util.css_load$.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.util.css_load$.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.util.css_load$.cljs$core$IFn$_invoke$arity$1 = (function (url){
return frontend.util.css_load$.cljs$core$IFn$_invoke$arity$2(url,null);
}));

(frontend.util.css_load$.cljs$core$IFn$_invoke$arity$2 = (function (url,id){
return promesa.core.create.cljs$core$IFn$_invoke$arity$1((function (resolve,reject){
var id__$1 = ["css-load-",cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = id;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return url;
}
})())].join('');
if(cljs.core.not(goog.dom.getElement(id__$1))){
var link = document.createElement("link");
(link.id = id__$1);

(link.rel = "stylesheet");

(link.href = url);

(link.onload = resolve);

(link.onerror = reject);

return document.head.append(link);
} else {
return (resolve.cljs$core$IFn$_invoke$arity$0 ? resolve.cljs$core$IFn$_invoke$arity$0() : resolve.call(null));
}
}));
}));

(frontend.util.css_load$.cljs$lang$maxFixedArity = 2);

frontend.util.image_blob__GT_png = (function frontend$util$image_blob__GT_png(blob,cb){
var image = (new Image());
var off_canvas = document.createElement("canvas");
var data_url = URL.createObjectURL(blob);
var ctx = off_canvas.getContext("2d");
(image.onload = (function (){
var width = image.width;
var height = image.height;
(off_canvas.width = width);

(off_canvas.height = height);

ctx.drawImage(image,(0),(0),width,height);

return off_canvas.toBlob(cb);
}));

return (image.src = data_url);
});
frontend.util.write_blob_to_clipboard = (function frontend$util$write_blob_to_clipboard(blob){
return navigator.clipboard.write([(new ClipboardItem((function (){var G__99674 = blob.type;
var obj99676 = ({});
(obj99676[G__99674] = blob);

return obj99676;
})()))]);
});
frontend.util.copy_image_to_clipboard = (function frontend$util$copy_image_to_clipboard(src){
return fetch(src).then((function (data){
return data.blob().then((function (blob){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(blob.type,"image/png")){
return frontend.util.write_blob_to_clipboard(blob);
} else {
return frontend.util.image_blob__GT_png(blob,frontend.util.write_blob_to_clipboard);
}
})).catch(console.error);
}));
});
/**
 * Different from core.memoize, it only cache the last result.
 * Returns a memoized version of a referentially transparent function. The
 *   memoized version of the function cache the the last result, and replay when calls
 * with the same arguments, or update cache when with different arguments.
 */
frontend.util.memoize_last = (function frontend$util$memoize_last(f){
var last_mem = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
var last_args = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
return (function() { 
var G__99823__delegate = function (args){
if((((cljs.core.deref(last_mem) == null)) || (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(last_args),args)))){
var ret = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,args);
cljs.core.reset_BANG_(last_args,args);

cljs.core.reset_BANG_(last_mem,ret);

return ret;
} else {
return cljs.core.deref(last_mem);
}
};
var G__99823 = function (var_args){
var args = null;
if (arguments.length > 0) {
var G__99824__i = 0, G__99824__a = new Array(arguments.length -  0);
while (G__99824__i < G__99824__a.length) {G__99824__a[G__99824__i] = arguments[G__99824__i + 0]; ++G__99824__i;}
  args = new cljs.core.IndexedSeq(G__99824__a,0,null);
} 
return G__99823__delegate.call(this,args);};
G__99823.cljs$lang$maxFixedArity = 0;
G__99823.cljs$lang$applyTo = (function (arglist__99825){
var args = cljs.core.seq(arglist__99825);
return G__99823__delegate(args);
});
G__99823.cljs$core$IFn$_invoke$arity$variadic = G__99823__delegate;
return G__99823;
})()
;
});
/**
 * start a async/go-loop to check the app awake from sleep.
 * Use (async/tap `pubsub/app-wake-up-from-sleep-mult`) to receive messages.
 * Arg *stop: atom, reset to true to stop the loop
 */
frontend.util._LT_app_wake_up_from_sleep_loop = (function frontend$util$_LT_app_wake_up_from_sleep_loop(_STAR_stop){
var _STAR_last_activated_at = cljs.core.volatile_BANG_(cljs_time.coerce.to_epoch(cljs_time.core.now()));
var c__32195__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_99707){
var state_val_99708 = (state_99707[(1)]);
if((state_val_99708 === (7))){
var inst_99683 = (state_99707[(7)]);
var inst_99688 = [new cljs.core.Keyword(null,"last-activated-at","last-activated-at",560279298),new cljs.core.Keyword(null,"now","now",-1650525531)];
var inst_99689 = cljs.core.deref(_STAR_last_activated_at);
var inst_99690 = [inst_99689,inst_99683];
var inst_99691 = cljs.core.PersistentHashMap.fromArrays(inst_99688,inst_99690);
var state_99707__$1 = state_99707;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_99707__$1,(10),frontend.pubsub.app_wake_up_from_sleep_ch,inst_99691);
} else {
if((state_val_99708 === (1))){
var state_99707__$1 = state_99707;
var statearr_99709_99828 = state_99707__$1;
(statearr_99709_99828[(2)] = null);

(statearr_99709_99828[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_99708 === (4))){
var inst_99680 = cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"<app-wake-up-from-sleep-loop","<app-wake-up-from-sleep-loop",-38276075),new cljs.core.Keyword(null,"stop","stop",-2140911342)], 0));
var state_99707__$1 = state_99707;
var statearr_99710_99829 = state_99707__$1;
(statearr_99710_99829[(2)] = inst_99680);

(statearr_99710_99829[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_99708 === (6))){
var inst_99703 = (state_99707[(2)]);
var state_99707__$1 = state_99707;
var statearr_99711_99830 = state_99707__$1;
(statearr_99711_99830[(2)] = inst_99703);

(statearr_99711_99830[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_99708 === (3))){
var inst_99705 = (state_99707[(2)]);
var state_99707__$1 = state_99707;
return cljs.core.async.impl.ioc_helpers.return_chan(state_99707__$1,inst_99705);
} else {
if((state_val_99708 === (2))){
var inst_99678 = cljs.core.deref(_STAR_stop);
var state_99707__$1 = state_99707;
if(cljs.core.truth_(inst_99678)){
var statearr_99712_99831 = state_99707__$1;
(statearr_99712_99831[(1)] = (4));

} else {
var statearr_99713_99832 = state_99707__$1;
(statearr_99713_99832[(1)] = (5));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_99708 === (11))){
var inst_99700 = (state_99707[(2)]);
var state_99707__$1 = (function (){var statearr_99714 = state_99707;
(statearr_99714[(8)] = inst_99700);

return statearr_99714;
})();
var statearr_99715_99833 = state_99707__$1;
(statearr_99715_99833[(2)] = null);

(statearr_99715_99833[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_99708 === (9))){
var inst_99683 = (state_99707[(7)]);
var inst_99696 = (state_99707[(2)]);
var inst_99697 = cljs.core.vreset_BANG_(_STAR_last_activated_at,inst_99683);
var inst_99698 = cljs.core.async.timeout((5000));
var state_99707__$1 = (function (){var statearr_99716 = state_99707;
(statearr_99716[(9)] = inst_99696);

(statearr_99716[(10)] = inst_99697);

return statearr_99716;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_99707__$1,(11),inst_99698);
} else {
if((state_val_99708 === (5))){
var inst_99683 = (state_99707[(7)]);
var inst_99682 = cljs_time.core.now();
var inst_99683__$1 = cljs_time.coerce.to_epoch(inst_99682);
var inst_99684 = cljs.core.deref(_STAR_last_activated_at);
var inst_99685 = (inst_99683__$1 - (10));
var inst_99686 = (inst_99684 < inst_99685);
var state_99707__$1 = (function (){var statearr_99717 = state_99707;
(statearr_99717[(7)] = inst_99683__$1);

return statearr_99717;
})();
if(cljs.core.truth_(inst_99686)){
var statearr_99718_99834 = state_99707__$1;
(statearr_99718_99834[(1)] = (7));

} else {
var statearr_99719_99835 = state_99707__$1;
(statearr_99719_99835[(1)] = (8));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_99708 === (10))){
var inst_99693 = (state_99707[(2)]);
var state_99707__$1 = state_99707;
var statearr_99720_99836 = state_99707__$1;
(statearr_99720_99836[(2)] = inst_99693);

(statearr_99720_99836[(1)] = (9));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_99708 === (8))){
var state_99707__$1 = state_99707;
var statearr_99721_99837 = state_99707__$1;
(statearr_99721_99837[(2)] = null);

(statearr_99721_99837[(1)] = (9));


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
}
});
return (function() {
var frontend$util$_LT_app_wake_up_from_sleep_loop_$_state_machine__32004__auto__ = null;
var frontend$util$_LT_app_wake_up_from_sleep_loop_$_state_machine__32004__auto____0 = (function (){
var statearr_99722 = [null,null,null,null,null,null,null,null,null,null,null];
(statearr_99722[(0)] = frontend$util$_LT_app_wake_up_from_sleep_loop_$_state_machine__32004__auto__);

(statearr_99722[(1)] = (1));

return statearr_99722;
});
var frontend$util$_LT_app_wake_up_from_sleep_loop_$_state_machine__32004__auto____1 = (function (state_99707){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_99707);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e99723){var ex__32007__auto__ = e99723;
var statearr_99724_99838 = state_99707;
(statearr_99724_99838[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_99707[(4)]))){
var statearr_99725_99839 = state_99707;
(statearr_99725_99839[(1)] = cljs.core.first((state_99707[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__99840 = state_99707;
state_99707 = G__99840;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$util$_LT_app_wake_up_from_sleep_loop_$_state_machine__32004__auto__ = function(state_99707){
switch(arguments.length){
case 0:
return frontend$util$_LT_app_wake_up_from_sleep_loop_$_state_machine__32004__auto____0.call(this);
case 1:
return frontend$util$_LT_app_wake_up_from_sleep_loop_$_state_machine__32004__auto____1.call(this,state_99707);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$util$_LT_app_wake_up_from_sleep_loop_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$util$_LT_app_wake_up_from_sleep_loop_$_state_machine__32004__auto____0;
frontend$util$_LT_app_wake_up_from_sleep_loop_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$util$_LT_app_wake_up_from_sleep_loop_$_state_machine__32004__auto____1;
return frontend$util$_LT_app_wake_up_from_sleep_loop_$_state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_99726 = f__32196__auto__();
(statearr_99726[(6)] = c__32195__auto__);

return statearr_99726;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));

return c__32195__auto__;
});
frontend.util.schedule = (function (){var or__5002__auto__ = (function (){var and__5000__auto__ = (typeof window !== 'undefined');
if(and__5000__auto__){
var or__5002__auto__ = window.requestAnimationFrame;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = window.webkitRequestAnimationFrame;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = window.mozRequestAnimationFrame;
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
return window.msRequestAnimationFrame;
}
}
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (function (p1__99727_SHARP_){
return setTimeout(p1__99727_SHARP_,(16));
});
}
})();
/**
 * Parse URL parameters in hash(fragment) into a hashmap
 */
frontend.util.parse_params = (function frontend$util$parse_params(){
if(frontend.util.node_test_QMARK_){
return cljs.core.PersistentArrayMap.EMPTY;
} else {
var temp__5804__auto__ = cljs.core.not_empty(window.location.hash);
if(cljs.core.truth_(temp__5804__auto__)){
var fragment = temp__5804__auto__;
if(clojure.string.starts_with_QMARK_(fragment,"#/?")){
return clojure.walk.keywordize_keys(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$1(cljs.core.seq((new URLSearchParams(cljs.core.subs.cljs$core$IFn$_invoke$arity$2(fragment,(2))))))));
} else {
return null;
}
} else {
return null;
}
}
});
frontend.util.get_cm_instance = (function frontend$util$get_cm_instance(target){
if(cljs.core.truth_(target)){
var G__99728 = target;
var G__99728__$1 = (((G__99728 == null))?null:G__99728.querySelector(".CodeMirror"));
if((G__99728__$1 == null)){
return null;
} else {
return G__99728__$1.CodeMirror;
}
} else {
return null;
}
});
frontend.util.mobile_keep_keyboard_open = (function frontend$util$mobile_keep_keyboard_open(){
if(cljs.core.truth_(frontend.util.mobile_QMARK_)){
var temp__5804__auto__ = goog.dom.getElement("app-keep-keyboard-open-input");
if(cljs.core.truth_(temp__5804__auto__)){
var node = temp__5804__auto__;
return node.focus();
} else {
return null;
}
} else {
return null;
}
});

//# sourceMappingURL=frontend.util.js.map
