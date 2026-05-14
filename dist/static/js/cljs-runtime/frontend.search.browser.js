goog.provide('frontend.search.browser');

/**
* @constructor
 * @implements {frontend.search.protocol.Engine}
 * @implements {cljs.core.IRecord}
 * @implements {cljs.core.IKVReduce}
 * @implements {cljs.core.IEquiv}
 * @implements {cljs.core.IHash}
 * @implements {cljs.core.ICollection}
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
frontend.search.browser.Browser = (function (repo,__meta,__extmap,__hash){
this.repo = repo;
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(frontend.search.browser.Browser.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(frontend.search.browser.Browser.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k101991,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__101995 = k101991;
var G__101995__$1 = (((G__101995 instanceof cljs.core.Keyword))?G__101995.fqn:null);
switch (G__101995__$1) {
case "repo":
return self__.repo;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k101991,else__5303__auto__);

}
}));

(frontend.search.browser.Browser.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__101996){
var vec__101997 = p__101996;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101997,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101997,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(frontend.search.browser.Browser.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#frontend.search.browser.Browser{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"repo","repo",-1999060679),self__.repo],null))], null),self__.__extmap));
}));

(frontend.search.browser.Browser.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__101990){
var self__ = this;
var G__101990__$1 = this;
return (new cljs.core.RecordIter((0),G__101990__$1,1,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"repo","repo",-1999060679)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(frontend.search.browser.Browser.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(frontend.search.browser.Browser.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new frontend.search.browser.Browser(self__.repo,self__.__meta,self__.__extmap,self__.__hash));
}));

(frontend.search.browser.Browser.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (1 + cljs.core.count(self__.__extmap));
}));

(frontend.search.browser.Browser.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (-1998111184 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(frontend.search.browser.Browser.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this101992,other101993){
var self__ = this;
var this101992__$1 = this;
return (((!((other101993 == null)))) && ((((this101992__$1.constructor === other101993.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this101992__$1.repo,other101993.repo)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this101992__$1.__extmap,other101993.__extmap)))))));
}));

(frontend.search.browser.Browser.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"repo","repo",-1999060679),null], null), null),k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new frontend.search.browser.Browser(self__.repo,self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(frontend.search.browser.Browser.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k101991){
var self__ = this;
var this__5307__auto____$1 = this;
var G__102000 = k101991;
var G__102000__$1 = (((G__102000 instanceof cljs.core.Keyword))?G__102000.fqn:null);
switch (G__102000__$1) {
case "repo":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k101991);

}
}));

(frontend.search.browser.Browser.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__101990){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__102001 = cljs.core.keyword_identical_QMARK_;
var expr__102002 = k__5309__auto__;
if(cljs.core.truth_((pred__102001.cljs$core$IFn$_invoke$arity$2 ? pred__102001.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"repo","repo",-1999060679),expr__102002) : pred__102001.call(null,new cljs.core.Keyword(null,"repo","repo",-1999060679),expr__102002)))){
return (new frontend.search.browser.Browser(G__101990,self__.__meta,self__.__extmap,null));
} else {
return (new frontend.search.browser.Browser(self__.repo,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__101990),null));
}
}));

(frontend.search.browser.Browser.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"repo","repo",-1999060679),self__.repo,null))], null),self__.__extmap));
}));

(frontend.search.browser.Browser.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__101990){
var self__ = this;
var this__5299__auto____$1 = this;
return (new frontend.search.browser.Browser(self__.repo,G__101990,self__.__extmap,self__.__hash));
}));

(frontend.search.browser.Browser.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(frontend.search.browser.Browser.prototype.frontend$search$protocol$Engine$ = cljs.core.PROTOCOL_SENTINEL);

(frontend.search.browser.Browser.prototype.frontend$search$protocol$Engine$query$arity$3 = (function (_this,q,option){
var self__ = this;
var _this__$1 = this;
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","search-blocks","thread-api/search-blocks",1217984294),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),q,option], 0));
}));

(frontend.search.browser.Browser.prototype.frontend$search$protocol$Engine$rebuild_pages_indice_BANG_$arity$1 = (function (_this){
var self__ = this;
var _this__$1 = this;
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","search-build-pages-indice","thread-api/search-build-pages-indice",-658848803),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([self__.repo], 0));
}));

(frontend.search.browser.Browser.prototype.frontend$search$protocol$Engine$rebuild_blocks_indice_BANG_$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.get_current_repo()),(function (repo__$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.config.local_file_based_graph_QMARK_(repo__$1)),(function (file_based_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise(this$__$1.frontend$search$protocol$Engine$truncate_blocks_BANG_$arity$1(null)),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","search-build-blocks-indice","thread-api/search-build-blocks-indice",1530364112),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([repo__$1], 0))),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(file_based_QMARK_)?cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__101989_SHARP_){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(p1__101989_SHARP_,new cljs.core.Keyword(null,"content","content",15833224),(function (content){
return frontend.handler.file_based.property.util.remove_built_in_properties(cljs.core.get.cljs$core$IFn$_invoke$arity$3(p1__101989_SHARP_,new cljs.core.Keyword(null,"format","format",-1306924766),new cljs.core.Keyword(null,"markdown","markdown",1227225089)),content);
}));
}),result):result)),(function (blocks){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core.seq(blocks))?frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","search-upsert-blocks","thread-api/search-upsert-blocks",802527035),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([repo__$1,blocks], 0)):null)),(function (___$1){
return promesa.impl.resolved(null);
}));
}));
}));
}));
}));
}));
}));
}));

(frontend.search.browser.Browser.prototype.frontend$search$protocol$Engine$transact_blocks_BANG_$arity$2 = (function (_this,p__102004){
var self__ = this;
var map__102005 = p__102004;
var map__102005__$1 = cljs.core.__destructure_map(map__102005);
var blocks_to_remove_set = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102005__$1,new cljs.core.Keyword(null,"blocks-to-remove-set","blocks-to-remove-set",266406009));
var blocks_to_add = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102005__$1,new cljs.core.Keyword(null,"blocks-to-add","blocks-to-add",-814061792));
var _this__$1 = this;
var repo__$1 = frontend.state.get_current_repo();
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core.seq(blocks_to_remove_set))?frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","search-delete-blocks","thread-api/search-delete-blocks",2049847839),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([repo__$1,blocks_to_remove_set], 0)):null)),(function (_){
return promesa.protocols._promise(((cljs.core.seq(blocks_to_add))?frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","search-upsert-blocks","thread-api/search-upsert-blocks",802527035),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([repo__$1,blocks_to_add], 0)):null));
}));
}));
}));

(frontend.search.browser.Browser.prototype.frontend$search$protocol$Engine$truncate_blocks_BANG_$arity$1 = (function (_this){
var self__ = this;
var _this__$1 = this;
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","search-truncate-tables","thread-api/search-truncate-tables",-2046581559),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo()], 0));
}));

(frontend.search.browser.Browser.prototype.frontend$search$protocol$Engine$remove_db_BANG_$arity$1 = (function (_this){
var self__ = this;
var _this__$1 = this;
return promesa.core.resolved(null);
}));

(frontend.search.browser.Browser.getBasis = (function (){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"repo","repo",-358529152,null)], null);
}));

(frontend.search.browser.Browser.cljs$lang$type = true);

(frontend.search.browser.Browser.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"frontend.search.browser/Browser",null,(1),null));
}));

(frontend.search.browser.Browser.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"frontend.search.browser/Browser");
}));

/**
 * Positional factory function for frontend.search.browser/Browser.
 */
frontend.search.browser.__GT_Browser = (function frontend$search$browser$__GT_Browser(repo){
return (new frontend.search.browser.Browser(repo,null,null,null));
});

/**
 * Factory function for frontend.search.browser/Browser, taking a map of keywords to field values.
 */
frontend.search.browser.map__GT_Browser = (function frontend$search$browser$map__GT_Browser(G__101994){
var extmap__5342__auto__ = (function (){var G__102006 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(G__101994,new cljs.core.Keyword(null,"repo","repo",-1999060679));
if(cljs.core.record_QMARK_(G__101994)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__102006);
} else {
return G__102006;
}
})();
return (new frontend.search.browser.Browser(new cljs.core.Keyword(null,"repo","repo",-1999060679).cljs$core$IFn$_invoke$arity$1(G__101994),null,cljs.core.not_empty(extmap__5342__auto__),null));
});


//# sourceMappingURL=frontend.search.browser.js.map
