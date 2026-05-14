goog.provide('devtools.hints');
devtools.hints.available_QMARK_ = (function devtools$hints$available_QMARK_(){
return true;
});
devtools.hints._STAR_installed_STAR_ = false;
devtools.hints._STAR_original_global_error_handler_STAR_ = null;
devtools.hints._STAR_original_type_error_prototype_to_string_STAR_ = null;
devtools.hints.processed_errors = cljs.core.volatile_BANG_(null);
devtools.hints.set_processed_errors_BANG_ = (function devtools$hints$set_processed_errors_BANG_(val){
return cljs.core.vreset_BANG_(devtools.hints.processed_errors,val);
});
devtools.hints.get_processed_errors_BANG_ = (function devtools$hints$get_processed_errors_BANG_(){
var temp__5802__auto__ = cljs.core.deref(devtools.hints.processed_errors);
if(cljs.core.truth_(temp__5802__auto__)){
var val = temp__5802__auto__;
return val;
} else {
if((typeof WeakSet !== 'undefined')){
return devtools.hints.set_processed_errors_BANG_((new WeakSet()));
} else {
return null;
}
}
});
devtools.hints.empty_as_nil = (function devtools$hints$empty_as_nil(str){
if(cljs.core.empty_QMARK_(str)){
return null;
} else {
return str;
}
});
devtools.hints.ajax_reader = (function devtools$hints$ajax_reader(url){
var xhr = (new XMLHttpRequest());
xhr.open("GET",url,false);

xhr.send();

return devtools.hints.empty_as_nil(xhr.responseText);
});
devtools.hints.retrieve_javascript_source = (function devtools$hints$retrieve_javascript_source(where){
var reader = (function (){var or__5002__auto__ = devtools.prefs.pref(new cljs.core.Keyword(null,"file-reader","file-reader",-450847664));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return devtools.hints.ajax_reader;
}
})();
return (reader.cljs$core$IFn$_invoke$arity$1 ? reader.cljs$core$IFn$_invoke$arity$1(where) : reader.call(null,where));
});
devtools.hints.get_line = (function devtools$hints$get_line(lines,line_number){
return (lines[(line_number - (1))]);
});
devtools.hints.extend_content = (function devtools$hints$extend_content(content,lines,line_number,min_length){
if((((cljs.core.count(content) > min_length)) || ((!((line_number > (0))))))){
return content;
} else {
var prev_line_number = (line_number - (1));
var prev_line = devtools.hints.get_line(lines,prev_line_number);
var new_content = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(prev_line),"\n",cljs.core.str.cljs$core$IFn$_invoke$arity$1(content)].join('');
return (devtools.hints.extend_content.cljs$core$IFn$_invoke$arity$4 ? devtools.hints.extend_content.cljs$core$IFn$_invoke$arity$4(new_content,lines,prev_line_number,min_length) : devtools.hints.extend_content.call(null,new_content,lines,prev_line_number,min_length));
}
});
devtools.hints.mark_call_closed_at_column = (function devtools$hints$mark_call_closed_at_column(line,column){
var n = (column - (1));
var prefix = line.substring((0),n);
var postfix = line.substring(n);
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(prefix)," <<< \u2622 NULL \u2622 <<< ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(postfix)].join('');
});
devtools.hints.mark_null_call_site_location = (function devtools$hints$mark_null_call_site_location(file,line_number,column){
var content = devtools.hints.retrieve_javascript_source(file);
var lines = content.split("\n");
var line = devtools.hints.get_line(lines,line_number);
var marked_line = devtools.hints.mark_call_closed_at_column(line,column);
var min_length = (function (){var or__5002__auto__ = devtools.prefs.pref(new cljs.core.Keyword(null,"sanity-hint-min-length","sanity-hint-min-length",104958154));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (128);
}
})();
return devtools.hints.extend_content(marked_line,lines,line_number,min_length);
});
devtools.hints.make_sense_of_the_error = (function devtools$hints$make_sense_of_the_error(message,file,line_number,column){
if(cljs.core.truth_(cljs.core.re_matches(/Cannot read property 'call' of.*/,message))){
return devtools.hints.mark_null_call_site_location(file,line_number,column);
} else {
return null;

}
});
devtools.hints.parse_stacktrace = (function devtools$hints$parse_stacktrace(native_stack_trace){
return cljs.stacktrace.parse_stacktrace.cljs$core$IFn$_invoke$arity$4(cljs.core.PersistentArrayMap.EMPTY,native_stack_trace,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"ua-product","ua-product",938384227),new cljs.core.Keyword(null,"chrome","chrome",1718738387)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"asset-root","asset-root",1771735072),""], null));
});
devtools.hints.error_object_sense = (function devtools$hints$error_object_sense(error){
try{var native_stack_trace = error.stack;
var stack_trace = devtools.hints.parse_stacktrace(native_stack_trace);
var top_item = cljs.core.second(stack_trace);
var map__33312 = top_item;
var map__33312__$1 = cljs.core.__destructure_map(map__33312);
var file = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__33312__$1,new cljs.core.Keyword(null,"file","file",-1269645878));
var line = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__33312__$1,new cljs.core.Keyword(null,"line","line",212345235));
var column = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__33312__$1,new cljs.core.Keyword(null,"column","column",2078222095));
return devtools.hints.make_sense_of_the_error(error.message,file,line,column);
}catch (e33311){var _e = e33311;
return false;
}});
devtools.hints.type_error_to_string = (function devtools$hints$type_error_to_string(self){
var temp__5802__auto___33389 = devtools.hints.get_processed_errors_BANG_();
if(cljs.core.truth_(temp__5802__auto___33389)){
var seen_errors_33392 = temp__5802__auto___33389;
if(cljs.core.truth_(seen_errors_33392.has(self))){
} else {
seen_errors_33392.add(self);

var temp__5804__auto___33393 = devtools.hints.error_object_sense(self);
if(cljs.core.truth_(temp__5804__auto___33393)){
var sense_33396 = temp__5804__auto___33393;
(self.message = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(self.message),", a sanity hint:\n",cljs.core.str.cljs$core$IFn$_invoke$arity$1(sense_33396)].join(''));
} else {
}
}
} else {
}

return devtools.hints._STAR_original_type_error_prototype_to_string_STAR_.call(self);
});
devtools.hints.global_error_handler = (function devtools$hints$global_error_handler(message,url,line,column,error){
var res = (cljs.core.truth_(devtools.hints._STAR_original_global_error_handler_STAR_)?devtools.hints._STAR_original_global_error_handler_STAR_.call(null,message,url,line,column,error):null);
if(cljs.core.not(res)){
var temp__5804__auto__ = devtools.hints.error_object_sense(error);
if(cljs.core.truth_(temp__5804__auto__)){
var sense = temp__5804__auto__;
devtools.context.get_console.call(null).info("A sanity hint for incoming uncaught error:\n",sense);

return false;
} else {
return null;
}
} else {
return true;
}
});
devtools.hints.install_type_error_enhancer = (function devtools$hints$install_type_error_enhancer(){
(devtools.hints._STAR_original_global_error_handler_STAR_ = devtools.context.get_root.call(null).onerror);

(devtools.context.get_root.call(null).onerror = devtools.hints.global_error_handler);

var prototype = TypeError.prototype;
(devtools.hints._STAR_original_type_error_prototype_to_string_STAR_ = prototype.toString);

return (prototype.toString = (function (){
var self = this;
return devtools.hints.type_error_to_string(self);
}));
});
devtools.hints.installed_QMARK_ = (function devtools$hints$installed_QMARK_(){
return devtools.hints._STAR_installed_STAR_;
});
devtools.hints.install_BANG_ = (function devtools$hints$install_BANG_(){
if(cljs.core.truth_(devtools.hints._STAR_installed_STAR_)){
return null;
} else {
(devtools.hints._STAR_installed_STAR_ = true);

devtools.hints.install_type_error_enhancer();

return true;
}
});
devtools.hints.uninstall_BANG_ = (function devtools$hints$uninstall_BANG_(){
if(cljs.core.truth_(devtools.hints._STAR_installed_STAR_)){
(devtools.hints._STAR_installed_STAR_ = false);

if(cljs.core.truth_(devtools.hints._STAR_original_type_error_prototype_to_string_STAR_)){
} else {
throw (new Error("Assert failed: *original-type-error-prototype-to-string*"));
}

(devtools.context.get_root.call(null).onerror = devtools.hints._STAR_original_global_error_handler_STAR_);

var prototype = TypeError.prototype;
return (prototype.toString = devtools.hints._STAR_original_type_error_prototype_to_string_STAR_);
} else {
return null;
}
});

//# sourceMappingURL=devtools.hints.js.map
