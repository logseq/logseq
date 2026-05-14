goog.provide('instaparse.gll');
instaparse.gll._STAR_diagnostic_char_lookahead_STAR_ = (10);

instaparse.gll.get_parser = (function instaparse$gll$get_parser(grammar,p){
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(grammar,p,p);
});














instaparse.gll._parse = (function instaparse$gll$_parse(parser,index,tramp){

var G__136273 = new cljs.core.Keyword(null,"tag","tag",-1290361223).cljs$core$IFn$_invoke$arity$1(parser);
var G__136273__$1 = (((G__136273 instanceof cljs.core.Keyword))?G__136273.fqn:null);
switch (G__136273__$1) {
case "nt":
return (instaparse.gll.non_terminal_parse.cljs$core$IFn$_invoke$arity$3 ? instaparse.gll.non_terminal_parse.cljs$core$IFn$_invoke$arity$3(parser,index,tramp) : instaparse.gll.non_terminal_parse.call(null,parser,index,tramp));

break;
case "alt":
return (instaparse.gll.alt_parse.cljs$core$IFn$_invoke$arity$3 ? instaparse.gll.alt_parse.cljs$core$IFn$_invoke$arity$3(parser,index,tramp) : instaparse.gll.alt_parse.call(null,parser,index,tramp));

break;
case "cat":
return (instaparse.gll.cat_parse.cljs$core$IFn$_invoke$arity$3 ? instaparse.gll.cat_parse.cljs$core$IFn$_invoke$arity$3(parser,index,tramp) : instaparse.gll.cat_parse.call(null,parser,index,tramp));

break;
case "string":
return (instaparse.gll.string_parse.cljs$core$IFn$_invoke$arity$3 ? instaparse.gll.string_parse.cljs$core$IFn$_invoke$arity$3(parser,index,tramp) : instaparse.gll.string_parse.call(null,parser,index,tramp));

break;
case "string-ci":
return (instaparse.gll.string_case_insensitive_parse.cljs$core$IFn$_invoke$arity$3 ? instaparse.gll.string_case_insensitive_parse.cljs$core$IFn$_invoke$arity$3(parser,index,tramp) : instaparse.gll.string_case_insensitive_parse.call(null,parser,index,tramp));

break;
case "char":
return (instaparse.gll.char_range_parse.cljs$core$IFn$_invoke$arity$3 ? instaparse.gll.char_range_parse.cljs$core$IFn$_invoke$arity$3(parser,index,tramp) : instaparse.gll.char_range_parse.call(null,parser,index,tramp));

break;
case "epsilon":
return (instaparse.gll.epsilon_parse.cljs$core$IFn$_invoke$arity$3 ? instaparse.gll.epsilon_parse.cljs$core$IFn$_invoke$arity$3(parser,index,tramp) : instaparse.gll.epsilon_parse.call(null,parser,index,tramp));

break;
case "opt":
return (instaparse.gll.opt_parse.cljs$core$IFn$_invoke$arity$3 ? instaparse.gll.opt_parse.cljs$core$IFn$_invoke$arity$3(parser,index,tramp) : instaparse.gll.opt_parse.call(null,parser,index,tramp));

break;
case "plus":
return (instaparse.gll.plus_parse.cljs$core$IFn$_invoke$arity$3 ? instaparse.gll.plus_parse.cljs$core$IFn$_invoke$arity$3(parser,index,tramp) : instaparse.gll.plus_parse.call(null,parser,index,tramp));

break;
case "rep":
return (instaparse.gll.rep_parse.cljs$core$IFn$_invoke$arity$3 ? instaparse.gll.rep_parse.cljs$core$IFn$_invoke$arity$3(parser,index,tramp) : instaparse.gll.rep_parse.call(null,parser,index,tramp));

break;
case "star":
return (instaparse.gll.star_parse.cljs$core$IFn$_invoke$arity$3 ? instaparse.gll.star_parse.cljs$core$IFn$_invoke$arity$3(parser,index,tramp) : instaparse.gll.star_parse.call(null,parser,index,tramp));

break;
case "regexp":
return (instaparse.gll.regexp_parse.cljs$core$IFn$_invoke$arity$3 ? instaparse.gll.regexp_parse.cljs$core$IFn$_invoke$arity$3(parser,index,tramp) : instaparse.gll.regexp_parse.call(null,parser,index,tramp));

break;
case "look":
return (instaparse.gll.lookahead_parse.cljs$core$IFn$_invoke$arity$3 ? instaparse.gll.lookahead_parse.cljs$core$IFn$_invoke$arity$3(parser,index,tramp) : instaparse.gll.lookahead_parse.call(null,parser,index,tramp));

break;
case "neg":
return (instaparse.gll.negative_lookahead_parse.cljs$core$IFn$_invoke$arity$3 ? instaparse.gll.negative_lookahead_parse.cljs$core$IFn$_invoke$arity$3(parser,index,tramp) : instaparse.gll.negative_lookahead_parse.call(null,parser,index,tramp));

break;
case "ord":
return (instaparse.gll.ordered_alt_parse.cljs$core$IFn$_invoke$arity$3 ? instaparse.gll.ordered_alt_parse.cljs$core$IFn$_invoke$arity$3(parser,index,tramp) : instaparse.gll.ordered_alt_parse.call(null,parser,index,tramp));

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__136273__$1)].join('')));

}
});













instaparse.gll._full_parse = (function instaparse$gll$_full_parse(parser,index,tramp){

var G__136290 = new cljs.core.Keyword(null,"tag","tag",-1290361223).cljs$core$IFn$_invoke$arity$1(parser);
var G__136290__$1 = (((G__136290 instanceof cljs.core.Keyword))?G__136290.fqn:null);
switch (G__136290__$1) {
case "nt":
return (instaparse.gll.non_terminal_full_parse.cljs$core$IFn$_invoke$arity$3 ? instaparse.gll.non_terminal_full_parse.cljs$core$IFn$_invoke$arity$3(parser,index,tramp) : instaparse.gll.non_terminal_full_parse.call(null,parser,index,tramp));

break;
case "alt":
return (instaparse.gll.alt_full_parse.cljs$core$IFn$_invoke$arity$3 ? instaparse.gll.alt_full_parse.cljs$core$IFn$_invoke$arity$3(parser,index,tramp) : instaparse.gll.alt_full_parse.call(null,parser,index,tramp));

break;
case "cat":
return (instaparse.gll.cat_full_parse.cljs$core$IFn$_invoke$arity$3 ? instaparse.gll.cat_full_parse.cljs$core$IFn$_invoke$arity$3(parser,index,tramp) : instaparse.gll.cat_full_parse.call(null,parser,index,tramp));

break;
case "string":
return (instaparse.gll.string_full_parse.cljs$core$IFn$_invoke$arity$3 ? instaparse.gll.string_full_parse.cljs$core$IFn$_invoke$arity$3(parser,index,tramp) : instaparse.gll.string_full_parse.call(null,parser,index,tramp));

break;
case "string-ci":
return (instaparse.gll.string_case_insensitive_full_parse.cljs$core$IFn$_invoke$arity$3 ? instaparse.gll.string_case_insensitive_full_parse.cljs$core$IFn$_invoke$arity$3(parser,index,tramp) : instaparse.gll.string_case_insensitive_full_parse.call(null,parser,index,tramp));

break;
case "char":
return (instaparse.gll.char_range_full_parse.cljs$core$IFn$_invoke$arity$3 ? instaparse.gll.char_range_full_parse.cljs$core$IFn$_invoke$arity$3(parser,index,tramp) : instaparse.gll.char_range_full_parse.call(null,parser,index,tramp));

break;
case "epsilon":
return (instaparse.gll.epsilon_full_parse.cljs$core$IFn$_invoke$arity$3 ? instaparse.gll.epsilon_full_parse.cljs$core$IFn$_invoke$arity$3(parser,index,tramp) : instaparse.gll.epsilon_full_parse.call(null,parser,index,tramp));

break;
case "opt":
return (instaparse.gll.opt_full_parse.cljs$core$IFn$_invoke$arity$3 ? instaparse.gll.opt_full_parse.cljs$core$IFn$_invoke$arity$3(parser,index,tramp) : instaparse.gll.opt_full_parse.call(null,parser,index,tramp));

break;
case "plus":
return (instaparse.gll.plus_full_parse.cljs$core$IFn$_invoke$arity$3 ? instaparse.gll.plus_full_parse.cljs$core$IFn$_invoke$arity$3(parser,index,tramp) : instaparse.gll.plus_full_parse.call(null,parser,index,tramp));

break;
case "rep":
return (instaparse.gll.rep_full_parse.cljs$core$IFn$_invoke$arity$3 ? instaparse.gll.rep_full_parse.cljs$core$IFn$_invoke$arity$3(parser,index,tramp) : instaparse.gll.rep_full_parse.call(null,parser,index,tramp));

break;
case "star":
return (instaparse.gll.star_full_parse.cljs$core$IFn$_invoke$arity$3 ? instaparse.gll.star_full_parse.cljs$core$IFn$_invoke$arity$3(parser,index,tramp) : instaparse.gll.star_full_parse.call(null,parser,index,tramp));

break;
case "regexp":
return (instaparse.gll.regexp_full_parse.cljs$core$IFn$_invoke$arity$3 ? instaparse.gll.regexp_full_parse.cljs$core$IFn$_invoke$arity$3(parser,index,tramp) : instaparse.gll.regexp_full_parse.call(null,parser,index,tramp));

break;
case "look":
return (instaparse.gll.lookahead_full_parse.cljs$core$IFn$_invoke$arity$3 ? instaparse.gll.lookahead_full_parse.cljs$core$IFn$_invoke$arity$3(parser,index,tramp) : instaparse.gll.lookahead_full_parse.call(null,parser,index,tramp));

break;
case "neg":
return (instaparse.gll.negative_lookahead_parse.cljs$core$IFn$_invoke$arity$3 ? instaparse.gll.negative_lookahead_parse.cljs$core$IFn$_invoke$arity$3(parser,index,tramp) : instaparse.gll.negative_lookahead_parse.call(null,parser,index,tramp));

break;
case "ord":
return (instaparse.gll.ordered_alt_full_parse.cljs$core$IFn$_invoke$arity$3 ? instaparse.gll.ordered_alt_full_parse.cljs$core$IFn$_invoke$arity$3(parser,index,tramp) : instaparse.gll.ordered_alt_full_parse.call(null,parser,index,tramp));

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__136290__$1)].join('')));

}
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
 * @implements {cljs.core.IPrintWithWriter}
 * @implements {cljs.core.IIterable}
 * @implements {cljs.core.IWithMeta}
 * @implements {cljs.core.IAssociative}
 * @implements {cljs.core.IMap}
 * @implements {cljs.core.ILookup}
*/
instaparse.gll.Failure = (function (index,reason,__meta,__extmap,__hash){
this.index = index;
this.reason = reason;
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(instaparse.gll.Failure.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(instaparse.gll.Failure.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k136296,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__136321 = k136296;
var G__136321__$1 = (((G__136321 instanceof cljs.core.Keyword))?G__136321.fqn:null);
switch (G__136321__$1) {
case "index":
return self__.index;

break;
case "reason":
return self__.reason;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k136296,else__5303__auto__);

}
}));

(instaparse.gll.Failure.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__136336){
var vec__136337 = p__136336;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__136337,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__136337,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(instaparse.gll.Failure.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#instaparse.gll.Failure{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"index","index",-1531685915),self__.index],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"reason","reason",-2070751759),self__.reason],null))], null),self__.__extmap));
}));

(instaparse.gll.Failure.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__136295){
var self__ = this;
var G__136295__$1 = this;
return (new cljs.core.RecordIter((0),G__136295__$1,2,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"index","index",-1531685915),new cljs.core.Keyword(null,"reason","reason",-2070751759)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(instaparse.gll.Failure.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(instaparse.gll.Failure.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new instaparse.gll.Failure(self__.index,self__.reason,self__.__meta,self__.__extmap,self__.__hash));
}));

(instaparse.gll.Failure.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (2 + cljs.core.count(self__.__extmap));
}));

(instaparse.gll.Failure.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (-1140991288 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(instaparse.gll.Failure.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this136298,other136299){
var self__ = this;
var this136298__$1 = this;
return (((!((other136299 == null)))) && ((((this136298__$1.constructor === other136299.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this136298__$1.index,other136299.index)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this136298__$1.reason,other136299.reason)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this136298__$1.__extmap,other136299.__extmap)))))))));
}));

(instaparse.gll.Failure.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"index","index",-1531685915),null,new cljs.core.Keyword(null,"reason","reason",-2070751759),null], null), null),k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new instaparse.gll.Failure(self__.index,self__.reason,self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(instaparse.gll.Failure.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k136296){
var self__ = this;
var this__5307__auto____$1 = this;
var G__136365 = k136296;
var G__136365__$1 = (((G__136365 instanceof cljs.core.Keyword))?G__136365.fqn:null);
switch (G__136365__$1) {
case "index":
case "reason":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k136296);

}
}));

(instaparse.gll.Failure.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__136295){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__136369 = cljs.core.keyword_identical_QMARK_;
var expr__136370 = k__5309__auto__;
if(cljs.core.truth_((pred__136369.cljs$core$IFn$_invoke$arity$2 ? pred__136369.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"index","index",-1531685915),expr__136370) : pred__136369.call(null,new cljs.core.Keyword(null,"index","index",-1531685915),expr__136370)))){
return (new instaparse.gll.Failure(G__136295,self__.reason,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__136369.cljs$core$IFn$_invoke$arity$2 ? pred__136369.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"reason","reason",-2070751759),expr__136370) : pred__136369.call(null,new cljs.core.Keyword(null,"reason","reason",-2070751759),expr__136370)))){
return (new instaparse.gll.Failure(self__.index,G__136295,self__.__meta,self__.__extmap,null));
} else {
return (new instaparse.gll.Failure(self__.index,self__.reason,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__136295),null));
}
}
}));

(instaparse.gll.Failure.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"index","index",-1531685915),self__.index,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"reason","reason",-2070751759),self__.reason,null))], null),self__.__extmap));
}));

(instaparse.gll.Failure.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__136295){
var self__ = this;
var this__5299__auto____$1 = this;
return (new instaparse.gll.Failure(self__.index,self__.reason,G__136295,self__.__extmap,self__.__hash));
}));

(instaparse.gll.Failure.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(instaparse.gll.Failure.getBasis = (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"index","index",108845612,null),new cljs.core.Symbol(null,"reason","reason",-430220232,null)], null);
}));

(instaparse.gll.Failure.cljs$lang$type = true);

(instaparse.gll.Failure.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"instaparse.gll/Failure",null,(1),null));
}));

(instaparse.gll.Failure.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"instaparse.gll/Failure");
}));

/**
 * Positional factory function for instaparse.gll/Failure.
 */
instaparse.gll.__GT_Failure = (function instaparse$gll$__GT_Failure(index,reason){
return (new instaparse.gll.Failure(index,reason,null,null,null));
});

/**
 * Factory function for instaparse.gll/Failure, taking a map of keywords to field values.
 */
