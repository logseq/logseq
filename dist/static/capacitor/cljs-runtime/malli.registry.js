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

var malli$registry$Registry$_schema$dyn_50434 = (function (this$,type){
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
return malli$registry$Registry$_schema$dyn_50434(this$,type);
}
});

var malli$registry$Registry$_schemas$dyn_50437 = (function (this$){
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
return malli$registry$Registry$_schemas$dyn_50437(this$);
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
malli.registry.t_malli$registry50087 = (function (m,fm,meta50088){
this.m = m;
this.fm = fm;
this.meta50088 = meta50088;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(malli.registry.t_malli$registry50087.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_50089,meta50088__$1){
var self__ = this;
var _50089__$1 = this;
return (new malli.registry.t_malli$registry50087(self__.m,self__.fm,meta50088__$1));
}));

(malli.registry.t_malli$registry50087.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_50089){
var self__ = this;
var _50089__$1 = this;
return self__.meta50088;
}));

(malli.registry.t_malli$registry50087.prototype.malli$registry$Registry$ = cljs.core.PROTOCOL_SENTINEL);

(malli.registry.t_malli$registry50087.prototype.malli$registry$Registry$_schema$arity$2 = (function (_,type){
var self__ = this;
var ___$1 = this;
return self__.fm.get(type);
}));

(malli.registry.t_malli$registry50087.prototype.malli$registry$Registry$_schemas$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return self__.m;
}));

(malli.registry.t_malli$registry50087.getBasis = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"m","m",-1021758608,null),new cljs.core.Symbol(null,"fm","fm",-1190690268,null),new cljs.core.Symbol(null,"meta50088","meta50088",1154772662,null)], null);
}));

(malli.registry.t_malli$registry50087.cljs$lang$type = true);

(malli.registry.t_malli$registry50087.cljs$lang$ctorStr = "malli.registry/t_malli$registry50087");

(malli.registry.t_malli$registry50087.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"malli.registry/t_malli$registry50087");
}));

/**
 * Positional factory function for malli.registry/t_malli$registry50087.
 */
malli.registry.__GT_t_malli$registry50087 = (function malli$registry$__GT_t_malli$registry50087(m,fm,meta50088){
return (new malli.registry.t_malli$registry50087(m,fm,meta50088));
});


malli.registry.fast_registry = (function malli$registry$fast_registry(m){
var fm = m;
return (new malli.registry.t_malli$registry50087(m,fm,cljs.core.PersistentArrayMap.EMPTY));
});

/**
* @constructor
 * @implements {malli.registry.Registry}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
malli.registry.t_malli$registry50106 = (function (m,meta50107){
this.m = m;
this.meta50107 = meta50107;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(malli.registry.t_malli$registry50106.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_50108,meta50107__$1){
var self__ = this;
var _50108__$1 = this;
return (new malli.registry.t_malli$registry50106(self__.m,meta50107__$1));
}));

(malli.registry.t_malli$registry50106.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_50108){
var self__ = this;
var _50108__$1 = this;
return self__.meta50107;
}));

(malli.registry.t_malli$registry50106.prototype.malli$registry$Registry$ = cljs.core.PROTOCOL_SENTINEL);

(malli.registry.t_malli$registry50106.prototype.malli$registry$Registry$_schema$arity$2 = (function (_,type){
var self__ = this;
var ___$1 = this;
return (self__.m.cljs$core$IFn$_invoke$arity$1 ? self__.m.cljs$core$IFn$_invoke$arity$1(type) : self__.m.call(null,type));
}));

(malli.registry.t_malli$registry50106.prototype.malli$registry$Registry$_schemas$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return self__.m;
}));

(malli.registry.t_malli$registry50106.getBasis = (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"m","m",-1021758608,null),new cljs.core.Symbol(null,"meta50107","meta50107",494663196,null)], null);
}));

(malli.registry.t_malli$registry50106.cljs$lang$type = true);

(malli.registry.t_malli$registry50106.cljs$lang$ctorStr = "malli.registry/t_malli$registry50106");

(malli.registry.t_malli$registry50106.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"malli.registry/t_malli$registry50106");
}));

/**
 * Positional factory function for malli.registry/t_malli$registry50106.
 */
malli.registry.__GT_t_malli$registry50106 = (function malli$registry$__GT_t_malli$registry50106(m,meta50107){
return (new malli.registry.t_malli$registry50106(m,meta50107));
});


malli.registry.simple_registry = (function malli$registry$simple_registry(m){
return (new malli.registry.t_malli$registry50106(m,cljs.core.PersistentArrayMap.EMPTY));
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
malli.registry.t_malli$registry50167 = (function (meta50168){
this.meta50168 = meta50168;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(malli.registry.t_malli$registry50167.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_50169,meta50168__$1){
var self__ = this;
var _50169__$1 = this;
return (new malli.registry.t_malli$registry50167(meta50168__$1));
}));

(malli.registry.t_malli$registry50167.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_50169){
var self__ = this;
var _50169__$1 = this;
return self__.meta50168;
}));

