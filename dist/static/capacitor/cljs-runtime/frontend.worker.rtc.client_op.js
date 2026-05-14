goog.provide('frontend.worker.rtc.client_op');
frontend.worker.rtc.client_op.op_schema = new cljs.core.PersistentVector(null, 10, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"multi","multi",-190293005),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"dispatch","dispatch",1319337009),cljs.core.first], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"update-kv-value","update-kv-value",-1091588796),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"t","t",-1397832519),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"db-ident","db-ident",-992686073),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword(null,"any","any",1705907423)], null)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"move","move",-2110884309),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"t","t",-1397832519),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),new cljs.core.Keyword(null,"uuid","uuid",-2145095719)], null)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"remove","remove",-131428414),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"t","t",-1397832519),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),new cljs.core.Keyword(null,"uuid","uuid",-2145095719)], null)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"update-page","update-page",-503479891),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"t","t",-1397832519),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),new cljs.core.Keyword(null,"uuid","uuid",-2145095719)], null)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"remove-page","remove-page",-1679345876),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"t","t",-1397832519),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),new cljs.core.Keyword(null,"uuid","uuid",-2145095719)], null)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"update","update",1045576396),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"t","t",-1397832519),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),new cljs.core.Keyword(null,"uuid","uuid",-2145095719)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"av-coll","av-coll",1589194401),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"sequential","sequential",-1082983960),frontend.worker.rtc.malli_schema.av_schema], null)], null)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"update-asset","update-asset",501550582),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"t","t",-1397832519),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),new cljs.core.Keyword(null,"uuid","uuid",-2145095719)], null)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"remove-asset","remove-asset",-1739744854),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"t","t",-1397832519),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),new cljs.core.Keyword(null,"uuid","uuid",-2145095719)], null)], null)], null)], null)], null)], null);
frontend.worker.rtc.client_op.ops_schema = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"sequential","sequential",-1082983960),frontend.worker.rtc.client_op.op_schema], null);
frontend.worker.rtc.client_op.ops_coercer = malli.core.coercer.cljs$core$IFn$_invoke$arity$4(frontend.worker.rtc.client_op.ops_schema,malli.transform.json_transformer,null,(function (p1__132345_SHARP_){
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.worker.rtc.client-op",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("frontend.worker.rtc.client-op","bad-ops","frontend.worker.rtc.client-op/bad-ops",1077235405),new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(p1__132345_SHARP_),new cljs.core.Keyword(null,"line","line",212345235),70], null)),null);

return malli.core._fail_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("frontend.worker.rtc.client-op","ops-schema","frontend.worker.rtc.client-op/ops-schema",-238684562),cljs.core.select_keys(p1__132345_SHARP_,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"value","value",305978217)], null)));
}));
frontend.worker.rtc.client_op.block_op_types = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"remove","remove",-131428414),null,new cljs.core.Keyword(null,"move","move",-2110884309),null,new cljs.core.Keyword(null,"update","update",1045576396),null,new cljs.core.Keyword(null,"remove-page","remove-page",-1679345876),null,new cljs.core.Keyword(null,"update-page","update-page",-503479891),null], null), null);
frontend.worker.rtc.client_op.asset_op_types = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"remove-asset","remove-asset",-1739744854),null,new cljs.core.Keyword(null,"update-asset","update-asset",501550582),null], null), null);
frontend.worker.rtc.client_op.db_ident_kv_op_types = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"update-kv-value","update-kv-value",-1091588796),null], null), null);
/**
 * TODO: rename this db-name from client-op to client-metadata+op.
 *   and move it to its own namespace.
 */
