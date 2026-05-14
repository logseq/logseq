goog.provide('sci.impl.protocols');
sci.impl.protocols.defprotocol = (function sci$impl$protocols$defprotocol(var_args){
var args__5732__auto__ = [];
var len__5726__auto___87053 = arguments.length;
var i__5727__auto___87054 = (0);
while(true){
if((i__5727__auto___87054 < len__5726__auto___87053)){
args__5732__auto__.push((arguments[i__5727__auto___87054]));

var G__87055 = (i__5727__auto___87054 + (1));
i__5727__auto___87054 = G__87055;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((4) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((4)),(0),null)):null);
return sci.impl.protocols.defprotocol.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),argseq__5733__auto__);
});

(sci.impl.protocols.defprotocol.cljs$core$IFn$_invoke$arity$variadic = (function (_,___$1,_ctx,protocol_name,signatures){
var vec__86688 = (function (){var sig = cljs.core.first(signatures);
if(typeof sig === 'string'){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [sig,cljs.core.rest(signatures)], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [null,signatures], null);
}
})();
var docstring = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__86688,(0),null);
var signatures__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__86688,(1),null);
var vec__86691 = (function (){var opt = cljs.core.first(signatures__$1);
if((opt instanceof cljs.core.Keyword)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.PersistentArrayMap.createAsIfByAssoc([opt,cljs.core.second(signatures__$1)]),cljs.core.nnext(signatures__$1)], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [null,signatures__$1], null);
}
})();
var opts = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__86691,(0),null);
var signatures__$2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__86691,(1),null);
var current_ns = cljs.core.str.cljs$core$IFn$_invoke$arity$1(sci.impl.vars.current_ns_name());
var fq_name = cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(current_ns,cljs.core.str.cljs$core$IFn$_invoke$arity$1(protocol_name));
var extend_meta = new cljs.core.Keyword(null,"extend-via-metadata","extend-via-metadata",-427346794).cljs$core$IFn$_invoke$arity$1(opts);
var expansion = cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol(null,"do","do",1686842252,null),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol(null,"def","def",597100991,null),null,(1),null)),(new cljs.core.List(null,cljs.core.with_meta(protocol_name,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"doc","doc",1913296891),docstring], null)),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","cond->","cljs.core/cond->",-113941356,null),null,(1),null)),(new cljs.core.List(null,cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.array_map,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Keyword(null,"methods","methods",453930866),null,(1),null)),(new cljs.core.List(null,cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.hash_set,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$0()))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,new cljs.core.Keyword(null,"name","name",1843675177),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"quote","quote",1377916282,null),null,(1),null)),(new cljs.core.List(null,fq_name,null,(1),null))))),null,(1),null)),(new cljs.core.List(null,new cljs.core.Keyword(null,"ns","ns",441598760),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol("cljs.core","*ns*","cljs.core/*ns*",1155497085,null),null,(1),null))], 0))))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,extend_meta,null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","assoc","cljs.core/assoc",322326297,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Keyword(null,"extend-via-metadata","extend-via-metadata",-427346794),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,true,null,(1),null))], 0)))),null,(1),null))], 0)))),null,(1),null))], 0)))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__86695){
var vec__86696 = p__86695;
var seq__86697 = cljs.core.seq(vec__86696);
var first__86698 = cljs.core.first(seq__86697);
var seq__86697__$1 = cljs.core.next(seq__86697);
var method_name = first__86698;
var ___$2 = seq__86697__$1;
var fq_name__$1 = cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(current_ns,cljs.core.str.cljs$core$IFn$_invoke$arity$1(method_name));
var impls = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","defmulti","cljs.core/defmulti",723984225,null),null,(1),null)),(new cljs.core.List(null,method_name,null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,new cljs.core.Symbol("cljs.core","protocol-type-impl","cljs.core/protocol-type-impl",155177701,null),null,(1),null))], 0)))),cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","defmethod","cljs.core/defmethod",-180785162,null),null,(1),null)),(new cljs.core.List(null,method_name,null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,new cljs.core.Keyword("sci.impl.protocols","reified","sci.impl.protocols/reified",-2019939396),null,(1),null)),(new cljs.core.List(null,cljs.core.vec(cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol(null,"x__86674__auto__","x__86674__auto__",-1204321164,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"&","&",-2144855648,null),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,new cljs.core.Symbol(null,"args__86675__auto__","args__86675__auto__",-1751846806,null),null,(1),null))], 0))))),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","let","cljs.core/let",-308701135,null),null,(1),null)),(new cljs.core.List(null,cljs.core.vec(cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"methods__86676__auto__","methods__86676__auto__",-1900912125,null),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","-reified-methods","cljs.core/-reified-methods",-1833109469,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"x__86674__auto__","x__86674__auto__",-1204321164,null),null,(1),null))))),null,(1),null)))))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","apply","cljs.core/apply",1757277831,null),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","get","cljs.core/get",-296075407,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"methods__86676__auto__","methods__86676__auto__",-1900912125,null),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"quote","quote",1377916282,null),null,(1),null)),(new cljs.core.List(null,method_name,null,(1),null))))),null,(1),null))], 0)))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,new cljs.core.Symbol(null,"x__86674__auto__","x__86674__auto__",-1204321164,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"args__86675__auto__","args__86675__auto__",-1751846806,null),null,(1),null))], 0)))),null,(1),null))], 0)))),null,(1),null))], 0))))], null);
var impls__$1 = (cljs.core.truth_(extend_meta)?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(impls,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","defmethod","cljs.core/defmethod",-180785162,null),null,(1),null)),(new cljs.core.List(null,method_name,null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,new cljs.core.Keyword(null,"default","default",-1987822328),null,(1),null)),(new cljs.core.List(null,cljs.core.vec(cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol(null,"x__86677__auto__","x__86677__auto__",-1951967972,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"&","&",-2144855648,null),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,new cljs.core.Symbol(null,"args__86678__auto__","args__86678__auto__",1065590300,null),null,(1),null))], 0))))),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","let","cljs.core/let",-308701135,null),null,(1),null)),(new cljs.core.List(null,cljs.core.vec(cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol(null,"meta__86679__auto__","meta__86679__auto__",-755450547,null),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","meta","cljs.core/meta",-748218346,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"x__86677__auto__","x__86677__auto__",-1951967972,null),null,(1),null))))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,new cljs.core.Symbol(null,"method__86680__auto__","method__86680__auto__",-2092129970,null),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","get","cljs.core/get",-296075407,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"meta__86679__auto__","meta__86679__auto__",-755450547,null),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"quote","quote",1377916282,null),null,(1),null)),(new cljs.core.List(null,fq_name__$1,null,(1),null))))),null,(1),null))], 0)))),null,(1),null))], 0))))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol(null,"if","if",1181717262,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"method__86680__auto__","method__86680__auto__",-2092129970,null),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","apply","cljs.core/apply",1757277831,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"method__86680__auto__","method__86680__auto__",-2092129970,null),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,new cljs.core.Symbol(null,"x__86677__auto__","x__86677__auto__",-1951967972,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"args__86678__auto__","args__86678__auto__",1065590300,null),null,(1),null))], 0)))),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"throw","throw",595905694,null),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol(null,"new","new",-444906321,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol("js","Error","js/Error",-1692659266,null),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","str","cljs.core/str",-1971828991,null),null,(1),null)),(new cljs.core.List(null,"No implementation of method: ",null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(method_name),null,(1),null)),(new cljs.core.List(null," of protocol: ",null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"var","var",870848730,null),null,(1),null)),(new cljs.core.List(null,protocol_name,null,(1),null))))),null,(1),null)),(new cljs.core.List(null," found for: ",null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","protocol-type-impl","cljs.core/protocol-type-impl",155177701,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"x__86677__auto__","x__86677__auto__",-1951967972,null),null,(1),null))))),null,(1),null))], 0)))),null,(1),null))], 0)))),null,(1),null))))),null,(1),null))], 0)))),null,(1),null))], 0)))),null,(1),null))], 0))))):impls);
return cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol(null,"do","do",1686842252,null),null,(1),null)),impls__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol(null,"def","def",597100991,null),null,(1),null)),(new cljs.core.List(null,protocol_name,null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","update","cljs.core/update",-908565906,null),null,(1),null)),(new cljs.core.List(null,protocol_name,null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,new cljs.core.Keyword(null,"methods","methods",453930866),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol("cljs.core","conj","cljs.core/conj",-460750931,null),null,(1),null)),(new cljs.core.List(null,method_name,null,(1),null))], 0)))),null,(1),null))], 0)))),null,(1),null))], 0))));
}),signatures__$2)], 0))));
return expansion;
}));

(sci.impl.protocols.defprotocol.cljs$lang$maxFixedArity = (4));

/** @this {Function} */
(sci.impl.protocols.defprotocol.cljs$lang$applyTo = (function (seq86681){
var G__86682 = cljs.core.first(seq86681);
var seq86681__$1 = cljs.core.next(seq86681);
var G__86683 = cljs.core.first(seq86681__$1);
var seq86681__$2 = cljs.core.next(seq86681__$1);
var G__86684 = cljs.core.first(seq86681__$2);
var seq86681__$3 = cljs.core.next(seq86681__$2);
var G__86685 = cljs.core.first(seq86681__$3);
var seq86681__$4 = cljs.core.next(seq86681__$3);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__86682,G__86683,G__86684,G__86685,seq86681__$4);
}));

