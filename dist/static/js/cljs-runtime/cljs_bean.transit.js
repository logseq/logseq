goog.provide('cljs_bean.transit');
cljs_bean.transit.make_handlers = (function cljs_bean$transit$make_handlers(){
if((typeof cognitect !== 'undefined') && (typeof cognitect.transit !== 'undefined') && (typeof cognitect.transit.__GT_MapHandler !== 'undefined')){
var map_handler = cognitect.transit.__GT_MapHandler();
var list_handler = cognitect.transit.__GT_ListHandler();
var vector_handler = cognitect.transit.__GT_VectorHandler();
return cljs.core.PersistentArrayMap.createAsIfByAssoc([cljs.core.deref(new cljs.core.Var(function(){return cljs_bean.core.Bean;},new cljs.core.Symbol("cljs-bean.core","Bean","cljs-bean.core/Bean",-1835165970,null),cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"ns","ns",441598760),new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword(null,"file","file",-1269645878),new cljs.core.Keyword(null,"end-column","end-column",1425389514),new cljs.core.Keyword(null,"column","column",2078222095),new cljs.core.Keyword(null,"line","line",212345235),new cljs.core.Keyword(null,"declared","declared",92336021),new cljs.core.Keyword(null,"end-line","end-line",1837326455),new cljs.core.Keyword(null,"arglists","arglists",1661989754),new cljs.core.Keyword(null,"doc","doc",1913296891),new cljs.core.Keyword(null,"test","test",577538877)],[new cljs.core.Symbol(null,"cljs-bean.core","cljs-bean.core",-1757839487,null),new cljs.core.Symbol(null,"Bean","Bean",300060776,null),"cljs_bean/core.cljs",14,20,222,true,6,cljs.core.List.EMPTY,null,(cljs.core.truth_(cljs_bean.core.Bean)?cljs_bean.core.Bean.cljs$lang$test:null)]))),map_handler,cljs.core.deref(new cljs.core.Var(function(){return cljs_bean.core.BeanSeq;},new cljs.core.Symbol("cljs-bean.core","BeanSeq","cljs-bean.core/BeanSeq",2057281662,null),new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"ns","ns",441598760),new cljs.core.Symbol(null,"cljs-bean.core","cljs-bean.core",-1757839487,null),new cljs.core.Keyword(null,"doc","doc",1913296891),null,new cljs.core.Keyword(null,"file","file",-1269645878),"cljs_bean/core.cljs",new cljs.core.Keyword(null,"line","line",212345235),141,new cljs.core.Keyword(null,"column","column",2078222095),20,new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Symbol(null,"BeanSeq","BeanSeq",-168909320,null),new cljs.core.Keyword(null,"test","test",577538877),(cljs.core.truth_(cljs_bean.core.BeanSeq)?cljs_bean.core.BeanSeq.cljs$lang$test:null),new cljs.core.Keyword(null,"arglists","arglists",1661989754),cljs.core.List.EMPTY], null))),list_handler,cljs.core.deref(new cljs.core.Var(function(){return cljs_bean.core.ArrayVector;},new cljs.core.Symbol("cljs-bean.core","ArrayVector","cljs-bean.core/ArrayVector",235988001,null),cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"ns","ns",441598760),new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword(null,"file","file",-1269645878),new cljs.core.Keyword(null,"end-column","end-column",1425389514),new cljs.core.Keyword(null,"column","column",2078222095),new cljs.core.Keyword(null,"line","line",212345235),new cljs.core.Keyword(null,"declared","declared",92336021),new cljs.core.Keyword(null,"end-line","end-line",1837326455),new cljs.core.Keyword(null,"arglists","arglists",1661989754),new cljs.core.Keyword(null,"doc","doc",1913296891),new cljs.core.Keyword(null,"test","test",577538877)],[new cljs.core.Symbol(null,"cljs-bean.core","cljs-bean.core",-1757839487,null),new cljs.core.Symbol(null,"ArrayVector","ArrayVector",-2096897117,null),"cljs_bean/core.cljs",21,20,531,true,7,cljs.core.List.EMPTY,null,(cljs.core.truth_(cljs_bean.core.ArrayVector)?cljs_bean.core.ArrayVector.cljs$lang$test:null)]))),vector_handler,cljs.core.deref(new cljs.core.Var(function(){return cljs_bean.core.ArrayVectorSeq;},new cljs.core.Symbol("cljs-bean.core","ArrayVectorSeq","cljs-bean.core/ArrayVectorSeq",1164588861,null),new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"ns","ns",441598760),new cljs.core.Symbol(null,"cljs-bean.core","cljs-bean.core",-1757839487,null),new cljs.core.Keyword(null,"doc","doc",1913296891),null,new cljs.core.Keyword(null,"file","file",-1269645878),"cljs_bean/core.cljs",new cljs.core.Keyword(null,"line","line",212345235),450,new cljs.core.Keyword(null,"column","column",2078222095),20,new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Symbol(null,"ArrayVectorSeq","ArrayVectorSeq",-937866817,null),new cljs.core.Keyword(null,"test","test",577538877),(cljs.core.truth_(cljs_bean.core.ArrayVectorSeq)?cljs_bean.core.ArrayVectorSeq.cljs$lang$test:null),new cljs.core.Keyword(null,"arglists","arglists",1661989754),cljs.core.List.EMPTY], null))),list_handler]);
} else {
return null;
}
});
var handlers_62104 = cljs.core.volatile_BANG_(null);
cljs_bean.transit.get_handlers = (function cljs_bean$transit$get_handlers(){
var temp__5806__auto__ = cljs.core.deref(handlers_62104);
if((temp__5806__auto__ == null)){
return cljs.core.vreset_BANG_(handlers_62104,cljs_bean.transit.make_handlers());
} else {
var h = temp__5806__auto__;
return h;
}
});
/**
 * Returns a map of handlers for use with cognitect.transit/writer which
 *   enables marshalling CLJS Bean types to Transit data. If cognitect.transit has
 *   not been required, returns nil.
 */
cljs_bean.transit.writer_handlers = (function cljs_bean$transit$writer_handlers(){
return cljs_bean.transit.get_handlers();
});

//# sourceMappingURL=cljs_bean.transit.js.map
