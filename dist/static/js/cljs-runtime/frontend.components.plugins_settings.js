goog.provide('frontend.components.plugins_settings');
frontend.components.plugins_settings.dom_purify = (function frontend$components$plugins_settings$dom_purify(html,opts){
try{return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(DOMPurify,"sanitize",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([html,cljs_bean.core.__GT_js(opts)], 0));
}catch (e106781){if((e106781 instanceof Error)){
var e = e106781;
console.warn(e);

return html;
} else {
throw e106781;

}
}});
frontend.components.plugins_settings.html_content = rum.core.lazy_build(rum.core.build_defc,(function (html){
return daiquiri.core.create_element("div",{'dangerouslySetInnerHTML':{'__html':frontend.components.plugins_settings.dom_purify(html,null)},'className':"html-content pl-1 flex-1 text-sm"},[]);
}),null,"frontend.components.plugins-settings/html-content");
frontend.components.plugins_settings.edit_settings_file = rum.core.lazy_build(rum.core.build_defc,(function (pid,p__106795){
var map__106796 = p__106795;
var map__106796__$1 = cljs.core.__destructure_map(map__106796);
var class$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106796__$1,new cljs.core.Keyword(null,"class","class",-2030961996));
var edit_mode = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106796__$1,new cljs.core.Keyword(null,"edit-mode","edit-mode",1940640993));
var set_edit_mode_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106796__$1,new cljs.core.Keyword(null,"set-edit-mode!","set-edit-mode!",948556739));
return daiquiri.core.create_element("a",{'onClick':(function (){
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return frontend.handler.plugin.open_settings_file_in_default_app_BANG_(pid);
} else {
var G__106799 = (function (p1__106793_SHARP_){
if(cljs.core.truth_(p1__106793_SHARP_)){
return null;
} else {
return new cljs.core.Keyword(null,"code","code",1586293142);
}
});
return (set_edit_mode_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_edit_mode_BANG_.cljs$core$IFn$_invoke$arity$1(G__106799) : set_edit_mode_BANG_.call(null,G__106799));
}
}),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-sm","hover:underline",class$], null))},[((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(edit_mode,new cljs.core.Keyword(null,"code","code",1586293142)))?"Exit code mode":"Edit settings.json")]);
}),null,"frontend.components.plugins-settings/edit-settings-file");
frontend.components.plugins_settings.render_item_input = rum.core.lazy_build(rum.core.build_defc,(function (val,p__106806,update_setting_BANG_){
var map__106807 = p__106806;
var map__106807__$1 = cljs.core.__destructure_map(map__106807);
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106807__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106807__$1,new cljs.core.Keyword(null,"type","type",1174270348));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106807__$1,new cljs.core.Keyword(null,"title","title",636505583));
var default$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106807__$1,new cljs.core.Keyword(null,"default","default",-1987822328));
var description = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106807__$1,new cljs.core.Keyword(null,"description","description",-1428560544));
var inputAs = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106807__$1,new cljs.core.Keyword(null,"inputAs","inputAs",1243305598));
return daiquiri.core.create_element("div",{'data-key':key,'key':key,'className':"desc-item as-input"},[daiquiri.core.create_element("h2",null,[(function (){var attrs106815 = key;
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs106815))?daiquiri.interpreter.element_attributes(attrs106815):null),((cljs.core.map_QMARK_(attrs106815))?null:[daiquiri.interpreter.interpret(attrs106815)]));
})(),daiquiri.interpreter.interpret(frontend.ui.icon("caret-right")),(function (){var attrs106818 = title;
return daiquiri.core.create_element("strong",((cljs.core.map_QMARK_(attrs106818))?daiquiri.interpreter.element_attributes(attrs106818):null),((cljs.core.map_QMARK_(attrs106818))?null:[daiquiri.interpreter.interpret(attrs106818)]));
})()]),daiquiri.core.create_element("label",{'className':"form-control"},[frontend.components.plugins_settings.html_content(description),(function (){var input_as = frontend.util.safe_lower_case((function (){var or__5002__auto__ = inputAs;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.name(type);
}
})());
var input_as__$1 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(input_as,"string"))?new cljs.core.Keyword(null,"text","text",-1790561697):cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(input_as));
return daiquiri.interpreter.interpret(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(input_as__$1,new cljs.core.Keyword(null,"textarea","textarea",-650375824)))?new cljs.core.Keyword(null,"textarea","textarea",-650375824):new cljs.core.Keyword(null,"input","input",556931961)),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"class","class",-2030961996),frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"form-input","form-input",-226883230),(!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"color","color",1011675173),null,new cljs.core.Keyword(null,"range","range",1639692286),null], null), null),input_as__$1)))], null)], null)),new cljs.core.Keyword(null,"type","type",1174270348),cljs.core.name(input_as__$1),new cljs.core.Keyword(null,"defaultValue","defaultValue",-586131910),(function (){var or__5002__auto__ = val;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return default$;
}
})(),new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (p1__106802_SHARP_){
return p1__106802_SHARP_.stopPropagation();
}),new cljs.core.Keyword(null,"on-change","on-change",-732046149),goog.functions.debounce((function (p1__106803_SHARP_){
var G__106845 = key;
var G__106846 = frontend.util.evalue(p1__106803_SHARP_);
return (update_setting_BANG_.cljs$core$IFn$_invoke$arity$2 ? update_setting_BANG_.cljs$core$IFn$_invoke$arity$2(G__106845,G__106846) : update_setting_BANG_.call(null,G__106845,G__106846));
}),(1000))], null)], null));
})()])]);
}),null,"frontend.components.plugins-settings/render-item-input");
frontend.components.plugins_settings.render_item_toggle = rum.core.lazy_build(rum.core.build_defc,(function (val,p__106850,update_setting_BANG_){
var map__106853 = p__106850;
var map__106853__$1 = cljs.core.__destructure_map(map__106853);
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106853__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106853__$1,new cljs.core.Keyword(null,"title","title",636505583));
var description = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106853__$1,new cljs.core.Keyword(null,"description","description",-1428560544));
var default$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106853__$1,new cljs.core.Keyword(null,"default","default",-1987822328));
var val__$1 = ((cljs.core.boolean_QMARK_(val))?val:cljs.core.boolean$(default$));
return daiquiri.core.create_element("div",{'data-key':key,'className':"desc-item as-toggle"},[daiquiri.core.create_element("h2",null,[(function (){var attrs106869 = key;
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs106869))?daiquiri.interpreter.element_attributes(attrs106869):null),((cljs.core.map_QMARK_(attrs106869))?null:[daiquiri.interpreter.interpret(attrs106869)]));
})(),daiquiri.interpreter.interpret(frontend.ui.icon("caret-right")),(function (){var attrs106874 = title;
return daiquiri.core.create_element("strong",((cljs.core.map_QMARK_(attrs106874))?daiquiri.interpreter.element_attributes(attrs106874):null),((cljs.core.map_QMARK_(attrs106874))?null:[daiquiri.interpreter.interpret(attrs106874)]));
})()]),(function (){var attrs106868 = frontend.ui.checkbox(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"checked","checked",-50955819),val__$1,new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (){
var G__106878 = key;
var G__106879 = (!(val__$1));
return (update_setting_BANG_.cljs$core$IFn$_invoke$arity$2 ? update_setting_BANG_.cljs$core$IFn$_invoke$arity$2(G__106878,G__106879) : update_setting_BANG_.call(null,G__106878,G__106879));
})], null));
return daiquiri.core.create_element("label",((cljs.core.map_QMARK_(attrs106868))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["form-control"], null)], null),attrs106868], 0))):{'className':"form-control"}),((cljs.core.map_QMARK_(attrs106868))?[frontend.components.plugins_settings.html_content(description)]:[daiquiri.interpreter.interpret(attrs106868),frontend.components.plugins_settings.html_content(description)]));
})()]);
}),null,"frontend.components.plugins-settings/render-item-toggle");
frontend.components.plugins_settings.render_item_enum = rum.core.lazy_build(rum.core.build_defc,(function (val,p__106887,update_setting_BANG_){
var map__106888 = p__106887;
var map__106888__$1 = cljs.core.__destructure_map(map__106888);
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106888__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106888__$1,new cljs.core.Keyword(null,"title","title",636505583));
var description = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106888__$1,new cljs.core.Keyword(null,"description","description",-1428560544));
var default$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106888__$1,new cljs.core.Keyword(null,"default","default",-1987822328));
var enumChoices = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106888__$1,new cljs.core.Keyword(null,"enumChoices","enumChoices",-177859500));
var enumPicker = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106888__$1,new cljs.core.Keyword(null,"enumPicker","enumPicker",-719781503));
var val__$1 = (function (){var or__5002__auto__ = val;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return default$;
}
})();
var vals = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentHashSet.EMPTY,((cljs.core.sequential_QMARK_(val__$1))?val__$1:new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [val__$1], null)));
var options = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (v){
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"label","label",1718410804),v,new cljs.core.Keyword(null,"value","value",305978217),v,new cljs.core.Keyword(null,"selected","selected",574897764),cljs.core.contains_QMARK_(vals,v)], null);
}),enumChoices);
var picker = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(enumPicker);
return daiquiri.core.create_element("div",{'data-key':key,'className':"desc-item as-enum"},[daiquiri.core.create_element("h2",null,[(function (){var attrs106889 = key;
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs106889))?daiquiri.interpreter.element_attributes(attrs106889):null),((cljs.core.map_QMARK_(attrs106889))?null:[daiquiri.interpreter.interpret(attrs106889)]));
})(),daiquiri.interpreter.interpret(frontend.ui.icon("caret-right")),(function (){var attrs106890 = title;
return daiquiri.core.create_element("strong",((cljs.core.map_QMARK_(attrs106890))?daiquiri.interpreter.element_attributes(attrs106890):null),((cljs.core.map_QMARK_(attrs106890))?null:[daiquiri.interpreter.interpret(attrs106890)]));
})()]),daiquiri.core.create_element("div",{'className':"form-control"},[daiquiri.interpreter.interpret(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"radio","radio",1323726374),null,new cljs.core.Keyword(null,"checkbox","checkbox",1612615655),null], null), null),picker))?new cljs.core.Keyword(null,"div.wrap","div.wrap",1832950772):new cljs.core.Keyword(null,"label.wrap","label.wrap",-1504723647)),frontend.components.plugins_settings.html_content(description),(function (){var G__106891 = picker;
var G__106891__$1 = (((G__106891 instanceof cljs.core.Keyword))?G__106891.fqn:null);
switch (G__106891__$1) {
case "radio":
return frontend.ui.radio_list(options,(function (p1__106884_SHARP_){
return (update_setting_BANG_.cljs$core$IFn$_invoke$arity$2 ? update_setting_BANG_.cljs$core$IFn$_invoke$arity$2(key,p1__106884_SHARP_) : update_setting_BANG_.call(null,key,p1__106884_SHARP_));
}),null);

break;
case "checkbox":
return frontend.ui.checkbox_list(options,(function (p1__106885_SHARP_){
return (update_setting_BANG_.cljs$core$IFn$_invoke$arity$2 ? update_setting_BANG_.cljs$core$IFn$_invoke$arity$2(key,p1__106885_SHARP_) : update_setting_BANG_.call(null,key,p1__106885_SHARP_));
}),null);

break;
default:
return frontend.ui.select(options,(function (_,value){
return (update_setting_BANG_.cljs$core$IFn$_invoke$arity$2 ? update_setting_BANG_.cljs$core$IFn$_invoke$arity$2(key,value) : update_setting_BANG_.call(null,key,value));
}));

}
})()], null))])]);
}),null,"frontend.components.plugins-settings/render-item-enum");
frontend.components.plugins_settings.render_item_object = rum.core.lazy_build(rum.core.build_defc,(function (_val,p__106893,pid){
var map__106894 = p__106893;
var map__106894__$1 = cljs.core.__destructure_map(map__106894);
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106894__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106894__$1,new cljs.core.Keyword(null,"title","title",636505583));
var description = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106894__$1,new cljs.core.Keyword(null,"description","description",-1428560544));
var _default = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106894__$1,new cljs.core.Keyword(null,"_default","_default",308892991));
return daiquiri.core.create_element("div",{'data-key':key,'className':"desc-item as-object"},[daiquiri.core.create_element("h2",null,[(function (){var attrs106895 = key;
return daiquiri.core.create_element("code",((cljs.core.map_QMARK_(attrs106895))?daiquiri.interpreter.element_attributes(attrs106895):null),((cljs.core.map_QMARK_(attrs106895))?null:[daiquiri.interpreter.interpret(attrs106895)]));
})(),daiquiri.interpreter.interpret(frontend.ui.icon("caret-right")),(function (){var attrs106897 = title;
return daiquiri.core.create_element("strong",((cljs.core.map_QMARK_(attrs106897))?daiquiri.interpreter.element_attributes(attrs106897):null),((cljs.core.map_QMARK_(attrs106897))?null:[daiquiri.interpreter.interpret(attrs106897)]));
})()]),daiquiri.core.create_element("div",{'className':"form-control"},[frontend.components.plugins_settings.html_content(description),(cljs.core.truth_(frontend.util.electron_QMARK_())?daiquiri.core.create_element("div",{'className':"pl-1"},[frontend.components.plugins_settings.edit_settings_file(pid,null)]):null)])]);
}),null,"frontend.components.plugins-settings/render-item-object");
frontend.components.plugins_settings.render_item_heading = rum.core.lazy_build(rum.core.build_defc,(function (p__106902){
var map__106903 = p__106902;
var map__106903__$1 = cljs.core.__destructure_map(map__106903);
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106903__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106903__$1,new cljs.core.Keyword(null,"title","title",636505583));
var description = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106903__$1,new cljs.core.Keyword(null,"description","description",-1428560544));
return daiquiri.core.create_element("div",{'data-key':key,'className':"heading-item"},[(function (){var attrs106905 = title;
return daiquiri.core.create_element("h2",((cljs.core.map_QMARK_(attrs106905))?daiquiri.interpreter.element_attributes(attrs106905):null),((cljs.core.map_QMARK_(attrs106905))?null:[daiquiri.interpreter.interpret(attrs106905)]));
})(),frontend.components.plugins_settings.html_content(description)]);
}),null,"frontend.components.plugins-settings/render-item-heading");
frontend.components.plugins_settings.render_item_not_handled = rum.core.lazy_build(rum.core.build_defc,(function (s){
return daiquiri.core.create_element("p",{'className':"text-red-500"},[["#Not Handled# ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(s)].join('')]);
}),null,"frontend.components.plugins-settings/render-item-not-handled");
frontend.components.plugins_settings.settings_container = rum.core.lazy_build(rum.core.build_defc,(function (schema,pl){
var plugin_settings = pl.settings;
var pid = pl.id;
var vec__106922 = rum.core.use_state(cljs_bean.core.__GT_clj(plugin_settings.toJSON()));
var settings = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106922,(0),null);
var set_settings_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106922,(1),null);
var vec__106925 = rum.core.use_state(null);
var edit_mode = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106925,(0),null);
var set_edit_mode_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106925,(1),null);
var update_setting_BANG_ = (function (k,v){
return plugin_settings.set(cljs.core.name(k),cljs_bean.core.__GT_js(v));
});
logseq.shui.hooks.use_effect_BANG_((function (){
var on_change = (function (s){
var temp__5804__auto__ = cljs_bean.core.__GT_clj(s);
if(cljs.core.truth_(temp__5804__auto__)){
var s__$1 = temp__5804__auto__;
return (set_settings_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_settings_BANG_.cljs$core$IFn$_invoke$arity$1(s__$1) : set_settings_BANG_.call(null,s__$1));
} else {
return null;
}
});
plugin_settings.on("change",on_change);

return (function (){
return plugin_settings.off("change",on_change);
});
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [pid], null));

if(cljs.core.seq(schema)){
return daiquiri.core.create_element(daiquiri.core.fragment,null,[daiquiri.core.create_element("h2",{'className':"text-xl px-2 pt-1 opacity-90"},["ID: ",pid]),daiquiri.core.create_element("div",{'data-mode':(function (){var G__106935 = edit_mode;
if((G__106935 == null)){
return null;
} else {
return cljs.core.name(G__106935);
}
})(),'className':"cp__plugins-settings-inner"},[daiquiri.core.create_element("span",{'className':"edit-file"},[frontend.components.plugins_settings.edit_settings_file(pid,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"set-edit-mode!","set-edit-mode!",948556739),set_edit_mode_BANG_,new cljs.core.Keyword(null,"edit-mode","edit-mode",1940640993),edit_mode], null))]),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(edit_mode,new cljs.core.Keyword(null,"code","code",1586293142)))?(function (){var attrs106942 = (function (){var content_SINGLEQUOTE_ = JSON.stringify(cljs_bean.core.__GT_js(settings),null,(2));
return frontend.components.lazy_editor.editor(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"file?","file?",1755223728),false], null),"code-edit-lsp-settings",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data-lang","data-lang",969460304),"json"], null),content_SINGLEQUOTE_,cljs.core.PersistentArrayMap.EMPTY);
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs106942))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, ["code-mode-wrap","pl-3","pr-1","py-1","mb-8","-ml-1"], null)], null),attrs106942], 0))):{'className':"code-mode-wrap pl-3 pr-1 py-1 mb-8 -ml-1"}),((cljs.core.map_QMARK_(attrs106942))?[(function (){var attrs106955 = (function (){var G__106964 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
var cm = frontend.util.get_cm_instance(e.target.closest(".code-mode-wrap"));
var content_SINGLEQUOTE_ = (function (){var G__106966 = plugin_settings.toJSON();
if((G__106966 == null)){
return null;
} else {
return JSON.stringify(G__106966,null,(2));
}
})();
return cm.setValue(content_SINGLEQUOTE_);
})], null);
var G__106965 = "Reset";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__106964,G__106965) : logseq.shui.ui.button.call(null,G__106964,G__106965));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs106955))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","justify-end","pt-2","gap-2"], null)], null),attrs106955], 0))):{'className':"flex justify-end pt-2 gap-2"}),((cljs.core.map_QMARK_(attrs106955))?[daiquiri.interpreter.interpret((function (){var G__106971 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
try{var cm = frontend.util.get_cm_instance(e.target.closest(".code-mode-wrap"));
var content = cm.getValue();
var content_SINGLEQUOTE_ = JSON.parse(content);
(plugin_settings.settings = content_SINGLEQUOTE_);

return (set_edit_mode_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_edit_mode_BANG_.cljs$core$IFn$_invoke$arity$1(null) : set_edit_mode_BANG_.call(null,null));
}catch (e106973){if((e106973 instanceof Error)){
var e__$1 = e106973;
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(e__$1.message,new cljs.core.Keyword(null,"error","error",-978969032));
} else {
throw e106973;

}
}})], null);
var G__106972 = "Save";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__106971,G__106972) : logseq.shui.ui.button.call(null,G__106971,G__106972));
})())]:[daiquiri.interpreter.interpret(attrs106955),daiquiri.interpreter.interpret((function (){var G__106978 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
try{var cm = frontend.util.get_cm_instance(e.target.closest(".code-mode-wrap"));
var content = cm.getValue();
var content_SINGLEQUOTE_ = JSON.parse(content);
(plugin_settings.settings = content_SINGLEQUOTE_);

return (set_edit_mode_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_edit_mode_BANG_.cljs$core$IFn$_invoke$arity$1(null) : set_edit_mode_BANG_.call(null,null));
}catch (e106980){if((e106980 instanceof Error)){
var e__$1 = e106980;
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(e__$1.message,new cljs.core.Keyword(null,"error","error",-978969032));
} else {
throw e106980;

}
}})], null);
var G__106979 = "Save";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__106978,G__106979) : logseq.shui.ui.button.call(null,G__106978,G__106979));
})())]));
})()]:[daiquiri.interpreter.interpret(attrs106942),(function (){var attrs106963 = (function (){var G__106981 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
var cm = frontend.util.get_cm_instance(e.target.closest(".code-mode-wrap"));
var content_SINGLEQUOTE_ = (function (){var G__106983 = plugin_settings.toJSON();
if((G__106983 == null)){
return null;
} else {
return JSON.stringify(G__106983,null,(2));
}
})();
return cm.setValue(content_SINGLEQUOTE_);
})], null);
var G__106982 = "Reset";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__106981,G__106982) : logseq.shui.ui.button.call(null,G__106981,G__106982));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs106963))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","justify-end","pt-2","gap-2"], null)], null),attrs106963], 0))):{'className':"flex justify-end pt-2 gap-2"}),((cljs.core.map_QMARK_(attrs106963))?[daiquiri.interpreter.interpret((function (){var G__106987 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
try{var cm = frontend.util.get_cm_instance(e.target.closest(".code-mode-wrap"));
var content = cm.getValue();
var content_SINGLEQUOTE_ = JSON.parse(content);
(plugin_settings.settings = content_SINGLEQUOTE_);

return (set_edit_mode_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_edit_mode_BANG_.cljs$core$IFn$_invoke$arity$1(null) : set_edit_mode_BANG_.call(null,null));
}catch (e106989){if((e106989 instanceof Error)){
var e__$1 = e106989;
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(e__$1.message,new cljs.core.Keyword(null,"error","error",-978969032));
} else {
throw e106989;

}
}})], null);
var G__106988 = "Save";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__106987,G__106988) : logseq.shui.ui.button.call(null,G__106987,G__106988));
})())]:[daiquiri.interpreter.interpret(attrs106963),daiquiri.interpreter.interpret((function (){var G__106993 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
try{var cm = frontend.util.get_cm_instance(e.target.closest(".code-mode-wrap"));
var content = cm.getValue();
var content_SINGLEQUOTE_ = JSON.parse(content);
(plugin_settings.settings = content_SINGLEQUOTE_);

return (set_edit_mode_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_edit_mode_BANG_.cljs$core$IFn$_invoke$arity$1(null) : set_edit_mode_BANG_.call(null,null));
}catch (e106995){if((e106995 instanceof Error)){
var e__$1 = e106995;
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(e__$1.message,new cljs.core.Keyword(null,"error","error",-978969032));
} else {
throw e106995;

}
}})], null);
var G__106994 = "Save";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__106993,G__106994) : logseq.shui.ui.button.call(null,G__106993,G__106994));
})())]));
})()]));
})():cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$plugins_settings$iter__106996(s__106997){
return (new cljs.core.LazySeq(null,(function (){
var s__106997__$1 = s__106997;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__106997__$1);
if(temp__5804__auto__){
var s__106997__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__106997__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__106997__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__106999 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__106998 = (0);
while(true){
if((i__106998 < size__5479__auto__)){
var desc = cljs.core._nth(c__5478__auto__,i__106998);
var key = new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(desc);
var val = cljs.core.get.cljs$core$IFn$_invoke$arity$2(settings,cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(key));
var type = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(desc));
var desc__$1 = cljs.core.update.cljs$core$IFn$_invoke$arity$3(desc,new cljs.core.Keyword(null,"description","description",-1428560544),((function (i__106998,key,val,type,desc,c__5478__auto__,size__5479__auto__,b__106999,s__106997__$2,temp__5804__auto__,plugin_settings,pid,vec__106922,settings,set_settings_BANG_,vec__106925,edit_mode,set_edit_mode_BANG_,update_setting_BANG_){
return (function (p1__106919_SHARP_){
return frontend.handler.plugin.markdown_to_html(p1__106919_SHARP_);
});})(i__106998,key,val,type,desc,c__5478__auto__,size__5479__auto__,b__106999,s__106997__$2,temp__5804__auto__,plugin_settings,pid,vec__106922,settings,set_settings_BANG_,vec__106925,edit_mode,set_edit_mode_BANG_,update_setting_BANG_))
);
cljs.core.chunk_append(b__106999,rum.core.with_key((function (){var pred__107013 = cljs.core.contains_QMARK_;
var expr__107014 = type;
if(cljs.core.truth_((function (){var G__107016 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"number","number",1570378438),null,new cljs.core.Keyword(null,"string","string",-1989541586),null], null), null);
var G__107017 = expr__107014;
return (pred__107013.cljs$core$IFn$_invoke$arity$2 ? pred__107013.cljs$core$IFn$_invoke$arity$2(G__107016,G__107017) : pred__107013.call(null,G__107016,G__107017));
})())){
return frontend.components.plugins_settings.render_item_input(val,desc__$1,update_setting_BANG_);
} else {
if(cljs.core.truth_((function (){var G__107018 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"boolean","boolean",-1919418404),null], null), null);
var G__107019 = expr__107014;
return (pred__107013.cljs$core$IFn$_invoke$arity$2 ? pred__107013.cljs$core$IFn$_invoke$arity$2(G__107018,G__107019) : pred__107013.call(null,G__107018,G__107019));
})())){
return frontend.components.plugins_settings.render_item_toggle(val,desc__$1,update_setting_BANG_);
} else {
if(cljs.core.truth_((function (){var G__107020 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"enum","enum",1679018432),null], null), null);
var G__107021 = expr__107014;
return (pred__107013.cljs$core$IFn$_invoke$arity$2 ? pred__107013.cljs$core$IFn$_invoke$arity$2(G__107020,G__107021) : pred__107013.call(null,G__107020,G__107021));
})())){
return frontend.components.plugins_settings.render_item_enum(val,desc__$1,update_setting_BANG_);
} else {
if(cljs.core.truth_((function (){var G__107023 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"object","object",1474613949),null], null), null);
var G__107024 = expr__107014;
return (pred__107013.cljs$core$IFn$_invoke$arity$2 ? pred__107013.cljs$core$IFn$_invoke$arity$2(G__107023,G__107024) : pred__107013.call(null,G__107023,G__107024));
})())){
return frontend.components.plugins_settings.render_item_object(val,desc__$1,pid);
} else {
if(cljs.core.truth_((function (){var G__107025 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"heading","heading",-1312171873),null], null), null);
var G__107026 = expr__107014;
return (pred__107013.cljs$core$IFn$_invoke$arity$2 ? pred__107013.cljs$core$IFn$_invoke$arity$2(G__107025,G__107026) : pred__107013.call(null,G__107025,G__107026));
})())){
return frontend.components.plugins_settings.render_item_heading(desc__$1);
} else {
return frontend.components.plugins_settings.render_item_not_handled(key);
}
}
}
}
}
})(),key));

