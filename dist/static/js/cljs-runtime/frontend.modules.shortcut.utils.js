goog.provide('frontend.modules.shortcut.utils');
frontend.modules.shortcut.utils.safe_parse_string_binding = (function frontend$modules$shortcut$utils$safe_parse_string_binding(binding){
try{return goog.ui.KeyboardShortcutHandler.parseStringShortcut(binding);
}catch (e100698){if((e100698 instanceof Error)){
var e = e100698;
console.warn("[shortcuts] parse key error: ",e);

return binding;
} else {
throw e100698;

}
}});
frontend.modules.shortcut.utils.mod_key = (function frontend$modules$shortcut$utils$mod_key(binding){
return clojure.string.replace(binding,/mod/i,(cljs.core.truth_(frontend.util.mac_QMARK_)?"meta":"ctrl"));
});
frontend.modules.shortcut.utils.undecorate_binding = (function frontend$modules$shortcut$utils$undecorate_binding(binding){
if(typeof binding === 'string'){
var keynames = cljs.core.PersistentHashMap.fromArrays(["]","\u2193","'",")","=","\u2192","~","\u2190","-","(","\u21E7","\u2191",";","["],["close-square-bracket","down","single-quote","shift+0","equals","right","shift+`","left","dash","shift+9","shift","up","semicolon","open-square-bracket"]);
return clojure.string.lower_case(frontend.modules.shortcut.utils.mod_key(clojure.string.replace(clojure.string.replace(binding,/[;=-\[\]'\(\)\~\→\←\⇧]/,(function (p1__100704_SHARP_){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(keynames,p1__100704_SHARP_);
})),/\s+/," ")));
} else {
return null;
}
});
frontend.modules.shortcut.utils.decorate_namespace = (function frontend$modules$shortcut$utils$decorate_namespace(k){
var n = cljs.core.name(k);
var ns = cljs.core.namespace(k);
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$2(["command.",ns].join(''),n);
});
frontend.modules.shortcut.utils.decorate_binding = (function frontend$modules$shortcut$utils$decorate_binding(binding){
if(((typeof binding === 'string') || (cljs.core.sequential_QMARK_(binding)))){
return clojure.string.lower_case(clojure.string.replace(clojure.string.replace(clojure.string.replace(clojure.string.replace(clojure.string.replace(clojure.string.replace(clojure.string.replace(clojure.string.replace(clojure.string.replace(clojure.string.replace(clojure.string.replace(clojure.string.replace(clojure.string.replace(((typeof binding === 'string')?binding:clojure.string.join.cljs$core$IFn$_invoke$arity$2("+",binding)),"mod",(cljs.core.truth_(frontend.util.mac_QMARK_)?"\u2318":"ctrl")),"meta",(cljs.core.truth_(frontend.util.mac_QMARK_)?"\u2318":"\u229E win")),"alt",(cljs.core.truth_(frontend.util.mac_QMARK_)?"opt":"alt")),"shift+/","?"),"left","\u2190"),"right","\u2192"),"up","\u2191"),"down","\u2193"),"shift","\u21E7"),"open-square-bracket","["),"close-square-bracket","]"),"equals","="),"semicolon",";"));
} else {
return null;
}
});

//# sourceMappingURL=frontend.modules.shortcut.utils.js.map