instaparse.gll.map__GT_Failure = (function instaparse$gll$map__GT_Failure(G__136304){
var extmap__5342__auto__ = (function (){var G__136392 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(G__136304,new cljs.core.Keyword(null,"index","index",-1531685915),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"reason","reason",-2070751759)], 0));
if(cljs.core.record_QMARK_(G__136304)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__136392);
} else {
return G__136392;
}
})();
return (new instaparse.gll.Failure(new cljs.core.Keyword(null,"index","index",-1531685915).cljs$core$IFn$_invoke$arity$1(G__136304),new cljs.core.Keyword(null,"reason","reason",-2070751759).cljs$core$IFn$_invoke$arity$1(G__136304),null,cljs.core.not_empty(extmap__5342__auto__),null));
});

(instaparse.gll.Failure.prototype.cljs$core$IPrintWithWriter$ = cljs.core.PROTOCOL_SENTINEL);

(instaparse.gll.Failure.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (fail,writer,_){
var fail__$1 = this;
return cljs.core._write(writer,(function (){var sb__5647__auto__ = (new goog.string.StringBuffer());
var _STAR_print_newline_STAR__orig_val__136400_136879 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__orig_val__136401_136880 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_newline_STAR__temp_val__136402_136881 = true;
var _STAR_print_fn_STAR__temp_val__136403_136882 = (function (x__5648__auto__){
return sb__5647__auto__.append(x__5648__auto__);
});
(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__136402_136881);

(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__136403_136882);

try{instaparse.failure.pprint_failure(fail__$1);
}finally {(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__136401_136880);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__136400_136879);
}
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(sb__5647__auto__);
})());
}));
instaparse.gll.failure_type = cljs.core.type((new instaparse.gll.Failure(null,null,null,null,null)));
instaparse.gll.text__GT_segment = (function instaparse$gll$text__GT_segment(text){
return text;
});
instaparse.gll.sub_sequence = cljs.core.subs;

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
 * @implements {cljs.core.IPrintWithWriter}
 * @implements {cljs.core.IIterable}
 * @implements {cljs.core.IWithMeta}
 * @implements {cljs.core.IAssociative}
 * @implements {cljs.core.IMap}
 * @implements {cljs.core.ILookup}
*/
instaparse.gll.Tramp = (function (grammar,text,segment,fail_index,node_builder,stack,next_stack,generation,negative_listeners,msg_cache,nodes,success,failure,trace_QMARK_,__meta,__extmap,__hash){
this.grammar = grammar;
this.text = text;
this.segment = segment;
this.fail_index = fail_index;
this.node_builder = node_builder;
this.stack = stack;
this.next_stack = next_stack;
this.generation = generation;
this.negative_listeners = negative_listeners;
this.msg_cache = msg_cache;
this.nodes = nodes;
this.success = success;
this.failure = failure;
this.trace_QMARK_ = trace_QMARK_;
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(instaparse.gll.Tramp.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(instaparse.gll.Tramp.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k136420,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__136441 = k136420;
var G__136441__$1 = (((G__136441 instanceof cljs.core.Keyword))?G__136441.fqn:null);
switch (G__136441__$1) {
case "grammar":
return self__.grammar;

break;
case "text":
return self__.text;

break;
case "segment":
return self__.segment;

break;
case "fail-index":
return self__.fail_index;

break;
case "node-builder":
return self__.node_builder;

break;
case "stack":
return self__.stack;

break;
case "next-stack":
return self__.next_stack;

break;
case "generation":
return self__.generation;

break;
case "negative-listeners":
return self__.negative_listeners;

break;
case "msg-cache":
return self__.msg_cache;

break;
case "nodes":
return self__.nodes;

break;
case "success":
return self__.success;

break;
case "failure":
return self__.failure;

break;
case "trace?":
return self__.trace_QMARK_;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k136420,else__5303__auto__);

}
}));

(instaparse.gll.Tramp.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__136449){
var vec__136450 = p__136449;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__136450,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__136450,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(instaparse.gll.Tramp.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#instaparse.gll.Tramp{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 14, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"grammar","grammar",1881328267),self__.grammar],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"text","text",-1790561697),self__.text],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"segment","segment",-964921196),self__.segment],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"fail-index","fail-index",248726923),self__.fail_index],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"node-builder","node-builder",-1956562605),self__.node_builder],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"stack","stack",-793405930),self__.stack],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"next-stack","next-stack",-481930728),self__.next_stack],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"generation","generation",-2132542044),self__.generation],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"negative-listeners","negative-listeners",55241092),self__.negative_listeners],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"msg-cache","msg-cache",-733775070),self__.msg_cache],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"nodes","nodes",-2099585805),self__.nodes],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"success","success",1890645906),self__.success],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"failure","failure",720415879),self__.failure],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"trace?","trace?",1730690679),self__.trace_QMARK_],null))], null),self__.__extmap));
}));

(instaparse.gll.Tramp.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__136419){
var self__ = this;
var G__136419__$1 = this;
return (new cljs.core.RecordIter((0),G__136419__$1,14,new cljs.core.PersistentVector(null, 14, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"grammar","grammar",1881328267),new cljs.core.Keyword(null,"text","text",-1790561697),new cljs.core.Keyword(null,"segment","segment",-964921196),new cljs.core.Keyword(null,"fail-index","fail-index",248726923),new cljs.core.Keyword(null,"node-builder","node-builder",-1956562605),new cljs.core.Keyword(null,"stack","stack",-793405930),new cljs.core.Keyword(null,"next-stack","next-stack",-481930728),new cljs.core.Keyword(null,"generation","generation",-2132542044),new cljs.core.Keyword(null,"negative-listeners","negative-listeners",55241092),new cljs.core.Keyword(null,"msg-cache","msg-cache",-733775070),new cljs.core.Keyword(null,"nodes","nodes",-2099585805),new cljs.core.Keyword(null,"success","success",1890645906),new cljs.core.Keyword(null,"failure","failure",720415879),new cljs.core.Keyword(null,"trace?","trace?",1730690679)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(instaparse.gll.Tramp.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(instaparse.gll.Tramp.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new instaparse.gll.Tramp(self__.grammar,self__.text,self__.segment,self__.fail_index,self__.node_builder,self__.stack,self__.next_stack,self__.generation,self__.negative_listeners,self__.msg_cache,self__.nodes,self__.success,self__.failure,self__.trace_QMARK_,self__.__meta,self__.__extmap,self__.__hash));
}));

(instaparse.gll.Tramp.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (14 + cljs.core.count(self__.__extmap));
}));

(instaparse.gll.Tramp.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (166878148 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(instaparse.gll.Tramp.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this136421,other136422){
var self__ = this;
var this136421__$1 = this;
return (((!((other136422 == null)))) && ((((this136421__$1.constructor === other136422.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this136421__$1.grammar,other136422.grammar)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this136421__$1.text,other136422.text)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this136421__$1.segment,other136422.segment)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this136421__$1.fail_index,other136422.fail_index)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this136421__$1.node_builder,other136422.node_builder)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this136421__$1.stack,other136422.stack)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this136421__$1.next_stack,other136422.next_stack)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this136421__$1.generation,other136422.generation)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this136421__$1.negative_listeners,other136422.negative_listeners)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this136421__$1.msg_cache,other136422.msg_cache)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this136421__$1.nodes,other136422.nodes)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this136421__$1.success,other136422.success)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this136421__$1.failure,other136422.failure)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this136421__$1.trace_QMARK_,other136422.trace_QMARK_)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this136421__$1.__extmap,other136422.__extmap)))))))))))))))))))))))))))))))));
}));

(instaparse.gll.Tramp.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 14, [new cljs.core.Keyword(null,"msg-cache","msg-cache",-733775070),null,new cljs.core.Keyword(null,"negative-listeners","negative-listeners",55241092),null,new cljs.core.Keyword(null,"generation","generation",-2132542044),null,new cljs.core.Keyword(null,"failure","failure",720415879),null,new cljs.core.Keyword(null,"fail-index","fail-index",248726923),null,new cljs.core.Keyword(null,"grammar","grammar",1881328267),null,new cljs.core.Keyword(null,"success","success",1890645906),null,new cljs.core.Keyword(null,"nodes","nodes",-2099585805),null,new cljs.core.Keyword(null,"node-builder","node-builder",-1956562605),null,new cljs.core.Keyword(null,"segment","segment",-964921196),null,new cljs.core.Keyword(null,"stack","stack",-793405930),null,new cljs.core.Keyword(null,"trace?","trace?",1730690679),null,new cljs.core.Keyword(null,"next-stack","next-stack",-481930728),null,new cljs.core.Keyword(null,"text","text",-1790561697),null], null), null),k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new instaparse.gll.Tramp(self__.grammar,self__.text,self__.segment,self__.fail_index,self__.node_builder,self__.stack,self__.next_stack,self__.generation,self__.negative_listeners,self__.msg_cache,self__.nodes,self__.success,self__.failure,self__.trace_QMARK_,self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(instaparse.gll.Tramp.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k136420){
var self__ = this;
var this__5307__auto____$1 = this;
var G__136528 = k136420;
var G__136528__$1 = (((G__136528 instanceof cljs.core.Keyword))?G__136528.fqn:null);
switch (G__136528__$1) {
case "grammar":
case "text":
case "segment":
case "fail-index":
case "node-builder":
case "stack":
case "next-stack":
case "generation":
case "negative-listeners":
case "msg-cache":
case "nodes":
case "success":
case "failure":
case "trace?":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k136420);

}
}));

(instaparse.gll.Tramp.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__136419){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__136529 = cljs.core.keyword_identical_QMARK_;
var expr__136530 = k__5309__auto__;
if(cljs.core.truth_((pred__136529.cljs$core$IFn$_invoke$arity$2 ? pred__136529.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"grammar","grammar",1881328267),expr__136530) : pred__136529.call(null,new cljs.core.Keyword(null,"grammar","grammar",1881328267),expr__136530)))){
return (new instaparse.gll.Tramp(G__136419,self__.text,self__.segment,self__.fail_index,self__.node_builder,self__.stack,self__.next_stack,self__.generation,self__.negative_listeners,self__.msg_cache,self__.nodes,self__.success,self__.failure,self__.trace_QMARK_,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__136529.cljs$core$IFn$_invoke$arity$2 ? pred__136529.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"text","text",-1790561697),expr__136530) : pred__136529.call(null,new cljs.core.Keyword(null,"text","text",-1790561697),expr__136530)))){
return (new instaparse.gll.Tramp(self__.grammar,G__136419,self__.segment,self__.fail_index,self__.node_builder,self__.stack,self__.next_stack,self__.generation,self__.negative_listeners,self__.msg_cache,self__.nodes,self__.success,self__.failure,self__.trace_QMARK_,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__136529.cljs$core$IFn$_invoke$arity$2 ? pred__136529.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"segment","segment",-964921196),expr__136530) : pred__136529.call(null,new cljs.core.Keyword(null,"segment","segment",-964921196),expr__136530)))){
return (new instaparse.gll.Tramp(self__.grammar,self__.text,G__136419,self__.fail_index,self__.node_builder,self__.stack,self__.next_stack,self__.generation,self__.negative_listeners,self__.msg_cache,self__.nodes,self__.success,self__.failure,self__.trace_QMARK_,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__136529.cljs$core$IFn$_invoke$arity$2 ? pred__136529.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"fail-index","fail-index",248726923),expr__136530) : pred__136529.call(null,new cljs.core.Keyword(null,"fail-index","fail-index",248726923),expr__136530)))){
return (new instaparse.gll.Tramp(self__.grammar,self__.text,self__.segment,G__136419,self__.node_builder,self__.stack,self__.next_stack,self__.generation,self__.negative_listeners,self__.msg_cache,self__.nodes,self__.success,self__.failure,self__.trace_QMARK_,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__136529.cljs$core$IFn$_invoke$arity$2 ? pred__136529.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"node-builder","node-builder",-1956562605),expr__136530) : pred__136529.call(null,new cljs.core.Keyword(null,"node-builder","node-builder",-1956562605),expr__136530)))){
return (new instaparse.gll.Tramp(self__.grammar,self__.text,self__.segment,self__.fail_index,G__136419,self__.stack,self__.next_stack,self__.generation,self__.negative_listeners,self__.msg_cache,self__.nodes,self__.success,self__.failure,self__.trace_QMARK_,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__136529.cljs$core$IFn$_invoke$arity$2 ? pred__136529.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"stack","stack",-793405930),expr__136530) : pred__136529.call(null,new cljs.core.Keyword(null,"stack","stack",-793405930),expr__136530)))){
return (new instaparse.gll.Tramp(self__.grammar,self__.text,self__.segment,self__.fail_index,self__.node_builder,G__136419,self__.next_stack,self__.generation,self__.negative_listeners,self__.msg_cache,self__.nodes,self__.success,self__.failure,self__.trace_QMARK_,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__136529.cljs$core$IFn$_invoke$arity$2 ? pred__136529.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"next-stack","next-stack",-481930728),expr__136530) : pred__136529.call(null,new cljs.core.Keyword(null,"next-stack","next-stack",-481930728),expr__136530)))){
return (new instaparse.gll.Tramp(self__.grammar,self__.text,self__.segment,self__.fail_index,self__.node_builder,self__.stack,G__136419,self__.generation,self__.negative_listeners,self__.msg_cache,self__.nodes,self__.success,self__.failure,self__.trace_QMARK_,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__136529.cljs$core$IFn$_invoke$arity$2 ? pred__136529.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"generation","generation",-2132542044),expr__136530) : pred__136529.call(null,new cljs.core.Keyword(null,"generation","generation",-2132542044),expr__136530)))){
return (new instaparse.gll.Tramp(self__.grammar,self__.text,self__.segment,self__.fail_index,self__.node_builder,self__.stack,self__.next_stack,G__136419,self__.negative_listeners,self__.msg_cache,self__.nodes,self__.success,self__.failure,self__.trace_QMARK_,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__136529.cljs$core$IFn$_invoke$arity$2 ? pred__136529.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"negative-listeners","negative-listeners",55241092),expr__136530) : pred__136529.call(null,new cljs.core.Keyword(null,"negative-listeners","negative-listeners",55241092),expr__136530)))){
return (new instaparse.gll.Tramp(self__.grammar,self__.text,self__.segment,self__.fail_index,self__.node_builder,self__.stack,self__.next_stack,self__.generation,G__136419,self__.msg_cache,self__.nodes,self__.success,self__.failure,self__.trace_QMARK_,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__136529.cljs$core$IFn$_invoke$arity$2 ? pred__136529.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"msg-cache","msg-cache",-733775070),expr__136530) : pred__136529.call(null,new cljs.core.Keyword(null,"msg-cache","msg-cache",-733775070),expr__136530)))){
return (new instaparse.gll.Tramp(self__.grammar,self__.text,self__.segment,self__.fail_index,self__.node_builder,self__.stack,self__.next_stack,self__.generation,self__.negative_listeners,G__136419,self__.nodes,self__.success,self__.failure,self__.trace_QMARK_,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__136529.cljs$core$IFn$_invoke$arity$2 ? pred__136529.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"nodes","nodes",-2099585805),expr__136530) : pred__136529.call(null,new cljs.core.Keyword(null,"nodes","nodes",-2099585805),expr__136530)))){
return (new instaparse.gll.Tramp(self__.grammar,self__.text,self__.segment,self__.fail_index,self__.node_builder,self__.stack,self__.next_stack,self__.generation,self__.negative_listeners,self__.msg_cache,G__136419,self__.success,self__.failure,self__.trace_QMARK_,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__136529.cljs$core$IFn$_invoke$arity$2 ? pred__136529.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"success","success",1890645906),expr__136530) : pred__136529.call(null,new cljs.core.Keyword(null,"success","success",1890645906),expr__136530)))){
return (new instaparse.gll.Tramp(self__.grammar,self__.text,self__.segment,self__.fail_index,self__.node_builder,self__.stack,self__.next_stack,self__.generation,self__.negative_listeners,self__.msg_cache,self__.nodes,G__136419,self__.failure,self__.trace_QMARK_,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__136529.cljs$core$IFn$_invoke$arity$2 ? pred__136529.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"failure","failure",720415879),expr__136530) : pred__136529.call(null,new cljs.core.Keyword(null,"failure","failure",720415879),expr__136530)))){
return (new instaparse.gll.Tramp(self__.grammar,self__.text,self__.segment,self__.fail_index,self__.node_builder,self__.stack,self__.next_stack,self__.generation,self__.negative_listeners,self__.msg_cache,self__.nodes,self__.success,G__136419,self__.trace_QMARK_,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__136529.cljs$core$IFn$_invoke$arity$2 ? pred__136529.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"trace?","trace?",1730690679),expr__136530) : pred__136529.call(null,new cljs.core.Keyword(null,"trace?","trace?",1730690679),expr__136530)))){
return (new instaparse.gll.Tramp(self__.grammar,self__.text,self__.segment,self__.fail_index,self__.node_builder,self__.stack,self__.next_stack,self__.generation,self__.negative_listeners,self__.msg_cache,self__.nodes,self__.success,self__.failure,G__136419,self__.__meta,self__.__extmap,null));
} else {
return (new instaparse.gll.Tramp(self__.grammar,self__.text,self__.segment,self__.fail_index,self__.node_builder,self__.stack,self__.next_stack,self__.generation,self__.negative_listeners,self__.msg_cache,self__.nodes,self__.success,self__.failure,self__.trace_QMARK_,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__136419),null));
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
}
}
}
}));

