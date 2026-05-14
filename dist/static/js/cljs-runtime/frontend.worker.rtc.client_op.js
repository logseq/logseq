goog.provide('frontend.worker.rtc.client_op');
frontend.worker.rtc.client_op.op_schema = new cljs.core.PersistentVector(null, 10, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"multi","multi",-190293005),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"dispatch","dispatch",1319337009),cljs.core.first], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"update-kv-value","update-kv-value",-1091588796),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"t","t",-1397832519),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"db-ident","db-ident",-992686073),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword(null,"any","any",1705907423)], null)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"move","move",-2110884309),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"t","t",-1397832519),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),new cljs.core.Keyword(null,"uuid","uuid",-2145095719)], null)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"remove","remove",-131428414),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"t","t",-1397832519),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),new cljs.core.Keyword(null,"uuid","uuid",-2145095719)], null)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"update-page","update-page",-503479891),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"t","t",-1397832519),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),new cljs.core.Keyword(null,"uuid","uuid",-2145095719)], null)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"remove-page","remove-page",-1679345876),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"t","t",-1397832519),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),new cljs.core.Keyword(null,"uuid","uuid",-2145095719)], null)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"update","update",1045576396),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"t","t",-1397832519),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),new cljs.core.Keyword(null,"uuid","uuid",-2145095719)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"av-coll","av-coll",1589194401),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"sequential","sequential",-1082983960),frontend.worker.rtc.malli_schema.av_schema], null)], null)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"update-asset","update-asset",501550582),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"t","t",-1397832519),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),new cljs.core.Keyword(null,"uuid","uuid",-2145095719)], null)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"remove-asset","remove-asset",-1739744854),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"catn","catn",-48807277),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"t","t",-1397832519),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),new cljs.core.Keyword(null,"uuid","uuid",-2145095719)], null)], null)], null)], null)], null)], null);
frontend.worker.rtc.client_op.ops_schema = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"sequential","sequential",-1082983960),frontend.worker.rtc.client_op.op_schema], null);
frontend.worker.rtc.client_op.ops_coercer = malli.core.coercer.cljs$core$IFn$_invoke$arity$4(frontend.worker.rtc.client_op.ops_schema,malli.transform.json_transformer,null,(function (p1__138420_SHARP_){
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.worker.rtc.client-op",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("frontend.worker.rtc.client-op","bad-ops","frontend.worker.rtc.client-op/bad-ops",1077235405),new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(p1__138420_SHARP_),new cljs.core.Keyword(null,"line","line",212345235),70], null)),null);

return malli.core._fail_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("frontend.worker.rtc.client-op","ops-schema","frontend.worker.rtc.client-op/ops-schema",-238684562),cljs.core.select_keys(p1__138420_SHARP_,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"value","value",305978217)], null)));
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

