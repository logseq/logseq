goog.provide('sci.impl.protocols');
sci.impl.protocols.defprotocol = (function sci$impl$protocols$defprotocol(var_args){
var args__5732__auto__ = [];
var len__5726__auto___80008 = arguments.length;
var i__5727__auto___80009 = (0);
while(true){
if((i__5727__auto___80009 < len__5726__auto___80008)){
args__5732__auto__.push((arguments[i__5727__auto___80009]));

var G__80010 = (i__5727__auto___80009 + (1));
i__5727__auto___80009 = G__80010;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((4) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((4)),(0),null)):null);
return sci.impl.protocols.defprotocol.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),argseq__5733__auto__);
});

(sci.impl.protocols.defprotocol.cljs$core$IFn$_invoke$arity$variadic = (function (_,___$1,_ctx,protocol_name,signatures){
var vec__79608 = (function (){var sig = cljs.core.first(signatures);
if(typeof sig === 'string'){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [sig,cljs.core.rest(signatures)], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [null,signatures], null);
}
})();
var docstring = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__79608,(0),null);
var signatures__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__79608,(1),null);
var vec__79611 = (function (){var opt = cljs.core.first(signatures__$1);
if((opt instanceof cljs.core.Keyword)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.PersistentArrayMap.createAsIfByAssoc([opt,cljs.core.second(signatures__$1)]),cljs.core.nnext(signatures__$1)], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [null,signatures__$1], null);
}
})();
var opts = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__79611,(0),null);
var signatures__$2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__79611,(1),null);
var current_ns = cljs.core.str.cljs$core$IFn$_invoke$arity$1(sci.impl.vars.current_ns_name());
var fq_name = cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(current_ns,cljs.core.str.cljs$core$IFn$_invoke$arity$1(protocol_name));
var extend_meta = new cljs.core.Keyword(null,"extend-via-metadata","extend-via-metadata",-427346794).cljs$core$IFn$_invoke$arity$1(opts);
var expansion = cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol(null,"do","do",1686842252,null),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol(null,"def","def",597100991,null),null,(1),null)),(new cljs.core.List(null,cljs.core.with_meta(protocol_name,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"doc","doc",1913296891),docstring], null)),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","cond->","cljs.core/cond->",-113941356,null),null,(1),null)),(new cljs.core.List(null,cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.array_map,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Keyword(null,"methods","methods",453930866),null,(1),null)),(new cljs.core.List(null,cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.hash_set,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$0()))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,new cljs.core.Keyword(null,"name","name",1843675177),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"quote","quote",1377916282,null),null,(1),null)),(new cljs.core.List(null,fq_name,null,(1),null))))),null,(1),null)),(new cljs.core.List(null,new cljs.core.Keyword(null,"ns","ns",441598760),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol("cljs.core","*ns*","cljs.core/*ns*",1155497085,null),null,(1),null))], 0))))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,extend_meta,null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","assoc","cljs.core/assoc",322326297,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Keyword(null,"extend-via-metadata","extend-via-metadata",-427346794),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,true,null,(1),null))], 0)))),null,(1),null))], 0)))),null,(1),null))], 0)))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__79634){
var vec__79636 = p__79634;
var seq__79637 = cljs.core.seq(vec__79636);
var first__79638 = cljs.core.first(seq__79637);
var seq__79637__$1 = cljs.core.next(seq__79637);
var method_name = first__79638;
var ___$2 = seq__79637__$1;
var fq_name__$1 = cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(current_ns,cljs.core.str.cljs$core$IFn$_invoke$arity$1(method_name));
var impls = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","defmulti","cljs.core/defmulti",723984225,null),null,(1),null)),(new cljs.core.List(null,method_name,null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,new cljs.core.Symbol("cljs.core","protocol-type-impl","cljs.core/protocol-type-impl",155177701,null),null,(1),null))], 0)))),cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","defmethod","cljs.core/defmethod",-180785162,null),null,(1),null)),(new cljs.core.List(null,method_name,null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,new cljs.core.Keyword("sci.impl.protocols","reified","sci.impl.protocols/reified",-2019939396),null,(1),null)),(new cljs.core.List(null,cljs.core.vec(cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol(null,"x__79580__auto__","x__79580__auto__",1592002223,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"&","&",-2144855648,null),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,new cljs.core.Symbol(null,"args__79581__auto__","args__79581__auto__",-621009945,null),null,(1),null))], 0))))),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","let","cljs.core/let",-308701135,null),null,(1),null)),(new cljs.core.List(null,cljs.core.vec(cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"methods__79582__auto__","methods__79582__auto__",428910361,null),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","-reified-methods","cljs.core/-reified-methods",-1833109469,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"x__79580__auto__","x__79580__auto__",1592002223,null),null,(1),null))))),null,(1),null)))))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","apply","cljs.core/apply",1757277831,null),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","get","cljs.core/get",-296075407,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"methods__79582__auto__","methods__79582__auto__",428910361,null),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"quote","quote",1377916282,null),null,(1),null)),(new cljs.core.List(null,method_name,null,(1),null))))),null,(1),null))], 0)))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,new cljs.core.Symbol(null,"x__79580__auto__","x__79580__auto__",1592002223,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"args__79581__auto__","args__79581__auto__",-621009945,null),null,(1),null))], 0)))),null,(1),null))], 0)))),null,(1),null))], 0))))], null);
var impls__$1 = (cljs.core.truth_(extend_meta)?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(impls,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","defmethod","cljs.core/defmethod",-180785162,null),null,(1),null)),(new cljs.core.List(null,method_name,null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,new cljs.core.Keyword(null,"default","default",-1987822328),null,(1),null)),(new cljs.core.List(null,cljs.core.vec(cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol(null,"x__79583__auto__","x__79583__auto__",-1846239409,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"&","&",-2144855648,null),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,new cljs.core.Symbol(null,"args__79584__auto__","args__79584__auto__",-1228472748,null),null,(1),null))], 0))))),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","let","cljs.core/let",-308701135,null),null,(1),null)),(new cljs.core.List(null,cljs.core.vec(cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol(null,"meta__79585__auto__","meta__79585__auto__",-2131321669,null),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","meta","cljs.core/meta",-748218346,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"x__79583__auto__","x__79583__auto__",-1846239409,null),null,(1),null))))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,new cljs.core.Symbol(null,"method__79586__auto__","method__79586__auto__",-1094361422,null),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","get","cljs.core/get",-296075407,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"meta__79585__auto__","meta__79585__auto__",-2131321669,null),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"quote","quote",1377916282,null),null,(1),null)),(new cljs.core.List(null,fq_name__$1,null,(1),null))))),null,(1),null))], 0)))),null,(1),null))], 0))))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol(null,"if","if",1181717262,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"method__79586__auto__","method__79586__auto__",-1094361422,null),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","apply","cljs.core/apply",1757277831,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"method__79586__auto__","method__79586__auto__",-1094361422,null),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,new cljs.core.Symbol(null,"x__79583__auto__","x__79583__auto__",-1846239409,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"args__79584__auto__","args__79584__auto__",-1228472748,null),null,(1),null))], 0)))),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"throw","throw",595905694,null),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol(null,"new","new",-444906321,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol("js","Error","js/Error",-1692659266,null),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","str","cljs.core/str",-1971828991,null),null,(1),null)),(new cljs.core.List(null,"No implementation of method: ",null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(method_name),null,(1),null)),(new cljs.core.List(null," of protocol: ",null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"var","var",870848730,null),null,(1),null)),(new cljs.core.List(null,protocol_name,null,(1),null))))),null,(1),null)),(new cljs.core.List(null," found for: ",null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","protocol-type-impl","cljs.core/protocol-type-impl",155177701,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"x__79583__auto__","x__79583__auto__",-1846239409,null),null,(1),null))))),null,(1),null))], 0)))),null,(1),null))], 0)))),null,(1),null))))),null,(1),null))], 0)))),null,(1),null))], 0)))),null,(1),null))], 0))))):impls);
return cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol(null,"do","do",1686842252,null),null,(1),null)),impls__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol(null,"def","def",597100991,null),null,(1),null)),(new cljs.core.List(null,protocol_name,null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","update","cljs.core/update",-908565906,null),null,(1),null)),(new cljs.core.List(null,protocol_name,null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,new cljs.core.Keyword(null,"methods","methods",453930866),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol("cljs.core","conj","cljs.core/conj",-460750931,null),null,(1),null)),(new cljs.core.List(null,method_name,null,(1),null))], 0)))),null,(1),null))], 0)))),null,(1),null))], 0))));
}),signatures__$2)], 0))));
return expansion;
}));

(sci.impl.protocols.defprotocol.cljs$lang$maxFixedArity = (4));

/** @this {Function} */
(sci.impl.protocols.defprotocol.cljs$lang$applyTo = (function (seq79588){
var G__79590 = cljs.core.first(seq79588);
var seq79588__$1 = cljs.core.next(seq79588);
var G__79591 = cljs.core.first(seq79588__$1);
var seq79588__$2 = cljs.core.next(seq79588__$1);
var G__79592 = cljs.core.first(seq79588__$2);
var seq79588__$3 = cljs.core.next(seq79588__$2);
var G__79593 = cljs.core.first(seq79588__$3);
var seq79588__$4 = cljs.core.next(seq79588__$3);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__79590,G__79591,G__79592,G__79593,seq79588__$4);
}));

