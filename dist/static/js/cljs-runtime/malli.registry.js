goog.provide('malli.registry');
/**
 * @define {string}
 */
malli.registry.mode = goog.define("malli.registry.mode","default");
/**
 * @define {string}
 */
malli.registry.type = goog.define("malli.registry.type","default");

/**
 * @interface
 */
malli.registry.Registry = function(){};

var malli$registry$Registry$_schema$dyn_44641 = (function (this$,type){
var x__5350__auto__ = (((this$ == null))?null:this$);
var m__5351__auto__ = (malli.registry._schema[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(this$,type) : m__5351__auto__.call(null,this$,type));
} else {
var m__5349__auto__ = (malli.registry._schema["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(this$,type) : m__5349__auto__.call(null,this$,type));
} else {
throw cljs.core.missing_protocol("Registry.-schema",this$);
}
}
});
/**
 * returns the schema from a registry
 */
malli.registry._schema = (function malli$registry$_schema(this$,type){
if((((!((this$ == null)))) && ((!((this$.malli$registry$Registry$_schema$arity$2 == null)))))){
return this$.malli$registry$Registry$_schema$arity$2(this$,type);
} else {
return malli$registry$Registry$_schema$dyn_44641(this$,type);
}
});

var malli$registry$Registry$_schemas$dyn_44643 = (function (this$){
var x__5350__auto__ = (((this$ == null))?null:this$);
var m__5351__auto__ = (malli.registry._schemas[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(this$) : m__5351__auto__.call(null,this$));
} else {
var m__5349__auto__ = (malli.registry._schemas["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(this$) : m__5349__auto__.call(null,this$));
} else {
throw cljs.core.missing_protocol("Registry.-schemas",this$);
}
}
});
/**
 * returns all schemas from a registry
 */
malli.registry._schemas = (function malli$registry$_schemas(this$){
if((((!((this$ == null)))) && ((!((this$.malli$registry$Registry$_schemas$arity$1 == null)))))){
return this$.malli$registry$Registry$_schemas$arity$1(this$);
} else {
return malli$registry$Registry$_schemas$dyn_44643(this$);
}
});

malli.registry.registry_QMARK_ = (function malli$registry$registry_QMARK_(x){
if((!((x == null)))){
if(((false) || ((cljs.core.PROTOCOL_SENTINEL === x.malli$registry$Registry$)))){
return true;
} else {
return false;
}
} else {
return false;
}
});

/**
* @constructor
 * @implements {malli.registry.Registry}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
malli.registry.t_malli$registry44291 = (function (m,fm,meta44292){
this.m = m;
this.fm = fm;
this.meta44292 = meta44292;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(malli.registry.t_malli$registry44291.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_44293,meta44292__$1){
var self__ = this;
var _44293__$1 = this;
return (new malli.registry.t_malli$registry44291(self__.m,self__.fm,meta44292__$1));
}));

(malli.registry.t_malli$registry44291.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_44293){
var self__ = this;
var _44293__$1 = this;
return self__.meta44292;
}));

(malli.registry.t_malli$registry44291.prototype.malli$registry$Registry$ = cljs.core.PROTOCOL_SENTINEL);

(malli.registry.t_malli$registry44291.prototype.malli$registry$Registry$_schema$arity$2 = (function (_,type){
var self__ = this;
var ___$1 = this;
return self__.fm.get(type);
}));

(malli.registry.t_malli$registry44291.prototype.malli$registry$Registry$_schemas$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return self__.m;
}));

(malli.registry.t_malli$registry44291.getBasis = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"m","m",-1021758608,null),new cljs.core.Symbol(null,"fm","fm",-1190690268,null),new cljs.core.Symbol(null,"meta44292","meta44292",1153992887,null)], null);
}));

(malli.registry.t_malli$registry44291.cljs$lang$type = true);

(malli.registry.t_malli$registry44291.cljs$lang$ctorStr = "malli.registry/t_malli$registry44291");

(malli.registry.t_malli$registry44291.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"malli.registry/t_malli$registry44291");
}));

/**
 * Positional factory function for malli.registry/t_malli$registry44291.
 */
malli.registry.__GT_t_malli$registry44291 = (function malli$registry$__GT_t_malli$registry44291(m,fm,meta44292){
return (new malli.registry.t_malli$registry44291(m,fm,meta44292));
});


malli.registry.fast_registry = (function malli$registry$fast_registry(m){
var fm = m;
return (new malli.registry.t_malli$registry44291(m,fm,cljs.core.PersistentArrayMap.EMPTY));
});

/**
* @constructor
 * @implements {malli.registry.Registry}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
malli.registry.t_malli$registry44377 = (function (m,meta44378){
this.m = m;
this.meta44378 = meta44378;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(malli.registry.t_malli$registry44377.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_44379,meta44378__$1){
var self__ = this;
var _44379__$1 = this;
return (new malli.registry.t_malli$registry44377(self__.m,meta44378__$1));
}));

(malli.registry.t_malli$registry44377.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_44379){
var self__ = this;
var _44379__$1 = this;
return self__.meta44378;
}));

(malli.registry.t_malli$registry44377.prototype.malli$registry$Registry$ = cljs.core.PROTOCOL_SENTINEL);

(malli.registry.t_malli$registry44377.prototype.malli$registry$Registry$_schema$arity$2 = (function (_,type){
var self__ = this;
var ___$1 = this;
return (self__.m.cljs$core$IFn$_invoke$arity$1 ? self__.m.cljs$core$IFn$_invoke$arity$1(type) : self__.m.call(null,type));
}));

(malli.registry.t_malli$registry44377.prototype.malli$registry$Registry$_schemas$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return self__.m;
}));

(malli.registry.t_malli$registry44377.getBasis = (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"m","m",-1021758608,null),new cljs.core.Symbol(null,"meta44378","meta44378",-1556244102,null)], null);
}));

(malli.registry.t_malli$registry44377.cljs$lang$type = true);

(malli.registry.t_malli$registry44377.cljs$lang$ctorStr = "malli.registry/t_malli$registry44377");

(malli.registry.t_malli$registry44377.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"malli.registry/t_malli$registry44377");
}));

/**
 * Positional factory function for malli.registry/t_malli$registry44377.
 */
malli.registry.__GT_t_malli$registry44377 = (function malli$registry$__GT_t_malli$registry44377(m,meta44378){
return (new malli.registry.t_malli$registry44377(m,meta44378));
});


malli.registry.simple_registry = (function malli$registry$simple_registry(m){
return (new malli.registry.t_malli$registry44377(m,cljs.core.PersistentArrayMap.EMPTY));
});
malli.registry.registry = (function malli$registry$registry(_QMARK_registry){
if((_QMARK_registry == null)){
return null;
} else {
if(malli.registry.registry_QMARK_(_QMARK_registry)){
return _QMARK_registry;
} else {
if(cljs.core.map_QMARK_(_QMARK_registry)){
return malli.registry.simple_registry(_QMARK_registry);
} else {
if((((!((_QMARK_registry == null))))?((((false) || ((cljs.core.PROTOCOL_SENTINEL === _QMARK_registry.malli$registry$Registry$))))?true:(((!_QMARK_registry.cljs$lang$protocol_mask$partition$))?cljs.core.native_satisfies_QMARK_(malli.registry.Registry,_QMARK_registry):false)):cljs.core.native_satisfies_QMARK_(malli.registry.Registry,_QMARK_registry))){
return _QMARK_registry;
} else {
return null;
}
}
}
}
});
malli.registry.registry_STAR_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(malli.registry.simple_registry(cljs.core.PersistentArrayMap.EMPTY));
malli.registry.set_default_registry_BANG_ = (function malli$registry$set_default_registry_BANG_(_QMARK_registry){
if((!((malli.registry.mode === "strict")))){
return cljs.core.reset_BANG_(malli.registry.registry_STAR_,malli.registry.registry(_QMARK_registry));
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("can't set default registry, invalid mode",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"mode","mode",654403691),malli.registry.mode,new cljs.core.Keyword(null,"type","type",1174270348),malli.registry.type], null));
}
});