(instaparse.gll.Tramp.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 14, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"grammar","grammar",1881328267),self__.grammar,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"text","text",-1790561697),self__.text,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"segment","segment",-964921196),self__.segment,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"fail-index","fail-index",248726923),self__.fail_index,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"node-builder","node-builder",-1956562605),self__.node_builder,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"stack","stack",-793405930),self__.stack,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"next-stack","next-stack",-481930728),self__.next_stack,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"generation","generation",-2132542044),self__.generation,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"negative-listeners","negative-listeners",55241092),self__.negative_listeners,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"msg-cache","msg-cache",-733775070),self__.msg_cache,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"nodes","nodes",-2099585805),self__.nodes,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"success","success",1890645906),self__.success,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"failure","failure",720415879),self__.failure,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"trace?","trace?",1730690679),self__.trace_QMARK_,null))], null),self__.__extmap));
}));

(instaparse.gll.Tramp.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__136419){
var self__ = this;
var this__5299__auto____$1 = this;
return (new instaparse.gll.Tramp(self__.grammar,self__.text,self__.segment,self__.fail_index,self__.node_builder,self__.stack,self__.next_stack,self__.generation,self__.negative_listeners,self__.msg_cache,self__.nodes,self__.success,self__.failure,self__.trace_QMARK_,G__136419,self__.__extmap,self__.__hash));
}));

(instaparse.gll.Tramp.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(instaparse.gll.Tramp.getBasis = (function (){
return new cljs.core.PersistentVector(null, 14, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"grammar","grammar",-773107502,null),new cljs.core.Symbol(null,"text","text",-150030170,null),new cljs.core.Symbol(null,"segment","segment",675610331,null),new cljs.core.Symbol(null,"fail-index","fail-index",1889258450,null),new cljs.core.Symbol(null,"node-builder","node-builder",-316031078,null),new cljs.core.Symbol(null,"stack","stack",847125597,null),new cljs.core.Symbol(null,"next-stack","next-stack",1158600799,null),new cljs.core.Symbol(null,"generation","generation",-492010517,null),new cljs.core.Symbol(null,"negative-listeners","negative-listeners",1695772619,null),new cljs.core.Symbol(null,"msg-cache","msg-cache",906756457,null),new cljs.core.Symbol(null,"nodes","nodes",-459054278,null),new cljs.core.Symbol(null,"success","success",-763789863,null),new cljs.core.Symbol(null,"failure","failure",-1934019890,null),new cljs.core.Symbol(null,"trace?","trace?",-923745090,null)], null);
}));

(instaparse.gll.Tramp.cljs$lang$type = true);

(instaparse.gll.Tramp.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"instaparse.gll/Tramp",null,(1),null));
}));

(instaparse.gll.Tramp.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"instaparse.gll/Tramp");
}));

/**
 * Positional factory function for instaparse.gll/Tramp.
 */
instaparse.gll.__GT_Tramp = (function instaparse$gll$__GT_Tramp(grammar,text,segment,fail_index,node_builder,stack,next_stack,generation,negative_listeners,msg_cache,nodes,success,failure,trace_QMARK_){
return (new instaparse.gll.Tramp(grammar,text,segment,fail_index,node_builder,stack,next_stack,generation,negative_listeners,msg_cache,nodes,success,failure,trace_QMARK_,null,null,null));
});

/**
 * Factory function for instaparse.gll/Tramp, taking a map of keywords to field values.
 */
instaparse.gll.map__GT_Tramp = (function instaparse$gll$map__GT_Tramp(G__136430){
var extmap__5342__auto__ = (function (){var G__136564 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(G__136430,new cljs.core.Keyword(null,"grammar","grammar",1881328267),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"text","text",-1790561697),new cljs.core.Keyword(null,"segment","segment",-964921196),new cljs.core.Keyword(null,"fail-index","fail-index",248726923),new cljs.core.Keyword(null,"node-builder","node-builder",-1956562605),new cljs.core.Keyword(null,"stack","stack",-793405930),new cljs.core.Keyword(null,"next-stack","next-stack",-481930728),new cljs.core.Keyword(null,"generation","generation",-2132542044),new cljs.core.Keyword(null,"negative-listeners","negative-listeners",55241092),new cljs.core.Keyword(null,"msg-cache","msg-cache",-733775070),new cljs.core.Keyword(null,"nodes","nodes",-2099585805),new cljs.core.Keyword(null,"success","success",1890645906),new cljs.core.Keyword(null,"failure","failure",720415879),new cljs.core.Keyword(null,"trace?","trace?",1730690679)], 0));
if(cljs.core.record_QMARK_(G__136430)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__136564);
} else {
return G__136564;
}
})();
return (new instaparse.gll.Tramp(new cljs.core.Keyword(null,"grammar","grammar",1881328267).cljs$core$IFn$_invoke$arity$1(G__136430),new cljs.core.Keyword(null,"text","text",-1790561697).cljs$core$IFn$_invoke$arity$1(G__136430),new cljs.core.Keyword(null,"segment","segment",-964921196).cljs$core$IFn$_invoke$arity$1(G__136430),new cljs.core.Keyword(null,"fail-index","fail-index",248726923).cljs$core$IFn$_invoke$arity$1(G__136430),new cljs.core.Keyword(null,"node-builder","node-builder",-1956562605).cljs$core$IFn$_invoke$arity$1(G__136430),new cljs.core.Keyword(null,"stack","stack",-793405930).cljs$core$IFn$_invoke$arity$1(G__136430),new cljs.core.Keyword(null,"next-stack","next-stack",-481930728).cljs$core$IFn$_invoke$arity$1(G__136430),new cljs.core.Keyword(null,"generation","generation",-2132542044).cljs$core$IFn$_invoke$arity$1(G__136430),new cljs.core.Keyword(null,"negative-listeners","negative-listeners",55241092).cljs$core$IFn$_invoke$arity$1(G__136430),new cljs.core.Keyword(null,"msg-cache","msg-cache",-733775070).cljs$core$IFn$_invoke$arity$1(G__136430),new cljs.core.Keyword(null,"nodes","nodes",-2099585805).cljs$core$IFn$_invoke$arity$1(G__136430),new cljs.core.Keyword(null,"success","success",1890645906).cljs$core$IFn$_invoke$arity$1(G__136430),new cljs.core.Keyword(null,"failure","failure",720415879).cljs$core$IFn$_invoke$arity$1(G__136430),new cljs.core.Keyword(null,"trace?","trace?",1730690679).cljs$core$IFn$_invoke$arity$1(G__136430),null,cljs.core.not_empty(extmap__5342__auto__),null));
});

instaparse.gll.make_tramp = (function instaparse$gll$make_tramp(var_args){
var G__136578 = arguments.length;
switch (G__136578) {
case 2:
return instaparse.gll.make_tramp.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return instaparse.gll.make_tramp.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return instaparse.gll.make_tramp.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
case 5:
return instaparse.gll.make_tramp.cljs$core$IFn$_invoke$arity$5((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(instaparse.gll.make_tramp.cljs$core$IFn$_invoke$arity$2 = (function (grammar,text){
return instaparse.gll.make_tramp.cljs$core$IFn$_invoke$arity$5(grammar,text,instaparse.gll.text__GT_segment(text),(-1),null);
}));

(instaparse.gll.make_tramp.cljs$core$IFn$_invoke$arity$3 = (function (grammar,text,segment){
return instaparse.gll.make_tramp.cljs$core$IFn$_invoke$arity$5(grammar,text,segment,(-1),null);
}));

(instaparse.gll.make_tramp.cljs$core$IFn$_invoke$arity$4 = (function (grammar,text,fail_index,node_builder){
return instaparse.gll.make_tramp.cljs$core$IFn$_invoke$arity$5(grammar,text,instaparse.gll.text__GT_segment(text),fail_index,node_builder);
}));

(instaparse.gll.make_tramp.cljs$core$IFn$_invoke$arity$5 = (function (grammar,text,segment,fail_index,node_builder){
return (new instaparse.gll.Tramp(grammar,text,segment,fail_index,node_builder,cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentVector.EMPTY),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentVector.EMPTY),cljs.core.atom.cljs$core$IFn$_invoke$arity$1((0)),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.sorted_map_by(cljs.core._GT_)),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null),cljs.core.atom.cljs$core$IFn$_invoke$arity$1((new instaparse.gll.Failure((0),cljs.core.PersistentVector.EMPTY,null,null,null))),false,null,null,null));
}));

(instaparse.gll.make_tramp.cljs$lang$maxFixedArity = 5);

instaparse.gll.make_success = (function instaparse$gll$make_success(result,index){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"result","result",1415092211),result,new cljs.core.Keyword(null,"index","index",-1531685915),index], null);
});
instaparse.gll.total_success_QMARK_ = (function instaparse$gll$total_success_QMARK_(tramp,s){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(new cljs.core.Keyword(null,"text","text",-1790561697).cljs$core$IFn$_invoke$arity$1(tramp)),new cljs.core.Keyword(null,"index","index",-1531685915).cljs$core$IFn$_invoke$arity$1(s));
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
 * @implements {cljs.core.IPrintWithWriter}
 * @implements {cljs.core.IIterable}
 * @implements {cljs.core.IWithMeta}
 * @implements {cljs.core.IAssociative}
 * @implements {cljs.core.IMap}
 * @implements {cljs.core.ILookup}
*/
instaparse.gll.Node = (function (listeners,full_listeners,results,full_results,__meta,__extmap,__hash){
this.listeners = listeners;
this.full_listeners = full_listeners;
this.results = results;
this.full_results = full_results;
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(instaparse.gll.Node.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(instaparse.gll.Node.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k136591,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__136595 = k136591;
var G__136595__$1 = (((G__136595 instanceof cljs.core.Keyword))?G__136595.fqn:null);
switch (G__136595__$1) {
case "listeners":
return self__.listeners;

break;
case "full-listeners":
return self__.full_listeners;

break;
case "results":
return self__.results;

break;
case "full-results":
return self__.full_results;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k136591,else__5303__auto__);

}
}));

(instaparse.gll.Node.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__136596){
var vec__136597 = p__136596;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__136597,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__136597,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(instaparse.gll.Node.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#instaparse.gll.Node{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"listeners","listeners",394544445),self__.listeners],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"full-listeners","full-listeners",50621827),self__.full_listeners],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"results","results",-1134170113),self__.results],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"full-results","full-results",-1500225407),self__.full_results],null))], null),self__.__extmap));
}));

(instaparse.gll.Node.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__136590){
var self__ = this;
var G__136590__$1 = this;
return (new cljs.core.RecordIter((0),G__136590__$1,4,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"listeners","listeners",394544445),new cljs.core.Keyword(null,"full-listeners","full-listeners",50621827),new cljs.core.Keyword(null,"results","results",-1134170113),new cljs.core.Keyword(null,"full-results","full-results",-1500225407)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(instaparse.gll.Node.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(instaparse.gll.Node.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new instaparse.gll.Node(self__.listeners,self__.full_listeners,self__.results,self__.full_results,self__.__meta,self__.__extmap,self__.__hash));
}));

(instaparse.gll.Node.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (4 + cljs.core.count(self__.__extmap));
}));

(instaparse.gll.Node.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (-1610074144 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(instaparse.gll.Node.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this136592,other136593){
var self__ = this;
var this136592__$1 = this;
return (((!((other136593 == null)))) && ((((this136592__$1.constructor === other136593.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this136592__$1.listeners,other136593.listeners)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this136592__$1.full_listeners,other136593.full_listeners)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this136592__$1.results,other136593.results)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this136592__$1.full_results,other136593.full_results)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this136592__$1.__extmap,other136593.__extmap)))))))))))));
}));

(instaparse.gll.Node.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"full-results","full-results",-1500225407),null,new cljs.core.Keyword(null,"full-listeners","full-listeners",50621827),null,new cljs.core.Keyword(null,"listeners","listeners",394544445),null,new cljs.core.Keyword(null,"results","results",-1134170113),null], null), null),k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new instaparse.gll.Node(self__.listeners,self__.full_listeners,self__.results,self__.full_results,self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(instaparse.gll.Node.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k136591){
var self__ = this;
var this__5307__auto____$1 = this;
var G__136606 = k136591;
var G__136606__$1 = (((G__136606 instanceof cljs.core.Keyword))?G__136606.fqn:null);
switch (G__136606__$1) {
case "listeners":
case "full-listeners":
case "results":
case "full-results":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k136591);

}
}));

(instaparse.gll.Node.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__136590){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__136607 = cljs.core.keyword_identical_QMARK_;
var expr__136608 = k__5309__auto__;
if(cljs.core.truth_((pred__136607.cljs$core$IFn$_invoke$arity$2 ? pred__136607.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"listeners","listeners",394544445),expr__136608) : pred__136607.call(null,new cljs.core.Keyword(null,"listeners","listeners",394544445),expr__136608)))){
return (new instaparse.gll.Node(G__136590,self__.full_listeners,self__.results,self__.full_results,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__136607.cljs$core$IFn$_invoke$arity$2 ? pred__136607.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"full-listeners","full-listeners",50621827),expr__136608) : pred__136607.call(null,new cljs.core.Keyword(null,"full-listeners","full-listeners",50621827),expr__136608)))){
return (new instaparse.gll.Node(self__.listeners,G__136590,self__.results,self__.full_results,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__136607.cljs$core$IFn$_invoke$arity$2 ? pred__136607.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"results","results",-1134170113),expr__136608) : pred__136607.call(null,new cljs.core.Keyword(null,"results","results",-1134170113),expr__136608)))){
return (new instaparse.gll.Node(self__.listeners,self__.full_listeners,G__136590,self__.full_results,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__136607.cljs$core$IFn$_invoke$arity$2 ? pred__136607.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"full-results","full-results",-1500225407),expr__136608) : pred__136607.call(null,new cljs.core.Keyword(null,"full-results","full-results",-1500225407),expr__136608)))){
return (new instaparse.gll.Node(self__.listeners,self__.full_listeners,self__.results,G__136590,self__.__meta,self__.__extmap,null));
} else {
return (new instaparse.gll.Node(self__.listeners,self__.full_listeners,self__.results,self__.full_results,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__136590),null));
}
}
}
}
}));

