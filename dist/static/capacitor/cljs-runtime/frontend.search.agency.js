goog.provide('frontend.search.agency');
frontend.search.agency.get_registered_engines = (function frontend$search$agency$get_registered_engines(repo){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.search.browser.__GT_Browser(repo),(cljs.core.truth_(frontend.state.lsp_enabled_QMARK_)?(function (){var iter__5480__auto__ = (function frontend$search$agency$get_registered_engines_$_iter__62969(s__62970){
return (new cljs.core.LazySeq(null,(function (){
var s__62970__$1 = s__62970;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__62970__$1);
if(temp__5804__auto__){
var s__62970__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__62970__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__62970__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__62972 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__62971 = (0);
while(true){
if((i__62971 < size__5479__auto__)){
var s = cljs.core._nth(c__5478__auto__,i__62971);
cljs.core.chunk_append(b__62972,frontend.search.plugin.__GT_Plugin(s,repo));

var G__63006 = (i__62971 + (1));
i__62971 = G__63006;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__62972),frontend$search$agency$get_registered_engines_$_iter__62969(cljs.core.chunk_rest(s__62970__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__62972),null);
}
} else {
var s = cljs.core.first(s__62970__$2);
return cljs.core.cons(frontend.search.plugin.__GT_Plugin(s,repo),frontend$search$agency$get_registered_engines_$_iter__62969(cljs.core.rest(s__62970__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(frontend.state.get_all_plugin_services_with_type(new cljs.core.Keyword(null,"search","search",1564939822)));
})():null)], null);
});
frontend.search.agency.get_flatten_registered_engines = (function frontend$search$agency$get_flatten_registered_engines(repo){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.flatten(frontend.search.agency.get_registered_engines(repo)));
});

/**
* @constructor
 * @implements {frontend.search.protocol.Engine}
*/
frontend.search.agency.Agency = (function (repo){
this.repo = repo;
});
(frontend.search.agency.Agency.prototype.frontend$search$protocol$Engine$ = cljs.core.PROTOCOL_SENTINEL);

(frontend.search.agency.Agency.prototype.frontend$search$protocol$Engine$query$arity$3 = (function (_this,q,opts){
var self__ = this;
var _this__$1 = this;
var vec__62973 = frontend.search.agency.get_registered_engines(self__.repo);
var e1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62973,(0),null);
var e2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62973,(1),null);
var seq__62976_63007 = cljs.core.seq(e2);
var chunk__62977_63008 = null;
var count__62978_63009 = (0);
var i__62979_63010 = (0);
while(true){
if((i__62979_63010 < count__62978_63009)){
var e_63011 = chunk__62977_63008.cljs$core$IIndexed$_nth$arity$2(null,i__62979_63010);
frontend.search.protocol.query(e_63011,q,opts);


var G__63012 = seq__62976_63007;
var G__63013 = chunk__62977_63008;
var G__63014 = count__62978_63009;
var G__63015 = (i__62979_63010 + (1));
seq__62976_63007 = G__63012;
chunk__62977_63008 = G__63013;
count__62978_63009 = G__63014;
i__62979_63010 = G__63015;
continue;
} else {
var temp__5804__auto___63016 = cljs.core.seq(seq__62976_63007);
if(temp__5804__auto___63016){
var seq__62976_63017__$1 = temp__5804__auto___63016;
if(cljs.core.chunked_seq_QMARK_(seq__62976_63017__$1)){
var c__5525__auto___63018 = cljs.core.chunk_first(seq__62976_63017__$1);
var G__63019 = cljs.core.chunk_rest(seq__62976_63017__$1);
var G__63020 = c__5525__auto___63018;
var G__63021 = cljs.core.count(c__5525__auto___63018);
var G__63022 = (0);
seq__62976_63007 = G__63019;
chunk__62977_63008 = G__63020;
count__62978_63009 = G__63021;
i__62979_63010 = G__63022;
continue;
} else {
var e_63023 = cljs.core.first(seq__62976_63017__$1);
frontend.search.protocol.query(e_63023,q,opts);


var G__63024 = cljs.core.next(seq__62976_63017__$1);
var G__63025 = null;
var G__63026 = (0);
var G__63027 = (0);
seq__62976_63007 = G__63024;
chunk__62977_63008 = G__63025;
count__62978_63009 = G__63026;
i__62979_63010 = G__63027;
continue;
}
} else {
}
}
break;
}

return frontend.search.protocol.query(e1,q,opts);
}));

(frontend.search.agency.Agency.prototype.frontend$search$protocol$Engine$rebuild_blocks_indice_BANG_$arity$1 = (function (_this){
var self__ = this;
var _this__$1 = this;
var vec__62980 = frontend.search.agency.get_registered_engines(self__.repo);
var e1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62980,(0),null);
var e2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62980,(1),null);
var seq__62983_63028 = cljs.core.seq(e2);
var chunk__62984_63029 = null;
var count__62985_63030 = (0);
var i__62986_63031 = (0);
while(true){
if((i__62986_63031 < count__62985_63030)){
var e_63032 = chunk__62984_63029.cljs$core$IIndexed$_nth$arity$2(null,i__62986_63031);
frontend.search.protocol.rebuild_blocks_indice_BANG_(e_63032);


var G__63033 = seq__62983_63028;
var G__63034 = chunk__62984_63029;
var G__63035 = count__62985_63030;
var G__63036 = (i__62986_63031 + (1));
seq__62983_63028 = G__63033;
chunk__62984_63029 = G__63034;
count__62985_63030 = G__63035;
i__62986_63031 = G__63036;
continue;
} else {
var temp__5804__auto___63037 = cljs.core.seq(seq__62983_63028);
if(temp__5804__auto___63037){
var seq__62983_63038__$1 = temp__5804__auto___63037;
if(cljs.core.chunked_seq_QMARK_(seq__62983_63038__$1)){
var c__5525__auto___63039 = cljs.core.chunk_first(seq__62983_63038__$1);
var G__63040 = cljs.core.chunk_rest(seq__62983_63038__$1);
var G__63041 = c__5525__auto___63039;
var G__63042 = cljs.core.count(c__5525__auto___63039);
var G__63043 = (0);
seq__62983_63028 = G__63040;
chunk__62984_63029 = G__63041;
count__62985_63030 = G__63042;
i__62986_63031 = G__63043;
continue;
} else {
var e_63044 = cljs.core.first(seq__62983_63038__$1);
frontend.search.protocol.rebuild_blocks_indice_BANG_(e_63044);


var G__63045 = cljs.core.next(seq__62983_63038__$1);
var G__63046 = null;
var G__63047 = (0);
var G__63048 = (0);
seq__62983_63028 = G__63045;
chunk__62984_63029 = G__63046;
count__62985_63030 = G__63047;
i__62986_63031 = G__63048;
continue;
}
} else {
}
}
break;
}

return frontend.search.protocol.rebuild_blocks_indice_BANG_(e1);
}));

(frontend.search.agency.Agency.prototype.frontend$search$protocol$Engine$rebuild_pages_indice_BANG_$arity$1 = (function (_this){
var self__ = this;
var _this__$1 = this;
var vec__62987 = frontend.search.agency.get_registered_engines(self__.repo);
var e1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62987,(0),null);
var e2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62987,(1),null);
var seq__62990_63049 = cljs.core.seq(e2);
var chunk__62991_63050 = null;
var count__62992_63051 = (0);
var i__62993_63052 = (0);
while(true){
if((i__62993_63052 < count__62992_63051)){
var e_63053 = chunk__62991_63050.cljs$core$IIndexed$_nth$arity$2(null,i__62993_63052);
frontend.search.protocol.rebuild_pages_indice_BANG_(e_63053);


var G__63054 = seq__62990_63049;
var G__63055 = chunk__62991_63050;
var G__63056 = count__62992_63051;
var G__63057 = (i__62993_63052 + (1));
seq__62990_63049 = G__63054;
chunk__62991_63050 = G__63055;
count__62992_63051 = G__63056;
i__62993_63052 = G__63057;
continue;
} else {
var temp__5804__auto___63058 = cljs.core.seq(seq__62990_63049);
if(temp__5804__auto___63058){
var seq__62990_63059__$1 = temp__5804__auto___63058;
if(cljs.core.chunked_seq_QMARK_(seq__62990_63059__$1)){
var c__5525__auto___63060 = cljs.core.chunk_first(seq__62990_63059__$1);
var G__63061 = cljs.core.chunk_rest(seq__62990_63059__$1);
var G__63062 = c__5525__auto___63060;
var G__63063 = cljs.core.count(c__5525__auto___63060);
var G__63064 = (0);
seq__62990_63049 = G__63061;
chunk__62991_63050 = G__63062;
count__62992_63051 = G__63063;
i__62993_63052 = G__63064;
continue;
} else {
var e_63065 = cljs.core.first(seq__62990_63059__$1);
frontend.search.protocol.rebuild_pages_indice_BANG_(e_63065);


var G__63066 = cljs.core.next(seq__62990_63059__$1);
var G__63067 = null;
var G__63068 = (0);
var G__63069 = (0);
seq__62990_63049 = G__63066;
chunk__62991_63050 = G__63067;
count__62992_63051 = G__63068;
i__62993_63052 = G__63069;
continue;
}
} else {
}
}
break;
}

return frontend.search.protocol.rebuild_pages_indice_BANG_(e1);
}));