frontend.worker.rtc.client_op.schema_in_db = new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","unique","db/unique",329396388),new cljs.core.Keyword("db.unique","identity","db.unique/identity",1675950722)], null),new cljs.core.Keyword(null,"db-ident","db-ident",-992686073),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","unique","db/unique",329396388),new cljs.core.Keyword("db.unique","identity","db.unique/identity",1675950722)], null),new cljs.core.Keyword(null,"local-tx","local-tx",1729212201),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","index","db/index",-1531680669),true], null),new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","index","db/index",-1531680669),true], null),new cljs.core.Keyword(null,"aes-key-jwk","aes-key-jwk",967413902),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","index","db/index",-1531680669),true], null),new cljs.core.Keyword("device","uuid","device/uuid",-1132949969),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","unique","db/unique",329396388),new cljs.core.Keyword("db.unique","identity","db.unique/identity",1675950722)], null),new cljs.core.Keyword("device","public-key-jwk","device/public-key-jwk",139354462),cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword("device","private-key-jwk","device/private-key-jwk",-1316648112),cljs.core.PersistentArrayMap.EMPTY], null);
frontend.worker.rtc.client_op.update_graph_uuid = (function frontend$worker$rtc$client_op$update_graph_uuid(repo,graph_uuid){
if((!((graph_uuid == null)))){
} else {
throw (new Error("Assert failed: (some? graph-uuid)"));
}

var temp__5804__auto__ = frontend.worker.state.get_client_ops_conn(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var conn = temp__5804__auto__;
if((cljs.core.first(datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(conn),new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522))) == null)){
} else {
throw (new Error("Assert failed: (nil? (first (d/datoms (clojure.core/deref conn) :avet :graph-uuid)))"));
}

var G__132348 = conn;
var G__132349 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),"e",new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522),graph_uuid], null)], null);
return (datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2(G__132348,G__132349) : datascript.core.transact_BANG_.call(null,G__132348,G__132349));
} else {
return null;
}
});
frontend.worker.rtc.client_op.get_graph_uuid = (function frontend$worker$rtc$client_op$get_graph_uuid(repo){
var temp__5804__auto__ = frontend.worker.state.get_client_ops_conn(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var conn = temp__5804__auto__;
return new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(cljs.core.first(datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(conn),new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522))));
} else {
return null;
}
});
frontend.worker.rtc.client_op.update_local_tx = (function frontend$worker$rtc$client_op$update_local_tx(repo,t){
if((!((t == null)))){
} else {
throw (new Error("Assert failed: (some? t)"));
}

var temp__5804__auto__ = frontend.worker.state.get_client_ops_conn(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var conn = temp__5804__auto__;
var tx_data = (function (){var temp__5802__auto__ = cljs.core.first(datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(conn),new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword(null,"local-tx","local-tx",1729212201)));
if(cljs.core.truth_(temp__5802__auto__)){
var datom = temp__5802__auto__;
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(datom),new cljs.core.Keyword(null,"local-tx","local-tx",1729212201),t], null);
} else {
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),"e",new cljs.core.Keyword(null,"local-tx","local-tx",1729212201),t], null);
}
})();
var G__132357 = conn;
var G__132358 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [tx_data], null);
return (datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2(G__132357,G__132358) : datascript.core.transact_BANG_.call(null,G__132357,G__132358));
} else {
return null;
}
});
frontend.worker.rtc.client_op.remove_local_tx = (function frontend$worker$rtc$client_op$remove_local_tx(repo){
var temp__5804__auto__ = frontend.worker.state.get_client_ops_conn(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var conn = temp__5804__auto__;
var temp__5804__auto____$1 = cljs.core.first(datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(conn),new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword(null,"local-tx","local-tx",1729212201)));
if(cljs.core.truth_(temp__5804__auto____$1)){
var datom = temp__5804__auto____$1;
var G__132359 = conn;
var G__132360 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(datom),new cljs.core.Keyword(null,"local-tx","local-tx",1729212201)], null)], null);
return (datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2(G__132359,G__132360) : datascript.core.transact_BANG_.call(null,G__132359,G__132360));
} else {
return null;
}
} else {
return null;
}
});
frontend.worker.rtc.client_op.get_local_tx = (function frontend$worker$rtc$client_op$get_local_tx(repo){
var temp__5804__auto__ = frontend.worker.state.get_client_ops_conn(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var conn = temp__5804__auto__;
return new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(cljs.core.first(datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(conn),new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword(null,"local-tx","local-tx",1729212201))));
} else {
return null;
}
});
frontend.worker.rtc.client_op.merge_update_ops = (function frontend$worker$rtc$client_op$merge_update_ops(update_op1,update_op2){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"update","update",1045576396),cljs.core.first(update_op1))){
} else {
throw (new Error("Assert failed: (= :update (first update-op1))"));
}

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"update","update",1045576396),cljs.core.first(update_op2))){
} else {
throw (new Error("Assert failed: (= :update (first update-op2))"));
}

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638).cljs$core$IFn$_invoke$arity$1(cljs.core.last(update_op1)),new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638).cljs$core$IFn$_invoke$arity$1(cljs.core.last(update_op2)))){
} else {
throw (new Error("Assert failed: (= (:block-uuid (last update-op1)) (:block-uuid (last update-op2)))"));
}

var t1 = cljs.core.second(update_op1);
var t2 = cljs.core.second(update_op2);
if((t1 > t2)){
return (frontend.worker.rtc.client_op.merge_update_ops.cljs$core$IFn$_invoke$arity$2 ? frontend.worker.rtc.client_op.merge_update_ops.cljs$core$IFn$_invoke$arity$2(update_op2,update_op1) : frontend.worker.rtc.client_op.merge_update_ops.call(null,update_op2,update_op1));
} else {
var map__132369 = cljs.core.last(update_op1);
var map__132369__$1 = cljs.core.__destructure_map(map__132369);
var av_coll1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__132369__$1,new cljs.core.Keyword(null,"av-coll","av-coll",1589194401));
var block_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__132369__$1,new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638));
var map__132370 = cljs.core.last(update_op2);
var map__132370__$1 = cljs.core.__destructure_map(map__132370);
var av_coll2 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__132370__$1,new cljs.core.Keyword(null,"av-coll","av-coll",1589194401));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"update","update",1045576396),t2,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),block_uuid,new cljs.core.Keyword(null,"av-coll","av-coll",1589194401),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(av_coll1,av_coll2)], null)], null);
}
});
frontend.worker.rtc.client_op.generate_block_ops_tx_data = (function frontend$worker$rtc$client_op$generate_block_ops_tx_data(client_ops_db,ops){
var sorted_ops = cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(cljs.core.second,ops);
var block_uuids = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__132377){
var vec__132378 = p__132377;
var _op_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132378,(0),null);
var _t = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132378,(1),null);
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132378,(2),null);
return new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638).cljs$core$IFn$_invoke$arity$1(value);
}),sorted_ops);
var ents = (function (){var G__132381 = client_ops_db;
var G__132382 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null);
var G__132383 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block_uuid){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
}),block_uuids);
return (datascript.core.pull_many.cljs$core$IFn$_invoke$arity$3 ? datascript.core.pull_many.cljs$core$IFn$_invoke$arity$3(G__132381,G__132382,G__132383) : datascript.core.pull_many.call(null,G__132381,G__132382,G__132383));
})();
var op_types = new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"move","move",-2110884309),new cljs.core.Keyword(null,"update","update",1045576396),new cljs.core.Keyword(null,"remove","remove",-131428414),new cljs.core.Keyword(null,"update-page","update-page",-503479891),new cljs.core.Keyword(null,"remove-page","remove-page",-1679345876)], null);
var init_block_uuid__GT_op_type__GT_op = cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$1((function (ent){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(ent),cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$1((function (op_type){
var temp__5804__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(ent,op_type);
if(cljs.core.truth_(temp__5804__auto__)){
var op = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [op_type,op], null);
} else {
return null;
}
})),op_types)], null);
})),ents);
var block_uuid__GT_op_type__GT_op = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (r,op){
var vec__132386 = op;
var op_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132386,(0),null);
var _t = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132386,(1),null);
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132386,(2),null);
var block_uuid = new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638).cljs$core$IFn$_invoke$arity$1(value);
var G__132389 = op_type;
var G__132389__$1 = (((G__132389 instanceof cljs.core.Keyword))?G__132389.fqn:null);
switch (G__132389__$1) {
case "move":
return cljs.core.assoc_in(cljs.core.update.cljs$core$IFn$_invoke$arity$5(r,block_uuid,cljs.core.assoc,new cljs.core.Keyword(null,"remove","remove",-131428414),new cljs.core.Keyword(null,"retract","retract",-1549826125)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_uuid,new cljs.core.Keyword(null,"move","move",-2110884309)], null),op);