(malli.registry.t_malli$registry50167.prototype.malli$registry$Registry$ = cljs.core.PROTOCOL_SENTINEL);

(malli.registry.t_malli$registry50167.prototype.malli$registry$Registry$_schema$arity$2 = (function (_,type){
var self__ = this;
var ___$1 = this;
return malli.registry._schema(cljs.core.deref(malli.registry.registry_STAR_),type);
}));

(malli.registry.t_malli$registry50167.prototype.malli$registry$Registry$_schemas$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return malli.registry._schemas(cljs.core.deref(malli.registry.registry_STAR_));
}));

(malli.registry.t_malli$registry50167.getBasis = (function (){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"meta50168","meta50168",-708949647,null)], null);
}));

(malli.registry.t_malli$registry50167.cljs$lang$type = true);

(malli.registry.t_malli$registry50167.cljs$lang$ctorStr = "malli.registry/t_malli$registry50167");

(malli.registry.t_malli$registry50167.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"malli.registry/t_malli$registry50167");
}));

/**
 * Positional factory function for malli.registry/t_malli$registry50167.
 */
malli.registry.__GT_t_malli$registry50167 = (function malli$registry$__GT_t_malli$registry50167(meta50168){
return (new malli.registry.t_malli$registry50167(meta50168));
});


malli.registry.custom_default_registry = (function malli$registry$custom_default_registry(){
return (new malli.registry.t_malli$registry50167(cljs.core.PersistentArrayMap.EMPTY));
});

/**
* @constructor
 * @implements {malli.registry.Registry}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
malli.registry.t_malli$registry50197 = (function (_QMARK_registries,registries,meta50198){
this._QMARK_registries = _QMARK_registries;
this.registries = registries;
this.meta50198 = meta50198;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(malli.registry.t_malli$registry50197.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_50199,meta50198__$1){
var self__ = this;
var _50199__$1 = this;
return (new malli.registry.t_malli$registry50197(self__._QMARK_registries,self__.registries,meta50198__$1));
}));

(malli.registry.t_malli$registry50197.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_50199){
var self__ = this;
var _50199__$1 = this;
return self__.meta50198;
}));

(malli.registry.t_malli$registry50197.prototype.malli$registry$Registry$ = cljs.core.PROTOCOL_SENTINEL);

(malli.registry.t_malli$registry50197.prototype.malli$registry$Registry$_schema$arity$2 = (function (_,type){
var self__ = this;
var ___$1 = this;
return cljs.core.some((function (p1__50183_SHARP_){
return malli.registry._schema(p1__50183_SHARP_,type);
}),self__.registries);
}));

(malli.registry.t_malli$registry50197.prototype.malli$registry$Registry$_schemas$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core.merge,cljs.core.map.cljs$core$IFn$_invoke$arity$2(malli.registry._schemas,cljs.core.reverse(self__.registries)));
}));

(malli.registry.t_malli$registry50197.getBasis = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?registries","?registries",2135368100,null),new cljs.core.Symbol(null,"registries","registries",-1366064418,null),new cljs.core.Symbol(null,"meta50198","meta50198",292027932,null)], null);
}));

(malli.registry.t_malli$registry50197.cljs$lang$type = true);

(malli.registry.t_malli$registry50197.cljs$lang$ctorStr = "malli.registry/t_malli$registry50197");

(malli.registry.t_malli$registry50197.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"malli.registry/t_malli$registry50197");
}));

/**
 * Positional factory function for malli.registry/t_malli$registry50197.
 */
malli.registry.__GT_t_malli$registry50197 = (function malli$registry$__GT_t_malli$registry50197(_QMARK_registries,registries,meta50198){
return (new malli.registry.t_malli$registry50197(_QMARK_registries,registries,meta50198));
});


malli.registry.composite_registry = (function malli$registry$composite_registry(var_args){
var args__5732__auto__ = [];
var len__5726__auto___50495 = arguments.length;
var i__5727__auto___50496 = (0);
while(true){
if((i__5727__auto___50496 < len__5726__auto___50495)){
args__5732__auto__.push((arguments[i__5727__auto___50496]));

var G__50498 = (i__5727__auto___50496 + (1));
i__5727__auto___50496 = G__50498;
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
return (new malli.registry.t_malli$registry50197(_QMARK_registries,registries,cljs.core.PersistentArrayMap.EMPTY));
}));

(malli.registry.composite_registry.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(malli.registry.composite_registry.cljs$lang$applyTo = (function (seq50184){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq50184));
}));


