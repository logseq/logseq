(ns frontend.util.persist-var
  (:require [frontend.config :as config]
            [frontend.state :as state]
            [frontend.fs :as fs]
            [frontend.util :as util]
            [cljs.reader :as reader]
            [promesa.core :as p]))


(defn- load-path [location]
  (config/get-file-path (state/get-current-repo) (str config/app-name "/" location ".edn")))

(defprotocol ILoad
  (-load [this]))

(defprotocol ISave
  (-save [this]))

(deftype PersistVar [*value location]
  ILoad
  (-load [_]
    (state/add-watch-state (keyword (str "persist-var/" location))
                           (fn [_k _r _o n]
                             (let [repo (state/get-current-repo)]
                               (when (and
                                      (not (get-in @*value [repo :loaded?]))
                                      (get-in n [:nfs/user-granted? repo]))
                                 (p/let [content (fs/read-file
                                                  (config/get-repo-dir (state/get-current-repo))
                                                  (load-path location))]
                                   (when-let [content (and (some? content)
                                                           (try (reader/read-string content)
                                                                (catch js/Error e
                                                                  (println (util/format "load persist-var failed: %s"  (load-path location)))
                                                                  (js/console.dir e))))]
                                     (swap! *value (fn [o]
                                                     (-> o
                                                         (assoc-in [repo :loaded?] true)
                                                         (assoc-in [repo :value] content)))))))))))

  ISave
  (-save [_]
    (let [path (load-path location)
          repo (state/get-current-repo)
          content (str (get-in @*value [repo :value]))
          dir (config/get-repo-dir repo)]
      (fs/write-file! repo dir path content nil)))

  IDeref
  (-deref [_this]
    (get-in @*value [(state/get-current-repo) :value]))

  IReset
  (-reset! [_o new-value]
    (swap! *value (fn [_o] (assoc-in @*value [(state/get-current-repo) :value] new-value)))))

(defn persist-var
  "This var is stored at logseq/LOCATION.edn"
  [init-value location]
  (let [var (->PersistVar (atom {(state/get-current-repo)
                                 {:value init-value
                                  :loaded? false}})
                          location)]
    (-load var)
    var))

(defn persist-save [v]
  {:pre [(satisfies? ISave v)]}
  (-save v))

(comment
  (do
    (def bbb (persist-var 1 "aaa"))
    (-save bbb)

    ))
