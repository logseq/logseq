goog.provide('fipp.edn');
fipp.edn.pretty_coll = (function fipp$edn$pretty_coll(p__74237,open,xs,sep,close,f){
var map__74239 = p__74237;
var map__74239__$1 = cljs.core.__destructure_map(map__74239);
var printer = map__74239__$1;
var print_level = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74239__$1,new cljs.core.Keyword(null,"print-level","print-level",-1825423733));
var print_length = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74239__$1,new cljs.core.Keyword(null,"print-length","print-length",1931866356));
var printer__$1 = (function (){var G__74240 = printer;
if(cljs.core.truth_(print_level)){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(G__74240,new cljs.core.Keyword(null,"print-level","print-level",-1825423733),cljs.core.dec);
} else {
return G__74240;
}
})();
var xform = cljs.core.comp.cljs$core$IFn$_invoke$arity$3((cljs.core.truth_(print_length)?cljs.core.take.cljs$core$IFn$_invoke$arity$1(print_length):cljs.core.identity),cljs.core.map.cljs$core$IFn$_invoke$arity$1((function (p1__74236_SHARP_){
return (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(printer__$1,p1__74236_SHARP_) : f.call(null,printer__$1,p1__74236_SHARP_));
})),cljs.core.interpose.cljs$core$IFn$_invoke$arity$1(sep));
var ys = ((((function (){var or__5002__auto__ = print_level;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (1);
}
})() > (0)))?cljs.core.sequence.cljs$core$IFn$_invoke$arity$2(xform,xs):"#");
var ellipsis = (cljs.core.truth_((function (){var and__5000__auto__ = print_length;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.seq(cljs.core.drop.cljs$core$IFn$_invoke$arity$2(print_length,xs));
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),sep,"..."], null):null);
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"group","group",582596132),open,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"align","align",1964212802),ys,ellipsis], null),close], null);
});

/**
* @constructor
 * @implements {cljs.core.IRecord}
 * @implements {cljs.core.IKVReduce}
 * @implements {cljs.core.IEquiv}
 * @implements {cljs.core.IHash}
 * @implements {cljs.core.ICollection}
 * @implements {fipp.visit.IVisitor}
 * @implements {cljs.core.ICounted}
 * @implements {cljs.core.ISeqable}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.ICloneable}
 * @implements {cljs.core.IPrintWithWriter}
 * @implements {cljs.core.IIterable}
 * @implements {cljs.core.IWithMeta}
 * @implements {cljs.core.IAssociative}
 * @implements {cljs.core.IMap}
 * @implements {cljs.core.ILookup}
*/
fipp.edn.EdnPrinter = (function (symbols,print_meta,print_length,print_level,__meta,__extmap,__hash){
this.symbols = symbols;
this.print_meta = print_meta;
this.print_length = print_length;
this.print_level = print_level;
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(fipp.edn.EdnPrinter.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(fipp.edn.EdnPrinter.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k74248,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__74258 = k74248;
var G__74258__$1 = (((G__74258 instanceof cljs.core.Keyword))?G__74258.fqn:null);
switch (G__74258__$1) {
case "symbols":
return self__.symbols;

break;
case "print-meta":
return self__.print_meta;

break;
case "print-length":
return self__.print_length;

break;
case "print-level":
return self__.print_level;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k74248,else__5303__auto__);

}
}));

(fipp.edn.EdnPrinter.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__74262){
var vec__74263 = p__74262;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74263,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74263,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(fipp.edn.EdnPrinter.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#fipp.edn.EdnPrinter{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"symbols","symbols",1211743),self__.symbols],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"print-meta","print-meta",1034114598),self__.print_meta],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"print-length","print-length",1931866356),self__.print_length],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"print-level","print-level",-1825423733),self__.print_level],null))], null),self__.__extmap));
}));

(fipp.edn.EdnPrinter.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__74247){
var self__ = this;
var G__74247__$1 = this;
return (new cljs.core.RecordIter((0),G__74247__$1,4,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"symbols","symbols",1211743),new cljs.core.Keyword(null,"print-meta","print-meta",1034114598),new cljs.core.Keyword(null,"print-length","print-length",1931866356),new cljs.core.Keyword(null,"print-level","print-level",-1825423733)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(fipp.edn.EdnPrinter.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(fipp.edn.EdnPrinter.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new fipp.edn.EdnPrinter(self__.symbols,self__.print_meta,self__.print_length,self__.print_level,self__.__meta,self__.__extmap,self__.__hash));
}));