(instaparse.gll.Node.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"listeners","listeners",394544445),self__.listeners,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"full-listeners","full-listeners",50621827),self__.full_listeners,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"results","results",-1134170113),self__.results,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"full-results","full-results",-1500225407),self__.full_results,null))], null),self__.__extmap));
}));

(instaparse.gll.Node.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__136590){
var self__ = this;
var this__5299__auto____$1 = this;
return (new instaparse.gll.Node(self__.listeners,self__.full_listeners,self__.results,self__.full_results,G__136590,self__.__extmap,self__.__hash));
}));

(instaparse.gll.Node.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(instaparse.gll.Node.getBasis = (function (){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"listeners","listeners",2035075972,null),new cljs.core.Symbol(null,"full-listeners","full-listeners",1691153354,null),new cljs.core.Symbol(null,"results","results",506361414,null),new cljs.core.Symbol(null,"full-results","full-results",140306120,null)], null);
}));

(instaparse.gll.Node.cljs$lang$type = true);

(instaparse.gll.Node.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"instaparse.gll/Node",null,(1),null));
}));

(instaparse.gll.Node.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"instaparse.gll/Node");
}));

/**
 * Positional factory function for instaparse.gll/Node.
 */
instaparse.gll.__GT_Node = (function instaparse$gll$__GT_Node(listeners,full_listeners,results,full_results){
return (new instaparse.gll.Node(listeners,full_listeners,results,full_results,null,null,null));
});

/**
 * Factory function for instaparse.gll/Node, taking a map of keywords to field values.
 */
instaparse.gll.map__GT_Node = (function instaparse$gll$map__GT_Node(G__136594){
var extmap__5342__auto__ = (function (){var G__136610 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(G__136594,new cljs.core.Keyword(null,"listeners","listeners",394544445),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"full-listeners","full-listeners",50621827),new cljs.core.Keyword(null,"results","results",-1134170113),new cljs.core.Keyword(null,"full-results","full-results",-1500225407)], 0));
if(cljs.core.record_QMARK_(G__136594)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__136610);
} else {
return G__136610;
}
})();
return (new instaparse.gll.Node(new cljs.core.Keyword(null,"listeners","listeners",394544445).cljs$core$IFn$_invoke$arity$1(G__136594),new cljs.core.Keyword(null,"full-listeners","full-listeners",50621827).cljs$core$IFn$_invoke$arity$1(G__136594),new cljs.core.Keyword(null,"results","results",-1134170113).cljs$core$IFn$_invoke$arity$1(G__136594),new cljs.core.Keyword(null,"full-results","full-results",-1500225407).cljs$core$IFn$_invoke$arity$1(G__136594),null,cljs.core.not_empty(extmap__5342__auto__),null));
});

instaparse.gll.make_node = (function instaparse$gll$make_node(){
return (new instaparse.gll.Node(cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentVector.EMPTY),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentVector.EMPTY),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentHashSet.EMPTY),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentHashSet.EMPTY),null,null,null));
});
/**
 * Pushes an item onto the trampoline's stack
 */
instaparse.gll.push_stack = (function instaparse$gll$push_stack(tramp,item){

return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"stack","stack",-793405930).cljs$core$IFn$_invoke$arity$1(tramp),cljs.core.conj,item);
});
/**
 * Pushes onto stack a message to a given listener about a result
 */
instaparse.gll.push_message = (function instaparse$gll$push_message(tramp,listener,result){
var cache = new cljs.core.Keyword(null,"msg-cache","msg-cache",-733775070).cljs$core$IFn$_invoke$arity$1(tramp);
var i = new cljs.core.Keyword(null,"index","index",-1531685915).cljs$core$IFn$_invoke$arity$1(result);
var k = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [listener,i], null);
var c = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(cache),k,(0));
var f = (function (){
return (listener.cljs$core$IFn$_invoke$arity$1 ? listener.cljs$core$IFn$_invoke$arity$1(result) : listener.call(null,result));
});

if((c > cljs.core.deref(new cljs.core.Keyword(null,"generation","generation",-2132542044).cljs$core$IFn$_invoke$arity$1(tramp)))){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"next-stack","next-stack",-481930728).cljs$core$IFn$_invoke$arity$1(tramp),cljs.core.conj,f);
} else {
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"stack","stack",-793405930).cljs$core$IFn$_invoke$arity$1(tramp),cljs.core.conj,f);
}

return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(cache,cljs.core.assoc,k,(c + (1)));
});
/**
 * Tests whether node already has a listener
 */
instaparse.gll.listener_exists_QMARK_ = (function instaparse$gll$listener_exists_QMARK_(tramp,node_key){
var nodes = new cljs.core.Keyword(null,"nodes","nodes",-2099585805).cljs$core$IFn$_invoke$arity$1(tramp);
var temp__5804__auto__ = (function (){var fexpr__136611 = cljs.core.deref(nodes);
return (fexpr__136611.cljs$core$IFn$_invoke$arity$1 ? fexpr__136611.cljs$core$IFn$_invoke$arity$1(node_key) : fexpr__136611.call(null,node_key));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var node = temp__5804__auto__;
return (cljs.core.count(cljs.core.deref(new cljs.core.Keyword(null,"listeners","listeners",394544445).cljs$core$IFn$_invoke$arity$1(node))) > (0));
} else {
return null;
}
});
/**
 * Tests whether node already has a listener or full-listener
 */
instaparse.gll.full_listener_exists_QMARK_ = (function instaparse$gll$full_listener_exists_QMARK_(tramp,node_key){
var nodes = new cljs.core.Keyword(null,"nodes","nodes",-2099585805).cljs$core$IFn$_invoke$arity$1(tramp);
var temp__5804__auto__ = (function (){var fexpr__136612 = cljs.core.deref(nodes);
return (fexpr__136612.cljs$core$IFn$_invoke$arity$1 ? fexpr__136612.cljs$core$IFn$_invoke$arity$1(node_key) : fexpr__136612.call(null,node_key));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var node = temp__5804__auto__;
return (((cljs.core.count(cljs.core.deref(new cljs.core.Keyword(null,"full-listeners","full-listeners",50621827).cljs$core$IFn$_invoke$arity$1(node))) > (0))) || ((cljs.core.count(cljs.core.deref(new cljs.core.Keyword(null,"listeners","listeners",394544445).cljs$core$IFn$_invoke$arity$1(node))) > (0))));
} else {
return null;
}
});
/**
 * Tests whether node has a result or full-result
 */
instaparse.gll.result_exists_QMARK_ = (function instaparse$gll$result_exists_QMARK_(tramp,node_key){
var nodes = new cljs.core.Keyword(null,"nodes","nodes",-2099585805).cljs$core$IFn$_invoke$arity$1(tramp);
var temp__5804__auto__ = (function (){var fexpr__136613 = cljs.core.deref(nodes);
return (fexpr__136613.cljs$core$IFn$_invoke$arity$1 ? fexpr__136613.cljs$core$IFn$_invoke$arity$1(node_key) : fexpr__136613.call(null,node_key));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var node = temp__5804__auto__;
return (((cljs.core.count(cljs.core.deref(new cljs.core.Keyword(null,"full-results","full-results",-1500225407).cljs$core$IFn$_invoke$arity$1(node))) > (0))) || ((cljs.core.count(cljs.core.deref(new cljs.core.Keyword(null,"results","results",-1134170113).cljs$core$IFn$_invoke$arity$1(node))) > (0))));
} else {
return null;
}
});
/**
 * Tests whether node has a full-result
 */
instaparse.gll.full_result_exists_QMARK_ = (function instaparse$gll$full_result_exists_QMARK_(tramp,node_key){
var nodes = new cljs.core.Keyword(null,"nodes","nodes",-2099585805).cljs$core$IFn$_invoke$arity$1(tramp);
var temp__5804__auto__ = (function (){var fexpr__136614 = cljs.core.deref(nodes);
return (fexpr__136614.cljs$core$IFn$_invoke$arity$1 ? fexpr__136614.cljs$core$IFn$_invoke$arity$1(node_key) : fexpr__136614.call(null,node_key));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var node = temp__5804__auto__;
return (cljs.core.count(cljs.core.deref(new cljs.core.Keyword(null,"full-results","full-results",-1500225407).cljs$core$IFn$_invoke$arity$1(node))) > (0));
} else {
return null;
}
});
/**
 * Gets node if already exists, otherwise creates one
 */
instaparse.gll.node_get = (function instaparse$gll$node_get(tramp,node_key){
var nodes = new cljs.core.Keyword(null,"nodes","nodes",-2099585805).cljs$core$IFn$_invoke$arity$1(tramp);
var temp__5802__auto__ = (function (){var fexpr__136615 = cljs.core.deref(nodes);
return (fexpr__136615.cljs$core$IFn$_invoke$arity$1 ? fexpr__136615.cljs$core$IFn$_invoke$arity$1(node_key) : fexpr__136615.call(null,node_key));
})();
if(cljs.core.truth_(temp__5802__auto__)){
var node = temp__5802__auto__;
return node;
} else {
var node = instaparse.gll.make_node();

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(nodes,cljs.core.assoc,node_key,node);

return node;
}
});
instaparse.gll.safe_with_meta = (function instaparse$gll$safe_with_meta(obj,metamap){
if((((!((obj == null))))?(((((obj.cljs$lang$protocol_mask$partition0$ & (262144))) || ((cljs.core.PROTOCOL_SENTINEL === obj.cljs$core$IWithMeta$))))?true:(((!obj.cljs$lang$protocol_mask$partition0$))?cljs.core.native_satisfies_QMARK_(cljs.core.IWithMeta,obj):false)):cljs.core.native_satisfies_QMARK_(cljs.core.IWithMeta,obj))){
return cljs.core.with_meta(obj,metamap);
} else {
return obj;
}
});
/**
 * Pushes a result into the trampoline's node.
 * Categorizes as either result or full-result.
 * Schedules notification to all existing listeners of result
 * (Full listeners only get notified about full results)
 */
instaparse.gll.push_result = (function instaparse$gll$push_result(tramp,node_key,result){

var node = instaparse.gll.node_get(tramp,node_key);
var parser = (node_key.cljs$core$IFn$_invoke$arity$1 ? node_key.cljs$core$IFn$_invoke$arity$1((1)) : node_key.call(null,(1)));
var result__$1 = (cljs.core.truth_(new cljs.core.Keyword(null,"hide","hide",-596913169).cljs$core$IFn$_invoke$arity$1(parser))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(result,new cljs.core.Keyword(null,"result","result",1415092211),null):result);
var result__$2 = (function (){var temp__5802__auto__ = new cljs.core.Keyword(null,"red","red",-969428204).cljs$core$IFn$_invoke$arity$1(parser);
if(cljs.core.truth_(temp__5802__auto__)){
var reduction_function = temp__5802__auto__;
return instaparse.gll.make_success(instaparse.gll.safe_with_meta(instaparse.reduction.apply_reduction(reduction_function,new cljs.core.Keyword(null,"result","result",1415092211).cljs$core$IFn$_invoke$arity$1(result__$1)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("instaparse.gll","start-index","instaparse.gll/start-index",404653620),(node_key.cljs$core$IFn$_invoke$arity$1 ? node_key.cljs$core$IFn$_invoke$arity$1((0)) : node_key.call(null,(0))),new cljs.core.Keyword("instaparse.gll","end-index","instaparse.gll/end-index",-1851404441),new cljs.core.Keyword(null,"index","index",-1531685915).cljs$core$IFn$_invoke$arity$1(result__$1)], null)),new cljs.core.Keyword(null,"index","index",-1531685915).cljs$core$IFn$_invoke$arity$1(result__$1));
} else {
return result__$1;
}
})();
var total_QMARK_ = instaparse.gll.total_success_QMARK_(tramp,result__$2);
var results = ((total_QMARK_)?new cljs.core.Keyword(null,"full-results","full-results",-1500225407).cljs$core$IFn$_invoke$arity$1(node):new cljs.core.Keyword(null,"results","results",-1134170113).cljs$core$IFn$_invoke$arity$1(node));
if(cljs.core.not((function (){var fexpr__136617 = cljs.core.deref(results);
return (fexpr__136617.cljs$core$IFn$_invoke$arity$1 ? fexpr__136617.cljs$core$IFn$_invoke$arity$1(result__$2) : fexpr__136617.call(null,result__$2));
})())){

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(results,cljs.core.conj,result__$2);

var seq__136618_136916 = cljs.core.seq(cljs.core.deref(new cljs.core.Keyword(null,"listeners","listeners",394544445).cljs$core$IFn$_invoke$arity$1(node)));
var chunk__136619_136917 = null;
var count__136620_136918 = (0);
var i__136621_136919 = (0);
while(true){
if((i__136621_136919 < count__136620_136918)){
var listener_136920 = chunk__136619_136917.cljs$core$IIndexed$_nth$arity$2(null,i__136621_136919);
instaparse.gll.push_message(tramp,listener_136920,result__$2);


var G__136921 = seq__136618_136916;
var G__136922 = chunk__136619_136917;
var G__136923 = count__136620_136918;
var G__136924 = (i__136621_136919 + (1));
seq__136618_136916 = G__136921;
chunk__136619_136917 = G__136922;
count__136620_136918 = G__136923;
i__136621_136919 = G__136924;
continue;
} else {
var temp__5804__auto___136925 = cljs.core.seq(seq__136618_136916);
if(temp__5804__auto___136925){
var seq__136618_136926__$1 = temp__5804__auto___136925;
if(cljs.core.chunked_seq_QMARK_(seq__136618_136926__$1)){
var c__5525__auto___136927 = cljs.core.chunk_first(seq__136618_136926__$1);
var G__136928 = cljs.core.chunk_rest(seq__136618_136926__$1);
var G__136929 = c__5525__auto___136927;
var G__136930 = cljs.core.count(c__5525__auto___136927);
var G__136931 = (0);
seq__136618_136916 = G__136928;
chunk__136619_136917 = G__136929;
count__136620_136918 = G__136930;
i__136621_136919 = G__136931;
continue;
} else {
var listener_136932 = cljs.core.first(seq__136618_136926__$1);
instaparse.gll.push_message(tramp,listener_136932,result__$2);


var G__136933 = cljs.core.next(seq__136618_136926__$1);
var G__136934 = null;
var G__136935 = (0);
var G__136936 = (0);
seq__136618_136916 = G__136933;
chunk__136619_136917 = G__136934;
count__136620_136918 = G__136935;
i__136621_136919 = G__136936;
continue;
}
} else {
}
}
break;
}

if(total_QMARK_){
var seq__136622 = cljs.core.seq(cljs.core.deref(new cljs.core.Keyword(null,"full-listeners","full-listeners",50621827).cljs$core$IFn$_invoke$arity$1(node)));
var chunk__136623 = null;
var count__136624 = (0);
var i__136625 = (0);
while(true){
if((i__136625 < count__136624)){
var listener = chunk__136623.cljs$core$IIndexed$_nth$arity$2(null,i__136625);
instaparse.gll.push_message(tramp,listener,result__$2);


var G__136937 = seq__136622;
var G__136938 = chunk__136623;
var G__136939 = count__136624;
var G__136940 = (i__136625 + (1));
seq__136622 = G__136937;
chunk__136623 = G__136938;
count__136624 = G__136939;
i__136625 = G__136940;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__136622);
if(temp__5804__auto__){
var seq__136622__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__136622__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__136622__$1);
var G__136941 = cljs.core.chunk_rest(seq__136622__$1);
var G__136942 = c__5525__auto__;
var G__136943 = cljs.core.count(c__5525__auto__);
var G__136944 = (0);
seq__136622 = G__136941;
chunk__136623 = G__136942;
count__136624 = G__136943;
i__136625 = G__136944;
continue;
} else {
var listener = cljs.core.first(seq__136622__$1);
instaparse.gll.push_message(tramp,listener,result__$2);


var G__136945 = cljs.core.next(seq__136622__$1);
var G__136946 = null;
var G__136947 = (0);
var G__136948 = (0);
seq__136622 = G__136945;
chunk__136623 = G__136946;
count__136624 = G__136947;
i__136625 = G__136948;
continue;
}
} else {
return null;
}
}
break;
}
} else {
return null;
}
} else {
return null;
}
});
/**
 * Pushes a listener into the trampoline's node.
 * Schedules notification to listener of all existing results.
 * Initiates parse if necessary
 */
