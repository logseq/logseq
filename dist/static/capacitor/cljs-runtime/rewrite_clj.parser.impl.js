goog.provide('rewrite_clj.parser.impl');
/**
 * INTERNAL. Flush buffer and add string to the given vector.
 */
rewrite_clj.parser.impl.flush_into = (function rewrite_clj$parser$impl$flush_into(lines,buf){
var s = buf.toString();
buf.clear();

return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(lines,s);
});
/**
 * INTERNAL.
 */
rewrite_clj.parser.impl.read_string_data = (function rewrite_clj$parser$impl$read_string_data(reader){
rewrite_clj.reader.ignore(reader);

var buf = (new goog.string.StringBuffer());
var escape_QMARK_ = false;
var lines = cljs.core.PersistentVector.EMPTY;
while(true){
var temp__5802__auto__ = rewrite_clj.reader.next(reader);
if(cljs.core.truth_(temp__5802__auto__)){
var c = temp__5802__auto__;
if(((cljs.core.not(escape_QMARK_)) && ((c === "\"")))){
return rewrite_clj.parser.impl.flush_into(lines,buf);
} else {
if((c === "\n")){
var G__65218 = escape_QMARK_;
var G__65219 = rewrite_clj.parser.impl.flush_into(lines,buf);
escape_QMARK_ = G__65218;
lines = G__65219;
continue;
} else {
buf.append(c);

var G__65220 = ((cljs.core.not(escape_QMARK_)) && ((c === "\\")));
var G__65221 = lines;
escape_QMARK_ = G__65220;
lines = G__65221;
continue;

}
}
} else {
return rewrite_clj.reader.throw_reader(reader,"Unexpected EOF while reading string.");
}
break;
}
});

//# sourceMappingURL=rewrite_clj.parser.impl.js.map