sci.impl.protocols.extend = (function sci$impl$protocols$extend(var_args){
var args__5732__auto__ = [];
var len__5726__auto___80024 = arguments.length;
var i__5727__auto___80025 = (0);
while(true){
if((i__5727__auto___80025 < len__5726__auto___80024)){
args__5732__auto__.push((arguments[i__5727__auto___80025]));

var G__80026 = (i__5727__auto___80025 + (1));
i__5727__auto___80025 = G__80026;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return sci.impl.protocols.extend.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(sci.impl.protocols.extend.cljs$core$IFn$_invoke$arity$variadic = (function (ctx,atype,proto_PLUS_mmaps){
var seq__79692 = cljs.core.seq(cljs.core.partition.cljs$core$IFn$_invoke$arity$2((2),proto_PLUS_mmaps));
var chunk__79694 = null;
var count__79695 = (0);
var i__79696 = (0);
while(true){
if((i__79696 < count__79695)){
var vec__79806 = chunk__79694.cljs$core$IIndexed$_nth$arity$2(null,i__79696);
var proto = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__79806,(0),null);
var mmap = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__79806,(1),null);
var extend_via_metadata_80028 = new cljs.core.Keyword(null,"extend-via-metadata","extend-via-metadata",-427346794).cljs$core$IFn$_invoke$arity$1(proto);
var proto_ns_80029 = new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(proto);
var pns_80030 = sci.impl.vars.getName(proto_ns_80029);
var pns_str_80031 = (cljs.core.truth_(extend_via_metadata_80028)?cljs.core.str.cljs$core$IFn$_invoke$arity$1(pns_80030):null);
var seq__79811_80032 = cljs.core.seq(mmap);
var chunk__79812_80033 = null;
var count__79813_80034 = (0);
var i__79814_80035 = (0);
while(true){
if((i__79814_80035 < count__79813_80034)){
var vec__79833_80036 = chunk__79812_80033.cljs$core$IIndexed$_nth$arity$2(null,i__79814_80035);
var meth_name_80037 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__79833_80036,(0),null);
var f_80038 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__79833_80036,(1),null);
var meth_str_80039 = cljs.core.name(meth_name_80037);
var meth_sym_80040 = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(meth_str_80039);
var env_80041 = cljs.core.deref(new cljs.core.Keyword(null,"env","env",-1815813235).cljs$core$IFn$_invoke$arity$1(ctx));
var multi_method_var_80042 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(env_80041,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469),pns_80030,meth_sym_80040], null));
var multi_method_80043 = cljs.core.deref(multi_method_var_80042);
sci.impl.multimethods.multi_fn_add_method_impl(multi_method_80043,atype,(cljs.core.truth_(extend_via_metadata_80028)?(function (){var fq = cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(pns_str_80031,meth_str_80039);
return ((function (seq__79811_80032,chunk__79812_80033,count__79813_80034,i__79814_80035,seq__79692,chunk__79694,count__79695,i__79696,fq,meth_str_80039,meth_sym_80040,env_80041,multi_method_var_80042,multi_method_80043,vec__79833_80036,meth_name_80037,f_80038,extend_via_metadata_80028,proto_ns_80029,pns_80030,pns_str_80031,vec__79806,proto,mmap){
return (function() { 
var G__80044__delegate = function (this$,args){
var temp__5802__auto__ = cljs.core.meta(this$);
if(cljs.core.truth_(temp__5802__auto__)){
var m = temp__5802__auto__;
var temp__5802__auto____$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(m,fq);
if(cljs.core.truth_(temp__5802__auto____$1)){
var meth = temp__5802__auto____$1;
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(meth,this$,args);
} else {
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(f_80038,this$,args);
}
} else {
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(f_80038,this$,args);
}
};
var G__80044 = function (this$,var_args){
var args = null;
if (arguments.length > 1) {
var G__80045__i = 0, G__80045__a = new Array(arguments.length -  1);
while (G__80045__i < G__80045__a.length) {G__80045__a[G__80045__i] = arguments[G__80045__i + 1]; ++G__80045__i;}
  args = new cljs.core.IndexedSeq(G__80045__a,0,null);
} 
return G__80044__delegate.call(this,this$,args);};
G__80044.cljs$lang$maxFixedArity = 1;
G__80044.cljs$lang$applyTo = (function (arglist__80046){
var this$ = cljs.core.first(arglist__80046);
var args = cljs.core.rest(arglist__80046);
return G__80044__delegate(this$,args);
});
G__80044.cljs$core$IFn$_invoke$arity$variadic = G__80044__delegate;
return G__80044;
})()
;
;})(seq__79811_80032,chunk__79812_80033,count__79813_80034,i__79814_80035,seq__79692,chunk__79694,count__79695,i__79696,fq,meth_str_80039,meth_sym_80040,env_80041,multi_method_var_80042,multi_method_80043,vec__79833_80036,meth_name_80037,f_80038,extend_via_metadata_80028,proto_ns_80029,pns_80030,pns_str_80031,vec__79806,proto,mmap))
})():f_80038));


var G__80047 = seq__79811_80032;
var G__80048 = chunk__79812_80033;
var G__80049 = count__79813_80034;
var G__80050 = (i__79814_80035 + (1));
seq__79811_80032 = G__80047;
chunk__79812_80033 = G__80048;
count__79813_80034 = G__80049;
i__79814_80035 = G__80050;
continue;
} else {
var temp__5804__auto___80052 = cljs.core.seq(seq__79811_80032);
if(temp__5804__auto___80052){
var seq__79811_80055__$1 = temp__5804__auto___80052;
if(cljs.core.chunked_seq_QMARK_(seq__79811_80055__$1)){
var c__5525__auto___80056 = cljs.core.chunk_first(seq__79811_80055__$1);
var G__80058 = cljs.core.chunk_rest(seq__79811_80055__$1);
var G__80059 = c__5525__auto___80056;
var G__80060 = cljs.core.count(c__5525__auto___80056);
var G__80061 = (0);
seq__79811_80032 = G__80058;
chunk__79812_80033 = G__80059;
count__79813_80034 = G__80060;
i__79814_80035 = G__80061;
continue;
} else {
var vec__79839_80062 = cljs.core.first(seq__79811_80055__$1);
var meth_name_80063 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__79839_80062,(0),null);
var f_80064 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__79839_80062,(1),null);
var meth_str_80065 = cljs.core.name(meth_name_80063);
var meth_sym_80066 = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(meth_str_80065);
var env_80067 = cljs.core.deref(new cljs.core.Keyword(null,"env","env",-1815813235).cljs$core$IFn$_invoke$arity$1(ctx));
var multi_method_var_80068 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(env_80067,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469),pns_80030,meth_sym_80066], null));
var multi_method_80069 = cljs.core.deref(multi_method_var_80068);
sci.impl.multimethods.multi_fn_add_method_impl(multi_method_80069,atype,(cljs.core.truth_(extend_via_metadata_80028)?(function (){var fq = cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(pns_str_80031,meth_str_80065);
return ((function (seq__79811_80032,chunk__79812_80033,count__79813_80034,i__79814_80035,seq__79692,chunk__79694,count__79695,i__79696,fq,meth_str_80065,meth_sym_80066,env_80067,multi_method_var_80068,multi_method_80069,vec__79839_80062,meth_name_80063,f_80064,seq__79811_80055__$1,temp__5804__auto___80052,extend_via_metadata_80028,proto_ns_80029,pns_80030,pns_str_80031,vec__79806,proto,mmap){
return (function() { 
var G__80073__delegate = function (this$,args){
var temp__5802__auto__ = cljs.core.meta(this$);
if(cljs.core.truth_(temp__5802__auto__)){
var m = temp__5802__auto__;
var temp__5802__auto____$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(m,fq);
if(cljs.core.truth_(temp__5802__auto____$1)){
var meth = temp__5802__auto____$1;
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(meth,this$,args);
} else {
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(f_80064,this$,args);
}
} else {
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(f_80064,this$,args);
}
};
var G__80073 = function (this$,var_args){
var args = null;
if (arguments.length > 1) {
var G__80074__i = 0, G__80074__a = new Array(arguments.length -  1);
while (G__80074__i < G__80074__a.length) {G__80074__a[G__80074__i] = arguments[G__80074__i + 1]; ++G__80074__i;}
  args = new cljs.core.IndexedSeq(G__80074__a,0,null);
} 
return G__80073__delegate.call(this,this$,args);};
G__80073.cljs$lang$maxFixedArity = 1;
G__80073.cljs$lang$applyTo = (function (arglist__80078){
var this$ = cljs.core.first(arglist__80078);
var args = cljs.core.rest(arglist__80078);
return G__80073__delegate(this$,args);
});
G__80073.cljs$core$IFn$_invoke$arity$variadic = G__80073__delegate;
return G__80073;
})()
;
;})(seq__79811_80032,chunk__79812_80033,count__79813_80034,i__79814_80035,seq__79692,chunk__79694,count__79695,i__79696,fq,meth_str_80065,meth_sym_80066,env_80067,multi_method_var_80068,multi_method_80069,vec__79839_80062,meth_name_80063,f_80064,seq__79811_80055__$1,temp__5804__auto___80052,extend_via_metadata_80028,proto_ns_80029,pns_80030,pns_str_80031,vec__79806,proto,mmap))
})():f_80064));


var G__80080 = cljs.core.next(seq__79811_80055__$1);
var G__80081 = null;
var G__80082 = (0);
var G__80083 = (0);
seq__79811_80032 = G__80080;
chunk__79812_80033 = G__80081;
count__79813_80034 = G__80082;
i__79814_80035 = G__80083;
continue;
}
} else {
}
}
break;
}


