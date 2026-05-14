goog.provide('datascript.core');
datascript.core.tx0 = (536870912);
/**
 * Retrieves an entity by its id from database. Entities are lazy map-like structures to navigate DataScript database content.
 * 
 *           For `eid` pass entity id or lookup attr:
 * 
 *               (entity db 1)
 *               (entity db [:unique-attr :value])
 * 
 *           If entity does not exist, `nil` is returned:
 * 
 *               (entity db 100500) ; => nil
 * 
 *           Creating an entity by id is very cheap, almost no-op, as attr access is on-demand:
 * 
 *               (entity db 1) ; => {:db/id 1}
 * 
 *           Entity attributes can be lazily accessed through key lookups:
 * 
 *               (:attr (entity db 1)) ; => :value
 *               (get (entity db 1) :attr) ; => :value
 * 
 *           Cardinality many attributes are returned sequences:
 * 
 *               (:attrs (entity db 1)) ; => [:v1 :v2 :v3]
 * 
 *           Reference attributes are returned as another entities:
 * 
 *               (:ref (entity db 1)) ; => {:db/id 2}
 *               (:ns/ref (entity db 1)) ; => {:db/id 2}
 * 
 *           References can be walked backwards by prepending `_` to name part of an attribute:
 * 
 *               (:_ref (entity db 2)) ; => [{:db/id 1}]
 *               (:ns/_ref (entity db 2)) ; => [{:db/id 1}]
 * 
 *           Reverse reference lookup returns sequence of entities unless attribute is marked as `:db/isComponent`:
 * 
 *               (:_component-ref (entity db 2)) ; => {:db/id 1}
 * 
 *           Entity gotchas:
 * 
 *           - Entities print as map, but are not exactly maps (they have compatible get interface though).
 *           - Entities are effectively immutable “views” into a particular version of a database.
 *           - Entities retain reference to the whole database.
 *           - You can’t change database through entities, only read.
 *           - Creating an entity by id is very cheap, almost no-op (attributes are looked up on demand).
 *           - Comparing entities just compares their ids. Be careful when comparing entities taken from different dbs or from different versions of the same db.
 *           - Accessed entity attributes are cached on entity itself (except backward references).
 *           - When printing, only cached attributes (the ones you have accessed before) are printed. See [[touch]].
 */
datascript.core.entity = datascript.impl.entity.entity;
/**
 * Given lookup ref `[unique-attr value]`, returns numberic entity id.
 * 
 *           If entity does not exist, returns `nil`.
 */
datascript.core.entid = datascript.db.entid;
/**
 * Returns a db that entity was created from.
 */
datascript.core.entity_db = (function datascript$core$entity_db(entity){
if(datascript.impl.entity.entity_QMARK_(entity)){
} else {
throw (new Error("Assert failed: (de/entity? entity)"));
}

return entity.db;
});
/**
 * Forces all entity attributes to be eagerly fetched and cached. Only usable for debug output.
 * 
 *           Usage:
 * 
 *           ```
 *           (entity db 1) ; => {:db/id 1}
 *           (touch (entity db 1)) ; => {:db/id 1, :dislikes [:pie], :likes [:pizza]}
 *           ```
 */
datascript.core.touch = datascript.impl.entity.touch;
/**
 * Fetches data from database using recursive declarative description. See [docs.datomic.com/on-prem/pull.html](https://docs.datomic.com/on-prem/pull.html).
 * 
 *           Unlike [[entity]], returns plain Clojure map (not lazy).
 * 
 *           Usage:
 * 
 *               (pull db [:db/id, :name, :likes, {:friends [:db/id :name]}] 1)
 *               ; => {:db/id   1,
 *               ;     :name    "Ivan"
 *               ;     :likes   [:pizza]
 *               ;     :friends [{:db/id 2, :name "Oleg"}]}
 */
datascript.core.pull = datascript.pull_api.pull;
/**
 * Same as [[pull]], but accepts sequence of ids and returns sequence of maps.
 * 
 *           Usage:
 * 
 *           ```
 *           (pull-many db [:db/id :name] [1 2])
 *           ; => [{:db/id 1, :name "Ivan"}
 *           ;     {:db/id 2, :name "Oleg"}]
 *           ```
 */
datascript.core.pull_many = datascript.pull_api.pull_many;
/**
 * Executes a datalog query. See [docs.datomic.com/on-prem/query.html](https://docs.datomic.com/on-prem/query.html).
 * 
 *        Usage:
 * 
 *        ```
 *        (q '[:find ?value
 *             :where [_ :likes ?value]]
 *           db)
 *        ; => #{["fries"] ["candy"] ["pie"] ["pizza"]}
 *        ```
 */
datascript.core.q = datascript.query.q;
/**
 * Creates an empty database with an optional schema.
 * 
 * Usage:
 * 
 * ```
 * (empty-db) ; => #datascript/DB {:schema {}, :datoms []}
 * 
 * (empty-db {:likes {:db/cardinality :db.cardinality/many}})
 * ; => #datascript/DB {:schema {:likes {:db/cardinality :db.cardinality/many}}
 * ;                    :datoms []}
 * ```
 * 
 * Options are:
 * 
 * :branching-factor <int>, default 512. B-tree max node length
 * :ref-type         :strong | :soft | :weak, default :soft. How will nodes that are already
 *                   stored on disk be referenced. Soft or weak means they might be unloaded
 *                   from memory under memory pressure and later fetched from storage again.
 * :storage          <IStorage>. Will be used to store this db later with `(d/store db)`
 */