var G__138427 = conn;
var G__138428 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),"e",new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522),graph_uuid], null)], null);
return (datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2(G__138427,G__138428) : datascript.core.transact_BANG_.call(null,G__138427,G__138428));
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
var G__138438 = conn;
var G__138439 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [tx_data], null);
return (datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2(G__138438,G__138439) : datascript.core.transact_BANG_.call(null,G__138438,G__138439));
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
var G__138446 = conn;
var G__138447 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(datom),new cljs.core.Keyword(null,"local-tx","local-tx",1729212201)], null)], null);
return (datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2(G__138446,G__138447) : datascript.core.transact_BANG_.call(null,G__138446,G__138447));
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
var map__138452 = cljs.core.last(update_op1);
var map__138452__$1 = cljs.core.__destructure_map(map__138452);
var av_coll1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138452__$1,new cljs.core.Keyword(null,"av-coll","av-coll",1589194401));
var block_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138452__$1,new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638));
var map__138453 = cljs.core.last(update_op2);
var map__138453__$1 = cljs.core.__destructure_map(map__138453);
var av_coll2 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138453__$1,new cljs.core.Keyword(null,"av-coll","av-coll",1589194401));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"update","update",1045576396),t2,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),block_uuid,new cljs.core.Keyword(null,"av-coll","av-coll",1589194401),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(av_coll1,av_coll2)], null)], null);
}
});
frontend.worker.rtc.client_op.generate_block_ops_tx_data = (function frontend$worker$rtc$client_op$generate_block_ops_tx_data(client_ops_db,ops){
var sorted_ops = cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(cljs.core.second,ops);
var block_uuids = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__138456){
var vec__138457 = p__138456;
var _op_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138457,(0),null);
var _t = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138457,(1),null);
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138457,(2),null);
return new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638).cljs$core$IFn$_invoke$arity$1(value);
}),sorted_ops);
var ents = (function (){var G__138460 = client_ops_db;
var G__138461 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null);
var G__138462 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block_uuid){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
}),block_uuids);
return (datascript.core.pull_many.cljs$core$IFn$_invoke$arity$3 ? datascript.core.pull_many.cljs$core$IFn$_invoke$arity$3(G__138460,G__138461,G__138462) : datascript.core.pull_many.call(null,G__138460,G__138461,G__138462));
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
var vec__138464 = op;
var op_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138464,(0),null);
var _t = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138464,(1),null);
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138464,(2),null);
var block_uuid = new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638).cljs$core$IFn$_invoke$arity$1(value);
var G__138467 = op_type;
var G__138467__$1 = (((G__138467 instanceof cljs.core.Keyword))?G__138467.fqn:null);
switch (G__138467__$1) {
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
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__138467__$1)].join('')));

}
}),init_block_uuid__GT_op_type__GT_op,sorted_ops);
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__138469){
var vec__138470 = p__138469;
var block_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138470,(0),null);
var op_type__GT_op = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138470,(1),null);
var tmpid = cljs.core.str.cljs$core$IFn$_invoke$arity$1(block_uuid);
var temp__5804__auto__ = cljs.core.not_empty(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__138473){
var vec__138475 = p__138473;
var op_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138475,(0),null);
var op = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138475,(1),null);
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
var db_idents = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__138483){
var vec__138484 = p__138483;
var _op_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138484,(0),null);
var _t = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138484,(1),null);
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138484,(2),null);
return new cljs.core.Keyword(null,"db-ident","db-ident",-992686073).cljs$core$IFn$_invoke$arity$1(value);
}),sorted_ops);
var ents = (function (){var G__138487 = client_ops_db;
var G__138488 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null);
var G__138489 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (db_ident){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"db-ident","db-ident",-992686073),db_ident], null);
}),db_idents);
return (datascript.core.pull_many.cljs$core$IFn$_invoke$arity$3 ? datascript.core.pull_many.cljs$core$IFn$_invoke$arity$3(G__138487,G__138488,G__138489) : datascript.core.pull_many.call(null,G__138487,G__138488,G__138489));
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
var vec__138492 = op;
var op_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138492,(0),null);
var _t = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138492,(1),null);
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138492,(2),null);
var db_ident = new cljs.core.Keyword(null,"db-ident","db-ident",-992686073).cljs$core$IFn$_invoke$arity$1(value);
var G__138495 = op_type;
var G__138495__$1 = (((G__138495 instanceof cljs.core.Keyword))?G__138495.fqn:null);
switch (G__138495__$1) {
case "update-kv-value":
return cljs.core.assoc_in(r,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [db_ident,new cljs.core.Keyword(null,"update-kv-value","update-kv-value",-1091588796)], null),op);

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__138495__$1)].join('')));

}
}),init_db_ident__GT_op_type__GT_op,sorted_ops);
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__138496){
var vec__138497 = p__138496;
var db_ident = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138497,(0),null);
var op_type__GT_op = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138497,(1),null);
var tmpid = cljs.core.str.cljs$core$IFn$_invoke$arity$1(db_ident);
var temp__5804__auto__ = cljs.core.not_empty(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__138502){
var vec__138503 = p__138502;
var op_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138503,(0),null);
var op = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138503,(1),null);
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
return cljs.core.juxt.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"db-ident","db-ident",-992686073),new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638))(cljs.core.group_by((function (p__138525){
var vec__138526 = p__138525;
var _op_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138526,(0),null);
var _t = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138526,(1),null);
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138526,(2),null);
var op = vec__138526;
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
var vec__138551 = frontend.worker.rtc.client_op.partition_ops(ops__$1);
var db_ident_kv_ops = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138551,(0),null);
var block_ops = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138551,(1),null);
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
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__138586){
var vec__138589 = p__138586;
var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138589,(0),null);
var datoms = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138589,(1),null);
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
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__138605){
var vec__138606 = p__138605;
var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138606,(0),null);
var datoms = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138606,(1),null);
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
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__138619){
var vec__138620 = p__138619;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138620,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138620,(1),null);
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
var G__138651_138966 = conn;
var G__138652_138967 = new cljs.core.Keyword(null,"create-pending-ops-count-flow","create-pending-ops-count-flow",2058996320);
var G__138653_138968 = (function (){
return (emit_BANG_.cljs$core$IFn$_invoke$arity$1 ? emit_BANG_.cljs$core$IFn$_invoke$arity$1(true) : emit_BANG_.call(null,true));
});
(datascript.core.listen_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.listen_BANG_.cljs$core$IFn$_invoke$arity$3(G__138651_138966,G__138652_138967,G__138653_138968) : datascript.core.listen_BANG_.call(null,G__138651_138966,G__138652_138967,G__138653_138968));