(frontend.search.agency.Agency.prototype.frontend$search$protocol$Engine$transact_blocks_BANG_$arity$2 = (function (_this,data){
var self__ = this;
var _this__$1 = this;
var seq__62994 = cljs.core.seq(frontend.search.agency.get_flatten_registered_engines(self__.repo));
var chunk__62995 = null;
var count__62996 = (0);
var i__62997 = (0);
while(true){
if((i__62997 < count__62996)){
var e = chunk__62995.cljs$core$IIndexed$_nth$arity$2(null,i__62997);
frontend.search.protocol.transact_blocks_BANG_(e,data);


var G__63070 = seq__62994;
var G__63071 = chunk__62995;
var G__63072 = count__62996;
var G__63073 = (i__62997 + (1));
seq__62994 = G__63070;
chunk__62995 = G__63071;
count__62996 = G__63072;
i__62997 = G__63073;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__62994);
if(temp__5804__auto__){
var seq__62994__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__62994__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__62994__$1);
var G__63074 = cljs.core.chunk_rest(seq__62994__$1);
var G__63075 = c__5525__auto__;
var G__63076 = cljs.core.count(c__5525__auto__);
var G__63077 = (0);
seq__62994 = G__63074;
chunk__62995 = G__63075;
count__62996 = G__63076;
i__62997 = G__63077;
continue;
} else {
var e = cljs.core.first(seq__62994__$1);
frontend.search.protocol.transact_blocks_BANG_(e,data);


var G__63078 = cljs.core.next(seq__62994__$1);
var G__63079 = null;
var G__63080 = (0);
var G__63081 = (0);
seq__62994 = G__63078;
chunk__62995 = G__63079;
count__62996 = G__63080;
i__62997 = G__63081;
continue;
}
} else {
return null;
}
}
break;
}
}));