var G__80084 = seq__79692;
var G__80085 = chunk__79694;
var G__80086 = count__79695;
var G__80087 = (i__79696 + (1));
seq__79692 = G__80084;
chunk__79694 = G__80085;
count__79695 = G__80086;
i__79696 = G__80087;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__79692);
if(temp__5804__auto__){
var seq__79692__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__79692__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__79692__$1);
var G__80088 = cljs.core.chunk_rest(seq__79692__$1);
var G__80089 = c__5525__auto__;
var G__80090 = cljs.core.count(c__5525__auto__);
var G__80091 = (0);
seq__79692 = G__80088;
chunk__79694 = G__80089;
count__79695 = G__80090;
i__79696 = G__80091;
continue;
} else {
var vec__79850 = cljs.core.first(seq__79692__$1);
var proto = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__79850,(0),null);
var mmap = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__79850,(1),null);
var extend_via_metadata_80093 = new cljs.core.Keyword(null,"extend-via-metadata","extend-via-metadata",-427346794).cljs$core$IFn$_invoke$arity$1(proto);
var proto_ns_80094 = new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(proto);
var pns_80095 = sci.impl.vars.getName(proto_ns_80094);
var pns_str_80096 = (cljs.core.truth_(extend_via_metadata_80093)?cljs.core.str.cljs$core$IFn$_invoke$arity$1(pns_80095):null);
var seq__79853_80097 = cljs.core.seq(mmap);
var chunk__79854_80098 = null;
var count__79855_80099 = (0);
var i__79856_80100 = (0);
while(true){
if((i__79856_80100 < count__79855_80099)){
var vec__79873_80102 = chunk__79854_80098.cljs$core$IIndexed$_nth$arity$2(null,i__79856_80100);
var meth_name_80103 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__79873_80102,(0),null);
var f_80104 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__79873_80102,(1),null);
var meth_str_80105 = cljs.core.name(meth_name_80103);
var meth_sym_80106 = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(meth_str_80105);
var env_80107 = cljs.core.deref(new cljs.core.Keyword(null,"env","env",-1815813235).cljs$core$IFn$_invoke$arity$1(ctx));
var multi_method_var_80108 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(env_80107,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469),pns_80095,meth_sym_80106], null));
var multi_method_80109 = cljs.core.deref(multi_method_var_80108);
sci.impl.multimethods.multi_fn_add_method_impl(multi_method_80109,atype,(cljs.core.truth_(extend_via_metadata_80093)?(function (){var fq = cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(pns_str_80096,meth_str_80105);
return ((function (seq__79853_80097,chunk__79854_80098,count__79855_80099,i__79856_80100,seq__79692,chunk__79694,count__79695,i__79696,fq,meth_str_80105,meth_sym_80106,env_80107,multi_method_var_80108,multi_method_80109,vec__79873_80102,meth_name_80103,f_80104,extend_via_metadata_80093,proto_ns_80094,pns_80095,pns_str_80096,vec__79850,proto,mmap,seq__79692__$1,temp__5804__auto__){
return (function() { 
var G__80110__delegate = function (this$,args){
var temp__5802__auto__ = cljs.core.meta(this$);
if(cljs.core.truth_(temp__5802__auto__)){
var m = temp__5802__auto__;
var temp__5802__auto____$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(m,fq);
if(cljs.core.truth_(temp__5802__auto____$1)){
var meth = temp__5802__auto____$1;
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(meth,this$,args);
} else {
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(f_80104,this$,args);
}
} else {
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(f_80104,this$,args);
}
};
var G__80110 = function (this$,var_args){
var args = null;
if (arguments.length > 1) {
var G__80111__i = 0, G__80111__a = new Array(arguments.length -  1);
while (G__80111__i < G__80111__a.length) {G__80111__a[G__80111__i] = arguments[G__80111__i + 1]; ++G__80111__i;}
  args = new cljs.core.IndexedSeq(G__80111__a,0,null);
} 
return G__80110__delegate.call(this,this$,args);};
G__80110.cljs$lang$maxFixedArity = 1;
G__80110.cljs$lang$applyTo = (function (arglist__80112){
var this$ = cljs.core.first(arglist__80112);
var args = cljs.core.rest(arglist__80112);
return G__80110__delegate(this$,args);
});
G__80110.cljs$core$IFn$_invoke$arity$variadic = G__80110__delegate;
return G__80110;
})()
;
;})(seq__79853_80097,chunk__79854_80098,count__79855_80099,i__79856_80100,seq__79692,chunk__79694,count__79695,i__79696,fq,meth_str_80105,meth_sym_80106,env_80107,multi_method_var_80108,multi_method_80109,vec__79873_80102,meth_name_80103,f_80104,extend_via_metadata_80093,proto_ns_80094,pns_80095,pns_str_80096,vec__79850,proto,mmap,seq__79692__$1,temp__5804__auto__))
})():f_80104));


