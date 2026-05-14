goog.provide('frontend.format');
if((typeof frontend !== 'undefined') && (typeof frontend.format !== 'undefined') && (typeof frontend.format.mldoc_record !== 'undefined')){
} else {
frontend.format.mldoc_record = frontend.format.mldoc.__GT_MldocMode();
}
frontend.format.get_format_record = (function frontend$format$get_format_record(format){
var G__62217 = logseq.common.util.normalize_format(format);
var G__62217__$1 = (((G__62217 instanceof cljs.core.Keyword))?G__62217.fqn:null);
switch (G__62217__$1) {
case "org":
return frontend.format.mldoc_record;

break;
case "markdown":
return frontend.format.mldoc_record;

break;
default:
return null;

}
});
frontend.format.to_html = (function frontend$format$to_html(content,format,config){
if(clojure.string.blank_QMARK_(content)){
return "";
} else {
var temp__5802__auto__ = frontend.format.get_format_record(format);
if(cljs.core.truth_(temp__5802__auto__)){
var record = temp__5802__auto__;
return frontend.format.protocol.toHtml(record,content,config,logseq.graph_parser.mldoc.default_references);
} else {
return content;
}
}
});
frontend.format.to_edn = (function frontend$format$to_edn(content,format,config){
var temp__5802__auto__ = frontend.format.get_format_record(format);
if(cljs.core.truth_(temp__5802__auto__)){
var record = temp__5802__auto__;
return frontend.format.protocol.toEdn(record,content,config);
} else {
return null;
}
});

//# sourceMappingURL=frontend.format.js.map
