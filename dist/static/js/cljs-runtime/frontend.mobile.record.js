goog.provide('frontend.mobile.record');
var module$node_modules$$capacitor$filesystem$dist$plugin_cjs=shadow.js.require("module$node_modules$$capacitor$filesystem$dist$plugin_cjs", {});
var module$node_modules$capacitor_voice_recorder$dist$plugin_cjs=shadow.js.require("module$node_modules$capacitor_voice_recorder$dist$plugin_cjs", {});
frontend.mobile.record.request_audio_recording_permission = (function frontend$mobile$record$request_audio_recording_permission(){
return promesa.core.then.cljs$core$IFn$_invoke$arity$2(module$node_modules$capacitor_voice_recorder$dist$plugin_cjs.VoiceRecorder.requestAudioRecordingPermission(),(function (result){
return result.value;
}));
});
frontend.mobile.record.has_audio_recording_permission_QMARK_ = (function frontend$mobile$record$has_audio_recording_permission_QMARK_(){
return promesa.core.then.cljs$core$IFn$_invoke$arity$2(module$node_modules$capacitor_voice_recorder$dist$plugin_cjs.VoiceRecorder.hasAudioRecordingPermission(),(function (result){
return result.value;
}));
});
frontend.mobile.record.set_recording_state = (function frontend$mobile$record$set_recording_state(){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(module$node_modules$capacitor_voice_recorder$dist$plugin_cjs.VoiceRecorder.getCurrentStatus(),(function (result){
var map__130705 = cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(result,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
var map__130705__$1 = cljs.core.__destructure_map(map__130705);
var status = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130705__$1,new cljs.core.Keyword(null,"status","status",-1997798413));
return frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","record-status","editor/record-status",-122164557),status);
})),(function (error){
return console.error(error);
}));
});
frontend.mobile.record.start_recording = (function frontend$mobile$record$start_recording(){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.mobile.record.has_audio_recording_permission_QMARK_()),(function (permission_granted_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var or__5002__auto__ = permission_granted_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.mobile.record.request_audio_recording_permission();
}
})()),(function (permission_granted_QMARK___$1){
return promesa.protocols._promise((cljs.core.truth_(permission_granted_QMARK___$1)?promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(module$node_modules$capacitor_voice_recorder$dist$plugin_cjs.VoiceRecorder.startRecording(),(function (_result){
frontend.mobile.record.set_recording_state();

return console.log("Start recording...");
})),(function (error){
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.mobile.record",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"start-recording-error","start-recording-error",-1756235567),error,new cljs.core.Keyword(null,"line","line",212345235),43], null)),null);
})):null));
}));
}));
}));
});
frontend.mobile.record.embed_audio = (function frontend$mobile$record$embed_audio(database64){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var or__5002__auto__ = frontend.state.get_current_page();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return clojure.string.lower_case(frontend.date.journal_name.cljs$core$IFn$_invoke$arity$0());
}
})()),(function (page){
return promesa.protocols._mcat(promesa.protocols._promise([cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.date.get_date_time_string_2()),".aac"].join('')),(function (filename){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.get_edit_block()),(function (edit_block){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.get.cljs$core$IFn$_invoke$arity$3(edit_block,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089))),(function (format){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.assets.get_asset_path(filename)),(function (path){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(module$node_modules$$capacitor$filesystem$dist$plugin_cjs.Filesystem.writeFile(cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"data","data",-232669377),database64,new cljs.core.Keyword(null,"path","path",-188191168),path,new cljs.core.Keyword(null,"recursive","recursive",718885872),true], null))),(function (error){
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.mobile.record",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("file","write-failed","file/write-failed",-229053199),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"path","path",-188191168),path,new cljs.core.Keyword(null,"error","error",-978969032),error], null),new cljs.core.Keyword(null,"line","line",212345235),56], null)),null);
}))),(function (_file){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("../assets/%s",filename) : frontend.util.format.call(null,"../assets/%s",filename))),(function (url){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.assets.get_asset_file_link(format,url,filename,true)),(function (file_link){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(cljs.core.truth_(cljs.core.parse_uuid(page))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),cljs.core.uuid(page)], null):new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"page","page",849072397),page], null)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"edit-block?","edit-block?",-310383789),false,new cljs.core.Keyword(null,"replace-empty-target?","replace-empty-target?",-923732440),true], null)], 0))),(function (args){
return promesa.protocols._promise((cljs.core.truth_(edit_block)?frontend.handler.editor.insert.cljs$core$IFn$_invoke$arity$1(file_link):frontend.handler.editor.api_insert_new_block_BANG_(file_link,args)));
}));
}));
}));
}));
}));
}));
}));
}));
}));
}));
});
frontend.mobile.record.stop_recording = (function frontend$mobile$record$stop_recording(){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(module$node_modules$capacitor_voice_recorder$dist$plugin_cjs.VoiceRecorder.stopRecording(),(function (result){
var value = result.value;
var map__130706 = cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(value,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
var map__130706__$1 = cljs.core.__destructure_map(map__130706);
var _msDuration = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130706__$1,new cljs.core.Keyword(null,"_msDuration","_msDuration",-2088496118));
var recordDataBase64 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130706__$1,new cljs.core.Keyword(null,"recordDataBase64","recordDataBase64",-1094381034));
var _mimeType = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130706__$1,new cljs.core.Keyword(null,"_mimeType","_mimeType",1358086728));
frontend.mobile.record.set_recording_state();

if(typeof recordDataBase64 === 'string'){
frontend.mobile.record.embed_audio(recordDataBase64);

return console.log("Stop recording...");
} else {
return null;
}
})),(function (error){
return console.error(error);
}));
});

//# sourceMappingURL=frontend.mobile.record.js.map