instaparse.gll.push_listener = (function instaparse$gll$push_listener(tramp,node_key,listener){
var listener_already_exists_QMARK_ = instaparse.gll.listener_exists_QMARK_(tramp,node_key);
var node = instaparse.gll.node_get(tramp,node_key);
var listeners = new cljs.core.Keyword(null,"listeners","listeners",394544445).cljs$core$IFn$_invoke$arity$1(node);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(listeners,cljs.core.conj,listener);

var seq__136626_136949 = cljs.core.seq(cljs.core.deref(new cljs.core.Keyword(null,"results","results",-1134170113).cljs$core$IFn$_invoke$arity$1(node)));
var chunk__136627_136950 = null;
var count__136628_136951 = (0);
var i__136629_136952 = (0);
while(true){
if((i__136629_136952 < count__136628_136951)){
var result_136953 = chunk__136627_136950.cljs$core$IIndexed$_nth$arity$2(null,i__136629_136952);
instaparse.gll.push_message(tramp,listener,result_136953);


var G__136954 = seq__136626_136949;
var G__136955 = chunk__136627_136950;
var G__136956 = count__136628_136951;
var G__136957 = (i__136629_136952 + (1));
seq__136626_136949 = G__136954;
chunk__136627_136950 = G__136955;
count__136628_136951 = G__136956;
i__136629_136952 = G__136957;
continue;
} else {
var temp__5804__auto___136958 = cljs.core.seq(seq__136626_136949);
if(temp__5804__auto___136958){
var seq__136626_136959__$1 = temp__5804__auto___136958;
if(cljs.core.chunked_seq_QMARK_(seq__136626_136959__$1)){
var c__5525__auto___136960 = cljs.core.chunk_first(seq__136626_136959__$1);
var G__136961 = cljs.core.chunk_rest(seq__136626_136959__$1);
var G__136962 = c__5525__auto___136960;
var G__136963 = cljs.core.count(c__5525__auto___136960);
var G__136964 = (0);
seq__136626_136949 = G__136961;
chunk__136627_136950 = G__136962;
count__136628_136951 = G__136963;
i__136629_136952 = G__136964;
continue;
} else {
var result_136965 = cljs.core.first(seq__136626_136959__$1);
instaparse.gll.push_message(tramp,listener,result_136965);


var G__136966 = cljs.core.next(seq__136626_136959__$1);
var G__136967 = null;
var G__136968 = (0);
var G__136969 = (0);
seq__136626_136949 = G__136966;
chunk__136627_136950 = G__136967;
count__136628_136951 = G__136968;
i__136629_136952 = G__136969;
continue;
}
} else {
}
}
break;
}

var seq__136630_136970 = cljs.core.seq(cljs.core.deref(new cljs.core.Keyword(null,"full-results","full-results",-1500225407).cljs$core$IFn$_invoke$arity$1(node)));
var chunk__136631_136971 = null;
var count__136632_136972 = (0);
var i__136633_136973 = (0);
while(true){
if((i__136633_136973 < count__136632_136972)){
var result_136974 = chunk__136631_136971.cljs$core$IIndexed$_nth$arity$2(null,i__136633_136973);
instaparse.gll.push_message(tramp,listener,result_136974);


var G__136975 = seq__136630_136970;
var G__136976 = chunk__136631_136971;
var G__136977 = count__136632_136972;
var G__136978 = (i__136633_136973 + (1));
seq__136630_136970 = G__136975;
chunk__136631_136971 = G__136976;
count__136632_136972 = G__136977;
i__136633_136973 = G__136978;
continue;
} else {
var temp__5804__auto___136979 = cljs.core.seq(seq__136630_136970);
if(temp__5804__auto___136979){
var seq__136630_136980__$1 = temp__5804__auto___136979;
if(cljs.core.chunked_seq_QMARK_(seq__136630_136980__$1)){
var c__5525__auto___136981 = cljs.core.chunk_first(seq__136630_136980__$1);
var G__136982 = cljs.core.chunk_rest(seq__136630_136980__$1);
var G__136983 = c__5525__auto___136981;
var G__136984 = cljs.core.count(c__5525__auto___136981);
var G__136985 = (0);
seq__136630_136970 = G__136982;
chunk__136631_136971 = G__136983;
count__136632_136972 = G__136984;
i__136633_136973 = G__136985;
continue;
} else {
var result_136986 = cljs.core.first(seq__136630_136980__$1);
instaparse.gll.push_message(tramp,listener,result_136986);


var G__136987 = cljs.core.next(seq__136630_136980__$1);
var G__136988 = null;
var G__136989 = (0);
var G__136990 = (0);
seq__136630_136970 = G__136987;
chunk__136631_136971 = G__136988;
count__136632_136972 = G__136989;
i__136633_136973 = G__136990;
continue;
}
} else {
}
}
break;
}

if(cljs.core.not(listener_already_exists_QMARK_)){
return instaparse.gll.push_stack(tramp,(function (){
return instaparse.gll._parse((node_key.cljs$core$IFn$_invoke$arity$1 ? node_key.cljs$core$IFn$_invoke$arity$1((1)) : node_key.call(null,(1))),(node_key.cljs$core$IFn$_invoke$arity$1 ? node_key.cljs$core$IFn$_invoke$arity$1((0)) : node_key.call(null,(0))),tramp);
}));
} else {
return null;
}
});
/**
 * Pushes a listener into the trampoline's node.
 * Schedules notification to listener of all existing full results.
 */
instaparse.gll.push_full_listener = (function instaparse$gll$push_full_listener(tramp,node_key,listener){
var full_listener_already_exists_QMARK_ = instaparse.gll.full_listener_exists_QMARK_(tramp,node_key);
var node = instaparse.gll.node_get(tramp,node_key);
var listeners = new cljs.core.Keyword(null,"full-listeners","full-listeners",50621827).cljs$core$IFn$_invoke$arity$1(node);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(listeners,cljs.core.conj,listener);

var seq__136634_136991 = cljs.core.seq(cljs.core.deref(new cljs.core.Keyword(null,"full-results","full-results",-1500225407).cljs$core$IFn$_invoke$arity$1(node)));
var chunk__136635_136992 = null;
var count__136636_136993 = (0);
var i__136637_136994 = (0);
while(true){
if((i__136637_136994 < count__136636_136993)){
var result_136995 = chunk__136635_136992.cljs$core$IIndexed$_nth$arity$2(null,i__136637_136994);
instaparse.gll.push_message(tramp,listener,result_136995);


var G__136996 = seq__136634_136991;
var G__136997 = chunk__136635_136992;
var G__136998 = count__136636_136993;
var G__136999 = (i__136637_136994 + (1));
seq__136634_136991 = G__136996;
chunk__136635_136992 = G__136997;
count__136636_136993 = G__136998;
i__136637_136994 = G__136999;
continue;
} else {
var temp__5804__auto___137000 = cljs.core.seq(seq__136634_136991);
if(temp__5804__auto___137000){
var seq__136634_137001__$1 = temp__5804__auto___137000;
if(cljs.core.chunked_seq_QMARK_(seq__136634_137001__$1)){
var c__5525__auto___137002 = cljs.core.chunk_first(seq__136634_137001__$1);
var G__137003 = cljs.core.chunk_rest(seq__136634_137001__$1);
var G__137004 = c__5525__auto___137002;
var G__137005 = cljs.core.count(c__5525__auto___137002);
var G__137006 = (0);
seq__136634_136991 = G__137003;
chunk__136635_136992 = G__137004;
count__136636_136993 = G__137005;
i__136637_136994 = G__137006;
continue;
} else {
var result_137007 = cljs.core.first(seq__136634_137001__$1);
instaparse.gll.push_message(tramp,listener,result_137007);


var G__137008 = cljs.core.next(seq__136634_137001__$1);
var G__137009 = null;
var G__137010 = (0);
var G__137011 = (0);
seq__136634_136991 = G__137008;
chunk__136635_136992 = G__137009;
count__136636_136993 = G__137010;
i__136637_136994 = G__137011;
continue;
}
} else {
}
}
break;
}

if(cljs.core.not(full_listener_already_exists_QMARK_)){
return instaparse.gll.push_stack(tramp,(function (){
return instaparse.gll._full_parse((node_key.cljs$core$IFn$_invoke$arity$1 ? node_key.cljs$core$IFn$_invoke$arity$1((1)) : node_key.call(null,(1))),(node_key.cljs$core$IFn$_invoke$arity$1 ? node_key.cljs$core$IFn$_invoke$arity$1((0)) : node_key.call(null,(0))),tramp);
}));
} else {
return null;
}
});
instaparse.gll.merge_negative_listeners = cljs.core.partial.cljs$core$IFn$_invoke$arity$2(cljs.core.merge_with,cljs.core.into);
/**
 * Pushes a thunk onto the trampoline's negative-listener stack.
 */
instaparse.gll.push_negative_listener = (function instaparse$gll$push_negative_listener(tramp,creator,negative_listener){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"negative-listeners","negative-listeners",55241092).cljs$core$IFn$_invoke$arity$1(tramp),instaparse.gll.merge_negative_listeners,cljs.core.PersistentArrayMap.createAsIfByAssoc([(creator.cljs$core$IFn$_invoke$arity$1 ? creator.cljs$core$IFn$_invoke$arity$1((0)) : creator.call(null,(0))),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [negative_listener], null)]));
});
instaparse.gll.fail = (function instaparse$gll$fail(tramp,node_key,index,reason){

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"failure","failure",720415879).cljs$core$IFn$_invoke$arity$1(tramp),(function (failure){
var current_index = new cljs.core.Keyword(null,"index","index",-1531685915).cljs$core$IFn$_invoke$arity$1(failure);
var G__136638 = cljs.core.compare(index,current_index);
switch (G__136638) {
case (1):
return (new instaparse.gll.Failure(index,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [reason], null),null,null,null));

break;
case (0):
return (new instaparse.gll.Failure(index,cljs.core.conj.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"reason","reason",-2070751759).cljs$core$IFn$_invoke$arity$1(failure),reason),null,null,null));

break;
case (-1):
return failure;

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__136638)].join('')));

}
}));

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(index,new cljs.core.Keyword(null,"fail-index","fail-index",248726923).cljs$core$IFn$_invoke$arity$1(tramp))){
return instaparse.gll.push_result(tramp,node_key,instaparse.gll.make_success((function (){var G__136639 = new cljs.core.Keyword(null,"node-builder","node-builder",-1956562605).cljs$core$IFn$_invoke$arity$1(tramp);
var G__136640 = new cljs.core.Keyword("instaparse","failure","instaparse/failure",1422918607);
var G__136641 = (function (){var G__136644 = new cljs.core.Keyword(null,"text","text",-1790561697).cljs$core$IFn$_invoke$arity$1(tramp);
var G__136645 = index;
return (instaparse.gll.sub_sequence.cljs$core$IFn$_invoke$arity$2 ? instaparse.gll.sub_sequence.cljs$core$IFn$_invoke$arity$2(G__136644,G__136645) : instaparse.gll.sub_sequence.call(null,G__136644,G__136645));
})();
var G__136642 = index;
var G__136643 = cljs.core.count(new cljs.core.Keyword(null,"text","text",-1790561697).cljs$core$IFn$_invoke$arity$1(tramp));
return (instaparse.gll.build_node_with_meta.cljs$core$IFn$_invoke$arity$5 ? instaparse.gll.build_node_with_meta.cljs$core$IFn$_invoke$arity$5(G__136639,G__136640,G__136641,G__136642,G__136643) : instaparse.gll.build_node_with_meta.call(null,G__136639,G__136640,G__136641,G__136642,G__136643));
})(),cljs.core.count(new cljs.core.Keyword(null,"text","text",-1790561697).cljs$core$IFn$_invoke$arity$1(tramp))));
} else {
return null;
}
});
/**
 * Executes one thing on the stack (not threadsafe)
 */
instaparse.gll.step = (function instaparse$gll$step(stack){
var top = cljs.core.peek(cljs.core.deref(stack));
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(stack,cljs.core.pop);

return (top.cljs$core$IFn$_invoke$arity$0 ? top.cljs$core$IFn$_invoke$arity$0() : top.call(null));
});
/**
 * Executes the stack until exhausted
 */