datascript.core.empty_db = (function datascript$core$empty_db(var_args){
var G__61849 = arguments.length;
switch (G__61849) {
case 0:
return datascript.core.empty_db.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return datascript.core.empty_db.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return datascript.core.empty_db.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(datascript.core.empty_db.cljs$core$IFn$_invoke$arity$0 = (function (){
return datascript.db.empty_db(null,cljs.core.PersistentArrayMap.EMPTY);
}));

(datascript.core.empty_db.cljs$core$IFn$_invoke$arity$1 = (function (schema){
return datascript.db.empty_db(schema,cljs.core.PersistentArrayMap.EMPTY);
}));

(datascript.core.empty_db.cljs$core$IFn$_invoke$arity$2 = (function (schema,opts){
return datascript.db.empty_db(schema,datascript.storage.maybe_adapt_storage(opts));
}));

(datascript.core.empty_db.cljs$lang$maxFixedArity = 2);

/**
 * Returns `true` if the given value is an immutable database, `false` otherwise.
 */
datascript.core.db_QMARK_ = datascript.db.db_QMARK_;
/**
 * Low-level fn to create raw datoms.
 * 
 *           Optionally with transaction id (number) and `added` flag (`true` for addition, `false` for retraction).
 * 
 *           See also [[init-db]].
 */
datascript.core.datom = datascript.db.datom;
/**
 * Returns `true` if the given value is a datom, `false` otherwise.
 */
datascript.core.datom_QMARK_ = datascript.db.datom_QMARK_;
/**
 * Low-level fn for creating database quickly from a trusted sequence of datoms.
 * Does no validation on inputs, so `datoms` must be well-formed and match schema.
 * Used internally in db (de)serialization. See also [[datom]].
 * For options, see [[empty-db]]
 */
datascript.core.init_db = (function datascript$core$init_db(var_args){
var G__61861 = arguments.length;
switch (G__61861) {
case 1:
return datascript.core.init_db.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return datascript.core.init_db.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return datascript.core.init_db.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(datascript.core.init_db.cljs$core$IFn$_invoke$arity$1 = (function (datoms){
return datascript.db.init_db(datoms,null,cljs.core.PersistentArrayMap.EMPTY);
}));

(datascript.core.init_db.cljs$core$IFn$_invoke$arity$2 = (function (datoms,schema){
return datascript.db.init_db(datoms,schema,cljs.core.PersistentArrayMap.EMPTY);
}));

(datascript.core.init_db.cljs$core$IFn$_invoke$arity$3 = (function (datoms,schema,opts){
return datascript.db.init_db(datoms,schema,datascript.storage.maybe_adapt_storage(opts));
}));

(datascript.core.init_db.cljs$lang$maxFixedArity = 3);

/**
 * Converts db into a data structure (not string!) that can be fed to serializer
 *           of your choice (e.g. `js/JSON.stringify` in CLJS, `cheshire.core/generate-string`
 *           or `jsonista.core/write-value-as-string` in CLJ).
 * 
 *           On JVM, `serializable` holds a global lock that prevents any two serializations
 *           to run in parallel (an implementation constraint, be aware).
 * 
 *           Options:
 * 
 *           `:freeze-fn` Non-primitive values will be serialized using this. Optional.
 *           `pr-str` by default.
 */
datascript.core.serializable = datascript.serialize.serializable;
/**
 * Creates db from a data structure (not string!) produced by serializable.
 * 
 *           Opts:
 * 
 *           `:thaw-fn` Non-primitive values will be deserialized using this.
 *           Must match :freeze-fn from serializable. Optional. `clojure.edn/read-string`
 *           by default.
 */
datascript.core.from_serializable = datascript.serialize.from_serializable;
/**
 * Returns a schema of a database.
 */
datascript.core.schema = datascript.db._schema;
/**
 * Returns `true` if this database was filtered using [[filter]], `false` otherwise.
 */
datascript.core.is_filtered = (function datascript$core$is_filtered(x){
return (x instanceof datascript.db.FilteredDB);
});
/**
 * Returns a view over database that has same interface but only includes datoms for which the `(pred db datom)` is true. Can be applied multiple times.
 * 
 * Filtered DB gotchas:
 * 
 * - All operations on filtered database are proxied to original DB, then filter pred is applied.
 * - Not cached. You pay filter penalty every time.
 * - Supports entities, pull, queries, index access.
 * - Does not support [[with]] and [[db-with]].
 */
datascript.core.filter = (function datascript$core$filter(db,pred){
if(datascript.db.db_QMARK_(db)){
} else {
throw (new Error("Assert failed: (db/db? db)"));
}

if(datascript.core.is_filtered(db)){
var fdb = db;
var orig_pred = fdb.pred;
var orig_db = fdb.unfiltered_db;
return (new datascript.db.FilteredDB(orig_db,(function (p1__61876_SHARP_){
var and__5000__auto__ = (orig_pred.cljs$core$IFn$_invoke$arity$1 ? orig_pred.cljs$core$IFn$_invoke$arity$1(p1__61876_SHARP_) : orig_pred.call(null,p1__61876_SHARP_));
if(cljs.core.truth_(and__5000__auto__)){
return (pred.cljs$core$IFn$_invoke$arity$2 ? pred.cljs$core$IFn$_invoke$arity$2(orig_db,p1__61876_SHARP_) : pred.call(null,orig_db,p1__61876_SHARP_));
} else {
return and__5000__auto__;
}
}),cljs.core.atom.cljs$core$IFn$_invoke$arity$1((0)),null,null,null));
} else {
return (new datascript.db.FilteredDB(db,(function (p1__61877_SHARP_){
return (pred.cljs$core$IFn$_invoke$arity$2 ? pred.cljs$core$IFn$_invoke$arity$2(db,p1__61877_SHARP_) : pred.call(null,db,p1__61877_SHARP_));
}),cljs.core.atom.cljs$core$IFn$_invoke$arity$1((0)),null,null,null));
}
});
/**
 * Same as [[transact!]], but applies to an immutable database value. Returns transaction report (see [[transact!]]).
 */
datascript.core.with$ = datascript.conn.with$;
/**
 * Applies transaction to an immutable db value, returning new immutable db value. Same as `(:db-after (with db tx-data))`.
 */
datascript.core.db_with = datascript.conn.db_with;
/**
 * Warning! No validation or conversion. Only change schema in a compatible way
 */
datascript.core.with_schema = (function datascript$core$with_schema(db,schema){
return datascript.db.with_schema(db,schema);
});
/**
 * Index lookup. Returns a sequence of datoms (lazy iterator over actual DB index) which components (e, a, v) match passed arguments.
 * 
 * Datoms are sorted in index sort order. Possible `index` values are: `:eavt`, `:aevt`, `:avet`.
 * 
 * Usage:
 * 
 *     ; find all datoms for entity id == 1 (any attrs and values)
 *     ; sort by attribute, then value
 *     (datoms db :eavt 1)
 *     ; => (#datascript/Datom [1 :friends 2]
 *     ;     #datascript/Datom [1 :likes "fries"]
 *     ;     #datascript/Datom [1 :likes "pizza"]
 *     ;     #datascript/Datom [1 :name "Ivan"])
 * 
 *     ; find all datoms for entity id == 1 and attribute == :likes (any values)
 *     ; sorted by value
 *     (datoms db :eavt 1 :likes)
 *     ; => (#datascript/Datom [1 :likes "fries"]
 *     ;     #datascript/Datom [1 :likes "pizza"])
 * 
 *     ; find all datoms for entity id == 1, attribute == :likes and value == "pizza"
 *     (datoms db :eavt 1 :likes "pizza")
 *     ; => (#datascript/Datom [1 :likes "pizza"])
 * 
 *     ; find all datoms for attribute == :likes (any entity ids and values)
 *     ; sorted by entity id, then value
 *     (datoms db :aevt :likes)
 *     ; => (#datascript/Datom [1 :likes "fries"]
 *     ;     #datascript/Datom [1 :likes "pizza"]
 *     ;     #datascript/Datom [2 :likes "candy"]
 *     ;     #datascript/Datom [2 :likes "pie"]
 *     ;     #datascript/Datom [2 :likes "pizza"])
 * 
 *     ; find all datoms that have attribute == `:likes` and value == `"pizza"` (any entity id)
 *     ; `:likes` must be a unique attr, reference or marked as `:db/index true`
 *     (datoms db :avet :likes "pizza")
 *     ; => (#datascript/Datom [1 :likes "pizza"]
 *     ;     #datascript/Datom [2 :likes "pizza"])
 * 
 *     ; find all datoms sorted by entity id, then attribute, then value
 *     (datoms db :eavt) ; => (...)
 * 
 * Useful patterns:
 * 
 *     ; get all values of :db.cardinality/many attribute
 *     (->> (datoms db :eavt eid attr) (map :v))
 * 
 *     ; lookup entity ids by attribute value
 *     (->> (datoms db :avet attr value) (map :e))
 * 
 *     ; find all entities with a specific attribute
 *     (->> (datoms db :aevt attr) (map :e))
 * 
 *     ; find “singleton” entity by its attr
 *     (->> (datoms db :aevt attr) first :e)
 * 
 *     ; find N entities with lowest attr value (e.g. 10 earliest posts)
 *     (->> (datoms db :avet attr) (take N))
 * 
 *     ; find N entities with highest attr value (e.g. 10 latest posts)
 *     (->> (datoms db :avet attr) (reverse) (take N))
 * 
 * Gotchas:
 * 
 * - Index lookup is usually more efficient than doing a query with a single clause.
 * - Resulting iterator is calculated in constant time and small constant memory overhead.
 * - Iterator supports efficient `first`, `next`, `reverse`, `seq` and is itself a sequence.
 * - Will not return datoms that are not part of the index (e.g. attributes with no `:db/index` in schema when querying `:avet` index).
 *   - `:eavt` and `:aevt` contain all datoms.
 *   - `:avet` only contains datoms for references, `:db/unique` and `:db/index` attributes.
 */
datascript.core.datoms = (function datascript$core$datoms(var_args){
var G__61902 = arguments.length;
switch (G__61902) {
case 2:
return datascript.core.datoms.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return datascript.core.datoms.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return datascript.core.datoms.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
case 5:
return datascript.core.datoms.cljs$core$IFn$_invoke$arity$5((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]));

break;
case 6:
return datascript.core.datoms.cljs$core$IFn$_invoke$arity$6((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]),(arguments[(5)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(datascript.core.datoms.cljs$core$IFn$_invoke$arity$2 = (function (db,index){
if(datascript.db.db_QMARK_(db)){
} else {
throw (new Error("Assert failed: (db/db? db)"));
}

return datascript.db._datoms(db,index,null,null,null,null);
}));

(datascript.core.datoms.cljs$core$IFn$_invoke$arity$3 = (function (db,index,c0){
if(datascript.db.db_QMARK_(db)){
} else {
throw (new Error("Assert failed: (db/db? db)"));
}

return datascript.db._datoms(db,index,c0,null,null,null);
}));

(datascript.core.datoms.cljs$core$IFn$_invoke$arity$4 = (function (db,index,c0,c1){
if(datascript.db.db_QMARK_(db)){
} else {
throw (new Error("Assert failed: (db/db? db)"));
}

return datascript.db._datoms(db,index,c0,c1,null,null);
}));

(datascript.core.datoms.cljs$core$IFn$_invoke$arity$5 = (function (db,index,c0,c1,c2){
if(datascript.db.db_QMARK_(db)){
} else {
throw (new Error("Assert failed: (db/db? db)"));
}

return datascript.db._datoms(db,index,c0,c1,c2,null);
}));

(datascript.core.datoms.cljs$core$IFn$_invoke$arity$6 = (function (db,index,c0,c1,c2,c3){
if(datascript.db.db_QMARK_(db)){
} else {
throw (new Error("Assert failed: (db/db? db)"));
}

return datascript.db._datoms(db,index,c0,c1,c2,c3);
}));

(datascript.core.datoms.cljs$lang$maxFixedArity = 6);

/**
 * Same as [[datoms]], but only returns single datom. Faster than `(first (datoms ...))`
 */
datascript.core.find_datom = (function datascript$core$find_datom(var_args){
var G__61925 = arguments.length;
switch (G__61925) {
case 2:
return datascript.core.find_datom.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return datascript.core.find_datom.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return datascript.core.find_datom.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
case 5:
return datascript.core.find_datom.cljs$core$IFn$_invoke$arity$5((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]));

break;
case 6:
return datascript.core.find_datom.cljs$core$IFn$_invoke$arity$6((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]),(arguments[(5)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(datascript.core.find_datom.cljs$core$IFn$_invoke$arity$2 = (function (db,index){
if(datascript.db.db_QMARK_(db)){
} else {
throw (new Error("Assert failed: (db/db? db)"));
}

return datascript.db.find_datom(db,index,null,null,null,null);
}));

(datascript.core.find_datom.cljs$core$IFn$_invoke$arity$3 = (function (db,index,c0){
if(datascript.db.db_QMARK_(db)){
} else {
throw (new Error("Assert failed: (db/db? db)"));
}

return datascript.db.find_datom(db,index,c0,null,null,null);
}));

(datascript.core.find_datom.cljs$core$IFn$_invoke$arity$4 = (function (db,index,c0,c1){
if(datascript.db.db_QMARK_(db)){
} else {
throw (new Error("Assert failed: (db/db? db)"));
}

return datascript.db.find_datom(db,index,c0,c1,null,null);
}));

(datascript.core.find_datom.cljs$core$IFn$_invoke$arity$5 = (function (db,index,c0,c1,c2){
if(datascript.db.db_QMARK_(db)){
} else {
throw (new Error("Assert failed: (db/db? db)"));
}

return datascript.db.find_datom(db,index,c0,c1,c2,null);
}));

(datascript.core.find_datom.cljs$core$IFn$_invoke$arity$6 = (function (db,index,c0,c1,c2,c3){
if(datascript.db.db_QMARK_(db)){
} else {
throw (new Error("Assert failed: (db/db? db)"));
}

return datascript.db.find_datom(db,index,c0,c1,c2,c3);
}));

(datascript.core.find_datom.cljs$lang$maxFixedArity = 6);

/**
 * Similar to [[datoms]], but will return datoms starting from specified components and including rest of the database until the end of the index.
 * 
 * If no datom matches passed arguments exactly, iterator will start from first datom that could be considered “greater” in index order.
 * 
 * Usage:
 * 
 *     (seek-datoms db :eavt 1)
 *     ; => (#datascript/Datom [1 :friends 2]
 *     ;     #datascript/Datom [1 :likes "fries"]
 *     ;     #datascript/Datom [1 :likes "pizza"]
 *     ;     #datascript/Datom [1 :name "Ivan"]
 *     ;     #datascript/Datom [2 :likes "candy"]
 *     ;     #datascript/Datom [2 :likes "pie"]
 *     ;     #datascript/Datom [2 :likes "pizza"])
 * 
 *     (seek-datoms db :eavt 1 :name)
 *     ; => (#datascript/Datom [1 :name "Ivan"]
 *     ;     #datascript/Datom [2 :likes "candy"]
 *     ;     #datascript/Datom [2 :likes "pie"]
 *     ;     #datascript/Datom [2 :likes "pizza"])
 * 
 *     (seek-datoms db :eavt 2)
 *     ; => (#datascript/Datom [2 :likes "candy"]
 *     ;     #datascript/Datom [2 :likes "pie"]
 *     ;     #datascript/Datom [2 :likes "pizza"])
 * 
 *     ; no datom [2 :likes "fish"], so starts with one immediately following such in index
 *     (seek-datoms db :eavt 2 :likes "fish")
 *     ; => (#datascript/Datom [2 :likes "pie"]
 *     ;     #datascript/Datom [2 :likes "pizza"])
 */
datascript.core.seek_datoms = (function datascript$core$seek_datoms(var_args){
var G__61943 = arguments.length;
switch (G__61943) {
case 2:
return datascript.core.seek_datoms.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return datascript.core.seek_datoms.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return datascript.core.seek_datoms.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
case 5:
return datascript.core.seek_datoms.cljs$core$IFn$_invoke$arity$5((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]));

break;
case 6:
return datascript.core.seek_datoms.cljs$core$IFn$_invoke$arity$6((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]),(arguments[(5)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(datascript.core.seek_datoms.cljs$core$IFn$_invoke$arity$2 = (function (db,index){
if(datascript.db.db_QMARK_(db)){
} else {
throw (new Error("Assert failed: (db/db? db)"));
}

return datascript.db._seek_datoms(db,index,null,null,null,null);
}));

(datascript.core.seek_datoms.cljs$core$IFn$_invoke$arity$3 = (function (db,index,c0){
if(datascript.db.db_QMARK_(db)){
} else {
throw (new Error("Assert failed: (db/db? db)"));
}

return datascript.db._seek_datoms(db,index,c0,null,null,null);
}));

(datascript.core.seek_datoms.cljs$core$IFn$_invoke$arity$4 = (function (db,index,c0,c1){
if(datascript.db.db_QMARK_(db)){
} else {
throw (new Error("Assert failed: (db/db? db)"));
}

return datascript.db._seek_datoms(db,index,c0,c1,null,null);
}));

(datascript.core.seek_datoms.cljs$core$IFn$_invoke$arity$5 = (function (db,index,c0,c1,c2){
if(datascript.db.db_QMARK_(db)){
} else {
throw (new Error("Assert failed: (db/db? db)"));
}

return datascript.db._seek_datoms(db,index,c0,c1,c2,null);
}));

(datascript.core.seek_datoms.cljs$core$IFn$_invoke$arity$6 = (function (db,index,c0,c1,c2,c3){
if(datascript.db.db_QMARK_(db)){
} else {
throw (new Error("Assert failed: (db/db? db)"));
}

return datascript.db._seek_datoms(db,index,c0,c1,c2,c3);
}));

(datascript.core.seek_datoms.cljs$lang$maxFixedArity = 6);

/**
 * Same as [[seek-datoms]], but goes backwards until the beginning of the index.
 */
datascript.core.rseek_datoms = (function datascript$core$rseek_datoms(var_args){
var G__61948 = arguments.length;
switch (G__61948) {
case 2:
return datascript.core.rseek_datoms.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return datascript.core.rseek_datoms.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return datascript.core.rseek_datoms.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
case 5:
return datascript.core.rseek_datoms.cljs$core$IFn$_invoke$arity$5((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]));

break;
case 6:
return datascript.core.rseek_datoms.cljs$core$IFn$_invoke$arity$6((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]),(arguments[(5)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(datascript.core.rseek_datoms.cljs$core$IFn$_invoke$arity$2 = (function (db,index){
if(datascript.db.db_QMARK_(db)){
} else {
throw (new Error("Assert failed: (db/db? db)"));
}

return datascript.db._rseek_datoms(db,index,null,null,null,null);
}));

(datascript.core.rseek_datoms.cljs$core$IFn$_invoke$arity$3 = (function (db,index,c0){
if(datascript.db.db_QMARK_(db)){
} else {
throw (new Error("Assert failed: (db/db? db)"));
}

return datascript.db._rseek_datoms(db,index,c0,null,null,null);
}));

(datascript.core.rseek_datoms.cljs$core$IFn$_invoke$arity$4 = (function (db,index,c0,c1){
if(datascript.db.db_QMARK_(db)){
} else {
throw (new Error("Assert failed: (db/db? db)"));
}

return datascript.db._rseek_datoms(db,index,c0,c1,null,null);
}));

(datascript.core.rseek_datoms.cljs$core$IFn$_invoke$arity$5 = (function (db,index,c0,c1,c2){
if(datascript.db.db_QMARK_(db)){
} else {
throw (new Error("Assert failed: (db/db? db)"));
}

return datascript.db._rseek_datoms(db,index,c0,c1,c2,null);
}));

(datascript.core.rseek_datoms.cljs$core$IFn$_invoke$arity$6 = (function (db,index,c0,c1,c2,c3){
if(datascript.db.db_QMARK_(db)){
} else {
throw (new Error("Assert failed: (db/db? db)"));
}

return datascript.db._rseek_datoms(db,index,c0,c1,c2,c3);
}));

(datascript.core.rseek_datoms.cljs$lang$maxFixedArity = 6);

/**
 * Returns part of `:avet` index between `[_ attr start]` and `[_ attr end]` in AVET sort order.
 * 
 * Same properties as [[datoms]].
 * 
 * `attr` must be a reference, unique attribute or marked as `:db/index true`.
 * 
 * Usage:
 * 
 *     (index-range db :likes "a" "zzzzzzzzz")
 *     ; => (#datascript/Datom [2 :likes "candy"]
 *     ;     #datascript/Datom [1 :likes "fries"]
 *     ;     #datascript/Datom [2 :likes "pie"]
 *     ;     #datascript/Datom [1 :likes "pizza"]
 *     ;     #datascript/Datom [2 :likes "pizza"])
 * 
 *     (index-range db :likes "egg" "pineapple")
 *     ; => (#datascript/Datom [1 :likes "fries"]
 *     ;     #datascript/Datom [2 :likes "pie"])
 * 
 * Useful patterns:
 * 
 *     ; find all entities with age in a specific range (inclusive)
 *     (->> (index-range db :age 18 60) (map :e))
 */
datascript.core.index_range = (function datascript$core$index_range(db,attr,start,end){
if(datascript.db.db_QMARK_(db)){
} else {
throw (new Error("Assert failed: (db/db? db)"));
}

return datascript.db._index_range(db,attr,start,end);
});
/**
 * Returns `true` if this is a connection to a DataScript db, `false` otherwise.
 */
datascript.core.conn_QMARK_ = datascript.conn.conn_QMARK_;
/**
 * Creates a mutable reference to a given immutable database. See [[create-conn]].
 */
datascript.core.conn_from_db = datascript.conn.conn_from_db;
/**
 * Creates an empty DB and a mutable reference to it. See [[create-conn]].
 */
datascript.core.conn_from_datoms = datascript.conn.conn_from_datoms;
/**
 * Creates a mutable reference (a “connection”) to an empty immutable database.
 * 
 * Connections are lightweight in-memory structures (~atoms) with direct support of transaction listeners ([[listen!]], [[unlisten!]]) and other handy DataScript APIs ([[transact!]], [[reset-conn!]], [[db]]).
 * 
 * To access underlying immutable DB value, deref: `@conn`.
 * 
 * For list of options, see [[empty-db]].
 * 
 * If you specify `:storage` option, conn will be stored automatically after each transaction
 */
datascript.core.create_conn = datascript.conn.create_conn;
/**
 * Lazy-load database from storage and make conn out of it.
 * Returns nil if there’s no database yet in storage
 */
datascript.core.restore_conn = datascript.conn.restore_conn;
/**
 * Applies transaction the underlying database value and atomically updates connection reference to point to the result of that transaction, new db value.
 * 
 * Returns transaction report, a map:
 * 
 *     {:db-before ...      ; db value before transaction
 *      :db-after  ...      ; db value after transaction
 *      :tx-data   [...]    ; plain datoms that were added/retracted from db-before
 *      :tempids   {...}    ; map of tempid from tx-data => assigned entid in db-after
 *      :tx-meta   tx-meta} ; the exact value you passed as `tx-meta`
 * 
 *   Note! `conn` will be updated in-place and is not returned from [[transact!]].
 * 
 *   Usage:
 * 
 *    ; add a single datom to an existing entity (1)
 *    (transact! conn [[:db/add 1 :name "Ivan"]])
 * 
 *    ; retract a single datom
 *    (transact! conn [[:db/retract 1 :name "Ivan"]])
 * 
 *    ; retract single entity attribute
 *    (transact! conn [[:db.fn/retractAttribute 1 :name]])
 * 
 *    ; ... or equivalently (since Datomic changed its API to support this):
 *    (transact! conn [[:db/retract 1 :name]])
 * 
 *    ; retract all entity attributes (effectively deletes entity)
 *    (transact! conn [[:db.fn/retractEntity 1]])
 * 
 *    ; create a new entity (`-1`, as any other negative value, is a tempid
 *    ; that will be replaced with DataScript to a next unused eid)
 *    (transact! conn [[:db/add -1 :name "Ivan"]])
 * 
 *    ; check assigned id (here `*1` is a result returned from previous `transact!` call)
 *    (def report *1)
 *    (:tempids report) ; => {-1 296}
 * 
 *    ; check actual datoms inserted
 *    (:tx-data report) ; => [#datascript/Datom [296 :name "Ivan"]]
 * 
 *    ; tempid can also be a string
 *    (transact! conn [[:db/add "ivan" :name "Ivan"]])
 *    (:tempids *1) ; => {"ivan" 297}
 * 
 *    ; reference another entity (must exist)
 *    (transact! conn [[:db/add -1 :friend 296]])
 * 
 *    ; create an entity and set multiple attributes (in a single transaction
 *    ; equal tempids will be replaced with the same yet unused entid)
 *    (transact! conn [[:db/add -1 :name "Ivan"]
 *                     [:db/add -1 :likes "fries"]
 *                     [:db/add -1 :likes "pizza"]
 *                     [:db/add -1 :friend 296]])
 * 
 *    ; create an entity and set multiple attributes (alternative map form)
 *    (transact! conn [{:db/id  -1
 *                      :name   "Ivan"
 *                      :likes  ["fries" "pizza"]
 *                      :friend 296}])
 * 
 *    ; update an entity (alternative map form). Can’t retract attributes in
 *    ; map form. For cardinality many attrs, value (fish in this example)
 *    ; will be added to the list of existing values
 *    (transact! conn [{:db/id  296
 *                      :name   "Oleg"
 *                      :likes  ["fish"]}])
 * 
 *    ; ref attributes can be specified as nested map, that will create nested entity as well
 *    (transact! conn [{:db/id  -1
 *                      :name   "Oleg"
 *                      :friend {:db/id -2
 *                               :name "Sergey"}}])
 * 
 *    ; reverse attribute name can be used if you want created entity to become
 *    ; a value in another entity reference
 *    (transact! conn [{:db/id  -1
 *                      :name   "Oleg"
 *                      :_friend 296}])
 *    ; equivalent to
 *    (transact! conn [{:db/id  -1, :name   "Oleg"}
 *                     {:db/id 296, :friend -1}])
 *    ; equivalent to
 *    (transact! conn [[:db/add  -1 :name   "Oleg"]
 *                     [:db/add 296 :friend -1]])
 */
datascript.core.transact_BANG_ = datascript.conn.transact_BANG_;
/**
 * Forces underlying `conn` value to become `db`. Will generate a tx-report that will remove everything from old value and insert everything from the new one.
 */
datascript.core.reset_conn_BANG_ = datascript.conn.reset_conn_BANG_;
datascript.core.reset_schema_BANG_ = datascript.conn.reset_schema_BANG_;
/**
 * Listen for changes on the given connection. Whenever a transaction is applied to the database via [[transact!]], the callback is called
 * with the transaction report. `key` is any opaque unique value.
 * 
 * Idempotent. Calling [[listen!]] with the same key twice will override old callback with the new value.
 * 
 * Returns the key under which this listener is registered. See also [[unlisten!]].
 */
datascript.core.listen_BANG_ = datascript.conn.listen_BANG_;
/**
 * Removes registered listener from connection. See also [[listen!]].
 */
datascript.core.unlisten_BANG_ = datascript.conn.unlisten_BANG_;
/**
 * Data readers for EDN readers. In CLJS they’re registered automatically. In CLJ, if `data_readers.clj` do not work, you can always do
 * 
 *           ```
 *           (clojure.edn/read-string {:readers data-readers} "...")
 *           ```
 */
datascript.core.data_readers = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Symbol("datascript","Datom","datascript/Datom",-901340080,null),datascript.db.datom_from_reader,new cljs.core.Symbol("datascript","DB","datascript/DB",-487332776,null),datascript.db.db_from_reader], null);
var seq__61955_62126 = cljs.core.seq(datascript.core.data_readers);
var chunk__61956_62127 = null;
var count__61957_62128 = (0);
var i__61958_62129 = (0);
while(true){
if((i__61958_62129 < count__61957_62128)){
var vec__61966_62130 = chunk__61956_62127.cljs$core$IIndexed$_nth$arity$2(null,i__61958_62129);
var tag_62131 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61966_62130,(0),null);
var cb_62132 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61966_62130,(1),null);
cljs.reader.register_tag_parser_BANG_(tag_62131,cb_62132);


var G__62133 = seq__61955_62126;
var G__62134 = chunk__61956_62127;
var G__62135 = count__61957_62128;
var G__62136 = (i__61958_62129 + (1));
seq__61955_62126 = G__62133;
chunk__61956_62127 = G__62134;
count__61957_62128 = G__62135;
i__61958_62129 = G__62136;
continue;
} else {
var temp__5804__auto___62137 = cljs.core.seq(seq__61955_62126);
if(temp__5804__auto___62137){
var seq__61955_62138__$1 = temp__5804__auto___62137;
if(cljs.core.chunked_seq_QMARK_(seq__61955_62138__$1)){
var c__5525__auto___62139 = cljs.core.chunk_first(seq__61955_62138__$1);
var G__62140 = cljs.core.chunk_rest(seq__61955_62138__$1);
var G__62141 = c__5525__auto___62139;
var G__62142 = cljs.core.count(c__5525__auto___62139);
var G__62143 = (0);
seq__61955_62126 = G__62140;
chunk__61956_62127 = G__62141;
count__61957_62128 = G__62142;
i__61958_62129 = G__62143;
continue;
} else {
var vec__61976_62147 = cljs.core.first(seq__61955_62138__$1);
var tag_62148 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61976_62147,(0),null);
var cb_62149 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61976_62147,(1),null);
cljs.reader.register_tag_parser_BANG_(tag_62148,cb_62149);


var G__62151 = cljs.core.next(seq__61955_62138__$1);
var G__62152 = null;
var G__62153 = (0);
var G__62154 = (0);
seq__61955_62126 = G__62151;
chunk__61956_62127 = G__62152;
count__61957_62128 = G__62153;
i__61958_62129 = G__62154;
continue;
}
} else {
}
}
break;
}
datascript.core.last_tempid = cljs.core.atom.cljs$core$IFn$_invoke$arity$1((-1000000));
/**
 * Allocates and returns an unique temporary id (a negative integer). Ignores `part`. Returns `x` if it is specified.
 * 
 * Exists for Datomic API compatibility. Prefer using negative integers directly if possible.
 */
datascript.core.tempid = (function datascript$core$tempid(var_args){
var G__61981 = arguments.length;
switch (G__61981) {
case 1:
return datascript.core.tempid.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return datascript.core.tempid.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(datascript.core.tempid.cljs$core$IFn$_invoke$arity$1 = (function (part){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(part,new cljs.core.Keyword("db.part","tx","db.part/tx",-1480923213))){
return new cljs.core.Keyword("db","current-tx","db/current-tx",1600722132);
} else {
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(datascript.core.last_tempid,cljs.core.dec);
}
}));

(datascript.core.tempid.cljs$core$IFn$_invoke$arity$2 = (function (part,x){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(part,new cljs.core.Keyword("db.part","tx","db.part/tx",-1480923213))){
return new cljs.core.Keyword("db","current-tx","db/current-tx",1600722132);
} else {
return x;
}
}));

(datascript.core.tempid.cljs$lang$maxFixedArity = 2);

/**
 * Does a lookup in tempids map, returning an entity id that tempid was resolved to.
 * 
 * Exists for Datomic API compatibility. Prefer using map lookup directly if possible.
 */
datascript.core.resolve_tempid = (function datascript$core$resolve_tempid(_db,tempids,tempid){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(tempids,tempid);
});
/**
 * Returns the underlying immutable database value from a connection.
 * 
 * Exists for Datomic API compatibility. Prefer using `@conn` directly if possible.
 */
datascript.core.db = (function datascript$core$db(conn){
if(cljs.core.truth_((datascript.core.conn_QMARK_.cljs$core$IFn$_invoke$arity$1 ? datascript.core.conn_QMARK_.cljs$core$IFn$_invoke$arity$1(conn) : datascript.core.conn_QMARK_.call(null,conn)))){
} else {
throw (new Error("Assert failed: (conn? conn)"));
}

return cljs.core.deref(conn);
});

/**
* @constructor
 * @implements {cljs.core.IDerefWithTimeout}
 * @implements {cljs.core.IPending}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IDeref}
 * @implements {cljs.core.IWithMeta}
*/
datascript.core.t_datascript$core62015 = (function (conn,tx_data,tx_meta,res,meta62016){
this.conn = conn;
this.tx_data = tx_data;
this.tx_meta = tx_meta;
this.res = res;
this.meta62016 = meta62016;
this.cljs$lang$protocol_mask$partition0$ = 491520;
this.cljs$lang$protocol_mask$partition1$ = 1;
});
(datascript.core.t_datascript$core62015.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_62017,meta62016__$1){
var self__ = this;
var _62017__$1 = this;
return (new datascript.core.t_datascript$core62015(self__.conn,self__.tx_data,self__.tx_meta,self__.res,meta62016__$1));
}));

(datascript.core.t_datascript$core62015.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_62017){
var self__ = this;
var _62017__$1 = this;
return self__.meta62016;
}));

(datascript.core.t_datascript$core62015.prototype.cljs$core$IDeref$_deref$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return self__.res;
}));

(datascript.core.t_datascript$core62015.prototype.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3 = (function (_,___$1,___$2){
var self__ = this;
var ___$3 = this;
return self__.res;
}));

(datascript.core.t_datascript$core62015.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return true;
}));

(datascript.core.t_datascript$core62015.getBasis = (function (){
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"conn","conn",1918841190,null),new cljs.core.Symbol(null,"tx-data","tx-data",-1720276008,null),new cljs.core.Symbol(null,"tx-meta","tx-meta",-1495152575,null),new cljs.core.Symbol(null,"res","res",245523648,null),new cljs.core.Symbol(null,"meta62016","meta62016",1599720097,null)], null);
}));

(datascript.core.t_datascript$core62015.cljs$lang$type = true);

(datascript.core.t_datascript$core62015.cljs$lang$ctorStr = "datascript.core/t_datascript$core62015");

(datascript.core.t_datascript$core62015.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"datascript.core/t_datascript$core62015");
}));

/**
 * Positional factory function for datascript.core/t_datascript$core62015.
 */
datascript.core.__GT_t_datascript$core62015 = (function datascript$core$__GT_t_datascript$core62015(conn,tx_data,tx_meta,res,meta62016){
return (new datascript.core.t_datascript$core62015(conn,tx_data,tx_meta,res,meta62016));
});


/**
 * Same as [[transact!]], but returns an immediately realized future.
 * 
 * Exists for Datomic API compatibility. Prefer using [[transact!]] if possible.
 */
datascript.core.transact = (function datascript$core$transact(var_args){
var G__62008 = arguments.length;
switch (G__62008) {
case 2:
return datascript.core.transact.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return datascript.core.transact.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(datascript.core.transact.cljs$core$IFn$_invoke$arity$2 = (function (conn,tx_data){
return datascript.core.transact.cljs$core$IFn$_invoke$arity$3(conn,tx_data,null);
}));

(datascript.core.transact.cljs$core$IFn$_invoke$arity$3 = (function (conn,tx_data,tx_meta){
if(cljs.core.truth_((datascript.core.conn_QMARK_.cljs$core$IFn$_invoke$arity$1 ? datascript.core.conn_QMARK_.cljs$core$IFn$_invoke$arity$1(conn) : datascript.core.conn_QMARK_.call(null,conn)))){
} else {
throw (new Error("Assert failed: (conn? conn)"));
}

var res = (datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,tx_data,tx_meta) : datascript.core.transact_BANG_.call(null,conn,tx_data,tx_meta));
return (new datascript.core.t_datascript$core62015(conn,tx_data,tx_meta,res,cljs.core.PersistentArrayMap.EMPTY));
}));

(datascript.core.transact.cljs$lang$maxFixedArity = 3);


/**
* @constructor
 * @implements {cljs.core.IDerefWithTimeout}
 * @implements {cljs.core.IPending}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IDeref}
 * @implements {cljs.core.IWithMeta}
*/
datascript.core.t_datascript$core62039 = (function (f,res,realized,meta62040){
this.f = f;
this.res = res;
this.realized = realized;
this.meta62040 = meta62040;
this.cljs$lang$protocol_mask$partition0$ = 491520;
this.cljs$lang$protocol_mask$partition1$ = 1;
});
(datascript.core.t_datascript$core62039.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_62041,meta62040__$1){
var self__ = this;
var _62041__$1 = this;
return (new datascript.core.t_datascript$core62039(self__.f,self__.res,self__.realized,meta62040__$1));
}));

(datascript.core.t_datascript$core62039.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_62041){
var self__ = this;
var _62041__$1 = this;
return self__.meta62040;
}));

(datascript.core.t_datascript$core62039.prototype.cljs$core$IDeref$_deref$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.deref(self__.res);
}));