sci.impl.protocols.extend = (function sci$impl$protocols$extend(var_args){
var args__5732__auto__ = [];
var len__5726__auto___87077 = arguments.length;
var i__5727__auto___87078 = (0);
while(true){
if((i__5727__auto___87078 < len__5726__auto___87077)){
args__5732__auto__.push((arguments[i__5727__auto___87078]));

var G__87079 = (i__5727__auto___87078 + (1));
i__5727__auto___87078 = G__87079;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return sci.impl.protocols.extend.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(sci.impl.protocols.extend.cljs$core$IFn$_invoke$arity$variadic = (function (ctx,atype,proto_PLUS_mmaps){
var seq__86702 = cljs.core.seq(cljs.core.partition.cljs$core$IFn$_invoke$arity$2((2),proto_PLUS_mmaps));
var chunk__86704 = null;
var count__86705 = (0);
var i__86706 = (0);
while(true){
if((i__86706 < count__86705)){
var vec__86755 = chunk__86704.cljs$core$IIndexed$_nth$arity$2(null,i__86706);
var proto = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__86755,(0),null);
var mmap = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__86755,(1),null);
var extend_via_metadata_87081 = new cljs.core.Keyword(null,"extend-via-metadata","extend-via-metadata",-427346794).cljs$core$IFn$_invoke$arity$1(proto);
var proto_ns_87082 = new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(proto);
var pns_87083 = sci.impl.vars.getName(proto_ns_87082);
var pns_str_87084 = (cljs.core.truth_(extend_via_metadata_87081)?cljs.core.str.cljs$core$IFn$_invoke$arity$1(pns_87083):null);
var seq__86758_87085 = cljs.core.seq(mmap);
var chunk__86759_87086 = null;
var count__86760_87087 = (0);
var i__86761_87088 = (0);
while(true){
if((i__86761_87088 < count__86760_87087)){
var vec__86893_87089 = chunk__86759_87086.cljs$core$IIndexed$_nth$arity$2(null,i__86761_87088);
var meth_name_87090 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__86893_87089,(0),null);
var f_87091 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__86893_87089,(1),null);
var meth_str_87092 = cljs.core.name(meth_name_87090);
var meth_sym_87093 = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(meth_str_87092);
var env_87094 = cljs.core.deref(new cljs.core.Keyword(null,"env","env",-1815813235).cljs$core$IFn$_invoke$arity$1(ctx));
var multi_method_var_87095 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(env_87094,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469),pns_87083,meth_sym_87093], null));
var multi_method_87096 = cljs.core.deref(multi_method_var_87095);
sci.impl.multimethods.multi_fn_add_method_impl(multi_method_87096,atype,(cljs.core.truth_(extend_via_metadata_87081)?(function (){var fq = cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(pns_str_87084,meth_str_87092);
return ((function (seq__86758_87085,chunk__86759_87086,count__86760_87087,i__86761_87088,seq__86702,chunk__86704,count__86705,i__86706,fq,meth_str_87092,meth_sym_87093,env_87094,multi_method_var_87095,multi_method_87096,vec__86893_87089,meth_name_87090,f_87091,extend_via_metadata_87081,proto_ns_87082,pns_87083,pns_str_87084,vec__86755,proto,mmap){
return (function() { 
var G__87097__delegate = function (this$,args){
var temp__5802__auto__ = cljs.core.meta(this$);
if(cljs.core.truth_(temp__5802__auto__)){
var m = temp__5802__auto__;
var temp__5802__auto____$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(m,fq);
if(cljs.core.truth_(temp__5802__auto____$1)){
var meth = temp__5802__auto____$1;
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(meth,this$,args);
} else {
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(f_87091,this$,args);
}
} else {
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(f_87091,this$,args);
}
};
var G__87097 = function (this$,var_args){
var args = null;
if (arguments.length > 1) {
var G__87098__i = 0, G__87098__a = new Array(arguments.length -  1);
while (G__87098__i < G__87098__a.length) {G__87098__a[G__87098__i] = arguments[G__87098__i + 1]; ++G__87098__i;}
  args = new cljs.core.IndexedSeq(G__87098__a,0,null);
} 
return G__87097__delegate.call(this,this$,args);};
G__87097.cljs$lang$maxFixedArity = 1;
G__87097.cljs$lang$applyTo = (function (arglist__87099){
var this$ = cljs.core.first(arglist__87099);
var args = cljs.core.rest(arglist__87099);
return G__87097__delegate(this$,args);
});
G__87097.cljs$core$IFn$_invoke$arity$variadic = G__87097__delegate;
return G__87097;
})()
;
;})(seq__86758_87085,chunk__86759_87086,count__86760_87087,i__86761_87088,seq__86702,chunk__86704,count__86705,i__86706,fq,meth_str_87092,meth_sym_87093,env_87094,multi_method_var_87095,multi_method_87096,vec__86893_87089,meth_name_87090,f_87091,extend_via_metadata_87081,proto_ns_87082,pns_87083,pns_str_87084,vec__86755,proto,mmap))
})():f_87091));


var G__87100 = seq__86758_87085;
var G__87101 = chunk__86759_87086;
var G__87102 = count__86760_87087;
var G__87103 = (i__86761_87088 + (1));
seq__86758_87085 = G__87100;
chunk__86759_87086 = G__87101;
count__86760_87087 = G__87102;
i__86761_87088 = G__87103;
continue;
} else {
var temp__5804__auto___87104 = cljs.core.seq(seq__86758_87085);
if(temp__5804__auto___87104){
var seq__86758_87105__$1 = temp__5804__auto___87104;
if(cljs.core.chunked_seq_QMARK_(seq__86758_87105__$1)){
var c__5525__auto___87106 = cljs.core.chunk_first(seq__86758_87105__$1);
var G__87107 = cljs.core.chunk_rest(seq__86758_87105__$1);
var G__87108 = c__5525__auto___87106;
var G__87109 = cljs.core.count(c__5525__auto___87106);
var G__87110 = (0);
seq__86758_87085 = G__87107;
chunk__86759_87086 = G__87108;
count__86760_87087 = G__87109;
i__86761_87088 = G__87110;
continue;
} else {
var vec__86901_87111 = cljs.core.first(seq__86758_87105__$1);
var meth_name_87112 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__86901_87111,(0),null);
var f_87113 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__86901_87111,(1),null);
var meth_str_87114 = cljs.core.name(meth_name_87112);
var meth_sym_87115 = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(meth_str_87114);
var env_87116 = cljs.core.deref(new cljs.core.Keyword(null,"env","env",-1815813235).cljs$core$IFn$_invoke$arity$1(ctx));
var multi_method_var_87117 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(env_87116,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469),pns_87083,meth_sym_87115], null));
var multi_method_87118 = cljs.core.deref(multi_method_var_87117);
sci.impl.multimethods.multi_fn_add_method_impl(multi_method_87118,atype,(cljs.core.truth_(extend_via_metadata_87081)?(function (){var fq = cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(pns_str_87084,meth_str_87114);
return ((function (seq__86758_87085,chunk__86759_87086,count__86760_87087,i__86761_87088,seq__86702,chunk__86704,count__86705,i__86706,fq,meth_str_87114,meth_sym_87115,env_87116,multi_method_var_87117,multi_method_87118,vec__86901_87111,meth_name_87112,f_87113,seq__86758_87105__$1,temp__5804__auto___87104,extend_via_metadata_87081,proto_ns_87082,pns_87083,pns_str_87084,vec__86755,proto,mmap){
return (function() { 
var G__87119__delegate = function (this$,args){
var temp__5802__auto__ = cljs.core.meta(this$);
if(cljs.core.truth_(temp__5802__auto__)){
var m = temp__5802__auto__;
var temp__5802__auto____$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(m,fq);
if(cljs.core.truth_(temp__5802__auto____$1)){
var meth = temp__5802__auto____$1;
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(meth,this$,args);
} else {
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(f_87113,this$,args);
}
} else {
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(f_87113,this$,args);
}
};
var G__87119 = function (this$,var_args){
var args = null;
if (arguments.length > 1) {
var G__87120__i = 0, G__87120__a = new Array(arguments.length -  1);
while (G__87120__i < G__87120__a.length) {G__87120__a[G__87120__i] = arguments[G__87120__i + 1]; ++G__87120__i;}
  args = new cljs.core.IndexedSeq(G__87120__a,0,null);
} 
return G__87119__delegate.call(this,this$,args);};
G__87119.cljs$lang$maxFixedArity = 1;
G__87119.cljs$lang$applyTo = (function (arglist__87121){
var this$ = cljs.core.first(arglist__87121);
var args = cljs.core.rest(arglist__87121);
return G__87119__delegate(this$,args);
});
G__87119.cljs$core$IFn$_invoke$arity$variadic = G__87119__delegate;
return G__87119;
})()
;
;})(seq__86758_87085,chunk__86759_87086,count__86760_87087,i__86761_87088,seq__86702,chunk__86704,count__86705,i__86706,fq,meth_str_87114,meth_sym_87115,env_87116,multi_method_var_87117,multi_method_87118,vec__86901_87111,meth_name_87112,f_87113,seq__86758_87105__$1,temp__5804__auto___87104,extend_via_metadata_87081,proto_ns_87082,pns_87083,pns_str_87084,vec__86755,proto,mmap))
})():f_87113));


var G__87122 = cljs.core.next(seq__86758_87105__$1);
var G__87123 = null;
var G__87124 = (0);
var G__87125 = (0);
seq__86758_87085 = G__87122;
chunk__86759_87086 = G__87123;
count__86760_87087 = G__87124;
i__86761_87088 = G__87125;
continue;
}
} else {
}
}
break;
}


