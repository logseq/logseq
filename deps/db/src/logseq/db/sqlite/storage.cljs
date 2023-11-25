(ns logseq.db.sqlite.storage
  (:require [datascript.storage :refer [IStorage]]
            [logseq.db.sqlite.db :as sqlite-db]
            [cognitect.transit :as t]
            [cljs-bean.core :as bean]
            [cljs.cache :as cache]))

(defn- write-transit [data]
  (t/write (t/writer :json) data))

(defn- read-transit [s]
  (t/read (t/reader :json) s))

(defn sqlite-storage
  [repo {:keys [threshold]
         :or {threshold 4096}}]
  (let [cache (cache/lru-cache-factory {} :threshold threshold)]
    (reify IStorage
      (-store [_ addr+data-seq]
        (prn :debug :store {:addr-data addr+data-seq})
        (let [data (map
                    (fn [[addr data]]
                      {:addr addr
                       :content (write-transit data)})
                    addr+data-seq)]
          (sqlite-db/upsert-addr-content! repo (bean/->js data))))
      (-restore [_ addr]
        (when-let [content (if (cache/has? cache addr)
                             (do
                               (cache/hit cache addr)
                               (cache/lookup cache addr))
                             (when-let [result (sqlite-db/restore-data-from-addr repo addr)]
                               (cache/miss cache addr result)
                               result))]
          (prn {:content content})
          (read-transit content))))))

(comment
  (require '[datascript.core :as d])
  (def repo "my-test")
  ;; create new db
  (electron.db/new-db! repo)

  (def storage (sqlite-storage repo {}))
  (def conn (or (d/restore-conn storage)
                (d/create-conn nil {:storage storage})))

  (d/transact! conn [{:db/id 10
                      :data 1}])

  (prn "Entity 10 data: " (:data (d/entity @conn 10))))