(emit_BANG_.cljs$core$IFn$_invoke$arity$1 ? emit_BANG_.cljs$core$IFn$_invoke$arity$1(true) : emit_BANG_.call(null,true));

return (function frontend$worker$rtc$client_op$create_pending_block_ops_count_flow_$_ctor_$_dtor(){
return (datascript.core.unlisten_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.unlisten_BANG_.cljs$core$IFn$_invoke$arity$2(conn,new cljs.core.Keyword(null,"create-pending-ops-count-flow","create-pending-ops-count-flow",2058996320)) : datascript.core.unlisten_BANG_.call(null,conn,new cljs.core.Keyword(null,"create-pending-ops-count-flow","create-pending-ops-count-flow",2058996320)));
});
}));
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr138654_block_0 = (function frontend$worker$rtc$client_op$create_pending_block_ops_count_flow_$_cr138654_block_0(cr138654_state){
try{var cr138654_place_0 = (1);
var cr138654_place_1 = frontend.common.missionary.throttle;
var cr138654_place_2 = (100);
var cr138654_place_3 = db_updated_flow;
var cr138654_place_4 = (function (){var G__138679 = cr138654_place_2;
var G__138680 = cr138654_place_3;
var fexpr__138678 = cr138654_place_1;
return (fexpr__138678.cljs$core$IFn$_invoke$arity$2 ? fexpr__138678.cljs$core$IFn$_invoke$arity$2(G__138679,G__138680) : fexpr__138678.call(null,G__138679,G__138680));
})();
(cr138654_state[(0)] = cr138654_block_1);

return missionary.core.fork(cr138654_place_0,cr138654_place_4);
}catch (e138674){var cr138654_exception = e138674;
(cr138654_state[(0)] = null);

throw cr138654_exception;
}});
var cr138654_block_1 = (function frontend$worker$rtc$client_op$create_pending_block_ops_count_flow_$_cr138654_block_1(cr138654_state){
try{var cr138654_place_5 = missionary.core.unpark();
var cr138654_place_6 = datom_count;
var cr138654_place_7 = cljs.core.deref;
var cr138654_place_8 = conn;
var cr138654_place_9 = (function (){var G__138689 = cr138654_place_8;
var fexpr__138688 = cr138654_place_7;
return (fexpr__138688.cljs$core$IFn$_invoke$arity$1 ? fexpr__138688.cljs$core$IFn$_invoke$arity$1(G__138689) : fexpr__138688.call(null,G__138689));
})();
var cr138654_place_10 = cr138654_place_6(cr138654_place_9);
(cr138654_state[(0)] = null);

return cr138654_place_10;
}catch (e138683){var cr138654_exception = e138683;
(cr138654_state[(0)] = null);

throw cr138654_exception;
}});
return cloroutine.impl.coroutine((function (){var G__138690 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((1));
(G__138690[(0)] = cr138654_block_0);

return G__138690;
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
var G__138703 = remove_op;
var G__138703__$1 = (((G__138703 == null))?null:cljs.core.second(G__138703));
if((G__138703__$1 == null)){
return null;
} else {
return (G__138703__$1 > t);
}
});
var update_after_remove_QMARK_ = (function frontend$worker$rtc$client_op$add_asset_ops_$_update_after_remove_QMARK_(update_op,t){
var G__138714 = update_op;
var G__138714__$1 = (((G__138714 == null))?null:cljs.core.second(G__138714));
if((G__138714__$1 == null)){
return null;
} else {
return (G__138714__$1 > t);
}
});
var seq__138718 = cljs.core.seq(ops);
var chunk__138719 = null;
var count__138720 = (0);
var i__138721 = (0);
while(true){
if((i__138721 < count__138720)){
var op = chunk__138719.cljs$core$IIndexed$_nth$arity$2(null,i__138721);
var vec__138781_139009 = op;
var op_type_139010 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138781_139009,(0),null);
var t_139011 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138781_139009,(1),null);
var value_139012 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138781_139009,(2),null);
var map__138784_139013 = value_139012;
var map__138784_139014__$1 = cljs.core.__destructure_map(map__138784_139013);
var block_uuid_139015 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138784_139014__$1,new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638));
var exist_block_ops_entity_139016 = (function (){var G__138787 = cljs.core.deref(conn);
var G__138788 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid_139015], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__138787,G__138788) : datascript.core.entity.call(null,G__138787,G__138788));
})();
var e_139017 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(exist_block_ops_entity_139016);
var temp__5804__auto___139022 = cljs.core.not_empty((function (){var G__138790 = op_type_139010;
var G__138790__$1 = (((G__138790 instanceof cljs.core.Keyword))?G__138790.fqn:null);
switch (G__138790__$1) {
case "update-asset":
var remove_asset_op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(exist_block_ops_entity_139016,new cljs.core.Keyword(null,"remove-asset","remove-asset",-1739744854));
if(cljs.core.truth_(already_removed_QMARK_(remove_asset_op,t_139011))){
return null;
} else {
var G__138794 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid_139015,new cljs.core.Keyword(null,"update-asset","update-asset",501550582),op], null)], null);
if(cljs.core.truth_(remove_asset_op)){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__138794,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db.fn","retractAttribute","db.fn/retractAttribute",937402164),e_139017,new cljs.core.Keyword(null,"remove-asset","remove-asset",-1739744854)], null));
} else {
return G__138794;
}
}