/**
* @constructor
 * @implements {malli.registry.Registry}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
malli.registry.t_malli$registry50239 = (function (db,meta50240){
this.db = db;
this.meta50240 = meta50240;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(malli.registry.t_malli$registry50239.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_50241,meta50240__$1){
var self__ = this;
var _50241__$1 = this;
return (new malli.registry.t_malli$registry50239(self__.db,meta50240__$1));
}));

(malli.registry.t_malli$registry50239.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_50241){
var self__ = this;
var _50241__$1 = this;
return self__.meta50240;
}));

(malli.registry.t_malli$registry50239.prototype.malli$registry$Registry$ = cljs.core.PROTOCOL_SENTINEL);

(malli.registry.t_malli$registry50239.prototype.malli$registry$Registry$_schema$arity$2 = (function (_,type){
var self__ = this;
var ___$1 = this;
return malli.registry._schema(malli.registry.registry(cljs.core.deref(self__.db)),type);
}));

(malli.registry.t_malli$registry50239.prototype.malli$registry$Registry$_schemas$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return malli.registry._schemas(malli.registry.registry(cljs.core.deref(self__.db)));
}));

(malli.registry.t_malli$registry50239.getBasis = (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"db","db",-1661185010,null),new cljs.core.Symbol(null,"meta50240","meta50240",-1307968777,null)], null);
}));

(malli.registry.t_malli$registry50239.cljs$lang$type = true);

(malli.registry.t_malli$registry50239.cljs$lang$ctorStr = "malli.registry/t_malli$registry50239");

(malli.registry.t_malli$registry50239.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"malli.registry/t_malli$registry50239");
}));

/**
 * Positional factory function for malli.registry/t_malli$registry50239.
 */
malli.registry.__GT_t_malli$registry50239 = (function malli$registry$__GT_t_malli$registry50239(db,meta50240){
return (new malli.registry.t_malli$registry50239(db,meta50240));
});


malli.registry.mutable_registry = (function malli$registry$mutable_registry(db){
return (new malli.registry.t_malli$registry50239(db,cljs.core.PersistentArrayMap.EMPTY));
});

/**
* @constructor
 * @implements {malli.registry.Registry}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
malli.registry.t_malli$registry50262 = (function (meta50263){
this.meta50263 = meta50263;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(malli.registry.t_malli$registry50262.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_50264,meta50263__$1){
var self__ = this;
var _50264__$1 = this;
return (new malli.registry.t_malli$registry50262(meta50263__$1));
}));

(malli.registry.t_malli$registry50262.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_50264){
var self__ = this;
var _50264__$1 = this;
return self__.meta50263;
}));

(malli.registry.t_malli$registry50262.prototype.malli$registry$Registry$ = cljs.core.PROTOCOL_SENTINEL);

(malli.registry.t_malli$registry50262.prototype.malli$registry$Registry$_schema$arity$2 = (function (_,type){
var self__ = this;
var ___$1 = this;
if(cljs.core.var_QMARK_(type)){
return cljs.core.deref(type);
} else {
return null;
}
}));

(malli.registry.t_malli$registry50262.prototype.malli$registry$Registry$_schemas$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return null;
}));

(malli.registry.t_malli$registry50262.getBasis = (function (){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"meta50263","meta50263",-544153742,null)], null);
}));

(malli.registry.t_malli$registry50262.cljs$lang$type = true);

(malli.registry.t_malli$registry50262.cljs$lang$ctorStr = "malli.registry/t_malli$registry50262");

(malli.registry.t_malli$registry50262.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"malli.registry/t_malli$registry50262");
}));

/**
 * Positional factory function for malli.registry/t_malli$registry50262.
 */
malli.registry.__GT_t_malli$registry50262 = (function malli$registry$__GT_t_malli$registry50262(meta50263){
return (new malli.registry.t_malli$registry50262(meta50263));
});


malli.registry.var_registry = (function malli$registry$var_registry(){
return (new malli.registry.t_malli$registry50262(cljs.core.PersistentArrayMap.EMPTY));
});
malli.registry._STAR_registry_STAR_ = cljs.core.PersistentArrayMap.EMPTY;