(fipp.edn.EdnPrinter.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (4 + cljs.core.count(self__.__extmap));
}));

(fipp.edn.EdnPrinter.prototype.fipp$visit$IVisitor$ = cljs.core.PROTOCOL_SENTINEL);

(fipp.edn.EdnPrinter.prototype.fipp$visit$IVisitor$visit_record$arity$2 = (function (this$,x){
var self__ = this;
var this$__$1 = this;
return fipp.visit.visit(this$__$1,fipp.ednize.record__GT_tagged(x));
}));

(fipp.edn.EdnPrinter.prototype.fipp$visit$IVisitor$visit_meta$arity$3 = (function (this$,m,x){
var self__ = this;
var this$__$1 = this;
if(cljs.core.truth_(self__.print_meta)){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),"^",fipp.visit.visit(this$__$1,m)], null),new cljs.core.Keyword(null,"line","line",212345235),fipp.visit.visit_STAR_(this$__$1,x)], null);
} else {
return fipp.visit.visit_STAR_(this$__$1,x);
}
}));

(fipp.edn.EdnPrinter.prototype.fipp$visit$IVisitor$visit_number$arity$2 = (function (this$,x){
var self__ = this;
var this$__$1 = this;
var _STAR_print_dup_STAR__orig_val__74279 = cljs.core._STAR_print_dup_STAR_;
var _STAR_print_dup_STAR__temp_val__74281 = false;
(cljs.core._STAR_print_dup_STAR_ = _STAR_print_dup_STAR__temp_val__74281);

try{return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"text","text",-1790561697),cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([x], 0))], null);
}finally {(cljs.core._STAR_print_dup_STAR_ = _STAR_print_dup_STAR__orig_val__74279);
}}));

(fipp.edn.EdnPrinter.prototype.fipp$visit$IVisitor$visit_pattern$arity$2 = (function (this$,x){
var self__ = this;
var this$__$1 = this;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"text","text",-1790561697),cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([x], 0))], null);
}));

(fipp.edn.EdnPrinter.prototype.fipp$visit$IVisitor$visit_unknown$arity$2 = (function (this$,x){
var self__ = this;
var this$__$1 = this;
return fipp.visit.visit(this$__$1,fipp.ednize.edn(x));
}));

(fipp.edn.EdnPrinter.prototype.fipp$visit$IVisitor$visit_symbol$arity$2 = (function (this$,x){
var self__ = this;
var this$__$1 = this;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"text","text",-1790561697),cljs.core.str.cljs$core$IFn$_invoke$arity$1(x)], null);
}));

(fipp.edn.EdnPrinter.prototype.fipp$visit$IVisitor$visit_seq$arity$2 = (function (this$,x){
var self__ = this;
var this$__$1 = this;
var temp__5802__auto__ = (function (){var G__74288 = cljs.core.first(x);
return (self__.symbols.cljs$core$IFn$_invoke$arity$1 ? self__.symbols.cljs$core$IFn$_invoke$arity$1(G__74288) : self__.symbols.call(null,G__74288));
})();
if(cljs.core.truth_(temp__5802__auto__)){
var pretty = temp__5802__auto__;
return (pretty.cljs$core$IFn$_invoke$arity$2 ? pretty.cljs$core$IFn$_invoke$arity$2(this$__$1,x) : pretty.call(null,this$__$1,x));
} else {
return fipp.edn.pretty_coll(this$__$1,"(",x,new cljs.core.Keyword(null,"line","line",212345235),")",fipp.visit.visit);
}
}));

(fipp.edn.EdnPrinter.prototype.fipp$visit$IVisitor$visit_boolean$arity$2 = (function (this$,x){
var self__ = this;
var this$__$1 = this;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"text","text",-1790561697),cljs.core.str.cljs$core$IFn$_invoke$arity$1(x)], null);
}));

