goog.provide('frontend.mobile.camera');
goog.scope(function(){
  frontend.mobile.camera.goog$module$goog$object = goog.module.get('goog.object');
});
var module$node_modules$$capacitor$camera$dist$plugin_cjs=shadow.js.require("module$node_modules$$capacitor$camera$dist$plugin_cjs", {});
var module$node_modules$$capacitor$filesystem$dist$plugin_cjs=shadow.js.require("module$node_modules$$capacitor$filesystem$dist$plugin_cjs", {});
frontend.mobile.camera.take_or_choose_photo = (function frontend$mobile$camera$take_or_choose_photo(){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(module$node_modules$$capacitor$camera$dist$plugin_cjs.Camera.getPhoto(cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"allowEditing","allowEditing",-1230350561),cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("mobile","photo","mobile/photo",-1121110219),new cljs.core.Keyword(null,"allow-editing?","allow-editing?",671429084)], null)),new cljs.core.Keyword(null,"quality","quality",147850199),cljs.core.get_in.cljs$core$IFn$_invoke$arity$3(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("mobile","photo","mobile/photo",-1121110219),new cljs.core.Keyword(null,"quality","quality",147850199)], null),(80)),new cljs.core.Keyword(null,"saveToGallery","saveToGallery",-1289220708),true,new cljs.core.Keyword(null,"resultType","resultType",997699341),module$node_modules$$capacitor$camera$dist$plugin_cjs.CameraResultType.Base64], null))),(function (error){
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.mobile.camera",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("photo","get-failed","photo/get-failed",-1631862192),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"error","error",-978969032),error], null),new cljs.core.Keyword(null,"line","line",212345235),23], null)),null);
})),(function (photo){
if((photo == null)){
return promesa.core.resolved(null);
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise([cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.date.get_date_time_string_2()),".jpeg"].join('')),(function (filename){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.assets.get_asset_path(filename)),(function (image_path){
return promesa.protocols._mcat(promesa.protocols._promise(module$node_modules$$capacitor$filesystem$dist$plugin_cjs.Filesystem.writeFile(cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"data","data",-232669377),photo.base64String,new cljs.core.Keyword(null,"path","path",-188191168),image_path,new cljs.core.Keyword(null,"recursive","recursive",718885872),true], null)))),(function (_ret){
return promesa.protocols._promise(filename);
}));
}));
}));
}));
}
})),(function (error){
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.mobile.camera",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("file","write-failed","file/write-failed",-229053199),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"error","error",-978969032),error], null),new cljs.core.Keyword(null,"line","line",212345235),36], null)),null);
}));
});
frontend.mobile.camera.embed_photo = (function frontend$mobile$camera$embed_photo(id){
var block = frontend.state.get_edit_block();
var input = frontend.state.get_input();
var content = frontend.mobile.camera.goog$module$goog$object.get(input,"value");
var pos = frontend.util.cursor.pos(input);
var left_padding = (cljs.core.truth_(frontend.util.cursor.beginning_of_line_QMARK_(input))?null:((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((function (){var and__5000__auto__ = (!((pos === (0))));
if(and__5000__auto__){
return cljs.core.subs.cljs$core$IFn$_invoke$arity$2(content,(pos - (1)));
} else {
return and__5000__auto__;
}
})()," "))?null:" "
));
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089));
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.mobile.camera.take_or_choose_photo()),(function (filename){
return promesa.protocols._promise((cljs.core.truth_(cljs.core.not_empty(filename))?frontend.commands.simple_insert_BANG_(id,[left_padding,cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.handler.assets.get_asset_file_link(format,["../assets/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(filename)].join(''),filename,true))," "].join(''),cljs.core.PersistentArrayMap.EMPTY):null));
}));
}));
});

//# sourceMappingURL=frontend.mobile.camera.js.map