var G__107089 = (i__106998 + (1));
i__106998 = G__107089;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__106999),frontend$components$plugins_settings$iter__106996(cljs.core.chunk_rest(s__106997__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__106999),null);
}
} else {
var desc = cljs.core.first(s__106997__$2);
var key = new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(desc);
var val = cljs.core.get.cljs$core$IFn$_invoke$arity$2(settings,cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(key));
var type = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(desc));
var desc__$1 = cljs.core.update.cljs$core$IFn$_invoke$arity$3(desc,new cljs.core.Keyword(null,"description","description",-1428560544),((function (key,val,type,desc,s__106997__$2,temp__5804__auto__,plugin_settings,pid,vec__106922,settings,set_settings_BANG_,vec__106925,edit_mode,set_edit_mode_BANG_,update_setting_BANG_){
return (function (p1__106919_SHARP_){
return frontend.handler.plugin.markdown_to_html(p1__106919_SHARP_);
});})(key,val,type,desc,s__106997__$2,temp__5804__auto__,plugin_settings,pid,vec__106922,settings,set_settings_BANG_,vec__106925,edit_mode,set_edit_mode_BANG_,update_setting_BANG_))
);
return cljs.core.cons(rum.core.with_key((function (){var pred__107040 = cljs.core.contains_QMARK_;
var expr__107041 = type;
if(cljs.core.truth_((function (){var G__107043 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"number","number",1570378438),null,new cljs.core.Keyword(null,"string","string",-1989541586),null], null), null);
var G__107044 = expr__107041;
return (pred__107040.cljs$core$IFn$_invoke$arity$2 ? pred__107040.cljs$core$IFn$_invoke$arity$2(G__107043,G__107044) : pred__107040.call(null,G__107043,G__107044));
})())){
return frontend.components.plugins_settings.render_item_input(val,desc__$1,update_setting_BANG_);
} else {
if(cljs.core.truth_((function (){var G__107045 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"boolean","boolean",-1919418404),null], null), null);
var G__107046 = expr__107041;
return (pred__107040.cljs$core$IFn$_invoke$arity$2 ? pred__107040.cljs$core$IFn$_invoke$arity$2(G__107045,G__107046) : pred__107040.call(null,G__107045,G__107046));
})())){
return frontend.components.plugins_settings.render_item_toggle(val,desc__$1,update_setting_BANG_);
} else {
if(cljs.core.truth_((function (){var G__107047 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"enum","enum",1679018432),null], null), null);
var G__107048 = expr__107041;
return (pred__107040.cljs$core$IFn$_invoke$arity$2 ? pred__107040.cljs$core$IFn$_invoke$arity$2(G__107047,G__107048) : pred__107040.call(null,G__107047,G__107048));
})())){
return frontend.components.plugins_settings.render_item_enum(val,desc__$1,update_setting_BANG_);
} else {
if(cljs.core.truth_((function (){var G__107051 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"object","object",1474613949),null], null), null);
var G__107052 = expr__107041;
return (pred__107040.cljs$core$IFn$_invoke$arity$2 ? pred__107040.cljs$core$IFn$_invoke$arity$2(G__107051,G__107052) : pred__107040.call(null,G__107051,G__107052));
})())){
return frontend.components.plugins_settings.render_item_object(val,desc__$1,pid);
} else {
if(cljs.core.truth_((function (){var G__107053 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"heading","heading",-1312171873),null], null), null);
var G__107054 = expr__107041;
return (pred__107040.cljs$core$IFn$_invoke$arity$2 ? pred__107040.cljs$core$IFn$_invoke$arity$2(G__107053,G__107054) : pred__107040.call(null,G__107053,G__107054));
})())){
return frontend.components.plugins_settings.render_item_heading(desc__$1);
} else {
return frontend.components.plugins_settings.render_item_not_handled(key);
}
}
}
}
}
})(),key),frontend$components$plugins_settings$iter__106996(cljs.core.rest(s__106997__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(schema);
})()))])]);
} else {
return daiquiri.core.create_element("h2",{'className':"font-bold text-lg py-4 warning"},["No Settings Schema!"]);
}
}),null,"frontend.components.plugins-settings/settings-container");

//# sourceMappingURL=frontend.components.plugins_settings.js.map