break;
case "update":
return cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(cljs.core.update.cljs$core$IFn$_invoke$arity$5(r,block_uuid,cljs.core.assoc,new cljs.core.Keyword(null,"remove","remove",-131428414),new cljs.core.Keyword(null,"retract","retract",-1549826125)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_uuid,new cljs.core.Keyword(null,"update","update",1045576396)], null),(function (old_op){
if(cljs.core.truth_((function (){var and__5000__auto__ = old_op;
if(cljs.core.truth_(and__5000__auto__)){
return (!(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword(null,"retract","retract",-1549826125),old_op)));
} else {
return and__5000__auto__;
}
})())){
return frontend.worker.rtc.client_op.merge_update_ops(old_op,op);
} else {
return op;
}
}));

break;
case "remove":
return cljs.core.assoc_in(cljs.core.update.cljs$core$IFn$_invoke$arity$variadic(r,block_uuid,cljs.core.assoc,new cljs.core.Keyword(null,"move","move",-2110884309),new cljs.core.Keyword(null,"retract","retract",-1549826125),new cljs.core.Keyword(null,"update","update",1045576396),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"retract","retract",-1549826125)], 0)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_uuid,new cljs.core.Keyword(null,"remove","remove",-131428414)], null),op);

break;
case "update-page":
return cljs.core.assoc_in(cljs.core.update.cljs$core$IFn$_invoke$arity$5(r,block_uuid,cljs.core.assoc,new cljs.core.Keyword(null,"remove-page","remove-page",-1679345876),new cljs.core.Keyword(null,"retract","retract",-1549826125)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_uuid,new cljs.core.Keyword(null,"update-page","update-page",-503479891)], null),op);

break;
case "remove-page":
return cljs.core.assoc_in(cljs.core.update.cljs$core$IFn$_invoke$arity$5(r,block_uuid,cljs.core.assoc,new cljs.core.Keyword(null,"update-page","update-page",-503479891),new cljs.core.Keyword(null,"retract","retract",-1549826125)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_uuid,new cljs.core.Keyword(null,"remove-page","remove-page",-1679345876)], null),op);

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__132389__$1)].join('')));

}
}),init_block_uuid__GT_op_type__GT_op,sorted_ops);
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__132394){
var vec__132395 = p__132394;
var block_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132395,(0),null);
var op_type__GT_op = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132395,(1),null);
var tmpid = cljs.core.str.cljs$core$IFn$_invoke$arity$1(block_uuid);
var temp__5804__auto__ = cljs.core.not_empty(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__132401){
var vec__132405 = p__132401;
var op_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132405,(0),null);
var op = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132405,(1),null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"retract","retract",-1549826125),op)){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db.fn","retractAttribute","db.fn/retractAttribute",937402164),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null),op_type], null);
} else {
if((!((op == null)))){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),tmpid,op_type,op], null);
} else {
return null;
}
}
}),op_type__GT_op));
if(cljs.core.truth_(temp__5804__auto__)){
var tx_data = temp__5804__auto__;
return cljs.core.cons(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),tmpid,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null),tx_data);
} else {
return null;
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([block_uuid__GT_op_type__GT_op], 0));
});
frontend.worker.rtc.client_op.generate_ident_kv_ops_tx_data = (function frontend$worker$rtc$client_op$generate_ident_kv_ops_tx_data(client_ops_db,ops){
var sorted_ops = cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(cljs.core.second,ops);
var db_idents = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__132421){
var vec__132426 = p__132421;
var _op_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132426,(0),null);
var _t = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132426,(1),null);
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132426,(2),null);
return new cljs.core.Keyword(null,"db-ident","db-ident",-992686073).cljs$core$IFn$_invoke$arity$1(value);
}),sorted_ops);
var ents = (function (){var G__132436 = client_ops_db;
var G__132437 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null);
var G__132438 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (db_ident){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"db-ident","db-ident",-992686073),db_ident], null);
}),db_idents);
return (datascript.core.pull_many.cljs$core$IFn$_invoke$arity$3 ? datascript.core.pull_many.cljs$core$IFn$_invoke$arity$3(G__132436,G__132437,G__132438) : datascript.core.pull_many.call(null,G__132436,G__132437,G__132438));
})();
var op_types = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"update-kv-value","update-kv-value",-1091588796)], null);
var init_db_ident__GT_op_type__GT_op = cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$1((function (ent){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"db-ident","db-ident",-992686073).cljs$core$IFn$_invoke$arity$1(ent),cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$1((function (op_type){
var temp__5804__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(ent,op_type);
if(cljs.core.truth_(temp__5804__auto__)){
var op = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [op_type,op], null);
} else {
return null;
}
})),op_types)], null);
})),ents);
var db_ident__GT_op_type__GT_op = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (r,op){
var vec__132452 = op;
var op_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132452,(0),null);
var _t = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132452,(1),null);
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132452,(2),null);
var db_ident = new cljs.core.Keyword(null,"db-ident","db-ident",-992686073).cljs$core$IFn$_invoke$arity$1(value);
var G__132457 = op_type;
var G__132457__$1 = (((G__132457 instanceof cljs.core.Keyword))?G__132457.fqn:null);
switch (G__132457__$1) {
case "update-kv-value":
return cljs.core.assoc_in(r,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [db_ident,new cljs.core.Keyword(null,"update-kv-value","update-kv-value",-1091588796)], null),op);

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__132457__$1)].join('')));

}
}),init_db_ident__GT_op_type__GT_op,sorted_ops);
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__132458){
var vec__132459 = p__132458;
var db_ident = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132459,(0),null);
var op_type__GT_op = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132459,(1),null);
var tmpid = cljs.core.str.cljs$core$IFn$_invoke$arity$1(db_ident);
var temp__5804__auto__ = cljs.core.not_empty(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__132462){
var vec__132463 = p__132462;
var op_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132463,(0),null);
var op = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132463,(1),null);
if(cljs.core.truth_(op)){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),tmpid,op_type,op], null);
} else {
return null;
}
}),op_type__GT_op));
if(cljs.core.truth_(temp__5804__auto__)){
var tx_data = temp__5804__auto__;
return cljs.core.cons(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),tmpid,new cljs.core.Keyword(null,"db-ident","db-ident",-992686073),db_ident], null),tx_data);
} else {
return null;
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([db_ident__GT_op_type__GT_op], 0));
});
/**
 * Return [db-ident-kv-ops block-ops]
 */
