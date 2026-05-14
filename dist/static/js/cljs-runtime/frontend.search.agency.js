goog.provide('frontend.search.agency');
frontend.search.agency.get_registered_engines = (function frontend$search$agency$get_registered_engines(repo){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.search.browser.__GT_Browser(repo),(cljs.core.truth_(frontend.state.lsp_enabled_QMARK_)?(function (){var iter__5480__auto__ = (function frontend$search$agency$get_registered_engines_$_iter__102015(s__102016){
return (new cljs.core.LazySeq(null,(function (){
var s__102016__$1 = s__102016;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__102016__$1);
if(temp__5804__auto__){
var s__102016__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__102016__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__102016__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__102018 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__102017 = (0);
while(true){
if((i__102017 < size__5479__auto__)){
var s = cljs.core._nth(c__5478__auto__,i__102017);
cljs.core.chunk_append(b__102018,frontend.search.plugin.__GT_Plugin(s,repo));

var G__102052 = (i__102017 + (1));
i__102017 = G__102052;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__102018),frontend$search$agency$get_registered_engines_$_iter__102015(cljs.core.chunk_rest(s__102016__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__102018),null);
}
} else {
var s = cljs.core.first(s__102016__$2);
return cljs.core.cons(frontend.search.plugin.__GT_Plugin(s,repo),frontend$search$agency$get_registered_engines_$_iter__102015(cljs.core.rest(s__102016__$2)));
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
var vec__102019 = frontend.search.agency.get_registered_engines(self__.repo);
var e1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102019,(0),null);
var e2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102019,(1),null);
var seq__102022_102053 = cljs.core.seq(e2);
var chunk__102023_102054 = null;
var count__102024_102055 = (0);
var i__102025_102056 = (0);
while(true){
if((i__102025_102056 < count__102024_102055)){
var e_102057 = chunk__102023_102054.cljs$core$IIndexed$_nth$arity$2(null,i__102025_102056);
frontend.search.protocol.query(e_102057,q,opts);


var G__102058 = seq__102022_102053;
var G__102059 = chunk__102023_102054;
var G__102060 = count__102024_102055;
var G__102061 = (i__102025_102056 + (1));
seq__102022_102053 = G__102058;
chunk__102023_102054 = G__102059;
count__102024_102055 = G__102060;
i__102025_102056 = G__102061;
continue;
} else {
var temp__5804__auto___102062 = cljs.core.seq(seq__102022_102053);
if(temp__5804__auto___102062){
var seq__102022_102063__$1 = temp__5804__auto___102062;
if(cljs.core.chunked_seq_QMARK_(seq__102022_102063__$1)){
var c__5525__auto___102064 = cljs.core.chunk_first(seq__102022_102063__$1);
var G__102065 = cljs.core.chunk_rest(seq__102022_102063__$1);
var G__102066 = c__5525__auto___102064;
var G__102067 = cljs.core.count(c__5525__auto___102064);
var G__102068 = (0);
seq__102022_102053 = G__102065;
chunk__102023_102054 = G__102066;
count__102024_102055 = G__102067;
i__102025_102056 = G__102068;
continue;
} else {
var e_102069 = cljs.core.first(seq__102022_102063__$1);
frontend.search.protocol.query(e_102069,q,opts);


var G__102070 = cljs.core.next(seq__102022_102063__$1);
var G__102071 = null;
var G__102072 = (0);
var G__102073 = (0);
seq__102022_102053 = G__102070;
chunk__102023_102054 = G__102071;
count__102024_102055 = G__102072;
i__102025_102056 = G__102073;
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
var vec__102026 = frontend.search.agency.get_registered_engines(self__.repo);
var e1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102026,(0),null);
var e2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102026,(1),null);
var seq__102029_102074 = cljs.core.seq(e2);
var chunk__102030_102075 = null;
var count__102031_102076 = (0);
var i__102032_102077 = (0);
while(true){
if((i__102032_102077 < count__102031_102076)){
var e_102078 = chunk__102030_102075.cljs$core$IIndexed$_nth$arity$2(null,i__102032_102077);
frontend.search.protocol.rebuild_blocks_indice_BANG_(e_102078);


var G__102079 = seq__102029_102074;
var G__102080 = chunk__102030_102075;
var G__102081 = count__102031_102076;
var G__102082 = (i__102032_102077 + (1));
seq__102029_102074 = G__102079;
chunk__102030_102075 = G__102080;
count__102031_102076 = G__102081;
i__102032_102077 = G__102082;
continue;
} else {
var temp__5804__auto___102083 = cljs.core.seq(seq__102029_102074);
if(temp__5804__auto___102083){
var seq__102029_102084__$1 = temp__5804__auto___102083;
if(cljs.core.chunked_seq_QMARK_(seq__102029_102084__$1)){
var c__5525__auto___102085 = cljs.core.chunk_first(seq__102029_102084__$1);
var G__102086 = cljs.core.chunk_rest(seq__102029_102084__$1);
var G__102087 = c__5525__auto___102085;
var G__102088 = cljs.core.count(c__5525__auto___102085);
var G__102089 = (0);
seq__102029_102074 = G__102086;
chunk__102030_102075 = G__102087;
count__102031_102076 = G__102088;
i__102032_102077 = G__102089;
continue;
} else {
var e_102090 = cljs.core.first(seq__102029_102084__$1);
frontend.search.protocol.rebuild_blocks_indice_BANG_(e_102090);


var G__102091 = cljs.core.next(seq__102029_102084__$1);
var G__102092 = null;
var G__102093 = (0);
var G__102094 = (0);
seq__102029_102074 = G__102091;
chunk__102030_102075 = G__102092;
count__102031_102076 = G__102093;
i__102032_102077 = G__102094;
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
var vec__102033 = frontend.search.agency.get_registered_engines(self__.repo);
var e1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102033,(0),null);
var e2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102033,(1),null);
var seq__102036_102095 = cljs.core.seq(e2);
var chunk__102037_102096 = null;
var count__102038_102097 = (0);
var i__102039_102098 = (0);
while(true){
if((i__102039_102098 < count__102038_102097)){
var e_102099 = chunk__102037_102096.cljs$core$IIndexed$_nth$arity$2(null,i__102039_102098);
frontend.search.protocol.rebuild_pages_indice_BANG_(e_102099);


var G__102100 = seq__102036_102095;
var G__102101 = chunk__102037_102096;
var G__102102 = count__102038_102097;
var G__102103 = (i__102039_102098 + (1));
seq__102036_102095 = G__102100;
chunk__102037_102096 = G__102101;
count__102038_102097 = G__102102;
i__102039_102098 = G__102103;
continue;
} else {
var temp__5804__auto___102104 = cljs.core.seq(seq__102036_102095);
if(temp__5804__auto___102104){
var seq__102036_102105__$1 = temp__5804__auto___102104;
if(cljs.core.chunked_seq_QMARK_(seq__102036_102105__$1)){
var c__5525__auto___102106 = cljs.core.chunk_first(seq__102036_102105__$1);
var G__102107 = cljs.core.chunk_rest(seq__102036_102105__$1);
var G__102108 = c__5525__auto___102106;
var G__102109 = cljs.core.count(c__5525__auto___102106);
var G__102110 = (0);
seq__102036_102095 = G__102107;
chunk__102037_102096 = G__102108;
count__102038_102097 = G__102109;
i__102039_102098 = G__102110;
continue;
} else {
var e_102111 = cljs.core.first(seq__102036_102105__$1);
frontend.search.protocol.rebuild_pages_indice_BANG_(e_102111);


var G__102112 = cljs.core.next(seq__102036_102105__$1);
var G__102113 = null;
var G__102114 = (0);
var G__102115 = (0);
seq__102036_102095 = G__102112;
chunk__102037_102096 = G__102113;
count__102038_102097 = G__102114;
i__102039_102098 = G__102115;
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
var seq__102040 = cljs.core.seq(frontend.search.agency.get_flatten_registered_engines(self__.repo));
var chunk__102041 = null;
var count__102042 = (0);
var i__102043 = (0);
while(true){
if((i__102043 < count__102042)){
var e = chunk__102041.cljs$core$IIndexed$_nth$arity$2(null,i__102043);
frontend.search.protocol.transact_blocks_BANG_(e,data);


var G__102116 = seq__102040;
var G__102117 = chunk__102041;
var G__102118 = count__102042;
var G__102119 = (i__102043 + (1));
seq__102040 = G__102116;
chunk__102041 = G__102117;
count__102042 = G__102118;
i__102043 = G__102119;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__102040);
if(temp__5804__auto__){
var seq__102040__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__102040__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__102040__$1);
var G__102120 = cljs.core.chunk_rest(seq__102040__$1);
var G__102121 = c__5525__auto__;
var G__102122 = cljs.core.count(c__5525__auto__);
var G__102123 = (0);
seq__102040 = G__102120;
chunk__102041 = G__102121;
count__102042 = G__102122;
i__102043 = G__102123;
continue;
} else {
var e = cljs.core.first(seq__102040__$1);
frontend.search.protocol.transact_blocks_BANG_(e,data);


var G__102124 = cljs.core.next(seq__102040__$1);
var G__102125 = null;
var G__102126 = (0);
var G__102127 = (0);
seq__102040 = G__102124;
chunk__102041 = G__102125;
count__102042 = G__102126;
i__102043 = G__102127;
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
var seq__102044 = cljs.core.seq(frontend.search.agency.get_flatten_registered_engines(self__.repo));
var chunk__102045 = null;
var count__102046 = (0);
var i__102047 = (0);
while(true){
if((i__102047 < count__102046)){
var e = chunk__102045.cljs$core$IIndexed$_nth$arity$2(null,i__102047);
frontend.search.protocol.truncate_blocks_BANG_(e);


var G__102128 = seq__102044;
var G__102129 = chunk__102045;
var G__102130 = count__102046;
var G__102131 = (i__102047 + (1));
seq__102044 = G__102128;
chunk__102045 = G__102129;
count__102046 = G__102130;
i__102047 = G__102131;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__102044);
if(temp__5804__auto__){
var seq__102044__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__102044__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__102044__$1);
var G__102132 = cljs.core.chunk_rest(seq__102044__$1);
var G__102133 = c__5525__auto__;
var G__102134 = cljs.core.count(c__5525__auto__);
var G__102135 = (0);
seq__102044 = G__102132;
chunk__102045 = G__102133;
count__102046 = G__102134;
i__102047 = G__102135;
continue;
} else {
var e = cljs.core.first(seq__102044__$1);
frontend.search.protocol.truncate_blocks_BANG_(e);


var G__102136 = cljs.core.next(seq__102044__$1);
var G__102137 = null;
var G__102138 = (0);
var G__102139 = (0);
seq__102044 = G__102136;
chunk__102045 = G__102137;
count__102046 = G__102138;
i__102047 = G__102139;
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
var seq__102048 = cljs.core.seq(frontend.search.agency.get_flatten_registered_engines(self__.repo));
var chunk__102049 = null;
var count__102050 = (0);
var i__102051 = (0);
while(true){
if((i__102051 < count__102050)){
var e = chunk__102049.cljs$core$IIndexed$_nth$arity$2(null,i__102051);
frontend.search.protocol.remove_db_BANG_(e);


var G__102140 = seq__102048;
var G__102141 = chunk__102049;
var G__102142 = count__102050;
var G__102143 = (i__102051 + (1));
seq__102048 = G__102140;
chunk__102049 = G__102141;
count__102050 = G__102142;
i__102051 = G__102143;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__102048);
if(temp__5804__auto__){
var seq__102048__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__102048__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__102048__$1);
var G__102144 = cljs.core.chunk_rest(seq__102048__$1);
var G__102145 = c__5525__auto__;
var G__102146 = cljs.core.count(c__5525__auto__);
var G__102147 = (0);
seq__102048 = G__102144;
chunk__102049 = G__102145;
count__102050 = G__102146;
i__102051 = G__102147;
continue;
} else {
var e = cljs.core.first(seq__102048__$1);
frontend.search.protocol.remove_db_BANG_(e);


var G__102148 = cljs.core.next(seq__102048__$1);
var G__102149 = null;
var G__102150 = (0);
var G__102151 = (0);
seq__102048 = G__102148;
chunk__102049 = G__102149;
count__102050 = G__102150;
i__102051 = G__102151;
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
