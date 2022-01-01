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
  Object
  (reset-value! [_ new graph]
    (reset! *value (assoc-in @*value [graph :value] new)))

  ILoad
  (-load [_]
    (let [repo (state/get-current-repo)]
      (p/let [content (fs/read-file
                       (config/get-repo-dir (state/get-current-repo))
                       (load-path location))]
        (when-let [content (and (some? content)
                                (try (cljs.reader/read-string content)
                                     (catch js/Error e
                                       (println (util/format "load persist-var failed: %s"  (load-path location)))
                                       (js/console.dir e))))]
          (swap! *value (fn [o]
                          (-> o
                              (assoc-in [repo :loaded?] true)
                              (assoc-in [repo :value] content))))))))

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
  (-reset!                              ;    Deprecated - use (.reset-value! o) instead.
    [o new-value]
    (swap! *value (fn [o] (assoc-in @*value [(state/get-current-repo) :value] new-value))))


  IPrintWithWriter
  (-pr-writer [o w opts]
    (write-all w (str "#PersistVar[" @*value ", loc: " location "]"))))


(def *all-persist-vars (atom []))

(defn load-vars []
  (doseq [var @*all-persist-vars]
    (-load var)))

(defn persist-var
  "This var is stored at logseq/LOCATION.edn"
  [init-value location]
  (let [var (->PersistVar (atom {(state/get-current-repo)
                                 {:value init-value
                                  :loaded? false}})
                          location)]
    (swap! *all-persist-vars conj var)
    var))

(defn persist-save [v]
  {:pre [(satisfies? ISave v)]}
  (-save v))

(comment
  (do
    (def bbb (persist-var 1 "aaa"))
    (-save bbb)

    ))
