(ns frontend.worker.sync.large-title
  "Large title offload and rehydration helpers for db sync."
  (:require [datascript.core :as d]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(def large-title-byte-limit 4096)
(def large-title-asset-type "txt")
(def large-title-object-attr :logseq.property.sync/large-title-object)
(def text-encoder (js/TextEncoder.))
(def text-decoder (js/TextDecoder.))

(defn utf8-byte-length
  [value]
  (when (string? value)
    (.-length (.encode text-encoder value))))

(defn large-title?
  [value]
  (when-let [byte-length (utf8-byte-length value)]
    (> byte-length large-title-byte-limit)))

(defn assoc-datom-value
  [datom new-value]
  (let [[op e a _v & others] datom]
    (into [op e a new-value] others)))

(defn large-title-object
  [asset-uuid asset-type]
  {:asset-uuid asset-uuid
   :asset-type asset-type})

(defn large-title-object?
  [value]
  (and (map? value)
       (string? (:asset-uuid value))
       (string? (:asset-type value))))

(defn get-graph-id
  [get-datascript-conn repo]
  (when-let [conn (get-datascript-conn repo)]
    (when-let [graph-uuid (ldb/get-graph-rtc-uuid @conn)]
      (str graph-uuid))))

(defn asset-url
  [base graph-id asset-uuid asset-type]
  (str base "/assets/" graph-id "/" asset-uuid "." asset-type))

(defn upload-large-title!
  [{:keys [repo
           graph-id
           title
           aes-key
           http-base
           auth-headers
           fail-fast-f
           encrypt-text-value-f]}]
  (when-not (seq http-base)
    (fail-fast-f :db-sync/missing-field {:repo repo :field :http-base}))
  (when-not (seq graph-id)
    (fail-fast-f :db-sync/missing-field {:repo repo :field :graph-id}))
  (let [asset-uuid (str (random-uuid))
        asset-type large-title-asset-type
        url (asset-url http-base graph-id asset-uuid asset-type)]
    (p/let [payload (if aes-key
                      (p/let [payload-str (encrypt-text-value-f aes-key title)]
                        (.encode text-encoder payload-str))
                      (p/resolved title))
            headers (merge {"content-type" "text/plain; charset=utf-8"
                            "x-amz-meta-type" asset-type}
                           auth-headers)
            resp (js/fetch url #js {:method "PUT"
                                    :headers (clj->js headers)
                                    :body payload})]
      (if (.-ok resp)
        (large-title-object asset-uuid asset-type)
        (fail-fast-f :db-sync/large-title-upload-failed
                     {:repo repo :status (.-status resp)})))))

(defn download-large-title!
  [{:keys [repo
           graph-id
           obj
           aes-key
           http-base
           auth-headers
           fail-fast-f
           decrypt-text-value-f]}]
  (when-not (seq http-base)
    (fail-fast-f :db-sync/missing-field {:repo repo :field :http-base}))
  (when-not (seq graph-id)
    (fail-fast-f :db-sync/missing-field {:repo repo :field :graph-id}))
  (let [url (asset-url http-base graph-id (:asset-uuid obj) (:asset-type obj))]
    (p/let [resp (js/fetch url #js {:method "GET"
                                    :headers (clj->js auth-headers)})]
      (when-not (.-ok resp)
        (fail-fast-f :db-sync/large-title-download-failed
                     {:repo repo :status (.-status resp)}))
      (p/let [buf (.arrayBuffer resp)
              payload (js/Uint8Array. buf)
              payload-str (.decode text-decoder payload)
              data (if aes-key
                     (-> (decrypt-text-value-f aes-key payload-str)
                         (p/catch (fn [_] payload-str)))
                     (p/resolved payload-str))]
        data))))

(defn offload-large-titles
  [tx-data {:keys [repo graph-id upload-fn aes-key]}]
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
          (p/recur (rest remaining) (conj acc item)))))))

(defn rehydrate-large-titles!
  [repo {:keys [graph-id
                download-fn
                aes-key
                tx-data
                conn
                get-conn-f
                get-graph-id-f
                graph-e2ee?-f
                ensure-graph-aes-key-f
                fail-fast-f]}]
  (when-let [conn* (or conn (get-conn-f repo))]
    (let [graph-id* (or graph-id (get-graph-id-f repo))
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
                  (->> (d/datoms @conn* :eavt)
                       (keep (fn [datom]
                               (when (= large-title-object-attr (:a datom))
                                 (let [obj (:v datom)]
                                   (when (large-title-object? obj)
                                     {:e (:e datom)
                                      :obj obj})))))
                       (distinct)))]
      (when (seq items)
        (p/let [aes-key* (or aes-key
                             (when (graph-e2ee?-f repo)
                               (ensure-graph-aes-key-f repo graph-id*)))
                _ (when (and (graph-e2ee?-f repo) (nil? aes-key*))
                    (fail-fast-f :db-sync/missing-field {:repo repo :field :aes-key}))]
          (p/all
           (mapv (fn [{:keys [e obj]}]
                   (p/let [title (download-fn repo graph-id* obj aes-key*)]
                     (ldb/transact! conn*
                                    [[:db/add e :block/title title]]
                                    {:rtc-tx? true
                                     :persist-op? false
                                     :op :large-title-rehydrate})))
                 items)))))))

(defn offload-large-titles-in-datoms-batch
  [repo graph-id datoms aes-key upload-fn]
  (p/loop [remaining datoms
           acc []]
    (if (empty? remaining)
      acc
      (let [datom (first remaining)]
        (if (and (= :block/title (:a datom))
                 (string? (:v datom))
                 (large-title? (:v datom)))
          (p/let [obj (upload-fn repo graph-id (:v datom) aes-key)]
            (p/recur (rest remaining)
                     (conj acc
                           (assoc datom :v "")
                           (assoc datom :a large-title-object-attr :v obj))))
          (p/recur (rest remaining) (conj acc datom)))))))

(defn take-upload-datoms-batch
  [datoms batch-size]
  (loop [batch (transient [])
         remaining (seq datoms)
         n 0]
    (if (or (nil? remaining) (>= n batch-size))
      [(persistent! batch) remaining]
      (recur (conj! batch (first remaining))
             (next remaining)
             (inc n)))))

(defn datom->tx
  [datom]
  [:db/add (:e datom) (:a datom) (:v datom)])

(defn process-upload-datoms-in-batches!
  [datoms {:keys [batch-size process-batch-f progress-f]
           :or {batch-size 100000}}]
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

(defn rehydrate-large-titles-from-db!
  [repo graph-id {:keys [get-conn-f rehydrate-large-titles!-f]}]
  (when-let [conn (get-conn-f repo)]
    (let [tx-data (mapv (fn [datom]
                          [:db/add (:e datom) large-title-object-attr (:v datom)])
                        (d/datoms @conn :avet large-title-object-attr))]
      (rehydrate-large-titles!-f repo {:tx-data tx-data :graph-id graph-id}))))