var G__87126 = seq__86702;
var G__87127 = chunk__86704;
var G__87128 = count__86705;
var G__87129 = (i__86706 + (1));
seq__86702 = G__87126;
chunk__86704 = G__87127;
count__86705 = G__87128;
i__86706 = G__87129;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__86702);
if(temp__5804__auto__){
var seq__86702__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__86702__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__86702__$1);
var G__87130 = cljs.core.chunk_rest(seq__86702__$1);
var G__87131 = c__5525__auto__;
var G__87132 = cljs.core.count(c__5525__auto__);
var G__87133 = (0);
seq__86702 = G__87130;
chunk__86704 = G__87131;
count__86705 = G__87132;
i__86706 = G__87133;
continue;
} else {
var vec__86904 = cljs.core.first(seq__86702__$1);
var proto = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__86904,(0),null);
var mmap = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__86904,(1),null);
var extend_via_metadata_87134 = new cljs.core.Keyword(null,"extend-via-metadata","extend-via-metadata",-427346794).cljs$core$IFn$_invoke$arity$1(proto);
var proto_ns_87135 = new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(proto);
var pns_87136 = sci.impl.vars.getName(proto_ns_87135);
var pns_str_87137 = (cljs.core.truth_(extend_via_metadata_87134)?cljs.core.str.cljs$core$IFn$_invoke$arity$1(pns_87136):null);
var seq__86907_87138 = cljs.core.seq(mmap);
var chunk__86908_87139 = null;
var count__86909_87140 = (0);
var i__86910_87141 = (0);
while(true){
if((i__86910_87141 < count__86909_87140)){
var vec__86918_87142 = chunk__86908_87139.cljs$core$IIndexed$_nth$arity$2(null,i__86910_87141);
var meth_name_87143 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__86918_87142,(0),null);
var f_87144 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__86918_87142,(1),null);
var meth_str_87145 = cljs.core.name(meth_name_87143);
var meth_sym_87146 = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(meth_str_87145);
var env_87147 = cljs.core.deref(new cljs.core.Keyword(null,"env","env",-1815813235).cljs$core$IFn$_invoke$arity$1(ctx));
var multi_method_var_87148 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(env_87147,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469),pns_87136,meth_sym_87146], null));
var multi_method_87149 = cljs.core.deref(multi_method_var_87148);
sci.impl.multimethods.multi_fn_add_method_impl(multi_method_87149,atype,(cljs.core.truth_(extend_via_metadata_87134)?(function (){var fq = cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(pns_str_87137,meth_str_87145);
return ((function (seq__86907_87138,chunk__86908_87139,count__86909_87140,i__86910_87141,seq__86702,chunk__86704,count__86705,i__86706,fq,meth_str_87145,meth_sym_87146,env_87147,multi_method_var_87148,multi_method_87149,vec__86918_87142,meth_name_87143,f_87144,extend_via_metadata_87134,proto_ns_87135,pns_87136,pns_str_87137,vec__86904,proto,mmap,seq__86702__$1,temp__5804__auto__){
return (function() { 
var G__87150__delegate = function (this$,args){
var temp__5802__auto__ = cljs.core.meta(this$);
if(cljs.core.truth_(temp__5802__auto__)){
var m = temp__5802__auto__;
var temp__5802__auto____$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(m,fq);
if(cljs.core.truth_(temp__5802__auto____$1)){
var meth = temp__5802__auto____$1;
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(meth,this$,args);
} else {
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(f_87144,this$,args);
}
} else {
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(f_87144,this$,args);
}
};
var G__87150 = function (this$,var_args){
var args = null;
if (arguments.length > 1) {
var G__87151__i = 0, G__87151__a = new Array(arguments.length -  1);
while (G__87151__i < G__87151__a.length) {G__87151__a[G__87151__i] = arguments[G__87151__i + 1]; ++G__87151__i;}
  args = new cljs.core.IndexedSeq(G__87151__a,0,null);
} 
return G__87150__delegate.call(this,this$,args);};
G__87150.cljs$lang$maxFixedArity = 1;
G__87150.cljs$lang$applyTo = (function (arglist__87152){
var this$ = cljs.core.first(arglist__87152);
var args = cljs.core.rest(arglist__87152);
return G__87150__delegate(this$,args);
});
G__87150.cljs$core$IFn$_invoke$arity$variadic = G__87150__delegate;
return G__87150;
})()
;
;})(seq__86907_87138,chunk__86908_87139,count__86909_87140,i__86910_87141,seq__86702,chunk__86704,count__86705,i__86706,fq,meth_str_87145,meth_sym_87146,env_87147,multi_method_var_87148,multi_method_87149,vec__86918_87142,meth_name_87143,f_87144,extend_via_metadata_87134,proto_ns_87135,pns_87136,pns_str_87137,vec__86904,proto,mmap,seq__86702__$1,temp__5804__auto__))
})():f_87144));