frontend.worker.rtc.client_op.partition_ops = (function frontend$worker$rtc$client_op$partition_ops(ops){
return cljs.core.juxt.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"db-ident","db-ident",-992686073),new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638))(cljs.core.group_by((function (p__132470){
var vec__132471 = p__132470;
var _op_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132471,(0),null);
var _t = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132471,(1),null);
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132471,(2),null);
var op = vec__132471;
if(cljs.core.truth_(new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638).cljs$core$IFn$_invoke$arity$1(value))){
return new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638);
} else {
if(cljs.core.truth_(new cljs.core.Keyword(null,"db-ident","db-ident",-992686073).cljs$core$IFn$_invoke$arity$1(value))){
return new cljs.core.Keyword(null,"db-ident","db-ident",-992686073);
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("invalid op",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"op","op",-1882987955),op], null));

}
}
}),ops));
});
frontend.worker.rtc.client_op.add_ops_BANG_ = (function frontend$worker$rtc$client_op$add_ops_BANG_(repo,ops){
if(cljs.core.seq(ops)){
var conn = frontend.worker.state.get_client_ops_conn(repo);
var ops__$1 = (frontend.worker.rtc.client_op.ops_coercer.cljs$core$IFn$_invoke$arity$1 ? frontend.worker.rtc.client_op.ops_coercer.cljs$core$IFn$_invoke$arity$1(ops) : frontend.worker.rtc.client_op.ops_coercer.call(null,ops));
var _ = (((!((conn == null))))?null:(function(){throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(repo),"\n","(some? conn)"].join('')))})());
var vec__132475 = frontend.worker.rtc.client_op.partition_ops(ops__$1);
var db_ident_kv_ops = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132475,(0),null);
var block_ops = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132475,(1),null);
var tx_data1 = ((cljs.core.seq(block_ops))?frontend.worker.rtc.client_op.generate_block_ops_tx_data(cljs.core.deref(conn),block_ops):null);
var tx_data2 = ((cljs.core.seq(db_ident_kv_ops))?frontend.worker.rtc.client_op.generate_ident_kv_ops_tx_data(cljs.core.deref(conn),db_ident_kv_ops):null);
var temp__5804__auto__ = cljs.core.not_empty(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(tx_data1,tx_data2));
if(cljs.core.truth_(temp__5804__auto__)){
var tx_data = temp__5804__auto__;
return (datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2(conn,tx_data) : datascript.core.transact_BANG_.call(null,conn,tx_data));
} else {
return null;
}
} else {
return null;
}
});
/**
 * Return e->op-map
 */
frontend.worker.rtc.client_op.get_all_block_ops_STAR_ = (function frontend$worker$rtc$client_op$get_all_block_ops_STAR_(db){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__132486){
var vec__132487 = p__132486;
var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132487,(0),null);
var datoms = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132487,(1),null);
var op_map = cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$1((function (datom){
var a = new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(datom);
if(((cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),a)) || (cljs.core.contains_QMARK_(frontend.worker.rtc.client_op.block_op_types,a)))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [a,new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(datom)], null);
} else {
return null;
}
})),datoms);
if(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(op_map);
if(cljs.core.truth_(and__5000__auto__)){
return (cljs.core.count(op_map) > (1));
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [e,op_map], null);
} else {
return null;
}
}),cljs.core.group_by(new cljs.core.Keyword(null,"e","e",1381269198),datascript.core.datoms.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073)))));
});
/**
 * Return e->op-map
 */
