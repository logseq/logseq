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
            [logseq.db-sync.cycle :as sync-cycle]
            [logseq.db-sync.malli-schema :as db-sync-schema]
            [logseq.db-sync.order :as sync-order]
            [logseq.db.common.normalize :as db-normalize]
            [logseq.db.common.sqlite :as common-sqlite]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.transaction :as outliner-tx]
            [promesa.core :as p]))

(defonce *repo->latest-remote-tx (atom {}))
(defonce *start-inflight-target (atom nil))

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
(def ^:private upload-kvs-batch-size 500)
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

(defn- create-temp-sqlite-db
  []
  (if-let [sqlite @worker-state/*sqlite]
    (let [^js DB (.-DB ^js (.-oo1 sqlite))
          db (new DB ":memory:" "c")]
      (common-sqlite/create-kvs-table! db)
      db)
    (fail-fast :db-sync/missing-field {:field :sqlite})))

(defn- <create-temp-sqlite-conn
  [schema datoms]
  (p/let [db (create-temp-sqlite-db)
          storage (new-temp-sqlite-storage db)
          conn (d/conn-from-datoms datoms schema {:storage storage})]
    {:db db
     :conn conn}))

(defn- cleanup-temp-sqlite!
  [{:keys [db conn]}]
  (when conn
    (reset! conn nil))
  (when db
    (.close db)))

(defn- require-asset-field
  [repo field value context]
  (when (or (nil? value) (and (string? value) (string/blank? value)))
    (fail-fast :db-sync/missing-field
               (merge {:repo repo :field field :value value} context))))

(defn- persist-local-tx! [repo normalized-tx-data reversed-datoms _tx-meta]
  (when-let [conn (client-ops-conn repo)]
    (let [tx-id (random-uuid)
          now (.now js/Date)]
      (ldb/transact! conn [{:db-sync/tx-id tx-id
                            :db-sync/normalized-tx-data normalized-tx-data
                            :db-sync/reversed-tx-data reversed-datoms
                            :db-sync/created-at now}])
      (when-let [client (current-client repo)]
        (broadcast-rtc-state! client))
      tx-id)))

(defn- pending-txs
  [repo & {:keys [limit]}]
  (when-let [conn (client-ops-conn repo)]
    (let [db @conn
          datoms (d/datoms db :avet :db-sync/created-at)
          datoms' (if limit (take limit datoms) datoms)]
      (->> datoms'
           (map (fn [datom]
                  (d/entity db (:e datom))))
           (keep (fn [ent]
                   (let [tx-id (:db-sync/tx-id ent)]
                     {:tx-id tx-id
                      :tx (:db-sync/normalized-tx-data ent)
                      :reversed-tx (:db-sync/reversed-tx-data ent)})))
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

(defn- batched-remote-tx-data?
  [tx-data*]
  (and (seq tx-data*)
       (sequential? (first tx-data*))
       (sequential? (first (first tx-data*)))))

(defn- drop-anonymous-temp-entity-datoms
  "Drop malformed temp entities from remote txs.
   A temp entity must declare one identity attr (:block/uuid or :db/ident)
   in its :db/add datoms; otherwise it can create anonymous entities that fail validation."
  [db tx-data]
  (let [identity-attrs #{:block/uuid :db/ident}
        temp-id? (fn [x]
                   (or (string? x)
                       (and (integer? x) (neg? x))))
        add-attrs-by-entity
        (reduce (fn [acc item]
                  (if (and (vector? item)
                           (= :db/add (first item))
                           (>= (count item) 4))
                    (update acc (second item) (fnil conj #{}) (nth item 2))
                    acc))
                {}
                tx-data)
        dropped-entities
        (->> add-attrs-by-entity
             (keep (fn [[entity attrs]]
                     (when (and (temp-id? entity)
                                (empty? (set/intersection identity-attrs attrs)))
                       entity)))
             set)]
    (if (seq dropped-entities)
      (let [tx-data' (->> tx-data
                          (remove (fn [item]
                                    (and (vector? item)
                                         (>= (count item) 2)
                                         (contains? dropped-entities (second item)))))
                          (remove (fn [item]
                                    (and (vector? item)
                                         (>= (count item) 4)
                                         (keyword? (nth item 2))
                                         (= :db.type/ref (:db/valueType (d/entity db (nth item 2))))
                                         (contains? dropped-entities (nth item 3))))))]
        (log/warn :db-sync/drop-anonymous-temp-entities
                  {:count (count dropped-entities)
                   :entities dropped-entities})
        tx-data')
      tx-data)))

(defn- sanitize-tx-data
  [db tx-data local-deleted-ids]
  (let [sanitized-tx-data (->> tx-data
                               (db-normalize/replace-attr-retract-with-retract-entity-v2 db)
                               (remove (fn [item]
                                         (or (= :db/retractEntity (first item))
                                             (and (= :db/retract (first item))
                                                  (contains? #{:block/created-at :block/updated-at :block/title}
                                                             (nth item 2)))
                                             (contains? local-deleted-ids (get-lookup-id (last item))))))
                               ;; Notice: rebase should generate larger tx-id than reverse tx
                               (map (fn [item]
                                      (if (= (count item) 5)
                                        (vec (butlast item))
                                        item))))]
    ;; (when (not= tx-data sanitized-tx-data)
    ;;   (prn :debug :tx-data tx-data)
    ;;   (prn :debug :sanitized-tx-data sanitized-tx-data))
    sanitized-tx-data))

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
                (let [tx-ids (mapv :tx-id batch)
                      txs (mapcat :tx batch)
                      tx-data (->> txs
                                   (db-normalize/remove-retract-entity-ref @conn)
                                   distinct)]
                  ;; (prn :debug :before-keep-last-update txs)
                  ;; (prn :debug :upload :tx-data tx-data)
                  (when (seq txs)
                    (->
                     (p/let [aes-key (when (sync-crypt/graph-e2ee? repo)
                                       (sync-crypt/<ensure-graph-aes-key repo (:graph-id client)))
                             _ (when (and (sync-crypt/graph-e2ee? repo) (nil? aes-key))
                                 (fail-fast :db-sync/missing-field {:repo repo :field :aes-key}))
                             tx-data* (offload-large-titles
                                       tx-data
                                       {:repo repo
                                        :graph-id (:graph-id client)
                                        :aes-key aes-key})
                             tx-data** (if aes-key
                                         (sync-crypt/<encrypt-tx-data aes-key tx-data*)
                                         tx-data*)]

                       (reset! (:inflight client) tx-ids)
                       (send! ws {:type "tx/batch"
                                  :t-before local-tx
                                  :txs (sqlite-util/write-transit-str tx-data**)}))
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

(defn- offload-large-titles-in-datoms
  [repo graph-id datoms aes-key]
  (let [needs-offload (filterv (fn [datom]
                                 (and (= :block/title (:a datom))
                                      (string? (:v datom))
                                      (large-title? (:v datom))))
                               datoms)
        offload-entities (into #{} (map :e) needs-offload)]
    (if (empty? needs-offload)
      (p/resolved datoms)
      (p/let [offloaded (p/loop [remaining needs-offload
                                 result {}]
                          (if (empty? remaining)
                            result
                            (let [datom (first remaining)]
                              (p/let [obj (upload-large-title! repo graph-id (:v datom) aes-key)]
                                (p/recur (rest remaining)
                                         (assoc result (:e datom)
                                                {:placeholder (assoc datom :v "")
                                                 :obj-datom (assoc datom :a large-title-object-attr :v obj)}))))))]
        (reduce (fn [acc datom]
                  (if (contains? offload-entities (:e datom))
                    (if (= :block/title (:a datom))
                      (let [{:keys [placeholder obj-datom]} (get offloaded (:e datom))]
                        (-> acc (conj placeholder) (conj obj-datom)))
                      (conj acc datom))
                    (conj acc datom)))
                []
                datoms)))))

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
  [reversed-tx-report reversed-tx-data]
  (when (seq reversed-tx-data)
    (->>
     (:tx-data reversed-tx-report)
     (keep
      (fn [[e a v _t added]]
        (when (and (= :block/uuid a) added
                   (nil? (d/entity (:db-before reversed-tx-report)
                                   [:block/uuid v])))
          (d/entity (:db-after reversed-tx-report) e))))
     distinct)))

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
    (sync-order/fix-duplicate-orders! temp-conn
                                      (mapcat :tx-data [remote-tx-report
                                                        rebase-tx-report
                                                        cycle-tx-report])
                                      tx-meta)))

(defn- get-reverse-tx-data
  [local-txs]
  (let [tx-data (->> local-txs
                     reverse
                     (mapcat :reversed-tx))
        retract-block-ids (->> (keep (fn [[op e a _v _t]]
                                       (when (and (= op :db/retract) (= :block/uuid a))
                                         e)) tx-data)
                               set)
        tx-data' (if (seq retract-block-ids)
                   (remove (fn [[_op e _a v]]
                             (or (contains? retract-block-ids e)
                                 (contains? retract-block-ids v)))
                           tx-data)
                   tx-data)]

    (->>
     tx-data'
     (concat (map (fn [id] [:db/retractEntity id]) retract-block-ids)))))

(defn- apply-remote-tx-with-local-changes!
  [{:keys [conn local-txs reversed-tx-data safe-remote-tx-data remote-deleted-blocks
           temp-tx-meta *remote-tx-report *reversed-tx-report *remote-deleted-ids *rebase-tx-data]}]
  (let [batch-tx-meta {:rtc-tx? true}]
    (ldb/transact-with-temp-conn!
     conn
     batch-tx-meta
     (fn [temp-conn _*batch-tx-data]
       (let [tx-meta temp-tx-meta
             reversed-tx-report (ldb/transact! temp-conn reversed-tx-data (assoc tx-meta :op :reverse))
             _ (reset! *reversed-tx-report reversed-tx-report)
             ;; 2. transact remote tx-data
             remote-tx-report (let [tx-meta (assoc tx-meta :op :transact-remote-tx-data)]
                                (ldb/transact! temp-conn safe-remote-tx-data tx-meta))
             _ (reset! *remote-tx-report remote-tx-report)
             local-deleted-blocks (get-local-deleted-blocks reversed-tx-report reversed-tx-data)
             _ (when (seq remote-deleted-blocks)
                 (reset! *remote-deleted-ids (set (map :block/uuid remote-deleted-blocks))))
             deleted-nodes (concat local-deleted-blocks remote-deleted-blocks)
             deleted-ids (set (keep :block/uuid deleted-nodes))
             ;; 3. rebase pending local txs
             rebase-tx-report (when (seq local-txs)
                                (let [pending-tx-data (mapcat :tx local-txs)
                                      rebased-tx-data (sanitize-tx-data
                                                       (or (:db-after remote-tx-report)
                                                           (:db-after reversed-tx-report))
                                                       pending-tx-data
                                                       (set (map :block/uuid local-deleted-blocks)))]
                                  (when (seq rebased-tx-data)
                                    (ldb/transact! temp-conn rebased-tx-data (assoc tx-meta :op :rebase)))))
             ;; 4. fix tx data and delete nodes
             db @temp-conn
             deleted-nodes (keep (fn [id] (d/entity db [:block/uuid id])) deleted-ids)]
         (fix-tx! temp-conn remote-tx-report rebase-tx-report (assoc tx-meta :op :fix))
         (delete-nodes! temp-conn deleted-nodes (assoc tx-meta :op :delete-blocks))))
     {:listen-db (fn [{:keys [tx-meta tx-data]}]
                   (when-not (contains? #{:reverse :transact-remote-tx-data} (:op tx-meta))
                     (swap! *rebase-tx-data into tx-data)))})))

(defn- apply-remote-tx-without-local-changes!
  [{:keys [conn safe-remote-tx-data remote-deleted-block-ids temp-tx-meta]}]
  (let [db @conn]
    (ldb/transact-with-temp-conn!
     conn
     {:rtc-tx? true
      :without-local-changes? true}
     (fn [temp-conn]
       (when (seq safe-remote-tx-data)
         (d/transact! temp-conn safe-remote-tx-data {:rtc-tx? true}))
       (when-let [deleted-nodes (keep (fn [id] (d/entity db [:block/uuid id]))
                                      remote-deleted-block-ids)]
         (delete-nodes! temp-conn deleted-nodes
                        (assoc temp-tx-meta :op :delete-blocks)))))))

(defn- apply-remote-tx!
  [repo client tx-data*]
  (if (batched-remote-tx-data? tx-data*)
    (doseq [tx-data tx-data*]
      (apply-remote-tx! repo client tx-data))
    (if-let [conn (worker-state/get-datascript-conn repo)]
      (let [tx-data (->> tx-data*
                         (db-normalize/remove-retract-entity-ref @conn)
                         (#(drop-anonymous-temp-entity-datoms @conn %)))
            local-txs (pending-txs repo)
            reversed-tx-data (get-reverse-tx-data local-txs)
            has-local-changes? (seq reversed-tx-data)
            *remote-tx-report (atom nil)
            *reversed-tx-report (atom nil)
            *remote-deleted-ids (atom #{})
            *rebase-tx-data (atom [])
            db @conn
            remote-deleted-blocks (->> tx-data
                                       (keep (fn [item]
                                               (when (= :db/retractEntity (first item))
                                                 (d/entity db (second item))))))
            remote-deleted-block-ids (set (map :block/uuid remote-deleted-blocks))
            safe-remote-tx-data (->> tx-data
                                     (remove (fn [item]
                                               (or (= :db/retractEntity (first item))
                                                   (contains? remote-deleted-block-ids (get-lookup-id (last item))))))
                                     seq)
            temp-tx-meta {:rtc-tx? true
                          :temp-conn? true
                          :gen-undo-ops? false
                          :persist-op? false}
            apply-context {:conn conn
                           :local-txs local-txs
                           :reversed-tx-data reversed-tx-data
                           :safe-remote-tx-data safe-remote-tx-data
                           :remote-deleted-blocks remote-deleted-blocks
                           :remote-deleted-block-ids remote-deleted-block-ids
                           :temp-tx-meta temp-tx-meta
                           :*remote-tx-report *remote-tx-report
                           :*reversed-tx-report *reversed-tx-report
                           :*remote-deleted-ids *remote-deleted-ids
                           :*rebase-tx-data *rebase-tx-data}
            tx-report (if has-local-changes?
                        (apply-remote-tx-with-local-changes! apply-context)
                        (apply-remote-tx-without-local-changes! apply-context))
            remote-tx-report @*remote-tx-report]
        ;; persist rebase tx to client ops
        (when has-local-changes?
          (when-let [tx-data (seq @*rebase-tx-data)]
            (let [remote-tx-data-set (set tx-data*)
                  normalized (->> tx-data
                                  (normalize-tx-data (:db-after tx-report)
                                                     (or (:db-after remote-tx-report)
                                                         (:db-after @*reversed-tx-report)))
                                  (remove (fn [[op _e a]]
                                            (and (= op :db/retract)
                                                 (contains? #{:block/updated-at :block/created-at :block/title} a)))))
                  normalized-tx-data (remove remote-tx-data-set normalized)
                  reversed-datoms (reverse-tx-data tx-data)]
              ;; (prn :debug :normalized-tx-data normalized-tx-data)
              ;; (prn :debug :remote-tx-data tx-data*)
              ;; (prn :debug :diff (data/diff remote-tx-data-set
              ;;                              (set normalized)))
              (when (seq normalized-tx-data)
                (persist-local-tx! repo normalized-tx-data reversed-datoms {:op :rtc-rebase}))))
          (remove-pending-txs! repo (map :tx-id local-txs)))

        (when-let [*inflight (:inflight client)]
          (reset! *inflight []))

        (-> (rehydrate-large-titles! repo {:tx-data tx-data
                                           :graph-id (:graph-id client)})
            (p/catch (fn [error]
                       (log/error :db-sync/large-title-rehydrate-failed
                                  {:repo repo :error error}))))

        (reset! *remote-tx-report nil))
      (fail-fast :db-sync/missing-db {:repo repo :op :apply-remote-tx}))))

(defn- handle-message! [repo client raw]
  (let [message (-> raw parse-message coerce-ws-server-message)]
    (when-not (map? message)
      (fail-fast :db-sync/response-parse-failed {:repo repo :raw raw}))
    (let [local-tx (or (client-op/get-local-tx repo) 0)
          remote-tx (:t message)]
      (when remote-tx (swap! *repo->latest-remote-tx assoc repo remote-tx))

      (case (:type message)
        "hello" (do
                  (require-non-negative remote-tx {:repo repo :type "hello"})
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
                        (flush-pending! repo client))
        ;; Download response
        "pull/ok" (when (> remote-tx local-tx)
                    (let [txs (:txs message)
                          _ (require-non-negative remote-tx {:repo repo :type "pull/ok"})
                          _ (require-seq txs {:repo repo :type "pull/ok" :field :txs})
                          txs-data (mapv (fn [data]
                                           (parse-transit (:tx data) {:repo repo :type "pull/ok"}))
                                         txs)]
                      (when (seq txs-data)
                        (p/let [aes-key (sync-crypt/<ensure-graph-aes-key repo (:graph-id client))
                                _ (when (and (sync-crypt/graph-e2ee? repo) (nil? aes-key))
                                    (fail-fast :db-sync/missing-field {:repo repo :field :aes-key}))
                                tx-batches (if aes-key
                                             (p/all (mapv (fn [tx-data]
                                                            (sync-crypt/<decrypt-tx-data aes-key tx-data))
                                                          txs-data))
                                             (p/resolved txs-data))]
                          (apply-remote-tx! repo client tx-batches)
                          (client-op/update-local-tx repo remote-tx)
                          (broadcast-rtc-state! client)
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

                        (fail-fast :db-sync/invalid-field
                                   {:repo repo :type "tx/reject" :reason reason})))
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
                                (let [updated (connect! repo current url)]
                                  (reset! worker-state/*db-sync-client updated)))))
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

(defn- connect! [repo client url]
  (when (:ws client)
    (stop-client! client))
  (let [ws (js/WebSocket. (append-token url (auth-token)))
        updated (assoc client :ws ws)]
    (attach-ws-handlers! repo updated ws url)
    (set! (.-onopen ws)
          (fn [_]
            (reset-reconnect! updated)
            (touch-last-ws-message! updated)
            (set-ws-state! updated :open)
            (send! ws {:type "hello" :client repo})
            (enqueue-asset-sync! repo updated)))
    (close-stale-ws-loop updated ws)))

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
          (let [client (ensure-client-state! repo)
                url (format-ws-url base graph-id)
                _ (ensure-client-graph-uuid! repo graph-id)
                connected (assoc client :graph-id graph-id)
                connected (connect! repo connected url)]
            (reset! worker-state/*db-sync-client connected)
            nil))
         (p/finally
           (fn []
             (when (= start-target @*start-inflight-target)
               (reset! *start-inflight-target nil)))))))))

(defn enqueue-local-tx!
  [repo {:keys [tx-meta tx-data db-after db-before]}]
  (when-not (:rtc-tx? tx-meta)
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
                         (ldb/kv :logseq.kv/graph-rtc-e2ee? (true? graph-e2ee?))])))

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
             (p/let [datoms (d/datoms @source-conn :eavt)
                     _ (prn :debug :datoms-count (count datoms) :time (js/Date.))
                     datoms* (offload-large-titles-in-datoms repo graph-id datoms aes-key)
                     _ (update-progress {:sub-type :upload-progress
                                         :message (if graph-e2ee? "Encrypting data" "Preparing data")})
                     encrypted-datoms (if graph-e2ee?
                                        (sync-crypt/<encrypt-datoms aes-key datoms*)
                                        datoms*)
                     {:keys [db] :as temp} (<create-temp-sqlite-conn (d/schema @source-conn) encrypted-datoms)
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
                            upload-url (str base "/sync/" graph-id "/snapshot/upload?reset=" (if first-batch? "true" "false"))]
                        (p/let [{:keys [body encoding]} (<snapshot-upload-body rows)
                                headers (cond-> {"content-type" snapshot-content-type}
                                          (string? encoding) (assoc "content-encoding" encoding))
                                _ (fetch-json upload-url
                                              {:method "POST"
                                               :headers headers
                                               :body body}
                                              {:response-schema :sync/snapshot-upload})]
                          (let [loaded' (+ loaded (count rows))]
                            (update-progress {:sub-type :upload-progress
                                              :message (str "Uploading " loaded' "/" total-rows)})
                            (p/recur max-addr false loaded')))))))
                (p/finally
                  (fn []
                    (cleanup-temp-sqlite! temp)))))))
         (p/rejected (ex-info "db-sync missing datascript conn"
                              {:repo repo :graph-id graph-id})))
       (p/rejected (ex-info "db-sync missing upload info"
                            {:repo repo :base base :graph-id graph-id}))))
   (p/catch (fn [error]
              (js/console.error error)))))
