goog.provide('frontend.db.utils');
frontend.db.utils.seq_flatten = (function frontend$db$utils$seq_flatten(col){
return cljs.core.flatten(cljs.core.seq(col));
});
frontend.db.utils.group_by_page = (function frontend$db$utils$group_by_page(blocks){
if(cljs.core.truth_(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(cljs.core.first(blocks)))){
var G__60334 = blocks;
if((G__60334 == null)){
return null;
} else {
return cljs.core.group_by(new cljs.core.Keyword("block","page","block/page",822314108),G__60334);
}
} else {
return blocks;
}
});
/**
 * This function will return nil if passed `eid` is an integer and
 *   the entity doesn't exist in db.
 *   `repo-or-db`: a repo string or a db,
 *   `eid`: same as d/entity.
 */
frontend.db.utils.entity = (function frontend$db$utils$entity(var_args){
var G__60336 = arguments.length;
switch (G__60336) {
case 1:
return frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$1 = (function (eid){
return frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$2(frontend.state.get_current_repo(),eid);
}));

(frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$2 = (function (repo_or_db,eid){
if(cljs.core.truth_(eid)){
if(((typeof eid === 'number') || (((cljs.core.sequential_QMARK_(eid)) || ((((eid instanceof cljs.core.Keyword)) || (cljs.core.uuid_QMARK_(eid)))))))){
} else {
throw (new Error(["Assert failed: ",(function (){
console.trace();

return ["Invalid entity eid: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([eid], 0))].join('');
})()
,"\n","(or (number? eid) (sequential? eid) (keyword? eid) (uuid? eid))"].join('')));
}

var eid__$1 = ((cljs.core.uuid_QMARK_(eid))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),eid], null):eid);
var temp__5804__auto__ = ((typeof repo_or_db === 'string')?(function (){var repo = (function (){var or__5002__auto__ = repo_or_db;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.state.get_current_repo();
}
})();
return frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo);
})():repo_or_db);
if(cljs.core.truth_(temp__5804__auto__)){
var db = temp__5804__auto__;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,eid__$1) : datascript.core.entity.call(null,db,eid__$1));
} else {
return null;
}
} else {
return null;
}
}));

(frontend.db.utils.entity.cljs$lang$maxFixedArity = 2);

/**
 * Replace `[[internal-id]]` with `[[page name]]`
 */
frontend.db.utils.update_block_content = (function frontend$db$utils$update_block_content(item,eid){
var temp__5802__auto__ = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$0();
if(cljs.core.truth_(temp__5802__auto__)){
var db = temp__5802__auto__;
if(cljs.core.truth_(logseq.db.common.entity_plus.db_based_graph_QMARK_(db))){
return logseq.db.frontend.content.update_block_content(db,item,eid);
} else {
return item;
}
} else {
return item;
}
});
frontend.db.utils.pull = (function frontend$db$utils$pull(var_args){
var G__60338 = arguments.length;
switch (G__60338) {
case 1:
return frontend.db.utils.pull.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.db.utils.pull.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.db.utils.pull.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.db.utils.pull.cljs$core$IFn$_invoke$arity$1 = (function (eid){
return frontend.db.utils.pull.cljs$core$IFn$_invoke$arity$3(frontend.state.get_current_repo(),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null),eid);
}));

(frontend.db.utils.pull.cljs$core$IFn$_invoke$arity$2 = (function (selector,eid){
return frontend.db.utils.pull.cljs$core$IFn$_invoke$arity$3(frontend.state.get_current_repo(),selector,eid);
}));

(frontend.db.utils.pull.cljs$core$IFn$_invoke$arity$3 = (function (repo,selector,eid){
var temp__5804__auto__ = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var db = temp__5804__auto__;
var result = (datascript.core.pull.cljs$core$IFn$_invoke$arity$3 ? datascript.core.pull.cljs$core$IFn$_invoke$arity$3(db,selector,eid) : datascript.core.pull.call(null,db,selector,eid));
return frontend.db.utils.update_block_content(result,eid);
} else {
return null;
}
}));

(frontend.db.utils.pull.cljs$lang$maxFixedArity = 3);

frontend.db.utils.pull_many = (function frontend$db$utils$pull_many(var_args){
var G__60341 = arguments.length;
switch (G__60341) {
case 1:
return frontend.db.utils.pull_many.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.db.utils.pull_many.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.db.utils.pull_many.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.db.utils.pull_many.cljs$core$IFn$_invoke$arity$1 = (function (eids){
return frontend.db.utils.pull_many.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null),eids);
}));

(frontend.db.utils.pull_many.cljs$core$IFn$_invoke$arity$2 = (function (selector,eids){
return frontend.db.utils.pull_many.cljs$core$IFn$_invoke$arity$3(frontend.state.get_current_repo(),selector,eids);
}));

(frontend.db.utils.pull_many.cljs$core$IFn$_invoke$arity$3 = (function (repo,selector,eids){
var temp__5804__auto__ = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var db = temp__5804__auto__;
var selector__$1 = (cljs.core.truth_(cljs.core.some(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","id","db/id",-1388397098),null], null), null),selector))?selector:cljs.core.conj.cljs$core$IFn$_invoke$arity$2(selector,new cljs.core.Keyword("db","id","db/id",-1388397098)));
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__60339_SHARP_){
return frontend.db.utils.update_block_content(p1__60339_SHARP_,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(p1__60339_SHARP_));
}),(datascript.core.pull_many.cljs$core$IFn$_invoke$arity$3 ? datascript.core.pull_many.cljs$core$IFn$_invoke$arity$3(db,selector__$1,eids) : datascript.core.pull_many.call(null,db,selector__$1,eids)));
} else {
return null;
}
}));

(frontend.db.utils.pull_many.cljs$lang$maxFixedArity = 3);

frontend.db.utils.q = (function frontend$db$utils$q(var_args){
var args__5732__auto__ = [];
var len__5726__auto___60347 = arguments.length;
var i__5727__auto___60348 = (0);
while(true){
if((i__5727__auto___60348 < len__5726__auto___60347)){
args__5732__auto__.push((arguments[i__5727__auto___60348]));

var G__60349 = (i__5727__auto___60348 + (1));
i__5727__auto___60348 = G__60349;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.db.utils.q.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.db.utils.q.cljs$core$IFn$_invoke$arity$variadic = (function (query,inputs){
var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
return cljs.core.apply.cljs$core$IFn$_invoke$arity$4(datascript.core.q,query,frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(repo),inputs);
} else {
return null;
}
}));

(frontend.db.utils.q.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.db.utils.q.cljs$lang$applyTo = (function (seq60342){
var G__60343 = cljs.core.first(seq60342);
var seq60342__$1 = cljs.core.next(seq60342);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__60343,seq60342__$1);
}));


//# sourceMappingURL=frontend.db.utils.js.map