var G__87153 = seq__86907_87138;
var G__87154 = chunk__86908_87139;
var G__87155 = count__86909_87140;
var G__87156 = (i__86910_87141 + (1));
seq__86907_87138 = G__87153;
chunk__86908_87139 = G__87154;
count__86909_87140 = G__87155;
i__86910_87141 = G__87156;
continue;
} else {
var temp__5804__auto___87157__$1 = cljs.core.seq(seq__86907_87138);
if(temp__5804__auto___87157__$1){
var seq__86907_87158__$1 = temp__5804__auto___87157__$1;
if(cljs.core.chunked_seq_QMARK_(seq__86907_87158__$1)){
var c__5525__auto___87159 = cljs.core.chunk_first(seq__86907_87158__$1);
var G__87160 = cljs.core.chunk_rest(seq__86907_87158__$1);
var G__87161 = c__5525__auto___87159;
var G__87162 = cljs.core.count(c__5525__auto___87159);
var G__87163 = (0);
seq__86907_87138 = G__87160;
chunk__86908_87139 = G__87161;
count__86909_87140 = G__87162;
i__86910_87141 = G__87163;
continue;
} else {
var vec__86921_87164 = cljs.core.first(seq__86907_87158__$1);
var meth_name_87165 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__86921_87164,(0),null);
var f_87166 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__86921_87164,(1),null);
var meth_str_87167 = cljs.core.name(meth_name_87165);
var meth_sym_87168 = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(meth_str_87167);
var env_87169 = cljs.core.deref(new cljs.core.Keyword(null,"env","env",-1815813235).cljs$core$IFn$_invoke$arity$1(ctx));
var multi_method_var_87170 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(env_87169,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"namespaces","namespaces",-1444157469),pns_87136,meth_sym_87168], null));
var multi_method_87171 = cljs.core.deref(multi_method_var_87170);
sci.impl.multimethods.multi_fn_add_method_impl(multi_method_87171,atype,(cljs.core.truth_(extend_via_metadata_87134)?(function (){var fq = cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(pns_str_87137,meth_str_87167);
return ((function (seq__86907_87138,chunk__86908_87139,count__86909_87140,i__86910_87141,seq__86702,chunk__86704,count__86705,i__86706,fq,meth_str_87167,meth_sym_87168,env_87169,multi_method_var_87170,multi_method_87171,vec__86921_87164,meth_name_87165,f_87166,seq__86907_87158__$1,temp__5804__auto___87157__$1,extend_via_metadata_87134,proto_ns_87135,pns_87136,pns_str_87137,vec__86904,proto,mmap,seq__86702__$1,temp__5804__auto__){
return (function() { 
var G__87172__delegate = function (this$,args){
var temp__5802__auto__ = cljs.core.meta(this$);
if(cljs.core.truth_(temp__5802__auto__)){
var m = temp__5802__auto__;
var temp__5802__auto____$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(m,fq);
if(cljs.core.truth_(temp__5802__auto____$1)){
var meth = temp__5802__auto____$1;
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(meth,this$,args);
} else {
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(f_87166,this$,args);
}
} else {
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(f_87166,this$,args);
}
};
var G__87172 = function (this$,var_args){
var args = null;
if (arguments.length > 1) {
var G__87173__i = 0, G__87173__a = new Array(arguments.length -  1);
while (G__87173__i < G__87173__a.length) {G__87173__a[G__87173__i] = arguments[G__87173__i + 1]; ++G__87173__i;}
  args = new cljs.core.IndexedSeq(G__87173__a,0,null);
} 
return G__87172__delegate.call(this,this$,args);};
G__87172.cljs$lang$maxFixedArity = 1;
G__87172.cljs$lang$applyTo = (function (arglist__87175){
var this$ = cljs.core.first(arglist__87175);
var args = cljs.core.rest(arglist__87175);
return G__87172__delegate(this$,args);
});
G__87172.cljs$core$IFn$_invoke$arity$variadic = G__87172__delegate;
return G__87172;
})()
;
;})(seq__86907_87138,chunk__86908_87139,count__86909_87140,i__86910_87141,seq__86702,chunk__86704,count__86705,i__86706,fq,meth_str_87167,meth_sym_87168,env_87169,multi_method_var_87170,multi_method_87171,vec__86921_87164,meth_name_87165,f_87166,seq__86907_87158__$1,temp__5804__auto___87157__$1,extend_via_metadata_87134,proto_ns_87135,pns_87136,pns_str_87137,vec__86904,proto,mmap,seq__86702__$1,temp__5804__auto__))
})():f_87166));