(fipp.edn.EdnPrinter.prototype.fipp$visit$IVisitor$visit_tagged$arity$2 = (function (this$,p__74293){
var self__ = this;
var map__74294 = p__74293;
var map__74294__$1 = cljs.core.__destructure_map(map__74294);
var tag = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74294__$1,new cljs.core.Keyword(null,"tag","tag",-1290361223));
var form = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74294__$1,new cljs.core.Keyword(null,"form","form",-1624062471));
var this$__$1 = this;
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"group","group",582596132),"#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(tag),(cljs.core.truth_((function (){var or__5002__auto__ = (function (){var and__5000__auto__ = self__.print_meta;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.meta(form);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (!(cljs.core.coll_QMARK_(form)));
}
})())?" ":null),fipp.visit.visit(this$__$1,form)], null);
}));

(fipp.edn.EdnPrinter.prototype.fipp$visit$IVisitor$visit_keyword$arity$2 = (function (this$,x){
var self__ = this;
var this$__$1 = this;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"text","text",-1790561697),cljs.core.str.cljs$core$IFn$_invoke$arity$1(x)], null);
}));

(fipp.edn.EdnPrinter.prototype.fipp$visit$IVisitor$visit_map$arity$2 = (function (this$,x){
var self__ = this;
var this$__$1 = this;
return fipp.edn.pretty_coll(this$__$1,"{",x,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),",",new cljs.core.Keyword(null,"line","line",212345235)], null),"}",(function (printer,p__74301){
var vec__74302 = p__74301;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74302,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74302,(1),null);
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),fipp.visit.visit(printer,k)," ",fipp.visit.visit(printer,v)], null);
}));
}));

(fipp.edn.EdnPrinter.prototype.fipp$visit$IVisitor$visit_nil$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"text","text",-1790561697),"nil"], null);
}));

(fipp.edn.EdnPrinter.prototype.fipp$visit$IVisitor$visit_character$arity$2 = (function (this$,x){
var self__ = this;
var this$__$1 = this;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"text","text",-1790561697),(function (){var _STAR_print_readably_STAR__orig_val__74308 = cljs.core._STAR_print_readably_STAR_;
var _STAR_print_readably_STAR__temp_val__74309 = true;
(cljs.core._STAR_print_readably_STAR_ = _STAR_print_readably_STAR__temp_val__74309);

try{return cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([x], 0));
}finally {(cljs.core._STAR_print_readably_STAR_ = _STAR_print_readably_STAR__orig_val__74308);
}})()], null);
}));

(fipp.edn.EdnPrinter.prototype.fipp$visit$IVisitor$visit_string$arity$2 = (function (this$,x){
var self__ = this;
var this$__$1 = this;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"text","text",-1790561697),(function (){var _STAR_print_readably_STAR__orig_val__74313 = cljs.core._STAR_print_readably_STAR_;
var _STAR_print_readably_STAR__temp_val__74314 = true;
(cljs.core._STAR_print_readably_STAR_ = _STAR_print_readably_STAR__temp_val__74314);

try{return cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([x], 0));
}finally {(cljs.core._STAR_print_readably_STAR_ = _STAR_print_readably_STAR__orig_val__74313);
}})()], null);
}));

(fipp.edn.EdnPrinter.prototype.fipp$visit$IVisitor$visit_var$arity$2 = (function (this$,x){
var self__ = this;
var this$__$1 = this;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"text","text",-1790561697),cljs.core.str.cljs$core$IFn$_invoke$arity$1(x)], null);
}));

(fipp.edn.EdnPrinter.prototype.fipp$visit$IVisitor$visit_set$arity$2 = (function (this$,x){
var self__ = this;
var this$__$1 = this;
return fipp.edn.pretty_coll(this$__$1,"#{",x,new cljs.core.Keyword(null,"line","line",212345235),"}",fipp.visit.visit);
}));

(fipp.edn.EdnPrinter.prototype.fipp$visit$IVisitor$visit_vector$arity$2 = (function (this$,x){
var self__ = this;
var this$__$1 = this;
return fipp.edn.pretty_coll(this$__$1,"[",x,new cljs.core.Keyword(null,"line","line",212345235),"]",fipp.visit.visit);
}));