frontend.worker.rtc.client_op.get_all_db_ident_kv_ops_STAR_ = (function frontend$worker$rtc$client_op$get_all_db_ident_kv_ops_STAR_(db){
var db_ident_datoms = datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword(null,"db-ident","db-ident",-992686073));
var es = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"e","e",1381269198),db_ident_datoms);
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__132507){
var vec__132512 = p__132507;
var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132512,(0),null);
var datoms = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132512,(1),null);
var op_map = cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$1((function (datom){
var a = new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(datom);
if(((cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword(null,"db-ident","db-ident",-992686073),a)) || (cljs.core.contains_QMARK_(frontend.worker.rtc.client_op.db_ident_kv_op_types,a)))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [a,new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(datom)], null);
} else {
return null;
}
})),datoms);
if(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword(null,"db-ident","db-ident",-992686073).cljs$core$IFn$_invoke$arity$1(op_map);
if(cljs.core.truth_(and__5000__auto__)){
return (cljs.core.count(op_map) > (1));
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [e,op_map], null);
} else {
return null;
}
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (e){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [e,datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073),e)], null);
}),es)));
});
frontend.worker.rtc.client_op.get_AMPERSAND_remove_all_block_ops_STAR_ = (function frontend$worker$rtc$client_op$get_AMPERSAND_remove_all_block_ops_STAR_(conn){
var e__GT_op_map = frontend.worker.rtc.client_op.get_all_block_ops_STAR_(cljs.core.deref(conn));
var retract_all_tx_data = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (e){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (a){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db.fn","retractAttribute","db.fn/retractAttribute",937402164),e,a], null);
}),frontend.worker.rtc.client_op.block_op_types);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.keys(e__GT_op_map)], 0));
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2(conn,retract_all_tx_data) : datascript.core.transact_BANG_.call(null,conn,retract_all_tx_data));

return cljs.core.vals(e__GT_op_map);
});
frontend.worker.rtc.client_op.get_AMPERSAND_remove_all_db_ident_kv_ops_STAR_ = (function frontend$worker$rtc$client_op$get_AMPERSAND_remove_all_db_ident_kv_ops_STAR_(conn){
var e__GT_op_map = frontend.worker.rtc.client_op.get_all_db_ident_kv_ops_STAR_(cljs.core.deref(conn));
var retract_all_tx_data = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (e){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (a){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db.fn","retractAttribute","db.fn/retractAttribute",937402164),e,a], null);
}),frontend.worker.rtc.client_op.db_ident_kv_op_types);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.keys(e__GT_op_map)], 0));
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2(conn,retract_all_tx_data) : datascript.core.transact_BANG_.call(null,conn,retract_all_tx_data));

return cljs.core.vals(e__GT_op_map);
});
frontend.worker.rtc.client_op.get_all_block_ops = (function frontend$worker$rtc$client_op$get_all_block_ops(repo){
var temp__5804__auto__ = frontend.worker.state.get_client_ops_conn(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var conn = temp__5804__auto__;
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (m){
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__132564){
var vec__132565 = p__132564;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132565,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132565,(1),null);
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),k)){
return v;
} else {
return null;
}
}),m);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.vals(frontend.worker.rtc.client_op.get_all_block_ops_STAR_(cljs.core.deref(conn)))], 0));
} else {
return null;
}
});
/**
 * Return coll of
 *   {:block/uuid ...
 * :update ...
 * :move ...
 * ...}
 */
frontend.worker.rtc.client_op.get_AMPERSAND_remove_all_block_ops = (function frontend$worker$rtc$client_op$get_AMPERSAND_remove_all_block_ops(repo){
var temp__5804__auto__ = frontend.worker.state.get_client_ops_conn(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var conn = temp__5804__auto__;
return frontend.worker.rtc.client_op.get_AMPERSAND_remove_all_block_ops_STAR_(conn);
} else {
return null;
}
});
frontend.worker.rtc.client_op.get_AMPERSAND_remove_all_db_ident_kv_ops = (function frontend$worker$rtc$client_op$get_AMPERSAND_remove_all_db_ident_kv_ops(repo){
var temp__5804__auto__ = frontend.worker.state.get_client_ops_conn(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var conn = temp__5804__auto__;
return frontend.worker.rtc.client_op.get_AMPERSAND_remove_all_db_ident_kv_ops_STAR_(conn);
} else {
return null;
}
});
frontend.worker.rtc.client_op.get_unpushed_block_ops_count = (function frontend$worker$rtc$client_op$get_unpushed_block_ops_count(repo){
var temp__5804__auto__ = frontend.worker.state.get_client_ops_conn(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var conn = temp__5804__auto__;
return cljs.core.count(frontend.worker.rtc.client_op.get_all_block_ops_STAR_(cljs.core.deref(conn)));
} else {
return null;
}
});
/**
 * Is db-graph & RTC enabled
 */
