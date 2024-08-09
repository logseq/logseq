(ns frontend.persist-db
  "Backend of DB based graph"
  (:require [frontend.persist-db.browser :as browser]
            [frontend.persist-db.protocol :as protocol]
            [promesa.core :as p]
            [frontend.state :as state]
            [frontend.config :as config]
            [frontend.util :as util]))

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

(defn export-current-graph!
  [& {:keys [succ-notification?]}]
  (when (util/electron?)
    (when-let [repo (state/get-current-repo)]
      (when (config/db-based-graph? repo)
        (println :debug :save-db-to-disk repo)
        (->
         (p/do!
          (<export-db repo {})
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
                  ;; every 3 minutes
                  (* 3 60 1000)))