(fipp.edn.EdnPrinter.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (222486956 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(fipp.edn.EdnPrinter.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this74249,other74250){
var self__ = this;
var this74249__$1 = this;
return (((!((other74250 == null)))) && ((((this74249__$1.constructor === other74250.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this74249__$1.symbols,other74250.symbols)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this74249__$1.print_meta,other74250.print_meta)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this74249__$1.print_length,other74250.print_length)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this74249__$1.print_level,other74250.print_level)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this74249__$1.__extmap,other74250.__extmap)))))))))))));
}));

(fipp.edn.EdnPrinter.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"print-meta","print-meta",1034114598),null,new cljs.core.Keyword(null,"print-level","print-level",-1825423733),null,new cljs.core.Keyword(null,"print-length","print-length",1931866356),null,new cljs.core.Keyword(null,"symbols","symbols",1211743),null], null), null),k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new fipp.edn.EdnPrinter(self__.symbols,self__.print_meta,self__.print_length,self__.print_level,self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(fipp.edn.EdnPrinter.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k74248){
var self__ = this;
var this__5307__auto____$1 = this;
var G__74347 = k74248;
var G__74347__$1 = (((G__74347 instanceof cljs.core.Keyword))?G__74347.fqn:null);
switch (G__74347__$1) {
case "symbols":
case "print-meta":
case "print-length":
case "print-level":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k74248);

}
}));

(fipp.edn.EdnPrinter.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__74247){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__74352 = cljs.core.keyword_identical_QMARK_;
var expr__74353 = k__5309__auto__;
if(cljs.core.truth_((pred__74352.cljs$core$IFn$_invoke$arity$2 ? pred__74352.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"symbols","symbols",1211743),expr__74353) : pred__74352.call(null,new cljs.core.Keyword(null,"symbols","symbols",1211743),expr__74353)))){
return (new fipp.edn.EdnPrinter(G__74247,self__.print_meta,self__.print_length,self__.print_level,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__74352.cljs$core$IFn$_invoke$arity$2 ? pred__74352.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"print-meta","print-meta",1034114598),expr__74353) : pred__74352.call(null,new cljs.core.Keyword(null,"print-meta","print-meta",1034114598),expr__74353)))){
return (new fipp.edn.EdnPrinter(self__.symbols,G__74247,self__.print_length,self__.print_level,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__74352.cljs$core$IFn$_invoke$arity$2 ? pred__74352.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"print-length","print-length",1931866356),expr__74353) : pred__74352.call(null,new cljs.core.Keyword(null,"print-length","print-length",1931866356),expr__74353)))){
return (new fipp.edn.EdnPrinter(self__.symbols,self__.print_meta,G__74247,self__.print_level,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__74352.cljs$core$IFn$_invoke$arity$2 ? pred__74352.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"print-level","print-level",-1825423733),expr__74353) : pred__74352.call(null,new cljs.core.Keyword(null,"print-level","print-level",-1825423733),expr__74353)))){
return (new fipp.edn.EdnPrinter(self__.symbols,self__.print_meta,self__.print_length,G__74247,self__.__meta,self__.__extmap,null));
} else {
return (new fipp.edn.EdnPrinter(self__.symbols,self__.print_meta,self__.print_length,self__.print_level,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__74247),null));
}
}
}
}
}));

(fipp.edn.EdnPrinter.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"symbols","symbols",1211743),self__.symbols,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"print-meta","print-meta",1034114598),self__.print_meta,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"print-length","print-length",1931866356),self__.print_length,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"print-level","print-level",-1825423733),self__.print_level,null))], null),self__.__extmap));
}));

(fipp.edn.EdnPrinter.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__74247){
var self__ = this;
var this__5299__auto____$1 = this;
return (new fipp.edn.EdnPrinter(self__.symbols,self__.print_meta,self__.print_length,self__.print_level,G__74247,self__.__extmap,self__.__hash));
}));

(fipp.edn.EdnPrinter.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(fipp.edn.EdnPrinter.getBasis = (function (){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"symbols","symbols",1641743270,null),new cljs.core.Symbol(null,"print-meta","print-meta",-1620321171,null),new cljs.core.Symbol(null,"print-length","print-length",-722569413,null),new cljs.core.Symbol(null,"print-level","print-level",-184892206,null)], null);
}));

(fipp.edn.EdnPrinter.cljs$lang$type = true);

(fipp.edn.EdnPrinter.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"fipp.edn/EdnPrinter",null,(1),null));
}));