frontend.worker.rtc.client_op.rtc_db_graph_QMARK_ = (function frontend$worker$rtc$client_op$rtc_db_graph_QMARK_(repo){
var and__5000__auto__ = logseq.db.sqlite.util.db_based_graph_QMARK_(repo);
if(cljs.core.truth_(and__5000__auto__)){
return (((typeof process !== 'undefined')) || ((!((frontend.worker.rtc.client_op.get_local_tx(repo) == null)))));
} else {
return and__5000__auto__;
}
});
frontend.worker.rtc.client_op.create_pending_block_ops_count_flow = (function frontend$worker$rtc$client_op$create_pending_block_ops_count_flow(repo){
var temp__5804__auto__ = frontend.worker.state.get_client_ops_conn(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var conn = temp__5804__auto__;
var datom_count = (function frontend$worker$rtc$client_op$create_pending_block_ops_count_flow_$_datom_count(db){
return cljs.core.count(frontend.worker.rtc.client_op.get_all_block_ops_STAR_(db));
});
var db_updated_flow = missionary.core.observe((function frontend$worker$rtc$client_op$create_pending_block_ops_count_flow_$_ctor(emit_BANG_){
var G__132581_132893 = conn;
var G__132582_132894 = new cljs.core.Keyword(null,"create-pending-ops-count-flow","create-pending-ops-count-flow",2058996320);
var G__132583_132895 = (function (){
return (emit_BANG_.cljs$core$IFn$_invoke$arity$1 ? emit_BANG_.cljs$core$IFn$_invoke$arity$1(true) : emit_BANG_.call(null,true));
});
(datascript.core.listen_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.listen_BANG_.cljs$core$IFn$_invoke$arity$3(G__132581_132893,G__132582_132894,G__132583_132895) : datascript.core.listen_BANG_.call(null,G__132581_132893,G__132582_132894,G__132583_132895));

(emit_BANG_.cljs$core$IFn$_invoke$arity$1 ? emit_BANG_.cljs$core$IFn$_invoke$arity$1(true) : emit_BANG_.call(null,true));

return (function frontend$worker$rtc$client_op$create_pending_block_ops_count_flow_$_ctor_$_dtor(){
return (datascript.core.unlisten_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.unlisten_BANG_.cljs$core$IFn$_invoke$arity$2(conn,new cljs.core.Keyword(null,"create-pending-ops-count-flow","create-pending-ops-count-flow",2058996320)) : datascript.core.unlisten_BANG_.call(null,conn,new cljs.core.Keyword(null,"create-pending-ops-count-flow","create-pending-ops-count-flow",2058996320)));
});
}));
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr132584_block_0 = (function frontend$worker$rtc$client_op$create_pending_block_ops_count_flow_$_cr132584_block_0(cr132584_state){
try{var cr132584_place_0 = (1);
var cr132584_place_1 = frontend.common.missionary.throttle;
var cr132584_place_2 = (100);
var cr132584_place_3 = db_updated_flow;
var cr132584_place_4 = (function (){var G__132604 = cr132584_place_2;
var G__132605 = cr132584_place_3;
var fexpr__132603 = cr132584_place_1;
return (fexpr__132603.cljs$core$IFn$_invoke$arity$2 ? fexpr__132603.cljs$core$IFn$_invoke$arity$2(G__132604,G__132605) : fexpr__132603.call(null,G__132604,G__132605));
})();
(cr132584_state[(0)] = cr132584_block_1);

return missionary.core.fork(cr132584_place_0,cr132584_place_4);
}catch (e132600){var cr132584_exception = e132600;
(cr132584_state[(0)] = null);

throw cr132584_exception;
}});
var cr132584_block_1 = (function frontend$worker$rtc$client_op$create_pending_block_ops_count_flow_$_cr132584_block_1(cr132584_state){
try{var cr132584_place_5 = missionary.core.unpark();
var cr132584_place_6 = datom_count;
var cr132584_place_7 = cljs.core.deref;
var cr132584_place_8 = conn;
var cr132584_place_9 = (function (){var G__132617 = cr132584_place_8;
var fexpr__132616 = cr132584_place_7;
return (fexpr__132616.cljs$core$IFn$_invoke$arity$1 ? fexpr__132616.cljs$core$IFn$_invoke$arity$1(G__132617) : fexpr__132616.call(null,G__132617));
})();
var cr132584_place_10 = cr132584_place_6(cr132584_place_9);
(cr132584_state[(0)] = null);

return cr132584_place_10;
}catch (e132611){var cr132584_exception = e132611;
(cr132584_state[(0)] = null);

throw cr132584_exception;
}});
return cloroutine.impl.coroutine((function (){var G__132621 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((1));
(G__132621[(0)] = cr132584_block_0);

return G__132621;
})());
})(),missionary.core.ap_run);
} else {
return null;
}
});
frontend.worker.rtc.client_op.add_asset_ops = (function frontend$worker$rtc$client_op$add_asset_ops(repo,asset_ops){
var conn = frontend.worker.state.get_client_ops_conn(repo);
var ops = (frontend.worker.rtc.client_op.ops_coercer.cljs$core$IFn$_invoke$arity$1 ? frontend.worker.rtc.client_op.ops_coercer.cljs$core$IFn$_invoke$arity$1(asset_ops) : frontend.worker.rtc.client_op.ops_coercer.call(null,asset_ops));
if((!((conn == null)))){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(repo),"\n","(some? conn)"].join('')));
}

