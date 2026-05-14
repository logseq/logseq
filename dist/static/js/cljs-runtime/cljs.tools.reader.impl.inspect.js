goog.provide('cljs.tools.reader.impl.inspect');
cljs.tools.reader.impl.inspect.inspect_STAR__col = (function cljs$tools$reader$impl$inspect$inspect_STAR__col(truncate,col,start,end){
var n = cljs.core.count(col);
var l = (cljs.core.truth_(truncate)?(0):(function (){var x__5090__auto__ = (10);
var y__5091__auto__ = n;
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})());
var elements = cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.partial.cljs$core$IFn$_invoke$arity$2(cljs.tools.reader.impl.inspect.inspect_STAR_,true),cljs.core.take.cljs$core$IFn$_invoke$arity$2(l,col));
var content = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,cljs.core.interpose.cljs$core$IFn$_invoke$arity$2(" ",elements));
var suffix = (((l < n))?"...":null);
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(start),cljs.core.str.cljs$core$IFn$_invoke$arity$1(content),suffix,cljs.core.str.cljs$core$IFn$_invoke$arity$1(end)].join('');
});
cljs.tools.reader.impl.inspect.dispatch_inspect = (function cljs$tools$reader$impl$inspect$dispatch_inspect(_,x){
if((x == null)){
return new cljs.core.Keyword(null,"nil","nil",99600501);
} else {
if(typeof x === 'string'){
return new cljs.core.Keyword(null,"string","string",-1989541586);
} else {
if((x instanceof cljs.core.Keyword)){
return new cljs.core.Keyword(null,"strable","strable",1877668047);
} else {
if(typeof x === 'number'){
return new cljs.core.Keyword(null,"strable","strable",1877668047);
} else {
if((x instanceof cljs.core.Symbol)){
return new cljs.core.Keyword(null,"strable","strable",1877668047);
} else {
if(cljs.core.vector_QMARK_(x)){
return new cljs.core.Keyword(null,"vector","vector",1902966158);
} else {
if(cljs.core.list_QMARK_(x)){
return new cljs.core.Keyword(null,"list","list",765357683);
} else {
if(cljs.core.map_QMARK_(x)){
return new cljs.core.Keyword(null,"map","map",1371690461);
} else {
if(cljs.core.set_QMARK_(x)){
return new cljs.core.Keyword(null,"set","set",304602554);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(x,true)){
return new cljs.core.Keyword(null,"strable","strable",1877668047);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(x,false)){
return new cljs.core.Keyword(null,"strable","strable",1877668047);
} else {
return cljs.core.type(x);

}
}
}
}
}
}
}
}
}
}
}
});
if((typeof cljs !== 'undefined') && (typeof cljs.tools !== 'undefined') && (typeof cljs.tools.reader !== 'undefined') && (typeof cljs.tools.reader.impl !== 'undefined') && (typeof cljs.tools.reader.impl.inspect !== 'undefined') && (typeof cljs.tools.reader.impl.inspect.inspect_STAR_ !== 'undefined')){
} else {
cljs.tools.reader.impl.inspect.inspect_STAR_ = (function (){var method_table__5599__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var prefer_table__5600__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var method_cache__5601__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var cached_hierarchy__5602__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var hierarchy__5603__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),(function (){var fexpr__41163 = cljs.core.get_global_hierarchy;
return (fexpr__41163.cljs$core$IFn$_invoke$arity$0 ? fexpr__41163.cljs$core$IFn$_invoke$arity$0() : fexpr__41163.call(null));
})());
return (new cljs.core.MultiFn(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("cljs.tools.reader.impl.inspect","inspect*"),cljs.tools.reader.impl.inspect.dispatch_inspect,new cljs.core.Keyword(null,"default","default",-1987822328),hierarchy__5603__auto__,method_table__5599__auto__,prefer_table__5600__auto__,method_cache__5601__auto__,cached_hierarchy__5602__auto__));
})();
}
cljs.tools.reader.impl.inspect.inspect_STAR_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"string","string",-1989541586),(function (truncate,x){
var n = (cljs.core.truth_(truncate)?(5):(20));
var suffix = (((x.length > n))?"...\"":"\"");
return ["\"",cljs.core.str.cljs$core$IFn$_invoke$arity$1(x.substring((0),(function (){var x__5090__auto__ = n;
var y__5091__auto__ = x.length;
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})())),suffix].join('');
}));
cljs.tools.reader.impl.inspect.inspect_STAR_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"strable","strable",1877668047),(function (truncate,x){
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(x);
}));
cljs.tools.reader.impl.inspect.inspect_STAR_.cljs$core$IMultiFn$_add_method$arity$3(null,cljs.core.IndexedSeq,(function (truncate,x){
return "<indexed seq>";
}));
cljs.tools.reader.impl.inspect.inspect_STAR_.cljs$core$IMultiFn$_add_method$arity$3(null,cljs.core.PersistentArrayMapSeq,(function (truncate,x){
return "<map seq>";
}));
cljs.tools.reader.impl.inspect.inspect_STAR_.cljs$core$IMultiFn$_add_method$arity$3(null,cljs.core.NodeSeq,(function (truncate,x){
return "<map seq>";
}));
cljs.tools.reader.impl.inspect.inspect_STAR_.cljs$core$IMultiFn$_add_method$arity$3(null,cljs.core.Cons,(function (truncate,x){
return "<cons>";
}));
cljs.tools.reader.impl.inspect.inspect_STAR_.cljs$core$IMultiFn$_add_method$arity$3(null,cljs.core.LazySeq,(function (truncate,x){
return "<lazy seq>";
}));
cljs.tools.reader.impl.inspect.inspect_STAR_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"nil","nil",99600501),(function (_,___$1){
return "nil";
}));
cljs.tools.reader.impl.inspect.inspect_STAR_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"list","list",765357683),(function (truncate,col){
return cljs.tools.reader.impl.inspect.inspect_STAR__col(truncate,col,"(",")");
}));
cljs.tools.reader.impl.inspect.inspect_STAR_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"map","map",1371690461),(function (truncate,m){
var len = cljs.core.count(m);
var n_shown = (cljs.core.truth_(truncate)?(0):len);
var contents = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.concat,cljs.core.take.cljs$core$IFn$_invoke$arity$2(n_shown,m));
var suffix = (((len > n_shown))?"...}":"}");
return cljs.tools.reader.impl.inspect.inspect_STAR__col(truncate,contents,"{",suffix);
}));
cljs.tools.reader.impl.inspect.inspect_STAR_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"set","set",304602554),(function (truncate,col){
return cljs.tools.reader.impl.inspect.inspect_STAR__col(truncate,col,"#{","}");
}));
cljs.tools.reader.impl.inspect.inspect_STAR_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"vector","vector",1902966158),(function (truncate,col){
return cljs.tools.reader.impl.inspect.inspect_STAR__col(truncate,col,"[","]");
}));
cljs.tools.reader.impl.inspect.inspect_STAR_.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"default","default",-1987822328),(function (truncate,x){
return cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.type(x)], 0));
}));
/**
 * Return a string description of the value supplied.
 * May be the a string version of the value itself (e.g. "true")
 * or it may be a description (e.g. "an instance of Foo").
 * If truncate is true then return a very terse version of
 * the inspection.
 */
cljs.tools.reader.impl.inspect.inspect = (function cljs$tools$reader$impl$inspect$inspect(var_args){
var G__41212 = arguments.length;
switch (G__41212) {
case 1:
return cljs.tools.reader.impl.inspect.inspect.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljs.tools.reader.impl.inspect.inspect.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.tools.reader.impl.inspect.inspect.cljs$core$IFn$_invoke$arity$1 = (function (x){
return cljs.tools.reader.impl.inspect.inspect_STAR_.cljs$core$IFn$_invoke$arity$2(false,x);
}));

(cljs.tools.reader.impl.inspect.inspect.cljs$core$IFn$_invoke$arity$2 = (function (truncate,x){
return cljs.tools.reader.impl.inspect.inspect_STAR_.cljs$core$IFn$_invoke$arity$2(truncate,x);
}));

(cljs.tools.reader.impl.inspect.inspect.cljs$lang$maxFixedArity = 2);


//# sourceMappingURL=cljs.tools.reader.impl.inspect.js.map