(frontend.search.agency.Agency.prototype.frontend$search$protocol$Engine$truncate_blocks_BANG_$arity$1 = (function (_this){
var self__ = this;
var _this__$1 = this;
var seq__62998 = cljs.core.seq(frontend.search.agency.get_flatten_registered_engines(self__.repo));
var chunk__62999 = null;
var count__63000 = (0);
var i__63001 = (0);
while(true){
if((i__63001 < count__63000)){
var e = chunk__62999.cljs$core$IIndexed$_nth$arity$2(null,i__63001);
frontend.search.protocol.truncate_blocks_BANG_(e);


var G__63082 = seq__62998;
var G__63083 = chunk__62999;
var G__63084 = count__63000;
var G__63085 = (i__63001 + (1));
seq__62998 = G__63082;
chunk__62999 = G__63083;
count__63000 = G__63084;
i__63001 = G__63085;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__62998);
if(temp__5804__auto__){
var seq__62998__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__62998__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__62998__$1);
var G__63086 = cljs.core.chunk_rest(seq__62998__$1);
var G__63087 = c__5525__auto__;
var G__63088 = cljs.core.count(c__5525__auto__);
var G__63089 = (0);
seq__62998 = G__63086;
chunk__62999 = G__63087;
count__63000 = G__63088;
i__63001 = G__63089;
continue;
} else {
var e = cljs.core.first(seq__62998__$1);
frontend.search.protocol.truncate_blocks_BANG_(e);


var G__63090 = cljs.core.next(seq__62998__$1);
var G__63091 = null;
var G__63092 = (0);
var G__63093 = (0);
seq__62998 = G__63090;
chunk__62999 = G__63091;
count__63000 = G__63092;
i__63001 = G__63093;
continue;
}
} else {
return null;
}
}
break;
}
}));

