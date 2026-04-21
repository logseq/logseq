(ns frontend.common.idbkv
  "IndexedDB")

(defn- get-indexeddb []
  (cond
    (exists? js/window) (.-indexedDB js/window)
    (exists? js/indexedDB) js/indexedDB
    :else nil))

(defn- make-store
  ([]
   (make-store "keyval-store" "keyval" 1))
  ([db-name store-name version]
   (let [state (atom {:store-name  store-name
                      :db-name     db-name
                      :store-name* store-name
                      :version     version
                      :id          (str "dbName:" db-name ";;storeName:" store-name)
                      :dbp         nil})]

     (letfn [(init! []
               (when-not (:dbp @state)
                 (let [p (js/Promise.
                          (fn [resolve reject]
                            (let [idb (get-indexeddb)]
                              (if-not idb
                                (reject (js/Error. "indexedDB is not available"))
                                (let [openreq (.open idb db-name version)]
                                  (set! (.-onerror openreq)
                                        (fn []
                                          (reject (.-error openreq))))
                                  (set! (.-onsuccess openreq)
                                        (fn []
                                          (resolve (.-result openreq))))
                                  (set! (.-onupgradeneeded openreq)
                                        (fn []
                                          (.createObjectStore (.-result openreq) store-name))))))))]
                   (swap! state assoc :dbp p))))

             (with-idb-store
               [tx-type callback]
               (init!)
               (.then (:dbp @state)
                      (fn [db]
                        (js/Promise.
                         (fn [resolve reject]
                           (let [tx (.transaction db (:store-name @state) tx-type)]
                             (set! (.-oncomplete tx)
                                   (fn []
                                     (resolve nil)))
                             (set! (.-onabort tx)
                                   (fn []
                                     (reject (.-error tx))))
                             (set! (.-onerror tx)
                                   (fn []
                                     (reject (.-error tx))))
                             (callback (.objectStore tx (:store-name @state)))))))))

             (close! []
               (init!)
               (.then (:dbp @state)
                      (fn [db]
                        (.close db)
                        (swap! state assoc :dbp nil))))]

       {:state state
        :init! init!
        :with-idb-store with-idb-store
        :close! close!}))))

(defn new-store
  ([] (make-store))
  ([db-name store-name version]
   (make-store db-name store-name version)))

(defonce ^:private default-store* (atom nil))

(defn- get-default-store []
  (or @default-store*
      (let [s (make-store)]
        (reset! default-store* s)
        s)))

(defn- store-id [store]
  (:id @(:state store)))

(defn get-item
  ([key]
   (get-item key (get-default-store)))
  ([key store]
   (let [req* (atom nil)]
     (.then ((:with-idb-store store)
             "readwrite"
             (fn [os]
               (reset! req* (.get os key))))
            (fn []
              (.-result @req*))))))

(defn- make-batcher [executor]
  (let [state (atom {:items   []
                     :ongoing nil})]
    (letfn [(process! []
              (let [to-process (:items @state)]
                (swap! state assoc :items [])
                (.then
                 (executor (mapv :item to-process))
                 (fn []
                   (doseq [{:keys [on-processed]} to-process]
                     (on-processed))
                   (if (seq (:items @state))
                     (let [p (process!)]
                       (swap! state assoc :ongoing p)
                       p)
                     (do
                       (swap! state assoc :ongoing nil)
                       nil))))))

            (queue! [item]
              (let [p (js/Promise.
                       (fn [resolve _reject]
                         (swap! state update :items conj {:item item
                                                          :on-processed resolve})))]
                (when-not (:ongoing @state)
                  (let [ongoing (process!)]
                    (swap! state assoc :ongoing ongoing)))
                p))]

      {:queue! queue!
       :state state})))

(defonce ^:private set-batchers* (atom {}))

(defn set-item
  ([key value]
   (set-item key value (get-default-store)))
  ([key value store]
   (let [sid (store-id store)
         batcher (or (get @set-batchers* sid)
                     (let [b (make-batcher
                              (fn [items]
                                ((:with-idb-store store)
                                 "readwrite"
                                 (fn [os]
                                   (doseq [{:keys [key value]} items]
                                     (.put os value key))))))]
                       (swap! set-batchers* assoc sid b)
                       b))]
     ((:queue! batcher) {:key key :value value}))))

(comment
  (defn set-batch
   ([items]
    (set-batch items (get-default-store)))
   ([items store]
    ((:with-idb-store store)
     "readwrite"
     (fn [os]
       (doseq [{:keys [key value]} items]
         (.put os value key)))))))

(defn del
  ([key]
   (del key (get-default-store)))
  ([key store]
   ((:with-idb-store store)
    "readwrite"
    (fn [os]
      (.delete os key)))))

(comment
  (defn get-keys
   ([]
    (get-keys (get-default-store)))
   ([store]
    (let [result* (atom [])]
      (.then
       ((:with-idb-store store)
        "readwrite"
        (fn [os]
          (let [cursor-fn (or (.-openKeyCursor os)
                              (.-openCursor os))
                req (.call cursor-fn os)]
            (set! (.-onsuccess req)
                  (fn []
                    (let [res (.-result req)]
                      (when res
                        (swap! result* conj (.-key res))
                        (.continue res))))))))
       (fn []
         @result*))))))

(comment
  (defn close
   ([]
    (close (get-default-store)))
   ([store]
    ((:close! store)))))