var G__87177 = cljs.core.next(seq__86907_87158__$1);
var G__87178 = null;
var G__87179 = (0);
var G__87180 = (0);
seq__86907_87138 = G__87177;
chunk__86908_87139 = G__87178;
count__86909_87140 = G__87179;
i__86910_87141 = G__87180;
continue;
}
} else {
}
}
break;
}


var G__87181 = cljs.core.next(seq__86702__$1);
var G__87182 = null;
var G__87183 = (0);
var G__87184 = (0);
seq__86702 = G__87181;
chunk__86704 = G__87182;
count__86705 = G__87183;
i__86706 = G__87184;
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
(sci.impl.protocols.extend.cljs$lang$applyTo = (function (seq86699){
var G__86700 = cljs.core.first(seq86699);
var seq86699__$1 = cljs.core.next(seq86699);
var G__86701 = cljs.core.first(seq86699__$1);
var seq86699__$2 = cljs.core.next(seq86699__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__86700,G__86701,seq86699__$2);
}));

/**
 * Processes single args+body pair for extending via metadata
 */
sci.impl.protocols.process_single_extend_meta = (function sci$impl$protocols$process_single_extend_meta(fq,p__86933){
var vec__86934 = p__86933;
var seq__86935 = cljs.core.seq(vec__86934);
var first__86936 = cljs.core.first(seq__86935);
var seq__86935__$1 = cljs.core.next(seq__86935);
var args = first__86936;
var body = seq__86935__$1;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [args,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","let","cljs.core/let",-308701135,null),null,(1),null)),(new cljs.core.List(null,cljs.core.vec(cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"farg__86928__auto__","farg__86928__auto__",2142590602,null),null,(1),null)),(new cljs.core.List(null,cljs.core.first(args),null,(1),null)))))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","if-let","cljs.core/if-let",1346583165,null),null,(1),null)),(new cljs.core.List(null,cljs.core.vec(cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"m__86929__auto__","m__86929__auto__",-418938005,null),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","meta","cljs.core/meta",-748218346,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"farg__86928__auto__","farg__86928__auto__",2142590602,null),null,(1),null))))),null,(1),null)))))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","if-let","cljs.core/if-let",1346583165,null),null,(1),null)),(new cljs.core.List(null,cljs.core.vec(cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"meth__86930__auto__","meth__86930__auto__",1557223032,null),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","get","cljs.core/get",-296075407,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"m__86929__auto__","m__86929__auto__",-418938005,null),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"quote","quote",1377916282,null),null,(1),null)),(new cljs.core.List(null,fq,null,(1),null))))),null,(1),null))], 0)))),null,(1),null)))))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","apply","cljs.core/apply",1757277831,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"meth__86930__auto__","meth__86930__auto__",1557223032,null),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,args,null,(1),null))], 0)))),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"do","do",1686842252,null),null,(1),null)),body))),null,(1),null))], 0)))),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"do","do",1686842252,null),null,(1),null)),body))),null,(1),null))], 0)))),null,(1),null))], 0))))], null);
});
sci.impl.protocols.process_methods = (function sci$impl$protocols$process_methods(type,meths,protocol_ns,extend_via_metadata){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__86958){
var vec__86959 = p__86958;
var seq__86960 = cljs.core.seq(vec__86959);
var first__86961 = cljs.core.first(seq__86960);
var seq__86960__$1 = cljs.core.next(seq__86960);
var meth_name = first__86961;
var fn_body = seq__86960__$1;
var fq = cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(protocol_ns,cljs.core.name(meth_name));
var fn_body__$1 = (cljs.core.truth_(extend_via_metadata)?((cljs.core.vector_QMARK_(cljs.core.first(fn_body)))?sci.impl.protocols.process_single_extend_meta(fq,fn_body):cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__86957_SHARP_){
return sci.impl.protocols.process_single_extend_meta(fq,p1__86957_SHARP_);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([fn_body], 0))):fn_body);
return cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","defmethod","cljs.core/defmethod",-180785162,null),null,(1),null)),(new cljs.core.List(null,fq,null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,type,null,(1),null)),fn_body__$1], 0))));
}),meths);
});
sci.impl.protocols.extend_protocol = (function sci$impl$protocols$extend_protocol(var_args){
var args__5732__auto__ = [];
var len__5726__auto___87191 = arguments.length;
var i__5727__auto___87192 = (0);
while(true){
if((i__5727__auto___87192 < len__5726__auto___87191)){
args__5732__auto__.push((arguments[i__5727__auto___87192]));

var G__87193 = (i__5727__auto___87192 + (1));
i__5727__auto___87192 = G__87193;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((4) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((4)),(0),null)):null);
return sci.impl.protocols.extend_protocol.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),argseq__5733__auto__);
});

