goog.provide('frontend.worker.db.validate');
frontend.worker.db.validate.validate_db = (function frontend$worker$db$validate$validate_db(db){
var map__186799 = logseq.db.frontend.validate.validate_db_BANG_(db);
var map__186799__$1 = cljs.core.__destructure_map(map__186799);
var errors = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186799__$1,new cljs.core.Keyword(null,"errors","errors",-908790718));
var datom_count = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186799__$1,new cljs.core.Keyword(null,"datom-count","datom-count",515794351));
var entities = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__186799__$1,new cljs.core.Keyword(null,"entities","entities",1940967403));
if(cljs.core.truth_(errors)){
frontend.worker.shared_service.broadcast_to_clients_BANG_(new cljs.core.Keyword(null,"log","log",-1595516004),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"db-invalid","db-invalid",-1142606017),new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"msg","msg",-1386103444),"Validation errors",new cljs.core.Keyword(null,"errors","errors",-908790718),errors], null)], null));

frontend.worker.shared_service.broadcast_to_clients_BANG_(new cljs.core.Keyword(null,"notification","notification",-222338233),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [["Validation detected ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.count(errors))," invalid block(s). These blocks may be buggy. Attempting to fix invalid blocks. Run validation again to see if they were fixed."].join(''),new cljs.core.Keyword(null,"warning","warning",-1685650671),false], null));
} else {
frontend.worker.shared_service.broadcast_to_clients_BANG_(new cljs.core.Keyword(null,"notification","notification",-222338233),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [["Your graph is valid! ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(logseq.db.frontend.validate.graph_counts(db,entities),new cljs.core.Keyword(null,"datoms","datoms",-290874434),datom_count))].join(''),new cljs.core.Keyword(null,"success","success",1890645906),false], null));
}

return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"errors","errors",-908790718),errors,new cljs.core.Keyword(null,"datom-count","datom-count",515794351),datom_count,new cljs.core.Keyword(null,"invalid-entity-ids","invalid-entity-ids",432707245),cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (e){
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"entity","entity",-450970276).cljs$core$IFn$_invoke$arity$1(e));
}),errors))], null);
});

//# sourceMappingURL=frontend.worker.db.validate.js.map