(datascript.core.t_datascript$core62039.prototype.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3 = (function (_,___$1,timeout_val){
var self__ = this;
var ___$2 = this;
if(cljs.core.truth_(cljs.core.deref(self__.realized))){
return cljs.core.deref(self__.res);
} else {
return timeout_val;
}
}));

(datascript.core.t_datascript$core62039.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.deref(self__.realized);
}));

(datascript.core.t_datascript$core62039.getBasis = (function (){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"f","f",43394975,null),new cljs.core.Symbol(null,"res","res",245523648,null),new cljs.core.Symbol(null,"realized","realized",1487343404,null),new cljs.core.Symbol(null,"meta62040","meta62040",2099589045,null)], null);
}));

(datascript.core.t_datascript$core62039.cljs$lang$type = true);

(datascript.core.t_datascript$core62039.cljs$lang$ctorStr = "datascript.core/t_datascript$core62039");

(datascript.core.t_datascript$core62039.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"datascript.core/t_datascript$core62039");
}));

/**
 * Positional factory function for datascript.core/t_datascript$core62039.
 */
datascript.core.__GT_t_datascript$core62039 = (function datascript$core$__GT_t_datascript$core62039(f,res,realized,meta62040){
return (new datascript.core.t_datascript$core62039(f,res,realized,meta62040));
});