/**
* @constructor
 * @implements {malli.registry.Registry}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
malli.registry.t_malli$registry44432 = (function (meta44433){
this.meta44433 = meta44433;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(malli.registry.t_malli$registry44432.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_44434,meta44433__$1){
var self__ = this;
var _44434__$1 = this;
return (new malli.registry.t_malli$registry44432(meta44433__$1));
}));

(malli.registry.t_malli$registry44432.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_44434){
var self__ = this;
var _44434__$1 = this;
return self__.meta44433;
}));

(malli.registry.t_malli$registry44432.prototype.malli$registry$Registry$ = cljs.core.PROTOCOL_SENTINEL);

(malli.registry.t_malli$registry44432.prototype.malli$registry$Registry$_schema$arity$2 = (function (_,type){
var self__ = this;
var ___$1 = this;
return malli.registry._schema(cljs.core.deref(malli.registry.registry_STAR_),type);
}));

(malli.registry.t_malli$registry44432.prototype.malli$registry$Registry$_schemas$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return malli.registry._schemas(cljs.core.deref(malli.registry.registry_STAR_));
}));

(malli.registry.t_malli$registry44432.getBasis = (function (){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"meta44433","meta44433",-55331189,null)], null);
}));

(malli.registry.t_malli$registry44432.cljs$lang$type = true);

(malli.registry.t_malli$registry44432.cljs$lang$ctorStr = "malli.registry/t_malli$registry44432");

(malli.registry.t_malli$registry44432.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"malli.registry/t_malli$registry44432");
}));

/**
 * Positional factory function for malli.registry/t_malli$registry44432.
 */
