goog.provide('shadow.remote.runtime.writer');

/**
* @constructor
 * @implements {cljs.core.IWriter}
*/
shadow.remote.runtime.writer.LimitWriter = (function (sb,limit){
this.sb = sb;
this.limit = limit;
this.cljs$lang$protocol_mask$partition0$ = 1073741824;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(shadow.remote.runtime.writer.LimitWriter.prototype.getString = (function (){
var self__ = this;
var this$ = this;
return self__.sb.toString();
}));

(shadow.remote.runtime.writer.LimitWriter.prototype.cljs$core$IWriter$_write$arity$2 = (function (_,s){
var self__ = this;
var ___$1 = this;
self__.sb.append(s);

if((self__.sb.getLength() >= self__.limit)){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["The limit of ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(self__.limit)," bytes was reached while printing."].join(''),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Keyword("shadow.remote.runtime.writer","limit-reached","shadow.remote.runtime.writer/limit-reached",1304350996),new cljs.core.Keyword(null,"limit","limit",-1355822363),self__.limit], null));
} else {
return null;
}
}));

(shadow.remote.runtime.writer.LimitWriter.prototype.cljs$core$IWriter$_flush$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return null;
}));

(shadow.remote.runtime.writer.LimitWriter.getBasis = (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.with_meta(new cljs.core.Symbol(null,"sb","sb",-1249746442,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"StringBuffer","StringBuffer",864531538,null)], null)),new cljs.core.Symbol(null,"limit","limit",284709164,null)], null);
}));

(shadow.remote.runtime.writer.LimitWriter.cljs$lang$type = true);

(shadow.remote.runtime.writer.LimitWriter.cljs$lang$ctorStr = "shadow.remote.runtime.writer/LimitWriter");

(shadow.remote.runtime.writer.LimitWriter.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"shadow.remote.runtime.writer/LimitWriter");
}));

/**
 * Positional factory function for shadow.remote.runtime.writer/LimitWriter.
 */
shadow.remote.runtime.writer.__GT_LimitWriter = (function shadow$remote$runtime$writer$__GT_LimitWriter(sb,limit){
return (new shadow.remote.runtime.writer.LimitWriter(sb,limit));
});

shadow.remote.runtime.writer.pr_str_limit = (function shadow$remote$runtime$writer$pr_str_limit(obj,limit){
var sb = (new goog.string.StringBuffer());
var writer = (new shadow.remote.runtime.writer.LimitWriter(sb,limit));
try{cljs.core.pr_writer(obj,writer,cljs.core.pr_opts());

return ["0,",cljs.core.str.cljs$core$IFn$_invoke$arity$1(sb.toString())].join('');
}catch (e38135){var e = e38135;
if((!(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("shadow.remote.runtime.writer","limit-reached","shadow.remote.runtime.writer/limit-reached",1304350996),new cljs.core.Keyword(null,"tag","tag",-1290361223).cljs$core$IFn$_invoke$arity$1(cljs.core.ex_data(e)))))){
throw e;
} else {
return ["1,",cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var s = sb.toString();
if((s.length > limit)){
return cljs.core.subs.cljs$core$IFn$_invoke$arity$3(s,(0),limit);
} else {
return s;
}
})())].join('');
}
}});
shadow.remote.runtime.writer.limit_writer = (function shadow$remote$runtime$writer$limit_writer(limit){
var sb = (new goog.string.StringBuffer());
return (new shadow.remote.runtime.writer.LimitWriter(sb,limit));
});
shadow.remote.runtime.writer.get_string = (function shadow$remote$runtime$writer$get_string(lw){
return lw.getString();
});

//# sourceMappingURL=shadow.remote.runtime.writer.js.map
