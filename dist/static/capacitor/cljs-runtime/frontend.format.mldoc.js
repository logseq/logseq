goog.provide('frontend.format.mldoc');
goog.scope(function(){
  frontend.format.mldoc.goog$module$goog$object = goog.module.get('goog.object');
});
var module$node_modules$mldoc$index=shadow.js.require("module$node_modules$mldoc$index", {});
if((typeof frontend !== 'undefined') && (typeof frontend.format !== 'undefined') && (typeof frontend.format.mldoc !== 'undefined') && (typeof frontend.format.mldoc.anchorLink !== 'undefined')){
} else {
frontend.format.mldoc.anchorLink = frontend.format.mldoc.goog$module$goog$object.get(module$node_modules$mldoc$index.Mldoc,"anchorLink");
}
if((typeof frontend !== 'undefined') && (typeof frontend.format !== 'undefined') && (typeof frontend.format.mldoc !== 'undefined') && (typeof frontend.format.mldoc.parseOPML !== 'undefined')){
} else {
frontend.format.mldoc.parseOPML = frontend.format.mldoc.goog$module$goog$object.get(module$node_modules$mldoc$index.Mldoc,"parseOPML");
}
if((typeof frontend !== 'undefined') && (typeof frontend.format !== 'undefined') && (typeof frontend.format.mldoc !== 'undefined') && (typeof frontend.format.mldoc.parseAndExportMarkdown !== 'undefined')){
} else {
frontend.format.mldoc.parseAndExportMarkdown = frontend.format.mldoc.goog$module$goog$object.get(module$node_modules$mldoc$index.Mldoc,"parseAndExportMarkdown");
}
if((typeof frontend !== 'undefined') && (typeof frontend.format !== 'undefined') && (typeof frontend.format.mldoc !== 'undefined') && (typeof frontend.format.mldoc.parseAndExportOPML !== 'undefined')){
} else {
frontend.format.mldoc.parseAndExportOPML = frontend.format.mldoc.goog$module$goog$object.get(module$node_modules$mldoc$index.Mldoc,"parseAndExportOPML");
}
if((typeof frontend !== 'undefined') && (typeof frontend.format !== 'undefined') && (typeof frontend.format.mldoc !== 'undefined') && (typeof frontend.format.mldoc.export$ !== 'undefined')){
} else {
frontend.format.mldoc.export$ = frontend.format.mldoc.goog$module$goog$object.get(module$node_modules$mldoc$index.Mldoc,"export");
}
frontend.format.mldoc.parse_opml = (function frontend$format$mldoc$parse_opml(content){
return (frontend.format.mldoc.parseOPML.cljs$core$IFn$_invoke$arity$1 ? frontend.format.mldoc.parseOPML.cljs$core$IFn$_invoke$arity$1(content) : frontend.format.mldoc.parseOPML.call(null,content));
});
frontend.format.mldoc.parse_export_markdown = (function frontend$format$mldoc$parse_export_markdown(content,config,references){
var G__60355 = content;
var G__60356 = config;
var G__60357 = (function (){var or__5002__auto__ = references;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return logseq.graph_parser.mldoc.default_references;
}
})();
return (frontend.format.mldoc.parseAndExportMarkdown.cljs$core$IFn$_invoke$arity$3 ? frontend.format.mldoc.parseAndExportMarkdown.cljs$core$IFn$_invoke$arity$3(G__60355,G__60356,G__60357) : frontend.format.mldoc.parseAndExportMarkdown.call(null,G__60355,G__60356,G__60357));
});
frontend.format.mldoc.parse_export_opml = (function frontend$format$mldoc$parse_export_opml(content,config,title,references){
var G__60362 = content;
var G__60363 = config;
var G__60364 = title;
var G__60365 = (function (){var or__5002__auto__ = references;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return logseq.graph_parser.mldoc.default_references;
}
})();
return (frontend.format.mldoc.parseAndExportOPML.cljs$core$IFn$_invoke$arity$4 ? frontend.format.mldoc.parseAndExportOPML.cljs$core$IFn$_invoke$arity$4(G__60362,G__60363,G__60364,G__60365) : frontend.format.mldoc.parseAndExportOPML.call(null,G__60362,G__60363,G__60364,G__60365));
});
frontend.format.mldoc.block_with_title_QMARK_ = logseq.graph_parser.mldoc.block_with_title_QMARK_;
frontend.format.mldoc.opml__GT_edn = (function frontend$format$mldoc$opml__GT_edn(config,content){
try{if(clojure.string.blank_QMARK_(content)){
return cljs.core.PersistentArrayMap.EMPTY;
} else {
var vec__60371 = logseq.common.util.json__GT_clj(frontend.format.mldoc.parse_opml(content));
var headers = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__60371,(0),null);
var blocks = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__60371,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [headers,logseq.graph_parser.mldoc.collect_page_properties(blocks,config)], null);
}
}catch (e60366){var e = e60366;
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.format.mldoc",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("edn","convert-failed","edn/convert-failed",-1289012926),e,new cljs.core.Keyword(null,"line","line",212345235),47], null)),null);

return cljs.core.PersistentVector.EMPTY;
}});
frontend.format.mldoc.get_default_config = (function frontend$format$mldoc$get_default_config(format){
return logseq.graph_parser.mldoc.get_default_config(frontend.state.get_current_repo(),format);
});
frontend.format.mldoc.__GT_edn = (function frontend$format$mldoc$__GT_edn(content,format){
return logseq.graph_parser.mldoc.__GT_edn.cljs$core$IFn$_invoke$arity$3(frontend.state.get_current_repo(),content,format);
});