/**
* @constructor
 * @implements {malli.registry.Registry}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
malli.registry.t_malli$registry50286 = (function (meta50287){
this.meta50287 = meta50287;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(malli.registry.t_malli$registry50286.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_50288,meta50287__$1){
var self__ = this;
var _50288__$1 = this;
return (new malli.registry.t_malli$registry50286(meta50287__$1));
}));

(malli.registry.t_malli$registry50286.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_50288){
var self__ = this;
var _50288__$1 = this;
return self__.meta50287;
}));

(malli.registry.t_malli$registry50286.prototype.malli$registry$Registry$ = cljs.core.PROTOCOL_SENTINEL);

(malli.registry.t_malli$registry50286.prototype.malli$registry$Registry$_schema$arity$2 = (function (_,type){
var self__ = this;
var ___$1 = this;
return malli.registry._schema(malli.registry.registry(malli.registry._STAR_registry_STAR_),type);
}));

(malli.registry.t_malli$registry50286.prototype.malli$registry$Registry$_schemas$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return malli.registry._schemas(malli.registry.registry(malli.registry._STAR_registry_STAR_));
}));

(malli.registry.t_malli$registry50286.getBasis = (function (){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"meta50287","meta50287",-1000087986,null)], null);
}));

(malli.registry.t_malli$registry50286.cljs$lang$type = true);

(malli.registry.t_malli$registry50286.cljs$lang$ctorStr = "malli.registry/t_malli$registry50286");

(malli.registry.t_malli$registry50286.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"malli.registry/t_malli$registry50286");
}));

/**
 * Positional factory function for malli.registry/t_malli$registry50286.
 */
malli.registry.__GT_t_malli$registry50286 = (function malli$registry$__GT_t_malli$registry50286(meta50287){
return (new malli.registry.t_malli$registry50286(meta50287));
});


malli.registry.dynamic_registry = (function malli$registry$dynamic_registry(){
return (new malli.registry.t_malli$registry50286(cljs.core.PersistentArrayMap.EMPTY));
});

/**
* @constructor
 * @implements {malli.registry.Registry}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
malli.registry.t_malli$registry50332 = (function (default_registry,provider,cache_STAR_,registry_STAR_,meta50333){
this.default_registry = default_registry;
this.provider = provider;
this.cache_STAR_ = cache_STAR_;
this.registry_STAR_ = registry_STAR_;
this.meta50333 = meta50333;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(malli.registry.t_malli$registry50332.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_50334,meta50333__$1){
var self__ = this;
var _50334__$1 = this;
return (new malli.registry.t_malli$registry50332(self__.default_registry,self__.provider,self__.cache_STAR_,self__.registry_STAR_,meta50333__$1));
}));

(malli.registry.t_malli$registry50332.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_50334){
var self__ = this;
var _50334__$1 = this;
return self__.meta50333;
}));

(malli.registry.t_malli$registry50332.prototype.malli$registry$Registry$ = cljs.core.PROTOCOL_SENTINEL);

(malli.registry.t_malli$registry50332.prototype.malli$registry$Registry$_schema$arity$2 = (function (_,name){
var self__ = this;
var ___$1 = this;
var or__5002__auto__ = (function (){var fexpr__50358 = cljs.core.deref(self__.cache_STAR_);
return (fexpr__50358.cljs$core$IFn$_invoke$arity$1 ? fexpr__50358.cljs$core$IFn$_invoke$arity$1(name) : fexpr__50358.call(null,name));
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var temp__5804__auto__ = (function (){var G__50359 = name;
var G__50360 = cljs.core.deref(self__.registry_STAR_);
return (self__.provider.cljs$core$IFn$_invoke$arity$2 ? self__.provider.cljs$core$IFn$_invoke$arity$2(G__50359,G__50360) : self__.provider.call(null,G__50359,G__50360));
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

(malli.registry.t_malli$registry50332.prototype.malli$registry$Registry$_schemas$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.deref(self__.cache_STAR_);
}));

(malli.registry.t_malli$registry50332.getBasis = (function (){
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"default-registry","default-registry",732204441,null),new cljs.core.Symbol(null,"provider","provider",1338474627,null),new cljs.core.Symbol(null,"cache*","cache*",-548597526,null),new cljs.core.Symbol(null,"registry*","registry*",-268031273,null),new cljs.core.Symbol(null,"meta50333","meta50333",-1667846134,null)], null);
}));

(malli.registry.t_malli$registry50332.cljs$lang$type = true);

(malli.registry.t_malli$registry50332.cljs$lang$ctorStr = "malli.registry/t_malli$registry50332");

(malli.registry.t_malli$registry50332.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"malli.registry/t_malli$registry50332");
}));

/**
 * Positional factory function for malli.registry/t_malli$registry50332.
 */
malli.registry.__GT_t_malli$registry50332 = (function malli$registry$__GT_t_malli$registry50332(default_registry,provider,cache_STAR_,registry_STAR_,meta50333){
return (new malli.registry.t_malli$registry50332(default_registry,provider,cache_STAR_,registry_STAR_,meta50333));
});


malli.registry.lazy_registry = (function malli$registry$lazy_registry(default_registry,provider){
var cache_STAR_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var registry_STAR_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(default_registry);
return cljs.core.reset_BANG_(registry_STAR_,malli.registry.composite_registry.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([default_registry,(new malli.registry.t_malli$registry50332(default_registry,provider,cache_STAR_,registry_STAR_,cljs.core.PersistentArrayMap.EMPTY))], 0)));
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
