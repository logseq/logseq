goog.provide('hickory.utils');
/**
 * Elements that don't have a meaningful <tag></tag> form.
 */
hickory.utils.void_element = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 16, [new cljs.core.Keyword(null,"hr","hr",1377740067),null,new cljs.core.Keyword(null,"meta","meta",1499536964),null,new cljs.core.Keyword(null,"wbr","wbr",228661800),null,new cljs.core.Keyword(null,"command","command",-894540724),null,new cljs.core.Keyword(null,"source","source",-433931539),null,new cljs.core.Keyword(null,"param","param",2013631823),null,new cljs.core.Keyword(null,"link","link",-1769163468),null,new cljs.core.Keyword(null,"col","col",-1959363084),null,new cljs.core.Keyword(null,"area","area",472007256),null,new cljs.core.Keyword(null,"br","br",934104792),null,new cljs.core.Keyword(null,"input","input",556931961),null,new cljs.core.Keyword(null,"base","base",185279322),null,new cljs.core.Keyword(null,"embed","embed",-1354913349),null,new cljs.core.Keyword(null,"keygen","keygen",-571693253),null,new cljs.core.Keyword(null,"img","img",1442687358),null,new cljs.core.Keyword(null,"track","track",195787487),null], null), null);
/**
 * Elements whose content should never have html-escape codes.
 */
hickory.utils.unescapable_content = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"script","script",-1304443801),null,new cljs.core.Keyword(null,"style","style",-496642736),null], null), null);
hickory.utils.html_escape = (function hickory$utils$html_escape(s){
return goog.string.htmlEscape(s);
});
hickory.utils.starts_with = (function hickory$utils$starts_with(s,prefix){
return goog.string.startsWith(s,prefix);
});
/**
 * Converts its string argument into a lowercase keyword.
 */
hickory.utils.lower_case_keyword = (function hickory$utils$lower_case_keyword(s){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(clojure.string.lower_case(s));
});
/**
 * Returns a string containing the HTML source for the doctype with given args.
 * The second and third arguments can be nil or empty strings.
 */
hickory.utils.render_doctype = (function hickory$utils$render_doctype(name,publicid,systemid){
return ["<!DOCTYPE ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(name),(cljs.core.truth_(cljs.core.not_empty(publicid))?[" PUBLIC \"",cljs.core.str.cljs$core$IFn$_invoke$arity$1(publicid),"\""].join(''):null),(cljs.core.truth_(cljs.core.not_empty(systemid))?[" \"",cljs.core.str.cljs$core$IFn$_invoke$arity$1(systemid),"\""].join(''):null),">"].join('');
});

//# sourceMappingURL=hickory.utils.js.map