(sci.impl.protocols.extend_protocol.cljs$core$IFn$_invoke$arity$variadic = (function (_,___$1,ctx,protocol_name,impls){
var impls__$1 = sci.impl.utils.split_when((function (p1__86962_SHARP_){
return (!(cljs.core.seq_QMARK_(p1__86962_SHARP_)));
}),impls);
var protocol_var = (function (){var G__86985 = ctx;
var G__86986 = new cljs.core.Keyword(null,"bindingx","bindingx",679516896).cljs$core$IFn$_invoke$arity$1(ctx);
var G__86987 = protocol_name;
var fexpr__86984 = cljs.core.deref(sci.impl.utils.eval_resolve_state);
return (fexpr__86984.cljs$core$IFn$_invoke$arity$3 ? fexpr__86984.cljs$core$IFn$_invoke$arity$3(G__86985,G__86986,G__86987) : fexpr__86984.call(null,G__86985,G__86986,G__86987));
})();
var protocol_data = cljs.core.deref(protocol_var);
var extend_via_metadata = new cljs.core.Keyword(null,"extend-via-metadata","extend-via-metadata",-427346794).cljs$core$IFn$_invoke$arity$1(protocol_data);
var protocol_ns = new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(protocol_data);
var pns = cljs.core.str.cljs$core$IFn$_invoke$arity$1(sci.impl.vars.getName(protocol_ns));
var expansion = cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"do","do",1686842252,null),null,(1),null)),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__86989){
var vec__86990 = p__86989;
var seq__86991 = cljs.core.seq(vec__86990);
var first__86992 = cljs.core.first(seq__86991);
var seq__86991__$1 = cljs.core.next(seq__86991);
var type = first__86992;
var meths = seq__86991__$1;
return cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"do","do",1686842252,null),null,(1),null)),sci.impl.protocols.process_methods(type,meths,pns,extend_via_metadata))));
}),impls__$1))));
return expansion;
}));

