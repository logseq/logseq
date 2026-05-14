goog.provide('frontend.modules.instrumentation.posthog');
var module$node_modules$posthog_js$dist$module=shadow.js.require("module$node_modules$posthog_js$dist$module", {});
/**
 * @define {string}
 */
frontend.modules.instrumentation.posthog.POSTHOG_TOKEN = goog.define("frontend.modules.instrumentation.posthog.POSTHOG_TOKEN","");
frontend.modules.instrumentation.posthog.masked = "masked";
frontend.modules.instrumentation.posthog.register = (function frontend$modules$instrumentation$posthog$register(){
return module$node_modules$posthog_js$dist$module.register(cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"app_type","app_type",1987848505),(function (){var platform = frontend.mobile.util.platform();
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return "electron";
} else {
if(cljs.core.truth_(platform)){
return platform;
} else {
return "web";

}
}
})(),new cljs.core.Keyword(null,"app_env","app_env",2090579378),(cljs.core.truth_(frontend.config.dev_QMARK_)?"development":"production"),new cljs.core.Keyword(null,"app_ver","app_ver",-1676704123),frontend.version.version,new cljs.core.Keyword(null,"schema_ver","schema_ver",1119051464),(0),new cljs.core.Keyword(null,"$current_url","$current_url",1127389168),"masked",new cljs.core.Keyword(null,"$pathname","$pathname",1308256549),"masked"], null)));
});
frontend.modules.instrumentation.posthog.config = new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"api_host","api_host",965977558),"https://app.posthog.com",new cljs.core.Keyword(null,"persistence","persistence",-203044807),"localStorage",new cljs.core.Keyword(null,"autocapture","autocapture",-447644577),false,new cljs.core.Keyword(null,"disable_session_recording","disable_session_recording",969214645),true,new cljs.core.Keyword(null,"mask_all_text","mask_all_text",263243794),true,new cljs.core.Keyword(null,"mask_all_element_attributes","mask_all_element_attributes",-395878417),true,new cljs.core.Keyword(null,"loaded","loaded",-1246482293),(function (_){
return frontend.modules.instrumentation.posthog.register();
})], null);
frontend.modules.instrumentation.posthog.init = (function frontend$modules$instrumentation$posthog$init(){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not(frontend.config.dev_QMARK_);
if(and__5000__auto__){
return cljs.core.not_empty(frontend.modules.instrumentation.posthog.POSTHOG_TOKEN);
} else {
return and__5000__auto__;
}
})())){
return module$node_modules$posthog_js$dist$module.init(frontend.modules.instrumentation.posthog.POSTHOG_TOKEN,cljs.core.clj__GT_js(frontend.modules.instrumentation.posthog.config));
} else {
return null;
}
});
frontend.modules.instrumentation.posthog.opt_out = (function frontend$modules$instrumentation$posthog$opt_out(opt_out_QMARK_){
if(cljs.core.truth_(opt_out_QMARK_)){
return module$node_modules$posthog_js$dist$module.opt_out_capturing();
} else {
frontend.modules.instrumentation.posthog.init();

return module$node_modules$posthog_js$dist$module.opt_in_capturing();
}
});
frontend.modules.instrumentation.posthog.capture = (function frontend$modules$instrumentation$posthog$capture(id,data){
try{return module$node_modules$posthog_js$dist$module.capture(cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),cljs_bean.core.__GT_js(data));
}catch (e125803){var e = e125803;
console.error(e);

return null;
}});

//# sourceMappingURL=frontend.modules.instrumentation.posthog.js.map