instaparse.gll.run = (function instaparse$gll$run(var_args){
var G__136647 = arguments.length;
switch (G__136647) {
case 1:
return instaparse.gll.run.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return instaparse.gll.run.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(instaparse.gll.run.cljs$core$IFn$_invoke$arity$1 = (function (tramp){
return instaparse.gll.run.cljs$core$IFn$_invoke$arity$2(tramp,null);
}));

(instaparse.gll.run.cljs$core$IFn$_invoke$arity$2 = (function (tramp,found_result_QMARK_){
while(true){
var stack = new cljs.core.Keyword(null,"stack","stack",-793405930).cljs$core$IFn$_invoke$arity$1(tramp);
if(cljs.core.truth_(cljs.core.deref(new cljs.core.Keyword(null,"success","success",1890645906).cljs$core$IFn$_invoke$arity$1(tramp)))){

return cljs.core.cons(new cljs.core.Keyword(null,"result","result",1415092211).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(new cljs.core.Keyword(null,"success","success",1890645906).cljs$core$IFn$_invoke$arity$1(tramp))),(new cljs.core.LazySeq(null,((function (tramp,found_result_QMARK_,stack){
return (function (){
cljs.core.reset_BANG_(new cljs.core.Keyword(null,"success","success",1890645906).cljs$core$IFn$_invoke$arity$1(tramp),null);

return instaparse.gll.run.cljs$core$IFn$_invoke$arity$2(tramp,true);
});})(tramp,found_result_QMARK_,stack))
,null,null)));
} else {
if((cljs.core.count(cljs.core.deref(stack)) > (0))){
instaparse.gll.step(stack);

var G__137014 = tramp;
var G__137015 = found_result_QMARK_;
tramp = G__137014;
found_result_QMARK_ = G__137015;
continue;
} else {
if((cljs.core.count(cljs.core.deref(new cljs.core.Keyword(null,"negative-listeners","negative-listeners",55241092).cljs$core$IFn$_invoke$arity$1(tramp))) > (0))){
var vec__136648 = cljs.core.first(cljs.core.deref(new cljs.core.Keyword(null,"negative-listeners","negative-listeners",55241092).cljs$core$IFn$_invoke$arity$1(tramp)));
var index = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__136648,(0),null);
var listeners = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__136648,(1),null);
var listener = cljs.core.peek(listeners);

(listener.cljs$core$IFn$_invoke$arity$0 ? listener.cljs$core$IFn$_invoke$arity$0() : listener.call(null));

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(listeners),(1))){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"negative-listeners","negative-listeners",55241092).cljs$core$IFn$_invoke$arity$1(tramp),cljs.core.dissoc,index);
} else {
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(new cljs.core.Keyword(null,"negative-listeners","negative-listeners",55241092).cljs$core$IFn$_invoke$arity$1(tramp),cljs.core.update_in,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [index], null),cljs.core.pop);
}

var G__137016 = tramp;
var G__137017 = found_result_QMARK_;
tramp = G__137016;
found_result_QMARK_ = G__137017;
continue;
} else {
if(cljs.core.truth_(found_result_QMARK_)){
var next_stack = new cljs.core.Keyword(null,"next-stack","next-stack",-481930728).cljs$core$IFn$_invoke$arity$1(tramp);
cljs.core.reset_BANG_(stack,cljs.core.deref(next_stack));

cljs.core.reset_BANG_(next_stack,cljs.core.PersistentVector.EMPTY);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"generation","generation",-2132542044).cljs$core$IFn$_invoke$arity$1(tramp),cljs.core.inc);

var G__137018 = tramp;
var G__137019 = null;
tramp = G__137018;
found_result_QMARK_ = G__137019;
continue;
} else {
return null;

}
}
}
}
break;
}
}));

(instaparse.gll.run.cljs$lang$maxFixedArity = 2);

instaparse.gll.NodeListener = (function instaparse$gll$NodeListener(node_key,tramp){
return (function (result){
return instaparse.gll.push_result(tramp,node_key,result);
});
});
instaparse.gll.LookListener = (function instaparse$gll$LookListener(node_key,tramp){
return (function (result){
return instaparse.gll.push_result(tramp,node_key,instaparse.gll.make_success(null,(node_key.cljs$core$IFn$_invoke$arity$1 ? node_key.cljs$core$IFn$_invoke$arity$1((0)) : node_key.call(null,(0)))));
});
});
instaparse.gll.CatListener = (function instaparse$gll$CatListener(results_so_far,parser_sequence,node_key,tramp){

return (function (result){
var map__136656 = result;
var map__136656__$1 = cljs.core.__destructure_map(map__136656);
var parsed_result = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__136656__$1,new cljs.core.Keyword(null,"result","result",1415092211));
var continue_index = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__136656__$1,new cljs.core.Keyword(null,"index","index",-1531685915));
var new_results_so_far = instaparse.auto_flatten_seq.conj_flat(results_so_far,parsed_result);
if(cljs.core.seq(parser_sequence)){
return instaparse.gll.push_listener(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [continue_index,cljs.core.first(parser_sequence)], null),(function (){var G__136659 = new_results_so_far;
var G__136660 = cljs.core.next(parser_sequence);
var G__136661 = node_key;
var G__136662 = tramp;
return (instaparse.gll.CatListener.cljs$core$IFn$_invoke$arity$4 ? instaparse.gll.CatListener.cljs$core$IFn$_invoke$arity$4(G__136659,G__136660,G__136661,G__136662) : instaparse.gll.CatListener.call(null,G__136659,G__136660,G__136661,G__136662));
})());
} else {
return instaparse.gll.push_result(tramp,node_key,instaparse.gll.make_success(new_results_so_far,continue_index));
}
});
});
instaparse.gll.CatFullListener = (function instaparse$gll$CatFullListener(results_so_far,parser_sequence,node_key,tramp){
return (function (result){
var map__136666 = result;
var map__136666__$1 = cljs.core.__destructure_map(map__136666);
var parsed_result = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__136666__$1,new cljs.core.Keyword(null,"result","result",1415092211));
var continue_index = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__136666__$1,new cljs.core.Keyword(null,"index","index",-1531685915));
var new_results_so_far = instaparse.auto_flatten_seq.conj_flat(results_so_far,parsed_result);
if(instaparse.reduction.singleton_QMARK_(parser_sequence)){
return instaparse.gll.push_full_listener(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [continue_index,cljs.core.first(parser_sequence)], null),(function (){var G__136669 = new_results_so_far;
var G__136670 = cljs.core.next(parser_sequence);
var G__136671 = node_key;
var G__136672 = tramp;
return (instaparse.gll.CatFullListener.cljs$core$IFn$_invoke$arity$4 ? instaparse.gll.CatFullListener.cljs$core$IFn$_invoke$arity$4(G__136669,G__136670,G__136671,G__136672) : instaparse.gll.CatFullListener.call(null,G__136669,G__136670,G__136671,G__136672));
})());
} else {
if(cljs.core.seq(parser_sequence)){
return instaparse.gll.push_listener(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [continue_index,cljs.core.first(parser_sequence)], null),(function (){var G__136673 = new_results_so_far;
var G__136674 = cljs.core.next(parser_sequence);
var G__136675 = node_key;
var G__136676 = tramp;
return (instaparse.gll.CatFullListener.cljs$core$IFn$_invoke$arity$4 ? instaparse.gll.CatFullListener.cljs$core$IFn$_invoke$arity$4(G__136673,G__136674,G__136675,G__136676) : instaparse.gll.CatFullListener.call(null,G__136673,G__136674,G__136675,G__136676));
})());
} else {
return instaparse.gll.push_result(tramp,node_key,instaparse.gll.make_success(new_results_so_far,continue_index));

}
}
});
});
instaparse.gll.PlusListener = (function instaparse$gll$PlusListener(results_so_far,parser,prev_index,node_key,tramp){
return (function (result){
var map__136681 = result;
var map__136681__$1 = cljs.core.__destructure_map(map__136681);
var parsed_result = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__136681__$1,new cljs.core.Keyword(null,"result","result",1415092211));
var continue_index = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__136681__$1,new cljs.core.Keyword(null,"index","index",-1531685915));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(continue_index,prev_index)){
if((cljs.core.count(results_so_far) === (0))){
return instaparse.gll.push_result(tramp,node_key,instaparse.gll.make_success(null,continue_index));
} else {
return null;
}
} else {
var new_results_so_far = instaparse.auto_flatten_seq.conj_flat(results_so_far,parsed_result);
instaparse.gll.push_listener(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [continue_index,parser], null),(instaparse.gll.PlusListener.cljs$core$IFn$_invoke$arity$5 ? instaparse.gll.PlusListener.cljs$core$IFn$_invoke$arity$5(new_results_so_far,parser,continue_index,node_key,tramp) : instaparse.gll.PlusListener.call(null,new_results_so_far,parser,continue_index,node_key,tramp)));

return instaparse.gll.push_result(tramp,node_key,instaparse.gll.make_success(new_results_so_far,continue_index));
}
});
});
instaparse.gll.PlusFullListener = (function instaparse$gll$PlusFullListener(results_so_far,parser,prev_index,node_key,tramp){
return (function (result){
var map__136687 = result;
var map__136687__$1 = cljs.core.__destructure_map(map__136687);
var parsed_result = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__136687__$1,new cljs.core.Keyword(null,"result","result",1415092211));
var continue_index = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__136687__$1,new cljs.core.Keyword(null,"index","index",-1531685915));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(continue_index,prev_index)){
if((cljs.core.count(results_so_far) === (0))){
return instaparse.gll.push_result(tramp,node_key,instaparse.gll.make_success(null,continue_index));
} else {
return null;
}
} else {
var new_results_so_far = instaparse.auto_flatten_seq.conj_flat(results_so_far,parsed_result);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(continue_index,cljs.core.count(new cljs.core.Keyword(null,"text","text",-1790561697).cljs$core$IFn$_invoke$arity$1(tramp)))){
return instaparse.gll.push_result(tramp,node_key,instaparse.gll.make_success(new_results_so_far,continue_index));
} else {
return instaparse.gll.push_listener(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [continue_index,parser], null),(instaparse.gll.PlusFullListener.cljs$core$IFn$_invoke$arity$5 ? instaparse.gll.PlusFullListener.cljs$core$IFn$_invoke$arity$5(new_results_so_far,parser,continue_index,node_key,tramp) : instaparse.gll.PlusFullListener.call(null,new_results_so_far,parser,continue_index,node_key,tramp)));
}
}
});
});
instaparse.gll.RepListener = (function instaparse$gll$RepListener(results_so_far,n_results_so_far,parser,m,n,prev_index,node_key,tramp){
return (function (result){
var map__136695 = result;
var map__136695__$1 = cljs.core.__destructure_map(map__136695);
var parsed_result = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__136695__$1,new cljs.core.Keyword(null,"result","result",1415092211));
var continue_index = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__136695__$1,new cljs.core.Keyword(null,"index","index",-1531685915));
var new_results_so_far = instaparse.auto_flatten_seq.conj_flat(results_so_far,parsed_result);
var new_n_results_so_far = (n_results_so_far + (1));
if((((m <= new_n_results_so_far)) && ((new_n_results_so_far <= n)))){
instaparse.gll.push_result(tramp,node_key,instaparse.gll.make_success(new_results_so_far,continue_index));
} else {
}

if((new_n_results_so_far < n)){
return instaparse.gll.push_listener(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [continue_index,parser], null),(instaparse.gll.RepListener.cljs$core$IFn$_invoke$arity$8 ? instaparse.gll.RepListener.cljs$core$IFn$_invoke$arity$8(new_results_so_far,new_n_results_so_far,parser,m,n,continue_index,node_key,tramp) : instaparse.gll.RepListener.call(null,new_results_so_far,new_n_results_so_far,parser,m,n,continue_index,node_key,tramp)));
} else {
return null;
}
});
});
instaparse.gll.RepFullListener = (function instaparse$gll$RepFullListener(results_so_far,n_results_so_far,parser,m,n,prev_index,node_key,tramp){
return (function (result){
var map__136699 = result;
var map__136699__$1 = cljs.core.__destructure_map(map__136699);
var parsed_result = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__136699__$1,new cljs.core.Keyword(null,"result","result",1415092211));
var continue_index = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__136699__$1,new cljs.core.Keyword(null,"index","index",-1531685915));
var new_results_so_far = instaparse.auto_flatten_seq.conj_flat(results_so_far,parsed_result);
var new_n_results_so_far = (n_results_so_far + (1));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(continue_index,cljs.core.count(new cljs.core.Keyword(null,"text","text",-1790561697).cljs$core$IFn$_invoke$arity$1(tramp)))){
if((((m <= new_n_results_so_far)) && ((new_n_results_so_far <= n)))){
return instaparse.gll.push_result(tramp,node_key,instaparse.gll.make_success(new_results_so_far,continue_index));
} else {
return null;
}
} else {
if((new_n_results_so_far < n)){
return instaparse.gll.push_listener(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [continue_index,parser], null),(instaparse.gll.RepFullListener.cljs$core$IFn$_invoke$arity$8 ? instaparse.gll.RepFullListener.cljs$core$IFn$_invoke$arity$8(new_results_so_far,new_n_results_so_far,parser,m,n,continue_index,node_key,tramp) : instaparse.gll.RepFullListener.call(null,new_results_so_far,new_n_results_so_far,parser,m,n,continue_index,node_key,tramp)));
} else {
return null;
}
}
});
});
instaparse.gll.TopListener = (function instaparse$gll$TopListener(tramp){
return (function (result){
return cljs.core.reset_BANG_(new cljs.core.Keyword(null,"success","success",1890645906).cljs$core$IFn$_invoke$arity$1(tramp),result);
});
});
instaparse.gll.string_parse = (function instaparse$gll$string_parse(this$,index,tramp){
var string = new cljs.core.Keyword(null,"string","string",-1989541586).cljs$core$IFn$_invoke$arity$1(this$);
var text = new cljs.core.Keyword(null,"text","text",-1790561697).cljs$core$IFn$_invoke$arity$1(tramp);
var end = (function (){var x__5090__auto__ = cljs.core.count(text);
var y__5091__auto__ = (index + cljs.core.count(string));
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})();
var head = (instaparse.gll.sub_sequence.cljs$core$IFn$_invoke$arity$3 ? instaparse.gll.sub_sequence.cljs$core$IFn$_invoke$arity$3(text,index,end) : instaparse.gll.sub_sequence.call(null,text,index,end));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(string,head)){
return instaparse.gll.push_result(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),instaparse.gll.make_success(string,end));
} else {
return instaparse.gll.fail(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),index,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Keyword(null,"string","string",-1989541586),new cljs.core.Keyword(null,"expecting","expecting",-57706705),string], null));
}
});
instaparse.gll.string_full_parse = (function instaparse$gll$string_full_parse(this$,index,tramp){
var string = new cljs.core.Keyword(null,"string","string",-1989541586).cljs$core$IFn$_invoke$arity$1(this$);
var text = new cljs.core.Keyword(null,"text","text",-1790561697).cljs$core$IFn$_invoke$arity$1(tramp);
var end = (function (){var x__5090__auto__ = cljs.core.count(text);
var y__5091__auto__ = (index + cljs.core.count(string));
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})();
var head = (instaparse.gll.sub_sequence.cljs$core$IFn$_invoke$arity$3 ? instaparse.gll.sub_sequence.cljs$core$IFn$_invoke$arity$3(text,index,end) : instaparse.gll.sub_sequence.call(null,text,index,end));
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(end,cljs.core.count(text))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(string,head)))){
return instaparse.gll.push_result(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),instaparse.gll.make_success(string,end));
} else {
return instaparse.gll.fail(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),index,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Keyword(null,"string","string",-1989541586),new cljs.core.Keyword(null,"expecting","expecting",-57706705),string,new cljs.core.Keyword(null,"full","full",436801220),true], null));
}
});
instaparse.gll.equals_ignore_case = (function instaparse$gll$equals_ignore_case(s1,s2){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(s1.toUpperCase(),s2.toUpperCase());
});
instaparse.gll.string_case_insensitive_parse = (function instaparse$gll$string_case_insensitive_parse(this$,index,tramp){
var string = new cljs.core.Keyword(null,"string","string",-1989541586).cljs$core$IFn$_invoke$arity$1(this$);
var text = new cljs.core.Keyword(null,"text","text",-1790561697).cljs$core$IFn$_invoke$arity$1(tramp);
var end = (function (){var x__5090__auto__ = cljs.core.count(text);
var y__5091__auto__ = (index + cljs.core.count(string));
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})();
var head = (instaparse.gll.sub_sequence.cljs$core$IFn$_invoke$arity$3 ? instaparse.gll.sub_sequence.cljs$core$IFn$_invoke$arity$3(text,index,end) : instaparse.gll.sub_sequence.call(null,text,index,end));
if(instaparse.gll.equals_ignore_case(string,head)){
return instaparse.gll.push_result(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),instaparse.gll.make_success(string,end));
} else {
return instaparse.gll.fail(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),index,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Keyword(null,"string","string",-1989541586),new cljs.core.Keyword(null,"expecting","expecting",-57706705),string], null));
}
});
instaparse.gll.string_case_insensitive_full_parse = (function instaparse$gll$string_case_insensitive_full_parse(this$,index,tramp){
var string = new cljs.core.Keyword(null,"string","string",-1989541586).cljs$core$IFn$_invoke$arity$1(this$);
var text = new cljs.core.Keyword(null,"text","text",-1790561697).cljs$core$IFn$_invoke$arity$1(tramp);
var end = (function (){var x__5090__auto__ = cljs.core.count(text);
var y__5091__auto__ = (index + cljs.core.count(string));
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})();
var head = (instaparse.gll.sub_sequence.cljs$core$IFn$_invoke$arity$3 ? instaparse.gll.sub_sequence.cljs$core$IFn$_invoke$arity$3(text,index,end) : instaparse.gll.sub_sequence.call(null,text,index,end));
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(end,cljs.core.count(text))) && (instaparse.gll.equals_ignore_case(string,head)))){
return instaparse.gll.push_result(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),instaparse.gll.make_success(string,end));
} else {
return instaparse.gll.fail(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),index,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Keyword(null,"string","string",-1989541586),new cljs.core.Keyword(null,"expecting","expecting",-57706705),string,new cljs.core.Keyword(null,"full","full",436801220),true], null));
}
});
instaparse.gll.single_char_code_at = (function instaparse$gll$single_char_code_at(text,index){
return text.charCodeAt(index);
});
instaparse.gll.unicode_code_point_at = (function instaparse$gll$unicode_code_point_at(text,index){
return goog.i18n.uChar.getCodePointAround(text,(index | (0)));
});
instaparse.gll.code_point__GT_chars = (function instaparse$gll$code_point__GT_chars(code_point){
return goog.i18n.uChar.fromCharCode(code_point);
});
instaparse.gll.char_range_parse = (function instaparse$gll$char_range_parse(this$,index,tramp){
var lo = new cljs.core.Keyword(null,"lo","lo",-931799889).cljs$core$IFn$_invoke$arity$1(this$);
var hi = new cljs.core.Keyword(null,"hi","hi",-1821422114).cljs$core$IFn$_invoke$arity$1(this$);
var text = new cljs.core.Keyword(null,"text","text",-1790561697).cljs$core$IFn$_invoke$arity$1(tramp);
if((index >= cljs.core.count(text))){
return instaparse.gll.fail(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),index,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Keyword(null,"char","char",-641587586),new cljs.core.Keyword(null,"expecting","expecting",-57706705),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"char-range","char-range",1443391389),true,new cljs.core.Keyword(null,"lo","lo",-931799889),lo,new cljs.core.Keyword(null,"hi","hi",-1821422114),hi], null)], null));
} else {
if((hi <= (65535))){
var code = instaparse.gll.single_char_code_at(text,index);
if((((lo <= code)) && ((code <= hi)))){
return instaparse.gll.push_result(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),instaparse.gll.make_success(cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.char$(code)),(index + (1))));
} else {
return instaparse.gll.fail(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),index,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Keyword(null,"char","char",-641587586),new cljs.core.Keyword(null,"expecting","expecting",-57706705),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"char-range","char-range",1443391389),true,new cljs.core.Keyword(null,"lo","lo",-931799889),lo,new cljs.core.Keyword(null,"hi","hi",-1821422114),hi], null)], null));
}
} else {
var code_point = instaparse.gll.unicode_code_point_at(text,index);
var char_string = instaparse.gll.code_point__GT_chars(code_point);
if((((lo <= code_point)) && ((code_point <= hi)))){
return instaparse.gll.push_result(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),instaparse.gll.make_success(char_string,(index + cljs.core.count(char_string))));
} else {
return instaparse.gll.fail(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),index,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Keyword(null,"char","char",-641587586),new cljs.core.Keyword(null,"expecting","expecting",-57706705),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"char-range","char-range",1443391389),true,new cljs.core.Keyword(null,"lo","lo",-931799889),lo,new cljs.core.Keyword(null,"hi","hi",-1821422114),hi], null)], null));
}

}
}
});
instaparse.gll.char_range_full_parse = (function instaparse$gll$char_range_full_parse(this$,index,tramp){
var lo = new cljs.core.Keyword(null,"lo","lo",-931799889).cljs$core$IFn$_invoke$arity$1(this$);
var hi = new cljs.core.Keyword(null,"hi","hi",-1821422114).cljs$core$IFn$_invoke$arity$1(this$);
var text = new cljs.core.Keyword(null,"text","text",-1790561697).cljs$core$IFn$_invoke$arity$1(tramp);
var end = cljs.core.count(text);
if((index >= cljs.core.count(text))){
return instaparse.gll.fail(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),index,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Keyword(null,"char","char",-641587586),new cljs.core.Keyword(null,"expecting","expecting",-57706705),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"char-range","char-range",1443391389),true,new cljs.core.Keyword(null,"lo","lo",-931799889),lo,new cljs.core.Keyword(null,"hi","hi",-1821422114),hi], null)], null));
} else {
if((hi <= (65535))){
var code = instaparse.gll.single_char_code_at(text,index);
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((index + (1)),end)) && ((((lo <= code)) && ((code <= hi)))))){
return instaparse.gll.push_result(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),instaparse.gll.make_success(cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.char$(code)),end));
} else {
return instaparse.gll.fail(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),index,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Keyword(null,"char","char",-641587586),new cljs.core.Keyword(null,"expecting","expecting",-57706705),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"char-range","char-range",1443391389),true,new cljs.core.Keyword(null,"lo","lo",-931799889),lo,new cljs.core.Keyword(null,"hi","hi",-1821422114),hi], null)], null));
}
} else {
var code_point = instaparse.gll.unicode_code_point_at(text,index);
var char_string = instaparse.gll.code_point__GT_chars(code_point);
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((index + cljs.core.count(char_string)),end)) && ((((lo <= code_point)) && ((code_point <= hi)))))){
return instaparse.gll.push_result(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),instaparse.gll.make_success(char_string,end));
} else {
return instaparse.gll.fail(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),index,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Keyword(null,"char","char",-641587586),new cljs.core.Keyword(null,"expecting","expecting",-57706705),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"char-range","char-range",1443391389),true,new cljs.core.Keyword(null,"lo","lo",-931799889),lo,new cljs.core.Keyword(null,"hi","hi",-1821422114),hi], null),new cljs.core.Keyword(null,"full","full",436801220),true], null));
}

}
}
});
instaparse.gll.re_match_at_front = (function instaparse$gll$re_match_at_front(regexp,text){
var re = (new RegExp(regexp.source,["g",instaparse.util.regexp_flags(regexp)].join('')));
var m = re.exec(text);
if(cljs.core.truth_((function (){var and__5000__auto__ = m;
if(cljs.core.truth_(and__5000__auto__)){
return (m.index === (0));
} else {
return and__5000__auto__;
}
})())){
return cljs.core.first(m);
} else {
return null;
}
});
instaparse.gll.regexp_parse = (function instaparse$gll$regexp_parse(this$,index,tramp){
var regexp = new cljs.core.Keyword(null,"regexp","regexp",-541372782).cljs$core$IFn$_invoke$arity$1(this$);
var text = new cljs.core.Keyword(null,"segment","segment",-964921196).cljs$core$IFn$_invoke$arity$1(tramp);
var substring = (instaparse.gll.sub_sequence.cljs$core$IFn$_invoke$arity$2 ? instaparse.gll.sub_sequence.cljs$core$IFn$_invoke$arity$2(text,index) : instaparse.gll.sub_sequence.call(null,text,index));
var match = instaparse.gll.re_match_at_front(regexp,substring);
if(cljs.core.truth_(match)){
return instaparse.gll.push_result(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),instaparse.gll.make_success(match,(index + cljs.core.count(match))));
} else {
return instaparse.gll.fail(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),index,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Keyword(null,"regexp","regexp",-541372782),new cljs.core.Keyword(null,"expecting","expecting",-57706705),regexp], null));
}
});
instaparse.gll.regexp_full_parse = (function instaparse$gll$regexp_full_parse(this$,index,tramp){
var regexp = new cljs.core.Keyword(null,"regexp","regexp",-541372782).cljs$core$IFn$_invoke$arity$1(this$);
var text = new cljs.core.Keyword(null,"segment","segment",-964921196).cljs$core$IFn$_invoke$arity$1(tramp);
var substring = (instaparse.gll.sub_sequence.cljs$core$IFn$_invoke$arity$2 ? instaparse.gll.sub_sequence.cljs$core$IFn$_invoke$arity$2(text,index) : instaparse.gll.sub_sequence.call(null,text,index));
var match = instaparse.gll.re_match_at_front(regexp,substring);
var desired_length = (cljs.core.count(text) - index);
if(cljs.core.truth_((function (){var and__5000__auto__ = match;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(match),desired_length);
} else {
return and__5000__auto__;
}
})())){
return instaparse.gll.push_result(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),instaparse.gll.make_success(match,cljs.core.count(text)));
} else {
return instaparse.gll.fail(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),index,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Keyword(null,"regexp","regexp",-541372782),new cljs.core.Keyword(null,"expecting","expecting",-57706705),regexp,new cljs.core.Keyword(null,"full","full",436801220),true], null));
}
});
instaparse.gll.cat_parse = (function instaparse$gll$cat_parse(this$,index,tramp){
var parsers = new cljs.core.Keyword(null,"parsers","parsers",-804353827).cljs$core$IFn$_invoke$arity$1(this$);
return instaparse.gll.push_listener(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,cljs.core.first(parsers)], null),instaparse.gll.CatListener(instaparse.auto_flatten_seq.EMPTY,cljs.core.next(parsers),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),tramp));
});
instaparse.gll.cat_full_parse = (function instaparse$gll$cat_full_parse(this$,index,tramp){
var parsers = new cljs.core.Keyword(null,"parsers","parsers",-804353827).cljs$core$IFn$_invoke$arity$1(this$);
return instaparse.gll.push_listener(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,cljs.core.first(parsers)], null),instaparse.gll.CatFullListener(instaparse.auto_flatten_seq.EMPTY,cljs.core.next(parsers),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),tramp));
});
instaparse.gll.plus_parse = (function instaparse$gll$plus_parse(this$,index,tramp){
var parser = new cljs.core.Keyword(null,"parser","parser",-1543495310).cljs$core$IFn$_invoke$arity$1(this$);
return instaparse.gll.push_listener(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,parser], null),instaparse.gll.PlusListener(instaparse.auto_flatten_seq.EMPTY,parser,index,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),tramp));
});
instaparse.gll.plus_full_parse = (function instaparse$gll$plus_full_parse(this$,index,tramp){
var parser = new cljs.core.Keyword(null,"parser","parser",-1543495310).cljs$core$IFn$_invoke$arity$1(this$);
return instaparse.gll.push_listener(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,parser], null),instaparse.gll.PlusFullListener(instaparse.auto_flatten_seq.EMPTY,parser,index,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),tramp));
});
instaparse.gll.rep_parse = (function instaparse$gll$rep_parse(this$,index,tramp){
var parser = new cljs.core.Keyword(null,"parser","parser",-1543495310).cljs$core$IFn$_invoke$arity$1(this$);
var m = new cljs.core.Keyword(null,"min","min",444991522).cljs$core$IFn$_invoke$arity$1(this$);
var n = new cljs.core.Keyword(null,"max","max",61366548).cljs$core$IFn$_invoke$arity$1(this$);
if((m === (0))){
instaparse.gll.push_result(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),instaparse.gll.make_success(null,index));

if((n >= (1))){
return instaparse.gll.push_listener(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,parser], null),instaparse.gll.RepListener(instaparse.auto_flatten_seq.EMPTY,(0),parser,(1),n,index,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),tramp));
} else {
return null;
}
} else {
return instaparse.gll.push_listener(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,parser], null),instaparse.gll.RepListener(instaparse.auto_flatten_seq.EMPTY,(0),parser,m,n,index,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),tramp));
}
});
instaparse.gll.rep_full_parse = (function instaparse$gll$rep_full_parse(this$,index,tramp){
var parser = new cljs.core.Keyword(null,"parser","parser",-1543495310).cljs$core$IFn$_invoke$arity$1(this$);
var m = new cljs.core.Keyword(null,"min","min",444991522).cljs$core$IFn$_invoke$arity$1(this$);
var n = new cljs.core.Keyword(null,"max","max",61366548).cljs$core$IFn$_invoke$arity$1(this$);
if((m === (0))){
instaparse.gll.push_result(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),instaparse.gll.make_success(null,index));

if((n >= (1))){
return instaparse.gll.push_listener(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,parser], null),instaparse.gll.RepFullListener(instaparse.auto_flatten_seq.EMPTY,(0),parser,(1),n,index,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),tramp));
} else {
return null;
}
} else {
return instaparse.gll.push_listener(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,parser], null),instaparse.gll.RepFullListener(instaparse.auto_flatten_seq.EMPTY,(0),parser,m,n,index,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),tramp));
}
});
instaparse.gll.star_parse = (function instaparse$gll$star_parse(this$,index,tramp){
var parser = new cljs.core.Keyword(null,"parser","parser",-1543495310).cljs$core$IFn$_invoke$arity$1(this$);
instaparse.gll.push_listener(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,parser], null),instaparse.gll.PlusListener(instaparse.auto_flatten_seq.EMPTY,parser,index,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),tramp));