(sci.impl.protocols.extend_protocol.cljs$lang$maxFixedArity = (4));

/** @this {Function} */
(sci.impl.protocols.extend_protocol.cljs$lang$applyTo = (function (seq86963){
var G__86964 = cljs.core.first(seq86963);
var seq86963__$1 = cljs.core.next(seq86963);
var G__86965 = cljs.core.first(seq86963__$1);
var seq86963__$2 = cljs.core.next(seq86963__$1);
var G__86966 = cljs.core.first(seq86963__$2);
var seq86963__$3 = cljs.core.next(seq86963__$2);
var G__86967 = cljs.core.first(seq86963__$3);
var seq86963__$4 = cljs.core.next(seq86963__$3);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__86964,G__86965,G__86966,G__86967,seq86963__$4);
}));

sci.impl.protocols.extend_type = (function sci$impl$protocols$extend_type(var_args){
var args__5732__auto__ = [];
var len__5726__auto___87195 = arguments.length;
var i__5727__auto___87196 = (0);
while(true){
if((i__5727__auto___87196 < len__5726__auto___87195)){
args__5732__auto__.push((arguments[i__5727__auto___87196]));

var G__87198 = (i__5727__auto___87196 + (1));
i__5727__auto___87196 = G__87198;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((4) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((4)),(0),null)):null);
return sci.impl.protocols.extend_type.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),argseq__5733__auto__);
});

