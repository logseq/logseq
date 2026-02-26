(ns frontend.persist-db
  "Backend of DB based graph"
  (:require [frontend.db :as db]
            [frontend.persist-db.browser :as browser]
            [frontend.persist-db.protocol :as protocol]
            [frontend.state :as state]
            [frontend.util :as util]
            [promesa.core :as p]))

(defonce opfs-db (browser/->InBrowser))

(defn- get-impl
  "Get the actual implementation of PersistentDB"
  []
  opfs-db)

(defn <list-db []
  (protocol/<list-db (get-impl)))

(defn <unsafe-delete [repo]
  (when repo (protocol/<unsafe-delete (get-impl) repo)))

(defn <export-db
  [repo opts]
  (when repo (protocol/<export-db (get-impl) repo opts)))

(defn <import-db
  [repo data]
  (when repo (protocol/<import-db (get-impl) repo data)))

(defn <fetch-init-data
  ([repo]
   (<fetch-init-data repo {}))
  ([repo opts]
   (when repo (protocol/<fetch-initial-data (get-impl) repo opts))))

;; FIXME: limit repo name's length and sanity
;; @shuyu Do we still need this?
(defn <new [repo opts]
  {:pre [(<= (count repo) 128)]}
  (p/let [_ (protocol/<new (get-impl) repo opts)]
    (<export-db repo {})))

;; repo->max-tx
(defonce *last-synced-graph->tx (atom {}))

(defn- graph-has-changed?
  [repo]
  (let [tx (@*last-synced-graph->tx repo)
        db (db/get-db repo)]
    (or (nil? tx)
        (> (:max-tx db) tx))))

(defn export-current-graph!
  [& {:keys [succ-notification? force-save?]}]
  (when (util/electron?)
    (when-let [repo (state/get-current-repo)]
      (when (or force-save? 
                (and (graph-has-changed? repo)
                     (state/input-idle? repo :diff 5000)))
        (println :debug :save-db-to-disk repo)
        (->
         (p/do!
          (<export-db repo {})
          (swap! *last-synced-graph->tx assoc repo (:max-tx (db/get-db repo)))
          (when succ-notification?
            (state/pub-event!
             [:notification/show {:content "The current db has been saved successfully to the disk."
                                  :status :success}])))
         (p/catch (fn [^js error]
                    (js/console.error error)
                    (state/pub-event!
                     [:notification/show {:content (str (.getMessage error))
                                          :status :error
                                          :clear? false}]))))))))

(defn run-export-periodically!
  []
  (js/setInterval export-current-graph!
                  ;; every 30 seconds
                  (* 30 1000)))