var already_removed_QMARK_ = (function frontend$worker$rtc$client_op$add_asset_ops_$_already_removed_QMARK_(remove_op,t){
var G__132634 = remove_op;
var G__132634__$1 = (((G__132634 == null))?null:cljs.core.second(G__132634));
if((G__132634__$1 == null)){
return null;
} else {
return (G__132634__$1 > t);
}
});
var update_after_remove_QMARK_ = (function frontend$worker$rtc$client_op$add_asset_ops_$_update_after_remove_QMARK_(update_op,t){
var G__132638 = update_op;
var G__132638__$1 = (((G__132638 == null))?null:cljs.core.second(G__132638));
if((G__132638__$1 == null)){
return null;
} else {
return (G__132638__$1 > t);
}
});
var seq__132640 = cljs.core.seq(ops);
var chunk__132641 = null;
var count__132642 = (0);
var i__132643 = (0);
while(true){
if((i__132643 < count__132642)){
var op = chunk__132641.cljs$core$IIndexed$_nth$arity$2(null,i__132643);
var vec__132698_132897 = op;
var op_type_132898 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132698_132897,(0),null);
var t_132899 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132698_132897,(1),null);
var value_132900 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132698_132897,(2),null);
var map__132701_132901 = value_132900;
var map__132701_132902__$1 = cljs.core.__destructure_map(map__132701_132901);
var block_uuid_132903 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__132701_132902__$1,new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638));
var exist_block_ops_entity_132904 = (function (){var G__132702 = cljs.core.deref(conn);
var G__132703 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid_132903], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__132702,G__132703) : datascript.core.entity.call(null,G__132702,G__132703));
})();
var e_132905 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(exist_block_ops_entity_132904);
var temp__5804__auto___132906 = cljs.core.not_empty((function (){var G__132706 = op_type_132898;
var G__132706__$1 = (((G__132706 instanceof cljs.core.Keyword))?G__132706.fqn:null);
switch (G__132706__$1) {
case "update-asset":
var remove_asset_op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(exist_block_ops_entity_132904,new cljs.core.Keyword(null,"remove-asset","remove-asset",-1739744854));
if(cljs.core.truth_(already_removed_QMARK_(remove_asset_op,t_132899))){
return null;
} else {
var G__132713 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid_132903,new cljs.core.Keyword(null,"update-asset","update-asset",501550582),op], null)], null);
if(cljs.core.truth_(remove_asset_op)){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__132713,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db.fn","retractAttribute","db.fn/retractAttribute",937402164),e_132905,new cljs.core.Keyword(null,"remove-asset","remove-asset",-1739744854)], null));
} else {
return G__132713;
}
}

break;
case "remove-asset":
var update_asset_op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(exist_block_ops_entity_132904,new cljs.core.Keyword(null,"update-asset","update-asset",501550582));
if(cljs.core.truth_(update_after_remove_QMARK_(update_asset_op,t_132899))){
return null;
} else {
var G__132718 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid_132903,new cljs.core.Keyword(null,"remove-asset","remove-asset",-1739744854),op], null)], null);
if(cljs.core.truth_(update_asset_op)){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__132718,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db.fn","retractAttribute","db.fn/retractAttribute",937402164),e_132905,new cljs.core.Keyword(null,"update-asset","update-asset",501550582)], null));
} else {
return G__132718;
}
}

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__132706__$1)].join('')));

}
})());
if(cljs.core.truth_(temp__5804__auto___132906)){
var tx_data_132909 = temp__5804__auto___132906;
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2(conn,tx_data_132909) : datascript.core.transact_BANG_.call(null,conn,tx_data_132909));
} else {
}


var G__132910 = seq__132640;
var G__132911 = chunk__132641;
var G__132912 = count__132642;
var G__132913 = (i__132643 + (1));
seq__132640 = G__132910;
chunk__132641 = G__132911;
count__132642 = G__132912;
i__132643 = G__132913;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__132640);
if(temp__5804__auto__){
var seq__132640__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__132640__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__132640__$1);
var G__132916 = cljs.core.chunk_rest(seq__132640__$1);
var G__132917 = c__5525__auto__;
var G__132918 = cljs.core.count(c__5525__auto__);
var G__132919 = (0);
seq__132640 = G__132916;
chunk__132641 = G__132917;
count__132642 = G__132918;
i__132643 = G__132919;
continue;
} else {
var op = cljs.core.first(seq__132640__$1);
var vec__132722_132921 = op;
var op_type_132922 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132722_132921,(0),null);
var t_132923 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132722_132921,(1),null);
var value_132924 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132722_132921,(2),null);
var map__132725_132925 = value_132924;
var map__132725_132926__$1 = cljs.core.__destructure_map(map__132725_132925);
var block_uuid_132927 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__132725_132926__$1,new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638));
var exist_block_ops_entity_132928 = (function (){var G__132728 = cljs.core.deref(conn);
var G__132729 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid_132927], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__132728,G__132729) : datascript.core.entity.call(null,G__132728,G__132729));
})();
var e_132929 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(exist_block_ops_entity_132928);
var temp__5804__auto___132935__$1 = cljs.core.not_empty((function (){var G__132737 = op_type_132922;
var G__132737__$1 = (((G__132737 instanceof cljs.core.Keyword))?G__132737.fqn:null);
switch (G__132737__$1) {
case "update-asset":
var remove_asset_op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(exist_block_ops_entity_132928,new cljs.core.Keyword(null,"remove-asset","remove-asset",-1739744854));
if(cljs.core.truth_(already_removed_QMARK_(remove_asset_op,t_132923))){
return null;
} else {
var G__132740 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid_132927,new cljs.core.Keyword(null,"update-asset","update-asset",501550582),op], null)], null);
if(cljs.core.truth_(remove_asset_op)){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__132740,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db.fn","retractAttribute","db.fn/retractAttribute",937402164),e_132929,new cljs.core.Keyword(null,"remove-asset","remove-asset",-1739744854)], null));
} else {
return G__132740;
}
}