(frontend.search.agency.Agency.prototype.frontend$search$protocol$Engine$remove_db_BANG_$arity$1 = (function (_this){
var self__ = this;
var _this__$1 = this;
var seq__63002 = cljs.core.seq(frontend.search.agency.get_flatten_registered_engines(self__.repo));
var chunk__63003 = null;
var count__63004 = (0);
var i__63005 = (0);
while(true){
if((i__63005 < count__63004)){
var e = chunk__63003.cljs$core$IIndexed$_nth$arity$2(null,i__63005);
frontend.search.protocol.remove_db_BANG_(e);


var G__63094 = seq__63002;
var G__63095 = chunk__63003;
var G__63096 = count__63004;
var G__63097 = (i__63005 + (1));
seq__63002 = G__63094;
chunk__63003 = G__63095;
count__63004 = G__63096;
i__63005 = G__63097;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__63002);
if(temp__5804__auto__){
var seq__63002__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__63002__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__63002__$1);
var G__63098 = cljs.core.chunk_rest(seq__63002__$1);
var G__63099 = c__5525__auto__;
var G__63100 = cljs.core.count(c__5525__auto__);
var G__63101 = (0);
seq__63002 = G__63098;
chunk__63003 = G__63099;
count__63004 = G__63100;
i__63005 = G__63101;
continue;
} else {
var e = cljs.core.first(seq__63002__$1);
frontend.search.protocol.remove_db_BANG_(e);


var G__63102 = cljs.core.next(seq__63002__$1);
var G__63103 = null;
var G__63104 = (0);
var G__63105 = (0);
seq__63002 = G__63102;
chunk__63003 = G__63103;
count__63004 = G__63104;
i__63005 = G__63105;
continue;
}
} else {
return null;
}
}
break;
}
}));

(frontend.search.agency.Agency.getBasis = (function (){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"repo","repo",-358529152,null)], null);
}));

(frontend.search.agency.Agency.cljs$lang$type = true);

(frontend.search.agency.Agency.cljs$lang$ctorStr = "frontend.search.agency/Agency");

(frontend.search.agency.Agency.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"frontend.search.agency/Agency");
}));

/**
 * Positional factory function for frontend.search.agency/Agency.
 */
frontend.search.agency.__GT_Agency = (function frontend$search$agency$__GT_Agency(repo){
return (new frontend.search.agency.Agency(repo));
});


//# sourceMappingURL=frontend.search.agency.js.map