var G__80113 = seq__79853_80097;
var G__80114 = chunk__79854_80098;
var G__80115 = count__79855_80099;
var G__80116 = (i__79856_80100 + (1));
seq__79853_80097 = G__80113;
chunk__79854_80098 = G__80114;
count__79855_80099 = G__80115;
i__79856_80100 = G__80116;
continue;
} else {
var temp__5804__auto___80117__$1 = cljs.core.seq(seq__79853_80097);
if(temp__5804__auto___80117__$1){
var seq__79853_80118__$1 = temp__5804__auto___80117__$1;
if(cljs.core.chunked_seq_QMARK_(seq__79853_80118__$1)){
var c__5525__auto___80119 = cljs.core.chunk_first(seq__79853_80118__$1);
var G__80120 = cljs.core.chunk_rest(seq__79853_80118__$1);
var G__80121 = c__5525__auto___80119;
var G__80122 = cljs.core.count(c__5525__auto___80119);
var G__80123 = (0);
seq__79853_80097 = G__80120;
chunk__79854_80098 = G__80121;
count__79855_80099 = G__80122;
i__79856_80100 = G__80123;
continue;
} else {
var vec__79884_80124 = cljs.core.first(seq__79853_80118__$1);
var meth_name_80125 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__79884_80124,(0),null);
var f_80126 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__79884_80124,(1),null);
var meth_str_80128 = cljs.core.name(meth_name_80125);
var meth_sym_80129 = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(meth_str_80128);
var env_80130 = cljs.core.deref(new cljs.core.Keyword(null,"env","env",-1815813235).cljs$core$IFn$_invoke$arity$1(ctx));
var multi_method_var_80131 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(env_80130,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469),pns_80095,meth_sym_80129], null));
var multi_method_80132 = cljs.core.deref(multi_method_var_80131);
sci.impl.multimethods.multi_fn_add_method_impl(multi_method_80132,atype,(cljs.core.truth_(extend_via_metadata_80093)?(function (){var fq = cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(pns_str_80096,meth_str_80128);
return ((function (seq__79853_80097,chunk__79854_80098,count__79855_80099,i__79856_80100,seq__79692,chunk__79694,count__79695,i__79696,fq,meth_str_80128,meth_sym_80129,env_80130,multi_method_var_80131,multi_method_80132,vec__79884_80124,meth_name_80125,f_80126,seq__79853_80118__$1,temp__5804__auto___80117__$1,extend_via_metadata_80093,proto_ns_80094,pns_80095,pns_str_80096,vec__79850,proto,mmap,seq__79692__$1,temp__5804__auto__){
return (function() { 
var G__80135__delegate = function (this$,args){
var temp__5802__auto__ = cljs.core.meta(this$);
if(cljs.core.truth_(temp__5802__auto__)){
var m = temp__5802__auto__;
var temp__5802__auto____$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(m,fq);
if(cljs.core.truth_(temp__5802__auto____$1)){
var meth = temp__5802__auto____$1;
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(meth,this$,args);
} else {
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(f_80126,this$,args);
}
} else {
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(f_80126,this$,args);
}
};
var G__80135 = function (this$,var_args){
var args = null;
if (arguments.length > 1) {
var G__80136__i = 0, G__80136__a = new Array(arguments.length -  1);
while (G__80136__i < G__80136__a.length) {G__80136__a[G__80136__i] = arguments[G__80136__i + 1]; ++G__80136__i;}
  args = new cljs.core.IndexedSeq(G__80136__a,0,null);
} 
return G__80135__delegate.call(this,this$,args);};
G__80135.cljs$lang$maxFixedArity = 1;
G__80135.cljs$lang$applyTo = (function (arglist__80137){
var this$ = cljs.core.first(arglist__80137);
var args = cljs.core.rest(arglist__80137);
return G__80135__delegate(this$,args);
});
G__80135.cljs$core$IFn$_invoke$arity$variadic = G__80135__delegate;
return G__80135;
})()
;
;})(seq__79853_80097,chunk__79854_80098,count__79855_80099,i__79856_80100,seq__79692,chunk__79694,count__79695,i__79696,fq,meth_str_80128,meth_sym_80129,env_80130,multi_method_var_80131,multi_method_80132,vec__79884_80124,meth_name_80125,f_80126,seq__79853_80118__$1,temp__5804__auto___80117__$1,extend_via_metadata_80093,proto_ns_80094,pns_80095,pns_str_80096,vec__79850,proto,mmap,seq__79692__$1,temp__5804__auto__))
})():f_80126));


