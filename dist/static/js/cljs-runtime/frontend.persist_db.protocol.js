goog.provide('frontend.persist_db.protocol');

/**
 * @interface
 */
frontend.persist_db.protocol.PersistentDB = function(){};

var frontend$persist_db$protocol$PersistentDB$_LT_list_db$dyn_81974 = (function (this$){
var x__5350__auto__ = (((this$ == null))?null:this$);
var m__5351__auto__ = (frontend.persist_db.protocol._LT_list_db[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(this$) : m__5351__auto__.call(null,this$));
} else {
var m__5349__auto__ = (frontend.persist_db.protocol._LT_list_db["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(this$) : m__5349__auto__.call(null,this$));
} else {
throw cljs.core.missing_protocol("PersistentDB.<list-db",this$);
}
}
});
/**
 * List all databases
 */
frontend.persist_db.protocol._LT_list_db = (function frontend$persist_db$protocol$_LT_list_db(this$){
if((((!((this$ == null)))) && ((!((this$.frontend$persist_db$protocol$PersistentDB$_LT_list_db$arity$1 == null)))))){
return this$.frontend$persist_db$protocol$PersistentDB$_LT_list_db$arity$1(this$);
} else {
return frontend$persist_db$protocol$PersistentDB$_LT_list_db$dyn_81974(this$);
}
});

var frontend$persist_db$protocol$PersistentDB$_LT_new$dyn_81975 = (function (this$,repo,opts){
var x__5350__auto__ = (((this$ == null))?null:this$);
var m__5351__auto__ = (frontend.persist_db.protocol._LT_new[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(this$,repo,opts) : m__5351__auto__.call(null,this$,repo,opts));
} else {
var m__5349__auto__ = (frontend.persist_db.protocol._LT_new["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(this$,repo,opts) : m__5349__auto__.call(null,this$,repo,opts));
} else {
throw cljs.core.missing_protocol("PersistentDB.<new",this$);
}
}
});
/**
 * Create or open a graph
 */
frontend.persist_db.protocol._LT_new = (function frontend$persist_db$protocol$_LT_new(this$,repo,opts){
if((((!((this$ == null)))) && ((!((this$.frontend$persist_db$protocol$PersistentDB$_LT_new$arity$3 == null)))))){
return this$.frontend$persist_db$protocol$PersistentDB$_LT_new$arity$3(this$,repo,opts);
} else {
return frontend$persist_db$protocol$PersistentDB$_LT_new$dyn_81975(this$,repo,opts);
}
});

var frontend$persist_db$protocol$PersistentDB$_LT_unsafe_delete$dyn_81976 = (function (this$,repo){
var x__5350__auto__ = (((this$ == null))?null:this$);
var m__5351__auto__ = (frontend.persist_db.protocol._LT_unsafe_delete[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(this$,repo) : m__5351__auto__.call(null,this$,repo));
} else {
var m__5349__auto__ = (frontend.persist_db.protocol._LT_unsafe_delete["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(this$,repo) : m__5349__auto__.call(null,this$,repo));
} else {
throw cljs.core.missing_protocol("PersistentDB.<unsafe-delete",this$);
}
}
});
/**
 * Delete graph and its vfs
 */
frontend.persist_db.protocol._LT_unsafe_delete = (function frontend$persist_db$protocol$_LT_unsafe_delete(this$,repo){
if((((!((this$ == null)))) && ((!((this$.frontend$persist_db$protocol$PersistentDB$_LT_unsafe_delete$arity$2 == null)))))){
return this$.frontend$persist_db$protocol$PersistentDB$_LT_unsafe_delete$arity$2(this$,repo);
} else {
return frontend$persist_db$protocol$PersistentDB$_LT_unsafe_delete$dyn_81976(this$,repo);
}
});

var frontend$persist_db$protocol$PersistentDB$_LT_release_access_handles$dyn_81977 = (function (this$,repo){
var x__5350__auto__ = (((this$ == null))?null:this$);
var m__5351__auto__ = (frontend.persist_db.protocol._LT_release_access_handles[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(this$,repo) : m__5351__auto__.call(null,this$,repo));
} else {
var m__5349__auto__ = (frontend.persist_db.protocol._LT_release_access_handles["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(this$,repo) : m__5349__auto__.call(null,this$,repo));
} else {
throw cljs.core.missing_protocol("PersistentDB.<release-access-handles",this$);
}
}
});
/**
 * Release access file handles
 */
frontend.persist_db.protocol._LT_release_access_handles = (function frontend$persist_db$protocol$_LT_release_access_handles(this$,repo){
if((((!((this$ == null)))) && ((!((this$.frontend$persist_db$protocol$PersistentDB$_LT_release_access_handles$arity$2 == null)))))){
return this$.frontend$persist_db$protocol$PersistentDB$_LT_release_access_handles$arity$2(this$,repo);
} else {
return frontend$persist_db$protocol$PersistentDB$_LT_release_access_handles$dyn_81977(this$,repo);
}
});

var frontend$persist_db$protocol$PersistentDB$_LT_fetch_initial_data$dyn_81979 = (function (this$,repo,opts){
var x__5350__auto__ = (((this$ == null))?null:this$);
var m__5351__auto__ = (frontend.persist_db.protocol._LT_fetch_initial_data[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(this$,repo,opts) : m__5351__auto__.call(null,this$,repo,opts));
} else {
var m__5349__auto__ = (frontend.persist_db.protocol._LT_fetch_initial_data["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(this$,repo,opts) : m__5349__auto__.call(null,this$,repo,opts));
} else {
throw cljs.core.missing_protocol("PersistentDB.<fetch-initial-data",this$);
}
}
});
/**
 * Fetch Initial data
 */
frontend.persist_db.protocol._LT_fetch_initial_data = (function frontend$persist_db$protocol$_LT_fetch_initial_data(this$,repo,opts){
if((((!((this$ == null)))) && ((!((this$.frontend$persist_db$protocol$PersistentDB$_LT_fetch_initial_data$arity$3 == null)))))){
return this$.frontend$persist_db$protocol$PersistentDB$_LT_fetch_initial_data$arity$3(this$,repo,opts);
} else {
return frontend$persist_db$protocol$PersistentDB$_LT_fetch_initial_data$dyn_81979(this$,repo,opts);
}
});

var frontend$persist_db$protocol$PersistentDB$_LT_export_db$dyn_81981 = (function (this$,repo,opts){
var x__5350__auto__ = (((this$ == null))?null:this$);
var m__5351__auto__ = (frontend.persist_db.protocol._LT_export_db[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(this$,repo,opts) : m__5351__auto__.call(null,this$,repo,opts));
} else {
var m__5349__auto__ = (frontend.persist_db.protocol._LT_export_db["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(this$,repo,opts) : m__5349__auto__.call(null,this$,repo,opts));
} else {
throw cljs.core.missing_protocol("PersistentDB.<export-db",this$);
}
}
});
/**
 * Save or get SQLite db
 */
frontend.persist_db.protocol._LT_export_db = (function frontend$persist_db$protocol$_LT_export_db(this$,repo,opts){
if((((!((this$ == null)))) && ((!((this$.frontend$persist_db$protocol$PersistentDB$_LT_export_db$arity$3 == null)))))){
return this$.frontend$persist_db$protocol$PersistentDB$_LT_export_db$arity$3(this$,repo,opts);
} else {
return frontend$persist_db$protocol$PersistentDB$_LT_export_db$dyn_81981(this$,repo,opts);
}
});

var frontend$persist_db$protocol$PersistentDB$_LT_import_db$dyn_81986 = (function (this$,repo,data){
var x__5350__auto__ = (((this$ == null))?null:this$);
var m__5351__auto__ = (frontend.persist_db.protocol._LT_import_db[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(this$,repo,data) : m__5351__auto__.call(null,this$,repo,data));
} else {
var m__5349__auto__ = (frontend.persist_db.protocol._LT_import_db["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(this$,repo,data) : m__5349__auto__.call(null,this$,repo,data));
} else {
throw cljs.core.missing_protocol("PersistentDB.<import-db",this$);
}
}
});
/**
 * Import SQLite db
 */
frontend.persist_db.protocol._LT_import_db = (function frontend$persist_db$protocol$_LT_import_db(this$,repo,data){
if((((!((this$ == null)))) && ((!((this$.frontend$persist_db$protocol$PersistentDB$_LT_import_db$arity$3 == null)))))){
return this$.frontend$persist_db$protocol$PersistentDB$_LT_import_db$arity$3(this$,repo,data);
} else {
return frontend$persist_db$protocol$PersistentDB$_LT_import_db$dyn_81986(this$,repo,data);
}
});


//# sourceMappingURL=frontend.persist_db.protocol.js.map