malli.registry.__GT_t_malli$registry44432 = (function malli$registry$__GT_t_malli$registry44432(meta44433){
return (new malli.registry.t_malli$registry44432(meta44433));
});


malli.registry.custom_default_registry = (function malli$registry$custom_default_registry(){
return (new malli.registry.t_malli$registry44432(cljs.core.PersistentArrayMap.EMPTY));
});

/**
* @constructor
 * @implements {malli.registry.Registry}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
malli.registry.t_malli$registry44470 = (function (_QMARK_registries,registries,meta44471){
this._QMARK_registries = _QMARK_registries;
this.registries = registries;
this.meta44471 = meta44471;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(malli.registry.t_malli$registry44470.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_44472,meta44471__$1){
var self__ = this;
var _44472__$1 = this;
return (new malli.registry.t_malli$registry44470(self__._QMARK_registries,self__.registries,meta44471__$1));
}));

(malli.registry.t_malli$registry44470.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_44472){
var self__ = this;
var _44472__$1 = this;
return self__.meta44471;
}));

(malli.registry.t_malli$registry44470.prototype.malli$registry$Registry$ = cljs.core.PROTOCOL_SENTINEL);

(malli.registry.t_malli$registry44470.prototype.malli$registry$Registry$_schema$arity$2 = (function (_,type){
var self__ = this;
var ___$1 = this;
return cljs.core.some((function (p1__44447_SHARP_){
return malli.registry._schema(p1__44447_SHARP_,type);
}),self__.registries);
}));

(malli.registry.t_malli$registry44470.prototype.malli$registry$Registry$_schemas$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core.merge,cljs.core.map.cljs$core$IFn$_invoke$arity$2(malli.registry._schemas,cljs.core.reverse(self__.registries)));
}));

(malli.registry.t_malli$registry44470.getBasis = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?registries","?registries",2135368100,null),new cljs.core.Symbol(null,"registries","registries",-1366064418,null),new cljs.core.Symbol(null,"meta44471","meta44471",-470272715,null)], null);
}));

(malli.registry.t_malli$registry44470.cljs$lang$type = true);

(malli.registry.t_malli$registry44470.cljs$lang$ctorStr = "malli.registry/t_malli$registry44470");

(malli.registry.t_malli$registry44470.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"malli.registry/t_malli$registry44470");
}));

/**
 * Positional factory function for malli.registry/t_malli$registry44470.
 */