(fipp.edn.EdnPrinter.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"fipp.edn/EdnPrinter");
}));

/**
 * Positional factory function for fipp.edn/EdnPrinter.
 */
fipp.edn.__GT_EdnPrinter = (function fipp$edn$__GT_EdnPrinter(symbols,print_meta,print_length,print_level){
return (new fipp.edn.EdnPrinter(symbols,print_meta,print_length,print_level,null,null,null));
});

/**
 * Factory function for fipp.edn/EdnPrinter, taking a map of keywords to field values.
 */
fipp.edn.map__GT_EdnPrinter = (function fipp$edn$map__GT_EdnPrinter(G__74251){
var extmap__5342__auto__ = (function (){var G__74371 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(G__74251,new cljs.core.Keyword(null,"symbols","symbols",1211743),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"print-meta","print-meta",1034114598),new cljs.core.Keyword(null,"print-length","print-length",1931866356),new cljs.core.Keyword(null,"print-level","print-level",-1825423733)], 0));
if(cljs.core.record_QMARK_(G__74251)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__74371);
} else {
return G__74371;
}
})();
return (new fipp.edn.EdnPrinter(new cljs.core.Keyword(null,"symbols","symbols",1211743).cljs$core$IFn$_invoke$arity$1(G__74251),new cljs.core.Keyword(null,"print-meta","print-meta",1034114598).cljs$core$IFn$_invoke$arity$1(G__74251),new cljs.core.Keyword(null,"print-length","print-length",1931866356).cljs$core$IFn$_invoke$arity$1(G__74251),new cljs.core.Keyword(null,"print-level","print-level",-1825423733).cljs$core$IFn$_invoke$arity$1(G__74251),null,cljs.core.not_empty(extmap__5342__auto__),null));
});

fipp.edn.pretty = (function fipp$edn$pretty(var_args){
var G__74381 = arguments.length;
switch (G__74381) {
case 1:
return fipp.edn.pretty.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return fipp.edn.pretty.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(fipp.edn.pretty.cljs$core$IFn$_invoke$arity$1 = (function (x){
return fipp.edn.pretty.cljs$core$IFn$_invoke$arity$2(x,cljs.core.PersistentArrayMap.EMPTY);
}));

(fipp.edn.pretty.cljs$core$IFn$_invoke$arity$2 = (function (x,options){
var defaults = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"symbols","symbols",1211743),cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"print-length","print-length",1931866356),cljs.core._STAR_print_length_STAR_,new cljs.core.Keyword(null,"print-level","print-level",-1825423733),cljs.core._STAR_print_level_STAR_,new cljs.core.Keyword(null,"print-meta","print-meta",1034114598),cljs.core._STAR_print_meta_STAR_], null);
var printer = fipp.edn.map__GT_EdnPrinter(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([defaults,options], 0)));
var _STAR_print_meta_STAR__orig_val__74385 = cljs.core._STAR_print_meta_STAR_;
var _STAR_print_meta_STAR__temp_val__74386 = false;
(cljs.core._STAR_print_meta_STAR_ = _STAR_print_meta_STAR__temp_val__74386);

try{return fipp.visit.visit(printer,x);
}finally {(cljs.core._STAR_print_meta_STAR_ = _STAR_print_meta_STAR__orig_val__74385);
}}));

(fipp.edn.pretty.cljs$lang$maxFixedArity = 2);

fipp.edn.pprint = (function fipp$edn$pprint(var_args){
var G__74388 = arguments.length;
switch (G__74388) {
case 1:
return fipp.edn.pprint.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return fipp.edn.pprint.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(fipp.edn.pprint.cljs$core$IFn$_invoke$arity$1 = (function (x){
return fipp.edn.pprint.cljs$core$IFn$_invoke$arity$2(x,cljs.core.PersistentArrayMap.EMPTY);
}));

(fipp.edn.pprint.cljs$core$IFn$_invoke$arity$2 = (function (x,options){
return fipp.engine.pprint_document.cljs$core$IFn$_invoke$arity$2(fipp.edn.pretty.cljs$core$IFn$_invoke$arity$2(x,options),options);
}));

(fipp.edn.pprint.cljs$lang$maxFixedArity = 2);


//# sourceMappingURL=fipp.edn.js.map