break;
case "remove-asset":
var update_asset_op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(exist_block_ops_entity_132928,new cljs.core.Keyword(null,"update-asset","update-asset",501550582));
if(cljs.core.truth_(update_after_remove_QMARK_(update_asset_op,t_132923))){
return null;
} else {
var G__132742 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid_132927,new cljs.core.Keyword(null,"remove-asset","remove-asset",-1739744854),op], null)], null);
if(cljs.core.truth_(update_asset_op)){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__132742,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db.fn","retractAttribute","db.fn/retractAttribute",937402164),e_132929,new cljs.core.Keyword(null,"update-asset","update-asset",501550582)], null));
} else {
return G__132742;
}
}

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__132737__$1)].join('')));

}
})());
if(cljs.core.truth_(temp__5804__auto___132935__$1)){
var tx_data_132949 = temp__5804__auto___132935__$1;
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2(conn,tx_data_132949) : datascript.core.transact_BANG_.call(null,conn,tx_data_132949));
} else {
}


var G__132950 = cljs.core.next(seq__132640__$1);
var G__132951 = null;
var G__132952 = (0);
var G__132953 = (0);
seq__132640 = G__132950;
chunk__132641 = G__132951;
count__132642 = G__132952;
i__132643 = G__132953;
continue;
}
} else {
return null;
}
}
break;
}
});
frontend.worker.rtc.client_op.add_all_exists_asset_as_ops = (function frontend$worker$rtc$client_op$add_all_exists_asset_as_ops(repo){
var conn = frontend.worker.state.get_datascript_conn(repo);
var _ = (((!((conn == null))))?null:(function(){throw (new Error("Assert failed: (some? conn)"))})());
var asset_block_uuids = (function (){var G__132748 = new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?block-uuid","?block-uuid",1931397442,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Symbol(null,"?block-uuid","?block-uuid",1931397442,null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("logseq.property.asset","type","logseq.property.asset/type",-1142083098)], null)], null);
var G__132749 = cljs.core.deref(conn);
return (datascript.core.q.cljs$core$IFn$_invoke$arity$2 ? datascript.core.q.cljs$core$IFn$_invoke$arity$2(G__132748,G__132749) : datascript.core.q.call(null,G__132748,G__132749));
})();
var ops = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block_uuid){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"update-asset","update-asset",501550582),(1),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),block_uuid], null)], null);
}),asset_block_uuids);
return frontend.worker.rtc.client_op.add_asset_ops(repo,ops);
});
frontend.worker.rtc.client_op.get_all_asset_ops_STAR_ = (function frontend$worker$rtc$client_op$get_all_asset_ops_STAR_(db){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__132758){
var vec__132759 = p__132758;
var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132759,(0),null);
var datoms = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__132759,(1),null);
var op_map = cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$1((function (datom){
var a = new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(datom);
if(((cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),a)) || (cljs.core.contains_QMARK_(frontend.worker.rtc.client_op.asset_op_types,a)))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [a,new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(datom)], null);
} else {
return null;
}
})),datoms);
if(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(op_map);
if(cljs.core.truth_(and__5000__auto__)){
return (cljs.core.count(op_map) > (1));
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [e,op_map], null);
} else {
return null;
}
}),cljs.core.group_by(new cljs.core.Keyword(null,"e","e",1381269198),datascript.core.datoms.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073)))));
});
frontend.worker.rtc.client_op.get_unpushed_asset_ops_count = (function frontend$worker$rtc$client_op$get_unpushed_asset_ops_count(repo){
var temp__5804__auto__ = frontend.worker.state.get_client_ops_conn(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var conn = temp__5804__auto__;
return cljs.core.count(frontend.worker.rtc.client_op.get_all_asset_ops_STAR_(cljs.core.deref(conn)));
} else {
return null;
}
});
frontend.worker.rtc.client_op.get_all_asset_ops = (function frontend$worker$rtc$client_op$get_all_asset_ops(repo){
var temp__5804__auto__ = frontend.worker.state.get_client_ops_conn(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var conn = temp__5804__auto__;
return cljs.core.vals(frontend.worker.rtc.client_op.get_all_asset_ops_STAR_(cljs.core.deref(conn)));
} else {
return null;
}
});
frontend.worker.rtc.client_op.remove_asset_op = (function frontend$worker$rtc$client_op$remove_asset_op(repo,asset_uuid){
var temp__5804__auto__ = frontend.worker.state.get_client_ops_conn(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var conn = temp__5804__auto__;
var ent = (function (){var G__132776 = cljs.core.deref(conn);
var G__132777 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),asset_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__132776,G__132777) : datascript.core.entity.call(null,G__132776,G__132777));
})();
var temp__5804__auto____$1 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(ent);
if(cljs.core.truth_(temp__5804__auto____$1)){
var e = temp__5804__auto____$1;
var G__132780 = conn;
var G__132781 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (a){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db.fn","retractAttribute","db.fn/retractAttribute",937402164),e,a], null);
}),frontend.worker.rtc.client_op.asset_op_types);
return (datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2(G__132780,G__132781) : datascript.core.transact_BANG_.call(null,G__132780,G__132781));
} else {
return null;
}
} else {
return null;
}
});
frontend.worker.rtc.client_op.reset_client_op_conn = (function frontend$worker$rtc$client_op$reset_client_op_conn(repo){
var temp__5804__auto__ = frontend.worker.state.get_client_ops_conn(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var conn = temp__5804__auto__;
var tx_data = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (datom){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(datom)], null);
}),cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(conn),new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522)),datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(conn),new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword(null,"local-tx","local-tx",1729212201)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(conn),new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword(null,"aes-key-jwk","aes-key-jwk",967413902)),datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(conn),new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552))], 0)));
return (datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2(conn,tx_data) : datascript.core.transact_BANG_.call(null,conn,tx_data));
} else {
return null;
}
});

//# sourceMappingURL=frontend.worker.rtc.client_op.js.map