var G__80138 = cljs.core.next(seq__79853_80118__$1);
var G__80139 = null;
var G__80140 = (0);
var G__80141 = (0);
seq__79853_80097 = G__80138;
chunk__79854_80098 = G__80139;
count__79855_80099 = G__80140;
i__79856_80100 = G__80141;
continue;
}
} else {
}
}
break;
}


var G__80143 = cljs.core.next(seq__79692__$1);
var G__80144 = null;
var G__80145 = (0);
var G__80146 = (0);
seq__79692 = G__80143;
chunk__79694 = G__80144;
count__79695 = G__80145;
i__79696 = G__80146;
continue;
}
} else {
return null;
}
}
break;
}
}));

(sci.impl.protocols.extend.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(sci.impl.protocols.extend.cljs$lang$applyTo = (function (seq79688){
var G__79689 = cljs.core.first(seq79688);
var seq79688__$1 = cljs.core.next(seq79688);
var G__79690 = cljs.core.first(seq79688__$1);
var seq79688__$2 = cljs.core.next(seq79688__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__79689,G__79690,seq79688__$2);
}));

/**
 * Processes single args+body pair for extending via metadata
 */
sci.impl.protocols.process_single_extend_meta = (function sci$impl$protocols$process_single_extend_meta(fq,p__79896){
var vec__79897 = p__79896;
var seq__79898 = cljs.core.seq(vec__79897);
var first__79899 = cljs.core.first(seq__79898);
var seq__79898__$1 = cljs.core.next(seq__79898);
var args = first__79899;
var body = seq__79898__$1;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [args,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","let","cljs.core/let",-308701135,null),null,(1),null)),(new cljs.core.List(null,cljs.core.vec(cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"farg__79891__auto__","farg__79891__auto__",-523834752,null),null,(1),null)),(new cljs.core.List(null,cljs.core.first(args),null,(1),null)))))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","if-let","cljs.core/if-let",1346583165,null),null,(1),null)),(new cljs.core.List(null,cljs.core.vec(cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"m__79892__auto__","m__79892__auto__",1968159220,null),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","meta","cljs.core/meta",-748218346,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"farg__79891__auto__","farg__79891__auto__",-523834752,null),null,(1),null))))),null,(1),null)))))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","if-let","cljs.core/if-let",1346583165,null),null,(1),null)),(new cljs.core.List(null,cljs.core.vec(cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"meth__79894__auto__","meth__79894__auto__",-1853963723,null),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","get","cljs.core/get",-296075407,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"m__79892__auto__","m__79892__auto__",1968159220,null),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"quote","quote",1377916282,null),null,(1),null)),(new cljs.core.List(null,fq,null,(1),null))))),null,(1),null))], 0)))),null,(1),null)))))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","apply","cljs.core/apply",1757277831,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"meth__79894__auto__","meth__79894__auto__",-1853963723,null),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,args,null,(1),null))], 0)))),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"do","do",1686842252,null),null,(1),null)),body))),null,(1),null))], 0)))),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"do","do",1686842252,null),null,(1),null)),body))),null,(1),null))], 0)))),null,(1),null))], 0))))], null);
});
sci.impl.protocols.process_methods = (function sci$impl$protocols$process_methods(type,meths,protocol_ns,extend_via_metadata){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__79907){
var vec__79909 = p__79907;
var seq__79910 = cljs.core.seq(vec__79909);
var first__79911 = cljs.core.first(seq__79910);
var seq__79910__$1 = cljs.core.next(seq__79910);
var meth_name = first__79911;
var fn_body = seq__79910__$1;
var fq = cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(protocol_ns,cljs.core.name(meth_name));
var fn_body__$1 = (cljs.core.truth_(extend_via_metadata)?((cljs.core.vector_QMARK_(cljs.core.first(fn_body)))?sci.impl.protocols.process_single_extend_meta(fq,fn_body):cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__79905_SHARP_){
return sci.impl.protocols.process_single_extend_meta(fq,p1__79905_SHARP_);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([fn_body], 0))):fn_body);
return cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","defmethod","cljs.core/defmethod",-180785162,null),null,(1),null)),(new cljs.core.List(null,fq,null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,type,null,(1),null)),fn_body__$1], 0))));
}),meths);
});
sci.impl.protocols.extend_protocol = (function sci$impl$protocols$extend_protocol(var_args){
var args__5732__auto__ = [];
var len__5726__auto___80152 = arguments.length;
var i__5727__auto___80153 = (0);
while(true){
if((i__5727__auto___80153 < len__5726__auto___80152)){
args__5732__auto__.push((arguments[i__5727__auto___80153]));

var G__80154 = (i__5727__auto___80153 + (1));
i__5727__auto___80153 = G__80154;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((4) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((4)),(0),null)):null);
return sci.impl.protocols.extend_protocol.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),argseq__5733__auto__);
});