break;
case "remove-asset":
var update_asset_op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(exist_block_ops_entity_139016,new cljs.core.Keyword(null,"update-asset","update-asset",501550582));
if(cljs.core.truth_(update_after_remove_QMARK_(update_asset_op,t_139011))){
return null;
} else {
var G__138797 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid_139015,new cljs.core.Keyword(null,"remove-asset","remove-asset",-1739744854),op], null)], null);
if(cljs.core.truth_(update_asset_op)){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__138797,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db.fn","retractAttribute","db.fn/retractAttribute",937402164),e_139017,new cljs.core.Keyword(null,"update-asset","update-asset",501550582)], null));
} else {
return G__138797;
}
}

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__138790__$1)].join('')));

}
})());
if(cljs.core.truth_(temp__5804__auto___139022)){
var tx_data_139037 = temp__5804__auto___139022;
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2(conn,tx_data_139037) : datascript.core.transact_BANG_.call(null,conn,tx_data_139037));
} else {
}


var G__139040 = seq__138718;
var G__139041 = chunk__138719;
var G__139042 = count__138720;
var G__139043 = (i__138721 + (1));
seq__138718 = G__139040;
chunk__138719 = G__139041;
count__138720 = G__139042;
i__138721 = G__139043;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__138718);
if(temp__5804__auto__){
var seq__138718__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__138718__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__138718__$1);
var G__139048 = cljs.core.chunk_rest(seq__138718__$1);
var G__139049 = c__5525__auto__;
var G__139050 = cljs.core.count(c__5525__auto__);
var G__139051 = (0);
seq__138718 = G__139048;
chunk__138719 = G__139049;
count__138720 = G__139050;
i__138721 = G__139051;
continue;
} else {
var op = cljs.core.first(seq__138718__$1);
var vec__138805_139054 = op;
var op_type_139055 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138805_139054,(0),null);
var t_139056 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138805_139054,(1),null);
var value_139057 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138805_139054,(2),null);
var map__138808_139058 = value_139057;
var map__138808_139059__$1 = cljs.core.__destructure_map(map__138808_139058);
var block_uuid_139060 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138808_139059__$1,new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638));
var exist_block_ops_entity_139061 = (function (){var G__138814 = cljs.core.deref(conn);
var G__138815 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid_139060], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__138814,G__138815) : datascript.core.entity.call(null,G__138814,G__138815));
})();
var e_139062 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(exist_block_ops_entity_139061);
var temp__5804__auto___139065__$1 = cljs.core.not_empty((function (){var G__138816 = op_type_139055;
var G__138816__$1 = (((G__138816 instanceof cljs.core.Keyword))?G__138816.fqn:null);
switch (G__138816__$1) {
case "update-asset":
var remove_asset_op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(exist_block_ops_entity_139061,new cljs.core.Keyword(null,"remove-asset","remove-asset",-1739744854));
if(cljs.core.truth_(already_removed_QMARK_(remove_asset_op,t_139056))){
return null;
} else {
var G__138818 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid_139060,new cljs.core.Keyword(null,"update-asset","update-asset",501550582),op], null)], null);
if(cljs.core.truth_(remove_asset_op)){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__138818,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db.fn","retractAttribute","db.fn/retractAttribute",937402164),e_139062,new cljs.core.Keyword(null,"remove-asset","remove-asset",-1739744854)], null));
} else {
return G__138818;
}
}

