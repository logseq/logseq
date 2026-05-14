goog.provide('frontend.handler.common.config_edn');
/**
 * Make error maps from me/humanize more readable for users. Doesn't try to handle
 * nested keys or positional errors e.g. tuples
 */
frontend.handler.common.config_edn.humanize_more = (function frontend$handler$common$config_edn$humanize_more(errors){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__50976){
var vec__50980 = p__50976;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__50980,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__50980,(1),null);
if(cljs.core.map_QMARK_(v)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,["Has errors in the following keys - ",clojure.string.join.cljs$core$IFn$_invoke$arity$2(", ",cljs.core.keys(v))].join('')], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,cljs.core.first(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.flatten(v)))], null);
}
}),errors);
});
frontend.handler.common.config_edn.file_link = (function frontend$handler$common$config_edn$file_link(path){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a","a",-2123407586),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"href","href",-793805698),reitit.frontend.easy.href.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"file","file",-1269645878),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"path","path",-188191168),path], null))], null),path], null);
});
frontend.handler.common.config_edn.error_list = (function frontend$handler$common$config_edn$error_list(errors,class$){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__50987){
var vec__50988 = p__50987;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__50988,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__50988,(1),null);
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"dl.my-2.mb-0","dl.my-2.mb-0",1765111560),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"dt.m-0","dt.m-0",193407064),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong","strong",269529000),cljs.core.str.cljs$core$IFn$_invoke$arity$1(k)], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"dd","dd",-1340437629),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),class$], null),v], null)], null);
}),errors);
});
frontend.handler.common.config_edn.config_notification_show_BANG_ = (function frontend$handler$common$config_edn$config_notification_show_BANG_(var_args){
var G__50994 = arguments.length;
switch (G__50994) {
case 2:
return frontend.handler.common.config_edn.config_notification_show_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.handler.common.config_edn.config_notification_show_BANG_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return frontend.handler.common.config_edn.config_notification_show_BANG_.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.common.config_edn.config_notification_show_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (title,body){
return frontend.handler.common.config_edn.config_notification_show_BANG_.cljs$core$IFn$_invoke$arity$3(title,body,new cljs.core.Keyword(null,"error","error",-978969032));
}));

(frontend.handler.common.config_edn.config_notification_show_BANG_.cljs$core$IFn$_invoke$arity$3 = (function (title,body,status){
return frontend.handler.common.config_edn.config_notification_show_BANG_.cljs$core$IFn$_invoke$arity$4(title,body,status,false);
}));

(frontend.handler.common.config_edn.config_notification_show_BANG_.cljs$core$IFn$_invoke$arity$4 = (function (title,body,status,clear_QMARK_){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,".mb-2",".mb-2",-2014745458),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,".text-lg.mb-2",".text-lg.mb-2",508238774),title], null),body], null),status,clear_QMARK_);
}));

(frontend.handler.common.config_edn.config_notification_show_BANG_.cljs$lang$maxFixedArity = 4);

frontend.handler.common.config_edn.validate_config_map = (function frontend$handler$common$config_edn$validate_config_map(m,schema,path){
var temp__5802__auto__ = malli.error.humanize.cljs$core$IFn$_invoke$arity$1(malli.core.explain.cljs$core$IFn$_invoke$arity$2(schema,m));
if(cljs.core.truth_(temp__5802__auto__)){
var errors = temp__5802__auto__;
frontend.handler.common.config_edn.config_notification_show_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),"The file ",frontend.handler.common.config_edn.file_link(path)," has the following errors:"], null),frontend.handler.common.config_edn.error_list(frontend.handler.common.config_edn.humanize_more(errors),"text-error"));

return false;
} else {
return true;
}
});
/**
 * Validates a global config.edn file for correctness and pops up an error
 *   notification if invalid. Returns a boolean indicating if file is invalid.
 *   Error messages are written with consideration that this validation is called
 *   regardless of whether a file is written outside or inside Logseq.
 */
