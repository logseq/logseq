(ns frontend.worker.sync.assets
  "Asset sync helpers for db sync."
  (:require
   [datascript.core :as d]
   [frontend.common.crypt :as crypt]
   [frontend.worker.platform :as platform]
   [frontend.worker.shared-service :as shared-service]
   [frontend.worker.state :as worker-state]
   [frontend.worker.sync.auth :as sync-auth]
   [frontend.worker.sync.client-op :as client-op]
   [frontend.worker.sync.crypt :as sync-crypt]
   [frontend.worker.sync.large-title :as sync-large-title]
   [lambdaisland.glogi :as log]
   [logseq.melange.bridge.common.api :as melange-common]
   [logseq.melange.bridge.db.core :as ldb]
   [promesa.core :as p]))

(def max-asset-size (* 100 1024 1024))

(defonce *repo->missing-asset-upload-files
  (atom {}))

(def ^:private remote-asset-download-parallelism 10)

(defn graph-aes-key
  [repo graph-id fail-fast-f]
  (if (sync-crypt/graph-e2ee? repo)
    (p/let [aes-key (sync-crypt/<ensure-graph-aes-key repo graph-id)
            _ (when (nil? aes-key)
                (fail-fast-f :db-sync/missing-field {:repo repo :field :aes-key}))]
      aes-key)
    (p/resolved nil)))

(defn- asset-file-name
  [asset-uuid asset-type]
  (str asset-uuid "." asset-type))

(defn- ->uint8
  [payload]
  (cond
    (instance? js/Uint8Array payload)
    payload

    (instance? js/ArrayBuffer payload)
    (js/Uint8Array. payload)

    (and (exists? js/ArrayBuffer)
         (.isView js/ArrayBuffer payload))
    (js/Uint8Array. (.-buffer payload) (.-byteOffset payload) (.-byteLength payload))

    (array? payload)
    (js/Uint8Array. payload)

    (sequential? payload)
    (js/Uint8Array. (clj->js payload))

    (and (object? payload)
         (= "Buffer" (aget payload "type"))
         (array? (aget payload "data")))
    (js/Uint8Array. (aget payload "data"))

    :else
    (throw (ex-info "unsupported binary payload"
                    {:payload-type (str (type payload))}))))

(defn- payload-size
  [payload]
  (cond
    (string? payload) (count payload)
    (some? (.-byteLength payload)) (.-byteLength payload)
    (some? (.-length payload)) (.-length payload)
    :else 0))

(defn- notify-asset-progress!
  [repo asset-id direction loaded total]
  (shared-service/broadcast-to-clients!
   :rtc-asset-upload-download-progress
   {:repo repo
    :asset-id asset-id
    :progress {:direction direction
               :loaded loaded
               :total total}}))

(defn- missing-asset-upload-file
  [asset-id asset-type]
  {:asset-id asset-id
   :asset-type asset-type
   :file (str melange-common/local-assets-dir "/" (asset-file-name asset-id asset-type))})

(defn- mark-missing-asset-upload-file!
  [repo asset-id asset-type]
  (swap! *repo->missing-asset-upload-files
         update repo
         (fn [files]
           (assoc (or files {})
                  asset-id
                  (missing-asset-upload-file asset-id asset-type))))
  nil)

(defn- clear-missing-asset-upload-file!
  [repo asset-id]
  (swap! *repo->missing-asset-upload-files
         (fn [repo->files]
           (let [files (dissoc (get repo->files repo) asset-id)]
             (if (seq files)
               (assoc repo->files repo files)
               (dissoc repo->files repo)))))
  nil)

(defn get-missing-asset-upload-files
  [repo]
  (->> (vals (get @*repo->missing-asset-upload-files repo))
       (sort-by :file)
       vec))

(defn clear-missing-asset-upload-files!
  [repo]
  (swap! *repo->missing-asset-upload-files dissoc repo)
  nil)

(defn- mark-asset-write-finish!
  [repo asset-id]
  (shared-service/broadcast-to-clients!
   :asset-file-write-finish
   {:repo repo
    :asset-id asset-id
    :ts (melange-common/now-ms)}))

(defn- <read-asset-bytes
  [repo asset-id asset-type]
  (platform/asset-read-bytes! (platform/current)
                              repo
                              (asset-file-name asset-id asset-type)))

(defn- <write-asset-bytes!
  [repo asset-id asset-type payload]
  (p/let [_ (platform/asset-write-bytes! (platform/current)
                                         repo
                                         (asset-file-name asset-id asset-type)
                                         payload)]
    (mark-asset-write-finish! repo asset-id)
    nil))