(sci.impl.protocols.extend_protocol.cljs$core$IFn$_invoke$arity$variadic = (function (_,___$1,ctx,protocol_name,impls){
var impls__$1 = sci.impl.utils.split_when((function (p1__79912_SHARP_){
return (!(cljs.core.seq_QMARK_(p1__79912_SHARP_)));
}),impls);
var protocol_var = (function (){var G__79925 = ctx;
var G__79926 = new cljs.core.Keyword(null,"bindingx","bindingx",679516896).cljs$core$IFn$_invoke$arity$1(ctx);
var G__79927 = protocol_name;
var fexpr__79924 = cljs.core.deref(sci.impl.utils.eval_resolve_state);
return (fexpr__79924.cljs$core$IFn$_invoke$arity$3 ? fexpr__79924.cljs$core$IFn$_invoke$arity$3(G__79925,G__79926,G__79927) : fexpr__79924.call(null,G__79925,G__79926,G__79927));
})();
var protocol_data = cljs.core.deref(protocol_var);
var extend_via_metadata = new cljs.core.Keyword(null,"extend-via-metadata","extend-via-metadata",-427346794).cljs$core$IFn$_invoke$arity$1(protocol_data);
var protocol_ns = new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(protocol_data);
var pns = cljs.core.str.cljs$core$IFn$_invoke$arity$1(sci.impl.vars.getName(protocol_ns));
var expansion = cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"do","do",1686842252,null),null,(1),null)),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__79935){
var vec__79936 = p__79935;
var seq__79937 = cljs.core.seq(vec__79936);
var first__79938 = cljs.core.first(seq__79937);
var seq__79937__$1 = cljs.core.next(seq__79937);
var type = first__79938;
var meths = seq__79937__$1;
return cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"do","do",1686842252,null),null,(1),null)),sci.impl.protocols.process_methods(type,meths,pns,extend_via_metadata))));
}),impls__$1))));
return expansion;
}));

