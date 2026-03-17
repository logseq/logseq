(ns frontend.worker.sync
  "Simple db-sync client based on promesa + WebSocket."
  (:require [cljs-bean.core :as bean]
            [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [datascript.storage :refer [IStorage]]
            [frontend.common.crypt :as crypt]
            [frontend.worker-common.util :as worker-util]
            [frontend.worker.handler.page :as worker-page]
            [frontend.worker.shared-service :as shared-service]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.client-op :as client-op]
            [frontend.worker.sync.const :as rtc-const]
            [frontend.worker.sync.crypt :as sync-crypt]
            [lambdaisland.glogi :as log]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db-sync.checksum :as sync-checksum]
            [logseq.db-sync.cycle :as sync-cycle]
            [logseq.db-sync.malli-schema :as db-sync-schema]
            [logseq.db-sync.order :as sync-order]
            [logseq.db.common.normalize :as db-normalize]
            [logseq.db.common.sqlite :as common-sqlite]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.transaction :as outliner-tx]
            [promesa.core :as p]))

(defonce *repo->latest-remote-tx (atom {}))
(defonce *start-inflight-target (atom nil))
(defonce ^:private *upload-temp-opfs-pool (atom nil))

(declare fail-fast)

(defn- current-client
  [repo]
  (let [client @worker-state/*db-sync-client]
    (when (= repo (:repo client))
      client)))

(defn- client-ops-conn [repo]
  (worker-state/get-client-ops-conn repo))

(defn- sync-counts
  [repo]
  (when (worker-state/get-datascript-conn repo)
    (let [pending-local (when-let [conn (client-ops-conn repo)]
                          (count (d/datoms @conn :avet :db-sync/created-at)))
          pending-asset (client-op/get-unpushed-asset-ops-count repo)
          local-tx (client-op/get-local-tx repo)
          remote-tx (get @*repo->latest-remote-tx repo)
          pending-server (when (and (number? local-tx) (number? remote-tx))
                           (max 0 (- remote-tx local-tx)))
          graph-uuid (client-op/get-graph-uuid repo)]
      {:pending-local pending-local
       :pending-asset pending-asset
       :pending-server pending-server
       :local-tx local-tx
       :remote-tx remote-tx
       :graph-uuid graph-uuid})))

(defn- local-sync-checksum
  [repo]
  (if-let [checksum (client-op/get-local-checksum repo)]
    checksum
    (if-let [conn (worker-state/get-datascript-conn repo)]
      (let [checksum (sync-checksum/recompute-checksum @conn)]
        (client-op/update-local-checksum repo checksum)
        checksum)
      (fail-fast :db-sync/missing-db {:repo repo :op :checksum}))))

(defn- recompute-local-sync-checksum!
  [repo]
  (if-let [conn (worker-state/get-datascript-conn repo)]
    (let [checksum (sync-checksum/recompute-checksum @conn)]
      (client-op/update-local-checksum repo checksum)
      checksum)
    (fail-fast :db-sync/missing-db {:repo repo :op :checksum-recompute})))

(defn update-local-sync-checksum!
  [repo tx-report]
  (when (worker-state/get-client-ops-conn repo)
    (client-op/update-local-checksum
     repo
     (sync-checksum/update-checksum (client-op/get-local-checksum repo) tx-report))))

(defn- pending-local-tx?
  [repo]
  (when-let [conn (client-ops-conn repo)]
    (boolean (first (d/datoms @conn :avet :db-sync/created-at)))))

(defn- checksum-compare-ready?
  [repo client local-t remote-t]
  (and (= local-t remote-t)
       (not (pending-local-tx? repo))
       (empty? @(:inflight client))))

(defn- verify-sync-checksum!
  [repo client local-t remote-t remote-checksum context]
  (when (and (string? remote-checksum)
             (checksum-compare-ready? repo client local-t remote-t))
    (let [local-checksum (local-sync-checksum repo)]
      (when-not (= local-checksum remote-checksum)
        (let [real-local-checksum (recompute-local-sync-checksum! repo)]
          (when-not (= real-local-checksum remote-checksum)
            (fail-fast :db-sync/checksum-mismatch
                       (merge context
                              {:type :db-sync/checksum-mismatch
                               :repo repo
                               :message-type (:type context)
                               :local-t local-t
                               :remote-t remote-t
                               :local-checksum local-checksum
                               :real-local-checksum real-local-checksum
                               :remote-checksum remote-checksum}))))))))

(defn- normalize-online-users
  [users]
  (->> users
       (keep (fn [{:keys [user-id email username name]}]
               (when (string? user-id)
                 (let [display-name (or username name user-id)]
                   (cond-> {:user/uuid user-id
                            :user/name display-name}
                     (string? email) (assoc :user/email email))))))
       (common-util/distinct-by :user/uuid)
       (vec)))

(defn- broadcast-rtc-state!
  [client]
  (when client
    (let [repo (:repo client)
          ws-state @(:ws-state client)
          online-users @(:online-users client)
          {:keys [pending-local pending-asset pending-server local-tx remote-tx graph-uuid]} (sync-counts repo)]
      (shared-service/broadcast-to-clients!
       :rtc-sync-state
       {:rtc-state {:ws-state ws-state}
        :rtc-lock (= :open ws-state)
        :online-users (or online-users [])
        :unpushed-block-update-count (or pending-local 0)
        :pending-asset-ops-count (or pending-asset 0)
        :pending-server-ops-count (or pending-server 0)
        :local-tx local-tx
        :remote-tx remote-tx
        :graph-uuid graph-uuid}))))

(defn- set-ws-state!
  [client ws-state]
  (when-let [*ws-state (:ws-state client)]
    (reset! *ws-state ws-state)
    (broadcast-rtc-state! client)))

(defn- update-online-users!
  [client users]
  (when-let [*online-users (:online-users client)]
    (let [users' (normalize-online-users users)]
      (when (not= users' @*online-users)
        (reset! *online-users users')
        (broadcast-rtc-state! client)))))

(defn- update-user-presence!
  [client user-id* editing-block-uuid]
  (when (and user-id* editing-block-uuid)
    (when-let [*online-users (:online-users client)]
      (swap! *online-users
             (fn [users]
               (mapv (fn [user]
                       (if (= user-id* (:user/uuid user))
                         (assoc user :user/editing-block-uuid editing-block-uuid)
                         user)) users)))
      (broadcast-rtc-state! client))))

(defn- ws-base-url
  []
  (:ws-url @worker-state/*db-sync-config))

(defn http-base-url
  []
  (or (:http-base @worker-state/*db-sync-config)
      (when-let [ws-url (ws-base-url)]
        (let [base (cond
                     (string/starts-with? ws-url "wss://")
                     (str "https://" (subs ws-url (count "wss://")))

                     (string/starts-with? ws-url "ws://")
                     (str "http://" (subs ws-url (count "ws://")))

                     :else ws-url)]
          (string/replace base #"/sync/%s$" "")))))

(defn- auth-token []
  (worker-state/get-id-token))

(defn- id-token-expired?
  [token]
  (if-not (string? token)
    true
    (try
      (let [exp-ms (some-> token worker-util/parse-jwt :exp (* 1000))]
        (or (not (number? exp-ms))
            (<= exp-ms (common-util/time-ms))))
      (catch :default _
        true))))

(defn- <resolve-ws-token
  []
  (let [token (auth-token)]
    (if (id-token-expired? token)
      (p/let [resp (worker-state/<invoke-main-thread :thread-api/ensure-id&access-token)
              refreshed-token (:id-token resp)]
        (when (string? refreshed-token)
          (worker-state/set-new-state! {:auth/id-token refreshed-token})
          refreshed-token))
      (p/resolved token))))

(defn- get-user-uuid []
  (some-> (worker-state/get-id-token)
          worker-util/parse-jwt
          :sub))

(defn- auth-headers []
  (when-let [token (auth-token)]
    {"authorization" (str "Bearer " token)}))

(defn- with-auth-headers [opts]
  (if-let [auth (auth-headers)]
    (assoc opts :headers (merge (or (:headers opts) {}) auth))
    opts))

(def ^:private max-asset-size (* 100 1024 1024))
(def ^:private upload-kvs-batch-size 2000)
(def ^:private upload-prepare-datoms-batch-size 100000)
(def ^:private upload-temp-pool-name (worker-util/get-pool-name "upload-temp"))
(def ^:private snapshot-content-type "application/transit+json")
(def ^:private snapshot-content-encoding "gzip")
(def ^:private snapshot-text-encoder (js/TextEncoder.))
(def ^:private reconnect-base-delay-ms 1000)
(def ^:private reconnect-max-delay-ms 30000)
(def ^:private reconnect-jitter-ms 250)
(def ^:private ws-stale-kill-interval-ms 60000)
;; kill ws when 10-mins inactive
(def ^:private ws-stale-timeout-ms 600000)
(def ^:private large-title-byte-limit 4096)
(def ^:private large-title-asset-type "txt")
(def ^:private large-title-object-attr :logseq.property.sync/large-title-object)
(def ^:private text-encoder (js/TextEncoder.))
(def ^:private text-decoder (js/TextDecoder.))

(defn- format-ws-url [base graph-id]
  (cond
    (string/includes? base "%s")
    (string/replace base "%s" graph-id)

    (string/ends-with? base "/")
    (str base graph-id)

    :else
    (str base "/" graph-id)))

(defn- append-token [url token]
  (if (string? token)
    (let [separator (if (string/includes? url "?") "&" "?")]
      (str url separator "token=" (js/encodeURIComponent token)))
    url))

(defn- utf8-byte-length [value]
  (when (string? value)
    (.-length (.encode text-encoder value))))

(defn- large-title? [value]
  (when-let [byte-length (utf8-byte-length value)]
    (> byte-length large-title-byte-limit)))

(defn- assoc-datom-value
  [datom new-value]
  (let [[op e a _v & others] datom]
    (into [op e a new-value] others)))

(defn- large-title-object
  [asset-uuid asset-type]
  {:asset-uuid asset-uuid
   :asset-type asset-type})

(defn- large-title-object?
  [value]
  (and (map? value)
       (string? (:asset-uuid value))
       (string? (:asset-type value))))

(defn- get-graph-id [repo]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [db @conn
          graph-uuid (ldb/get-graph-rtc-uuid db)]
      (when graph-uuid
        (str graph-uuid)))))

(defn- ensure-client-graph-uuid! [repo graph-id]
  (when (seq graph-id)
    (client-op/update-graph-uuid repo graph-id)))

(defn- ready-state [ws]
  (.-readyState ws))

(defn- ws-open? [ws]
  (= 1 (ready-state ws)))

(def ^:private invalid-coerce ::invalid-coerce)

(defn- coerce
  [coercer value context]
  (try
    (coercer value)
    (catch :default e
      (log/error :db-sync/malli-coerce-failed (merge context {:error e :value value}))
      invalid-coerce)))

(defn- coerce-ws-client-message [message]
  (when message
    (let [coerced (coerce db-sync-schema/ws-client-message-coercer message {:schema :ws/client})]
      (when-not (= coerced invalid-coerce)
        coerced))))

(defn- coerce-ws-server-message [message]
  (when message
    (let [coerced (coerce db-sync-schema/ws-server-message-coercer message {:schema :ws/server})]
      (when-not (= coerced invalid-coerce)
        coerced))))

(defn fail-fast [tag data]
  (log/error tag data)
  (throw (ex-info (name tag) data)))

(declare offload-large-titles)

(defn- require-number [value context]
  (when-not (number? value)
    (fail-fast :db-sync/invalid-field (assoc context :value value))))

(defn- require-non-negative [value context]
  (require-number value context)
  (when (neg? value)
    (fail-fast :db-sync/invalid-field (assoc context :value value))))

(defn- require-seq [value context]
  (when-not (sequential? value)
    (fail-fast :db-sync/invalid-field (assoc context :value value))))

(defn- parse-transit [value context]
  (try
    (sqlite-util/read-transit-str value)
    (catch :default e
      (fail-fast :db-sync/response-parse-failed (assoc context :error e)))))

(defn- coerce-http-response [schema-key body]
  (if-let [coercer (get db-sync-schema/http-response-coercers schema-key)]
    (let [coerced (coerce coercer body {:schema schema-key :dir :response})]
      (when-not (= coerced invalid-coerce)
        coerced))
    body))

(defn- reconnect-delay-ms [attempt]
  (let [exp (js/Math.pow 2 attempt)
        delay (min reconnect-max-delay-ms (* reconnect-base-delay-ms exp))
        jitter (rand-int reconnect-jitter-ms)]
    (+ delay jitter)))

(defn- clear-reconnect-timer! [reconnect]
  (when-let [timer (:timer @reconnect)]
    (js/clearTimeout timer)
    (swap! reconnect assoc :timer nil)))

(defn- reset-reconnect! [client]
  (when-let [reconnect (:reconnect client)]
    (clear-reconnect-timer! reconnect)
    (swap! reconnect assoc :attempt 0)))

(defn- clear-stale-ws-loop-timer! [client]
  (when-let [*timer (:stale-kill-timer client)]
    (when-let [timer @*timer]
      (js/clearInterval timer)
      (reset! *timer nil))))

(defn- touch-last-ws-message! [client]
  (when-let [*ts (:last-ws-message-ts client)]
    (reset! *ts (common-util/time-ms))))

(defn- send! [ws message]
  (when (ws-open? ws)
    (if-let [coerced (coerce-ws-client-message message)]
      (.send ws (js/JSON.stringify (clj->js coerced)))
      (log/error :db-sync/ws-request-invalid {:message message}))))

(defn update-presence!
  [editing-block-uuid]
  (when-let [client @worker-state/*db-sync-client]
    (when-let [ws (:ws client)]
      (send! ws {:type "presence"
                 :editing-block-uuid editing-block-uuid}))))

(def rtc-ignored-attrs
  (set/union
   #{:logseq.property.embedding/hnsw-label-updated-at
     :block/tx-id}
   rtc-const/ignore-attrs-when-syncing
   rtc-const/ignore-entities-when-init-upload))

(defn- remove-ignored-attrs
  [tx-data]
  (remove (fn [d] (contains? rtc-ignored-attrs (:a d)))
          tx-data))

(defn- normalize-tx-data
  [db-after db-before tx-data]
  (->> tx-data
       remove-ignored-attrs
       (db-normalize/normalize-tx-data db-after db-before)
       (remove (fn [[_op e]]
                 (contains? rtc-const/ignore-entities-when-init-upload e)))))

(defn- reverse-tx-data
  [tx-data]
  (->> tx-data
       (map (fn [[e a v t added]]
              [(if added :db/retract :db/add) e a v t]))))

(defn- reverse-normalized-tx-data
  [tx-data]
  (mapv (fn [[op e a v t]]
          [(if (= :db/add op) :db/retract :db/add) e a v t])
        tx-data))

(defn- parse-message [raw]
  (try
    (js->clj (js/JSON.parse raw) :keywordize-keys true)
    (catch :default _
      nil)))

(defn- fetch-json
  [url opts {:keys [response-schema error-schema] :or {error-schema :error}}]
  (p/let [resp (js/fetch url (clj->js (with-auth-headers opts)))
          text (.text resp)
          data (when (seq text) (js/JSON.parse text))]
    (if (.-ok resp)
      (let [body (js->clj data :keywordize-keys true)
            body (if response-schema
                   (coerce-http-response response-schema body)
                   body)]
        (if (or (nil? response-schema) body)
          body
          (throw (ex-info "db-sync invalid response"
                          {:status (.-status resp)
                           :url url
                           :body body}))))
      (let [body (when data (js->clj data :keywordize-keys true))
            body (if error-schema
                   (coerce-http-response error-schema body)
                   body)]
        (throw (ex-info "db-sync request failed"
                        {:status (.-status resp)
                         :url url
                         :body body}))))))

(defn- upsert-addr-content!
  [^js db data]
  (.transaction
   db
   (fn [tx]
     (doseq [item data]
       (.exec tx #js {:sql (str "INSERT INTO kvs (addr, content, addresses) "
                                "values ($addr, $content, $addresses) "
                                "on conflict(addr) do update set content = $content, addresses = $addresses")
                      :bind item})))))

(defn- restore-data-from-addr
  [^js db addr]
  (when-let [result (-> (.exec db #js {:sql "select content, addresses from kvs where addr = ?"
                                       :bind #js [addr]
                                       :rowMode "array"})
                        first)]
    (let [[content addresses] (bean/->clj result)
          addresses (when addresses (js/JSON.parse addresses))
          data (sqlite-util/transit-read content)]
      (if (and addresses (map? data))
        (assoc data :addresses addresses)
        data))))

(defn- new-temp-sqlite-storage
  [^js db]
  (reify IStorage
    (-store [_ addr+data-seq _delete-addrs]
      (let [data (map
                  (fn [[addr data]]
                    (let [data' (if (map? data) (dissoc data :addresses) data)
                          addresses (when (map? data)
                                      (when-let [addresses (:addresses data)]
                                        (js/JSON.stringify (bean/->js addresses))))]
                      #js {:$addr addr
                           :$content (sqlite-util/transit-write data')
                           :$addresses addresses}))
                  addr+data-seq)]
        (upsert-addr-content! db data)))
    (-restore [_ addr]
      (restore-data-from-addr db addr))))

(defn- <get-upload-temp-sqlite-pool
  []
  (if-let [pool @*upload-temp-opfs-pool]
    (p/resolved pool)
    (if-let [sqlite @worker-state/*sqlite]
      (p/let [^js pool (.installOpfsSAHPoolVfs ^js sqlite #js {:name upload-temp-pool-name
                                                               :initialCapacity 20})]
        (reset! *upload-temp-opfs-pool pool)
        pool)
      (fail-fast :db-sync/missing-field {:field :sqlite}))))

(defn- upload-temp-sqlite-path
  []
  (str "/upload-" (random-uuid) ".sqlite"))

(defn- <create-temp-sqlite-db!
  []
  (p/let [^js pool (<get-upload-temp-sqlite-pool)
          capacity (.getCapacity pool)
          _ (when (zero? capacity)
              (.unpauseVfs pool))
          path (upload-temp-sqlite-path)
          ^js db (new (.-OpfsSAHPoolDb pool) path)]
    (common-sqlite/create-kvs-table! db)
    {:db db
     :path path
     :pool pool}))

(defn- <create-temp-sqlite-conn
  ([schema]
   (<create-temp-sqlite-conn schema []))
  ([schema datoms]
   (p/let [{:keys [db path pool]} (<create-temp-sqlite-db!)
           storage (new-temp-sqlite-storage db)
           conn (d/conn-from-datoms datoms schema {:storage storage})]
     {:db db
      :conn conn
      :path path
      :pool pool})))

(defn- <remove-upload-temp-sqlite-db-file!
  [path]
  (-> (p/let [^js root (.getDirectory js/navigator.storage)
              ^js dir (.getDirectoryHandle root (str "." upload-temp-pool-name))]
        (.removeEntry dir (subs path 1)))
      (p/catch
       (fn [error]
         (if (= "NotFoundError" (.-name error))
           nil
           (p/rejected error))))))

(defn- cleanup-temp-sqlite!
  [{:keys [db conn path]}]
  (when conn
    (reset! conn nil))
  (when db
    (.close db))
  (when path
    (<remove-upload-temp-sqlite-db-file! path)))

(defn- require-asset-field
  [repo field value context]
  (when (or (nil? value) (and (string? value) (string/blank? value)))
    (fail-fast :db-sync/missing-field
               (merge {:repo repo :field field :value value} context))))

(declare replace-string-block-tempids-with-lookups)

(defn- persist-local-tx! [repo normalized-tx-data reversed-datoms tx-meta]
  (when-let [conn (client-ops-conn repo)]
    (let [tx-id (random-uuid)
          now (.now js/Date)]
      (ldb/transact! conn [{:db-sync/tx-id tx-id
                            :db-sync/normalized-tx-data normalized-tx-data
                            :db-sync/reversed-tx-data reversed-datoms
                            :db-sync/outliner-op (:outliner-op tx-meta)
                            :db-sync/created-at now}])
      (when-let [client (current-client repo)]
        (broadcast-rtc-state! client))
      tx-id)))

(defn- pending-txs
  [repo & {:keys [limit]}]
  (when-let [conn (client-ops-conn repo)]
    (let [db @conn
          graph-db (some-> (worker-state/get-datascript-conn repo) deref)
          datoms (d/datoms db :avet :db-sync/created-at)
          datoms' (if limit (take limit datoms) datoms)]
      (->> datoms'
           (map (fn [datom]
                  (d/entity db (:e datom))))
           (keep (fn [ent]
                   (let [tx-id (:db-sync/tx-id ent)]
                     {:tx-id tx-id
                      :outliner-op (:db-sync/outliner-op ent)
                      :tx (replace-string-block-tempids-with-lookups
                           graph-db
                           (:db-sync/normalized-tx-data ent))
                      :reversed-tx (replace-string-block-tempids-with-lookups
                                    graph-db
                                    (:db-sync/reversed-tx-data ent))})))
           vec))))

(defn- remove-pending-txs!
  [repo tx-ids]
  (when (seq tx-ids)
    (when-let [conn (client-ops-conn repo)]
      (ldb/transact! conn
                     (mapv (fn [tx-id]
                             [:db/retractEntity [:db-sync/tx-id tx-id]])
                           tx-ids))
      (when-let [client (current-client repo)]
        (broadcast-rtc-state! client)))))

(comment
  (defn- clear-pending-txs!
    [repo]
    (when-let [conn (client-ops-conn repo)]
      (let [tx-data (->> (d/datoms @conn :avet :db-sync/created-at)
                         (map (fn [d]
                                [:db/retractEntity (:e d)])))]
        (d/transact! conn tx-data)))))

(defn get-lookup-id
  [x]
  (when (and (vector? x)
             (= 2 (count x))
             (= :block/uuid (first x)))
    (second x)))

(defn- created-block-uuid-entry
  [item]
  (when (and (vector? item)
             (= :db/add (first item))
             (>= (count item) 4)
             (= :block/uuid (nth item 2)))
    [(second item) (nth item 3)]))

(defn- created-block-uuids
  [tx-data]
  (->> tx-data
       (keep created-block-uuid-entry)
       (map second)
       set))

(defn- created-block-uuid-by-entity-id
  [tx-data]
  (->> tx-data
       (keep created-block-uuid-entry)
       (into {})))

(defn- created-block-context
  [tx-data]
  (let [uuid-by-entity-id (created-block-uuid-by-entity-id tx-data)]
    {:uuid-by-entity-id uuid-by-entity-id
     :uuids (set (vals uuid-by-entity-id))}))

(defn- tx-created-block-uuid
  [{:keys [uuid-by-entity-id uuids]} entity-id]
  (or (get uuid-by-entity-id entity-id)
      (let [lookup-id (get-lookup-id entity-id)]
        (when (contains? uuids lookup-id)
          lookup-id))))

(defn- add-datom-ref-block-uuids
  [item]
  (when (and (vector? item)
             (= :db/add (first item)))
    (cond-> []
      (get-lookup-id (second item))
      (conj (get-lookup-id (second item)))

      (and (>= (count item) 4)
           (get-lookup-id (nth item 3)))
      (conj (get-lookup-id (nth item 3))))))

(defn- drop-missing-created-block-datoms
  [db tx-data]
  (if db
    (let [{:keys [uuid-by-entity-id]} (created-block-context tx-data)
          missing-created-uuids (->> (vals uuid-by-entity-id)
                                     (remove #(d/entity db [:block/uuid %]))
                                     set)]
      (if (seq missing-created-uuids)
        (remove (fn [item]
                  (when (vector? item)
                    (let [entity-lookup-id (get-lookup-id (second item))
                          value-lookup-id (when (>= (count item) 4)
                                            (get-lookup-id (nth item 3)))
                          created-uuid (or (get uuid-by-entity-id (second item))
                                           entity-lookup-id)]
                      (or (contains? missing-created-uuids created-uuid)
                          (contains? missing-created-uuids entity-lookup-id)
                          (contains? missing-created-uuids value-lookup-id)))))
                tx-data)
        tx-data))
    tx-data))

(defn- deleted-block-pred
  [deleted-blocks]
  (cond
    (fn? deleted-blocks) deleted-blocks
    (nil? deleted-blocks) (constantly false)
    :else #(contains? deleted-blocks %)))

(defn- entity->block-uuid
  [db x]
  (or (get-lookup-id x)
      (when (and db (number? x) (not (neg? x)))
        (:block/uuid (d/entity db x)))))

(defn- missing-block-ref?
  [db x]
  (and db
       (or (and (vector? x)
                (some? (get-lookup-id x))
                (nil? (d/entity db x)))
           (and (number? x)
                (not (neg? x))
                (nil? (d/entity db x))))))

(defn- invalid-block-ref?
  [db deleted-block? x]
  (let [block-uuid (entity->block-uuid db x)]
    (or (deleted-block? block-uuid)
        (missing-block-ref? db x))))

(defn- ref-attr?
  [db a]
  (and db
       (keyword? a)
       (= :db.type/ref
          (:db/valueType (d/entity db a)))))

(defn- tx-entity-key
  [entity]
  (or (get-lookup-id entity)
      entity))

(defn- strip-tx-id
  [item]
  (if (= (count item) 5)
    (vec (butlast item))
    item))

(defn- drop-orphaning-parent-retracts
  [tx-data]
  (let [entities-with-parent-add (->> tx-data
                                      (keep (fn [item]
                                              (when (and (vector? item)
                                                         (= :db/add (first item))
                                                         (= :block/parent (nth item 2 nil)))
                                                (tx-entity-key (second item)))))
                                      set)]
    (remove (fn [item]
              (and (vector? item)
                   (= :db/retract (first item))
                   (= :block/parent (nth item 2 nil))
                   (not (contains? entities-with-parent-add
                                   (tx-entity-key (second item))))))
            tx-data)))

(defn- created-block-ref?
  [created-context x]
  (when-let [block-uuid (or (tx-created-block-uuid created-context x)
                            (get-lookup-id x))]
    (contains? (:uuids created-context) block-uuid)))

(defn- invalid-block-uuid?
  [db deleted-block? created-context broken-block-uuids block-uuid]
  (and block-uuid
       (or (deleted-block? block-uuid)
           (contains? broken-block-uuids block-uuid)
           (and (not (contains? (:uuids created-context) block-uuid))
                (nil? (d/entity db [:block/uuid block-uuid]))))))

(defn- add-datom-invalid-block-ref?
  [db deleted-block? created-context broken-block-uuids item]
  (some (partial invalid-block-uuid? db deleted-block? created-context broken-block-uuids)
        (add-datom-ref-block-uuids item)))

(defn- broken-created-block-uuids
  [db deleted-block? created-context tx-data]
  (loop [broken-block-uuids #{}]
    (let [next-broken-block-uuids (->> tx-data
                                       (keep (fn [item]
                                               (when (and (vector? item)
                                                          (= :db/add (first item))
                                                          (add-datom-invalid-block-ref? db deleted-block? created-context broken-block-uuids item))
                                                 (tx-created-block-uuid created-context (second item)))))
                                       (into broken-block-uuids))]
      (if (= broken-block-uuids next-broken-block-uuids)
        broken-block-uuids
        (recur next-broken-block-uuids)))))

(defn- invalid-block-ref-datom?
  [db deleted-block? created-context broken-block-uuids item]
  (when (vector? item)
    (let [op (first item)
          e (second item)
          a (nth item 2 nil)
          has-value? (>= (count item) 4)
          v (when has-value? (nth item 3))
          block-uuid (tx-created-block-uuid created-context e)
          value-ref? (and has-value?
                          (contains? #{:db/add :db/retract} op)
                          (ref-attr? db a))]
      (or (and (= :db/add op)
               (add-datom-invalid-block-ref? db deleted-block? created-context broken-block-uuids item))
          (contains? broken-block-uuids block-uuid)
          (and (contains? #{:db/add :db/retract :db/retractEntity} op)
               (not (created-block-ref? created-context e))
               (invalid-block-ref? db deleted-block? e))
          (and value-ref?
               (not (created-block-ref? created-context v))
               (invalid-block-ref? db deleted-block? v))))))

(defn- drop-invalid-block-ref-datoms
  [db deleted-blocks tx-data]
  (let [deleted-block? (deleted-block-pred deleted-blocks)
        created-context (created-block-context tx-data)]
    (remove (partial invalid-block-ref-datom? db deleted-block? created-context #{})
            tx-data)))

(defn- drop-missing-block-ref-datoms
  ([db tx-data]
   (drop-missing-block-ref-datoms db tx-data #{}))
  ([db tx-data deleted-blocks]
   (if db
     (let [deleted-block? (deleted-block-pred deleted-blocks)
           created-context (created-block-context tx-data)
           broken-block-uuids (broken-created-block-uuids db deleted-block? created-context tx-data)]
       (remove (fn [item]
                 (when (vector? item)
                   (let [op (first item)
                         block-uuid (tx-created-block-uuid created-context (second item))]
                     (or (and (= :db/add op)
                              (add-datom-invalid-block-ref? db deleted-block? created-context broken-block-uuids item))
                         (contains? broken-block-uuids block-uuid)))))
               tx-data))
     tx-data)))

(defn- canonical-entity-id
  [db e]
  (cond
    (vector? e) (or (get-lookup-id e) e)
    (and (number? e) (not (neg? e))) (or (:block/uuid (d/entity db e)) e)
    :else e))

(defn- remote-updated-attr-keys
  [db tx-data]
  (->> tx-data
       (keep (fn [item]
               (when (and (vector? item)
                          (>= (count item) 4)
                          (contains? #{:db/add :db/retract} (first item)))
                 [(canonical-entity-id db (second item))
                  (nth item 2)])))
       set))

(defn- resolve-string-block-tempid
  [db x]
  (when (and db (string? x))
    (when-let [block-uuid (parse-uuid x)]
      (when (d/entity db [:block/uuid block-uuid])
        [:block/uuid block-uuid]))))

(defn- replace-string-block-tempids-with-lookups
  [db tx-data]
  (if db
    (let [created-string-entity-ids (->> tx-data
                                         (keep (fn [item]
                                                 (when (and (vector? item)
                                                            (= :db/add (first item))
                                                            (>= (count item) 4)
                                                            (string? (second item))
                                                            (= :block/uuid (nth item 2)))
                                                   (second item))))
                                         set)
          replace-entity (fn [entity]
                           (if (contains? created-string-entity-ids entity)
                             entity
                             (or (resolve-string-block-tempid db entity)
                                 entity)))]
      (mapv (fn [item]
              (if (and (vector? item) (>= (count item) 2))
                (let [op (first item)
                      entity' (replace-entity (second item))
                      has-value? (>= (count item) 4)
                      attr (nth item 2 nil)
                      value (when has-value? (nth item 3))
                      value' (if (and has-value?
                                      (contains? db-schema/ref-type-attributes attr))
                               (replace-entity value)
                               value)]
                  (cond-> item
                    (and (contains? #{:db/add :db/retract :db/retractEntity} op)
                         (not= (second item) entity'))
                    (assoc 1 entity')
                    (and has-value? (not= value value'))
                    (assoc 3 value')))
                item))
            tx-data))
    tx-data))

(defn- drop-remote-conflicted-local-tx
  [db remote-updated-keys tx-data]
  (if (seq remote-updated-keys)
    (remove (fn [item]
              (and (vector? item)
                   (>= (count item) 4)
                   (contains? #{:db/add :db/retract} (first item))
                   (contains? remote-updated-keys
                              [(canonical-entity-id db (second item))
                               (nth item 2)])))
            tx-data)
    tx-data))

(defn- sanitize-tx-data
  [db tx-data deleted-blocks]
  (let [deleted-block? (deleted-block-pred deleted-blocks)
        sanitized-tx-data (->> tx-data
                               (db-normalize/replace-attr-retract-with-retract-entity-v2 db)
                               (remove (fn [item]
                                         (= :db/retractEntity (first item))))
                               ;; Notice: rebase should generate larger tx-id than reverse tx
                               (map strip-tx-id)
                               (#(drop-missing-block-ref-datoms db % deleted-block?))
                               (#(drop-invalid-block-ref-datoms db deleted-block? %))
                               drop-orphaning-parent-retracts)]
    ;; (when (not= tx-data sanitized-tx-data)
    ;;   (prn :debug :tx-data tx-data)
    ;;   (prn :debug :sanitized-tx-data sanitized-tx-data))
    sanitized-tx-data))

(defn- tx-target-block-uuids
  [tx-data]
  (let [entity-targets (->> tx-data
                            (keep (fn [item]
                                    (when (and (vector? item)
                                               (= :db/add (first item)))
                                      (get-lookup-id (second item)))))
                            set)]
    (into entity-targets
          (created-block-uuids tx-data))))

(defn- tx-retract-block-uuids
  [db tx-data]
  (->> tx-data
       (keep (fn [item]
               (when (vector? item)
                 (let [op (first item)
                       entity-id (second item)
                       attr (nth item 2 nil)
                       value (nth item 3 nil)]
                   (cond
                     (= :db/retractEntity op)
                     (or (get-lookup-id entity-id)
                         (:block/uuid (d/entity db entity-id)))

                     (and (= :db/retract op)
                          (= :block/uuid attr))
                     (or (get-lookup-id entity-id)
                         value
                         (:block/uuid (d/entity db entity-id)))

                     :else
                     nil)))))
       set))

(defn- deleted-subtree-pred
  [db deleted-root-uuids retained-uuids]
  (let [*cache (atom {})]
    (fn deleted-subtree? [block-uuid]
      (cond
        (nil? block-uuid)
        false

        (contains? retained-uuids block-uuid)
        false

        (contains? deleted-root-uuids block-uuid)
        true

        :else
        (if (contains? @*cache block-uuid)
          (get @*cache block-uuid)
          (let [deleted? (loop [current (d/entity db [:block/uuid block-uuid])
                                seen #{}]
                           (if (and current
                                    (not (contains? seen (:db/id current))))
                             (let [current-uuid (:block/uuid current)]
                               (cond
                                 (contains? retained-uuids current-uuid)
                                 false

                                 (contains? deleted-root-uuids current-uuid)
                                 true

                                 :else
                                 (recur (:block/parent current)
                                        (conj seen (:db/id current)))))
                             false))]
            (swap! *cache assoc block-uuid deleted?)
            deleted?))))))

(defn- surviving-deleted-block-uuids
  [db-before db-after deleted-root-uuids deleted-subtree?]
  (loop [queue (seq deleted-root-uuids)
         seen #{}
         deleted-uuids #{}]
    (if-let [block-uuid (first queue)]
      (let [children (->> (:block/_parent (d/entity db-before [:block/uuid block-uuid]))
                          (keep :block/uuid)
                          (remove seen))
            deleted-uuids' (cond-> deleted-uuids
                             (and (deleted-subtree? block-uuid)
                                  (d/entity db-after [:block/uuid block-uuid]))
                             (conj block-uuid))]
        (recur (concat (rest queue) children)
               (into seen (cons block-uuid children))
               deleted-uuids'))
      deleted-uuids)))

(defn- deleted-context
  [{:keys [root-uuids deleted-block? deleted-uuids]
    :or {root-uuids #{}
         deleted-block? (constantly false)
         deleted-uuids #{}}}]
  {:root-uuids root-uuids
   :deleted-block? deleted-block?
   :deleted-uuids deleted-uuids})

(defn- combine-deleted-contexts
  [& contexts]
  (let [contexts (keep identity contexts)]
    (deleted-context
     {:root-uuids (reduce set/union #{} (map :root-uuids contexts))
      :deleted-block? (fn [block-uuid]
                        (some #((:deleted-block? %) block-uuid) contexts))
      :deleted-uuids (reduce set/union #{} (map :deleted-uuids contexts))})))

(declare get-local-deleted-blocks)

(defn- local-deleted-context
  [reversed-tx-reports]
  (let [deleted-uuids (->> (get-local-deleted-blocks reversed-tx-reports)
                           (keep :block/uuid)
                           set)]
    (deleted-context
     {:deleted-block? #(contains? deleted-uuids %)
      :deleted-uuids deleted-uuids})))

(defn- remote-deleted-context
  [remote-tx-report remote-tx-data]
  (if remote-tx-report
    (let [db-before (:db-before remote-tx-report)
          db-after (:db-after remote-tx-report)
          root-uuids (tx-retract-block-uuids db-before remote-tx-data)
          retained-uuids (tx-target-block-uuids remote-tx-data)
          deleted-subtree? (deleted-subtree-pred db-before root-uuids retained-uuids)
          deleted-uuids (surviving-deleted-block-uuids db-before db-after root-uuids deleted-subtree?)]
      (deleted-context
       {:root-uuids root-uuids
        :deleted-block? deleted-subtree?
        :deleted-uuids deleted-uuids}))
    (deleted-context {})))

(defn- flush-pending!
  [repo client]
  (let [inflight @(:inflight client)
        local-tx (or (client-op/get-local-tx repo) 0)
        remote-tx (get @*repo->latest-remote-tx repo)
        conn (worker-state/get-datascript-conn repo)]
    (when (and conn (= local-tx remote-tx))        ; rebase
      (when (empty? inflight)
        (when-let [ws (:ws client)]
          (when (and (ws-open? ws) (worker-state/online?))
            (let [batch (pending-txs repo {:limit 50})]
              (when (seq batch)
                (let [tx-entries (mapv (fn [{:keys [tx-id tx outliner-op]}]
                                         {:tx-id tx-id
                                          :outliner-op outliner-op
                                          :tx-data (->> tx
                                                        (db-normalize/remove-retract-entity-ref @conn)
                                                        (drop-missing-created-block-datoms @conn)
                                                        (drop-missing-block-ref-datoms @conn)
                                                        distinct
                                                        vec)})
                                       batch)
                      tx-ids (mapv :tx-id tx-entries)]
                  (when (seq tx-entries)
                    (->
                     (p/let [aes-key (when (sync-crypt/graph-e2ee? repo)
                                       (sync-crypt/<ensure-graph-aes-key repo (:graph-id client)))
                             _ (when (and (sync-crypt/graph-e2ee? repo) (nil? aes-key))
                                 (fail-fast :db-sync/missing-field {:repo repo :field :aes-key}))
                             tx-entries* (p/all
                                          (mapv (fn [{:keys [tx-data] :as tx-entry}]
                                                  (p/let [tx-data* (offload-large-titles
                                                                    tx-data
                                                                    {:repo repo
                                                                     :graph-id (:graph-id client)
                                                                     :aes-key aes-key})
                                                          tx-data** (if aes-key
                                                                      (sync-crypt/<encrypt-tx-data aes-key tx-data*)
                                                                      tx-data*)]
                                                    (assoc tx-entry :tx-data tx-data**)))
                                                tx-entries))
                             payload (mapv (fn [{:keys [tx-data outliner-op]}]
                                             (cond-> {:tx (sqlite-util/write-transit-str tx-data)}
                                               outliner-op
                                               (assoc :outliner-op outliner-op)))
                                           tx-entries*)]

                       (reset! (:inflight client) tx-ids)
                       (send! ws {:type "tx/batch"
                                  :t-before local-tx
                                  :txs payload}))
                     (p/catch (fn [error]
                                (js/console.error error))))))))))))))

(defn- ensure-client-state! [repo]
  (let [client {:repo repo
                :send-queue (atom (p/resolved nil))
                :asset-queue (atom (p/resolved nil))
                :inflight (atom [])
                :reconnect (atom {:attempt 0 :timer nil})
                :stale-kill-timer (atom nil)
                :last-ws-message-ts (atom (common-util/time-ms))
                :online-users (atom [])
                :ws-state (atom :closed)}]
    (reset! worker-state/*db-sync-client client)
    client))

(defn- asset-url [base graph-id asset-uuid asset-type]
  (str base "/assets/" graph-id "/" asset-uuid "." asset-type))

(defn- upload-large-title!
  [repo graph-id title aes-key]
  (let [base (http-base-url)]
    (when-not (seq base)
      (fail-fast :db-sync/missing-field {:repo repo :field :http-base}))
    (when-not (seq graph-id)
      (fail-fast :db-sync/missing-field {:repo repo :field :graph-id}))
    (let [asset-uuid (str (random-uuid))
          asset-type large-title-asset-type
          url (asset-url base graph-id asset-uuid asset-type)]
      (p/let [payload (if aes-key
                        (p/let [payload-str (sync-crypt/<encrypt-text-value aes-key title)]
                          (.encode text-encoder payload-str))
                        (p/resolved title))
              headers (merge {"content-type" "text/plain; charset=utf-8"
                              "x-amz-meta-type" asset-type}
                             (auth-headers))
              resp (js/fetch url #js {:method "PUT"
                                      :headers (clj->js headers)
                                      :body payload})]
        (if (.-ok resp)
          (large-title-object asset-uuid asset-type)
          (fail-fast :db-sync/large-title-upload-failed
                     {:repo repo :status (.-status resp)}))))))

(defn- download-large-title!
  [repo graph-id obj aes-key]
  (let [base (http-base-url)]
    (when-not (seq base)
      (fail-fast :db-sync/missing-field {:repo repo :field :http-base}))
    (when-not (seq graph-id)
      (fail-fast :db-sync/missing-field {:repo repo :field :graph-id}))
    (let [url (asset-url base graph-id (:asset-uuid obj) (:asset-type obj))
          headers (auth-headers)]
      (p/let [resp (js/fetch url #js {:method "GET"
                                      :headers (clj->js headers)})]
        (when-not (.-ok resp)
          (fail-fast :db-sync/large-title-download-failed
                     {:repo repo :status (.-status resp)}))
        (p/let [buf (.arrayBuffer resp)
                payload (js/Uint8Array. buf)
                payload-str (.decode text-decoder payload)
                data (if aes-key
                       (-> (sync-crypt/<decrypt-text-value aes-key payload-str)
                           (p/catch (fn [_] payload-str)))
                       (p/resolved payload-str))]
          data)))))

(defn- offload-large-titles
  [tx-data {:keys [repo graph-id upload-fn aes-key]}]
  (let [upload-fn (or upload-fn upload-large-title!)]
    (p/loop [remaining tx-data
             acc []]
      (if (empty? remaining)
        acc
        (let [item (first remaining)
              op (nth item 0 nil)
              attr (nth item 2 nil)
              value (nth item 3 nil)]
          (if (and (vector? item)
                   (= :db/add op)
                   (= :block/title attr)
                   (string? value)
                   (large-title? value))
            (p/let [obj (upload-fn repo graph-id value aes-key)
                    placeholder (assoc-datom-value item "")]
              (p/recur (rest remaining)
                       (conj acc placeholder
                             [:db/add (nth item 1) large-title-object-attr obj])))
            (p/recur (rest remaining) (conj acc item))))))))

(defn- rehydrate-large-titles!
  [repo {:keys [graph-id download-fn aes-key tx-data conn]}]
  (when-let [conn (or conn (worker-state/get-datascript-conn repo))]
    (let [download-fn (or download-fn download-large-title!)
          graph-id (or graph-id (get-graph-id repo))
          items (if (seq tx-data)
                  (->> tx-data
                       (keep (fn [item]
                               (when (and (vector? item)
                                          (= :db/add (nth item 0))
                                          (= large-title-object-attr (nth item 2))
                                          (large-title-object? (nth item 3)))
                                 {:e (nth item 1)
                                  :obj (nth item 3)})))
                       (distinct))
                  (->> (d/datoms @conn :eavt)
                       (keep (fn [datom]
                               (when (= large-title-object-attr (:a datom))
                                 (let [obj (:v datom)]
                                   (when (large-title-object? obj)
                                     {:e (:e datom)
                                      :obj obj})))))
                       (distinct)))]
      (when (seq items)
        (p/let [aes-key (or aes-key
                            (when (sync-crypt/graph-e2ee? repo)
                              (sync-crypt/<ensure-graph-aes-key repo graph-id)))
                _ (when (and (sync-crypt/graph-e2ee? repo) (nil? aes-key))
                    (fail-fast :db-sync/missing-field {:repo repo :field :aes-key}))]
          (p/all
           (mapv (fn [{:keys [e obj]}]
                   (p/let [title (download-fn repo graph-id obj aes-key)]
                     (ldb/transact! conn
                                    [[:db/add e :block/title title]]
                                    {:rtc-tx? true
                                     :persist-op? false
                                     :op :large-title-rehydrate})))
                 items)))))))

(defn- <offload-large-titles-in-datoms-batch
  [repo graph-id datoms aes-key]
  (p/loop [remaining datoms
           acc []]
    (if (empty? remaining)
      acc
      (let [datom (first remaining)]
        (if (and (= :block/title (:a datom))
                 (string? (:v datom))
                 (large-title? (:v datom)))
          (p/let [obj (upload-large-title! repo graph-id (:v datom) aes-key)]
            (p/recur (rest remaining)
                     (conj acc
                           (assoc datom :v "")
                           (assoc datom :a large-title-object-attr :v obj))))
          (p/recur (rest remaining) (conj acc datom)))))))

(defn- take-upload-datoms-batch
  [datoms batch-size]
  (loop [batch (transient [])
         remaining (seq datoms)
         n 0]
    (if (or (nil? remaining) (>= n batch-size))
      [(persistent! batch) remaining]
      (recur (conj! batch (first remaining))
             (next remaining)
             (inc n)))))

(defn- datom->tx
  [datom]
  [:db/add (:e datom) (:a datom) (:v datom)])

(defn- <process-upload-datoms-in-batches!
  [datoms {:keys [batch-size process-batch-f progress-f]
           :or {batch-size upload-prepare-datoms-batch-size}}]
  (let [total-count (count datoms)]
    (p/loop [remaining (seq datoms)
             processed 0]
      (if (seq remaining)
        (let [[batch remaining'] (take-upload-datoms-batch remaining batch-size)
              processed' (+ processed (count batch))]
          (p/let [_ (process-batch-f batch)]
            (when progress-f
              (progress-f processed' total-count))
            (p/let [_ (js/Promise. (fn [resolve] (js/setTimeout resolve 0)))]
              (p/recur remaining' processed'))))
        nil))))

(defn- <prepare-upload-temp-sqlite!
  [repo graph-id source-conn aes-key update-progress]
  (p/let [temp (<create-temp-sqlite-conn (d/schema @source-conn))
          datoms (d/datoms @source-conn :eavt)
          _ (<process-upload-datoms-in-batches!
             datoms
             {:process-batch-f
              (fn [batch]
                (p/let [datoms* (<offload-large-titles-in-datoms-batch repo graph-id batch aes-key)
                        encrypted-datoms (if aes-key
                                           (sync-crypt/<encrypt-datoms aes-key datoms*)
                                           datoms*)
                        tx-data (mapv datom->tx encrypted-datoms)]
                  (d/transact! (:conn temp) tx-data {:initial-db? true})
                  nil))
              :progress-f
              (fn [processed total]
                (update-progress {:sub-type :upload-progress
                                  :message (if aes-key
                                             (str "Encrypting " processed "/" total)
                                             (str "Preparing " processed "/" total))}))})]
    temp))

(defn rehydrate-large-titles-from-db!
  [repo graph-id]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [tx-data (mapv (fn [datom]
                          [:db/add (:e datom) large-title-object-attr (:v datom)])
                        (d/datoms @conn :avet large-title-object-attr))]
      (rehydrate-large-titles! repo {:tx-data tx-data :graph-id graph-id}))))

(defn- enqueue-asset-task! [client task]
  (when-let [queue (:asset-queue client)]
    (swap! queue
           (fn [prev]
             (p/then prev (fn [_] (task)))))))

(defn- <exported-graph-aes-key
  [repo graph-id]
  (if (sync-crypt/graph-e2ee? repo)
    (p/let [aes-key (sync-crypt/<ensure-graph-aes-key repo graph-id)
            _ (when (nil? aes-key)
                (fail-fast :db-sync/missing-field {:repo repo :field :aes-key}))]
      (crypt/<export-aes-key aes-key))
    (p/resolved nil)))

(defn- upload-remote-asset!
  [repo graph-id asset-uuid asset-type checksum]
  (let [base (http-base-url)]
    (if (and (seq base) (seq graph-id) (seq asset-type) (seq checksum))
      (p/let [exported-aes-key (<exported-graph-aes-key repo graph-id)]
        (worker-state/<invoke-main-thread :thread-api/rtc-upload-asset
                                          repo exported-aes-key (str asset-uuid) asset-type checksum
                                          (asset-url base graph-id (str asset-uuid) asset-type)
                                          {:extra-headers (auth-headers)}))
      (p/rejected (ex-info "missing asset upload info"
                           {:repo repo
                            :asset-uuid asset-uuid
                            :asset-type asset-type
                            :checksum checksum
                            :base base
                            :graph-id graph-id})))))

(defn- download-remote-asset!
  [repo graph-id asset-uuid asset-type]
  (let [base (http-base-url)]
    (if (and (seq base) (seq graph-id) (seq asset-type))
      (p/let [exported-aes-key (<exported-graph-aes-key repo graph-id)]
        (worker-state/<invoke-main-thread :thread-api/rtc-download-asset
                                          repo exported-aes-key (str asset-uuid) asset-type
                                          (asset-url base graph-id (str asset-uuid) asset-type)
                                          {:extra-headers (auth-headers)}))
      (p/rejected (ex-info "missing asset download info"
                           {:repo repo
                            :asset-uuid asset-uuid
                            :asset-type asset-type
                            :base base
                            :graph-id graph-id})))))

(defn- process-asset-op!
  [repo graph-id asset-op]
  (let [asset-uuid (:block/uuid asset-op)
        op-type (cond
                  (contains? asset-op :update-asset) :update-asset
                  (contains? asset-op :remove-asset) :remove-asset
                  :else :unknown)]
    (require-asset-field repo :asset-uuid asset-uuid {:op op-type})
    (cond
      (contains? asset-op :update-asset)
      (if-let [conn (worker-state/get-datascript-conn repo)]
        (let [ent (d/entity @conn [:block/uuid asset-uuid])
              asset-type (:logseq.property.asset/type ent)
              checksum (:logseq.property.asset/checksum ent)
              size (:logseq.property.asset/size ent 0)]
          (require-asset-field repo :asset-type asset-type {:op :update-asset :asset-uuid asset-uuid})
          (require-asset-field repo :checksum checksum {:op :update-asset
                                                        :asset-uuid asset-uuid
                                                        :asset-type asset-type})
          (cond
            (> size max-asset-size)
            (do
              (log/info :db-sync/asset-too-large {:repo repo
                                                  :asset-uuid asset-uuid
                                                  :size size})
              (client-op/remove-asset-op repo asset-uuid)
              (when-let [client (current-client repo)]
                (broadcast-rtc-state! client))
              (p/resolved nil))

            :else
            (-> (upload-remote-asset! repo graph-id asset-uuid asset-type checksum)
                (p/then (fn [_]
                          (when (d/entity @conn [:block/uuid asset-uuid])
                            (ldb/transact!
                             conn
                             [{:block/uuid asset-uuid
                               :logseq.property.asset/remote-metadata {:checksum checksum :type asset-type}}]
                             {:persist-op? true}))
                          (client-op/remove-asset-op repo asset-uuid)
                          (when-let [client (current-client repo)]
                            (broadcast-rtc-state! client))))
                (p/catch (fn [e]
                           (case (:type (ex-data e))
                             :rtc.exception/read-asset-failed
                             (do
                               (client-op/remove-asset-op repo asset-uuid)
                               (when-let [client (current-client repo)]
                                 (broadcast-rtc-state! client)))

                             :rtc.exception/upload-asset-failed
                             nil

                             (log/error :db-sync/asset-upload-failed
                                        {:repo repo
                                         :asset-uuid asset-uuid
                                         :error e})))))))
        (fail-fast :db-sync/missing-db {:repo repo :op :process-asset-op}))

      (contains? asset-op :remove-asset)
      (-> (client-op/remove-asset-op repo asset-uuid)
          (p/then (fn [_]
                    (when-let [client (current-client repo)]
                      (broadcast-rtc-state! client))))
          (p/catch (fn [e]
                     (log/error :db-sync/asset-delete-failed
                                {:repo repo
                                 :asset-uuid asset-uuid
                                 :error e}))))

      :else
      (p/resolved nil))))

(defn- process-asset-ops!
  [repo client]
  (let [graph-id (:graph-id client)
        asset-ops (not-empty (client-op/get-all-asset-ops repo))
        parallelism 10]
    (if (and (seq graph-id) asset-ops)
      (let [queue (atom (vec asset-ops))
            pop-queue! (fn []
                         (let [selected (atom nil)]
                           (swap! queue
                                  (fn [q]
                                    (if (seq q)
                                      (do
                                        (reset! selected (first q))
                                        (subvec q 1))
                                      q)))
                           @selected))
            asset-worker (fn worker []
                           (if-let [asset-op (pop-queue!)]
                             (-> (process-asset-op! repo graph-id asset-op)
                                 (p/then (fn [_] (worker)))
                                 (p/catch (fn [e]
                                            (log/error :db-sync/asset-op-failed
                                                       {:repo repo
                                                        :asset-uuid (:block/uuid asset-op)
                                                        :error e}))))
                             (p/resolved nil)))]
        (->> (range (min parallelism (count asset-ops)))
             (mapv (fn [_] (asset-worker)))
             (p/all)))
      (p/resolved nil))))

(defn- enqueue-asset-sync! [repo client]
  (enqueue-asset-task! client #(process-asset-ops! repo client)))

(defn request-asset-download!
  [repo asset-uuid]
  (when-let [client (current-client repo)]
    (let [conn (worker-state/get-datascript-conn repo)
          graph-id (:graph-id client)
          ent (when conn (d/entity @conn [:block/uuid asset-uuid]))
          asset-type (:logseq.property.asset/type ent)]
      (-> (p/let [meta (when (seq asset-type)
                         (worker-state/<invoke-main-thread
                          :thread-api/get-asset-file-metadata
                          repo (str asset-uuid) asset-type))]
            (when (and (seq asset-type)
                       (:logseq.property.asset/remote-metadata ent)
                       (nil? meta))
              (download-remote-asset! repo graph-id asset-uuid asset-type)))
          (p/catch (fn [e]
                     (log/error :db-sync/asset-download-failed
                                {:repo repo
                                 :asset-uuid asset-uuid
                                 :error e})))))))

(defn- get-local-deleted-blocks
  [reversed-tx-reports]
  (->> reversed-tx-reports
       (mapcat
        (fn [reversed-tx-report]
          (->>
           (:tx-data reversed-tx-report)
           (keep
            (fn [[e a v _t added]]
              (when (and (= :block/uuid a) added
                         (nil? (d/entity (:db-before reversed-tx-report)
                                         [:block/uuid v])))
                (d/entity (:db-after reversed-tx-report) e)))))))
       distinct))

(defn- combine-tx-reports
  [tx-reports]
  (let [tx-reports (vec (keep identity tx-reports))]
    (when (seq tx-reports)
      {:db-before (:db-before (first tx-reports))
       :db-after (:db-after (last tx-reports))
       :tx-data (mapcat :tx-data tx-reports)
       :tx-meta (:tx-meta (last tx-reports))})))

(defn- remote-tx-debug-meta
  [temp-tx-meta remote-txs index {:keys [t outliner-op]}]
  (cond-> (assoc temp-tx-meta
                 :op :transact-remote-tx-data
                 :skip-validate-db? true
                 :remote-tx-index (inc index)
                 :remote-tx-count (count remote-txs))
    (number? t) (assoc :remote-t t)
    outliner-op (assoc :outliner-op outliner-op)))

(defn- local-tx-debug-meta
  [temp-tx-meta local-txs index local-tx op]
  (cond-> (assoc temp-tx-meta
                 :op op
                 :local-tx-index (inc index)
                 :local-tx-count (count local-txs))
    (:tx-id local-tx) (assoc :local-tx-id (:tx-id local-tx))
    (:outliner-op local-tx) (assoc :outliner-op (:outliner-op local-tx))))

(defn- tx-data-item->set-item
  [item]
  (if (and (vector? item) (= 5 (count item)))
    (vec (butlast item))
    item))

(defn- transact-remote-txs!
  [temp-conn remote-txs temp-tx-meta]
  (loop [remaining remote-txs
         index 0
         results []]
    (if-let [remote-tx (first remaining)]
      (let [tx-data (seq (:tx-data remote-tx))
            results' (cond-> results
                       tx-data
                       (conj {:tx-data tx-data
                              :report (ldb/transact! temp-conn
                                                     tx-data
                                                     (remote-tx-debug-meta temp-tx-meta remote-txs index remote-tx))}))]
        (recur (next remaining) (inc index) results'))
      results)))

(defn- reverse-replace-retract-uuid-with-retract-entity
  [tx-data]
  (let [retract-block-ids (->> (keep (fn [[op e a _v _t]]
                                       (when (and (= op :db/retract)
                                                  (= :block/uuid a))
                                         e))
                                     tx-data)
                               set)
        tx-data' (if (seq retract-block-ids)
                   (remove (fn [[_op e _a v]]
                             (or (contains? retract-block-ids e)
                                 (contains? retract-block-ids v)))
                           tx-data)
                   tx-data)]
    (concat tx-data'
            (map (fn [id] [:db/retractEntity id]) retract-block-ids))))

(defn- reverse-local-txs!
  [temp-conn local-txs temp-tx-meta]
  (->> local-txs
       reverse
       (map-indexed
        (fn [index local-tx]
          (when-let [tx-data (->> (:reversed-tx local-tx)
                                  remove-ignored-attrs
                                  (replace-string-block-tempids-with-lookups @temp-conn)
                                  (reverse-replace-retract-uuid-with-retract-entity)
                                  seq)]
            (ldb/transact! temp-conn
                           tx-data
                           (local-tx-debug-meta temp-tx-meta
                                                local-txs
                                                index
                                                local-tx
                                                :reverse)))))
       (keep identity)
       vec))

(defn- rebase-local-txs!
  [temp-conn local-txs remote-db remote-updated-keys remote-tx-data-set deleted-blocks temp-tx-meta]
  (->> local-txs
       (map-indexed
        (fn [index local-tx]
          (let [pending-tx-data (drop-remote-conflicted-local-tx remote-db
                                                                 remote-updated-keys
                                                                 (:tx local-tx))
                rebased-tx-data (->> (sanitize-tx-data @temp-conn
                                                       pending-tx-data
                                                       deleted-blocks)
                                     (remove remote-tx-data-set))]
            (when (seq rebased-tx-data)
              (ldb/transact! temp-conn
                             rebased-tx-data
                             (local-tx-debug-meta temp-tx-meta
                                                  local-txs
                                                  index
                                                  local-tx
                                                  :rebase))))))
       (keep identity)
       vec))

(defn- build-remote-state
  [{:keys [temp-conn remote-txs tx-meta reversed-tx-reports *remote-tx-report]}]
  (let [remote-results (transact-remote-txs! temp-conn remote-txs tx-meta)
        remote-tx-data (mapcat :tx-data remote-results)
        remote-tx-report (combine-tx-reports (map :report remote-results))
        _ (reset! *remote-tx-report remote-tx-report)
        deleted-context (combine-deleted-contexts
                         (local-deleted-context reversed-tx-reports)
                         (remote-deleted-context remote-tx-report remote-tx-data))
        remote-db @temp-conn]
    {:deleted-context deleted-context
     :remote-db remote-db
     :remote-results remote-results
     :remote-tx-data remote-tx-data
     :remote-tx-data-set (set (map tx-data-item->set-item remote-tx-data))
     :remote-tx-report remote-tx-report
     :remote-updated-keys (remote-updated-attr-keys remote-db remote-tx-data)}))

(defn- rebase-remote-state!
  [{:keys [temp-conn local-txs tx-meta deleted-context remote-db remote-tx-data-set remote-updated-keys]}]
  (let [rebase-tx-reports (rebase-local-txs! temp-conn
                                             local-txs
                                             remote-db
                                             remote-updated-keys
                                             remote-tx-data-set
                                             (:deleted-block? deleted-context)
                                             tx-meta)]
    {:rebase-tx-report (combine-tx-reports rebase-tx-reports)
     :rebase-tx-reports rebase-tx-reports}))

(declare fix-tx! delete-nodes!)

(defn- delete-context-nodes!
  [temp-conn deleted-context tx-meta]
  (let [db @temp-conn
        deleted-nodes (keep (fn [id] (d/entity db [:block/uuid id]))
                            (:deleted-uuids deleted-context))]
    (delete-nodes! temp-conn deleted-nodes tx-meta)))

(defn- finalize-remote-state!
  [{:keys [temp-conn tx-meta deleted-context remote-tx-report rebase-tx-report *temp-after-db]}]
  (reset! *temp-after-db @temp-conn)
  (fix-tx! temp-conn remote-tx-report rebase-tx-report (assoc tx-meta :op :fix))
  (delete-context-nodes! temp-conn deleted-context (assoc tx-meta :op :delete-blocks)))

(defn- normalize-rebased-pending-tx
  [{:keys [db-before db-after tx-data remote-tx-data-set keep-local-retract-entity?]}]
  (let [normalized (->> tx-data
                        (normalize-tx-data db-after db-before)
                        (replace-string-block-tempids-with-lookups db-before))
        normalized-tx-data (->> normalized
                                (db-normalize/replace-attr-retract-with-retract-entity-v2 db-after)
                                (remove (fn [item]
                                          (and (contains? remote-tx-data-set item)
                                               (not (keep-local-retract-entity? item)))))
                                (drop-missing-block-ref-datoms db-after))]
    {:normalized-tx-data normalized-tx-data
     :reversed-datoms (reverse-normalized-tx-data normalized-tx-data)}))

(defn- delete-nodes!
  [temp-conn deleted-nodes tx-meta]
  (when (seq deleted-nodes)
    (let [pages (filter ldb/page? deleted-nodes)
          blocks (->> deleted-nodes
                      (keep (fn [block]
                              (d/entity @temp-conn [:block/uuid (:block/uuid block)])))
                      (remove ldb/page?))]
      (when (or (seq blocks) (seq pages))
        (outliner-tx/transact!
         (merge tx-meta
                {:outliner-op :delete-blocks
                 :transact-opts {:conn temp-conn}})
         (when (seq blocks)
           (outliner-core/delete-blocks! temp-conn blocks {}))

         (doseq [page pages]
           (worker-page/delete! temp-conn (:block/uuid page) {})))))))

(defn- fix-tx!
  [temp-conn remote-tx-report rebase-tx-report tx-meta]
  (let [cycle-tx-report (sync-cycle/fix-cycle! temp-conn remote-tx-report rebase-tx-report
                                               {:tx-meta tx-meta})]
    (letfn [(page-consistency-candidate-eids [db tx-data]
              (let [root-eids (->> tx-data
                                   (keep (fn [[e a _v _tx added]]
                                           (when (and added
                                                      (contains? #{:block/parent :block/page} a)
                                                      (:block/uuid (d/entity db e)))
                                             e)))
                                   set)]
                (into root-eids
                      (mapcat #(ldb/get-block-full-children-ids db %))
                      root-eids)))
            (fix-block-page-consistency! [conn tx-data tx-meta]
              (let [db @conn
                    expected-page-for-block
                    (fn expected-page-for-block [block]
                      (loop [current (:block/parent block)
                             seen #{}]
                        (when (and current
                                   (not (contains? seen (:db/id current))))
                          (if (ldb/page? current)
                            current
                            (recur (:block/parent current)
                                   (conj seen (:db/id current)))))))
                    fixes (->> (page-consistency-candidate-eids db tx-data)
                               (keep (fn [eid]
                                       (let [block (d/entity db eid)
                                             parent (:block/parent block)
                                             current-page (:block/page block)
                                             expected-page (when parent
                                                             (expected-page-for-block block))]
                                         (when (and block
                                                    (not (ldb/page? block))
                                                    expected-page
                                                    (not= (:db/id current-page)
                                                          (:db/id expected-page)))
                                           [:db/add eid :block/page (:db/id expected-page)]))))
                               distinct
                               vec)]
                (when (seq fixes)
                  (d/transact! conn fixes (merge tx-meta {:op :fix-block-page})))))]
      (fix-block-page-consistency! temp-conn
                                   (mapcat :tx-data [remote-tx-report
                                                     rebase-tx-report
                                                     cycle-tx-report])
                                   tx-meta))
    (sync-order/fix-duplicate-orders! temp-conn
                                      (mapcat :tx-data [remote-tx-report
                                                        rebase-tx-report
                                                        cycle-tx-report])
                                      tx-meta)))

(defn- apply-remote-tx-with-local-changes!
  [{:keys [conn local-txs remote-txs temp-tx-meta *remote-tx-report *reversed-tx-report *rebased-pending-txs *temp-after-db]}]
  (let [batch-tx-meta {:rtc-tx? true
                       :with-local-changes? true}]
    (ldb/transact-with-temp-conn!
     conn
     batch-tx-meta
     (fn [temp-conn _*batch-tx-data]
       (let [tx-meta temp-tx-meta
             reversed-tx-reports (reverse-local-txs! temp-conn local-txs tx-meta)
             reversed-tx-report (combine-tx-reports reversed-tx-reports)
             _ (reset! *reversed-tx-report reversed-tx-report)
             remote-state (build-remote-state {:temp-conn temp-conn
                                               :remote-txs remote-txs
                                               :tx-meta tx-meta
                                               :reversed-tx-reports reversed-tx-reports
                                               :*remote-tx-report *remote-tx-report})
             rebase-state (rebase-remote-state! (merge remote-state
                                                       {:temp-conn temp-conn
                                                        :local-txs local-txs
                                                        :tx-meta tx-meta}))]
         (finalize-remote-state! (merge remote-state
                                        rebase-state
                                        {:temp-conn temp-conn
                                         :tx-meta tx-meta
                                         :*temp-after-db *temp-after-db}))))
     {:listen-db (fn [{:keys [tx-meta tx-data db-before db-after]}]
                   (when-not (contains? #{:reverse :transact-remote-tx-data} (:op tx-meta))
                     (swap! *rebased-pending-txs conj {:tx-data tx-data
                                                       :tx-meta tx-meta
                                                       :db-before db-before
                                                       :db-after db-after})))})))

(defn- apply-remote-tx-without-local-changes!
  [{:keys [conn remote-txs temp-tx-meta]}]
  (ldb/transact-with-temp-conn!
   conn
   {:rtc-tx? true
    :without-local-changes? true}
   (fn [temp-conn]
     (let [remote-results (transact-remote-txs! temp-conn remote-txs temp-tx-meta)
           remote-tx-data (mapcat :tx-data remote-results)
           remote-tx-report (combine-tx-reports (map :report remote-results))]
       (when remote-tx-report
         (let [tx-meta (:tx-meta remote-tx-report)
               deleted-context (remote-deleted-context remote-tx-report remote-tx-data)]
           (delete-context-nodes! temp-conn deleted-context
                                  (assoc tx-meta :op :delete-blocks))))))))

(defn- apply-remote-txs!
  [repo client remote-txs]
  (if-let [conn (worker-state/get-datascript-conn repo)]
    (let [local-txs (pending-txs repo)
          has-local-changes? (seq local-txs)
          *remote-tx-report (atom nil)
          *reversed-tx-report (atom nil)
          *rebased-pending-txs (atom [])
          *temp-after-db (atom nil)
          remote-tx-data* (mapcat :tx-data remote-txs)
          remote-created-block-uuids (created-block-uuids remote-tx-data*)
          temp-tx-meta {:rtc-tx? true
                        :gen-undo-ops? false
                        :persist-op? false}
          apply-context {:conn conn
                         :local-txs local-txs
                         :remote-txs remote-txs
                         :temp-tx-meta temp-tx-meta
                         :*remote-tx-report *remote-tx-report
                         :*reversed-tx-report *reversed-tx-report
                         :*rebased-pending-txs *rebased-pending-txs
                         :*temp-after-db *temp-after-db}
          tx-report (if has-local-changes?
                      (apply-remote-tx-with-local-changes! apply-context)
                      (apply-remote-tx-without-local-changes! apply-context))
          remote-tx-report @*remote-tx-report]
      (when has-local-changes?
        (let [rebased-pending-txs (seq @*rebased-pending-txs)
              persisted-rebased? (atom false)]
          (when rebased-pending-txs
            (let [remote-tx-data-set (set remote-tx-data*)
                  keep-local-retract-entity?
                  (fn [item]
                    (and (vector? item)
                         (= :db/retractEntity (first item))
                         (contains? remote-created-block-uuids
                                    (get-lookup-id (second item)))))
                  final-db-after (or @*temp-after-db
                                     (:db-after tx-report))]
              (doseq [{:keys [tx-data tx-meta db-before db-after]} rebased-pending-txs]
                (let [db-before' (or db-before
                                     (:db-after remote-tx-report)
                                     (:db-after @*reversed-tx-report))
                      db-after' (or db-after
                                    final-db-after)
                      {:keys [normalized-tx-data reversed-datoms]}
                      (normalize-rebased-pending-tx
                       {:db-before db-before'
                        :db-after db-after'
                        :tx-data tx-data
                        :remote-tx-data-set remote-tx-data-set
                        :keep-local-retract-entity? keep-local-retract-entity?})]
                  (when (seq normalized-tx-data)
                    (persist-local-tx! repo normalized-tx-data
                                       reversed-datoms
                                       {:outliner-op (or (:outliner-op tx-meta)
                                                         :rtc-rebase)})
                    (reset! persisted-rebased? true))))))
          (when (or (nil? rebased-pending-txs) @persisted-rebased?)
            (remove-pending-txs! repo (map :tx-id local-txs)))))

      (when-let [*inflight (:inflight client)]
        (reset! *inflight []))

      (-> (rehydrate-large-titles! repo {:tx-data remote-tx-data*
                                         :graph-id (:graph-id client)})
          (p/catch (fn [error]
                     (log/error :db-sync/large-title-rehydrate-failed
                                {:repo repo :error error}))))

      (reset! *remote-tx-report nil))
    (fail-fast :db-sync/missing-db {:repo repo :op :apply-remote-txs})))

(defn apply-remote-tx!
  [repo client tx-data]
  (apply-remote-txs! repo client [{:tx-data tx-data}]))

(defn- handle-message! [repo client raw]
  (let [message (-> raw parse-message coerce-ws-server-message)]
    (when-not (map? message)
      (fail-fast :db-sync/response-parse-failed {:repo repo :raw raw}))
    (let [local-tx (or (client-op/get-local-tx repo) 0)
          remote-tx (:t message)
          remote-checksum (:checksum message)]
      (when remote-tx (swap! *repo->latest-remote-tx assoc repo remote-tx))

      (case (:type message)
        "hello" (do
                  (require-non-negative remote-tx {:repo repo :type "hello"})
                  (verify-sync-checksum! repo client local-tx remote-tx remote-checksum {:type "hello"})
                  (broadcast-rtc-state! client)
                  (when (> remote-tx local-tx)
                    (send! (:ws client) {:type "pull" :since local-tx}))
                  (enqueue-asset-sync! repo client)
                  (flush-pending! repo client))
        "online-users" (let [users (:online-users message)]
                         (when (and (some? users) (not (sequential? users)))
                           (fail-fast :db-sync/invalid-field
                                      {:repo repo :type "online-users" :field :online-users}))
                         (update-online-users! client (or users [])))
        "presence" (let [{:keys [user-id editing-block-uuid]} message
                         current-user-id (get-user-uuid)]
                     (when-not (= current-user-id user-id)
                       (update-user-presence! client user-id editing-block-uuid)))
        ;; Upload response
        "tx/batch/ok" (do
                        (require-non-negative remote-tx {:repo repo :type "tx/batch/ok"})
                        (client-op/update-local-tx repo remote-tx)
                        (broadcast-rtc-state! client)
                        (remove-pending-txs! repo @(:inflight client))
                        (reset! (:inflight client) [])
                        (verify-sync-checksum! repo client remote-tx remote-tx remote-checksum {:type "tx/batch/ok"})
                        (flush-pending! repo client))
        ;; Download response
        "pull/ok" (when (> remote-tx local-tx)
                    (let [txs (:txs message)
                          _ (require-non-negative remote-tx {:repo repo :type "pull/ok"})
                          _ (require-seq txs {:repo repo :type "pull/ok" :field :txs})
                          remote-txs (mapv (fn [data]
                                             {:t (:t data)
                                              :outliner-op (:outliner-op data)
                                              :tx-data (parse-transit (:tx data) {:repo repo :type "pull/ok"})})
                                           txs)]
                      (when (seq remote-txs)
                        (p/let [graph-e2ee? (sync-crypt/graph-e2ee? repo)
                                aes-key (sync-crypt/<ensure-graph-aes-key repo (:graph-id client))
                                _ (when (and graph-e2ee? (nil? aes-key))
                                    (fail-fast :db-sync/missing-field {:repo repo :field :aes-key}))
                                remote-txs* (if aes-key
                                              (p/all (mapv (fn [{:keys [t tx-data]}]
                                                             (p/let [tx-data* (sync-crypt/<decrypt-tx-data aes-key tx-data)]
                                                               {:t t
                                                                :tx-data tx-data*}))
                                                           remote-txs))
                                              (p/resolved remote-txs))]
                          (try
                            (apply-remote-txs! repo client remote-txs*)
                            (catch :default e
                              (log/error ::apply-remote-tx e)
                              (throw e)))
                          (client-op/update-local-tx repo remote-tx)
                          (broadcast-rtc-state! client)
                          (verify-sync-checksum! repo client remote-tx remote-tx remote-checksum {:type "pull/ok"})
                          (flush-pending! repo client)))))
        "changed" (do
                    (require-non-negative remote-tx {:repo repo :type "changed"})
                    (broadcast-rtc-state! client)
                    (when (< local-tx remote-tx)
                      (send! (:ws client) {:type "pull" :since local-tx})))
        "tx/reject" (let [reason (:reason message)]
                      (when (nil? reason)
                        (fail-fast :db-sync/missing-field
                                   {:repo repo :type "tx/reject" :field :reason}))
                      (when (contains? message :t)
                        (require-non-negative remote-tx {:repo repo :type "tx/reject"}))
                      (case reason
                        "stale"
                        (send! (:ws client) {:type "pull" :since local-tx})

                        (let [data (when-let [raw-data (:data message)]
                                     (parse-transit raw-data
                                                    {:repo repo
                                                     :type "tx/reject"
                                                     :reason reason
                                                     :field :data}))]
                          (fail-fast :db-sync/tx-rejected
                                     (cond-> {:type :db-sync/tx-rejected
                                              :repo repo
                                              :message-type "tx/reject"
                                              :reason reason}
                                       (contains? message :t) (assoc :t remote-tx)
                                       (some? data) (assoc :data data))))))
        (fail-fast :db-sync/invalid-field
                   {:repo repo :type (:type message)})))))

(declare connect!)

(defn- schedule-reconnect! [repo client url reason]
  (when-let [reconnect (:reconnect client)]
    (let [{:keys [attempt timer]} @reconnect]
      (when (nil? timer)
        (let [delay (reconnect-delay-ms attempt)
              timeout-id (js/setTimeout
                          (fn []
                            (swap! reconnect assoc :timer nil)
                            (when-let [current @worker-state/*db-sync-client]
                              (when (and (= (:repo current) repo)
                                         (= (:graph-id current) (:graph-id client)))
                                (-> (p/let [token (<resolve-ws-token)
                                            updated (connect! repo current url token)]
                                      (reset! worker-state/*db-sync-client updated))
                                    (p/catch (fn [error]
                                               (log/error :db-sync/ws-reconnect-failed {:repo repo :error error})
                                               (schedule-reconnect! repo current url :connect-failed)))))))
                          delay)]
          (swap! reconnect assoc :timer timeout-id :attempt (inc attempt))
          (log/info :db-sync/ws-reconnect-scheduled
                    {:repo repo :delay delay :attempt attempt :reason reason}))))))

(defn- attach-ws-handlers! [repo client ws url]
  (set! (.-onmessage ws)
        (fn [event]
          (touch-last-ws-message! client)
          (handle-message! repo client (.-data event))))
  (set! (.-onerror ws)
        (fn [error]
          (log/error :db-sync/ws-error error)))
  (set! (.-onclose ws)
        (fn [_]
          (log/info :db-sync/ws-closed {:repo repo})
          (clear-stale-ws-loop-timer! client)
          (update-online-users! client [])
          (set-ws-state! client :closed)
          (schedule-reconnect! repo client url :close))))

(defn- detach-ws-handlers! [ws]
  (set! (.-onopen ws) nil)
  (set! (.-onmessage ws) nil)
  (set! (.-onerror ws) nil)
  (set! (.-onclose ws) nil))

(defn- close-stale-ws-loop [client ws]
  (let [repo (:repo client)
        graph-id (:graph-id client)]
    (clear-stale-ws-loop-timer! client)
    (when-let [*timer (:stale-kill-timer client)]
      (let [timer (js/setInterval
                   (fn []
                     (when-let [current @worker-state/*db-sync-client]
                       (when (and (= repo (:repo current))
                                  (= graph-id (:graph-id current))
                                  (identical? ws (:ws current))
                                  (ws-open? ws))
                         (let [now (common-util/time-ms)
                               last-ts (or (some-> (:last-ws-message-ts current) deref) now)
                               stale-ms (- now last-ts)]
                           (when (>= stale-ms ws-stale-timeout-ms)
                             (log/warn :db-sync/ws-stale-timeout {:repo repo :stale-ms stale-ms})
                             (try
                               (.close ws)
                               (catch :default _
                                 nil)))))))
                   ws-stale-kill-interval-ms)]
        (reset! *timer timer))))
  client)

(defn- stop-client! [client]
  (clear-stale-ws-loop-timer! client)
  (when-let [reconnect (:reconnect client)]
    (clear-reconnect-timer! reconnect))
  (when-let [ws (:ws client)]
    (detach-ws-handlers! ws)
    (update-online-users! client [])
    (set-ws-state! client :closed)
    (try
      (.close ws)
      (catch :default _
        nil))))

(defn- connect! [repo client url token]
  (when (:ws client)
    (stop-client! client))
  ;; use cache token for faster websocket connection
  (when-let [token' (or token (auth-token))]
    (let [ws (js/WebSocket. (append-token url token'))
          updated (assoc client :ws ws)]
      (attach-ws-handlers! repo updated ws url)
      (set! (.-onopen ws)
            (fn [_]
              (reset-reconnect! updated)
              (touch-last-ws-message! updated)
              (set-ws-state! updated :open)
              (send! ws {:type "hello" :client repo})
              (enqueue-asset-sync! repo updated)))
      (close-stale-ws-loop updated ws))))

(defn stop!
  []
  (when-let [client @worker-state/*db-sync-client]
    (stop-client! client)
    (reset! worker-state/*db-sync-client nil))
  (p/resolved nil))

(defn- active-client-for?
  [client repo graph-id]
  (when (and client (= repo (:repo client)) (= graph-id (:graph-id client)))
    (let [ws (:ws client)
          ws-state (some-> (:ws-state client) deref)
          ws-ready-state (when ws (ready-state ws))]
      (or (= :open ws-state)
          (contains? #{0 1} ws-ready-state)))))

(defn start!
  [repo]
  (let [base (ws-base-url)
        graph-id (get-graph-id repo)
        start-target [repo graph-id]
        inflight-target @*start-inflight-target
        current @worker-state/*db-sync-client]
    (cond
      (not (and (string? base) (seq base) (seq graph-id)))
      (do
        (log/info :db-sync/start-skipped {:repo repo :graph-id graph-id :base base})
        (p/resolved nil))

      (= start-target inflight-target)
      (p/resolved nil)

      (active-client-for? current repo graph-id)
      (do
        (broadcast-rtc-state! current)
        (p/resolved nil))

      :else
      (do
        (reset! *start-inflight-target start-target)
        (->
         (p/do!
          (stop!)
          (p/let [client (ensure-client-state! repo)
                  url (format-ws-url base graph-id)
                  _ (ensure-client-graph-uuid! repo graph-id)
                  connected (assoc client :graph-id graph-id)
                  token (<resolve-ws-token)
                  connected (connect! repo connected url token)]
            (reset! worker-state/*db-sync-client connected)
            nil))
         (p/finally
           (fn []
             (when (= start-target @*start-inflight-target)
               (reset! *start-inflight-target nil)))))))))

(defn enqueue-local-tx!
  [repo {:keys [tx-meta tx-data db-after db-before]}]
  (when-not (or (:rtc-tx? tx-meta)
                (:mark-embedding? tx-meta))
    (let [conn (worker-state/get-datascript-conn repo)
          db (some-> conn deref)]
      (when (and db (seq tx-data))
        (let [normalized (normalize-tx-data db-after db-before tx-data)
              reversed-datoms (reverse-tx-data tx-data)]
          (when (seq normalized)
            (persist-local-tx! repo normalized reversed-datoms tx-meta)
            (when-let [client @worker-state/*db-sync-client]
              (when (= repo (:repo client))
                (let [send-queue (:send-queue client)]
                  (swap! send-queue
                         (fn [prev]
                           (p/then prev
                                   (fn [_]
                                     (when-let [current @worker-state/*db-sync-client]
                                       (when (= repo (:repo current))
                                         (when-let [ws (:ws current)]
                                           (when (ws-open? ws)
                                             (flush-pending! repo current))))))))))))))))))

(defn handle-local-tx!
  [repo {:keys [tx-data tx-meta db-after] :as tx-report}]
  (when (and (seq tx-data)
             (not (:rtc-tx? tx-meta))
             (not (:sync-download-graph? tx-meta))
             (:persist-op? tx-meta true)
             (:kv/value (d/entity db-after :logseq.kv/graph-remote?)))
    (enqueue-local-tx! repo tx-report)
    (when-let [client @worker-state/*db-sync-client]
      (when (= repo (:repo client))
        (enqueue-asset-sync! repo client)))))

(defn- fetch-kvs-rows
  [db last-addr limit]
  (.exec db #js {:sql "select addr, content, addresses from kvs where addr > ? order by addr asc limit ?"
                 :bind #js [last-addr limit]
                 :rowMode "array"}))

(defn- count-kvs-rows
  [db]
  (when-let [result (-> (.exec db #js {:sql "select count(*) from kvs"
                                       :rowMode "array"})
                        first)]
    (first (bean/->clj result))))

(defn- normalize-snapshot-rows [rows]
  (mapv (fn [row] (vec row)) (array-seq rows)))

(defn- encode-snapshot-rows [rows]
  (.encode snapshot-text-encoder (sqlite-util/write-transit-str rows)))

(defn- frame-bytes [^js data]
  (let [len (.-byteLength data)
        out (js/Uint8Array. (+ 4 len))
        view (js/DataView. (.-buffer out))]
    (.setUint32 view 0 len false)
    (.set out data 4)
    out))

(defn- maybe-compress-stream [stream]
  (if (exists? js/CompressionStream)
    (.pipeThrough stream (js/CompressionStream. "gzip"))
    stream))

(defn- <buffer-stream
  [stream]
  (p/let [resp (js/Response. stream)
          buf (.arrayBuffer resp)]
    buf))

(defn- <snapshot-upload-body
  [rows]
  (let [frame (frame-bytes (encode-snapshot-rows rows))
        stream (js/ReadableStream.
                #js {:start (fn [controller]
                              (.enqueue controller frame)
                              (.close controller))})
        use-compression? (exists? js/CompressionStream)
        body (if use-compression? (maybe-compress-stream stream) stream)]
    (if use-compression?
      (p/let [buf (<buffer-stream body)]
        {:body buf :encoding snapshot-content-encoding})
      (p/resolved {:body frame :encoding nil}))))

(defn- set-graph-sync-metadata!
  [repo graph-e2ee?]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (ldb/transact! conn [(ldb/kv :logseq.kv/graph-remote? true)
                         (ldb/kv :logseq.kv/graph-rtc-e2ee? (true? graph-e2ee?))]
                   {:persist-op? false})))

(defn upload-graph!
  [repo]
  (->
   (let [base (http-base-url)
         graph-id (get-graph-id repo)
         update-progress (fn [payload]
                           (worker-util/post-message :rtc-log
                                                     (merge {:type :rtc.log/upload
                                                             :graph-uuid graph-id}
                                                            payload)))]
     (if (and (seq base) (seq graph-id))
       (if-let [source-conn (worker-state/get-datascript-conn repo)]
         (let [graph-e2ee? (true? (sync-crypt/graph-e2ee? repo))]
           (p/let [aes-key (when graph-e2ee?
                             (sync-crypt/<ensure-graph-aes-key repo graph-id))
                   _ (when (and graph-e2ee? (nil? aes-key))
                       (fail-fast :db-sync/missing-field {:repo repo :field :aes-key}))]
             (set-graph-sync-metadata! repo graph-e2ee?)
             (ensure-client-graph-uuid! repo graph-id)
             (p/let [_ (update-progress {:sub-type :upload-progress
                                         :message (if graph-e2ee? "Encrypting..." "Preparing...")})
                     {:keys [db] :as temp} (<prepare-upload-temp-sqlite! repo graph-id source-conn aes-key update-progress)
                     total-rows (count-kvs-rows db)]
               (->
                (p/loop [last-addr -1
                         first-batch? true
                         loaded 0]
                  (let [rows (fetch-kvs-rows db last-addr upload-kvs-batch-size)]
                    (if (empty? rows)
                      (do
                        (client-op/remove-local-tx repo)
                        (client-op/update-local-tx repo 0)
                        (client-op/add-all-exists-asset-as-ops repo)
                        (update-progress {:sub-type :upload-completed
                                          :message "Graph upload finished!"})
                        {:graph-id graph-id})
                      (let [max-addr (apply max (map first rows))
                            rows (normalize-snapshot-rows rows)
                            loaded' (+ loaded (count rows))
                            finished? (= loaded' total-rows)
                            upload-url (str base "/sync/" graph-id "/snapshot/upload?reset="
                                            (if first-batch? "true" "false")
                                            "&finished="
                                            (if finished? "true" "false"))]
                        (p/let [{:keys [body encoding]} (<snapshot-upload-body rows)
                                headers (cond-> {"content-type" snapshot-content-type}
                                          (string? encoding) (assoc "content-encoding" encoding))
                                _ (fetch-json upload-url
                                              {:method "POST"
                                               :headers headers
                                               :body body}
                                              {:response-schema :sync/snapshot-upload})]
                          (update-progress {:sub-type :upload-progress
                                            :message (str "Uploading " loaded' "/" total-rows)})
                          (p/recur max-addr false loaded'))))))
                (p/finally
                  (fn []
                    (cleanup-temp-sqlite! temp)))))))
         (p/rejected (ex-info "db-sync missing datascript conn"
                              {:repo repo :graph-id graph-id})))
       (p/rejected (ex-info "db-sync missing upload info"
                            {:repo repo :base base :graph-id graph-id}))))
   (p/catch (fn [error]
              (js/console.error error)))))