(defn upload-remote-asset!
  [repo graph-id asset-uuid asset-type checksum]
  (let [base (sync-auth/http-base-url @worker-state/*db-sync-config)]
    (if (and (seq base) (seq graph-id) (seq asset-type) (seq checksum))
      (-> (p/let [aes-key (graph-aes-key
                           repo graph-id
                           (fn [tag data]
                             (throw (ex-info (name tag) data))) )
                  asset-id (str asset-uuid)
                  put-url (sync-large-title/asset-url base graph-id asset-id asset-type)
                  asset-bytes (->
                               (<read-asset-bytes repo asset-id asset-type)
                               (p/catch (fn [e]
                                          (log/error :read-asset-failed e)
                                          (mark-missing-asset-upload-file! repo asset-id asset-type)
                                          (throw (ex-info "read-asset failed"
                                                          {:type :rtc.exception/read-asset-failed}
                                                          e)))))
                  _ (clear-missing-asset-upload-file! repo asset-id)
                  asset-bytes (if aes-key (->uint8 asset-bytes) asset-bytes)
                  payload (if (not aes-key)
                            asset-bytes
                            (p/let [encrypted-bytes (crypt/<encrypt-uint8array aes-key asset-bytes)]
                              (ldb/write-transit-str encrypted-bytes)))
                  total (payload-size payload)
                  _ (notify-asset-progress! repo asset-id :upload 0 total)
                  headers (merge (sync-auth/auth-headers (worker-state/get-id-token))
                                 {"x-amz-meta-checksum" checksum
                                  "x-amz-meta-type" asset-type})
                  ^js resp (js/fetch put-url
                                     (clj->js {:method "PUT"
                                               :headers headers
                                               :body payload}))
                  status (.-status resp)
                  _ (notify-asset-progress! repo asset-id :upload total total)]
            (when-not (.-ok resp)
              (throw (ex-info "upload-asset failed"
                              {:type :rtc.exception/upload-asset-failed
                               :data {:status status}})))
            nil)
          (p/catch
           (fn [e]
             (if (contains? #{:rtc.exception/read-asset-failed
                              :rtc.exception/upload-asset-failed}
                            (:type (ex-data e)))
               (p/rejected e)
               (p/rejected (ex-info "upload-asset failed"
                                    {:type :rtc.exception/upload-asset-failed}
                                    e))))))
      (p/rejected (ex-info "missing asset upload info"
                           {:repo repo
                            :asset-uuid asset-uuid
                            :asset-type asset-type
                            :checksum checksum
                            :base base
                            :graph-id graph-id})))))

(defn- drop-asset-op!
  [repo asset-uuid reason data current-client-f broadcast-rtc-state!-f]
  (log/warn :db-sync/drop-asset-op
            (merge data
                   {:repo repo
                    :asset-uuid asset-uuid
                    :reason reason}))
  (clear-missing-asset-upload-file! repo (str asset-uuid))
  (client-op/remove-asset-op repo asset-uuid)
  (when-let [client (current-client-f repo)]
    (broadcast-rtc-state!-f client))
  (p/resolved nil))

(defn process-asset-op!
  [repo graph-id asset-op {:keys [current-client-f broadcast-rtc-state!-f fail-fast-f]}]
  (let [asset-uuid (:block/uuid asset-op)
        op-type (cond
                  (contains? asset-op :update-asset) :update-asset
                  (contains? asset-op :remove-asset) :remove-asset
                  :else :unknown)]
    (when-not asset-uuid
      (fail-fast-f :db-sync/missing-field {:repo repo :field :asset-uuid :op op-type}))
    (cond
      (contains? asset-op :update-asset)
      (if-let [conn (worker-state/get-datascript-conn repo)]
        (let [ent (d/entity @conn [:block/uuid asset-uuid])
              asset-type (:logseq.property.asset/type ent)
              checksum (:logseq.property.asset/checksum ent)
              size (:logseq.property.asset/size ent 0)]
          (cond
            (nil? ent)
            (drop-asset-op! repo asset-uuid :missing-asset-entity {:op :update-asset}
                            current-client-f broadcast-rtc-state!-f)

            (not (seq asset-type))
            (drop-asset-op! repo asset-uuid :missing-asset-type {:op :update-asset}
                            current-client-f broadcast-rtc-state!-f)

            (not (seq checksum))
            (drop-asset-op! repo asset-uuid :missing-checksum
                            {:op :update-asset
                             :asset-type asset-type}
                            current-client-f broadcast-rtc-state!-f)

            (> size max-asset-size)
            (do
              (log/info :db-sync/asset-too-large {:repo repo
                                                  :asset-uuid asset-uuid
                                                  :size size})
              (clear-missing-asset-upload-file! repo (str asset-uuid))
              (client-op/remove-asset-op repo asset-uuid)
              (when-let [client (current-client-f repo)]
                (broadcast-rtc-state!-f client))
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
                          (when-let [client (current-client-f repo)]
                            (broadcast-rtc-state!-f client))))
                (p/catch (fn [e]
                           (case (:type (ex-data e))
                            :rtc.exception/read-asset-failed
                             (when-let [client (current-client-f repo)]
                               (broadcast-rtc-state!-f client))

                             :rtc.exception/upload-asset-failed
                             nil

                             (log/error :db-sync/asset-upload-failed
                                        {:repo repo
                                         :asset-uuid asset-uuid
                                         :error e})))))))
        (fail-fast-f :db-sync/missing-db {:repo repo :op :process-asset-op}))

      (contains? asset-op :remove-asset)
      (do
        (clear-missing-asset-upload-file! repo (str asset-uuid))
        (-> (client-op/remove-asset-op repo asset-uuid)
            (p/then (fn [_]
                      (when-let [client (current-client-f repo)]
                        (broadcast-rtc-state!-f client))))
            (p/catch (fn [e]
                       (log/error :db-sync/asset-delete-failed
                                  {:repo repo
                                   :asset-uuid asset-uuid
                                   :error e})))))

      :else
      (p/resolved nil))))

(defn process-asset-ops!
  [repo client {:keys [current-client-f broadcast-rtc-state!-f fail-fast-f]}]
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
            worker (fn worker []
                     (if-let [asset-op (pop-queue!)]
                       (-> (p/let [_ (process-asset-op! repo graph-id asset-op
                                                        {:current-client-f current-client-f
                                                         :broadcast-rtc-state!-f broadcast-rtc-state!-f
                                                         :fail-fast-f fail-fast-f})]
                             (worker))
                           (p/catch (fn [e]
                                      (log/error :db-sync/process-asset-op-loop-failed
                                                 {:repo repo
                                                  :asset-op asset-op
                                                  :error e}))))
                       (p/resolved nil)))]
        (p/all (mapv (fn [_] (worker))
                     (range (min parallelism (count asset-ops))))))
      (p/resolved nil))))

(defn enqueue-asset-sync!
  [repo client {:keys [enqueue-asset-task-f current-client-f broadcast-rtc-state!-f fail-fast-f]}]
  (enqueue-asset-task-f
   client
   #(process-asset-ops!
     repo client
     {:current-client-f current-client-f
      :broadcast-rtc-state!-f broadcast-rtc-state!-f
      :fail-fast-f fail-fast-f})))

(defn- parse-content-length
  [^js resp]
  (when-let [content-length (some-> (.-headers resp) (.get "content-length"))]
    (let [length (js/parseInt content-length 10)]
      (when (not (js/isNaN length))
        length))))

(defn download-remote-asset!
  [repo graph-id asset-uuid asset-type]
  (let [base (sync-auth/http-base-url @worker-state/*db-sync-config)]
    (if (and (seq base) (seq graph-id) (seq asset-type))
      (-> (p/let [aes-key (graph-aes-key
                           repo graph-id
                           (fn [tag data]
                             (throw (ex-info (name tag) data))))
                  asset-id (str asset-uuid)
                  get-url (sync-large-title/asset-url base graph-id asset-id asset-type)
                  headers (sync-auth/auth-headers (worker-state/get-id-token))
                  request-opts (cond-> {:method "GET"}
                                 (seq headers) (assoc :headers headers))
                  ^js resp (js/fetch get-url
                                     (clj->js request-opts))
                  status (.-status resp)
                  _ (when-not (.-ok resp)
                      (throw (ex-info "download asset failed"
                                      {:type :rtc.exception/download-asset-failed
                                       :data {:status status}})))
                  total (or (parse-content-length resp) 0)
                  _ (notify-asset-progress! repo asset-id :download 0 total)
                  body (.arrayBuffer resp)
                  body-size (.-byteLength body)
                  total' (if (pos? total) total body-size)
                  _ (notify-asset-progress! repo asset-id :download body-size total')
                  asset-file
                  (if (not aes-key)
                    body
                    (let [asset-file-untransited (ldb/read-transit-str (.decode (js/TextDecoder.) body))]
                      (crypt/<decrypt-uint8array aes-key asset-file-untransited)))]
            (<write-asset-bytes! repo asset-id asset-type asset-file))
          (p/catch
           (fn [e]
             (if (= :rtc.exception/download-asset-failed (:type (ex-data e)))
               (p/rejected e)
               (p/rejected (ex-info "download asset failed"
                                    {:type :rtc.exception/download-asset-failed}
                                    e))))))
      (p/rejected (ex-info "missing asset download info"
                           {:repo repo
                            :asset-uuid asset-uuid
                            :asset-type asset-type
                            :base base
                            :graph-id graph-id})))))

(defn log-request-asset-download-failed!
  [repo asset-uuid error]
  (log/error :db-sync/request-asset-download-failed
             {:repo repo
              :asset-uuid asset-uuid
              :error error}))

(defn request-asset-download!
  [repo asset-uuid {:keys [current-client-f enqueue-asset-task-f broadcast-rtc-state!-f]}]
  (when-let [client (current-client-f repo)]
    (when-let [graph-id (:graph-id client)]
      (enqueue-asset-task-f
       client
       #(when-let [conn (worker-state/get-datascript-conn repo)]
          (when-let [ent (d/entity @conn [:block/uuid asset-uuid])]
            (let [asset-type (:logseq.property.asset/type ent)
                  asset-id (str asset-uuid)
                  should-download? (and (seq asset-type)
                                        (:logseq.property.asset/remote-metadata ent))]
              (-> (p/let [meta (when should-download?
                                 (platform/asset-stat (platform/current)
                                                      repo
                                                      (asset-file-name asset-id asset-type)))
                          missing-local? (and should-download? (nil? meta))
                          _ (when missing-local?
                              (download-remote-asset! repo graph-id asset-uuid asset-type))
                          _ (when missing-local?
                              (client-op/remove-asset-op repo asset-uuid))
                          _ (when missing-local?
                              (broadcast-rtc-state!-f client))]
                    nil)
                  (p/catch (fn [e]
                             (log-request-asset-download-failed! repo asset-uuid e)
                             (p/rejected e)))))))))))

(defn- remote-asset-download-candidates
  [db]
  (->> (d/q '[:find ?e ?asset-uuid ?asset-type
              :where
              [?asset-class :db/ident :logseq.class/Asset]
              [?e :block/tags ?asset-class]
              [?e :block/uuid ?asset-uuid]
              [?e :logseq.property.asset/type ?asset-type]
              [?e :logseq.property.asset/remote-metadata]]
            db)
       (keep (fn [[e asset-uuid asset-type]]
               (let [ent (d/entity db e)]
                 (when-not (seq (some-> (:logseq.property.asset/external-url ent) str))
                   {:asset-uuid asset-uuid
                    :asset-type asset-type}))))
       (sort-by (comp str :asset-uuid))))

(defn download-remote-assets-if-missing!
  [repo graph-id candidates]
  (let [candidates (->> candidates
                        (filter (fn [{:keys [asset-uuid asset-type]}]
                                  (and asset-uuid (seq asset-type))))
                        distinct
                        (sort-by (juxt (comp str :asset-uuid) :asset-type)))
        current-platform (platform/current)
        queue (atom (vec candidates))
        result (atom {:total (count candidates)
                      :downloaded 0
                      :skipped-existing 0})
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
        worker (fn worker []
                 (if-let [{:keys [asset-uuid asset-type]} (pop-queue!)]
                   (let [asset-id (str asset-uuid)]
                     (p/let [meta (platform/asset-stat current-platform
                                                       repo
                                                       (asset-file-name asset-id asset-type))
                             _ (if meta
                                 (do
                                   (swap! result update :skipped-existing inc)
                                   nil)
                                 (p/let [_ (download-remote-asset! repo graph-id asset-uuid asset-type)]
                                   (swap! result update :downloaded inc)))]
                       (worker)))
                   (p/resolved nil)))]
    (p/let [_ (p/all (mapv (fn [_] (worker))
                           (range (min remote-asset-download-parallelism
                                       (count candidates)))))]
      @result)))

(defn remote-asset-download-candidates-in-tx
  [db tx-data]
  (->> tx-data
       (keep (fn [d]
               (when (and (= (:a d) :logseq.property.asset/remote-metadata) (:added d))
                 (when-let [asset (d/entity db (:e d))]
                   {:asset-uuid (:block/uuid asset)
                    :asset-type (:logseq.property.asset/type asset)}))))
       distinct))

(defn download-missing-remote-assets!
  [repo graph-id]
  (if-let [conn (worker-state/get-datascript-conn repo)]
    (download-remote-assets-if-missing!
     repo graph-id (remote-asset-download-candidates @conn))
    (p/rejected (ex-info "datascript connection not found"
                         {:repo repo
                          :graph-id graph-id}))))