(sci.impl.protocols.extend_type.cljs$core$IFn$_invoke$arity$variadic = (function (_,___$1,ctx,atype,proto_PLUS_meths){
var proto_PLUS_meths__$1 = sci.impl.utils.split_when((function (p1__86996_SHARP_){
return (!(cljs.core.seq_QMARK_(p1__86996_SHARP_)));
}),proto_PLUS_meths);
return cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"do","do",1686842252,null),null,(1),null)),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__87018){
var vec__87019 = p__87018;
var seq__87020 = cljs.core.seq(vec__87019);
var first__87021 = cljs.core.first(seq__87020);
var seq__87020__$1 = cljs.core.next(seq__87020);
var proto = first__87021;
var meths = seq__87020__$1;
var protocol_var = (function (){var G__87023 = ctx;
var G__87024 = new cljs.core.Keyword(null,"bindings","bindings",1271397192).cljs$core$IFn$_invoke$arity$1(ctx);
var G__87025 = proto;
var fexpr__87022 = cljs.core.deref(sci.impl.utils.eval_resolve_state);
return (fexpr__87022.cljs$core$IFn$_invoke$arity$3 ? fexpr__87022.cljs$core$IFn$_invoke$arity$3(G__87023,G__87024,G__87025) : fexpr__87022.call(null,G__87023,G__87024,G__87025));
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
(sci.impl.protocols.extend_type.cljs$lang$applyTo = (function (seq86997){
var G__87001 = cljs.core.first(seq86997);
var seq86997__$1 = cljs.core.next(seq86997);
var G__87002 = cljs.core.first(seq86997__$1);
var seq86997__$2 = cljs.core.next(seq86997__$1);
var G__87003 = cljs.core.first(seq86997__$2);
var seq86997__$3 = cljs.core.next(seq86997__$2);
var G__87004 = cljs.core.first(seq86997__$3);
var seq86997__$4 = cljs.core.next(seq86997__$3);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__87001,G__87002,G__87003,G__87004,seq86997__$4);
}));

sci.impl.protocols.find_matching_non_default_method = (function sci$impl$protocols$find_matching_non_default_method(protocol,obj){
return cljs.core.boolean$(cljs.core.some((function (p1__87026_SHARP_){
var temp__5804__auto__ = cljs.core.get_method(p1__87026_SHARP_,sci.impl.types.type_impl(obj));
if(cljs.core.truth_(temp__5804__auto__)){
var m = temp__5804__auto__;
var ms = cljs.core.methods$(p1__87026_SHARP_);
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
var pred__87030 = cljs.core._EQ_;
var expr__87031 = p;
if(cljs.core.truth_((pred__87030.cljs$core$IFn$_invoke$arity$2 ? pred__87030.cljs$core$IFn$_invoke$arity$2(cljs.core.IDeref,expr__87031) : pred__87030.call(null,cljs.core.IDeref,expr__87031)))){
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
if(cljs.core.truth_((pred__87030.cljs$core$IFn$_invoke$arity$2 ? pred__87030.cljs$core$IFn$_invoke$arity$2(cljs.core.ISwap,expr__87031) : pred__87030.call(null,cljs.core.ISwap,expr__87031)))){
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
if(cljs.core.truth_((pred__87030.cljs$core$IFn$_invoke$arity$2 ? pred__87030.cljs$core$IFn$_invoke$arity$2(cljs.core.IReset,expr__87031) : pred__87030.call(null,cljs.core.IReset,expr__87031)))){
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
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(expr__87031)].join('')));
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
var G__87038 = clazz;
var G__87038__$1 = (((G__87038 == null))?null:cljs.core.meta(G__87038));
if((G__87038__$1 == null)){
return null;
} else {
return new cljs.core.Keyword("sci.impl","record","sci.impl/record",-1939193950).cljs$core$IFn$_invoke$arity$1(G__87038__$1);
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
return cljs.core.boolean$(cljs.core.some((function (p1__87039_SHARP_){
return cljs.core.get_method(p1__87039_SHARP_,atype);
}),new cljs.core.Keyword(null,"methods","methods",453930866).cljs$core$IFn$_invoke$arity$1(protocol)));
});

//# sourceMappingURL=sci.impl.protocols.js.map
