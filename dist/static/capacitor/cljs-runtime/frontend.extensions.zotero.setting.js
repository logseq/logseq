goog.provide('frontend.extensions.zotero.setting');
frontend.extensions.zotero.setting.default_settings = cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"extra-tags","extra-tags",-1152617311),new cljs.core.Keyword(null,"overwrite-mode?","overwrite-mode?",-1715124409),new cljs.core.Keyword(null,"zotero-data-directory","zotero-data-directory",-218308088),new cljs.core.Keyword(null,"zotero-linked-attachment-base-directory","zotero-linked-attachment-base-directory",-799816118),new cljs.core.Keyword(null,"include-attachments?","include-attachments?",1105323115),new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"notes-block-text","notes-block-text",1546725518),new cljs.core.Keyword(null,"page-insert-prefix","page-insert-prefix",1646035089),new cljs.core.Keyword(null,"prefer-citekey?","prefer-citekey?",2120866291),new cljs.core.Keyword(null,"include-notes?","include-notes?",1426313915),new cljs.core.Keyword(null,"attachments-block-text","attachments-block-text",455049244)],["",false,"","",true,new cljs.core.Keyword(null,"user","user",1532431356),"[[Notes]]","@",true,true,"[[Attachments]]"]);
frontend.extensions.zotero.setting.sub_zotero_config = (function frontend$extensions$zotero$setting$sub_zotero_config(){
return new cljs.core.Keyword("zotero","settings-v2","zotero/settings-v2",-666496103).cljs$core$IFn$_invoke$arity$1(frontend.state.sub_config.cljs$core$IFn$_invoke$arity$0());
});
frontend.extensions.zotero.setting.all_profiles = (function frontend$extensions$zotero$setting$all_profiles(){
var profiles = cljs.core.set(cljs.core.keys(frontend.extensions.zotero.setting.sub_zotero_config()));
var default$ = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, ["default",null], null), null);
if(cljs.core.empty_QMARK_(profiles)){
return default$;
} else {
return profiles;
}
});
frontend.extensions.zotero.setting.get_profile = (function frontend$extensions$zotero$setting$get_profile(){
var profile = frontend.storage.get(new cljs.core.Keyword("zotero","setting-profile","zotero/setting-profile",1949443220));
if(cljs.core.truth_((function (){var and__5000__auto__ = profile;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.contains_QMARK_(frontend.extensions.zotero.setting.all_profiles(),profile);
} else {
return and__5000__auto__;
}
})())){
return profile;
} else {
return cljs.core.first(frontend.extensions.zotero.setting.all_profiles());
}
});
frontend.extensions.zotero.setting.api_key = (function frontend$extensions$zotero$setting$api_key(){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(frontend.storage.get(new cljs.core.Keyword("zotero","api-key-v2","zotero/api-key-v2",-954091799)),frontend.extensions.zotero.setting.get_profile());
});
frontend.extensions.zotero.setting.set_api_key = (function frontend$extensions$zotero$setting$set_api_key(key){
var profile = frontend.extensions.zotero.setting.get_profile();
var api_key_map = frontend.storage.get(new cljs.core.Keyword("zotero","api-key-v2","zotero/api-key-v2",-954091799));
return frontend.storage.set(new cljs.core.Keyword("zotero","api-key-v2","zotero/api-key-v2",-954091799),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(api_key_map,profile,key));
});
frontend.extensions.zotero.setting.add_profile = (function frontend$extensions$zotero$setting$add_profile(profile){
var settings = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.extensions.zotero.setting.sub_zotero_config(),profile,cljs.core.PersistentArrayMap.EMPTY);
return frontend.handler.config.set_config_BANG_(new cljs.core.Keyword("zotero","settings-v2","zotero/settings-v2",-666496103),settings);
});
frontend.extensions.zotero.setting.set_profile = (function frontend$extensions$zotero$setting$set_profile(profile){
frontend.storage.set(new cljs.core.Keyword("zotero","setting-profile","zotero/setting-profile",1949443220),profile);

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.core.then.cljs$core$IFn$_invoke$arity$2(setTimeout((1000)),(function (){
return cljs.core.contains_QMARK_(frontend.extensions.zotero.setting.all_profiles(),profile);
}))),(function (has_item_QMARK_){
return promesa.protocols._promise((cljs.core.truth_(has_item_QMARK_)?null:frontend.extensions.zotero.setting.add_profile(profile)));
}));
}));
});
frontend.extensions.zotero.setting.remove_profile = (function frontend$extensions$zotero$setting$remove_profile(profile){
var settings = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(frontend.extensions.zotero.setting.sub_zotero_config(),profile);
return frontend.handler.config.set_config_BANG_(new cljs.core.Keyword("zotero","settings-v2","zotero/settings-v2",-666496103),settings);
});
frontend.extensions.zotero.setting.set_setting_BANG_ = (function frontend$extensions$zotero$setting$set_setting_BANG_(k,v){
var profile = frontend.extensions.zotero.setting.get_profile();
var new_settings = cljs.core.update.cljs$core$IFn$_invoke$arity$3(frontend.extensions.zotero.setting.sub_zotero_config(),profile,(function (p1__71759_SHARP_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__71759_SHARP_,k,v);
}));
return frontend.handler.config.set_config_BANG_(new cljs.core.Keyword("zotero","settings-v2","zotero/settings-v2",-666496103),new_settings);
});
frontend.extensions.zotero.setting.setting = (function frontend$extensions$zotero$setting$setting(k){
var profile = frontend.extensions.zotero.setting.get_profile();
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.get.cljs$core$IFn$_invoke$arity$2(frontend.extensions.zotero.setting.sub_zotero_config(),profile),k,cljs.core.get.cljs$core$IFn$_invoke$arity$2(frontend.extensions.zotero.setting.default_settings,k));
});
frontend.extensions.zotero.setting.valid_QMARK_ = (function frontend$extensions$zotero$setting$valid_QMARK_(){
return (((!(clojure.string.blank_QMARK_(frontend.extensions.zotero.setting.api_key())))) && ((!(clojure.string.blank_QMARK_(frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"type-id","type-id",2030062700)))))));
});

//# sourceMappingURL=frontend.extensions.zotero.setting.js.map