malli.registry.__GT_t_malli$registry44470 = (function malli$registry$__GT_t_malli$registry44470(_QMARK_registries,registries,meta44471){
return (new malli.registry.t_malli$registry44470(_QMARK_registries,registries,meta44471));
});


malli.registry.composite_registry = (function malli$registry$composite_registry(var_args){
var args__5732__auto__ = [];
var len__5726__auto___44659 = arguments.length;
var i__5727__auto___44660 = (0);
while(true){
if((i__5727__auto___44660 < len__5726__auto___44659)){
args__5732__auto__.push((arguments[i__5727__auto___44660]));

var G__44661 = (i__5727__auto___44660 + (1));
i__5727__auto___44660 = G__44661;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return malli.registry.composite_registry.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(malli.registry.composite_registry.cljs$core$IFn$_invoke$arity$variadic = (function (_QMARK_registries){
var registries = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(malli.registry.registry,_QMARK_registries);
return (new malli.registry.t_malli$registry44470(_QMARK_registries,registries,cljs.core.PersistentArrayMap.EMPTY));
}));

(malli.registry.composite_registry.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(malli.registry.composite_registry.cljs$lang$applyTo = (function (seq44452){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq44452));
}));


/**
* @constructor
 * @implements {malli.registry.Registry}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
malli.registry.t_malli$registry44549 = (function (db,meta44550){
this.db = db;
this.meta44550 = meta44550;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(malli.registry.t_malli$registry44549.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_44551,meta44550__$1){
var self__ = this;
var _44551__$1 = this;
return (new malli.registry.t_malli$registry44549(self__.db,meta44550__$1));
}));

(malli.registry.t_malli$registry44549.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_44551){
var self__ = this;
var _44551__$1 = this;
return self__.meta44550;
}));

(malli.registry.t_malli$registry44549.prototype.malli$registry$Registry$ = cljs.core.PROTOCOL_SENTINEL);

(malli.registry.t_malli$registry44549.prototype.malli$registry$Registry$_schema$arity$2 = (function (_,type){
var self__ = this;
var ___$1 = this;
return malli.registry._schema(malli.registry.registry(cljs.core.deref(self__.db)),type);
}));

(malli.registry.t_malli$registry44549.prototype.malli$registry$Registry$_schemas$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return malli.registry._schemas(malli.registry.registry(cljs.core.deref(self__.db)));
}));

(malli.registry.t_malli$registry44549.getBasis = (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"db","db",-1661185010,null),new cljs.core.Symbol(null,"meta44550","meta44550",-926521770,null)], null);
}));

(malli.registry.t_malli$registry44549.cljs$lang$type = true);

(malli.registry.t_malli$registry44549.cljs$lang$ctorStr = "malli.registry/t_malli$registry44549");

(malli.registry.t_malli$registry44549.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"malli.registry/t_malli$registry44549");
}));

/**
 * Positional factory function for malli.registry/t_malli$registry44549.
 */
malli.registry.__GT_t_malli$registry44549 = (function malli$registry$__GT_t_malli$registry44549(db,meta44550){
return (new malli.registry.t_malli$registry44549(db,meta44550));
});


malli.registry.mutable_registry = (function malli$registry$mutable_registry(db){
return (new malli.registry.t_malli$registry44549(db,cljs.core.PersistentArrayMap.EMPTY));
});

/**
* @constructor
 * @implements {malli.registry.Registry}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
malli.registry.t_malli$registry44581 = (function (meta44582){
this.meta44582 = meta44582;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(malli.registry.t_malli$registry44581.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_44583,meta44582__$1){
var self__ = this;
var _44583__$1 = this;
return (new malli.registry.t_malli$registry44581(meta44582__$1));
}));

(malli.registry.t_malli$registry44581.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_44583){
var self__ = this;
var _44583__$1 = this;
return self__.meta44582;
}));

(malli.registry.t_malli$registry44581.prototype.malli$registry$Registry$ = cljs.core.PROTOCOL_SENTINEL);

(malli.registry.t_malli$registry44581.prototype.malli$registry$Registry$_schema$arity$2 = (function (_,type){
var self__ = this;
var ___$1 = this;
if(cljs.core.var_QMARK_(type)){
return cljs.core.deref(type);
} else {
return null;
}
}));

(malli.registry.t_malli$registry44581.prototype.malli$registry$Registry$_schemas$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return null;
}));

(malli.registry.t_malli$registry44581.getBasis = (function (){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"meta44582","meta44582",1530256295,null)], null);
}));

(malli.registry.t_malli$registry44581.cljs$lang$type = true);

(malli.registry.t_malli$registry44581.cljs$lang$ctorStr = "malli.registry/t_malli$registry44581");

(malli.registry.t_malli$registry44581.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"malli.registry/t_malli$registry44581");
}));

/**
 * Positional factory function for malli.registry/t_malli$registry44581.
 */
malli.registry.__GT_t_malli$registry44581 = (function malli$registry$__GT_t_malli$registry44581(meta44582){
return (new malli.registry.t_malli$registry44581(meta44582));
});


malli.registry.var_registry = (function malli$registry$var_registry(){
return (new malli.registry.t_malli$registry44581(cljs.core.PersistentArrayMap.EMPTY));
});
malli.registry._STAR_registry_STAR_ = cljs.core.PersistentArrayMap.EMPTY;

/**
* @constructor
 * @implements {malli.registry.Registry}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
malli.registry.t_malli$registry44593 = (function (meta44594){
this.meta44594 = meta44594;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(malli.registry.t_malli$registry44593.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_44595,meta44594__$1){
var self__ = this;
var _44595__$1 = this;
return (new malli.registry.t_malli$registry44593(meta44594__$1));
}));

(malli.registry.t_malli$registry44593.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_44595){
var self__ = this;
var _44595__$1 = this;
return self__.meta44594;
}));

(malli.registry.t_malli$registry44593.prototype.malli$registry$Registry$ = cljs.core.PROTOCOL_SENTINEL);

(malli.registry.t_malli$registry44593.prototype.malli$registry$Registry$_schema$arity$2 = (function (_,type){
var self__ = this;
var ___$1 = this;
return malli.registry._schema(malli.registry.registry(malli.registry._STAR_registry_STAR_),type);
}));

(malli.registry.t_malli$registry44593.prototype.malli$registry$Registry$_schemas$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return malli.registry._schemas(malli.registry.registry(malli.registry._STAR_registry_STAR_));
}));

(malli.registry.t_malli$registry44593.getBasis = (function (){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"meta44594","meta44594",-1221552815,null)], null);
}));

(malli.registry.t_malli$registry44593.cljs$lang$type = true);

(malli.registry.t_malli$registry44593.cljs$lang$ctorStr = "malli.registry/t_malli$registry44593");

(malli.registry.t_malli$registry44593.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"malli.registry/t_malli$registry44593");
}));

/**
 * Positional factory function for malli.registry/t_malli$registry44593.
 */
malli.registry.__GT_t_malli$registry44593 = (function malli$registry$__GT_t_malli$registry44593(meta44594){
return (new malli.registry.t_malli$registry44593(meta44594));
});


malli.registry.dynamic_registry = (function malli$registry$dynamic_registry(){
return (new malli.registry.t_malli$registry44593(cljs.core.PersistentArrayMap.EMPTY));
});

/**
* @constructor
 * @implements {malli.registry.Registry}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
malli.registry.t_malli$registry44611 = (function (default_registry,provider,cache_STAR_,registry_STAR_,meta44612){
this.default_registry = default_registry;
this.provider = provider;
this.cache_STAR_ = cache_STAR_;
this.registry_STAR_ = registry_STAR_;
this.meta44612 = meta44612;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(malli.registry.t_malli$registry44611.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_44613,meta44612__$1){
var self__ = this;
var _44613__$1 = this;
return (new malli.registry.t_malli$registry44611(self__.default_registry,self__.provider,self__.cache_STAR_,self__.registry_STAR_,meta44612__$1));
}));

(malli.registry.t_malli$registry44611.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_44613){
var self__ = this;
var _44613__$1 = this;
return self__.meta44612;
}));

(malli.registry.t_malli$registry44611.prototype.malli$registry$Registry$ = cljs.core.PROTOCOL_SENTINEL);

(malli.registry.t_malli$registry44611.prototype.malli$registry$Registry$_schema$arity$2 = (function (_,name){
var self__ = this;
var ___$1 = this;
var or__5002__auto__ = (function (){var fexpr__44624 = cljs.core.deref(self__.cache_STAR_);
return (fexpr__44624.cljs$core$IFn$_invoke$arity$1 ? fexpr__44624.cljs$core$IFn$_invoke$arity$1(name) : fexpr__44624.call(null,name));
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var temp__5804__auto__ = (function (){var G__44625 = name;
var G__44626 = cljs.core.deref(self__.registry_STAR_);
return (self__.provider.cljs$core$IFn$_invoke$arity$2 ? self__.provider.cljs$core$IFn$_invoke$arity$2(G__44625,G__44626) : self__.provider.call(null,G__44625,G__44626));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var schema = temp__5804__auto__;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(self__.cache_STAR_,cljs.core.assoc,name,schema);

return schema;
} else {
return null;
}
}
}));

(malli.registry.t_malli$registry44611.prototype.malli$registry$Registry$_schemas$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.deref(self__.cache_STAR_);
}));

(malli.registry.t_malli$registry44611.getBasis = (function (){
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"default-registry","default-registry",732204441,null),new cljs.core.Symbol(null,"provider","provider",1338474627,null),new cljs.core.Symbol(null,"cache*","cache*",-548597526,null),new cljs.core.Symbol(null,"registry*","registry*",-268031273,null),new cljs.core.Symbol(null,"meta44612","meta44612",1210267705,null)], null);
}));

(malli.registry.t_malli$registry44611.cljs$lang$type = true);

(malli.registry.t_malli$registry44611.cljs$lang$ctorStr = "malli.registry/t_malli$registry44611");

(malli.registry.t_malli$registry44611.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"malli.registry/t_malli$registry44611");
}));

/**
 * Positional factory function for malli.registry/t_malli$registry44611.
 */
malli.registry.__GT_t_malli$registry44611 = (function malli$registry$__GT_t_malli$registry44611(default_registry,provider,cache_STAR_,registry_STAR_,meta44612){
return (new malli.registry.t_malli$registry44611(default_registry,provider,cache_STAR_,registry_STAR_,meta44612));
});


malli.registry.lazy_registry = (function malli$registry$lazy_registry(default_registry,provider){
var cache_STAR_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var registry_STAR_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(default_registry);
return cljs.core.reset_BANG_(registry_STAR_,malli.registry.composite_registry.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([default_registry,(new malli.registry.t_malli$registry44611(default_registry,provider,cache_STAR_,registry_STAR_,cljs.core.PersistentArrayMap.EMPTY))], 0)));
});
/**
 * finds a schema from a registry
 */
malli.registry.schema = (function malli$registry$schema(registry,type){
return malli.registry._schema(registry,type);
});
/**
 * finds all schemas from a registry
 */
malli.registry.schemas = (function malli$registry$schemas(registry){
return malli.registry._schemas(registry);
});

//# sourceMappingURL=malli.registry.js.map