return instaparse.gll.push_result(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),instaparse.gll.make_success(null,index));
});
instaparse.gll.star_full_parse = (function instaparse$gll$star_full_parse(this$,index,tramp){
var parser = new cljs.core.Keyword(null,"parser","parser",-1543495310).cljs$core$IFn$_invoke$arity$1(this$);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(index,cljs.core.count(new cljs.core.Keyword(null,"text","text",-1790561697).cljs$core$IFn$_invoke$arity$1(tramp)))){
return instaparse.gll.push_result(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),instaparse.gll.make_success(null,index));
} else {
return instaparse.gll.push_listener(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,parser], null),instaparse.gll.PlusFullListener(instaparse.auto_flatten_seq.EMPTY,parser,index,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),tramp));
}
});
instaparse.gll.alt_parse = (function instaparse$gll$alt_parse(this$,index,tramp){
var parsers = new cljs.core.Keyword(null,"parsers","parsers",-804353827).cljs$core$IFn$_invoke$arity$1(this$);
var seq__136773 = cljs.core.seq(parsers);
var chunk__136774 = null;
var count__136775 = (0);
var i__136776 = (0);
while(true){
if((i__136776 < count__136775)){
var parser = chunk__136774.cljs$core$IIndexed$_nth$arity$2(null,i__136776);
instaparse.gll.push_listener(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,parser], null),instaparse.gll.NodeListener(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),tramp));


var G__137050 = seq__136773;
var G__137051 = chunk__136774;
var G__137052 = count__136775;
var G__137053 = (i__136776 + (1));
seq__136773 = G__137050;
chunk__136774 = G__137051;
count__136775 = G__137052;
i__136776 = G__137053;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__136773);
if(temp__5804__auto__){
var seq__136773__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__136773__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__136773__$1);
var G__137056 = cljs.core.chunk_rest(seq__136773__$1);
var G__137057 = c__5525__auto__;
var G__137058 = cljs.core.count(c__5525__auto__);
var G__137059 = (0);
seq__136773 = G__137056;
chunk__136774 = G__137057;
count__136775 = G__137058;
i__136776 = G__137059;
continue;
} else {
var parser = cljs.core.first(seq__136773__$1);
instaparse.gll.push_listener(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,parser], null),instaparse.gll.NodeListener(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),tramp));