(sci.impl.protocols.extend_protocol.cljs$lang$maxFixedArity = (4));

/** @this {Function} */
(sci.impl.protocols.extend_protocol.cljs$lang$applyTo = (function (seq79917){
var G__79918 = cljs.core.first(seq79917);
var seq79917__$1 = cljs.core.next(seq79917);
var G__79919 = cljs.core.first(seq79917__$1);
var seq79917__$2 = cljs.core.next(seq79917__$1);
var G__79920 = cljs.core.first(seq79917__$2);
var seq79917__$3 = cljs.core.next(seq79917__$2);
var G__79921 = cljs.core.first(seq79917__$3);
var seq79917__$4 = cljs.core.next(seq79917__$3);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__79918,G__79919,G__79920,G__79921,seq79917__$4);
}));

sci.impl.protocols.extend_type = (function sci$impl$protocols$extend_type(var_args){
var args__5732__auto__ = [];
var len__5726__auto___80161 = arguments.length;
var i__5727__auto___80162 = (0);
while(true){
if((i__5727__auto___80162 < len__5726__auto___80161)){
args__5732__auto__.push((arguments[i__5727__auto___80162]));

var G__80164 = (i__5727__auto___80162 + (1));
i__5727__auto___80162 = G__80164;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((4) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((4)),(0),null)):null);
return sci.impl.protocols.extend_type.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),argseq__5733__auto__);
});

(sci.impl.protocols.extend_type.cljs$core$IFn$_invoke$arity$variadic = (function (_,___$1,ctx,atype,proto_PLUS_meths){
var proto_PLUS_meths__$1 = sci.impl.utils.split_when((function (p1__79940_SHARP_){
return (!(cljs.core.seq_QMARK_(p1__79940_SHARP_)));
}),proto_PLUS_meths);
return cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"do","do",1686842252,null),null,(1),null)),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__79948){
var vec__79950 = p__79948;
var seq__79951 = cljs.core.seq(vec__79950);
var first__79952 = cljs.core.first(seq__79951);
var seq__79951__$1 = cljs.core.next(seq__79951);
var proto = first__79952;
var meths = seq__79951__$1;
var protocol_var = (function (){var G__79959 = ctx;
var G__79961 = new cljs.core.Keyword(null,"bindings","bindings",1271397192).cljs$core$IFn$_invoke$arity$1(ctx);
var G__79962 = proto;
var fexpr__79958 = cljs.core.deref(sci.impl.utils.eval_resolve_state);
return (fexpr__79958.cljs$core$IFn$_invoke$arity$3 ? fexpr__79958.cljs$core$IFn$_invoke$arity$3(G__79959,G__79961,G__79962) : fexpr__79958.call(null,G__79959,G__79961,G__79962));
})();
var proto_data = cljs.core.deref(protocol_var);
var protocol_ns = new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(proto_data);
var pns = cljs.core.str.cljs$core$IFn$_invoke$arity$1(sci.impl.vars.getName(protocol_ns));
var extend_via_metadata = new cljs.core.Keyword(null,"extend-via-metadata","extend-via-metadata",-427346794).cljs$core$IFn$_invoke$arity$1(proto_data);
return cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"do","do",1686842252,null),null,(1),null)),sci.impl.protocols.process_methods(atype,meths,pns,extend_via_metadata))));
}),proto_PLUS_meths__$1))));
}));

(sci.impl.protocols.extend_type.cljs$lang$maxFixedArity = (4));

/** @this {Function} */
(sci.impl.protocols.extend_type.cljs$lang$applyTo = (function (seq79941){
var G__79942 = cljs.core.first(seq79941);
var seq79941__$1 = cljs.core.next(seq79941);
var G__79943 = cljs.core.first(seq79941__$1);
var seq79941__$2 = cljs.core.next(seq79941__$1);
var G__79944 = cljs.core.first(seq79941__$2);
var seq79941__$3 = cljs.core.next(seq79941__$2);
var G__79945 = cljs.core.first(seq79941__$3);
var seq79941__$4 = cljs.core.next(seq79941__$3);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__79942,G__79943,G__79944,G__79945,seq79941__$4);
}));