frontend.handler.common.config_edn.validate_config_edn = (function frontend$handler$common$config_edn$validate_config_edn(path,file_body,schema){
var parsed_body = (function (){try{return clojure.edn.read_string.cljs$core$IFn$_invoke$arity$1(file_body);
}catch (e51003){var x = e51003;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("frontend.handler.common.config-edn","failed-to-read","frontend.handler.common.config-edn/failed-to-read",1623844738),cljs.core.ex_message(x)], null);
}})();
var failed_QMARK_ = ((cljs.core.vector_QMARK_(parsed_body)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("frontend.handler.common.config-edn","failed-to-read","frontend.handler.common.config-edn/failed-to-read",1623844738),cljs.core.first(parsed_body))));
if((parsed_body == null)){
return true;
} else {
if(((failed_QMARK_) && (clojure.string.includes_QMARK_(cljs.core.second(parsed_body),"duplicate key")))){
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(goog.string.format("The file '%s' has duplicate keys. The key '%s' is assigned multiple times.",path,cljs.core.subs.cljs$core$IFn$_invoke$arity$2(cljs.core.second(parsed_body),(36))),new cljs.core.Keyword(null,"error","error",-978969032));

return false;
} else {
if(failed_QMARK_){
frontend.handler.common.config_edn.config_notification_show_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),"Failed to read file ",frontend.handler.common.config_edn.file_link(path)], null),"Make sure your config is wrapped in {}. Also make sure that the characters '( { [' have their corresponding closing character ') } ]'.");

return false;
} else {
if((!(cljs.core.map_QMARK_(parsed_body)))){
frontend.handler.common.config_edn.config_notification_show_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),"The file ",frontend.handler.common.config_edn.file_link(path)," s not valid."], null),"Make sure the config is wrapped in {}.");

return false;
} else {
return frontend.handler.common.config_edn.validate_config_map(parsed_body,schema,path);

}
}
}
}
});
/**
 * Detects config keys that will or have been deprecated
 */
frontend.handler.common.config_edn.detect_deprecations = (function frontend$handler$common$config_edn$detect_deprecations(path,content,p__51019){
var map__51020 = p__51019;
var map__51020__$1 = cljs.core.__destructure_map(map__51020);
var db_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__51020__$1,new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876));
var body = (function (){try{return clojure.edn.read_string.cljs$core$IFn$_invoke$arity$1(content);
}catch (e51021){var _ = e51021;
return new cljs.core.Keyword("frontend.handler.common.config-edn","failed-to-detect","frontend.handler.common.config-edn/failed-to-detect",1751968291);
}})();
var warnings = (function (){var G__51022 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("editor","command-trigger","editor/command-trigger",1018337295),"is no longer supported. Please use '/' and report bugs on it.",new cljs.core.Keyword("arweave","gateway","arweave/gateway",-473231712),"is no longer supported."], null);
if(cljs.core.truth_(db_graph_QMARK_)){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__51022,logseq.common.config.file_only_config], 0));
} else {
return G__51022;
}
})();
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(body,new cljs.core.Keyword("frontend.handler.common.config-edn","failed-to-detect","frontend.handler.common.config-edn/failed-to-detect",1751968291))){
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.handler.common.config-edn",new cljs.core.Keyword(null,"info","info",-317069002),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"msg","msg",-1386103444),"Skip deprecation check since config is not valid edn",new cljs.core.Keyword(null,"line","line",212345235),105], null)),null);
} else {
if((!(cljs.core.map_QMARK_(body)))){
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.handler.common.config-edn",new cljs.core.Keyword(null,"info","info",-317069002),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"msg","msg",-1386103444),"Skip deprecation check since config is not a map",new cljs.core.Keyword(null,"line","line",212345235),108], null)),null);
} else {
var temp__5804__auto__ = cljs.core.seq(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p1__51018_SHARP_){
if(cljs.core.truth_((function (){var G__51030 = cljs.core.key(p1__51018_SHARP_);
return (body.cljs$core$IFn$_invoke$arity$1 ? body.cljs$core$IFn$_invoke$arity$1(G__51030) : body.call(null,G__51030));
})())){
return p1__51018_SHARP_;
} else {
return null;
}
}),warnings));
if(temp__5804__auto__){
var deprecations = temp__5804__auto__;
return frontend.handler.common.config_edn.config_notification_show_BANG_.cljs$core$IFn$_invoke$arity$4(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),"The file ",frontend.handler.common.config_edn.file_link(path)," has the following deprecations:"], null),frontend.handler.common.config_edn.error_list(deprecations,"text-warning"),new cljs.core.Keyword(null,"warning","warning",-1685650671),false);
} else {
return null;
}

}
}
});

//# sourceMappingURL=frontend.handler.common.config_edn.js.map