break;
case "remove-asset":
var update_asset_op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(exist_block_ops_entity_139061,new cljs.core.Keyword(null,"update-asset","update-asset",501550582));
if(cljs.core.truth_(update_after_remove_QMARK_(update_asset_op,t_139056))){
return null;
} else {
var G__138822 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid_139060,new cljs.core.Keyword(null,"remove-asset","remove-asset",-1739744854),op], null)], null);
if(cljs.core.truth_(update_asset_op)){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__138822,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db.fn","retractAttribute","db.fn/retractAttribute",937402164),e_139062,new cljs.core.Keyword(null,"update-asset","update-asset",501550582)], null));
} else {
return G__138822;
}
}

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__138816__$1)].join('')));

}
})());
if(cljs.core.truth_(temp__5804__auto___139065__$1)){
var tx_data_139074 = temp__5804__auto___139065__$1;
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2(conn,tx_data_139074) : datascript.core.transact_BANG_.call(null,conn,tx_data_139074));
} else {
}


var G__139075 = cljs.core.next(seq__138718__$1);
var G__139076 = null;
var G__139077 = (0);
var G__139078 = (0);
seq__138718 = G__139075;
chunk__138719 = G__139076;
count__138720 = G__139077;
i__138721 = G__139078;
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
var asset_block_uuids = (function (){var G__138831 = new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?block-uuid","?block-uuid",1931397442,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Symbol(null,"?block-uuid","?block-uuid",1931397442,null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("logseq.property.asset","type","logseq.property.asset/type",-1142083098)], null)], null);
var G__138832 = cljs.core.deref(conn);
return (datascript.core.q.cljs$core$IFn$_invoke$arity$2 ? datascript.core.q.cljs$core$IFn$_invoke$arity$2(G__138831,G__138832) : datascript.core.q.call(null,G__138831,G__138832));
})();
var ops = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block_uuid){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"update-asset","update-asset",501550582),(1),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),block_uuid], null)], null);
}),asset_block_uuids);
return frontend.worker.rtc.client_op.add_asset_ops(repo,ops);
});
frontend.worker.rtc.client_op.get_all_asset_ops_STAR_ = (function frontend$worker$rtc$client_op$get_all_asset_ops_STAR_(db){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__138841){
var vec__138844 = p__138841;
var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138844,(0),null);
var datoms = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138844,(1),null);
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
var ent = (function (){var G__138865 = cljs.core.deref(conn);
var G__138866 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),asset_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__138865,G__138866) : datascript.core.entity.call(null,G__138865,G__138866));
})();
var temp__5804__auto____$1 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(ent);
if(cljs.core.truth_(temp__5804__auto____$1)){
var e = temp__5804__auto____$1;
var G__138868 = conn;
var G__138869 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (a){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db.fn","retractAttribute","db.fn/retractAttribute",937402164),e,a], null);
}),frontend.worker.rtc.client_op.asset_op_types);
return (datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2(G__138868,G__138869) : datascript.core.transact_BANG_.call(null,G__138868,G__138869));
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