datascript.core.future_call = (function datascript$core$future_call(f){
var res = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
var realized = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
setTimeout((function (){
cljs.core.reset_BANG_(res,(f.cljs$core$IFn$_invoke$arity$0 ? f.cljs$core$IFn$_invoke$arity$0() : f.call(null)));

return cljs.core.reset_BANG_(realized,true);
}),(0));

return (new datascript.core.t_datascript$core62039(f,res,realized,cljs.core.PersistentArrayMap.EMPTY));
});
/**
 * In CLJ, calls [[transact!]] on a future thread pool, returning immediately.
 * 
 * In CLJS, just calls [[transact!]] and returns a realized future.
 */
datascript.core.transact_async = (function datascript$core$transact_async(var_args){
var G__62065 = arguments.length;
switch (G__62065) {
case 2:
return datascript.core.transact_async.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return datascript.core.transact_async.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(datascript.core.transact_async.cljs$core$IFn$_invoke$arity$2 = (function (conn,tx_data){
return datascript.core.transact_async.cljs$core$IFn$_invoke$arity$3(conn,tx_data,null);
}));

(datascript.core.transact_async.cljs$core$IFn$_invoke$arity$3 = (function (conn,tx_data,tx_meta){
if(cljs.core.truth_((datascript.core.conn_QMARK_.cljs$core$IFn$_invoke$arity$1 ? datascript.core.conn_QMARK_.cljs$core$IFn$_invoke$arity$1(conn) : datascript.core.conn_QMARK_.call(null,conn)))){
} else {
throw (new Error("Assert failed: (conn? conn)"));
}

return datascript.core.future_call((function (){
return (datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,tx_data,tx_meta) : datascript.core.transact_BANG_.call(null,conn,tx_data,tx_meta));
}));
}));

(datascript.core.transact_async.cljs$lang$maxFixedArity = 3);

/**
 * Generates a UUID that grow with time. Such UUIDs will always go to the end  of the index and that will minimize insertions in the middle.
 * 
 * Consist of 64 bits of current UNIX timestamp (in seconds) and 64 random bits (2^64 different unique values per second).
 */
datascript.core.squuid = datascript.util.squuid;
/**
 * Returns time that was used in [[squuid]] call, in milliseconds, rounded to the closest second.
 */
datascript.core.squuid_time_millis = datascript.util.squuid_time_millis;
/**
 * Returns IStorage used by DB instance
 */
datascript.core.storage = datascript.storage.storage;
/**
 * Stores databases to provided storage. If database was created
 *    with :storage option or restored from storage, use single-argument version.
 * 
 *    Subsequent stores are incremental, i.e. only newly added nodes will be actually stored.
 * 
 *    Storing already stored dbs into another storage is not supported (may change).
 */
datascript.core.store = datascript.storage.store;
/**
 * Lazy-loads database from storage. Ultra-fast, fetches the rest as it’s needed
 */
datascript.core.restore = datascript.storage.restore;
datascript.core.settings = (function datascript$core$settings(db){
return me.tonsky.persistent_sorted_set.settings(new cljs.core.Keyword(null,"eavt","eavt",-666437073).cljs$core$IFn$_invoke$arity$1(db));
});

//# sourceMappingURL=datascript.core.js.map
