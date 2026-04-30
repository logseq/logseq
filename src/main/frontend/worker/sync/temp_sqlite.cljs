(ns frontend.worker.sync.temp-sqlite
  "Temporary sqlite helpers for db sync uploads."
  (:require [cljs-bean.core :as bean]
            [datascript.core :as d]
            [datascript.storage :refer [IStorage]]
            [logseq.db.common.sqlite :as common-sqlite]
            [logseq.db.sqlite.util :as sqlite-util]
            [promesa.core :as p]
            [frontend.worker-common.util :as worker-util]
            [frontend.worker.platform :as platform]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.util :refer [fail-fast]]))

(def upload-temp-pool-name (worker-util/get-pool-name "upload-temp"))

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
          data (sqlite-util/read-transit-str content)]
      (if (and addresses (map? data))
        (assoc data :addresses addresses)
        data))))

(defn new-temp-sqlite-storage
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
                           :$content (sqlite-util/write-transit-str data')
                           :$addresses addresses}))
                  addr+data-seq)]
        (upsert-addr-content! db data)))
    (-restore [_ addr]
      (restore-data-from-addr db addr))))

(defn <create-temp-sqlite-db!
  []
  (if-let [sqlite @worker-state/*sqlite]
    (let [current-platform (platform/current)]
      (p/let [pool (platform/install-storage-pool current-platform sqlite upload-temp-pool-name)
              path (platform/resolve-db-path current-platform upload-temp-pool-name pool "/upload.sqlite")
              db (platform/sqlite-open current-platform
                                       {:sqlite sqlite
                                        :pool pool
                                        :path path
                                        :mode "c"})]
        (common-sqlite/create-kvs-table! db)
        {:db db
         :pool pool
         :path path}))
    (fail-fast :db-sync/missing-field {:field :sqlite})))

(defn <create-temp-sqlite-conn
  [schema datoms]
  (p/let [{:keys [db path pool]} (<create-temp-sqlite-db!)
          storage (new-temp-sqlite-storage db)
          conn (d/conn-from-datoms datoms schema {:storage storage})]
    {:db db
     :conn conn
     :pool pool
     :path path}))

(defn cleanup-temp-sqlite!
  [{:keys [db conn pool]}]
  (when conn
    (reset! conn nil))
  (when db
    (.close db))
  (when pool
    (platform/remove-storage-pool! (platform/current) pool)))