sci.impl.protocols.find_matching_non_default_method = (function sci$impl$protocols$find_matching_non_default_method(protocol,obj){
return cljs.core.boolean$(cljs.core.some((function (p1__79965_SHARP_){
var temp__5804__auto__ = cljs.core.get_method(p1__79965_SHARP_,sci.impl.types.type_impl(obj));
if(cljs.core.truth_(temp__5804__auto__)){
var m = temp__5804__auto__;
var ms = cljs.core.methods$(p1__79965_SHARP_);
var default$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(ms,new cljs.core.Keyword(null,"default","default",-1987822328));
return (!((m === default$)));
} else {
return null;
}
}),new cljs.core.Keyword(null,"methods","methods",453930866).cljs$core$IFn$_invoke$arity$1(protocol)));
});
sci.impl.protocols.satisfies_QMARK_ = (function sci$impl$protocols$satisfies_QMARK_(protocol,obj){
if((obj instanceof sci.impl.types.Reified)){
return cljs.core.contains_QMARK_(obj.sci$impl$types$IReified$getProtocols$arity$1(null),protocol);
} else {
var p = new cljs.core.Keyword(null,"protocol","protocol",652470118).cljs$core$IFn$_invoke$arity$1(protocol);
var or__5002__auto__ = (function (){var and__5000__auto__ = p;
if(cljs.core.truth_(and__5000__auto__)){
var pred__79974 = cljs.core._EQ_;
var expr__79975 = p;
if(cljs.core.truth_((pred__79974.cljs$core$IFn$_invoke$arity$2 ? pred__79974.cljs$core$IFn$_invoke$arity$2(cljs.core.IDeref,expr__79975) : pred__79974.call(null,cljs.core.IDeref,expr__79975)))){
if((!((obj == null)))){
if((((obj.cljs$lang$protocol_mask$partition0$ & (32768))) || ((cljs.core.PROTOCOL_SENTINEL === obj.cljs$core$IDeref$)))){
return true;
} else {
if((!obj.cljs$lang$protocol_mask$partition0$)){
return cljs.core.native_satisfies_QMARK_(cljs.core.IDeref,obj);
} else {
return false;
}
}
} else {
return cljs.core.native_satisfies_QMARK_(cljs.core.IDeref,obj);
}
} else {
if(cljs.core.truth_((pred__79974.cljs$core$IFn$_invoke$arity$2 ? pred__79974.cljs$core$IFn$_invoke$arity$2(cljs.core.ISwap,expr__79975) : pred__79974.call(null,cljs.core.ISwap,expr__79975)))){
if((!((obj == null)))){
if((((obj.cljs$lang$protocol_mask$partition1$ & (65536))) || ((cljs.core.PROTOCOL_SENTINEL === obj.cljs$core$ISwap$)))){
return true;
} else {
if((!obj.cljs$lang$protocol_mask$partition1$)){
return cljs.core.native_satisfies_QMARK_(cljs.core.ISwap,obj);
} else {
return false;
}
}
} else {
return cljs.core.native_satisfies_QMARK_(cljs.core.ISwap,obj);
}
} else {
if(cljs.core.truth_((pred__79974.cljs$core$IFn$_invoke$arity$2 ? pred__79974.cljs$core$IFn$_invoke$arity$2(cljs.core.IReset,expr__79975) : pred__79974.call(null,cljs.core.IReset,expr__79975)))){
if((!((obj == null)))){
if((((obj.cljs$lang$protocol_mask$partition1$ & (32768))) || ((cljs.core.PROTOCOL_SENTINEL === obj.cljs$core$IReset$)))){
return true;
} else {
if((!obj.cljs$lang$protocol_mask$partition1$)){
return cljs.core.native_satisfies_QMARK_(cljs.core.IReset,obj);
} else {
return false;
}
}
} else {
return cljs.core.native_satisfies_QMARK_(cljs.core.IReset,obj);
}
} else {
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(expr__79975)].join('')));
}
}
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return sci.impl.protocols.find_matching_non_default_method(protocol,obj);
}
}
});
sci.impl.protocols.instance_impl = (function sci$impl$protocols$instance_impl(clazz,x){
if(cljs.core.truth_((function (){var and__5000__auto__ = (clazz instanceof cljs.core.Symbol);
if(and__5000__auto__){
var G__79990 = clazz;
var G__79990__$1 = (((G__79990 == null))?null:cljs.core.meta(G__79990));
if((G__79990__$1 == null)){
return null;
} else {
return new cljs.core.Keyword("sci.impl","record","sci.impl/record",-1939193950).cljs$core$IFn$_invoke$arity$1(G__79990__$1);
}
} else {
return and__5000__auto__;
}
})())){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(clazz,new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(x)));
} else {
return (x instanceof clazz);

}
});
/**
 * Returns true if atype extends protocol
 */
sci.impl.protocols.extends_QMARK_ = (function sci$impl$protocols$extends_QMARK_(protocol,atype){
return cljs.core.boolean$(cljs.core.some((function (p1__79995_SHARP_){
return cljs.core.get_method(p1__79995_SHARP_,atype);
}),new cljs.core.Keyword(null,"methods","methods",453930866).cljs$core$IFn$_invoke$arity$1(protocol)));
});

//# sourceMappingURL=sci.impl.protocols.js.map