var G__137061 = cljs.core.next(seq__136773__$1);
var G__137062 = null;
var G__137063 = (0);
var G__137064 = (0);
seq__136773 = G__137061;
chunk__136774 = G__137062;
count__136775 = G__137063;
i__136776 = G__137064;
continue;
}
} else {
return null;
}
}
break;
}
});
instaparse.gll.alt_full_parse = (function instaparse$gll$alt_full_parse(this$,index,tramp){
var parsers = new cljs.core.Keyword(null,"parsers","parsers",-804353827).cljs$core$IFn$_invoke$arity$1(this$);
var seq__136785 = cljs.core.seq(parsers);
var chunk__136786 = null;
var count__136787 = (0);
var i__136788 = (0);
while(true){
if((i__136788 < count__136787)){
var parser = chunk__136786.cljs$core$IIndexed$_nth$arity$2(null,i__136788);
instaparse.gll.push_full_listener(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,parser], null),instaparse.gll.NodeListener(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),tramp));


var G__137065 = seq__136785;
var G__137066 = chunk__136786;
var G__137067 = count__136787;
var G__137068 = (i__136788 + (1));
seq__136785 = G__137065;
chunk__136786 = G__137066;
count__136787 = G__137067;
i__136788 = G__137068;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__136785);
if(temp__5804__auto__){
var seq__136785__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__136785__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__136785__$1);
var G__137069 = cljs.core.chunk_rest(seq__136785__$1);
var G__137070 = c__5525__auto__;
var G__137071 = cljs.core.count(c__5525__auto__);
var G__137072 = (0);
seq__136785 = G__137069;
chunk__136786 = G__137070;
count__136787 = G__137071;
i__136788 = G__137072;
continue;
} else {
var parser = cljs.core.first(seq__136785__$1);
instaparse.gll.push_full_listener(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,parser], null),instaparse.gll.NodeListener(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),tramp));


var G__137073 = cljs.core.next(seq__136785__$1);
var G__137074 = null;
var G__137075 = (0);
var G__137076 = (0);
seq__136785 = G__137073;
chunk__136786 = G__137074;
count__136787 = G__137075;
i__136788 = G__137076;
continue;
}
} else {
return null;
}
}
break;
}
});
instaparse.gll.ordered_alt_parse = (function instaparse$gll$ordered_alt_parse(this$,index,tramp){
var parser1 = new cljs.core.Keyword(null,"parser1","parser1",-439601422).cljs$core$IFn$_invoke$arity$1(this$);
var parser2 = new cljs.core.Keyword(null,"parser2","parser2",1013754688).cljs$core$IFn$_invoke$arity$1(this$);
var node_key_parser1 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,parser1], null);
var node_key_parser2 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,parser2], null);
var listener = instaparse.gll.NodeListener(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),tramp);
instaparse.gll.push_listener(tramp,node_key_parser1,listener);

return instaparse.gll.push_negative_listener(tramp,node_key_parser1,(function (){
return instaparse.gll.push_listener(tramp,node_key_parser2,listener);
}));
});
instaparse.gll.ordered_alt_full_parse = (function instaparse$gll$ordered_alt_full_parse(this$,index,tramp){
var parser1 = new cljs.core.Keyword(null,"parser1","parser1",-439601422).cljs$core$IFn$_invoke$arity$1(this$);
var parser2 = new cljs.core.Keyword(null,"parser2","parser2",1013754688).cljs$core$IFn$_invoke$arity$1(this$);
var node_key_parser1 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,parser1], null);
var node_key_parser2 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,parser2], null);
var listener = instaparse.gll.NodeListener(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),tramp);
instaparse.gll.push_full_listener(tramp,node_key_parser1,listener);

return instaparse.gll.push_negative_listener(tramp,node_key_parser1,(function (){
return instaparse.gll.push_full_listener(tramp,node_key_parser2,listener);
}));
});
instaparse.gll.opt_parse = (function instaparse$gll$opt_parse(this$,index,tramp){
var parser = new cljs.core.Keyword(null,"parser","parser",-1543495310).cljs$core$IFn$_invoke$arity$1(this$);
instaparse.gll.push_listener(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,parser], null),instaparse.gll.NodeListener(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),tramp));

return instaparse.gll.push_result(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),instaparse.gll.make_success(null,index));
});
instaparse.gll.opt_full_parse = (function instaparse$gll$opt_full_parse(this$,index,tramp){
var parser = new cljs.core.Keyword(null,"parser","parser",-1543495310).cljs$core$IFn$_invoke$arity$1(this$);
instaparse.gll.push_full_listener(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,parser], null),instaparse.gll.NodeListener(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),tramp));

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(index,cljs.core.count(new cljs.core.Keyword(null,"text","text",-1790561697).cljs$core$IFn$_invoke$arity$1(tramp)))){
return instaparse.gll.push_result(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),instaparse.gll.make_success(null,index));
} else {
return instaparse.gll.fail(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),index,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Keyword(null,"optional","optional",2053951509),new cljs.core.Keyword(null,"expecting","expecting",-57706705),new cljs.core.Keyword(null,"end-of-string","end-of-string",1567354241)], null));
}
});
instaparse.gll.non_terminal_parse = (function instaparse$gll$non_terminal_parse(this$,index,tramp){
var parser = instaparse.gll.get_parser(new cljs.core.Keyword(null,"grammar","grammar",1881328267).cljs$core$IFn$_invoke$arity$1(tramp),new cljs.core.Keyword(null,"keyword","keyword",811389747).cljs$core$IFn$_invoke$arity$1(this$));
return instaparse.gll.push_listener(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,parser], null),instaparse.gll.NodeListener(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),tramp));
});
instaparse.gll.non_terminal_full_parse = (function instaparse$gll$non_terminal_full_parse(this$,index,tramp){
var parser = instaparse.gll.get_parser(new cljs.core.Keyword(null,"grammar","grammar",1881328267).cljs$core$IFn$_invoke$arity$1(tramp),new cljs.core.Keyword(null,"keyword","keyword",811389747).cljs$core$IFn$_invoke$arity$1(this$));
return instaparse.gll.push_full_listener(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,parser], null),instaparse.gll.NodeListener(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),tramp));
});
instaparse.gll.lookahead_parse = (function instaparse$gll$lookahead_parse(this$,index,tramp){
var parser = new cljs.core.Keyword(null,"parser","parser",-1543495310).cljs$core$IFn$_invoke$arity$1(this$);
return instaparse.gll.push_listener(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,parser], null),instaparse.gll.LookListener(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),tramp));
});
instaparse.gll.lookahead_full_parse = (function instaparse$gll$lookahead_full_parse(this$,index,tramp){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(index,cljs.core.count(new cljs.core.Keyword(null,"text","text",-1790561697).cljs$core$IFn$_invoke$arity$1(tramp)))){
return instaparse.gll.lookahead_parse(this$,index,tramp);
} else {
return instaparse.gll.fail(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),index,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Keyword(null,"lookahead","lookahead",-400102393),new cljs.core.Keyword(null,"expecting","expecting",-57706705),new cljs.core.Keyword(null,"end-of-string","end-of-string",1567354241)], null));
}
});
instaparse.gll.negative_lookahead_parse = (function instaparse$gll$negative_lookahead_parse(this$,index,tramp){
var parser = new cljs.core.Keyword(null,"parser","parser",-1543495310).cljs$core$IFn$_invoke$arity$1(this$);
var node_key = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,parser], null);
if(cljs.core.truth_(instaparse.gll.result_exists_QMARK_(tramp,node_key))){
return instaparse.gll.fail(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),index,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Keyword(null,"negative-lookahead","negative-lookahead",874382387)], null));
} else {
instaparse.gll.push_listener(tramp,node_key,(function (){var fail_send = (new cljs.core.Delay((function (){
return instaparse.gll.fail(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),index,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Keyword(null,"negative-lookahead","negative-lookahead",874382387),new cljs.core.Keyword(null,"expecting","expecting",-57706705),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"NOT","NOT",-1689245341),instaparse.print.combinators__GT_str.cljs$core$IFn$_invoke$arity$1(parser)], null)], null));
}),null));
return (function (result){
return cljs.core.force(fail_send);
});
})());

return instaparse.gll.push_negative_listener(tramp,node_key,(function (){
if(cljs.core.not(instaparse.gll.result_exists_QMARK_(tramp,node_key))){
return instaparse.gll.push_result(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),instaparse.gll.make_success(null,index));
} else {
return null;
}
}));
}
});
instaparse.gll.epsilon_parse = (function instaparse$gll$epsilon_parse(this$,index,tramp){
return instaparse.gll.push_result(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),instaparse.gll.make_success(null,index));
});
instaparse.gll.epsilon_full_parse = (function instaparse$gll$epsilon_full_parse(this$,index,tramp){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(index,cljs.core.count(new cljs.core.Keyword(null,"text","text",-1790561697).cljs$core$IFn$_invoke$arity$1(tramp)))){
return instaparse.gll.push_result(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),instaparse.gll.make_success(null,index));
} else {
return instaparse.gll.fail(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [index,this$], null),index,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Keyword(null,"Epsilon","Epsilon",133418452),new cljs.core.Keyword(null,"expecting","expecting",-57706705),new cljs.core.Keyword(null,"end-of-string","end-of-string",1567354241)], null));
}
});
instaparse.gll.start_parser = (function instaparse$gll$start_parser(tramp,parser,partial_QMARK_){
if(cljs.core.truth_(partial_QMARK_)){
return instaparse.gll.push_listener(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0),parser], null),instaparse.gll.TopListener(tramp));
} else {
return instaparse.gll.push_full_listener(tramp,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0),parser], null),instaparse.gll.TopListener(tramp));
}
});
instaparse.gll.parses = (function instaparse$gll$parses(grammar,start,text,partial_QMARK_){

var tramp = instaparse.gll.make_tramp.cljs$core$IFn$_invoke$arity$2(grammar,text);
var parser = instaparse.combinators_source.nt(start);
instaparse.gll.start_parser(tramp,parser,partial_QMARK_);

var temp__5802__auto__ = instaparse.gll.run.cljs$core$IFn$_invoke$arity$1(tramp);
if(cljs.core.truth_(temp__5802__auto__)){
var all_parses = temp__5802__auto__;
return all_parses;
} else {
return cljs.core.with_meta(cljs.core.List.EMPTY,instaparse.failure.augment_failure(cljs.core.deref(new cljs.core.Keyword(null,"failure","failure",720415879).cljs$core$IFn$_invoke$arity$1(tramp)),text));
}
});
instaparse.gll.parse = (function instaparse$gll$parse(grammar,start,text,partial_QMARK_){

var tramp = instaparse.gll.make_tramp.cljs$core$IFn$_invoke$arity$2(grammar,text);
var parser = instaparse.combinators_source.nt(start);
instaparse.gll.start_parser(tramp,parser,partial_QMARK_);

var temp__5802__auto__ = instaparse.gll.run.cljs$core$IFn$_invoke$arity$1(tramp);
if(cljs.core.truth_(temp__5802__auto__)){
var all_parses = temp__5802__auto__;
return cljs.core.first(all_parses);
} else {
return instaparse.failure.augment_failure(cljs.core.deref(new cljs.core.Keyword(null,"failure","failure",720415879).cljs$core$IFn$_invoke$arity$1(tramp)),text);
}
});
instaparse.gll.build_node_with_meta = (function instaparse$gll$build_node_with_meta(node_builder,tag,content,start,end){
return cljs.core.with_meta((node_builder.cljs$core$IFn$_invoke$arity$2 ? node_builder.cljs$core$IFn$_invoke$arity$2(tag,content) : node_builder.call(null,tag,content)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("instaparse.gll","start-index","instaparse.gll/start-index",404653620),start,new cljs.core.Keyword("instaparse.gll","end-index","instaparse.gll/end-index",-1851404441),end], null));
});
instaparse.gll.build_total_failure_node = (function instaparse$gll$build_total_failure_node(node_builder,start,text){
var build_failure_node = instaparse.gll.build_node_with_meta(node_builder,new cljs.core.Keyword("instaparse","failure","instaparse/failure",1422918607),text,(0),cljs.core.count(text));
var build_start_node = instaparse.gll.build_node_with_meta(node_builder,start,build_failure_node,(0),cljs.core.count(text));
return build_start_node;
});
instaparse.gll.parses_total_after_fail = (function instaparse$gll$parses_total_after_fail(grammar,start,text,fail_index,partial_QMARK_,node_builder){
var tramp = instaparse.gll.make_tramp.cljs$core$IFn$_invoke$arity$4(grammar,text,fail_index,node_builder);
var parser = instaparse.combinators_source.nt(start);

instaparse.gll.start_parser(tramp,parser,partial_QMARK_);

var temp__5802__auto__ = instaparse.gll.run.cljs$core$IFn$_invoke$arity$1(tramp);
if(cljs.core.truth_(temp__5802__auto__)){
var all_parses = temp__5802__auto__;
return all_parses;
} else {
return (new cljs.core.List(null,instaparse.gll.build_total_failure_node(node_builder,start,text),null,(1),null));
}
});
/**
 * A variation on with-meta that merges the existing metamap into the new metamap,
 * rather than overwriting the metamap entirely.
 */
instaparse.gll.merge_meta = (function instaparse$gll$merge_meta(obj,metamap){
return cljs.core.with_meta(obj,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([metamap,cljs.core.meta(obj)], 0)));
});
instaparse.gll.parses_total = (function instaparse$gll$parses_total(grammar,start,text,partial_QMARK_,node_builder){

var all_parses = instaparse.gll.parses(grammar,start,text,partial_QMARK_);
if(cljs.core.seq(all_parses)){
return all_parses;
} else {
return instaparse.gll.merge_meta(instaparse.gll.parses_total_after_fail(grammar,start,text,new cljs.core.Keyword(null,"index","index",-1531685915).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(all_parses)),partial_QMARK_,node_builder),cljs.core.meta(all_parses));
}
});
instaparse.gll.parse_total_after_fail = (function instaparse$gll$parse_total_after_fail(grammar,start,text,fail_index,partial_QMARK_,node_builder){
var tramp = instaparse.gll.make_tramp.cljs$core$IFn$_invoke$arity$4(grammar,text,fail_index,node_builder);
var parser = instaparse.combinators_source.nt(start);

instaparse.gll.start_parser(tramp,parser,partial_QMARK_);

var temp__5802__auto__ = instaparse.gll.run.cljs$core$IFn$_invoke$arity$1(tramp);
if(cljs.core.truth_(temp__5802__auto__)){
var all_parses = temp__5802__auto__;
return cljs.core.first(all_parses);
} else {
return instaparse.gll.build_total_failure_node(node_builder,start,text);
}
});
instaparse.gll.parse_total = (function instaparse$gll$parse_total(grammar,start,text,partial_QMARK_,node_builder){

var result = instaparse.gll.parse(grammar,start,text,partial_QMARK_);
if((!((result instanceof instaparse.gll.Failure)))){
return result;
} else {
return instaparse.gll.merge_meta(instaparse.gll.parse_total_after_fail(grammar,start,text,new cljs.core.Keyword(null,"index","index",-1531685915).cljs$core$IFn$_invoke$arity$1(result),partial_QMARK_,node_builder),result);
}
});

//# sourceMappingURL=instaparse.gll.js.map