/**
* @constructor
 * @implements {cljs.core.IRecord}
 * @implements {cljs.core.IKVReduce}
 * @implements {cljs.core.IEquiv}
 * @implements {cljs.core.IHash}
 * @implements {cljs.core.ICollection}
 * @implements {cljs.core.ICounted}
 * @implements {cljs.core.ISeqable}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.ICloneable}
 * @implements {frontend.format.protocol.Format}
 * @implements {cljs.core.IPrintWithWriter}
 * @implements {cljs.core.IIterable}
 * @implements {cljs.core.IWithMeta}
 * @implements {cljs.core.IAssociative}
 * @implements {cljs.core.IMap}
 * @implements {cljs.core.ILookup}
*/
frontend.format.mldoc.MldocMode = (function (__meta,__extmap,__hash){
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(frontend.format.mldoc.MldocMode.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(frontend.format.mldoc.MldocMode.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k60375,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__60379 = k60375;
switch (G__60379) {
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k60375,else__5303__auto__);

}
}));

(frontend.format.mldoc.MldocMode.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__60380){
var vec__60381 = p__60380;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__60381,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__60381,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(frontend.format.mldoc.MldocMode.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#frontend.format.mldoc.MldocMode{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,self__.__extmap));
}));

(frontend.format.mldoc.MldocMode.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__60374){
var self__ = this;
var G__60374__$1 = this;
return (new cljs.core.RecordIter((0),G__60374__$1,0,cljs.core.PersistentVector.EMPTY,(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(frontend.format.mldoc.MldocMode.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(frontend.format.mldoc.MldocMode.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new frontend.format.mldoc.MldocMode(self__.__meta,self__.__extmap,self__.__hash));
}));

(frontend.format.mldoc.MldocMode.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (0 + cljs.core.count(self__.__extmap));
}));

(frontend.format.mldoc.MldocMode.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (-1887694766 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(frontend.format.mldoc.MldocMode.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this60376,other60377){
var self__ = this;
var this60376__$1 = this;
return (((!((other60377 == null)))) && ((((this60376__$1.constructor === other60377.constructor)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this60376__$1.__extmap,other60377.__extmap)))));
}));

(frontend.format.mldoc.MldocMode.prototype.frontend$format$protocol$Format$ = cljs.core.PROTOCOL_SENTINEL);

(frontend.format.mldoc.MldocMode.prototype.frontend$format$protocol$Format$toEdn$arity$3 = (function (_this,content,config){
var self__ = this;
var _this__$1 = this;
return logseq.graph_parser.mldoc.__GT_edn.cljs$core$IFn$_invoke$arity$2(content,config);
}));

(frontend.format.mldoc.MldocMode.prototype.frontend$format$protocol$Format$toHtml$arity$4 = (function (_this,content,config,references){
var self__ = this;
var _this__$1 = this;
return (frontend.format.mldoc.export$.cljs$core$IFn$_invoke$arity$4 ? frontend.format.mldoc.export$.cljs$core$IFn$_invoke$arity$4("html",content,config,references) : frontend.format.mldoc.export$.call(null,"html",content,config,references));
}));

