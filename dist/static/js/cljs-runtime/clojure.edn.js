goog.provide('clojure.edn');
/**
 * Reads the first object from an cljs.tools.reader.reader-types/IPushbackReader.
 * Returns the object read. If EOF, throws if eof-error? is true otherwise returns eof.
 * If no reader is provided, *in* will be used.
 * 
 * Reads data in the edn format (subset of Clojure data):
 * http://edn-format.org
 * 
 * cljs.tools.reader.edn/read doesn't depend on dynamic Vars, all configuration
 * is done by passing an opt map.
 * 
 * opts is a map that can include the following keys:
 * :eof - value to return on end-of-file. When not supplied, eof throws an exception.
 * :readers  - a map of tag symbols to data-reader functions to be considered before default-data-readers.
 *            When not supplied, only the default-data-readers will be used.
 * :default - A function of two args, that will, if present and no reader is found for a tag,
 *            be called with the tag and the value.
 */
clojure.edn.read = (function clojure$edn$read(var_args){
var G__50676 = arguments.length;
switch (G__50676) {
case 1:
return clojure.edn.read.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return clojure.edn.read.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 4:
return clojure.edn.read.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(clojure.edn.read.cljs$core$IFn$_invoke$arity$1 = (function (reader){
return cljs.reader.read.cljs$core$IFn$_invoke$arity$1(reader);
}));

(clojure.edn.read.cljs$core$IFn$_invoke$arity$2 = (function (opts,reader){
return cljs.reader.read.cljs$core$IFn$_invoke$arity$2(opts,reader);
}));

(clojure.edn.read.cljs$core$IFn$_invoke$arity$4 = (function (reader,eof_error_QMARK_,eof,opts){
return cljs.reader.read.cljs$core$IFn$_invoke$arity$4(reader,eof_error_QMARK_,eof,opts);
}));

(clojure.edn.read.cljs$lang$maxFixedArity = 4);

/**
 * Reads one object from the string s.
 * Returns nil when s is nil or empty.
 * 
 * Reads data in the edn format (subset of Clojure data):
 * http://edn-format.org
 * 
 * opts is a map as per cljs.tools.reader.edn/read
 */
clojure.edn.read_string = (function clojure$edn$read_string(var_args){
var G__50680 = arguments.length;
switch (G__50680) {
case 1:
return clojure.edn.read_string.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return clojure.edn.read_string.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(clojure.edn.read_string.cljs$core$IFn$_invoke$arity$1 = (function (s){
return cljs.reader.read_string.cljs$core$IFn$_invoke$arity$1(s);
}));

(clojure.edn.read_string.cljs$core$IFn$_invoke$arity$2 = (function (opts,s){
return cljs.reader.read_string.cljs$core$IFn$_invoke$arity$2(opts,s);
}));

(clojure.edn.read_string.cljs$lang$maxFixedArity = 2);


//# sourceMappingURL=clojure.edn.js.map