(frontend.format.mldoc.MldocMode.prototype.frontend$format$protocol$Format$exportMarkdown$arity$4 = (function (_this,content,config,references){
var self__ = this;
var _this__$1 = this;
return frontend.format.mldoc.parse_export_markdown(content,config,references);
}));

(frontend.format.mldoc.MldocMode.prototype.frontend$format$protocol$Format$exportOPML$arity$5 = (function (_this,content,config,title,references){
var self__ = this;
var _this__$1 = this;
return frontend.format.mldoc.parse_export_opml(content,config,title,references);
}));

(frontend.format.mldoc.MldocMode.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(cljs.core.PersistentHashSet.EMPTY,k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new frontend.format.mldoc.MldocMode(self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(frontend.format.mldoc.MldocMode.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k60375){
var self__ = this;
var this__5307__auto____$1 = this;
return cljs.core.contains_QMARK_(self__.__extmap,k60375);
}));

(frontend.format.mldoc.MldocMode.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__60374){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__60426 = cljs.core.keyword_identical_QMARK_;
var expr__60427 = k__5309__auto__;
return (new frontend.format.mldoc.MldocMode(self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__60374),null));
}));

(frontend.format.mldoc.MldocMode.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,self__.__extmap));
}));

(frontend.format.mldoc.MldocMode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__60374){
var self__ = this;
var this__5299__auto____$1 = this;
return (new frontend.format.mldoc.MldocMode(G__60374,self__.__extmap,self__.__hash));
}));

(frontend.format.mldoc.MldocMode.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(frontend.format.mldoc.MldocMode.getBasis = (function (){
return cljs.core.PersistentVector.EMPTY;
}));

(frontend.format.mldoc.MldocMode.cljs$lang$type = true);

(frontend.format.mldoc.MldocMode.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"frontend.format.mldoc/MldocMode",null,(1),null));
}));

(frontend.format.mldoc.MldocMode.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"frontend.format.mldoc/MldocMode");
}));

/**
 * Positional factory function for frontend.format.mldoc/MldocMode.
 */
frontend.format.mldoc.__GT_MldocMode = (function frontend$format$mldoc$__GT_MldocMode(){
return (new frontend.format.mldoc.MldocMode(null,null,null));
});

/**
 * Factory function for frontend.format.mldoc/MldocMode, taking a map of keywords to field values.
 */
frontend.format.mldoc.map__GT_MldocMode = (function frontend$format$mldoc$map__GT_MldocMode(G__60378){
var extmap__5342__auto__ = (function (){var G__60444 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$1(G__60378);
if(cljs.core.record_QMARK_(G__60378)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__60444);
} else {
return G__60444;
}
})();
return (new frontend.format.mldoc.MldocMode(null,cljs.core.not_empty(extmap__5342__auto__),null));
});

frontend.format.mldoc.plain__GT_text = (function frontend$format$mldoc$plain__GT_text(plains){
return clojure.string.join.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.last,plains));
});
frontend.format.mldoc.properties_QMARK_ = logseq.graph_parser.mldoc.properties_QMARK_;
frontend.format.mldoc.typ_drawer_QMARK_ = (function frontend$format$mldoc$typ_drawer_QMARK_(ast,typ){
return ((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, ["Drawer",null], null), null),cljs.core.ffirst(ast))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(typ,cljs.core.second(cljs.core.first(ast)))));
});
frontend.format.mldoc.extract_first_query_from_ast = (function frontend$format$mldoc$extract_first_query_from_ast(ast){
var _STAR_result = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
clojure.walk.postwalk((function (f){
if(((cljs.core.vector_QMARK_(f)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Custom",cljs.core.first(f))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("query",cljs.core.second(f))))))){
return cljs.core.reset_BANG_(_STAR_result,cljs.core.last(f));
} else {
return f;
}
}),ast);

return cljs.core.deref(_STAR_result);
});
/**
 * parses content and returns [title body]
 * returns nil if no title
 */
frontend.format.mldoc.get_title_AMPERSAND_body = (function frontend$format$mldoc$get_title_AMPERSAND_body(content,format){
var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
return logseq.graph_parser.mldoc.get_title_AMPERSAND_body(repo,content,format);
} else {
return null;
}
});

//# sourceMappingURL=frontend.format.mldoc.js.map
